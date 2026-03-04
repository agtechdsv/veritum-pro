'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getTemplates() {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from('group_templates').select('*');
    if (error) {
        console.error('Error fetching templates:', error);
        return { success: false, data: [] };
    }
    return { success: true, data };
}

export async function createUserDirectly(formData: any, parentUserId: string | null) {
    const supabase = createAdminClient();

    let assignedPlanId = formData.plan_id || null;

    if (parentUserId) {
        // Obter o plano do criador da conta (herança de plano)
        const { data: parentData } = await supabase
            .from('users')
            .select('plan_id')
            .eq('id', parentUserId)
            .single();

        if (parentData?.plan_id) {
            assignedPlanId = parentData.plan_id;
        }
    }

    const { data, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
            full_name: formData.name,
            name: formData.name,
            role: formData.role,
            parent_user_id: parentUserId,
            plan_id: assignedPlanId,
            access_group_id: formData.access_group_id || null
        }
    })

    if (error) {
        return { success: false, error: error.message }
    }

    // 2. Update public table for consistency (trigger might handle it but let's be sure)
    const { error: publicError } = await supabase
        .from('users')
        .update({
            plan_id: assignedPlanId,
            access_group_id: formData.access_group_id || null,
            force_password_reset: true // Ensure new users are forced to reset
        })
        .eq('id', data.user.id)

    revalidatePath('/veritum')
    return { success: true, user: data.user }
}

export async function resetTemporaryPassword(userId: string, newPassword: string) {
    const supabase = createAdminClient()

    // 1. Update password in Auth and clear ALL reset flags in metadata
    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
        user_metadata: {
            need_to_change_password: false,
            force_password_reset: false
        }
    })

    if (authError) {
        return { success: false, error: authError.message }
    }

    // 2. Clear force_password_reset flag in public table
    const { error: publicError } = await supabase
        .from('users')
        .update({ force_password_reset: false })
        .eq('id', userId)

    if (publicError) {
        return { success: false, error: publicError.message }
    }

    return { success: true, user: authData.user }
}

export async function startTrial(userId: string) {
    const supabase = createAdminClient()

    // 1. Find the "Trial 14 Dias" plan ID
    const { data: trialPlan } = await supabase
        .from('plans')
        .select('id')
        .eq('name', 'Trial 14 Dias')
        .single()

    if (!trialPlan) {
        return { success: false, error: 'Plano Trial não encontrado.' }
    }

    // 2. Create subscription with 14-day duration
    const startDate = new Date()
    const endDate = new Date()
    endDate.setDate(startDate.getDate() + 14)

    const { error: subError } = await supabase
        .from('user_subscriptions')
        .insert({
            user_id: userId,
            plan_id: trialPlan.id,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active',
            is_trial: true
        })

    if (subError) {
        return { success: false, error: subError.message }
    }

    // 3. Update user's current plan_id
    await supabase
        .from('users')
        .update({ plan_id: trialPlan.id })
        .eq('id', userId)

    revalidatePath('/veritum')
    return { success: true }
}

export async function updateUserDirectly(userId: string, formData: any) {
    const supabase = createAdminClient()

    // 1. Update Auth User (Metadata + Password if provided)
    const updateData: any = {
        user_metadata: {
            full_name: formData.name,
            name: formData.name,
            role: formData.role,
            plan_id: formData.plan_id || null,
            access_group_id: formData.access_group_id || null
        }
    }

    if (formData.password) {
        updateData.password = formData.password
    }

    const { data: authData, error: authError } = await supabase.auth.admin.updateUserById(userId, updateData)

    if (authError) {
        return { success: false, error: authError.message }
    }

    // 2. Update Public Table (Profile)
    const { error: publicError } = await supabase
        .from('users')
        .update({
            name: formData.name,
            role: formData.role,
            email: formData.email,
            plan_id: formData.plan_id || null,
            access_group_id: formData.access_group_id || null
        })
        .eq('id', userId)

    if (publicError) {
        return { success: false, error: publicError.message }
    }

    revalidatePath('/veritum')
    return { success: true, user: authData.user }
}

export async function deleteUserDirectly(userId: string) {
    const supabase = createAdminClient()

    const { error } = await supabase.auth.admin.deleteUser(userId)

    if (error) {
        return { success: false, error: error.message }
    }

    revalidatePath('/veritum')
    return { success: true }
}

export async function registerPublicUser(formData: any) {
    const supabase = createAdminClient()

    // Public registration always defaults to Administrador
    const { data, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
            full_name: formData.name,
            name: formData.name,
            role: 'Administrador'
        }
    })

    if (error) {
        return { success: false, error: error.message }
    }

    return { success: true, user: data.user }
}
