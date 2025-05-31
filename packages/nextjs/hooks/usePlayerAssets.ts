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
        console.log("Fetching NFTs for account:", accountId.toString());

        const mirrorNode = new MirrorNodeClient("testnet"); // or "mainnet" based on your network

        // Get NFT info with full metadata
        const nftInfos = await mirrorNode.getNftInfo(accountId);
        console.log("Raw NFT infos:", nftInfos);

        // Transform NFT info to PlayerAsset format
        const nftAssets = await Promise.all(
          nftInfos.map(async nft => {
            try {
              console.log("Processing NFT:", {
                tokenId: nft.token_id,
                serialNumber: nft.serial_number,
                metadata: nft.metadata,
                metadataType: typeof nft.metadata,
                metadataLength: nft.metadata?.length,
              });

              if (!nft.metadata) {
                console.warn("No metadata found for NFT:", nft.token_id, nft.serial_number);
                return null;
              }

              // Decode base64 metadata
              const decodedMetadata = atob(nft.metadata);
              console.log("Decoded metadata:", decodedMetadata);

              let metadata;
              if (decodedMetadata.startsWith("ipfs://")) {
                // Convert IPFS URL to HTTP URL
                const ipfsUrl = decodedMetadata.replace("ipfs://", "https://ipfs.io/ipfs/");
                console.log("Fetching metadata from IPFS:", ipfsUrl);

                const response = await fetch(ipfsUrl);
                metadata = await response.json();
                console.log("IPFS metadata:", metadata);
              } else {
                // Try to parse as JSON directly
                metadata = JSON.parse(decodedMetadata);
              }

              // Validate required fields
              if (
                !metadata.name ||
                !metadata.attributes?.type ||
                !metadata.attributes?.rarity ||
                !metadata.image ||
                !metadata.description
              ) {
                console.warn("Missing required metadata fields:", metadata);
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
                error: err,
                metadata: nft.metadata,
              });
              return null;
            }
          }),
        );

        const validAssets = nftAssets.filter((asset): asset is PlayerAsset => asset !== null);
        console.log("Processed assets:", validAssets);
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
