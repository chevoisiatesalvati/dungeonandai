import { useEffect, useState } from "react";
import { AccountId } from "@hashgraph/sdk";
import { useAccount } from "wagmi";
import { MirrorNodeClient } from "~~/services/hedera/mirrorNodeClient";

export interface PlayerAsset {
  id: string;
  name: string;
  type: "weapon" | "armor" | "consumable" | "quest" | "currency";
  rarity: "common" | "uncommon" | "rare" | "epic" | "legendary";
  image: string;
  description: string;
  tokenId: string;
}

// Helper function to convert IPFS URLs to HTTP URLs
function convertIpfsToHttp(url: string): string {
  if (url.startsWith("ipfs://")) {
    return url.replace("ipfs://", "https://ipfs.io/ipfs/");
  }
  return url;
}

export function usePlayerAssets() {
  const { address } = useAccount();
  const [assets, setAssets] = useState<PlayerAsset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchAssets() {
      if (!address) {
        setAssets([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Convert Ethereum address to Hedera AccountId
        const accountId = AccountId.fromString(address);

        const mirrorNode = new MirrorNodeClient("testnet"); // or "mainnet" based on your network

        // Get NFT info with full metadata
        const nftInfos = await mirrorNode.getNftInfo(accountId);

        // Transform NFT info to PlayerAsset format
        const nftAssets = await Promise.all(
          nftInfos.map(async nft => {
            try {
              // Validate NFT data structure
              if (!nft.token_id || !nft.serial_number) {
                console.warn("Invalid NFT data structure:", nft);
                return null;
              }

              if (!nft.metadata) {
                console.warn("No metadata found for NFT:", nft.token_id, nft.serial_number);
                return null;
              }

              // Decode base64 metadata
              let decodedMetadata;
              try {
                decodedMetadata = atob(nft.metadata);
              } catch (err) {
                console.warn("Failed to decode base64 metadata:", {
                  tokenId: nft.token_id,
                  serialNumber: nft.serial_number,
                  error: err,
                });
                return null;
              }

              let metadata;
              try {
                if (decodedMetadata.startsWith("ipfs://")) {
                  // Convert IPFS URL to HTTP URL
                  const ipfsUrl = decodedMetadata.replace("ipfs://", "https://ipfs.io/ipfs/");

                  const response = await fetch(ipfsUrl);
                  if (!response.ok) {
                    throw new Error(`Failed to fetch IPFS metadata: ${response.statusText}`);
                  }
                  metadata = await response.json();
                } else {
                  // Try to parse as JSON directly
                  metadata = JSON.parse(decodedMetadata);
                }
              } catch (err) {
                console.warn("Failed to parse metadata:", {
                  tokenId: nft.token_id,
                  serialNumber: nft.serial_number,
                  error: err,
                  decodedMetadata,
                });
                return null;
              }

              // Validate required fields
              if (!metadata || typeof metadata !== "object") {
                console.warn("Invalid metadata format:", metadata);
                return null;
              }

              if (
                !metadata.name ||
                !metadata.attributes?.type ||
                !metadata.attributes?.rarity ||
                !metadata.image ||
                !metadata.description
              ) {
                console.warn("Missing required metadata fields:", {
                  tokenId: nft.token_id,
                  serialNumber: nft.serial_number,
                  metadata,
                });
                return null;
              }

              // Validate type and rarity values
              const validTypes = ["weapon", "armor", "consumable", "quest", "currency"];
              const validRarities = ["common", "uncommon", "rare", "epic", "legendary"];

              if (!validTypes.includes(metadata.attributes.type)) {
                console.warn("Invalid type in metadata:", {
                  tokenId: nft.token_id,
                  serialNumber: nft.serial_number,
                  type: metadata.attributes.type,
                });
                return null;
              }

              if (!validRarities.includes(metadata.attributes.rarity)) {
                console.warn("Invalid rarity in metadata:", {
                  tokenId: nft.token_id,
                  serialNumber: nft.serial_number,
                  rarity: metadata.attributes.rarity,
                });
                return null;
              }

              return {
                id: `${nft.token_id}-${nft.serial_number}`,
                name: metadata.name,
                type: metadata.attributes.type,
                rarity: metadata.attributes.rarity,
                image: convertIpfsToHttp(metadata.image),
                description: metadata.description,
                tokenId: nft.token_id,
              } as PlayerAsset;
            } catch (err) {
              console.error("Error processing NFT:", {
                tokenId: nft.token_id,
                serialNumber: nft.serial_number,
                error: err instanceof Error ? err.message : String(err),
                metadata: nft.metadata,
              });
              return null;
            }
          }),
        );

        const validAssets = nftAssets.filter((asset): asset is PlayerAsset => asset !== null);
        setAssets(validAssets);
      } catch (err) {
        console.error("Error fetching player assets:", err);
        setError("Failed to fetch player assets. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchAssets();
  }, [address]);

  return { assets, isLoading, error };
}
