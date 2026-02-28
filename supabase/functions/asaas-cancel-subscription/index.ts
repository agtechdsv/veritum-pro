
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
const ASAAS_URL = Deno.env.get("ASAAS_URL") || "https://www.asaas.com/api/v3";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const authHeader = req.headers.get("authorization") || "";
        if (!authHeader.startsWith("Bearer ")) {
            return new Response(JSON.stringify({ error: "Missing auth header" }), { status: 401, headers: corsHeaders });
        }

        const token = authHeader.replace("Bearer ", "");
        const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
        }

        const { reason, feedback } = await req.json();

        // 1. Find the latest asaas_subscription_id for this user
        // We look for a record in the payments table that has a subscription ID (starts with sub_)
        const { data: payments, error: paymentsError } = await supabaseAdmin
            .from("payments")
            .select("asaas_payment_id")
            .eq("user_id", user.id)
            .not("asaas_payment_id", "is", null)
            .order("created_at", { ascending: false });

        if (paymentsError) {
            console.error("Payments fetch error:", paymentsError);
            throw paymentsError;
        }

        let asaasSubscriptionId = null;
        if (payments && payments.length > 0) {
            for (const p of payments) {
                if (p.asaas_payment_id?.startsWith("sub_")) {
                    asaasSubscriptionId = p.asaas_payment_id;
                    break;
                }
            }
        }

        if (!asaasSubscriptionId) {
            return new Response(JSON.stringify({ error: "Nenhuma assinatura ativa encontrada para este usuário no gateway." }), {
                status: 404,
                headers: { ...corsHeaders, "Content-Type": "application/json" }
            });
        }

        console.log(`Cancelling subscription ${asaasSubscriptionId} for user ${user.id}...`);

        // 2. Call Asaas API to delete subscription
        const asaasRes = await fetch(`${ASAAS_URL}/subscriptions/${asaasSubscriptionId}`, {
            method: "DELETE",
            headers: {
                "access_token": ASAAS_API_KEY!,
                "Content-Type": "application/json",
            },
        });

        if (!asaasRes.ok) {
            const errorData = await asaasRes.json();
            console.error("Asaas cancellation error:", errorData);
            throw new Error(errorData.errors?.[0]?.description || "O gateway recusou o cancelamento automático.");
        }

        // 3. Update local user_subscriptions table
        const { error: updateError } = await supabaseAdmin
            .from("user_subscriptions")
            .update({
                status: "canceled",
                updated_at: new Date().toISOString()
            })
            .eq("user_id", user.id);

        if (updateError) {
            console.error("Local subscription update error:", updateError);
        }

        // 4. Log the cancellation feedback
        try {
            const { error: logError } = await supabaseAdmin
                .from("subscription_cancellation_logs")
                .insert({
                    user_id: user.id,
                    reasons: reason,
                    feedback: feedback || null,
                    asaas_subscription_id: asaasSubscriptionId
                });

            if (logError) console.error("History logging error:", logError);
        } catch (logErr) {
            console.warn("Failed to log cancellation history:", logErr);
        }

        // 4. Send notification email to support
        try {
            await supabaseAdmin.functions.invoke("send-email", {
                body: {
                    to: "suporte@veritumpro.com",
                    subject: `Cancelamento de Assinatura: ${user.email}`,
                    html: `
                    <div style="font-family: sans-serif; padding: 20px; color: #333;">
                        <h2 style="color: #e11d48;">Aviso de Cancelamento</h2>
                        <p>O usuário abaixo cancelou sua assinatura através do painel:</p>
                        <hr />
                        <p><strong>Usuário:</strong> ${user.email}</p>
                        <p><strong>ID Usuário:</strong> ${user.id}</p>
                        <p><strong>Motivo Selecionado:</strong> ${reason}</p>
                        <p><strong>Feedback Adicional:</strong> ${feedback || "Não informado"}</p>
                        <p><strong>ID Assinatura Asaas:</strong> ${asaasSubscriptionId}</p>
                        <hr />
                        <p style="font-size: 12px; color: #666;">Sistema de Gestão Veritum PRO</p>
                    </div>
                `,
                    scenario: "billing"
                }
            });
        } catch (emailErr) {
            console.warn("Failed to notify support about cancellation:", emailErr);
        }

        return new Response(JSON.stringify({ success: true, cancelledId: asaasSubscriptionId }), {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (err: any) {
        console.error("Error in asaas-cancel-subscription:", err);
        return new Response(JSON.stringify({ error: err.message }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }
});
