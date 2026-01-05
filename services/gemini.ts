
import { GoogleGenAI } from "@google/genai";
import { Bill } from "../types";

export async function getBillInsights(bills: Bill[]): Promise<string> {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
    const unpaidBills = bills.filter(b => !b.isPaid);
    
    if (unpaidBills.length === 0) return "Você está em dia! Nenhuma conta pendente encontrada.";

    const billDataStr = unpaidBills.map(b => `${b.title} - ${b.amount} (Vence em: ${b.dueDate})`).join(', ');

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analise estas contas pendentes: ${billDataStr}. Dê uma dica financeira curta e motivadora em português. Máximo 2 frases.`,
      config: {
        systemInstruction: "Você é um assistente financeiro amigável focado em ajudar pessoas a não esquecerem suas contas e economizarem dinheiro.",
        temperature: 0.7,
      }
    });

    return response.text || "Continue focado no seu planejamento!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Mantenha o controle das suas finanças para um futuro tranquilo.";
  }
}
