
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { payload, targetLangs } = await req.json();
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured on server." }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash-preview",
        });

        const prompt = `Translate the following JSON object into ${targetLangs.join(', ')}:
    ${JSON.stringify(payload)}
    
    Rules:
    1. Return ONLY the translated JSON.
    2. Keep the structure: { "lang_code": { "short_desc": "...", "detailed_desc": "...", "features": ["...", "..."] } }
    3. Keep brand names: Sentinel, Nexus, Scriptor, Valorem, Cognitio, Vox.
    4. Translate everything else professionally for a legal context.`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();

        return NextResponse.json(JSON.parse(text || '{}'));
    } catch (error: any) {
        console.error("AI Translate Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
