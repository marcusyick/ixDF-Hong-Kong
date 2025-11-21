import { GoogleGenerativeAI } from "@google/generative-ai";

const getAiClient = () => {
  // Use Vite's env variable access
  const apiKey = (import.meta as any).env.VITE_API_KEY;
  if (!apiKey) {
    console.error("API_KEY is missing");
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
    return "*looks confused* I'm having a bit of trouble understanding the wind right now.";
  }
};