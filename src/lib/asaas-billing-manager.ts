import { createMasterClient } from '@/lib/supabase/master';

/**
 * Interface para a carga útil da criação de cobranças
 */
export interface PaymentPayload {
    subAccountApiKey: string;
    customerAsaasId?: string;
    customerData?: {
        name: string;
        cpfCnpj: string;
        email?: string;
        phone?: string;
    };
    value: number;
    description: string;
    dueDate: string;
    billingType: 'UNDEFINED' | 'BOLETO' | 'CREDIT_CARD' | 'PIX';
    masterWalletId: string;
    masterMarkupValue: number; // Ex: 0.50 (O lucro da plataforma Veritum)
    externalReference?: string;
}

/**
 * Obtém dinamicamente o Wallet ID da conta Master do Asaas
 * Necessário para enviar o Split de Pagamento
 */
export async function getMasterWalletId(): Promise<string> {
    const rawUrl = process.env.ASAAS_URL || "https://api.asaas.com/v3";
    const ASAAS_API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;
    
    let ASAAS_MASTER_KEY = process.env.ASAAS_API_KEY || process.env.CHAVE_ASAAS_MESTRE;
    if (process.env.ASAAS_KEY_B64) {
        ASAAS_MASTER_KEY = Buffer.from(process.env.ASAAS_KEY_B64, 'base64').toString('utf-8');
    }

    if (!ASAAS_MASTER_KEY) {
        throw new Error("Chave ASAAS Master não configurada.");
    }

    // Buscar carteiras do Mestre
    const res = await fetch(`${ASAAS_API_URL}/wallets`, {
        method: 'GET',
        headers: { 'access_token': ASAAS_MASTER_KEY }
    });

    const data = await res.json();
    if (!res.ok) {
        console.error("Erro ao buscar Wallet ID Master:", data);
        throw new Error("Falha ao identificar a carteira Master no Asaas.");
    }

    const defaultWallet = data.data?.[0]?.id;
    if (!defaultWallet) {
        throw new Error("Nenhuma carteira encontrada na conta Master.");
    }

    return defaultWallet;
}

/**
 * Gera uma cobrança no Asaas em nome da Subconta, mas com Split automático para a Master.
 */
export async function createAsaasPaymentWithSplit(payload: PaymentPayload) {
    const rawUrl = process.env.ASAAS_URL || "https://api.asaas.com/v3";
    const ASAAS_API_URL = rawUrl.endsWith('/') ? rawUrl.slice(0, -1) : rawUrl;

    let customerId = payload.customerAsaasId;

    // 1. Criar ou buscar o Cliente final dentro da Subconta do Asaas
    if (!customerId && payload.customerData) {
        // Verificar se já existe um cliente com esse CPF/CNPJ
        const searchRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${payload.customerData.cpfCnpj.replace(/\D/g, '')}`, {
            headers: { 'access_token': payload.subAccountApiKey }
        });
        const searchData = await searchRes.json();
        
        if (searchData.data && searchData.data.length > 0) {
            customerId = searchData.data[0].id;
        } else {
            // Criar novo cliente
            const customerRes = await fetch(`${ASAAS_API_URL}/customers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'access_token': payload.subAccountApiKey
                },
                body: JSON.stringify(payload.customerData)
            });
            
            const customerJson = await customerRes.json();
            if (!customerRes.ok) {
                console.error("Erro ao criar Customer no Asaas (Subconta):", customerJson);
                throw new Error(customerJson.errors?.[0]?.description || 'Erro ao cadastrar cliente no Asaas da subconta');
            }
            customerId = customerJson.id;
        }
    }

    if (!customerId) throw new Error('Cliente pagador não pode ser identificado ou criado.');

    // 2. Gerar cobrança aplicando o Split de R$ 0,50
    const body: any = {
        customer: customerId,
        billingType: payload.billingType,
        value: payload.value,
        dueDate: payload.dueDate,
        description: payload.description,
        externalReference: payload.externalReference,
        split: [
            {
                walletId: payload.masterWalletId,
                fixedValue: payload.masterMarkupValue // Aqui está a mágica do lucro invisível
            }
        ]
    };

    const paymentRes = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'access_token': payload.subAccountApiKey
        },
        body: JSON.stringify(body)
    });

    const paymentJson = await paymentRes.json();
    if (!paymentRes.ok) {
        console.error("Erro ao gerar Payment no Asaas com Split:", paymentJson);
        throw new Error(paymentJson.errors?.[0]?.description || 'Erro na comunicação de faturamento com o Asaas');
    }

    return {
        id: paymentJson.id,
        invoiceUrl: paymentJson.invoiceUrl,
        bankSlipUrl: paymentJson.bankSlipUrl,
        netValue: paymentJson.netValue, 
        originalValue: paymentJson.value
    };
}
