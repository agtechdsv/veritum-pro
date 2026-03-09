'use server'

import { createMasterServerClient } from '@/lib/supabase/server'
import { createAsaasSubAccount } from '@/lib/asaas-sub-account-manager'
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

    if (!brandingName || !email || !cpfCnpj) {
        return { error: 'Preencha todos os campos obrigatórios.' }
    }

    try {
        // 1. Criar no Asaas
        const asaasResult = await createAsaasSubAccount({
            name: brandingName,
            email,
            cpfCnpj,
            phone
        })

        // 2. Salvar no Banco Master
        const { error: dbError } = await masterSupabase
            .from('asaas_sub_accounts')
            .insert({
                admin_id: user.id,
                asaas_id: asaasResult.asaasId,
                api_key: asaasResult.apiKey,
                wallet_id: asaasResult.walletId,
                account_type: accountType,
                branding_name: brandingName,
                status: 'active'
            })

        if (dbError) {
            console.error('Erro ao salvar subconta no banco:', dbError)
            return { error: 'Subconta criada no Asaas, mas falhou ao salvar no banco local.' }
        }

        revalidatePath('/veritumpro/fintech')
        return { success: true }
    } catch (err: any) {
        console.error('Erro no checkout process:', err)
        return { error: err.message || 'Falha ao processar solicitação.' }
    }
}
