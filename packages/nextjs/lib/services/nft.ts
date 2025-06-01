import { IPFSService } from "./ipfs";
import {
  AccountBalanceQuery,
  Client,
  Long,
  PrivateKey,
  TokenBurnTransaction,
  TokenCreateTransaction,
  TokenId,
  TokenInfoQuery,
  TokenMintTransaction,
  TokenSupplyType,
  TokenType,
  TransferTransaction,
} from "@hashgraph/sdk";
import fs from "fs";
import path from "path";

// Define item types and their metadata
export interface ItemMetadata {
  n: string; // name
  d: string; // description
  i: string; // image
  a: {
    // attributes
    t: string; // type
    r: string; // rarity
    s?: {
      // stats
      d?: number; // damage
      sp?: number; // speed
      du?: number; // durability
      [key: string]: any;
    };
    p?: {
      // properties
      m?: string; // material
      w?: string; // weight
      l?: string; // length
      [key: string]: any;
    };
    sa?: Array<{
      // special_abilities
      n: string; // name
      d: string; // description
    }>;
    [key: string]: any;
  };
  c: string; // category
  sc?: string; // subcategory
  l?: number; // level_requirement
  cr?: {
    // crafting_requirements
    m: Array<{
      // materials
      n: string; // name
      q: number; // quantity
    }>;
    sr?: {
      // skill_requirement
      n: string; // name
      l: number; // level
    };
  };
}

export const ITEM_TYPES = {
  SHADOW_BLADE: {
    name: "Shadow Blade",
    symbol: "SBLADE",
    metadata: {
      n: "Shadow Blade",
      d: "A finely crafted dagger with an obsidian blade. Its dark surface seems to absorb light, making it perfect for stealth operations.",
      i: "ipfs://bafybeidzjfm2rdcpeygubqdg74rmsdlu2a6ocyplxks2mnkubhyxqggflq",
      a: {
        t: "weapon",
        r: "rare",
        s: {
          d: 15,
          sp: 20,
          du: 100,
        },
        p: {
          m: "obsidian",
          w: "0.5 kg",
          l: "30 cm",
        },
        sa: [
          {
            n: "Shadow Strike",
            d: "Increases critical hit chance by 15% in low light conditions",
          },
        ],
      },
      c: "weapon",
      sc: "dagger",
      l: 5,
      cr: {
        m: [
          {
            n: "Obsidian Shard",
            q: 3,
          },
          {
            n: "Steel Handle",
            q: 1,
          },
        ],
        sr: {
          n: "Blacksmithing",
          l: 3,
        },
      },
    },
  },
  LEGENDARY_DAGGER: {
    name: "Legendary Dagger",
    symbol: "LDAGGER",
    metadata: {
      n: "Legendary Dagger",
      d: "A legendary dagger crafted with valyrian steel.",
      i: "ipfs://bafybeiabs3bic3ofgvocicf7vg32a6bwwi7l4khal4qs7jbpimpiyja7uy",
      a: {
        t: "weapon",
        r: "legendary",
        s: {
          d: 35,
          sp: 30,
          du: 100,
        },
        p: {
          m: "valyrian",
          w: "0.4 kg",
          l: "35 cm",
        },
        sa: [
          {
            n: "Night King Fatal Blow",
            d: "Increases critical hit chance by 150% in low light conditions",
          },
        ],
      },
      c: "weapon",
      sc: "dagger",
      l: 15,
      cr: {
        m: [
          {
            n: "Valyrian steel",
            q: 40,
          },
          {
            n: "Lether",
            q: 15,
          },
        ],
        sr: {
          n: "Blacksmithing",
          l: 20,
        },
      },
    },
  },
  TAVERN_BEER: {
    name: "Tavern Beer",
    symbol: "BEER",
    metadata: {
      n: "Tavern Beer",
      d: "A frothy mug of the tavern's finest ale. The rich, golden liquid is topped with a thick, creamy head that releases a delightful aroma of hops and malt.",
      i: "ipfs://bafybeidzjfm2rdcpeygubqdg74rmsdlu2a6ocyplxks2mnkubhyxqggflq",
      a: {
        t: "consumable",
        r: "common",
        s: {
          hr: 20, // health_restore
          er: 30, // energy_restore
          in: 5, // intoxication
        },
        p: {
          m: "liquid",
          v: "500 ml", // volume
          t: "chilled", // temperature
        },
        e: [
          // effects
          {
            n: "Refreshment",
            d: "Restores health and energy",
          },
          {
            n: "Social Boost",
            d: "Increases charisma by 5 for 10 minutes",
          },
        ],
      },
      c: "consumable",
      sc: "beverage",
      l: 1,
      cr: {
        m: [
          {
            n: "Hops",
            q: 2,
          },
          {
            n: "Malt",
            q: 3,
          },
          {
            n: "Water",
            q: 1,
          },
        ],
        sr: {
          n: "Brewing",
          l: 1,
        },
      },
    },
  },
};

