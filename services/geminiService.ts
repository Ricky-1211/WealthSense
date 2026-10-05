import { GoogleGenAI, Type } from "@google/genai";
import { Transaction, Budget, SavingsData } from "../types";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

// Models to try in order — if the first is overloaded, fall back to the next
const MODELS = ["gemini-3.5-flash", "gemini-2.5-flash", "gemini-1.5-flash"];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const is503 = (error: any): boolean => {
  try {
    const parsed = typeof error?.message === 'string' ? JSON.parse(error.message) : error;
    return parsed?.error?.code === 503 || parsed?.error?.status === 'UNAVAILABLE';
  } catch {
    return false;
  }
};

/** Calls generateContent with retry + model fallback for 503s */
async function generateWithRetry(
  ai: GoogleGenAI,
  params: Omit<Parameters<GoogleGenAI['models']['generateContent']>[0], 'model'>
): Promise<ReturnType<GoogleGenAI['models']['generateContent']>> {
  const MAX_RETRIES = 2;

  for (const model of MODELS) {
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        return await ai.models.generateContent({ model, ...params });
      } catch (error: any) {
        const overloaded = is503(error);
        const isLastAttempt = attempt === MAX_RETRIES;
        const isLastModel = model === MODELS[MODELS.length - 1];

        if (overloaded && !isLastAttempt) {
          // Wait 1s, 2s before next retry on same model
          await sleep(1000 * (attempt + 1));
          continue;
        }

        if (overloaded && !isLastModel) {
          // Move to the next model
          console.warn(`Model ${model} unavailable, trying next model...`);
          break;
        }

        // Non-503 error or all models exhausted — rethrow
        throw error;
      }
    }
  }

  throw new Error("All Gemini models are currently unavailable. Please try again later.");
}

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
    const response = await generateWithRetry(ai, {
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

    return JSON.parse(response.text!);
  } catch (error: any) {
    console.error("Gemini Error:", error?.message || error);
    return {
      summary: "I couldn't analyze your data right now. The AI service is temporarily unavailable. Please try again in a moment.",
      savingsAdvice: ["Check your largest categories manually."],
      healthScore: 0,
      topSpendingCategory: "Unknown"
    };
  }
};

export const askFinancialQuery = async (
  query: string,
  transactions: Transaction[],
  budgets: Budget[],
  savings?: SavingsData
) => {
  if (!API_KEY) return "API key is missing. Please check your environment variables.";

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const currentMonth = new Date().toISOString().slice(0, 7);
  const currentMonthTransactions = transactions.filter(t => t.date.startsWith(currentMonth));

  const prompt = `
    You are a financial AI assistant. Answer the user's question based on their financial data.
    
    User Query: ${query}
    
    Financial Data:
    - All Transactions: ${JSON.stringify(transactions)}
    - Current Month Transactions: ${JSON.stringify(currentMonthTransactions)}
    - Budgets: ${JSON.stringify(budgets)}
    - Savings Data: ${JSON.stringify(savings)}
    
    Provide a helpful, concise, and actionable response. If the question involves calculations, show the math.
    Be conversational and friendly. Use currency symbols appropriately.
    
    For spending analysis, break down by category and highlight trends.
    For budget recommendations, suggest realistic targets based on historical spending.
    For savings recommendations, provide specific actionable tips.
    For subscription analysis, identify recurring expenses and suggest alternatives.
    For cash-flow forecasting, project based on historical patterns.
    For goal forecasting, analyze savings goals and provide realistic timelines.
  `;

  try {
    const response = await generateWithRetry(ai, {
      contents: prompt,
      config: {
        responseMimeType: "text/plain"
      }
    });

    return response.text;
  } catch (error: any) {
    console.error("Gemini Query Error:", error?.message || error);
    return "The AI service is temporarily overloaded. Please wait a moment and try again.";
  }
};
