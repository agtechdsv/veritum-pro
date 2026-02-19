'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createPlan(formData: any) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('plans')
        .insert([{
            name: formData.name,
            short_desc: formData.short_desc,
            monthly_price: formData.monthly_price,
            monthly_discount: formData.monthly_discount,
            yearly_price: formData.yearly_price,
            yearly_discount: formData.yearly_discount,
            features: formData.features,
            recommended: formData.recommended,
            active: formData.active,
            order_index: formData.order_index,
            is_combo: formData.is_combo
        }])
        .select()

    if (error) {
        return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
        return { success: false, error: 'Erro ao criar plano: O registro não foi retornado pelo banco (possível problema de RLS ou trigger).' }
    }

    revalidatePath('/')
    revalidatePath('/veritum')
    return { success: true, plan: data[0] }
}

export async function updatePlan(planId: string, formData: any) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('plans')
        .update({
            name: formData.name,
            short_desc: formData.short_desc,
            monthly_price: formData.monthly_price,
            monthly_discount: formData.monthly_discount,
            yearly_price: formData.yearly_price,
            yearly_discount: formData.yearly_discount,
            features: formData.features,
            recommended: formData.recommended,
            active: formData.active,
            order_index: formData.order_index,
            is_combo: formData.is_combo
        })
        .eq('id', planId)
        .select()

    if (error) {
        return { success: false, error: error.message }
    }

    if (!data || data.length === 0) {
        return { success: false, error: `Erro ao atualizar: Plano com ID ${planId} não foi encontrado ou permissão insuficiente.` }
    }

    revalidatePath('/')
    revalidatePath('/veritum')
    return { success: true, plan: data[0] }
}

export async function deletePlan(planId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('plans')
        .delete()
        .eq('id', planId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/veritum')
    return { success: true }
}

export async function togglePlanActive(planId: string, active: boolean) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('plans')
        .update({ active })
        .eq('id', planId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/veritum')
    return { success: true }
}

export async function updatePlansOrder(plans: { id: string; order_index: number }[]) {
    const supabase = createAdminClient()

    const { error } = await supabase
        .from('plans')
        .upsert(plans)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/')
    revalidatePath('/veritum')
    return { success: true }
}

export async function getFeatures() {
    const supabase = createAdminClient()
    const { data, error } = await supabase
        .from('features')
        .select('*')
        .order('display_name', { ascending: true })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, features: data }
}

export async function getPlanPermissions(planId: string) {
    const supabase = createAdminClient()

    const { data, error } = await supabase
        .from('plan_permissions')
        .select('feature_id')
        .eq('plan_id', planId)

    if (error) {
        return { success: false, error: error.message }
    }

    // Return just the array of feature IDs for easier UI handling
    return { success: true, permissions: data.map(p => p.feature_id) }
}

export async function updatePlanPermissions(planId: string, featureIds: string[]) {
    const supabase = createAdminClient()

    // First delete existing permissions for this plan
    const { error: deleteError } = await supabase
        .from('plan_permissions')
        .delete()
        .eq('plan_id', planId)

    if (deleteError) {
        return { success: false, error: deleteError.message }
    }

    // Then insert the new ones
    if (featureIds.length > 0) {
        const { error: insertError } = await supabase
            .from('plan_permissions')
            .insert(featureIds.map(fid => ({
                plan_id: planId,
                feature_id: fid
            })))

        if (insertError) {
            return { success: false, error: insertError.message }
        }
    }

    revalidatePath('/')
    revalidatePath('/veritum')
    return { success: true }
}
