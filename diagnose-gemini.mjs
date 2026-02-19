
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: resolve(process.cwd(), ".env.local") });

async function listModels() {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
        console.error("ERRO: NEXT_PUBLIC_GEMINI_API_KEY não encontrada no .env.local");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // There is no direct listModels in the SDK for web/node easily without specialized methods
        // but try to generate a simple one
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent("test");
        console.log("Sucesso com gemini-1.5-flash!");
    } catch (e) {
        console.log("Erro com gemini-1.5-flash:", e.message);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-pro" });
            const result = await model.generateContent("test");
            console.log("Sucesso com gemini-pro!");
        } catch (e2) {
            console.log("Erro com gemini-pro:", e2.message);
        }
    }
}

listModels();
