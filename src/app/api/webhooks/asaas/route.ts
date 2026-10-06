import { NextResponse } from 'next/server';
import { createHash, timingSafeEqual } from 'crypto';
import { resolveTenantCredentialsByOwner } from '@/lib/tenant-credentials';
import { createClient } from '@supabase/supabase-js';

// Eventos que mudam o status da transacao original (alem de PAYMENT_RECEIVED/CONFIRMED, tratados a parte).
// O CHECK de financial_transactions.status so aceita Pago/Pendente/Cancelado; atraso e derivado da data de vencimento.
const STATUS_BY_EVENT: Record<string, string> = {
    PAYMENT_REFUNDED: 'Cancelado',
    PAYMENT_DELETED: 'Cancelado',
};

function isValidToken(received: string | null): boolean {
    const expected = process.env.ASAAS_WEBHOOK_TOKEN;
    if (!expected || !received) return false;
    // Compara hashes para tempo constante e tamanhos iguais
    const a = createHash('sha256').update(received).digest();
    const b = createHash('sha256').update(expected).digest();
    return timingSafeEqual(a, b);
}

export async function POST(req: Request) {
    // Falha fechada: sem token configurado no servidor ou token incorreto, nada e processado.
    if (!process.env.ASAAS_WEBHOOK_TOKEN) {
        console.error('[Asaas Webhook] ASAAS_WEBHOOK_TOKEN nao configurado no servidor.');
        return NextResponse.json({ error: 'Webhook nao configurado' }, { status: 503 });
    }
    if (!isValidToken(req.headers.get('asaas-access-token'))) {
        return NextResponse.json({ error: 'Nao autorizado' }, { status: 401 });
    }

    try {
        const payload = await req.json();
        const event = payload.event;
        const payment = payload.payment;

        console.log('[Asaas Webhook] Evento recebido:', event, 'Payment ID:', payment?.id);

        if (!payment || !payment.id) {
            return NextResponse.json({ error: 'Payload inválido' }, { status: 400 });
        }

        // Recuperar o Master Admin ID que enviamos na criação da cobrança
        const tenantId = payment.externalReference;
        if (!tenantId) {
            console.log('[Asaas Webhook] Ignorado: Sem externalReference (Não originado do Veritum Pro via Valorem)');
            return NextResponse.json({ received: true, ignored: 'no external reference' });
        }

        const isPaidEvent = event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED';
        const mappedStatus = STATUS_BY_EVENT[event];

        if (!isPaidEvent && !mappedStatus) {
            console.log(`[Asaas Webhook] Evento ${event} processado e ignorado com segurança.`);
            return NextResponse.json({ received: true, ignored: 'event type not handled' });
        }

        const credentials = await resolveTenantCredentialsByOwner(tenantId);
        if (!credentials.supabaseUrl || !credentials.supabaseAnonKey) {
            console.error('[Asaas Webhook] Falha: Credenciais do banco não encontradas para o tenant', tenantId);
            return NextResponse.json({ error: 'Credenciais NotFound' }, { status: 404 });
        }

        const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

        // Localiza a transação original no banco do cliente
        const { data: tx, error: findError } = await supabase
            .from('financial_transactions')
            .select('*')
            .eq('asaas_payment_id', payment.id)
            .single();

        if (findError || !tx) {
            console.error('[Asaas Webhook] Transação original não encontrada no banco do cliente. ID:', payment.id);
            return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
        }

        if (mappedStatus) {
            await supabase.from('financial_transactions').update({ status: mappedStatus }).eq('id', tx.id);
            console.log(`[Asaas Webhook] Transação ${tx.id} marcada como ${mappedStatus}.`);
            return NextResponse.json({ received: true, success: true });
        }

        // 1. Marcar a transação original como Paga para o cliente
        if (tx.status !== 'Pago') {
            await supabase
                .from('financial_transactions')
                .update({ status: 'Pago' })
                .eq('id', tx.id);
            console.log(`[Asaas Webhook] Transação principal ${tx.id} marcada como PAGO no banco do cliente.`);
        }

        // 2. Lançar a despesa da Taxa (Asaas fee + Veritum Split Markup)
        // O Asaas envia o 'netValue' (valor - taxa Asaas - split Veritum),
        // logo TotalCobrado - netValue = soma de todas as retenções.
        const taxaTotal = Number(payment.value) - Number(payment.netValue);

        if (taxaTotal > 0) {
            // Evita dupla inserção se o Asaas reenviar o webhook
            const { data: checkTaxa } = await supabase
                .from('financial_transactions')
                .select('id')
                .eq('title', 'Taxa de Serviço: Veritum Pay')
                .eq('asaas_payment_id', `${payment.id}-fee`)
                .maybeSingle();

            if (!checkTaxa) {
                await supabase.from('financial_transactions').insert({
                    title: 'Taxa de Serviço: Veritum Pay',
                    entry_type: 'Debit',
                    amount: taxaTotal,
                    category: 'Despesas Bancárias e Taxas',
                    status: 'Pago',
                    transaction_date: new Date().toISOString(),
                    person_id: tx.person_id,
                    asaas_payment_id: `${payment.id}-fee` // Rastreabilidade de que originou desta transação
                });
                console.log(`[Asaas Webhook] Despesa de Taxa (Spread+Fee) no valor de R$ ${taxaTotal} extraída com sucesso.`);
            }
        }

        return NextResponse.json({ received: true, success: true });
    } catch (error) {
        console.error('[Asaas Webhook] Erro Crítico:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
