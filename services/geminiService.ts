
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const getNutritionalTip = async (mealName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Dê uma dica nutricional curta (máximo 150 caracteres) em português sobre a refeição: ${mealName}. Foco em estudantes.`,
    });
    return response.text || "Uma alimentação balanceada é a chave para o bom desempenho escolar!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Mantenha-se hidratado durante o dia!";
  }
};

export const getDailyStatsInsight = async (totalStudents: number, choices: any): Promise<string> => {
  try {
    const prompt = `Analise os dados de merenda escolar de hoje: ${totalStudents} alunos confirmaram. Escolhas: ${JSON.stringify(choices)}. Gere uma frase motivadora sobre o combate ao desperdício e alimentação saudável.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text || "Obrigado por ajudar a planejar nossa cozinha!";
  } catch (error) {
    return "Cada escolha consciente reduz o desperdício na nossa escola.";
  }
};
