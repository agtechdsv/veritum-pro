
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
    try {
        const { clippingId } = await req.json();
        const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;

        if (!apiKey) {
            return NextResponse.json({ error: "Gemini API key not configured on server." }, { status: 500 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!; // High privilege for index/matching
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Fetch Clipping Content
        const { data: clipping, error: fetchError } = await supabase
            .from('clippings')
            .select('*')
            .eq('id', clippingId)
            .single();

        if (fetchError || !clipping) {
            return NextResponse.json({ error: "Clipping not found." }, { status: 404 });
        }

        // 2. Generate Embedding
        const genAI = new GoogleGenerativeAI(apiKey);
        const embeddingModel = genAI.getGenerativeModel({ model: "text-embedding-004" });
        const result = await embeddingModel.embedContent(clipping.content);
        const embedding = result.embedding.values;

        // 3. Save Embedding to Clipping
        await supabase
            .from('clippings')
            .update({ embedding })
            .eq('id', clippingId);

        // 4. Perform Similarity Search against Knowledge Articles
        // Using rpc for vector matching (requires a postgres function)
        const { data: matches, error: matchError } = await supabase.rpc('match_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.75, // Ajustável
            match_count: 3
        });

        if (matchError) {
            console.error("Match Error:", matchError);
            return NextResponse.json({ error: "Failed to perform matching.", details: matchError }, { status: 500 });
        }

        // 5. Generate reasoning for each match and Create Golden Alerts
        const goldenAlerts = [];
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        for (const match of (matches || [])) {
            const prompt = `
                Como um assistente jurídico experiente, analise se existe uma oportunidade ou risco entre a seguinte publicação e uma tese do conhecimento jurídico do escritório.
                
                Publicação: "${clipping.content}"
                Tese Encontrada: "${match.content}"
                Score de Similaridade: ${match.similarity}
                
                Retorne um JSON curto com:
                - "reasoning": Por que isso é importante?
                - "intelligence_type": 'Opportunity', 'Risk' ou 'Similar Success'.
                - "match_score": valor de 0 a 100 baseado na utilidade prática.
            `;

            const aiRes = await model.generateContent(prompt);
            const aiData = JSON.parse(aiRes.response.text().replace(/```json|```/g, '').trim());

            const { data: alert, error: alertError } = await supabase.from('golden_alerts').insert([{
                clipping_id: clipping.id,
                matched_knowledge_id: match.id,
                match_score: aiData.match_score,
                intelligence_type: aiData.intelligence_type,
                reasoning: aiData.reasoning,
                status: 'unread'
            }]).select().single();

            if (!alertError) goldenAlerts.push(alert);
        }

        return NextResponse.json({ success: true, alerts_created: goldenAlerts.length, alerts: goldenAlerts });
    } catch (error: any) {
        console.error("Golden Match Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
