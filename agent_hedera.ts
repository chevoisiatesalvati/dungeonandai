import * as dotenv from 'dotenv';
import { ChatOllama } from "@langchain/ollama";
import { ServerSigner } from '@hashgraphonline/hedera-agent-kit';
import { HederaConversationalAgent } from '@hashgraphonline/hedera-agent-kit';
import { Mnemonic } from '@hashgraph/sdk';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';
import { ChatOpenAI } from "@langchain/openai";

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
  const recoveredMnemonic = await Mnemonic.fromString(process.env.MNEMONIC!.toString());
  const privateKey = await recoveredMnemonic.toStandardECDSAsecp256k1PrivateKey();

  const agentSigner = new ServerSigner(
    process.env.ACCOUNT_ID!,
    privateKey,
    'testnet' as const
  );

  const llm = new HederaConversationalAgent(agentSigner, {
    operationalMode: 'provideBytes',
    userAccountId: process.env.ACCOUNT_ID,
    verbose: true,
    customSystemMessagePostamble: "Act as this character: Allow me to tell the tale in a wondrous manner, as a bard from the Eastern Lands of Middle-earth, amidst dragons, knights, and great battles.",
    openAIApiKey: process.env.OPENAI_API_KEY,
    scheduleUserTransactionsInBytesMode: true,
    openAIModelName: 'gpt-4o-mini',
    pluginConfig: {
      plugins: [],
    },
  });

  await llm.initialize();


  //const dndAgent = new DnDAgent(llm);
  //await dndAgent.initialize();

  // Create a chat history array to maintain conversation context
  const chatHistory: Array<{ type: 'human' | 'ai'; content: string }> = [];

  // Process a user message
  async function handleUserMessage(userInput: string) {
    console.log("\nUser Input:", userInput);
    
    // Add the user's message to chat history
    chatHistory.push({ type: 'human', content: userInput });

    // Process the message using the agent
    const agentResponse = await llm.processMessage(
      userInput,
      chatHistory
    );

    // Log only the agent's response output
    console.log("\nAI Response:", agentResponse.message || agentResponse.output);

    // Add the agent's response to chat history
    chatHistory.push({ type: 'ai', content: agentResponse.output });
  }

  // Call the function with "hello"
  await handleUserMessage("tells a story about a dragon");
}

main().catch(console.error);
