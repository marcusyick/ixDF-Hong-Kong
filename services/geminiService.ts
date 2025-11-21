import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  // In a real app, we handle the missing key gracefully.
  // Here we assume it's available as per instructions.
  if (!process.env.API_KEY) {
    console.error("API_KEY is missing");
  }
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
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
    // Use Flash for quick conversational responses, Pro only if thinking is required
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

    const config: any = {
      systemInstruction: systemInstruction,
    };

    // Enable thinking for complex interactions if requested (e.g., the Wise Guru NPC)
    if (useThinking) {
      config.thinkingConfig = { thinkingBudget: 32768 };
    }

    // We use chat to maintain some history context if passed, though for simple
    // interactions we might just do a generateContent with prompt.
    // Using chat for continuity.
    const chat = ai.chats.create({
      model: model,
      config: config,
      history: history.length > 0 ? history : undefined
    });

    const result = await chat.sendMessage({ message: userMessage });
    
    return result.text || "...";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "*looks confused* I'm having a bit of trouble understanding the wind right now.";
  }
};