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
        content: `You're the experienced DnD game master.
                  Briefly describe the world around. Provide players their roles, stats and abilities.
                  Responce should be formatted in a most human readable way so it's easy to understand and consume`,

      },
      {
        role: "user",
        content: input
      }
    ]);
    
    let content = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    // Remove text within <think> blocks
    content = content.replace(/<think>[\s\S]*?<\/think>/g, '');
    return content;
  } catch (error) {
    console.error('Error in GM_Response:', error);
    return "I apologize, but I'm having trouble processing your request right now.";
  }
}
