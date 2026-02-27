// supabase/functions/asaas-checkout/index.ts
import { createClient } from "npm:@supabase/supabase-js@2.45.1";

declare const Deno: any;
console.info("asaas-checkout function starting (merged + A-D)");

/*
  Mudanças aplicadas:
  - (A) PLAN_PRICES lookup case-insensitive (busca por lower-case).
  - (B) Validacao de returnUrl: requer origin em SUPPORTED_ORIGINS se fornecido, caso contrário exige https.
  - (C) Retry/backoff para chamadas POST críticas (create customer, create payment) com 3 tentativas e exponential backoff.
  - (D) Patch final integrado e retorno pronto para teste.
*/

const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
const ASAAS_URL = Deno.env.get("ASAAS_URL") ?? "https://api.asaas.com/v3";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const SUPPORTED_ORIGINS = (Deno.env.get("SUPPORTED_ORIGINS") || "").split(",").map((s: string) => s.trim()).filter(Boolean);
const ASAAS_CARD_TOKEN_FIELD = Deno.env.get("ASAAS_CARD_TOKEN_FIELD") ?? "creditCard.token";

if (!ASAAS_API_KEY) console.error("Missing ASAAS_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Headers": "Authorization, X-Client-Info, apikey, Content-Type, prefer",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const PLAN_PRICES_RAW: Record<string, number> = {
  "Essential": 97.0,
  "Master Pro": 197.0,
  "Apex Elite": 250.0,
  "Essential ANUAL": 931.0,
  "Master Pro ANUAL": 1891.0,
  "Apex Elite ANUAL": 2400.0
};
const DEFAULT_PRICE = 97.0;

// Create a case-insensitive map (lowercased keys)
const PLAN_PRICES: Record<string, number> = Object.keys(PLAN_PRICES_RAW).reduce((acc: any, k) => {
  acc[k.toLowerCase()] = PLAN_PRICES_RAW[k];
  return acc;
}, {});

function buildCors(origin?: string) {
  const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json" };
  if (origin && SUPPORTED_ORIGINS.length > 0 && SUPPORTED_ORIGINS.includes(origin)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (SUPPORTED_ORIGINS.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else {
    headers["Access-Control-Allow-Origin"] = "null";
  }
  return headers;
}

function jsonResponse(data: any, status = 200, origin?: string) {
  return new Response(JSON.stringify(data), { status, headers: buildCors(origin) });
}

async function fetchJson(input: RequestInfo, init?: RequestInit) {
  const res = await fetch(input, init);
  const text = await res.text();
  let body: any = null;
  try { body = text ? JSON.parse(text) : null; } catch { body = { raw: text }; }
  return { ok: res.ok, status: res.status, body };
}

// Exponential backoff retry helper
async function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 300): Promise<T> {
  let lastErr: any;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const delay = baseDelayMs * Math.pow(2, i);
      await new Promise((res) => setTimeout(res, delay));
    }
  }
  throw lastErr;
}

