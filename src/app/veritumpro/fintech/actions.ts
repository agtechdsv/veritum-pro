'use server'

import { createMasterServerClient } from '@/lib/supabase/server'
import { createAsaasSubAccount, deleteAsaasSubAccountKey } from '@/lib/asaas-sub-account-manager'
import { generateFintechOnboardingEmailHtml } from '@/lib/email-templates'
import { sendPaymentEmailAction } from '@/app/actions/nexus-actions'
import { revalidatePath } from 'next/cache'

export async function createFintechSubAccount(formData: FormData) {
    const masterSupabase = await createMasterServerClient()
    const { data: { user } } = await masterSupabase.auth.getUser()

    if (!user) {
        return { error: 'Não autorizado' }
    }

    const brandingName = formData.get('brandingName') as string
    const email = formData.get('email') as string
    const cpfCnpj = formData.get('cpfCnpj') as string
    const phone = formData.get('phone') as string
    const accountType = formData.get('accountType') as 'product' | 'user'
    const clientId = formData.get('clientId') as string

    if (!brandingName || !email || !cpfCnpj) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    // 1. Buscar dados da Organização para KYC completo
    const { data: org } = await masterSupabase
        .from('organizations')
        .select('*')
        .eq('admin_id', clientId || user.id)
        .single()

    try {
        // 2. Criar no Asaas com dados completos
        const asaasResult = await createAsaasSubAccount({
            name: brandingName,
            email,
            cpfCnpj,
            phone,
            address: org?.address_street || org?.address?.street,
            addressNumber: org?.address_number || org?.address?.number,
            complement: org?.address_complement || org?.address?.complement,
            province: org?.address_neighborhood || org?.address?.neighborhood,
            city: org?.address_city || org?.address?.city,
            state: org?.address_state || org?.address?.state,
            postalCode: org?.address_zip || org?.address?.zip,
            personType: cpfCnpj.replace(/\D/g, "").length === 11 ? 'FISICA' : 'JURIDICA',
        })

        // 3. Salvar no Banco Master
        const { error: dbError } = await masterSupabase
            .from('asaas_sub_accounts')
            .insert({
                admin_id: clientId || user.id,
                asaas_id: asaasResult.asaasId,
                api_key: asaasResult.apiKey,
                wallet_id: asaasResult.walletId,
                account_type: accountType,
                branding_name: brandingName,
                status: 'active',
                onboarding_url: asaasResult.onboardingUrl,
                onboarding_status: 'PENDING',
                commercial_info_status: 'PENDING',
                documentation_status: 'PENDING',
                bank_account_info_status: 'PENDING',
                general_status: 'PENDING',
                postal_code: org?.address_zip || org?.address?.zip,
                address: org?.address_street || org?.address?.street,
                address_number: org?.address_number || org?.address?.number,
                city: org?.address_city || org?.address?.city,
                state: org?.address_state || org?.address?.state,
                agency: asaasResult.agency,
                account_number: asaasResult.accountNumber,
                account_digit: asaasResult.accountDigit,
            })

        if (dbError) {
            console.error('Erro ao salvar subconta no banco:', dbError)
            return { error: 'Subconta criada no Asaas, mas falhou ao salvar no banco local.' }
        }

        // 5. Send Onboarding Email
        if (asaasResult.onboardingUrl) {
            try {
                const emailHtml = generateFintechOnboardingEmailHtml({
                    officeName: org?.company_name || brandingName,
                    clientName: org?.company_name || brandingName,
                    onboardingUrl: asaasResult.onboardingUrl
                });

                await sendPaymentEmailAction({
                    to: email, // The notification email from the form
                    fullName: org?.company_name || brandingName,
                    subject: `Ative sua Identidade Fintech - ${org?.company_name || brandingName}`,
                    html: emailHtml,
                    senderName: 'Veritum PRO Fintech',
                    replyTo: org?.email || user.email
                });
                console.log('Onboarding email sent successfully to', email);
            } catch (emailError) {
                console.error('Failed to send onboarding email:', emailError);
                // We don't fail the whole action if email fails, as the sub-account is already created
            }
        }

        revalidatePath('/veritumpro/fintech')
        return { success: true, data: asaasResult }
    } catch (err: any) {
        console.error('Erro no checkout process:', err)
        return { error: err.message || 'Falha ao processar solicitação.' }
    }
}

export async function deleteFintechSubAccount(id: string) {
    const masterSupabase = await createMasterServerClient()
    const { data: { user } } = await masterSupabase.auth.getUser()

    if (!user) {
        return { error: 'Não autorizado' }
    }

    try {
        // 1. Buscar IDs e API Key antes de deletar do banco
        const { data: subAccount } = await masterSupabase
            .from('asaas_sub_accounts')
            .select('api_key, asaas_id')
            .eq('id', id)
            .single()

        if (subAccount?.api_key && subAccount?.asaas_id) {
            // 2. Tentar revogar no Asaas (opcional, não trava a deleção local se falhar)
            await deleteAsaasSubAccountKey(subAccount.asaas_id, subAccount.api_key)
        }

        // 3. Deletar do banco local
        const { error } = await masterSupabase
            .from('asaas_sub_accounts')
            .delete()
            .eq('id', id)

        if (error) throw error

        revalidatePath('/veritumpro/fintech')
        return { success: true }
    } catch (err: any) {
        console.error('Erro ao deletar subconta:', err)
        return { error: 'Falha ao remover subconta.' }
    }
}
