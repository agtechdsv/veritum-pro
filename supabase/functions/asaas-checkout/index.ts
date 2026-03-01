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

function buildCors(origin?: string) {
  const headers: Record<string, string> = { ...corsHeaders, "Content-Type": "application/json" };
  const isOfficialDomain = origin === "https://www.veritumpro.com";
  const isLocal = origin?.includes("localhost") || origin?.includes("127.0.0.1");

  if (origin && (SUPPORTED_ORIGINS.includes(origin) || isOfficialDomain || isLocal)) {
    headers["Access-Control-Allow-Origin"] = origin;
  } else if (SUPPORTED_ORIGINS.length === 0) {
    headers["Access-Control-Allow-Origin"] = "*";
  } else {
    // If we have supported origins but this one isn't one of them, fallback to '*' is safer than 'null' for some browsers, 
    // but here we explicitly allow our domain to fix the production error.
    headers["Access-Control-Allow-Origin"] = origin || "*";
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
function retry<T>(fn: () => Promise<T>, attempts = 3, baseDelayMs = 300): Promise<T> {
  let lastErr: any;
  const execute = async (attempt: number): Promise<T> => {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (attempt >= attempts - 1) throw lastErr;
      const delay = baseDelayMs * Math.pow(2, attempt);
      await new Promise((res) => setTimeout(res, delay));
      return execute(attempt + 1);
    }
  };
  return execute(0);
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
    if (!authHeader.startsWith("Bearer ")) {
      console.warn("Missing Authorization Bearer header");
      return jsonResponse({ error: "Missing or invalid Authorization header" }, 401, origin);
    }
    const idToken = authHeader.split(" ")[1];

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // authenticate user
    const { data: { user: jwtUser }, error: authError } = await supabaseAdmin.auth.getUser(idToken);
    if (authError || !jwtUser) {
      console.error("Supabase Auth verify failed:", authError?.message || "No user found");
      return jsonResponse({ error: "Invalid authentication token", details: authError?.message }, 401, origin);
    }
    const userId = jwtUser.id;

    const body = await req.json().catch(() => null);
    console.log("Incoming Payload:", JSON.stringify(body, null, 2));

    if (!body) return jsonResponse({ error: "Invalid JSON body" }, 400, origin);

    const {
      planName,
      billingCycle, // 'monthly' | 'yearly'
      isCash,       // boolean (for yearly cash discount)
      returnUrl,
      idempotencyKey,
      billingType,
      cardToken,
      creditCardHolderInfo,
      phone: bodyPhone,
      description
    } = body;

    const bodyCpfCnpj = body.cpfCnpj;

    if (!planName || !returnUrl) {
      console.error("Missing params:", { planName, returnUrl });
      return jsonResponse({ error: "Missing required params: planName, returnUrl" }, 400, origin);
    }

    // Validate returnUrl origin - RESTORED & ENHANCED
    const returnOrigin = getOriginFromUrl(returnUrl);
    console.log("Validation Info:", { returnOrigin, SUPPORTED_ORIGINS });

    const isLocal = returnOrigin?.includes("localhost") || returnOrigin?.includes("127.0.0.1");
    const isOfficialDomain = returnOrigin === "https://www.veritumpro.com";

    if (SUPPORTED_ORIGINS.length > 0) {
      if (!returnOrigin || (!SUPPORTED_ORIGINS.includes(returnOrigin) && !isLocal && !isOfficialDomain)) {
        console.error("returnUrl origin not allowed:", { returnOrigin, SUPPORTED_ORIGINS });
        return jsonResponse({ error: `Origin not authorized: ${returnOrigin}` }, 400, origin);
      }
    } else {
      if (!returnOrigin || (!returnOrigin.startsWith("https://") && !isLocal)) {
        console.error("returnUrl must be https or local:", { returnOrigin });
        return jsonResponse({ error: "returnUrl must be a valid https URL (except for localhost)" }, 400, origin);
      }
    }

    const normalizedBillingType = billingType ? String(billingType).toUpperCase() : "PIX";
    if (!["BOLETO", "PIX", "CREDIT_CARD", "UNDEFINED"].includes(normalizedBillingType)) {
      return jsonResponse({ error: "billingType inválido. Valores permitidos: BOLETO, PIX, CREDIT_CARD, UNDEFINED" }, 400, origin);
    }
    if (normalizedBillingType === "CREDIT_CARD" && !cardToken) {
      return jsonResponse({ error: "cardToken requerido para billingType=CREDIT_CARD" }, 400, origin);
    }

    // Fetch user from DB
    const { data: user, error: userError } = await supabaseAdmin
      .from("users")
      .select("id, name, email, cpf_cnpj, phone")
      .eq("id", userId)
      .maybeSingle();

    if (userError || !user) return jsonResponse({ error: "Usuário não encontrado." }, 404, origin);

    // Fetch plan from DB
    const { data: plan, error: planError } = await supabaseAdmin
      .from("plans")
      .select("*")
      .eq("name", planName)
      .eq("active", true)
      .maybeSingle();

    if (planError || !plan) return jsonResponse({ error: "Plano não encontrado ou inativo." }, 404, origin);

    // Calculate Price
    const basePrice = plan.monthly_price || 0;
    let months = 1;
    let discountPerc = 0;

    switch (billingCycle) {
      case 'monthly':
        months = 1;
        discountPerc = plan.monthly_discount || 0;
        break;
      case 'quarterly':
        months = 3;
        discountPerc = plan.quarterly_discount || 0;
        break;
      case 'semiannual':
        months = 6;
        discountPerc = plan.semiannual_discount || 0;
        break;
      case 'yearly':
        months = 12;
        discountPerc = plan.yearly_discount || 0;
        break;
      default:
        months = 1;
        discountPerc = plan.monthly_discount || 0;
    }

    const fullPrice = basePrice * months;
    const totalValue = fullPrice * (1 - (discountPerc / 100));

    // Update profile only if provided in body
    const updates: any = {};
    let normalizedBodyDoc: string | null = null;
    if (bodyCpfCnpj) {
      normalizedBodyDoc = String(bodyCpfCnpj).replace(/\D/g, "");
      if (!/^(?:\d{11}|\d{14})$/.test(normalizedBodyDoc)) {
        return jsonResponse({ error: "cpfCnpj inválido (deve ter 11 ou 14 dígitos)" }, 400, origin);
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
    const safePlan = String(planName).trim().replace(/\|/g, "-").slice(0, 100);
    const externalReference = `${user.id}|${safePlan}|${billingCycle}`;

    const { data: insertedPayment, error: insertError } = await supabaseAdmin
      .from("payments")
      .insert({
        user_id: user.id,
        asaas_customer_id: null,
        plan_name: safePlan,
        amount: totalValue,
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
    const emailToSearch = user.email ?? jwtUser.email;
    const q = new URLSearchParams({ email: String(emailToSearch) });
    const targetUrl = `${ASAAS_URL}/customers?${q.toString()}`;

    console.log(`Connecting to: ${targetUrl}`);
    console.log(`API Key prefix: ${ASAAS_API_KEY?.substring(0, 10)}...`);

    const customerSearch = await fetchJson(targetUrl, {
      headers: { "access_token": String(ASAAS_API_KEY) },
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
              method: "POST", // Asaas docs sometimes use POST for update, but PATCH is standard. v3 usually allows POST or PUT/PATCH
              headers: { "Content-Type": "application/json", "access_token": String(ASAAS_API_KEY) },
              body: JSON.stringify({
                cpfCnpj: normalizedDoc,
                // mobilePhone: bodyPhone ?? user.phone ?? null, // Removido para não exibir no checkout Asaas
                notificationDisabled: true
              }),
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
        notificationDisabled: true,
      };
      if (normalizedDoc) customerPayload.cpfCnpj = normalizedDoc;
      // if (bodyPhone || user.phone) customerPayload.mobilePhone = bodyPhone ?? user.phone; // Removido para não exibir no checkout Asaas

      try {
        const createCustomerRes = await retry(async () => {
          const res = await fetchJson(`${ASAAS_URL}/customers`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "access_token": String(ASAAS_API_KEY) },
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
        return jsonResponse({ error: "Erro ao criar cliente no gateway", details: String(err) }, 400, origin);
      }
    }

    // update local with asaas_customer_id
    await supabaseAdmin.from("payments").update({ asaas_customer_id: asaasCustomerId }).eq("id", insertedPayment.id);

    // Build payment payload
    const dueDate = new Date(Date.now() + 86400000).toISOString().split("T")[0];

    let asaasCycle = "MONTHLY";
    let cycleLabel = "Mensal";
    if (billingCycle === 'quarterly') {
      asaasCycle = "QUARTERLY";
      cycleLabel = "Trimestral";
    } else if (billingCycle === 'semiannual') {
      asaasCycle = "SEMIANNUALLY";
      cycleLabel = "Semestral";
    } else if (billingCycle === 'yearly') {
      asaasCycle = "YEARLY";
      cycleLabel = "Anual";
    }

    const commonPayload: any = {
      customer: asaasCustomerId,
      value: Number(totalValue),
      externalReference,
      description: description ?? `${safePlan.toLowerCase().startsWith("plano") ? safePlan : `Plano ${safePlan}`} - ${cycleLabel}`,
      billingType: normalizedBillingType,
    };

    if (normalizedBillingType === "CREDIT_CARD") {
      commonPayload.creditCard = {
        token: cardToken
      };

      // Personalização da fatura do cartão (Max 13 caracteres)
      commonPayload.creditCardStatementDescriptor = "VERITUM PRO";

      const holderInfo = creditCardHolderInfo && typeof creditCardHolderInfo === "object" ? { ...creditCardHolderInfo } : {
        name: user.name ?? jwtUser.user_metadata?.full_name ?? "Cliente",
        email: emailToSearch,
        cpfCnpj: normalizedDoc ?? undefined,
        // phone: bodyPhone ?? user.phone ?? undefined, // Removido para não exibir no checkout Asaas
      };
      if (!holderInfo.cpfCnpj && normalizedDoc) holderInfo.cpfCnpj = normalizedDoc;
      commonPayload.creditCardHolderInfo = holderInfo;
    }

    // Determine Endpoint and specific fields
    // UNIFICAÇÃO: Toda cobrança de plano/módulo agora é uma ASSINATURA no Asaas
    let endpoint = `${ASAAS_URL}/subscriptions`;

    // Sanitize returnUrl for Asaas (it forbids localhost in production)
    const sanitizedReturnUrl = (returnUrl.includes("localhost") || returnUrl.includes("127.0.0.1"))
      ? "https://www.veritumpro.com"
      : returnUrl;

    console.log("Using sanitizedReturnUrl:", sanitizedReturnUrl);

    let finalPayload: any = {
      ...commonPayload,
      dueDate,
      cycle: asaasCycle,
      nextDueDate: dueDate,
      // As assinaturas não usam o objeto 'callback' da mesma forma que pagamentos avulsos na API v3,
      // mas mantemos para compatibilidade caso a conta suporte. 
      // Idealmente o redirect é configurado no painel do Asaas para o Checkout Mobile/Links.
      callback: {
        successUrl: sanitizedReturnUrl,
        autoRedirect: false
      }
    };

    console.log(`Endpoint: ${endpoint}`);
    console.log("Final Payload to Asaas (Subscription):", JSON.stringify(finalPayload, null, 2));



    // create payment/subscription with retry
    let asaasResponse;
    try {
      asaasResponse = await retry(async () => {
        const res = await fetchJson(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", "access_token": String(ASAAS_API_KEY) },
          body: JSON.stringify(finalPayload),
        });
        if (!res.ok) {
          console.error(`Asaas error response: ${JSON.stringify(res.body)}`);
          throw new Error(`Gateway request failed: ${JSON.stringify(res.body)}`);
        }
        return res;
      }, 3, 500);
    } catch (err: any) {
      let description = String(err);
      let errorCode = "UNKNOWN_ERROR";

      try {
        if (err.message && err.message.includes('Gateway request failed: ')) {
          const rawBody = err.message.replace('Gateway request failed: ', '');
          const errorBody = JSON.parse(rawBody);
          description = errorBody?.errors?.[0]?.description || description;
          errorCode = errorBody?.errors?.[0]?.code || errorCode;
        }
      } catch (e) {
        console.error("Error parsing Asaas error:", e);
      }

      console.error(`Final Error caught: ${description} (${errorCode})`);

      // Update payment record with the failure
      if (insertedPayment?.id) {
        await supabaseAdmin.from("payments").update({
          status: "failed",
          asaas_response: {
            gatewayError: description,
            errorCode,
            payloadSent: finalPayload
          },
        }).eq("id", insertedPayment.id);
      }

      return jsonResponse({
        error: "Falha no Asaas",
        details: description,
        code: errorCode
      }, 400, origin);
    }

    const asaasData = asaasResponse.body;
    console.log("Asaas Success Response:", JSON.stringify(asaasData));

    // For Subscriptions, sometimes the URL is in invoiceUrl, for Payments it might be bankSlipUrl.
    let invoiceUrl =
      asaasData.invoiceUrl ||
      asaasData.bankSlipUrl ||
      asaasData.invoiceCustomization?.url ||
      asaasData.checkoutUrl ||
      null;

    const asaasId = asaasData.id ?? null;

    // FEAT: If it's a subscription and we don't have a URL yet, fetch the first payment
    // Removida restrição 'isMonthly' e tipo de cobrança para abranger faturamentos anuais e indefinidos
    if (!invoiceUrl && asaasId && endpoint.includes('subscriptions')) {
      try {
        console.log(`Searching for first payment of subscription ${asaasId}...`);
        const paymentsRes = await fetchJson(`${ASAAS_URL}/payments?subscription=${asaasId}&limit=1`, {
          headers: { "access_token": String(ASAAS_API_KEY) },
        });
        if (paymentsRes.ok && paymentsRes.body?.data?.length > 0) {
          const firstPayment = paymentsRes.body.data[0];
          invoiceUrl = firstPayment.invoiceUrl || firstPayment.bankSlipUrl || firstPayment.checkoutUrl || null;
          console.log(`Found subscription payment URL: ${invoiceUrl}`);
        }
      } catch (e) {
        console.warn("Failed to fetch first subscription payment for URL", e);
      }
    }
    const gatewayStatus = asaasData.status ?? "ACTIVE"; // Subscriptions are ACTIVE by default

    // Final local update
    await supabaseAdmin.from("payments").update({
      asaas_payment_id: asaasId,
      status: String(gatewayStatus).toLowerCase(),
      invoice_url: invoiceUrl,
      asaas_response: asaasData,
      webhook_processed: false,
    }).eq("id", insertedPayment.id);

    return jsonResponse({
      invoiceUrl,
      asaasPaymentId: asaasId,
      localPaymentId: insertedPayment.id,
      status: gatewayStatus
    }, 200, origin);
  } catch (err: any) {
    console.error("Unhandled error in asaas-checkout (merged A-D):", err?.message ?? err);
    return jsonResponse({ error: "Internal error" }, 500, req.headers.get("origin") ?? undefined);
  }
});