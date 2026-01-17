import { GoogleGenAI, Type } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment variables");
    return null;
  }
  return new GoogleGenAI({ apiKey });
};

export const generateChecklistWithAI = async (areaName: string): Promise<string[]> => {
  const ai = getAiClient();
  if (!ai) return ["無法連接 AI 服務，請手動輸入重點"];

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `請針對「${areaName}」這個區域，列出 5 個具體的清潔與整理重點。重點要簡潔有力，適合員工檢查使用。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            items: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "List of checklist items"
            }
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    
    const json = JSON.parse(text);
    return json.items || [];
  } catch (error) {
    console.error("Gemini API Error:", error);
    return ["AI 生成失敗，請手動輸入"];
  }
};