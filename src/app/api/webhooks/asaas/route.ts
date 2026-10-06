import { NextResponse } from 'next/server';
import { getTenantCredentials } from '@/app/actions/tenant-actions';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
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

        if (event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED') {
            const credentials = await getTenantCredentials(tenantId);
            if (!credentials) {
                console.error('[Asaas Webhook] Falha: Credenciais do banco não encontradas para o tenant', tenantId);
                return NextResponse.json({ error: 'Credenciais NotFound' }, { status: 404 });
            }

            const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

            // 1. Marcar a transação original como Paga para o cliente
            const { data: tx, error: findError } = await supabase
                .from('financial_transactions')
                .select('*')
                .eq('asaas_payment_id', payment.id)
                .single();

            if (findError || !tx) {
                console.error('[Asaas Webhook] Transação original não encontrada no banco do cliente. ID:', payment.id);
                return NextResponse.json({ error: 'Transação não encontrada' }, { status: 404 });
            }

            // Atualiza o status
            await supabase
                .from('financial_transactions')
                .update({ 
                    status: 'Pago', 
                })
                .eq('id', tx.id);

            console.log(`[Asaas Webhook] Transação principal ${tx.id} marcada como PAGO no banco do cliente.`);

            // 2. Lançar a despesa da Taxa (Asaas fee + Veritum Split Markup)
            // A matemática aqui é fenomenal: O Asaas envia o 'netValue'.
            // O netValue é o valor da transação (- taxa Asaas) (- Split Veritum).
            // Logo: TotalCobrado - netValue = Exatamente a soma de todas as retenções.
            const taxaTotal = Number(payment.value) - Number(payment.netValue);
            
            if (taxaTotal > 0) {
                // Verificar se a taxa já foi lançada para evitar dupla inserção se houver duplo webhook call do Asaas
                const { data: checkTaxa } = await supabase
                    .from('financial_transactions')
                    .select('id')
                    .eq('title', 'Taxa de Serviço: Veritum Pay')
                    .eq('asaas_payment_id', `${payment.id}-fee`)
                    .single();

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
        }
        
        // Outros eventos (ex: OVERDUE para atrasos) podem ser adicionados no futuro
        console.log(`[Asaas Webhook] Evento ${event} processado e ignorado com segurança.`);
        return NextResponse.json({ received: true, ignored: 'event type not handled' });

    } catch (error) {
        console.error('[Asaas Webhook] Erro Crítico:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
