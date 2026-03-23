import { createClient } from "npm:@supabase/supabase-js@2.45.1";

const corsHeaders = {
  "Content-Type": "application/json",
};

Deno.serve(async (req) => {
  const { method } = req;
  if (method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const webhookToken = Deno.env.get("ASAAS_SUBACCOUNT_WEBHOOK_TOKEN");
    
    // Validar Token do Webhook (Enviado pelo Asaas)
    const tokenHeader = req.headers.get("asaas-access-token") || req.headers.get("x-asaas-token") || "";
    if (webhookToken && tokenHeader !== webhookToken) {
      console.warn("Unauthorized webhook attempt - Token mismatch");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json();
    const { event, accountId } = body;

    console.log(`Webhook recebido: ${event} para conta ${accountId}`);

    if (!event || !accountId) {
      return new Response(JSON.stringify({ error: "Missing accountId or event" }), { status: 400, headers: corsHeaders });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Mapeamento de Status Granular baseado nos eventos do Asaas
    const status = event.split('_').pop(); // APPROVED, REJECTED, AWAITING_APPROVAL, PENDING
    let updateData: any = { updated_at: new Date().toISOString() };

    if (event.includes("COMMERCIAL_INFO")) {
      updateData.commercial_info_status = status;
    } else if (event.includes("DOCUMENT")) {
      updateData.documentation_status = status;
    } else if (event.includes("BANK_ACCOUNT_INFO")) {
      updateData.bank_account_info_status = status;
    } else if (event.includes("GENERAL_APPROVAL")) {
      updateData.general_status = status;
    }

    const { error } = await supabase
      .from("asaas_sub_accounts")
      .update(updateData)
      .eq("asaas_id", accountId);

    if (error) {
      console.error("Erro ao atualizar banco via Webhook:", error);
      throw error;
    }

    return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("Erro fatal no Webhook Handler:", err.message);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
