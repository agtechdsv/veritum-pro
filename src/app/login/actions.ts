'use server'

import { redirect } from 'next/navigation'
import { createMasterServerClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { headers } from 'next/headers'
import { sendEmail } from '@/lib/email'

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

export async function requestPasswordReset(email: string) {
    const supabase = await createMasterServerClient()
    const adminClient = createAdminClient()

    // 1. Verify user exists
    const { data: user, error: userError } = await adminClient.from('users').select('id, name').eq('email', email).single()

    if (userError || !user) {
        return { error: 'O email não foi localizado. Cadastre-se.', notFound: true }
    }

    // 2. Generate temporary password
    const tempPassword = Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase() + '!@1'

    // 3. Update password and both reset flags
    const { error: updateError } = await adminClient.auth.admin.updateUserById(user.id, {
        password: tempPassword,
        user_metadata: {
            need_to_change_password: true,
            force_password_reset: true
        }
    })

    if (updateError) {
        console.error('Failed to update temp tempPassword:', updateError)
        return { error: 'Ocorreu um erro ao resetar a senha.' }
    }

    // UPDATE public.users table as well
    const { error: dbUpdateError } = await adminClient.from('users').update({ force_password_reset: true }).eq('id', user.id);
    if (dbUpdateError) {
        console.error('Failed to update force_password_reset in DB:', dbUpdateError);
        // We continue because the metadata update might have succeeded, but we log the error
    }

    console.log('--- TEMPORARY PASSWORD GENERATED FOR', email, 'IS', tempPassword, '---')

    // 4. Send Email via Edge Function
    const appUrl = (await headers()).get('origin') || 'https://www.veritumpro.com'
    const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 8px; overflow: hidden;">
            <div style="background: linear-gradient(90deg, #1bd28f 0%, #37a1f5 100%); padding: 30px 20px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px; font-weight: bold; text-transform: uppercase;">Veritum Pro</h1>
            </div>
            <div style="padding: 40px 20px; text-align: center;">
                <h2 style="margin-top: 0; color: #1f2937;">Sua senha provisória foi gerada!</h2>
                <p style="color: #4b5563; margin-bottom: 30px;">Olá, <strong>${user.name}</strong>. Para acessar sua conta novamente, copie a senha provisória abaixo.</p>
                
                <div style="background-color: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 30px; display: inline-block;">
                    <p style="margin: 0; font-size: 12px; color: #6b7280; text-transform: uppercase; font-weight: bold; margin-bottom: 8px;">SENHA PROVISÓRIA GERADA</p>
                    <div style="display: flex; align-items: center; justify-content: center; gap: 10px;">
                        <p style="margin: 0; font-size: 24px; font-weight: bold; color: #111827; letter-spacing: 2px;">${tempPassword}</p>
                    </div>
                </div>
                
                <p style="color: #4b5563; font-size: 14px; margin-bottom: 30px;">
                    Ao fazer o login, o sistema identificará que é seu primeiro acesso com a senha provisória e solicitará a criação de uma nova senha definitiva.
                </p>
                
                <a href="${appUrl}/login" style="background-color: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                    ACESSAR VERITUM PRO
                </a>
            </div>
            <div style="border-top: 1px solid #eaeaea; padding: 20px; text-align: center; color: #9ca3af; font-size: 12px;">
                <p>© ${new Date().getFullYear()} Veritum PRO</p>
                <p>Você recebeu este e-mail devido a uma solicitação de redefinição de senha.</p>
            </div>
        </div>
    `;

    // Note: We're reusing the 'adminClient' we generated at the top of the function
    const emailResult = await sendEmail(adminClient, {
        to: email,
        fullName: user.name,
        subject: 'Sua Senha Provisória - Veritum PRO',
        html: emailHtml,
        scenario: 'support'
    });

    if (!emailResult.success) {
        console.error('Failed to trigger send-email Edge Function:', emailResult.error);
    }

    return { success: true }
}
