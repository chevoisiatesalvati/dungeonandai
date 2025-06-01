import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config();

export interface AgentContext {
  locationId: string;
  npcName?: string;
  playerName?: string;
  playerId?: string;
}

export interface AgentResponse {
  content: string;
  shouldRespond: boolean;
  type: "message" | "action";
}

export class LocationGameMaster {
  private llm: ChatOpenAI | null = null;

  constructor(private context: AgentContext) {}

  private async initializeLLM() {
    if (this.llm) return this.llm;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    this.llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.5,
      streaming: true,
    });

    return this.llm;
  }

  async processMessage(input: string): Promise<AgentResponse> {
    // Only respond to messages that require GM intervention
    const requiresGMIntervention = this.shouldGMRespond(input);
    if (!requiresGMIntervention) {
      return { content: "", shouldRespond: false, type: "message" };
    }

    const llm = await this.initializeLLM();
    const response = await llm.invoke([
      {
        role: "system",
        content: `You are the Game Master for ${this.context.locationId}. 
                 You only intervene when there are actions that require resolution or randomness.
                 Examples include:
                 - Combat between players
                 - Random events
                 - Skill checks
                 - Environmental challenges
                 
                 Your responses should be brief and focused on resolving the specific action.
                 Format your response in a clear, readable way.`,
      },
      {
        role: "user",
        content: input,
      },
    ]);

    let content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    content = content.replace(/<think>[\s\S]*?<\/think>/g, "");

    return {
      content,
      shouldRespond: true,
      type: "action",
    };
  }

  private shouldGMRespond(input: string): boolean {
    const gmTriggers = [
      "attack",
      "combat",
      "fight",
      "roll",
      "check",
      "challenge",
      "random",
      "chance",
      "luck",
      "dice",
      "skill",
      "save",
    ];

    const lowerInput = input.toLowerCase();
    return gmTriggers.some(trigger => lowerInput.includes(trigger));
  }
}

export class NPCAgent {
  private llm: ChatOpenAI | null = null;
  private locationContext: { [key: string]: string[] } = {
    tavern: [
      "beer",
      "ale",
      "wine",
      "food",
      "meal",
      "drink",
      "eat",
      "order",
      "menu",
      "price",
      "cost",
      "pay",
      "gold",
      "silver",
    ],
    blacksmith: ["weapon", "armor", "sword", "shield", "repair", "forge", "metal", "iron", "steel", "craft", "smith"],
    shop: ["buy", "sell", "trade", "item", "goods", "merchant", "price", "cost", "gold", "silver"],
    temple: ["heal", "cure", "pray", "bless", "divine", "holy", "sacred", "worship", "faith"],
    library: ["book", "read", "study", "learn", "knowledge", "scroll", "map", "research", "history"],
  };

  constructor(private context: AgentContext) {}

  private async initializeLLM() {
    if (this.llm) return this.llm;

    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not set in environment variables");
    }

