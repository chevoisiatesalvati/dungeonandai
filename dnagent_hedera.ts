import * as dotenv from 'dotenv';
import { ChatOllama } from "@langchain/ollama";
import { ServerSigner } from '@hashgraphonline/hedera-agent-kit';
import { HederaConversationalAgent } from '@hashgraphonline/hedera-agent-kit';
import { Mnemonic } from '@hashgraph/sdk';


dotenv.config();

async function main() {
  const recoveredMnemonic = await Mnemonic.fromString(process.env.MNEMONIC!.toString());
  const privateKey = await recoveredMnemonic.toStandardECDSAsecp256k1PrivateKey();

  const agentSigner = new ServerSigner(
    process.env.ACCOUNT_ID!,
    privateKey,
    'testnet' as const
  );

  // Initialize Ollama model
  const ollamaModel = new ChatOllama({
    baseUrl: "http://172.28.9.201:11434",
    model: "qwen3:0.6b",
    verbose: false,
    temperature: 0.5,
    streaming: true,
  });

  const llm = new HederaConversationalAgent(agentSigner, {
    operationalMode: 'provideBytes',
    userAccountId: process.env.ACCOUNT_ID,
    verbose: true,
    customSystemMessagePostamble: "Act as this character: Allow me to tell the tale in a wondrous manner, as a bard from the Eastern Lands of Middle-earth, amidst dragons, knights, and great battles.",
    llm: ollamaModel, // Use Ollama model instead of OpenAI
    scheduleUserTransactionsInBytesMode: true,
    pluginConfig: {
      plugins: [],
    },
  });

  await llm.initialize();
  
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