function getOriginFromUrl(url?: string | null) {
  if (!url) return null;
  try {
    const u = new URL(String(url));
    return u.origin;
  } catch {
    return null;
  }
}

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("origin") ?? undefined;
  try {
    if (req.method === "OPTIONS") return new Response(null, { headers: buildCors(origin) });
    if (req.method !== "POST") return new Response("Method Not Allowed", { status: 405, headers: buildCors(origin) });

    const authHeader = req.headers.get("authorization") || "";
    if (!authHeader.startsWith("Bearer ")) return jsonResponse({ error: "Missing or invalid Authorization header" }, 401, origin);
    const idToken = authHeader.split(" ")[1];

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // compat getUser signatures
    let tokenData: any = null;
    let tokenError: any = null;
    try {
      const maybe = await supabaseAdmin.auth.getUser(idToken);
      tokenData = maybe?.data ?? maybe;
      tokenError = maybe?.error;
    } catch {
      const maybe2 = await supabaseAdmin.auth.getUser({ access_token: idToken } as any);
      tokenData = maybe2?.data ?? maybe2;
      tokenError = maybe2?.error;
    }
    if (tokenError || !tokenData?.user) return jsonResponse({ error: "Invalid authentication token" }, 401, origin);
    const jwtUser = tokenData.user;
    const userId = jwtUser.id;

    const body = await req.json().catch(() => null);
    if (!body) return jsonResponse({ error: "Invalid JSON body" }, 400, origin);

    const {
      planName,
      returnUrl,
      idempotencyKey,
      billingType,
      cardToken,
      creditCardHolderInfo,
      cpfCnpj: bodyCpfCnpj,
      phone: bodyPhone,
      description
    } = body;

    if (!planName || !returnUrl) return jsonResponse({ error: "Missing required params: planName, returnUrl" }, 400, origin);

    // (B) Validate returnUrl origin
    const returnOrigin = getOriginFromUrl(returnUrl);
    if (SUPPORTED_ORIGINS.length > 0) {
      if (!returnOrigin || !SUPPORTED_ORIGINS.includes(returnOrigin)) {
        return jsonResponse({ error: "returnUrl origin is not allowed" }, 400, origin);
      }
    } else {
      // require https when no SUPPORTED_ORIGINS is configured
      if (!returnOrigin || !returnOrigin.startsWith("https://")) {
        return jsonResponse({ error: "returnUrl must be a valid https URL" }, 400, origin);
      }
    }

    const normalizedBillingType = billingType ? String(billingType).toUpperCase() : "PIX";
    if (!["BOLETO", "PIX", "CREDIT_CARD"].includes(normalizedBillingType)) {
      return jsonResponse({ error: "billingType inválido. Valores permitidos: BOLETO, PIX, CREDIT_CARD" }, 400, origin);
    }
    if (normalizedBillingType === "CREDIT_CARD" && !cardToken) {
      return jsonResponse({ error: "cardToken requerido para billingType=CREDIT_CARD" }, 400, origin);
    }

    // Fetch user from DB
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, username, cpf_cnpj, phone")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !user) return jsonResponse({ error: "Usuário não encontrado." }, 404, origin);

    // Update profile only if provided in body
    const updates: any = {};
    let normalizedBodyDoc: string | null = null;
    if (bodyCpfCnpj) {
      normalizedBodyDoc = String(bodyCpfCnpj).replace(/\D/g, "");
      if (!/^(?:\d{11}|\d{14})$/.test(normalizedBodyDoc)) {
        return jsonResponse({ error: "cpfCnpj inválido no body (deve ter 11 ou 14 dígitos)" }, 400, origin);
      }
      updates.cpf_cnpj = normalizedBodyDoc;
    }
    if (bodyPhone) updates.phone = String(bodyPhone);
    if (Object.keys(updates).length > 0) {
      updates.updated_at = new Date().toISOString();
      await supabaseAdmin.from("users").update(updates).eq("id", user.id);
    }

    // Idempotency check
    if (idempotencyKey) {
      const { data: existingByKey } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("idempotency_key", idempotencyKey)
        .limit(1)
        .maybeSingle();
      if (existingByKey) {
        return jsonResponse({
          invoiceUrl: existingByKey.invoice_url,
          asaasPaymentId: existingByKey.asaas_payment_id,
          localPaymentId: existingByKey.id,
          status: existingByKey.status,
        }, 200, origin);
      }
    }

    // Create local payment pre-gateway
    const normalizedPlanKey = String(planName).trim().toLowerCase();
    const price = PLAN_PRICES[normalizedPlanKey] ?? DEFAULT_PRICE;
    const safePlan = String(planName).trim().replace(/\|/g, "-").slice(0, 100);
    const externalReference = `${user.id}|${safePlan}`;

    const { data: insertedPayment, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        asaas_customer_id: null,
        plan_name: safePlan,
        amount: price,
        status: "pending",
        external_reference: externalReference,
        idempotency_key: idempotencyKey ?? null,
        billing_type: normalizedBillingType,
      })
      .select("*")
      .single();

    if (insertError || !insertedPayment) {
      console.error("Failed to insert local payment record", insertError);
      return jsonResponse({ error: "Erro interno ao criar registro de pagamento" }, 500, origin);
    }

    // Search or create Asaas customer
    const emailToSearch = user.username ?? jwtUser.email;
    const q = new URLSearchParams({ email: String(emailToSearch) });

    const customerSearch = await fetchJson(`${ASAAS_URL}/customers?${q.toString()}`, {
      headers: { Authorization: `Bearer ${ASAAS_API_KEY}` },
    });

    let asaasCustomerId: string | null = null;
    const normalizedDoc = normalizedBodyDoc ?? (user.cpf_cnpj ?? null);

    if (customerSearch.ok && Array.isArray(customerSearch.body?.data) && customerSearch.body.data.length > 0) {
      asaasCustomerId = customerSearch.body.data[0].id;
      const asaasCustomerDoc = customerSearch.body.data[0].cpfCnpj ?? customerSearch.body.data[0].cpf_cnpj ?? null;
      if (!asaasCustomerDoc && normalizedDoc) {
        // patch customer with retry (C)
        try {
          await retry(async () => {
            const patchRes = await fetchJson(`${ASAAS_URL}/customers/${asaasCustomerId}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${ASAAS_API_KEY}` },
              body: JSON.stringify({ cpfCnpj: normalizedDoc, mobilePhone: bodyPhone ?? user.phone ?? null }),
            });
            if (!patchRes.ok) throw new Error(`Patch failed: ${JSON.stringify(patchRes.body)}`);
            return patchRes;
          }, 3, 300);
        } catch (err) {
          await supabaseAdmin
            .from("payments")
            .update({ asaas_response: JSON.stringify({ patchCustomerError: String(err) }) })
            .eq("id", insertedPayment.id);
        }
      }
    } else {
      // create customer with retry (C)
      const customerPayload: any = {
        name: user.name ?? jwtUser.user_metadata?.full_name ?? String(emailToSearch).split("@")[0],
        email: emailToSearch,
        externalReference: user.id,
      };
      if (normalizedDoc) customerPayload.cpfCnpj = normalizedDoc;
      if (bodyPhone || user.phone) customerPayload.mobilePhone = bodyPhone ?? user.phone;

      try {
        const createCustomerRes = await retry(async () => {
          const res = await fetchJson(`${ASAAS_URL}/customers`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${ASAAS_API_KEY}` },
            body: JSON.stringify(customerPayload),
          });
          if (!res.ok) throw new Error(`create customer failed: ${JSON.stringify(res.body)}`);
          return res;
        }, 3, 400);

        asaasCustomerId = createCustomerRes.body?.id ?? null;
        if (!asaasCustomerId) {
          await supabaseAdmin.from("payments").update({ status: "failed" }).eq("id", insertedPayment.id);
          return jsonResponse({ error: "Resposta inválida do gateway ao criar cliente" }, 502, origin);
        }
      } catch (err) {
        await supabaseAdmin
          .from("payments")
          .update({
            status: "failed",
            asaas_response: JSON.stringify({ createCustomerError: String(err) }),
          })
          .eq("id", insertedPayment.id);
        return jsonResponse({ error: "Erro ao criar cliente no gateway de pagamentos" }, 502, origin);
      }
    }

    // update local with asaas_customer_id
    await supabaseAdmin.from("payments").update({ asaas_customer_id: asaasCustomerId }).eq("id", insertedPayment.id);

    // Build payment payload
    const dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const basePaymentPayload: any = {
      customer: asaasCustomerId,
      value: Number(price),
      dueDate,
      description: description ?? `Plano ${safePlan}`,
      externalReference,
      callback: { successUrl: returnUrl, autoRedirect: true },
      billingType: normalizedBillingType,
    };

    // create payment with retry (C)
    let createPaymentRes;
    try {
      createPaymentRes = await retry(async () => {
        let payload: any;
        if (normalizedBillingType === "CREDIT_CARD") {
          payload = { ...basePaymentPayload, creditCard: { token: cardToken } };
          if (creditCardHolderInfo && typeof creditCardHolderInfo === "object") {
            payload.creditCardHolderInfo = { ...creditCardHolderInfo };
            if (!payload.creditCardHolderInfo.cpfCnpj && normalizedDoc) payload.creditCardHolderInfo.cpfCnpj = normalizedDoc;
          } else {
            payload.creditCardHolderInfo = {
              name: user.name ?? jwtUser.user_metadata?.full_name ?? "Cliente",
              email: emailToSearch,
              cpfCnpj: normalizedDoc ?? undefined,
              phone: bodyPhone ?? user.phone ?? undefined,
            };
          }
        } else {
          payload = basePaymentPayload;
        }

        const res = await fetchJson(`${ASAAS_URL}/payments`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${ASAAS_API_KEY}` },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`create payment failed: ${JSON.stringify(res.body)}`);
        return res;
      }, 3, 500);
    } catch (err) {
      await supabaseAdmin
        .from("payments")
        .update({
          status: "failed",
          asaas_response: JSON.stringify({ createPaymentError: String(err) }),
        })
        .eq("id", insertedPayment.id);
      const errMsg = String(err).slice(0, 1000);
      return jsonResponse({ error: "Falha ao criar pagamento no gateway", details: errMsg }, 400, origin);
    }

    const asaasPayment = createPaymentRes.body;
    const invoiceUrl =
      asaasPayment.invoiceUrl ??
      asaasPayment.invoice_url ??
      asaasPayment.invoiceUrlBoleto ??
      asaasPayment.bankSlipUrl ??
      asaasPayment.checkoutUrl ??
      asaasPayment.paymentUrl ??
      null;
    const asaasPaymentId = asaasPayment.id ?? null;
    const cardLast4 = asaasPayment?.creditCard?.last4 ?? asaasPayment?.card?.last4 ?? asaasPayment?.cardLast4 ?? null;
    const cardBrand = asaasPayment?.creditCard?.brand ?? asaasPayment?.card?.brand ?? asaasPayment?.cardBrand ?? null;
    const gatewayStatus = asaasPayment?.status ?? "created";

    // Final local update
    await supabaseAdmin.from("payments").update({
      asaas_payment_id: asaasPaymentId,
      status: String(gatewayStatus).toLowerCase(),
      invoice_url: invoiceUrl,
      asaas_response: asaasPayment,
      card_last4: cardLast4,
      card_brand: cardBrand,
      webhook_processed: false,
    }).eq("id", insertedPayment.id);

    return jsonResponse({
      invoiceUrl,
      asaasPaymentId,
      localPaymentId: insertedPayment.id,
      status: gatewayStatus
    }, 200, origin);

  } catch (err: any) {
    console.error("Unhandled error in asaas-checkout (merged A-D):", err?.message ?? err);
    return jsonResponse({ error: "Internal error" }, 500, req.headers.get("origin") ?? undefined);
  }
});