export class NFTService {
  private client: Client;
  private operatorId: string;
  private operatorKey: PrivateKey;
  private collections: Map<string, string> = new Map();
  private ipfsService: IPFSService;

  constructor() {
    if (!process.env.ACCOUNT_ID || !process.env.HEDERA_PRIVATE_KEY) {
      throw new Error("Missing required environment variables: ACCOUNT_ID or HEDERA_PRIVATE_KEY");
    }

    this.operatorId = process.env.ACCOUNT_ID;
    this.operatorKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY.replace("0x", ""));

    this.client = Client.forTestnet();
    this.client.setOperator(this.operatorId, this.operatorKey);
    this.ipfsService = new IPFSService();
  }

  // Initialize collections when the server starts
  async initializeCollections(): Promise<void> {
    console.log("Initializing NFT collections...");

    for (const [itemType, itemConfig] of Object.entries(ITEM_TYPES)) {
      try {
        const tokenId = await this.createCollection(itemConfig.name, itemConfig.symbol);
        this.collections.set(itemType, tokenId);
        console.log(`Created collection for ${itemType}: ${tokenId}`);
      } catch (error) {
        console.error(`Failed to create collection for ${itemType}:`, error);
      }
    }
  }

  async createCollection(name: string, symbol: string): Promise<string> {
    console.log("Creating NFT Collection:", name);

    const tokenCreateTx = await new TokenCreateTransaction()
      .setTokenName(name)
      .setTokenSymbol(symbol)
      .setTokenType(TokenType.NonFungibleUnique)
      .setInitialSupply(0)
      .setTreasuryAccountId(this.operatorId)
      .setSupplyType(TokenSupplyType.Infinite)
      .setSupplyKey(this.operatorKey)
      .setFreezeKey(this.operatorKey)
      .setPauseKey(this.operatorKey)
      .setAdminKey(this.operatorKey)
      .setWipeKey(this.operatorKey)
      .freezeWith(this.client);

    const tokenCreateSign = await tokenCreateTx.sign(this.operatorKey);
    const tokenCreateSubmit = await tokenCreateSign.execute(this.client);
    const tokenCreateRx = await tokenCreateSubmit.getReceipt(this.client);
    const tokenId = tokenCreateRx.tokenId;

    console.log(`Created collection with ID: ${tokenId}`);
    return tokenId?.toString() || "";
  }

  async mintAndTransferItem(itemType: string, recipientId: string): Promise<{ serial: number; tokenId: string }> {
    const itemConfig = ITEM_TYPES[itemType as keyof typeof ITEM_TYPES];
    if (!itemConfig) {
      throw new Error(`Unknown item type: ${itemType}`);
    }

    // Get or create collection
    let tokenId = this.collections.get(itemType);
    if (!tokenId) {
      tokenId = await this.createCollection(itemConfig.name, itemConfig.symbol);
      this.collections.set(itemType, tokenId);
    }

    let metadataCid: string;

    // Handle beer NFT specifically
    if (itemType === "TAVERN_BEER") {
      // Read the beer image from public folder
      const imagePath = path.join(process.cwd(), "public", "beer.webp");
      const imageBuffer = await fs.promises.readFile(imagePath);
      const imageBlob = new Blob([imageBuffer], { type: "image/webp" });
      const imageFile = new File([imageBlob], "beer.webp", { type: "image/webp" });

      // Upload image first to get the CID
      const imageCid = await this.ipfsService.uploadImage(imageFile);

      // Upload metadata to IPFS
      metadataCid = await this.ipfsService.uploadMetadata({
        name: itemConfig.metadata.n,
        description: itemConfig.metadata.d,
        image: imageCid,
        attributes: {
          type: itemConfig.metadata.a.t,
          rarity: itemConfig.metadata.a.r,
          stats: itemConfig.metadata.a.s,
          properties: itemConfig.metadata.a.p,
          effects: (itemConfig.metadata.a as any).e || [],
        },
        category: itemConfig.metadata.c,
        subcategory: itemConfig.metadata.sc,
        level_requirement: itemConfig.metadata.l,
        crafting_requirements: {
          materials: itemConfig.metadata.cr.m.map(m => ({
            name: m.n,
            quantity: m.q,
          })),
          skill_requirement: itemConfig.metadata.cr.sr
            ? {
                name: itemConfig.metadata.cr.sr.n,
                level: itemConfig.metadata.cr.sr.l,
              }
            : undefined,
        },
      });
    } else {
      // For other items, just use the existing metadata
      metadataCid = await this.ipfsService.uploadMetadata({
        name: itemConfig.metadata.n,
        description: itemConfig.metadata.d,
        image: itemConfig.metadata.i,
        attributes: {
          type: itemConfig.metadata.a.t,
          rarity: itemConfig.metadata.a.r,
          stats: itemConfig.metadata.a.s,
          properties: itemConfig.metadata.a.p,
          special_abilities: (itemConfig.metadata.a as any).sa || [],
        },
        category: itemConfig.metadata.c,
        subcategory: itemConfig.metadata.sc,
        level_requirement: itemConfig.metadata.l,
        crafting_requirements: {
          materials: itemConfig.metadata.cr.m.map(m => ({
            name: m.n,
            quantity: m.q,
          })),
          skill_requirement: itemConfig.metadata.cr.sr
            ? {
                name: itemConfig.metadata.cr.sr.n,
                level: itemConfig.metadata.cr.sr.l,
              }
            : undefined,
        },
      });
    }

    // Create minimal metadata for minting (only essential fields)
    const minimalMetadata = {
      m: metadataCid, // metadata CID only
    };

    const minimalMetadataStr = JSON.stringify(minimalMetadata);

    // Ensure metadata is within Hedera's limits (100 bytes)
    if (Buffer.from(minimalMetadataStr).length > 100) {
      throw new Error("Metadata too long. Must be less than 100 bytes.");
    }

    // Mint the NFT with compressed metadata
    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(minimalMetadataStr)])
      .execute(this.client);

    const mintRx = await mintTx.getReceipt(this.client);
    const serial = mintRx.serials[0].toNumber();

    // Transfer to recipient
    // await this.transferNFT(tokenId, serial, recipientId); // Commented out for demo purposes

    return { serial, tokenId };
  }

  async mintNFT(tokenId: string, metadata: string): Promise<number> {
    console.log("Minting NFT to collection:", tokenId);

    // Parse the full metadata
    const fullMetadata = JSON.parse(metadata);

    // Upload metadata to IPFS
    const metadataCid = await this.ipfsService.uploadMetadata(fullMetadata);

    // Create minimal metadata for minting (only essential fields)
    const minimalMetadata = {
      m: metadataCid, // metadata CID only
    };

    const minimalMetadataStr = JSON.stringify(minimalMetadata);

    // Ensure metadata is within Hedera's limits (100 bytes)
    if (Buffer.from(minimalMetadataStr).length > 100) {
      throw new Error("Metadata too long. Must be less than 100 bytes.");
    }

    const mintTx = await new TokenMintTransaction()
      .setTokenId(tokenId)
      .setMetadata([Buffer.from(minimalMetadataStr)])
      .execute(this.client);

    const mintRx = await mintTx.getReceipt(this.client);
    const serial = mintRx.serials[0].toNumber();
    console.log(`Minted NFT with serial: ${serial}`);

    return serial;
  }

  async transferNFT(tokenId: string, serial: number, recipientId: string): Promise<boolean> {
    console.log(`Transferring NFT ${tokenId} serial ${serial} to ${recipientId}`);

    const transferTx = await new TransferTransaction()
      .addNftTransfer(tokenId, serial, this.operatorId, recipientId)
      .execute(this.client);

    const receipt = await transferTx.getReceipt(this.client);
    console.log("Transfer status:", receipt.status.toString());

    return receipt.status.toString() === "SUCCESS";
  }

  async burnNFT(tokenId: string, serial: number): Promise<boolean> {
    console.log("Burning NFT:", tokenId, "Serial:", serial);

    const txResponse = await new TokenBurnTransaction().setTokenId(tokenId).setSerials([serial]).execute(this.client);

    const receipt = await txResponse.getReceipt(this.client);
    console.log("Burn status:", receipt.status.toString());

    return receipt.status.toString() === "SUCCESS";
  }

  async getTokenInfo(tokenId: string) {
    console.log("Querying token info:", tokenId);

    const query = new TokenInfoQuery().setTokenId(tokenId);
    const tokenInfo = await query.execute(this.client);

    return {
      name: tokenInfo.name,
      symbol: tokenInfo.symbol,
      totalSupply: tokenInfo.totalSupply.toString(),
      treasuryAccount: tokenInfo.treasuryAccountId?.toString(),
    };
  }

  async getAccountBalance(accountId: string) {
    console.log("Querying account balance:", accountId);

    const balanceQuery = new AccountBalanceQuery().setAccountId(accountId);
    const accountBalance = await balanceQuery.execute(this.client);

    return {
      balance: accountBalance.hbars.toString(),
      tokens: accountBalance.tokens?.toString() || "0",
    };
  }
}
