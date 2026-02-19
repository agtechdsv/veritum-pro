
import { GoogleGenerativeAI } from "@google/generative-ai";
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
        });

        const result = await model.generateContent(`Traduza o seguinte texto jurídico ("juridiquês") para uma linguagem simples que um leigo entenda: "${text}"`);

        return NextResponse.json({ result: result.response.text() });
    } catch (error: any) {
        console.error("AI Vox Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
