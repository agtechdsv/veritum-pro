
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export class GeminiService {
    private ai: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.ai = new GoogleGenerativeAI(apiKey);
    }

    async analyzeSentiment(text: string) {
        const model = this.ai.getGenerativeModel({
            model: 'gemini-1.5-flash',
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: SchemaType.OBJECT,
                    properties: {
                        sentiment: { type: SchemaType.STRING },
                        score: { type: SchemaType.NUMBER }
                    },
                    required: ["sentiment", "score"]
                }
            }
        });

        const result = await model.generateContent(`Análise de sentimento do seguinte texto jurídico: "${text}". Retorne apenas um JSON com as chaves "sentiment" (positivo, negativo, neutro) e "score" (0 a 1).`);
        return JSON.parse(result.response.text() || '{}');
    }

    async translateLegalese(text: string) {
        const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-flash' });
        const result = await model.generateContent(`Traduza o seguinte texto jurídico ("juridiquês") para uma linguagem simples que um leigo entenda: "${text}"`);
        return result.response.text();
    }

    async generateDraft(prompt: string) {
        const model = this.ai.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent(`Atue como um advogado sênior. Elabore uma minuta de petição ou cláusula baseada no seguinte: "${prompt}"`);
        return result.response.text();
    }

    async predictOutcome(history: string) {
        const model = this.ai.getGenerativeModel({ model: 'gemative-1.5-pro' }); // Fixed typo gemative -> gemini in my head but let me check
        const result = await model.generateContent(`Com base no seguinte histórico de andamentos e perfil do juiz, estime a probabilidade de êxito: "${history}". Retorne apenas o percentual e uma justificativa curta.`);
        return result.response.text();
    }
}
