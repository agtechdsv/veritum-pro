
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

        // 3. Save Embedding to Clipping (for future use/demo)
        await supabase
            .from('clippings')
            .update({ embedding })
            .eq('id', clippingId);

        // 4. Perform Similarity Search against Knowledge Articles
        // Using the user's match_knowledge function
        const { data: matches, error: matchError } = await supabase.rpc('match_knowledge', {
            query_embedding: embedding,
            match_threshold: 0.65, // Slightly lower threshold for better demo results
            match_count: 5
        });

        if (matchError) {
            console.error("Match Error (RPC failed):", matchError);
            return NextResponse.json({ error: "Falha na busca vetorial. Verifique se a função match_knowledge existe no banco.", details: matchError }, { status: 500 });
        }

        // 5. Generate reasoning for each match and Create Golden Alerts
        const goldenAlerts = [];
        const model = genAI.getGenerativeModel({ model: "gemini-3-flash-preview" });

        for (const match of (matches || [])) {
            const prompt = `
                Como um assistente jurídico experiente (Jurídico Hub), analise se existe uma oportunidade ou risco entre a seguinte publicação e uma tese do conhecimento jurídico do escritório.
                
                Publicação: "${clipping.content}"
                Tese Encontrada: "${match.content}"
                Similaridade: ${Math.round((match.similarity || 0) * 100)}%
                
                Retorne apenas um JSON puro com:
                - "reasoning": Por que isso é importante para o advogado? (1 frase curta)
                - "intelligence_type": 'Opportunity', 'Risk' ou 'Similar Success'.
                - "match_score": valor de 0 a 100 baseado na utilidade prática.
                - "priority": 'High', 'Medium' ou 'Low'.
            `;

            try {
                const aiRes = await model.generateContent(prompt);
                const aiRaw = aiRes.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                const aiData = JSON.parse(aiRaw || '{}');

                const { data: alert, error: alertError } = await supabase.from('golden_alerts').insert([{
                    clipping_id: clipping.id,
                    matched_knowledge_id: match.id,
                    match_score: aiData.match_score || Math.round(match.similarity * 100),
                    intelligence_type: aiData.intelligence_type || 'Opportunity',
                    priority: aiData.priority || 'Medium',
                    reasoning: aiData.reasoning || 'Oportunidade de tese jurídica detectada automaticamente.',
                    status: 'unread'
                }]).select().single();

                if (!alertError) goldenAlerts.push(alert);
            } catch (aiErr) {
                console.error("AI Generation Error for match:", aiErr);
            }
        }

        return NextResponse.json({ success: true, alerts_created: goldenAlerts.length, alerts: goldenAlerts });
    } catch (error: any) {
        console.error("Golden Match Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
