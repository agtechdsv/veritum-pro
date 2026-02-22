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

            // Return a script that sends a message to the opener and closes the popup
            return new NextResponse(
                `<html>
                    <body>
                        <script>
                            if (window.opener) {
                                window.opener.postMessage({ type: 'AUTH_SUCCESS', url: '${origin}${next}' }, '${origin}');
                                window.close();
                            } else {
                                window.location.href = '${origin}${next}';
                            }
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
