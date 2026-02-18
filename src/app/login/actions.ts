'use server'

import { redirect } from 'next/navigation'
import { createMasterServerClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

export async function loginWithGoogle() {
    const origin = (await headers()).get('origin')
    const supabase = await createMasterServerClient()

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${origin}/auth/callback`,
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        },
    })

    if (error) {
        console.error('Google Login Error:', error)
        return { error: error.message }
    }

    if (data.url) {
        redirect(data.url)
    }
}
