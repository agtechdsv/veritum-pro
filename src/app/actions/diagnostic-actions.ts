'use server'

import { createAdminClient } from '@/lib/supabase/admin'

export async function checkUserSchema() {
    const supabase = createAdminClient()

    try {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .limit(1)

        if (error) {
            return { success: false, error: error.message, details: error }
        }

        const columns = data && data.length > 0 ? Object.keys(data[0]) : []

        return {
            success: true,
            columns,
            has_plan_id: columns.includes('plan_id'),
            sample: data ? data[0] : null
        }
    } catch (e: any) {
        return { success: false, error: e.message }
    }
}

export async function checkPlansTable() {
    const supabase = createAdminClient()
    const { data, error } = await supabase.from('plans').select('id, name').limit(5)
    return { success: !error, data, error }
}
