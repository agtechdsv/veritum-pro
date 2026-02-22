import { NextResponse } from 'next/server'
import { createMasterServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/veritum' // Default to Veritum after login

    if (code) {
        const supabase = await createMasterServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Post-Login Logic: Sync User to public.users (Master DB)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // The profile sync is now handled by a Database Trigger on the Master SB.
                // We only need to check for BYODB preferences if needed.

                // 2. Check Preferences (BYODB)
                const { data: prefs } = await supabase
                    .from('user_preferences')
                    .select('custom_supabase_url, custom_supabase_key')
                    .eq('user_id', user.id)
                    .single()

                if (prefs && prefs.custom_supabase_url && prefs.custom_supabase_key) {
                    const { cookies } = await import('next/headers')
                    const cookieStore = await cookies()
                    cookieStore.set('sb-project-url', prefs.custom_supabase_url)
                    cookieStore.set('sb-anon-key', prefs.custom_supabase_key)
                }
            }

            // Return a script that sends a message and tries to close the popup aggressively
            return new NextResponse(
                `<html>
                    <body>
                        <script>
                            const targetOrigin = '${origin}';
                            const targetUrl = '${origin}${next}';
                            
                            try {
                                if (window.opener) {
                                    window.opener.postMessage({ type: 'AUTH_SUCCESS', url: targetUrl }, targetOrigin);
                                }
                            } catch (e) {
                                console.error('Failed to notify opener:', e);
                            }
                            
                            function closeWindow() {
                                try {
                                    // 1. Standard close
                                    window.close();
                                    
                                    // 2. Aggressive self-opener closure
                                    if (!window.closed) {
                                        window.open('', '_self', '');
                                        window.close();
                                    }
                                } catch (e) {
                                    console.error('Closure failed:', e);
                                }
                            }

                            closeWindow();
                            
                            // Fallback UI if browser absolutely refuses to close
                            setTimeout(() => {
                                if (!window.closed) {
                                    document.body.innerHTML = \`
                                        <div style="font-family: -apple-system, system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; text-align: center; background: white;">
                                            <div style="padding: 40px; border-radius: 24px; background: #f8fafc; border: 1px solid #e2e8f0; max-width: 320px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1);">
                                                <div style="font-size: 40px; margin-bottom: 16px;">✅</div>
                                                <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 8px 0;">LOGIN CONCLUÍDO!</h1>
                                                <p style="font-size: 14px; color: #64748b; margin: 0; line-height: 1.5;">O acesso foi autorizado. Você já pode fechar esta janela com segurança.</p>
                                            </div>
                                        </div>
                                    \`;
                                }
                            }, 800);
                        </script>
                    </body>
                </html>`,
                {
                    headers: { 'Content-Type': 'text/html' },
                }
            )
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
