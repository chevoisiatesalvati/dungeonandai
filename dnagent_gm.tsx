import { ChatOllama } from "@langchain/ollama";
import * as dotenv from 'dotenv';

dotenv.config();

let llm: ChatOllama | null = null;

async function initializeLLM() {
  if (llm) return llm;

  llm = new ChatOllama({
    baseUrl: "http://172.28.9.201:11434",
    model: "qwen3:0.6b",
    verbose: false,
    temperature: 0.5,
    streaming: true,
  });

  return llm;
}

export async function GM_Response(input: string): Promise<string> {
  try {
    const llm = await initializeLLM();
    const response = await llm.invoke([
      {
        role: "system",
        content: "Act as this character: Allow me to tell the tale in a wondrous manner, as a bard from the Eastern Lands of Middle-earth, amidst dragons, knights, and great battles."
      },
      {
        role: "user",
        content: input
      }
    ]);
    return typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
  } catch (error) {
    console.error('Error in GM_Response:', error);
    return "I apologize, but I'm having trouble processing your request right now.";
  }
}
