
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { text } = await req.json();
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured on server." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
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

        return NextResponse.json(JSON.parse(result.response.text() || '{}'));
    } catch (error: any) {
        console.error("AI Sentiment Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
