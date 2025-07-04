import * as dotenv from "dotenv";
import { ServerSigner } from "@hashgraphonline/hedera-agent-kit";
import { HederaConversationalAgent } from "@hashgraphonline/hedera-agent-kit";
import { Mnemonic } from "@hashgraph/sdk";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatPromptTemplate, MessagesPlaceholder } from "@langchain/core/prompts";
import { AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatOpenAI } from "@langchain/openai";
import { IPlugin } from "@hashgraphonline/standards-agent-kit";
import { NFTDagger } from "./nft/nft_plugin";
import { PrivateKey } from "@hashgraph/sdk";

dotenv.config();

// TODO:switch back to hedera agent,
// just extend their system prompt to fit DnD world(create contracts out of users iteractions)...

// class DnDAgent {
//   private llm: BaseChatModel;
//   private agentExecutor: AgentExecutor;
//   public readonly systemMessage: string;

//   constructor(llm: BaseChatModel) {
//     this.llm = llm;
//     this.systemMessage = `You're the experienced DnD game master.
//     Briefly describe the world around. Provide players their roles, stats and abilities.
//     Responce should be formatted in a most human readable way so it's easy to understand and consume`;
//   }

//   async initialize(): Promise<void> {
//     const prompt = ChatPromptTemplate.fromMessages([
//       ["system", this.systemMessage],
//       new MessagesPlaceholder("chat_history"),
//       ["human", "{input}"],
//       new MessagesPlaceholder("agent_scratchpad"),
//     ]);

//     const agent = await createOpenAIToolsAgent({
//       llm: this.llm,
//       prompt,
//       tools: [], // No tools needed for DnD game master
//     });

//     this.agentExecutor = AgentExecutor.fromAgentAndTools({
//       agent,
//       tools: [],
//       verbose: false,
//       returnIntermediateSteps: false,
//     });
//   }

//   async *processMessage(
//     userInput: string,
//     chatHistory: Array<{ type: 'human' | 'ai'; content: string }>
//   ): AsyncGenerator<{ output: string }> {
//     const result = await this.agentExecutor.invoke({
//       input: userInput,
//       chat_history: chatHistory.map(msg => {
//         if (msg.type === 'human') {
//           return new HumanMessage(msg.content);
//         } else {
//           return new AIMessage(msg.content);
//         }
//       }),
//     });

//     yield { output: result.output };
//   }
// }

async function main() {
  //const recoveredMnemonic = await Mnemonic.fromString(process.env.MNEMONIC!.toString());
  //const privateKey = await recoveredMnemonic.toStandardECDSAsecp256k1PrivateKey();

  const privateKey = PrivateKey.fromStringECDSA(process.env.HEDERA_PRIVATE_KEY!.replace("0x", ""));

  const agentSigner = new ServerSigner(process.env.ACCOUNT_ID!, privateKey, "testnet" as const);

  const llm = new HederaConversationalAgent(agentSigner, {
    operationalMode: "directExecution",
    userAccountId: process.env.ACCOUNT_ID,
    verbose: true,
    customSystemMessagePostamble:
      "Act as this character: Allow me to tell the tale in a wondrous manner, as a bard from the Eastern Lands of Middle-earth, amidst dragons, knights, and great battles.",
    openAIApiKey: process.env.OPENAI_API_KEY,
    scheduleUserTransactionsInBytesMode: true,
    openAIModelName: "gpt-4o-mini",
    pluginConfig: {
      plugins: [],
    },
  });

  const nftAgent = new HederaConversationalAgent(agentSigner, {
    operationalMode: "directExecution",
    // userAccountId: process.env.NFT_ACCOUNT_ID,
    verbose: true,
    customSystemMessagePostamble: `
    If user asks to mint dagger mint it in collection 0.0.6092934 with NFTPlugin plugin only,
    with metadata ipfs://bafkreibirmhogrkhblrmyefyxurmntgy4zzng2juxaffkjkxgtdddap52y,
    if user wants destroy dagger, burn NFT in collection ID 0.0.6092934.`,
    openAIApiKey: process.env.OPENAI_API_KEY,
    scheduleUserTransactionsInBytesMode: true,
    openAIModelName: "gpt-4o-mini",

    pluginConfig: {
      plugins: [new NFTDagger() as IPlugin],
    },
  });

  await llm.initialize();
  await nftAgent.initialize();

  //const dndAgent = new DnDAgent(llm);
  //await dndAgent.initialize();

  // Create a chat history array to maintain conversation context
  const chatHistory: Array<{ type: "human" | "ai"; content: string }> = [];

  // Process a user message
  async function handleUserMessage(userInput: string) {
    console.log("\nUser Input:", userInput);

    // Add the user's message to chat history
    chatHistory.push({ type: "human", content: userInput });

    // Process the message using the NFT agent if it contains NFT-related keywords
    const isNFTRequest =
      userInput.toLowerCase().includes("nft") ||
      userInput.toLowerCase().includes("mint") ||
      userInput.toLowerCase().includes("token");

    const agentResponse = await (isNFTRequest ? nftAgent : llm).processMessage(
      userInput,
      chatHistory
    );

    // Log the response
    console.log("\nAI Response:", agentResponse.message || agentResponse.output);

    // Add the agent's response to chat history
    chatHistory.push({ type: "ai", content: agentResponse.output });
  }

  // Test NFT functionality with these commands
  //await handleUserMessage("create an NFT collection called Dark Forest daggers max supply 100"); //create collection
  //await handleUserMessage("mint one dagger."); // minting item to collection
  //await handleUserMessage("destroy one dagger with tokenid 2.");
  await handleUserMessage(
    "transfer one dagger from 0.0.6052003 to 0.0.9224321 with nftId 0.0.6092934 with entityId 3"
  );
  //burn nft from collection
}

main().catch(console.error);
