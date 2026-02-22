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
        const userId = url.searchParams.get('state')

        if (!code || !userId) {
            throw new Error('Código ou User ID ausente.')
        }

        const clientId = Deno.env.get('GOOGLE_CLIENT_ID')
        const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET')

        if (!clientId || !clientSecret) {
            console.error('ERRO: GOOGLE_CLIENT_ID ou GOOGLE_CLIENT_SECRET não configurados no Supabase!');
            throw new Error('Configuração incompleta (Secrets ausentes no Supabase).');
        }

        // Usando a variável de ambiente do Supabase para o Redirect URI
        const supabaseUrl = Deno.env.get('SUPABASE_URL')
        if (!supabaseUrl) throw new Error('SUPABASE_URL não encontrada no ambiente.')
        const redirectUri = `${supabaseUrl}/functions/v1/google-callback`

        console.log(`Trocando código por token para o usuário: ${userId}`);

        // 1. Trocar o código pelo token
        const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                code,
                client_id: clientId,
                client_secret: clientSecret,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
            }),
        })

        const tokenData = await tokenResponse.json()

        if (!tokenResponse.ok) {
            console.error('Erro detalhado do Google:', JSON.stringify(tokenData));
            throw new Error(`Google OAuth Error: ${tokenData.error_description || tokenData.error || 'Falha no Token Exchange'}`);
        }

        const refreshToken = tokenData.refresh_token
        if (!refreshToken) {
            console.warn('Aviso: Refresh Token não recebido. Isso acontece se o usuário já autorizou antes. Forçando prompt=consent no frontend.');
            // Se já temos um token no banco, podemos ignorar isso, mas para nova conexão é crítico.
            // No entanto, se o usuário está "Alterando conta", ele deve receber o refresh_token.
        }

        // 2. Salvar o Refresh Token no banco de dados
        const supabaseServiceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
        const supabase = createClient(supabaseUrl!, supabaseServiceRoleKey!)

        const updateData: any = {};
        if (refreshToken) updateData.google_refresh_token = refreshToken;

        if (refreshToken) {
            const { error: updateError } = await supabase
                .from('user_preferences')
                .update(updateData)
                .eq('user_id', userId)

            if (updateError) throw new Error(`Erro ao salvar token no banco: ${updateError.message}`)
        }

        // 3. Retornar HTML que comunica o sucesso e fecha o popup
        return new Response(
            `
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, '*');
                        }
                        setTimeout(() => window.close(), 1000);
                    </script>
                    <div style="text-align: center; font-family: sans-serif; padding-top: 50px;">
                        <h2 style="color: #10b981;">✅ Conectado com Sucesso!</h2>
                        <p>Esta janela fechará automaticamente...</p>
                    </div>
                </body>
            </html>
            `,
            { headers: { ...corsHeaders, 'Content-Type': 'text/html' } }
        )

    } catch (error) {
        console.error('Erro no google-callback:', error.message)
        return new Response(
            `
            <html>
                <body>
                    <script>
                        if (window.opener) {
                            window.opener.postMessage({ type: 'GOOGLE_AUTH_ERROR', error: '${(error as Error).message}' }, '*');
                        }
                        // Não fechar imediatamente para o usuário ver o erro se quiser
                    </script>
                    <div style="text-align: center; font-family: sans-serif; padding-top: 50px;">
                        <h2 style="color: #ef4444;">❌ Erro na Conexão</h2>
                        <p>${(error as Error).message}</p>
                        <button onclick="window.close()" style="padding: 10px 20px; cursor: pointer;">Fechar Janela</button>
                    </div>
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
