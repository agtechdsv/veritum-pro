import { createClient } from "npm:@supabase/supabase-js@2.45.1";

declare const Deno: any;
console.info("asaas-webhook starting");

const corsHeaders = {
  "Content-Type": "application/json",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const ASAAS_WEBHOOK_TOKEN = Deno.env.get("ASAAS_WEBHOOK_TOKEN") ?? "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing Supabase environment variables");
}
if (!ASAAS_WEBHOOK_TOKEN) {
  console.warn("Missing ASAAS_WEBHOOK_TOKEN");
}

function safeCompare(a?: string, b?: string) {
  // timing-safe compare
  if (!a || !b) return false;
  const ua = new TextEncoder().encode(a);
  const ub = new TextEncoder().encode(b);
  if (ua.length !== ub.length) return false;
  let diff = 0;
  for (let i = 0; i < ua.length; i++) diff |= ua[i] ^ ub[i];
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  try {
    if (req.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: corsHeaders });
    }

    // Validate token header (accept common header names)
    const tokenHeader =
      req.headers.get("asaas-access-token") ??
      req.headers.get("x-asaas-token") ??
      req.headers.get("x-asaas-access-token") ??
      "";

    if (!safeCompare(tokenHeader, ASAAS_WEBHOOK_TOKEN)) {
      console.warn("Unauthorized webhook attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const body = await req.json().catch(() => null);
    if (!body) {
      console.error("Webhook: invalid JSON payload");
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
    }

    const event: string = body.event;
    const payment = body.payment;

    if (!event || !payment) {
      console.error("Webhook: missing event or payment", body);
      return new Response(JSON.stringify({ error: "Malformed webhook payload" }), { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Extract identifiers
    const asaasPaymentId = payment.id ?? payment.paymentId ?? null;
    const externalReference = payment.externalReference ?? payment.external_reference ?? null;

    // Lookup local payment by asaas_payment_id or external_reference
    let { data: localPayment, error: paymentLookupError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .or(
        asaasPaymentId
          ? `asaas_payment_id.eq.${asaasPaymentId},external_reference.eq.${externalReference}`
          : `external_reference.eq.${externalReference}`
      )
      .limit(1)
      .single();

    if (paymentLookupError && paymentLookupError.code !== "PGRST116" && paymentLookupError.code !== "PGRST102") {
      // PGRST116/PGRST102 may indicate no rows; handle gracefully
      console.info("payments lookup returned error (non-fatal):", paymentLookupError.message);
    }

    // If not found, try to find by externalReference only
    if (!localPayment && externalReference) {
      const { data, error } = await supabaseAdmin
        .from("payments")
        .select("*")
        .eq("external_reference", externalReference)
        .limit(1)
        .single();
      if (!error) localPayment = data;
    }

    // If still not found, insert a "ghost" payment record so we can track the webhook
    if (!localPayment) {
      const insertPayload: any = {
        user_id: null,
        asaas_payment_id: asaasPaymentId,
        external_reference: externalReference,
        status: "webhook_received",
        asaas_response: payment,
        webhook_payload: body,
        webhook_received_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
      };
      const { data: inserted, error: insertErr } = await supabaseAdmin.from("payments").insert(insertPayload).select("*").single();
      if (insertErr) {
        console.error("Failed to create placeholder payment record", insertErr.message);
        // proceed but warn
      } else {
        localPayment = inserted;
      }
    }

    // Event definitions
    const confirmedEvents = ["PAYMENT_CONFIRMED", "PAYMENT_RECEIVED", "PAYMENT_RE_ACTIVATED", "PAYMENT_CONFIRMED_BY_POSTBACK"];
    const cancelledEvents = [
      "PAYMENT_DELETED",
      "PAYMENT_OVERDUE",
      "PAYMENT_REFUNDED",
      "PAYMENT_EXPIRED",
      "PAYMENT_CHARGEBACK",
      "PAYMENT_CHARGEBACK_REQUESTED",
      "PAYMENT_CHARGEBACK_DISPUTE",
      "PAYMENT_BANK_SLIP_CANCELLED"
    ];

    // Idempotency: Skip ONLY if already paid (for confirmed events) or if already handled this terminal status
    const isPaid = localPayment?.status === "paid";
    const isConfirmed = confirmedEvents.includes(event);
    const isCancelled = cancelledEvents.includes(event);

    if (isPaid && isConfirmed) {
      console.info("Payment already marked as paid, skipping confirmed event duplicate.");
      return new Response(JSON.stringify({ received: true, already_paid: true }), { headers: corsHeaders });
    }

    // Helper to log event without setting terminal 'webhook_processed' flag for non-terminal events
    async function logEvent(updatedFields: any, isTerminal = false) {
      const update: any = {
        ...updatedFields,
        webhook_payload: body,
        asaas_response: payment,
        webhook_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      if (isTerminal) {
        update.webhook_processed = true;
      }

      if (localPayment?.id) {
        await supabaseAdmin.from("payments").update(update).eq("id", localPayment.id);
      } else if (asaasPaymentId) {
        await supabaseAdmin.from("payments").update(update).eq("asaas_payment_id", asaasPaymentId);
      }
    }

    if (confirmedEvents.includes(event)) {
      // parse externalReference -> userId|planName|billingCycle
      const parts = String(externalReference ?? "").split("|");
      const userId = parts[0]?.trim();
      const planName = parts[1]?.trim();
      const billingCycle = parts[2]?.trim() || "monthly";

      if (!userId || !planName) {
        console.error("Confirmed payment but missing data in externalReference:", externalReference);
        await logEvent({ status: "paid", asaas_payment_id: asaasPaymentId }, true);
        return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
      }

      // Update payment row: set as paid and link user
      await logEvent({ status: "paid", user_id: userId, asaas_payment_id: asaasPaymentId }, true);

      // Fetch Plan ID
      const { data: planData, error: planErr } = await supabaseAdmin
        .from("plans")
        .select("id")
        .eq("name", planName)
        .maybeSingle();

      if (planErr || !planData) {
        console.error("Plan not found during webhook processing:", planName);
        return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
      }

      const planId = planData.id;

      // Calculate validity
      const validUntil = new Date();
      if (billingCycle === "yearly") {
        validUntil.setFullYear(validUntil.getFullYear() + 1);
      } else {
        validUntil.setMonth(validUntil.getMonth() + 1);
      }
      validUntil.setHours(23, 59, 59, 999);
      const validUntilISO = validUntil.toISOString();

      // 1. Upsert Subscription
      const { error: upsertErr } = await supabaseAdmin
        .from("user_subscriptions")
        .upsert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          is_trial: false, // Mark as paid
          start_date: new Date().toISOString(),
          end_date: validUntilISO,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });

      if (upsertErr) {
        console.error(`Failed to upsert user_subscription for user ${userId}:`, upsertErr.message);
      }

      // 2. Update user profile for immediate permission sync
      const { error: userUpdateErr } = await supabaseAdmin
        .from("users")
        .update({ plan_id: planId, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (userUpdateErr) {
        console.error("Failed to update user plan_id:", userUpdateErr.message);
      }

      console.info(`Successfully activated plan ${planName} (${planId}) for user ${userId}`);

      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
    } else if (cancelledEvents.includes(event)) {
      // Mark payment cancelled/refunded and revoke products if possible
      await logEvent({ status: "cancelled", asaas_payment_id: asaasPaymentId }, true);

      // Optionally revoke active subscriptions inferred from externalReference
      const [userIdRaw] = String(externalReference ?? "").split("|");
      const userId = userIdRaw?.trim();
      if (userId) {
        // Set subscriptions to INACTIVE where externalReference plan matched? Simpler: set all ACTIVE to INACTIVE for user
        const { data: revoked, error: revokeErr } = await supabaseAdmin
          .from("user_subscriptions")
          .update({ status: "INACTIVE", updated_at: new Date().toISOString() })
          .match({ user_id: userId, status: "ACTIVE" });
        if (revokeErr) console.error("Failed to revoke subscriptions for user", userId, revokeErr.message);
      }

      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
    } else {
      // Unknown event: store payload for audit and respond 200
      console.info("Unhandled Asaas event type:", event);
      await logEvent({ status: "webhook_received", asaas_payment_id: asaasPaymentId }, false);
      return new Response(JSON.stringify({ received: true }), { headers: corsHeaders });
    }
  } catch (err: any) {
    console.error("Unhandled webhook error:", err?.message ?? err);
    return new Response(JSON.stringify({ error: err?.message ?? "Internal error" }), { status: 500, headers: corsHeaders });
  }
});