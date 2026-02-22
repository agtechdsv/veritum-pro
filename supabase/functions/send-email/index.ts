import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import nodemailer from "npm:nodemailer"
import { Buffer } from "node:buffer"

// Polyfill global Buffer for nodemailer
// @ts-ignore: Deno compatibility
globalThis.Buffer = Buffer

// --- Production Features: Cache & Rate Limit ---
const settingsCache = new Map<string, { expiresAt: number; config: any }>();
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

const SETTINGS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const RATE_LIMIT_MAX = 20; // max requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// Helper: Response Formatter
function jsonResponse(obj: any, status = 200) {
    return new Response(JSON.stringify(obj), {
        status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
}

// Helper: Email Validator
function validateEmail(email: string) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Helper: Settings Fetcher with Cache
async function fetchEmailSettings(supabase: any, scenario: string) {
    const now = Date.now();
    const cached = settingsCache.get(scenario);

    if (cached && cached.expiresAt > now) return cached.config;

    const { data, error } = await supabase
        .from('email_settings')
        .select('config')
        .eq('scenario_key', scenario)
        .single();

    if (error) {
        console.warn(`Settings error for ${scenario}:`, error.message);
        return null;
    }

    const config = data?.config ?? null;
    settingsCache.set(scenario, { expiresAt: now + SETTINGS_CACHE_TTL_MS, config });
    return config;
}

// Helper: Rate Limit Checker
function rateLimitCheck(key: string) {
    const now = Date.now();
    const state = rateLimitMap.get(key);

    if (!state || state.expiresAt <= now) {
        rateLimitMap.set(key, { count: 1, expiresAt: now + RATE_LIMIT_WINDOW_MS });
        return { ok: true };
    }

    if (state.count >= RATE_LIMIT_MAX) return { ok: false, retryAfter: Math.ceil((state.expiresAt - now) / 1000) };

    state.count++;
    rateLimitMap.set(key, state);
    return { ok: true };
}

Deno.serve(async (req) => {
    // 1. CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 2. Rate Limit Check
        const ip = req.headers.get('x-forwarded-for') || 'unknown';
        const rl = rateLimitCheck(ip);
        if (!rl.ok) {
            return jsonResponse({ error: 'Rate limit exceeded' }, 429);
        }

        // 3. Request Parsing & Validation
        const payload = await req.json().catch(() => null);
        if (!payload) return jsonResponse({ error: 'Invalid JSON body' }, 400);

        const { to, subject, html, scenario = 'general', lang = 'pt', text } = payload;

        if (!to || !subject || (!html && !text)) {
            return jsonResponse({ error: 'Campos obrigatórios ausentes: to, subject, html/text.' }, 400);
        }

        if (!validateEmail(to)) {
            return jsonResponse({ error: 'Email de destino inválido.' }, 400);
        }

        // 4. Initialize Supabase
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 5. Fetch Dynamic Alias (Cached)
        const settingsByScenario = await fetchEmailSettings(supabase, scenario);
        const langConfig = settingsByScenario?.[lang] || settingsByScenario?.['pt'];

        // 6. Deliverability Logic (SPF/DKIM Compliance)
        const providerUser = Deno.env.get('SMTP_USER') || '';
        const aliasEmail = langConfig?.email || providerUser || 'suporte@veritumpro.com';
        const senderName = langConfig?.name || 'Veritum PRO';

        // To satisfy SPF/DKIM, the "From" header should usually be the authenticated user
        // We use replyTo so the recipient sees and replies to the alias (vendas@, etc)
        const fromHeader = `"${senderName}" <${providerUser}>`;
        const replyToHeader = (aliasEmail !== providerUser) ? aliasEmail : undefined;

        // 7. SMTP Configuration
        const transporter = nodemailer.createTransport({
            host: Deno.env.get('SMTP_HOST'),
            port: parseInt(Deno.env.get('SMTP_PORT') || '465'),
            secure: true,
            auth: {
                user: providerUser,
                pass: Deno.env.get('SMTP_PASS'),
            },
            pool: false, // Per-request connection for Edge accuracy
            connectionTimeout: 10000,
            greetingTimeout: 5000,
            socketTimeout: 10000,
        })

        // 8. Execute Send
        const info = await transporter.sendMail({
            from: fromHeader,
            replyTo: replyToHeader,
            to,
            subject,
            html,
            text,
        })

        console.log(`Email sent from ${aliasEmail} via ${providerUser}. ID: ${info.messageId}`);

        return jsonResponse({
            success: true,
            messageId: info.messageId,
            from: aliasEmail
        });

    } catch (error: any) {
        console.error('Final SMTP Edge Function Error:', error.message)
        return jsonResponse({ success: false, error: 'Internal server error' }, 500);
    }
})
