'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function createUserDirectly(formData: any, parentUserId: string | null) {
    const supabase = createAdminClient()

    const { data, error } = await supabase.auth.admin.createUser({
        email: formData.email,
        password: formData.password,
        email_confirm: true,
        user_metadata: {
            full_name: formData.name,
            name: formData.name,
            role: formData.role,
            parent_user_id: parentUserId,
            plan_id: formData.plan_id
        }
    })

    if (error) {
        return { success: false, error: error.message }
    }

    // 2. Also update public table for consistency (trigger might handle it but let's be sure)
    const { error: publicError } = await supabase
        .from('users')
        .update({ plan_id: formData.plan_id })
        .eq('id', data.user.id)

    revalidatePath('/veritum')
    return { success: true, user: data.user }
}

export async function updateUserDirectly(userId: string, formData: any) {
    const supabase = createAdminClient()

    // 1. Update Auth User (Metadata + Password if provided)
    const updateData: any = {
        user_metadata: {
            full_name: formData.name,
            name: formData.name,
            role: formData.role,
            plan_id: formData.plan_id
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
            username: formData.email,
            plan_id: formData.plan_id
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