    this.llm = new ChatOpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      modelName: "gpt-4o-mini",
      temperature: 0.5,
      streaming: true,
    });

    return this.llm;
  }

  async processMessage(input: string): Promise<AgentResponse> {
    // Only respond if the message is directed to this NPC
    if (!this.isMessageForNPC(input)) {
      return { content: "", shouldRespond: false, type: "message" };
    }

    const llm = await this.initializeLLM();
    const locationType = this.getLocationType(this.context.locationId);
    const locationKeywords = this.locationContext[locationType] || [];

    const response = await llm.invoke([
      {
        role: "system",
        content: `You are ${this.context.npcName}, an NPC in ${this.context.locationId}.
                 You are a ${this.getNPCRole(locationType)}.
                 
                 You should respond when:
                 - You are directly addressed
                 - The message is relevant to your character or location
                 - You have knowledge or information to share
                 - Someone asks about ${locationKeywords.join(", ")}
                 
                 Stay in character and respond appropriately to the context.
                 Format your response in a clear, readable way.
                 
                 If the message is about buying or trading items, include prices in gold/silver.
                 If the message is about services, describe what you can do and any costs involved.`,
      },
      {
        role: "user",
        content: input,
      },
    ]);

    let content = typeof response.content === "string" ? response.content : JSON.stringify(response.content);
    content = content.replace(/<think>[\s\S]*?<\/think>/g, "");

    return {
      content,
      shouldRespond: true,
      type: "message",
    };
  }

  private isMessageForNPC(input: string): boolean {
    if (!this.context.npcName) return false;

    const lowerInput = input.toLowerCase();
    const npcNameLower = this.context.npcName.toLowerCase();
    const locationType = this.getLocationType(this.context.locationId);
    const locationKeywords = this.locationContext[locationType] || [];

    // Check if NPC is directly addressed
    const directAddress =
      lowerInput.includes(npcNameLower) ||
      lowerInput.includes("hey") ||
      lowerInput.includes("hello") ||
      lowerInput.includes("hi") ||
      lowerInput.includes("excuse me") ||
      lowerInput.includes("pardon");

    // Check if the message is relevant to the NPC's context
    const relevantContext = this.isRelevantToNPC(input, locationKeywords);

    return directAddress || relevantContext;
  }

  private isRelevantToNPC(input: string, locationKeywords: string[]): boolean {
    const lowerInput = input.toLowerCase();

    // Check location-specific keywords
    if (locationKeywords.some(keyword => lowerInput.includes(keyword))) {
      return true;
    }

    // Check general interaction keywords
    const generalKeywords = [
      "quest",
      "mission",
      "help",
      "information",
      "knowledge",
      "story",
      "history",
      "location",
      "item",
      "trade",
      "what",
      "how",
      "where",
      "when",
      "why",
      "can you",
      "do you",
      "would you",
      "could you",
      "please",
    ];

    return generalKeywords.some(keyword => lowerInput.includes(keyword));
  }

  private getLocationType(locationId: string): string {
    const lowerLocation = locationId.toLowerCase();
    if (lowerLocation.includes("tavern")) return "tavern";
    if (lowerLocation.includes("smith")) return "blacksmith";
    if (lowerLocation.includes("shop")) return "shop";
    if (lowerLocation.includes("temple")) return "temple";
    if (lowerLocation.includes("library")) return "library";
    return "general";
  }

  private getNPCRole(locationType: string): string {
    switch (locationType) {
      case "tavern":
        return "tavern keeper";
      case "blacksmith":
        return "blacksmith";
      case "shop":
        return "merchant";
      case "temple":
        return "priest";
      case "library":
        return "librarian";
      default:
        return "local resident";
    }
  }
}

export class BlockchainAgent {
  constructor(private context: AgentContext) {}

  async processMessage(input: string): Promise<AgentResponse> {
    if (!this.shouldHandleBlockchainRequest(input)) {
      return { content: "", shouldRespond: false, type: "message" };
    }

    try {
      const response = await fetch("/api/blockchain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: input,
          locationId: this.context.locationId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process blockchain request");
      }

      const data = await response.json();
      return {
        content: data.content,
        shouldRespond: data.shouldRespond,
        type: data.type,
      };
    } catch (error) {
      console.error("Blockchain Agent Error:", error);
      return {
        content: "I apologize, but I'm having trouble processing your blockchain request right now.",
        shouldRespond: true,
        type: "message",
      };
    }
  }

  private shouldHandleBlockchainRequest(input: string): boolean {
    const blockchainKeywords = [
      "mint",
      "nft",
      "token",
      "transfer",
      "send",
      "give",
      "burn",
      "destroy",
      "create",
      "collection",
      "blockchain",
    ];

    const lowerInput = input.toLowerCase();
    return blockchainKeywords.some(keyword => lowerInput.includes(keyword));
  }
}
