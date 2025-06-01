import { NextResponse } from "next/server";
import { ITEM_TYPES, NFTService } from "~~/lib/services/nft";

// Validate environment variables
const requiredEnvVars = {
  ACCOUNT_ID: process.env.ACCOUNT_ID,
  HEDERA_PRIVATE_KEY: process.env.HEDERA_PRIVATE_KEY,
};

// Check if any required variables are missing
const missingVars = Object.entries(requiredEnvVars)
  .filter(([_, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.error("Missing environment variables:", missingVars);
}

let nftService: NFTService | null = null;

try {
  nftService = new NFTService();
  // Initialize collections when the server starts
  nftService.initializeCollections().catch(console.error);
} catch (error) {
  console.error("Failed to initialize NFTService:", error);
}

// Collection IDs for different item types
const COLLECTIONS = {
  DAGGER: "0.0.6092934", // Example collection ID for daggers
  SWORD: "0.0.6092935", // Example collection ID for swords
  ARMOR: "0.0.6092936", // Example collection ID for armor
};

// Metadata templates for different items
const METADATA = {
  DAGGER: "ipfs://bafkreibirmhogrkhblrmyefyxurmntgy4zzng2juxaffkjkxgtdddap52y",
  SWORD: "ipfs://bafkreibirmhogrkhblrmyefyxurmntgy4zzng2juxaffkjkxgtdddap52y",
  ARMOR: "ipfs://bafkreibirmhogrkhblrmyefyxurmntgy4zzng2juxaffkjkxgtdddap52y",
};

export async function POST(request: Request) {
  try {
    if (!nftService) {
      return NextResponse.json(
        {
          error: "NFT service is not initialized",
          details: "Please check your environment variables: ACCOUNT_ID and HEDERA_PRIVATE_KEY",
        },
        { status: 500 },
      );
    }

    const { message, locationId, playerId } = await request.json();
    const lowerMessage = message.toLowerCase();

    // Get player's Hedera account ID from the database or configuration
    // For now, we'll use a placeholder - you'll need to implement the actual lookup
    const playerHederaId = process.env.PLAYER_HEDERA_ID || "0.0.1234567"; // Replace with actual lookup

    if (!playerHederaId) {
      return NextResponse.json({
        content: "Error: Player's Hedera account ID not found. Please set up your account first.",
        shouldRespond: true,
        type: "error",
      });
    }

    // Handle different item operations based on the message
    if (lowerMessage.includes("beer") || lowerMessage.includes("drink")) {
      try {
        const result = await nftService.mintAndTransferItem("TAVERN_BEER", playerHederaId);
        const item = ITEM_TYPES.TAVERN_BEER;
        return NextResponse.json({
          content: `You received a ${item.metadata.n}! ${item.metadata.d}\nEffects: ${item.metadata.a.e.map(e => e.n).join(", ")}\nNFT ID: ${result.tokenId}, Serial: ${result.serial}`,
          shouldRespond: true,
          type: "action",
          nftDetails: {
            tokenId: result.tokenId,
            serial: result.serial,
            itemType: "TAVERN_BEER",
          },
        });
      } catch (error) {
        console.error("Error minting beer:", error);
        return NextResponse.json({
          content: "Sorry, there was an error getting your beer. Please try again.",
          shouldRespond: true,
          type: "error",
        });
      }
    }

    if (lowerMessage.includes("shadow blade") || lowerMessage.includes("obsidian dagger")) {
      try {
        const result = await nftService.mintAndTransferItem("SHADOW_BLADE", playerHederaId);
        const item = ITEM_TYPES.SHADOW_BLADE;
        return NextResponse.json({
          content: `You received a ${item.metadata.n}! ${item.metadata.d}\nSpecial Ability: ${item.metadata.a.sa[0].n}\nNFT ID: ${result.tokenId}, Serial: ${result.serial}`,
          shouldRespond: true,
          type: "action",
          nftDetails: {
            tokenId: result.tokenId,
            serial: result.serial,
            itemType: "SHADOW_BLADE",
          },
        });
      } catch (error) {
        console.error("Error minting shadow blade:", error);
        return NextResponse.json({
          content: "Sorry, there was an error getting your shadow blade. Please try again.",
          shouldRespond: true,
          type: "error",
        });
      }
    }

    if (lowerMessage.includes("legendary dagger") || lowerMessage.includes("valyrian dagger")) {
      try {
        const result = await nftService.mintAndTransferItem("LEGENDARY_DAGGER", playerHederaId);
        const item = ITEM_TYPES.LEGENDARY_DAGGER;
        return NextResponse.json({
          content: `You received a ${item.metadata.n}! ${item.metadata.d}\nSpecial Ability: ${item.metadata.a.sa[0].n}\nNFT ID: ${result.tokenId}, Serial: ${result.serial}`,
          shouldRespond: true,
          type: "action",
          nftDetails: {
            tokenId: result.tokenId,
            serial: result.serial,
            itemType: "LEGENDARY_DAGGER",
          },
        });
      } catch (error) {
        console.error("Error minting legendary dagger:", error);
        return NextResponse.json({
          content: "Sorry, there was an error getting your legendary dagger. Please try again.",
          shouldRespond: true,
          type: "error",
        });
      }
    }

    if (lowerMessage.includes("burn") || lowerMessage.includes("destroy")) {
      // Extract serial number from message (this is a simple example)
      const serialMatch = message.match(/serial (\d+)/i);
      if (serialMatch) {
        const serial = parseInt(serialMatch[1]);
        let collectionId = "";

        // Determine which collection to burn from
        if (lowerMessage.includes("dagger")) {
          collectionId = COLLECTIONS.DAGGER;
        } else if (lowerMessage.includes("sword")) {
          collectionId = COLLECTIONS.SWORD;
        } else if (lowerMessage.includes("armor")) {
          collectionId = COLLECTIONS.ARMOR;
        }

        if (collectionId) {
          const success = await nftService.burnNFT(collectionId, serial);
          if (success) {
            return NextResponse.json({
              content: `Successfully destroyed the item with serial number ${serial}.`,
              shouldRespond: true,
              type: "action",
            });
          }
        }
      }
    }

    if (lowerMessage.includes("info") || lowerMessage.includes("check")) {
      let collectionId = "";
      if (lowerMessage.includes("dagger")) {
        collectionId = COLLECTIONS.DAGGER;
      } else if (lowerMessage.includes("sword")) {
        collectionId = COLLECTIONS.SWORD;
      } else if (lowerMessage.includes("armor")) {
        collectionId = COLLECTIONS.ARMOR;
      }

      if (collectionId) {
        const tokenInfo = await nftService.getTokenInfo(collectionId);
        return NextResponse.json({
          content: `Collection Info:\nName: ${tokenInfo.name}\nSymbol: ${tokenInfo.symbol}\nTotal Supply: ${tokenInfo.totalSupply}`,
          shouldRespond: true,
          type: "action",
        });
      }
    }

    // If no specific operation was matched, return a generic response
    return NextResponse.json({
      content:
        "I can help you with getting items like beer or weapons. What would you like?\nAvailable items:\n- Tavern Beer\n- Shadow Blade\n- Legendary Dagger",
      shouldRespond: true,
      type: "message",
    });
  } catch (error) {
    console.error("Blockchain API Error:", error);
    return NextResponse.json(
      {
        error: "Failed to process blockchain request",
        details: error instanceof Error ? error.message : "Unknown error",
        envVars: {
          hasAccountId: !!process.env.ACCOUNT_ID,
          hasPrivateKey: !!process.env.HEDERA_PRIVATE_KEY,
        },
      },
      { status: 500 },
    );
  }
}
