import * as dotenv from 'dotenv';
import { ChatOllama } from "@langchain/ollama";
import { ServerSigner } from '@hashgraphonline/hedera-agent-kit';
import { Mnemonic } from '@hashgraph/sdk';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AIMessage, BaseMessage, HumanMessage, SystemMessage } from '@langchain/core/messages';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { AgentExecutor, createOpenAIToolsAgent } from 'langchain/agents';

dotenv.config();

// TODO:switch back to hedera agent, 
// just extend their system prompt to fit DnD world(create contracts out of users iteractions)...

class DnDAgent {
  private llm: BaseChatModel;
  private agentExecutor: AgentExecutor;
  public readonly systemMessage: string;

  constructor(llm: BaseChatModel) {
    this.llm = llm;
    this.systemMessage = `You're the experienced DnD game master.
    Briefly describe the world around. Provide players their roles, stats and abilities.
    Responce should be formatted in a most human readable way so it's easy to understand and consume`;
  }

  async initialize(): Promise<void> {
    const prompt = ChatPromptTemplate.fromMessages([
      ["system", this.systemMessage],
      new MessagesPlaceholder("chat_history"),
      ["human", "{input}"],
      new MessagesPlaceholder("agent_scratchpad"),
    ]);

    const agent = await createOpenAIToolsAgent({
      llm: this.llm,
      prompt,
      tools: [], // No tools needed for DnD game master
    });

    this.agentExecutor = AgentExecutor.fromAgentAndTools({
      agent,
      tools: [],
      verbose: false,
      returnIntermediateSteps: false,
    });
  }

  async *processMessage(
    userInput: string,
    chatHistory: Array<{ type: 'human' | 'ai'; content: string }>
  ): AsyncGenerator<{ output: string }> {
    const result = await this.agentExecutor.invoke({
      input: userInput,
      chat_history: chatHistory.map(msg => {
        if (msg.type === 'human') {
          return new HumanMessage(msg.content);
        } else {
          return new AIMessage(msg.content);
        }
      }),
    });

    yield { output: result.output };
  }
}

async function main() {
  const recoveredMnemonic = await Mnemonic.fromString(process.env.MNEMONIC!.toString());
  const privateKey = await recoveredMnemonic.toStandardECDSAsecp256k1PrivateKey();

  const agentSigner = new ServerSigner(
    process.env.ACCOUNT_ID!,
    privateKey,
    'testnet' as const
  );

  const llm = new ChatOllama({
    baseUrl: "http://172.28.9.201:11434",
    model: "qwen3:0.6b",
    verbose: false,
    temperature: 0.5,
    streaming: true,
  });

  const dndAgent = new DnDAgent(llm);
  await dndAgent.initialize();

  // Create a chat history array to maintain conversation context
  const chatHistory: Array<{ type: 'human' | 'ai'; content: string }> = [];

  // Process a user message
  async function handleUserMessage(userInput: string) {
    console.log("\nUser Input:", userInput);
    console.log("\nResponse:");
    
    chatHistory.push({ type: 'human', content: userInput });
    
    let fullResponse = '';
    for await (const chunk of dndAgent.processMessage(userInput, chatHistory)) {
      // Remove thinking blocks and format the text
      const cleanChunk = chunk.output
        .replace(/<think>[\s\S]*?<\/think>/g, '')  // Remove complete thinking blocks
        
      if (cleanChunk) {
        process.stdout.write(cleanChunk);
        fullResponse += cleanChunk;
      }
    }
    chatHistory.push({ type: 'ai', content: fullResponse });
    return { output: fullResponse };
  }
  const response = await handleUserMessage("hello");
}
main().catch(console.error);
