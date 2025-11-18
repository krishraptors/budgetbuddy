import { GoogleGenAI, Type } from "@google/genai";
import { BudgetPlanParsed, Category, Transaction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Model configuration
const MODEL_FAST = "gemini-2.5-flash";

export const categorizeTransaction = async (description: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Categorize this transaction description into one of these exact categories: Housing, Food, Transportation, Entertainment, Utilities, Health, Shopping, Salary, Investment, Freelance, Other. 
      Description: "${description}". 
      Return ONLY the category name.`,
    });
    const text = response.text?.trim();
    return text || "Other";
  } catch (error) {
    console.error("Error categorizing transaction:", error);
    return "Other";
  }
};

export const parseHumanBudgetPlan = async (planText: string): Promise<BudgetPlanParsed | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `Analyze this budget plan text and extract structured data. 
      The text is: "${planText}".
      Extract a list of category budgets, an estimated income, and a savings goal if mentioned.
      Also provide a short, encouraging summary advice based on the tone of the plan.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            month: { type: Type.STRING, description: "The month this plan is for, if specified, else 'General'" },
            budgets: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  category: { type: Type.STRING },
                  limit: { type: Type.NUMBER },
                }
              }
            },
            incomeEstimate: { type: Type.NUMBER },
            savingsGoal: { type: Type.NUMBER },
            advice: { type: Type.STRING }
          }
        }
      }
    });

    const jsonStr = response.text?.trim();
    if (!jsonStr) return null;
    return JSON.parse(jsonStr) as BudgetPlanParsed;
  } catch (error) {
    console.error("Error parsing budget plan:", error);
    return null;
  }
};

export const getAIInsights = async (transactions: Transaction[], budgets: any[]): Promise<string> => {
  try {
    const summary = JSON.stringify({
      recentTransactions: transactions.slice(0, 10),
      budgets: budgets,
    });
    
    const response = await ai.models.generateContent({
      model: MODEL_FAST,
      contents: `You are a witty and helpful financial coach called BudgetBuddy.
      Analyze these recent transactions and budget status: ${summary}.
      Provide 3 short, bulleted insights or actionable advice.
      Keep it modern, concise, and professional but friendly.`,
    });
    
    return response.text || "Keep tracking your expenses to see insights!";
  } catch (error) {
    console.error("Error getting insights:", error);
    return "Unable to generate insights at the moment.";
  }
};
