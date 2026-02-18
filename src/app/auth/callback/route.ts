import { NextResponse } from 'next/server'
import { createMasterServerClient } from '@/lib/supabase/server'

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/nexus' // Default to Nexus after login

    if (code) {
        const supabase = await createMasterServerClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)

        if (!error) {
            // Post-Login Logic: Sync User to public.users (Master DB)
            const { data: { user } } = await supabase.auth.getUser()

            if (user) {
                // 1. Sync User Profile
                const { error: upsertError } = await supabase
                    .from('users')
                    .upsert({
                        id: user.id,
                        name: user.user_metadata.full_name || 'Usuário',
                        username: user.email?.split('@')[0] || 'user',
                        avatar_url: user.user_metadata.avatar_url,
                        // active: true (default)
                    })

                if (upsertError) console.error('Error syncing user:', upsertError)

                // 2. Check Preferences (BYODB)
                const { data: prefs } = await supabase
                    .from('user_preferences')
                    .select('custom_supabase_url, custom_supabase_key')
                    .eq('user_id', user.id)
                    .single()

                // If BYODB settings exist, set them in cookies for the Client DB connection
                if (prefs && prefs.custom_supabase_url && prefs.custom_supabase_key) {
                    // Note: In a real world scenario, these should be encrypted or HTTP-only
                    // We use the supabase client's cookie store (which wraps next/headers cookies)
                    // But we can't access `cookies().set` directly here easily without importing it again
                    // So we rely on the middleware or client-side logic, OR we import cookies here.
                    // Let's import cookies to set them explicitly.
                    const { cookies } = await import('next/headers')
                    const cookieStore = await cookies()
                    cookieStore.set('sb-project-url', prefs.custom_supabase_url)
                    cookieStore.set('sb-anon-key', prefs.custom_supabase_key)
                } else {
                    // If no BYODB setup found, force redirect to Setup
                    return NextResponse.redirect(`${origin}/setup`)
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
