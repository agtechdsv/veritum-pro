import { createBrowserClient } from '@supabase/ssr'

// This client connects to the "Veritum Master DB" (SaaS Central)
// It is used for Authentication, User Preferences, and Landing Page data.
export function createMasterClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
