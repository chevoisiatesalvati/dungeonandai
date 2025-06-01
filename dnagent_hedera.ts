import * as dotenv from "dotenv";
import { ServerSigner } from "@hashgraphonline/hedera-agent-kit";
import { HederaConversationalAgent } from "@hashgraphonline/hedera-agent-kit";
import { Mnemonic } from "@hashgraph/sdk";

dotenv.config();

async function main() {
  const recoveredMnemonic = await Mnemonic.fromString(process.env.MNEMONIC!.toString());
  const privateKey = await recoveredMnemonic.toStandardECDSAsecp256k1PrivateKey();

  const agentSigner = new ServerSigner(process.env.ACCOUNT_ID!, privateKey, "testnet" as const);

  const llm = new HederaConversationalAgent(agentSigner, {
    operationalMode: "provideBytes",
    userAccountId: process.env.ACCOUNT_ID,
    verbose: true,
    customSystemMessagePostamble:
      "Act as this character: Allow me to tell the tale in a wondrous manner, as a bard from the Eastern Lands of Middle-earth, amidst dragons, knights, and great battles.",
    openAIModelName: "gpt-4o-mini",
    scheduleUserTransactionsInBytesMode: true,
    pluginConfig: {
      plugins: [],
    },
  });

  await llm.initialize();

  // Create a chat history array to maintain conversation context
  const chatHistory: Array<{ type: "human" | "ai"; content: string }> = [];

  // Process a user message
  async function handleUserMessage(userInput: string) {
    console.log("\nUser Input:", userInput);

    // Add the user's message to chat history
    chatHistory.push({ type: "human", content: userInput });

    // Process the message using the agent
    const agentResponse = await llm.processMessage(userInput, chatHistory);

    // Log only the agent's response output
    console.log("\nAI Response:", agentResponse.message || agentResponse.output);

    // Add the agent's response to chat history
    chatHistory.push({ type: "ai", content: agentResponse.output });
  }

  // Call the function with "hello"
  await handleUserMessage("tells a story about a dragon");
}

main().catch(console.error);
