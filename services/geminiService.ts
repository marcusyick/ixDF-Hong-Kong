import { GoogleGenerativeAI } from "@google/generative-ai";

// Add this type definition so TypeScript knows about import.meta.env
interface ImportMetaEnv {
  VITE_API_KEY: string;
}

interface ImportMeta {
  env: ImportMetaEnv;
}

const getAiClient = () => {
  const apiKey = (import.meta as any).env.VITE_API_KEY;
  if (!apiKey) {
    console.error("AIzaSyD6A9rdRbU-6cN0swCK12WqTZB_Hn2dwvU is missing");
  }
  return new GoogleGenerativeAI(apiKey);
};

export const generateNPCResponse = async (
  npcName: string,
  persona: string,
  userMessage: string,
  history: { role: string; parts: [{ text: string }] }[] = [],
  useThinking: boolean = false
): Promise<string> => {
  try {
    const ai = getAiClient();
    // Choose model based on task complexity
    const model = useThinking ? "gemini-3-pro-preview" : "gemini-2.5-flash";
    const systemInstruction = `
      You are roleplaying as an NPC named ${npcName} in a chill, Animal Crossing-style 3D garden.
      Character Persona: ${persona}
      Instructions:
      - Keep responses concise (under 30 words usually) unless asked to elaborate deeply.
      - Be friendly, cute, and supportive.
      - Do not break character. You are inside the garden.
      - If the user asks to move or do physical things, describe your action in *asterisks*.
    `;
    // Combine system instruction and user message
    const prompt = `${systemInstruction}\nUser: ${userMessage}`;
    const modelInstance = ai.getGenerativeModel({ model });
    const result = await modelInstance.generateContent(prompt);
    return result.response.text() || "...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Hello there! I'm happy to see you in here.";
  }
};