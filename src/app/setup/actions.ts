'use server'

import { createDynamicClient } from '@/utils/supabase/client'
import { createMasterServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { z } from 'zod'

const schema = z.object({
    supabaseUrl: z.string().url("Invalid URL format"),
    supabaseKey: z.string().min(10, "Key is too short"),
    geminiKey: z.string().optional(),
})

export async function saveConnectionSettings(prevState: any, formData: FormData) {
    const supabaseUrl = formData.get('supabaseUrl') as string
    const supabaseKey = formData.get('supabaseKey') as string
    const geminiKey = formData.get('geminiKey') as string

    const validatedFields = schema.safeParse({
        supabaseUrl,
        supabaseKey,
        geminiKey,
    })

    if (!validatedFields.success) {
        return {
            errors: validatedFields.error.flatten().fieldErrors,
            message: 'Please check your entries.',
        }
    }

    // 1. Validate connection (Check if keys work)
    try {
        const supabase = createDynamicClient(supabaseUrl, supabaseKey)
        const { error } = await supabase.auth.getSession()
        if (error && error.message.includes('Invalid API key')) {
            return { message: 'Invalid Supabase Anon Key' }
        }
    } catch (e) {
        return { message: 'Failed to connect to Supabase' }
    }

    // 2. Save to Master DB (User Preferences)
    try {
        const masterSupabase = await createMasterServerClient()
        const { data: { user } } = await masterSupabase.auth.getUser()

        if (user) {
            const { error: prefError } = await masterSupabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    custom_supabase_url: supabaseUrl,
                    custom_supabase_key: supabaseKey, // Note: Should be encrypted in production
                    custom_gemini_key: geminiKey,
                    updated_at: new Date().toISOString()
                })

            if (prefError) {
                console.error('Failed to save preferences:', prefError)
                return { message: 'Failed to save settings to cloud. Please try again.' }
            }
        } else {
            // If called while not logged in (should be prevented by middleware, but safe guard)
            return { message: 'You must be logged in to save settings.' }
        }

    } catch (e) {
        console.error('Master DB Error:', e)
        return { message: 'System error saving preferences.' }
    }

    // 3. Set Local Cookies (for immediate session use)
    const cookieStore = await cookies()

    // Set cookies with httpOnly and secure flags
    cookieStore.set('sb-project-url', supabaseUrl, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365, // 1 year
        sameSite: 'lax'
    })

    cookieStore.set('sb-anon-key', supabaseKey, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24 * 365,
        sameSite: 'lax'
    })

    if (geminiKey) {
        cookieStore.set('gemini-api-key', geminiKey, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 365,
            sameSite: 'lax'
        })
    }

    redirect('/')
}
