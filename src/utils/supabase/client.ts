import { createBrowserClient } from '@supabase/ssr'

export function createDynamicClient(supabaseUrl: string, supabaseKey: string) {
    return createBrowserClient(supabaseUrl, supabaseKey)
}
