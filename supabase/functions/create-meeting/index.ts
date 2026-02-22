import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import * as djwt from "https://deno.land/x/djwt@v2.8/mod.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getGoogleAccessToken(email: string, privateKey: string) {
    const now = Math.floor(Date.now() / 1000)

    // Preparar a chave privada (remover escapamentos e garantir formato correto)
    const pemKey = privateKey.replace(/\\n/g, '\n')

    // Importar a chave para o formato WebCrypto
    const cryptoKey = await crypto.subtle.importKey(
        'pkcs8',
        Uint8Array.from(atob(pemKey.replace(/-----BEGIN PRIVATE KEY-----|-----END PRIVATE KEY-----|\s/g, '')), c => c.charCodeAt(0)),
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
        true,
        ['sign']
    )

    const jwt = await djwt.create(
        { alg: "RS256", typ: "JWT" },
        {
            iss: email,
            scope: "https://www.googleapis.com/auth/calendar",
            aud: "https://oauth2.googleapis.com/token",
            exp: now + 3600,
            iat: now,
        },
        cryptoKey
    )

    const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
            assertion: jwt,
        }),
    })

    const data = await response.json()
    if (data.error) throw new Error(`Google Auth Error: ${data.error_description || data.error}`)
    return data.access_token
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { summary, description, start, end, attendees, calendarId, userId } = await req.json()
        const targetCalendarId = calendarId || 'primary';

        console.log(`Iniciando criação de evento: ${targetCalendarId} (User: ${userId})`);

        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

        let accessToken = ''

        // 1. Tentar usar o OAuth2 Refresh Token do usuário
        if (userId) {
            const { data: prefs } = await supabase
                .from('user_preferences')
                .select('google_refresh_token')
                .eq('user_id', userId)
                .maybeSingle()

            if (prefs?.google_refresh_token) {
                console.log('Usando OAuth2 Refresh Token do usuário.');
                accessToken = await refreshGoogleAccessToken(prefs.google_refresh_token);
            }
        }

        // 2. Fallback para Service Account (apenas para domínios Workspace com delegação)
        if (!accessToken) {
            const serviceAccountEmail = Deno.env.get('GOOGLE_SERVICE_ACCOUNT_EMAIL')
            const privateKey = Deno.env.get('GOOGLE_PRIVATE_KEY')
            if (serviceAccountEmail && privateKey) {
                console.log('Usando Service Account (Fallback/Workspace).');
                accessToken = await getGoogleAccessToken(serviceAccountEmail, privateKey);
            }
        }

        if (!accessToken) {
            throw new Error('Sem autenticação Google. Conecte sua conta nas configurações.');
        }

        // 3. Criar o evento no Google Calendar
        const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events?conferenceDataVersion=1`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                summary,
                description,
                start: { dateTime: start },
                end: { dateTime: end },
                conferenceData: {
                    createRequest: {
                        requestId: crypto.randomUUID(),
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    }
                }
            })
        });

        const event = await response.json()
        if (event.error) throw new Error(`Google Calendar Error: ${event.error.message}`)

        const meetingLink = event.conferenceData?.entryPoints?.find((ep: any) => ep.entryPointType === 'video')?.uri || '';

        return new Response(
            JSON.stringify({ success: true, meetingLink }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    } catch (error) {
        console.error('Erro na create-meeting:', error.message);
        return new Response(
            JSON.stringify({ success: false, error: (error as Error).message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})

async function refreshGoogleAccessToken(refreshToken: string) {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            client_id: Deno.env.get('GOOGLE_CLIENT_ID')!,
            client_secret: Deno.env.get('GOOGLE_CLIENT_SECRET')!,
            refresh_token: refreshToken,
            grant_type: 'refresh_token',
        }),
    })

    const data = await response.json()
    if (data.error) throw new Error(`Google OAuth Error: ${data.error_description || data.error}`)
    return data.access_token
}
