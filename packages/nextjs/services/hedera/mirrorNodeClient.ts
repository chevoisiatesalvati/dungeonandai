import { AccountId } from "@hashgraph/sdk";

export interface MirrorNodeNftInfo {
  token_id: string;
  serial_number: number;
  metadata: string; // Base64 encoded metadata
}

export interface MirrorNodeNftMetadata {
  token_id: string;
  serial_number: number;
  metadata: string;
  account_id: string;
  created_timestamp: string;
  spender: string | null;
}

export interface MirrorNodeTokenInfo {
  type: "FUNGIBLE_COMMON" | "NON_FUNGIBLE_UNIQUE";
  decimals: string;
  name: string;
  symbol: string;
  token_id: string;
}

export interface MirrorNodeAccountTokenBalance {
  balance: number;
  token_id: string;
}

export interface MirrorNodeAccountTokenBalanceWithInfo extends MirrorNodeAccountTokenBalance {
  info: MirrorNodeTokenInfo;
  nftSerialNumbers?: number[];
  metadata?: string; // Base64 encoded metadata
}

export class MirrorNodeClient {
  private url: string;

  constructor(network: "testnet" | "mainnet") {
    this.url =
      network === "testnet" ? "https://testnet.mirrornode.hedera.com" : "https://mainnet.mirrornode.hedera.com";
  }

  // Get specific NFT metadata
  async getNftMetadata(tokenId: string, serialNumber: number): Promise<MirrorNodeNftMetadata> {
    const response = await fetch(`${this.url}/api/v1/tokens/${tokenId}/nfts/${serialNumber}`, {
      method: "GET",
    });
    return await response.json();
  }

  // Get NFT info for an account with full metadata
  async getNftInfo(accountId: AccountId): Promise<MirrorNodeNftInfo[]> {
    // First get the list of NFTs owned by the account
    const nftInfo = await fetch(`${this.url}/api/v1/accounts/${accountId.toString()}/nfts`, {
      method: "GET",
    });
    const nftInfoJson = await nftInfo.json();

    if (!nftInfoJson.nfts) {
      console.warn("No NFTs found for account:", accountId.toString());
      return [];
    }

    const nftInfos = [...nftInfoJson.nfts] as MirrorNodeNftInfo[];

    // Handle pagination
    let nextLink = nftInfoJson.links?.next;
    while (nextLink !== null) {
      const nextNftInfo = await fetch(`${this.url}${nextLink}`, { method: "GET" });
      const nextNftInfoJson = await nextNftInfo.json();
      nftInfos.push(...nextNftInfoJson.nfts);
      nextLink = nextNftInfoJson.links?.next;
    }

    // Fetch full metadata for each NFT
    const nftInfosWithMetadata = await Promise.all(
      nftInfos.map(async nft => {
        try {
          const metadata = await this.getNftMetadata(nft.token_id, nft.serial_number);
          return {
            ...nft,
            metadata: metadata.metadata,
          };
        } catch (error) {
          console.error(`Error fetching metadata for NFT ${nft.token_id}-${nft.serial_number}:`, error);
          return nft;
        }
      }),
    );

    return nftInfosWithMetadata;
  }

  // Get token info
  async getTokenInfo(tokenId: string): Promise<MirrorNodeTokenInfo> {
    const tokenInfo = await fetch(`${this.url}/api/v1/tokens/${tokenId}`, {
      method: "GET",
    });
    return await tokenInfo.json();
  }

  // Get token balances for an account
  async getAccountTokenBalances(accountId: AccountId): Promise<MirrorNodeAccountTokenBalance[]> {
    const tokenBalanceInfo = await fetch(`${this.url}/api/v1/accounts/${accountId.toString()}/tokens`, {
      method: "GET",
    });
    const tokenBalanceInfoJson = await tokenBalanceInfo.json();

    if (!tokenBalanceInfoJson.tokens) {
      console.warn("No tokens found for account:", accountId.toString());
      return [];
    }

    const tokenBalances = [...tokenBalanceInfoJson.tokens] as MirrorNodeAccountTokenBalance[];

    // Handle pagination
    let nextLink = tokenBalanceInfoJson.links?.next;
    while (nextLink !== null) {
      const nextTokenBalanceInfo = await fetch(`${this.url}${nextLink}`, { method: "GET" });
      const nextTokenBalanceInfoJson = await nextTokenBalanceInfo.json();
      tokenBalances.push(...nextTokenBalanceInfoJson.tokens);
      nextLink = nextTokenBalanceInfoJson.links?.next;
    }

    return tokenBalances;
  }

  // Get combined token balances with info
  async getAccountTokenBalancesWithTokenInfo(accountId: AccountId): Promise<MirrorNodeAccountTokenBalanceWithInfo[]> {
    // Get all token balances
    const tokens = await this.getAccountTokenBalances(accountId);

    // Create a map of token IDs to token info
    const tokenInfos = new Map<string, MirrorNodeTokenInfo>();
    for (const token of tokens) {
      const tokenInfo = await this.getTokenInfo(token.token_id);
      tokenInfos.set(tokenInfo.token_id, tokenInfo);
    }

    // Get all NFT info
    const nftInfos = await this.getNftInfo(accountId);

    // Create a map of token IDs to arrays of serial numbers and metadata
    const tokenIdToSerialNumbers = new Map<string, number[]>();
    const tokenIdToMetadata = new Map<string, string>();
    for (const nftInfo of nftInfos) {
      const tokenId = nftInfo.token_id;
      const serialNumber = nftInfo.serial_number;
      const metadata = nftInfo.metadata;

      if (!tokenIdToSerialNumbers.has(tokenId)) {
        tokenIdToSerialNumbers.set(tokenId, [serialNumber]);
        tokenIdToMetadata.set(tokenId, metadata);
      } else {
        tokenIdToSerialNumbers.get(tokenId)!.push(serialNumber);
      }
    }

    // Combine all information
    return tokens.map(token => ({
      ...token,
      info: tokenInfos.get(token.token_id)!,
      nftSerialNumbers: tokenIdToSerialNumbers.get(token.token_id),
      metadata: tokenIdToMetadata.get(token.token_id),
    }));
  }
}
