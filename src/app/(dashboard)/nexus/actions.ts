'use server'

import { createDynamicServerClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { Lawsuit, LawsuitStatus } from '@/types/nexus'
import { revalidatePath } from 'next/cache'

async function getClient() {
    const cookieStore = await cookies()
    const supabaseUrl = cookieStore.get('sb-project-url')?.value
    const supabaseKey = cookieStore.get('sb-anon-key')?.value

    if (!supabaseUrl || !supabaseKey) {
        throw new Error('Supabase credentials not found')
    }

    return createDynamicServerClient(supabaseUrl, supabaseKey)
}

export async function getLawsuits(): Promise<Lawsuit[]> {
    try {
        const supabase = await getClient()
        const { data, error } = await supabase
            .from('lawsuits')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching lawsuits:', error)
            return []
        }

        return data as Lawsuit[]
    } catch (error) {
        console.error('Failed to get client:', error)
        return []
    }
}

export async function updateLawsuitStatus(id: string, status: LawsuitStatus) {
    try {
        const supabase = await getClient()
        const { error } = await supabase
            .from('lawsuits')
            .update({ status })
            .eq('id', id)

        if (error) throw error
        revalidatePath('/nexus')
        return { success: true }
    } catch (error) {
        console.error('Error updating status:', error)
        return { success: false, error }
    }
}

export async function createLawsuit(formData: FormData) {
    const cnj_number = formData.get('cnj_number') as string
    const client_name = formData.get('client_name') as string
    const case_title = formData.get('case_title') as string
    const value = parseFloat(formData.get('value') as string) || 0
    const status = 'prospect'

    try {
        const supabase = await getClient()
        const { error } = await supabase
            .from('lawsuits')
            .insert({
                cnj_number,
                client_name,
                case_title,
                value,
                status
            })

        if (error) throw error
        revalidatePath('/nexus')
        return { success: true }
    } catch (error) {
        console.error('Error creating lawsuit:', error)
        return { success: false, error }
    }
}
