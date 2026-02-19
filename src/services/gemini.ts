
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export class GeminiService {
    constructor(private apiKey?: string) { }

    async analyzeSentiment(text: string) {
        const res = await fetch('/api/ai/sentiment', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        return res.json();
    }

    async translateLegalese(text: string) {
        const res = await fetch('/api/ai/vox', {
            method: 'POST',
            body: JSON.stringify({ text })
        });
        const data = await res.json();
        return data.result;
    }

    async generateDraft(prompt: string) {
        const res = await fetch('/api/ai/draft', {
            method: 'POST',
            body: JSON.stringify({ prompt })
        });
        const data = await res.json();
        return data.result;
    }

    async predictOutcome(history: string) {
        const res = await fetch('/api/ai/predict', {
            method: 'POST',
            body: JSON.stringify({ history })
        });
        const data = await res.json();
        return data.result;
    }

    async translateSuite(payload: any, targetLangs: string[]) {
        const res = await fetch('/api/ai/translate', {
            method: 'POST',
            body: JSON.stringify({ payload, targetLangs })
        });
        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Erro na tradução');
        }
        return res.json();
    }
}
