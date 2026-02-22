import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const url = new URL(req.url)
        const code = url.searchParams.get('code')
        const userId = url.searchParams.get('state') // Passamos o userId pelo state

        if (!code || !userId) {
            throw new Error('Código ou User ID ausente.')
        }

        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')
        const redirectUri = `${url.origin}/functions/v1/google-callback`

        // 1. Trocar o código pelo token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId!,
                client_secret: clientSecret!,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        })

        const tokenData = await tokenResponse.json()
        if (tokenData.error) throw new Error(`Erro ao obter token: ${tokenData.error_description || tokenData.error}`)

        const refreshToken = tokenData.refresh_token
        if (!refreshToken) throw new Error('Refresh Token não recebido. Certifique-se de que o acesso foi solicitado como "offline".')

        // 2. Salvar o Refresh Token no banco de dados
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

        const { error: updateError } = await supabase
            .from('user_preferences')
            .update({ google_refresh_token: refreshToken })
            .eq('user_id', userId)

        if (updateError) throw new Error(`Erro ao salvar token no banco: ${updateError.message}`)

        // 3. Retornar HTML que comunica o sucesso e fecha o popup
        return new Response(
            `
            <html>
                <body>
                    <script>
                        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                        window.close();
                    </script>
                    <p>Conectado com sucesso! Fechando janela...</p>
                </body>
            </html>
            `,
            {
                headers: { ...corsHeaders, 'Content-Type': 'text/html' }
            }
        )

    } catch (error) {
        console.error('Erro no google-callback:', error)
        return new Response(
            `
            <html>
                <body>
                    <script>
                        window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${(error as Error).message}' }, '*');
                        window.close();
                    </script>
                    <p>Erro na conexão. Fechando janela...</p>
                </body>
            </html>
            `,
            {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'text/html' }
            }
        )
    }
})
