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

                if (prefs && prefs.custom_supabase_url && prefs.custom_supabase_key) {
                    const { cookies } = await import('next/headers')
                    const cookieStore = await cookies()
                    cookieStore.set('sb-project-url', prefs.custom_supabase_url)
                    cookieStore.set('sb-anon-key', prefs.custom_supabase_key)
                }
            }

            return NextResponse.redirect(`${origin}${next}`)
        }
    }

    // Return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/auth/auth-code-error`)
}
