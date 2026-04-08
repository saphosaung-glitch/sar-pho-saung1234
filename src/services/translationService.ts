import { GoogleGenAI, Type } from "@google/genai";

let ai: GoogleGenAI | null = null;

function getAiClient() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not set. Translation will be disabled.");
      return null;
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function translateProductName(englishName: string) {
  const aiClient = getAiClient();
  if (!aiClient) {
    return {
      mmName: englishName,
      thName: englishName,
      zhName: englishName,
      msName: englishName,
    };
  }
  try {
    const response = await aiClient.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following grocery product name into Myanmar, Thai, Chinese (Simplified), and Malay. 
      Return the result as a JSON object with keys: mmName, thName, zhName, msName.
      Product Name: ${englishName}`,
      config: {
        maxOutputTokens: 500,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            mmName: { type: Type.STRING, description: "Myanmar translation" },
            thName: { type: Type.STRING, description: "Thai translation" },
            zhName: { type: Type.STRING, description: "Chinese translation" },
            msName: { type: Type.STRING, description: "Malay translation" },
          },
          required: ["mmName", "thName", "zhName", "msName"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);
  } catch (error) {
    console.error("Translation error:", error);
    // Fallback to empty strings if translation fails
    return {
      mmName: englishName,
      thName: englishName,
      zhName: englishName,
      msName: englishName,
    };
  }
}
