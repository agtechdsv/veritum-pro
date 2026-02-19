
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt } = await req.json();
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured on server." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
        });

        const result = await model.generateContent(`Atue como um advogado sênior. Elabore uma minuta de petição ou cláusula baseada no seguinte: "${prompt}"`);

        return NextResponse.json({ result: result.response.text() });
    } catch (error: any) {
        console.error("AI Draft Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
