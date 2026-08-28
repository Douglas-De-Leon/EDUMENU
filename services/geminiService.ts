
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || process.env.API_KEY || '',
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

export const getNutritionalTip = async (mealName: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Gere uma análise muito curta, neutra, de no máximo 120 caracteres, estimulando o pensamento crítico do aluno sobre a importância desta proposta ou escolha: "${mealName}". Foco em ambiente escolar e engajamento cidadão.`,
    });
    return response.text?.trim() || "Avalie o impacto dessa decisão no dia a dia da nossa comunidade escolar!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Reflita sobre como essa opção pode contribuir para o bem-estar coletivo!";
  }
};

export const getDailyStatsInsight = async (totalStudents: number, choices: any): Promise<string> => {
  try {
    const prompt = `Analise a participação da votação escolar hoje: ${totalStudents} eleitores votaram. Dados de escolhas: ${JSON.stringify(choices)}. Escreva uma frase inspiradora e dinâmica sobre cidadania estudantil e o papel da liderança escolar. Máximo 150 caracteres.`;
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });
    return response.text?.trim() || "A democracia na escola fortalece e prepara as lideranças de amanhã!";
  } catch (error) {
    return "Votar é o primeiro passo para construir a escola que nós queremos!";
  }
};
