
import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Budget } from "../types";

const API_KEY = process.env.API_KEY || '';

export const getFinancialAdvice = async (transactions: Transaction[], budgets: Budget[]) => {
  if (!API_KEY) return "API key is missing. Please check your environment variables.";

  const ai = new GoogleGenAI({ apiKey: API_KEY });
  const prompt = `
    Analyze these financial transactions and budgets:
    Transactions: ${JSON.stringify(transactions)}
    Budgets: ${JSON.stringify(budgets)}

    Provide a concise summary of spending habits, potential savings areas, and an overall financial health score (0-100).
    Return the response as a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            savingsAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
            healthScore: { type: Type.NUMBER },
            topSpendingCategory: { type: Type.STRING }
          },
          required: ["summary", "savingsAdvice", "healthScore", "topSpendingCategory"]
        }
      }
    });

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return {
      summary: "I couldn't analyze your data right now. Please try again later.",
      savingsAdvice: ["Check your largest categories manually."],
      healthScore: 0,
      topSpendingCategory: "Unknown"
    };
  }
};
