import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function translateProductName(englishName: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Translate the following grocery product name into Myanmar, Thai, Chinese (Simplified), and Malay. 
      Return the result as a JSON object with keys: mmName, thName, zhName, msName.
      Product Name: ${englishName}`,
      config: {
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
