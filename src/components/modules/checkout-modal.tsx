"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle2,
    LockIcon,
    X,
    ArrowLeft,
    ArrowRight,
    Zap,
    CreditCard,
    FileText,
    Check,
    User,
    ShieldCheck,
    Shield,
    Lock,
    Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Database } from "lucide-react";
import { getPlans, getCloudPlans } from "@/app/actions/plan-actions";
import { Plan, CloudPlan } from "@/types";
import { useTranslation } from "@/contexts/language-context";
import { createBrowserClient } from "@supabase/ssr";
import { toast } from "../ui/toast";
import Link from 'next/link';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName?: string;
    moduleName?: string;
    type?: 'plan' | 'module';
}

type PaymentMethod = 'pix' | 'card' | 'boleto';

export function CheckoutModal({
    isOpen,
    onClose,
    planName: initialPlanName = "Plano Pro",
    moduleName,
    type = 'plan'
}: CheckoutModalProps) {
    const { locale } = useTranslation();
    const [plans, setPlans] = useState<Plan[]>([]);
    const [cloudPlans, setCloudPlans] = useState<CloudPlan[]>([]);
    const [selectedCloudPlanId, setSelectedCloudPlanId] = useState<string>('byodb');
    const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly'>('monthly');
    const [step, setStep] = useState<1 | 2>(1);

    // Form fields
    const [cpfCnpj, setCpfCnpj] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [hasPrepopulated, setHasPrepopulated] = useState(false);
    const [installments, setInstallments] = useState("1");
    const [isCash, setIsCash] = useState(true); // Default to full payment (incentivizes PIX)

    // Card fields
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState<any>(null);
    const [isPopupBlocked, setIsPopupBlocked] = useState(false);

    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const lang = (locale as 'pt' | 'en' | 'es') || 'pt';

    const translations = {
        pt: {
            selectedSub: "Assinatura Selecionada",
            monthly: "Mensal",
            quarterly: "Trimestral",
            semiannual: "Semestral",
            yearly: "Anual",
            original: "Original",
            savings: "Economia",
            totalValue: "Total",
            benefits: "Benefícios Inclusos",
            identification: "Identificação",
            step1: "Passo 1: Seus dados",
            document: "Documento (CPF ou CNPJ)",
            whatsapp: "WhatsApp",
            payment: "Ativação",
            step2: "Passo 2: Resumo",
            pix: "PIX",
            boleto: "BOLETO",
            card: "CARTÃO",
            installments: "Parcelamento",
            secureEnv: "Ambiente 100% seguro. Pagamento processado via Asaas. Sem juros, sem taxas ocultas e cancelamento a qualquer momento direto pelo seu painel.",
            confirmPay: "Confirmar e Pagar",
            securePayment: "Pagamento Seguro via ASAAS S.A.",
            congrats: "PARABÉNS!",
            successMsg: "Sua assinatura foi processada com sucesso. Aproveite todos os recursos.",
            startNow: "Começar Agora",
            cashPrice: "À vista no PIX/Boleto",
            cashLabel: "à vista",
            interestFree: "sem juros",
            payFull: "Pagar à Vista",
            payInstallments: "Parcelar (até 12x)",
            redirectMsg: "Você será redirecionado para o ambiente de pagamento seguro do Asaas.",
            incentiveMsg: "Prepare-se para transformar sua produtividade. Escolha o ciclo que garante sua paz mental e aproveite nossos descontos progressivos — sua advocacia agradece a previsibilidade!",
            paymentReady: "PAGAMENTO GERADO!",
            paymentReadyMsg: "Sua cobrança foi preparada. Clique no botão abaixo para abrir o ambiente seguro de pagamento do Asaas e concluir a ativação.",
            goToPayment: "Abrir Checkout Asaas",
            planDiscountLabel: "Desconto Plano",
            cashDiscountLabel: "Bônus à Vista",
            popupBlocked: "⚠️ Janela bloqueada pelo navegador. Clique no botão 'Permitir' na barra de endereços para autorizar o checkout do ASAAS, ou clique no botão abaixo para concluir o pagamento agora.",
            subscriptionNoteTitle: "Economize seu limite",
            subscriptionNoteDesc: "Diferente de uma compra comum, apenas o valor do ciclo atual será lançado no seu cartão. Seu limite de crédito permanece livre!",
            byodbAlertTitle: "⚠️ Atenção: Arquitetura BYODB",
            byodbAlertMsg: "Você selecionou a arquitetura BYODB. Lembra-se: você será o responsável pela conexão, segurança e backup do banco de dados nos seus próprios servidores.",
            byodbAlertUpsell: "Prefere que a gente cuide de tudo? Conheça o Veritum Cloud Gerenciada (+ R$ 49,90/mês)",
            infraTitle: "Infraestrutura",
            infraSubtitle: "Aonde seus dados vão morar?",
            byodbTitle: "BYODB (Local)",
            byodbSovereignty: "Soberania Total",
            byodbDesc: "Conecte aos seus servidores (AWS, Google, On-Premise). Zero custo extra de nuvem para nós. Você cuida da T.I, banco e backups.",
            systemLabel: "Sistema",
            infraCloudLabel: "Infra (Cloud)",
            totalSavings: "Economia Total",
            equivalentTo: "Equivalente a",
            perMonth: "/ mês"
        },
        en: {
            selectedSub: "Selected Subscription",
            monthly: "Monthly",
            quarterly: "Quarterly",
            semiannual: "Semi-Annual",
            yearly: "Yearly",
            original: "Original",
            savings: "Savings",
            totalValue: "Total",
            benefits: "Included Benefits",
            subscriptionNoteTitle: "Save your card limit",
            subscriptionNoteDesc: "Unlike a regular purchase, only the current cycle value will be charged. Your credit limit stays free for your daily needs!",
            identification: "Identification",
            step1: "Step 1: Your details",
            document: "Document (ID or Tax ID)",
            whatsapp: "WhatsApp",
            payment: "Activation",
            step2: "Step 2: Summary",
            pix: "PIX",
            boleto: "TICKET",
            card: "CARD",
            installments: "Installments",
            secureEnv: "Secure and encrypted environment. Your subscription will be activated instantly after confirmation.",
            confirmPay: "Confirm and Pay",
            securePayment: "Secure Payment via ASAAS S.A.",
            congrats: "CONGRATULATIONS!",
            successMsg: "Your subscription has been successfully processed. Enjoy all the features.",
            startNow: "Start Now",
            cashPrice: "Cash on PIX/Ticket",
            cashLabel: "cash",
            interestFree: "interest free",
            payFull: "Pay in Full",
            payInstallments: "Installments (up to 12x)",
            redirectMsg: "You will be redirected to the secure Asaas payment environment.",
            incentiveMsg: "Get ready to transform your productivity with Veritum Pro's exclusive tools. We're almost there!",
            paymentReady: "PAYMENT READY!",
            paymentReadyMsg: "Your payment has been prepared. Click the button below to open the secure Asaas payment environment and complete the activation.",
            goToPayment: "Open Asaas Checkout",
            planDiscountLabel: "Plan Discount",
            cashDiscountLabel: "Cash Bonus",
            popupBlocked: "⚠️ Popup blocked by browser! Click the 'Allow' button in the address bar to authorize the ASAAS checkout, or click the button below to complete the payment now.",
            byodbAlertTitle: "⚠️ Attention: BYODB Architecture",
            byodbAlertMsg: "You have selected the BYODB architecture. Remember: you will be responsible for the connection, security, and backup of the database on your own servers.",
            byodbAlertUpsell: "Prefer us to handle everything? Discover Veritum Managed Cloud (+ R$ 49.90/month)",
            infraTitle: "Infrastructure",
            infraSubtitle: "Where will your data live?",
            byodbTitle: "BYODB (Local)",
            byodbSovereignty: "Total Sovereignty",
            byodbDesc: "Connect to your servers (AWS, Google, On-Premise). Zero extra cloud cost for us. You handle IT, database, and backups.",
            systemLabel: "System",
            infraCloudLabel: "Infra (Cloud)",
            totalSavings: "Total Savings",
            equivalentTo: "Equivalent to",
            perMonth: "/ month"
        },
        es: {
            selectedSub: "Suscripción Seleccionada",
            monthly: "Mensual",
            quarterly: "Trimestral",
            semiannual: "Semestral",
            yearly: "Anual",
            original: "Original",
            savings: "Ahorro",
            totalValue: "Total",
            benefits: "Beneficios Incluidos",
            subscriptionNoteTitle: "Ahorre su límite",
            subscriptionNoteDesc: "A diferencia de una compra normal, solo se cargará el valor del ciclo actual en su tarjeta. ¡Su límite de crédito permanece libre!",
            identification: "Identificación",
            step1: "Paso 1: Sus datos",
            document: "Documento (DNI o RUC)",
            whatsapp: "WhatsApp",
            payment: "Activación",
            step2: "Paso 2: Resumen",
            pix: "PIX",
            boleto: "BOLETO",
            card: "TARJETA",
            installments: "Cuotas",
            secureEnv: "Ambiente seguro y encriptado. Su suscripción se activará instantáneamente después de la confirmación.",
            confirmPay: "Confirmar y Pagar",
            securePayment: "Pago Seguro vía ASAAS S.A.",
            congrats: "¡FELICIDADES!",
            successMsg: "Su suscripción ha sido procesada con éxito. Disfrute de todas las funciones.",
            startNow: "Empezar Ahora",
            cashPrice: "Al contado en PIX/Boleto",
            cashLabel: "al contado",
            interestFree: "sin intereses",
            payFull: "Pagar al Contado",
            payInstallments: "Cuotas (hasta 12x)",
            redirectMsg: "Será redirigido al entorno de pago seguro de Asaas.",
            incentiveMsg: "¡Prepárate para transformar tu productividad con las herramientas exclusivas de Veritum Pro. ¡Ya casi llegamos!",
            paymentReady: "¡PAGO GENERADO!",
            paymentReadyMsg: "Su cobro ha sido preparado. Haga clic en el botón de abajo para abrir el entorno seguro de pago de Asaas y completar la activación.",
            goToPayment: "Abrir Checkout Asaas",
            planDiscountLabel: "Descuento Plan",
            cashDiscountLabel: "Bono al Contado",
            popupBlocked: "⚠️ ¡Ventana bloqueada! Sugerimos hacer clic en 'Siempre permitir ventanas emergentes' en la barra de direcciones de su navegador, o use el botón de abajo para completar ahora.",
            byodbAlertTitle: "⚠️ Atención: Arquitectura BYODB",
            byodbAlertMsg: "Has seleccionado la arquitectura BYODB. Recuerda: tú serás el responsable de la conexión, seguridad y copia de seguridad de la base de datos en tus propios servidores.",
            byodbAlertUpsell: "¿Prefieres que nos encarguemos de todo? Conoce Veritum Cloud Gestionada (+ R$ 49,90/mes)",
            infraTitle: "Infraestructura",
            infraSubtitle: "¿Dónde vivirán sus datos?",
            byodbTitle: "BYODB (Local)",
            byodbSovereignty: "Soberanía Total",
            byodbDesc: "Conecte a sus servidores (AWS, Google, On-Premise). Sin costo extra de nube para nosotros. Usted se encarga de T.I., base de datos y copias de seguridad.",
            systemLabel: "Sistema",
            infraCloudLabel: "Infra (Cloud)",
            totalSavings: "Ahorro Total",
            equivalentTo: "Equivalente a",
            perMonth: "/ mes"
        },
    };

    const t = translations[lang];

    // Mask Handlers
    const handleCpfCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 14) value = value.slice(0, 14);

        if (value.length <= 11) {
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d)/, "$1.$2");
            value = value.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
        } else {
            value = value.replace(/^(\d{2})(\d)/, "$1.$2");
            value = value.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
            value = value.replace(/\.(\d{3})(\d)/, ".$1/$2");
            value = value.replace(/(\d{4})(\d{1,2})$/, "$1-$2");
        }
        setCpfCnpj(value);
    };

    const handleWhatsAppChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 11) value = value.slice(0, 11);

        if (value.length > 10) {
            value = value.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
        } else if (value.length > 5) {
            value = value.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
        } else if (value.length > 2) {
            value = value.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
        } else if (value.length > 0) {
            value = value.replace(/^(\d*)/, "($1");
        }
        setWhatsapp(value);
    };

    const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 16) value = value.slice(0, 16);
        value = value.replace(/(\d{4})(?=\d)/g, "$1 ");
        setCardNumber(value);
    };

    const handleCardExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 4) value = value.slice(0, 4);
        if (value.length >= 3) {
            value = value.replace(/(\d{2})(\d{2})/, "$1/$2");
        }
        setCardExpiry(value);
    };

    const handleCardCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/\D/g, "");
        if (value.length > 3) value = value.slice(0, 3);
        setCardCvv(value);
    };

    useEffect(() => {
        const loadPlansAndUser = async () => {
            // Load Plans
            const [result, cloudResult] = await Promise.all([
                getPlans(),
                getCloudPlans()
            ]);

            if (result.success && result.plans) {
                setPlans(result.plans);
                const index = result.plans.findIndex((p: Plan) => {
                    if (typeof p.name === 'object') {
                        return p.name.pt === initialPlanName || p.name.en === initialPlanName || p.name.es === initialPlanName;
                    }
                    return p.name === initialPlanName;
                });
                if (index !== -1) setCurrentPlanIndex(index);
            }

            if (cloudResult.success && cloudResult.plans) {
                setCloudPlans(cloudResult.plans);
            }

            // Load User Data for pre-population
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: profile } = await supabase
                    .from("users")
                    .select("cpf_cnpj, phone")
                    .eq("id", authUser.id)
                    .maybeSingle();

                if (profile) {
                    if (profile.cpf_cnpj && !cpfCnpj) {
                        // Apply CPF/CNPJ mask
                        let val = profile.cpf_cnpj.replace(/\D/g, "");
                        if (val.length <= 11) {
                            val = val.replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                        } else {
                            val = val.replace(/^(\d{2})(\d)/, "$1.$2").replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3").replace(/\.(\d{3})(\d)/, ".$1/$2").replace(/(\d{4})(\d{1,2})$/, "$1-$2");
                        }
                        setCpfCnpj(val);
                    }
                    if (profile.phone && !whatsapp) {
                        // Apply WhatsApp mask
                        let val = profile.phone.replace(/\D/g, "");
                        if (val.length > 10) {
                            val = val.replace(/^(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
                        } else if (val.length > 5) {
                            val = val.replace(/^(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
                        } else if (val.length > 2) {
                            val = val.replace(/^(\d{2})(\d{0,5})/, "($1) $2");
                        } else if (val.length > 0) {
                            val = val.replace(/^(\d*)/, "($1");
                        }
                        setWhatsapp(val);
                    }
                }
            }
        };

        if (isOpen) {
            loadPlansAndUser();
        }
    }, [isOpen, initialPlanName]);

    const handleClose = () => {
        setStep(1);
        setIsPopupBlocked(false);
        onClose();
    };



    const prevPlan = () => {
        if (plans.length === 0) return;
        setCurrentPlanIndex((prev) => (prev - 1 + plans.length) % plans.length);
    };

    const nextPlan = () => {
        if (plans.length === 0) return;
        setCurrentPlanIndex((prev) => (prev + 1) % plans.length);
    };

    const currentPlan = plans[currentPlanIndex];

    const pFeatures = currentPlan?.features ? (typeof currentPlan.features === 'string' ? JSON.parse(currentPlan.features) : currentPlan.features) : {};
    const rawFeatures = pFeatures?.[lang] || pFeatures?.pt || pFeatures;
    const displayFeatures = Array.isArray(rawFeatures) ? rawFeatures : (typeof rawFeatures === 'object' && rawFeatures !== null ? Object.values(rawFeatures) : []);

    const calculatePricing = () => {
        if (!currentPlan) return { full: 0, currentDiscountValue: 0, currentTotal: 0, currentDiscountPerc: 0, cloudDiscountPerc: 0, monthlyEquivalent: 0, baseTotal: 0, cloudTotal: 0 };

        const basePrice = currentPlan.monthly_price || 0;
        let months = 1;
        let discountPerc = 0;

        switch (billingCycle) {
            case 'monthly':
                months = 1;
                discountPerc = currentPlan.monthly_discount || 0;
                break;
            case 'quarterly':
                months = 3;
                discountPerc = currentPlan.quarterly_discount || 0;
                break;
            case 'semiannual':
                months = 6;
                discountPerc = currentPlan.semiannual_discount || 0;
                break;
            case 'yearly':
                months = 12;
                discountPerc = currentPlan.yearly_discount || 0;
                break;
        }

        const baseFull = basePrice * months;
        const baseTotal = baseFull * (1 - (discountPerc / 100));

        let cloudFull = 0;
        let cloudTotal = 0;
        let cloudDiscountPerc = 0;

        if (selectedCloudPlanId !== 'byodb') {
            const cp = cloudPlans.find(c => c.id === selectedCloudPlanId);
            if (cp) {
                const cloudBase = cp.price_monthly || 0;
                let cDiscount = 0;
                if (billingCycle === 'monthly') cDiscount = cp.discounts?.monthly || 0;
                if (billingCycle === 'quarterly') cDiscount = cp.discounts?.quarterly || 0;
                if (billingCycle === 'semiannual') cDiscount = cp.discounts?.semiannual || 0;
                if (billingCycle === 'yearly') cDiscount = cp.discounts?.yearly || 0;

                cloudDiscountPerc = cDiscount;
                cloudFull = cloudBase * months;
                cloudTotal = cloudFull * (1 - (cDiscount / 100));
            }
        }

        const fullPrice = baseFull + cloudFull;
        const currentTotal = baseTotal + cloudTotal;
        const currentDiscountValue = fullPrice - currentTotal;
        const monthlyEquivalent = currentTotal / months;

        return {
            full: fullPrice,
            currentDiscountValue,
            currentTotal,
            currentDiscountPerc: discountPerc,
            cloudDiscountPerc,
            monthlyEquivalent,
            baseTotal,
            cloudTotal
        };
    };

    const { full, currentDiscountValue, currentTotal, currentDiscountPerc, cloudDiscountPerc, monthlyEquivalent, baseTotal, cloudTotal } = calculatePricing();

    const totalDisplay = currentTotal;

    const hasAnyDiscount = currentDiscountValue > 0;

    const formatPrice = (value: number) => {
        return new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const getSummaryText = () => {
        let cycleText = t.monthly;
        if (billingCycle === 'quarterly') cycleText = t.quarterly;
        if (billingCycle === 'semiannual') cycleText = t.semiannual;
        if (billingCycle === 'yearly') cycleText = t.yearly;

        const name = typeof currentPlan?.name === 'object' ? (currentPlan.name[lang as keyof typeof currentPlan.name] || currentPlan.name.pt) : currentPlan?.name;

        return lang === 'pt' ? `Você selecionou o ${name} com faturamento ${cycleText.toLowerCase()}.` :
            lang === 'es' ? `Has seleccionado el ${name} con facturación ${cycleText.toLowerCase()}.` :
                `You selected the ${name} with ${cycleText.toLowerCase()} billing.`;
    };

    const handlePayment = async () => {
        if (!cpfCnpj || !whatsapp) {
            toast.error(lang === 'pt' ? "Preencha seus dados de identificação no Passo 1." : "Please fill your identification data in Step 1.");
            return;
        }

        setIsLoading(true);
        setIsPopupBlocked(false);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                toast.error("Sessão expirada. Faça login novamente.");
                setIsLoading(false);
                return;
            }

            const planNameStr = typeof currentPlan.name === 'object' ? (currentPlan.name[lang as keyof typeof currentPlan.name] || currentPlan.name.pt) : currentPlan.name;

            const payload = {
                planName: planNameStr,
                cloudPlanId: selectedCloudPlanId,
                billingCycle,
                billingType: "UNDEFINED", // Let Asaas handle choice
                cpfCnpj: cpfCnpj.replace(/\D/g, ''),
                phone: whatsapp.replace(/\D/g, ''),
                installments: "1", // Recurrence is 1 cycle at a time
                returnUrl: window.location.hostname === 'localhost'
                    ? 'https://www.veritumpro.com'
                    : window.location.origin,
            };

            const { data, error } = await supabase.functions.invoke('asaas-checkout', {
                body: payload,
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setPaymentResult(data);
            console.log("Asaas Checkout Response Data:", data);

            // Redirect to Asaas Checkout (Opening in a new tab as before)
            if (data.invoiceUrl) {
                // Try automatic open, but Step 2 will have the fallback button
                const popup = window.open(data.invoiceUrl, '_blank');
                if (!popup || popup.closed || typeof popup.closed === 'undefined') {
                    setIsPopupBlocked(true);
                } else {
                    setIsPopupBlocked(false);
                }
            }

            setStep(2);
        } catch (err: any) {
            console.error("Payment error details:", err);
            const errorMsg = err.message || "Erro ao processar redirecionamento.";
            const details = err.details ? `\nDetalhes: ${err.details}` : "";
            toast.error(errorMsg + details);
        } finally {
            setIsLoading(false);
        }
    };

    // Realtime Listener for payment status OR user plan update
    useEffect(() => {
        if (step !== 2) return;

        const subscriptions: any[] = [];

        // 1. Listen to the specific payment
        if (paymentResult?.localPaymentId) {
            const paymentChannel = supabase
                .channel(`payment-${paymentResult.localPaymentId}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'payments',
                        filter: `id=eq.${paymentResult.localPaymentId}`
                    },
                    (payload) => {
                        const newStatus = payload.new.status;
                        if (newStatus === 'paid' || newStatus === 'received' || newStatus === 'confirmed') {
                            toast.success(lang === 'pt' ? "Pagamento confirmado! Atualizando..." : "Payment confirmed! Refreshing...");
                            setTimeout(() => {
                                window.location.reload();
                            }, 1500);
                        }
                    }
                )
                .subscribe();
            subscriptions.push(paymentChannel);
        }

        // 2. Listen to the user's profile for plan updates (Fallback/Double-check)
        const setupUserListener = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.id) {
                const userChannel = supabase
                    .channel(`user-plan-${session.user.id}`)
                    .on(
                        'postgres_changes',
                        {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'users',
                            filter: `id=eq.${session.user.id}`
                        },
                        (payload) => {
                            if (payload.new.plan_id !== payload.old.plan_id || payload.new.plan_name !== payload.old.plan_name) {
                                toast.success(lang === 'pt' ? "Sua assinatura foi ativada! Atualizando agora..." : "Your subscription has been activated! Refreshing now...");
                                setTimeout(() => {
                                    window.location.reload();
                                }, 1500);
                            }
                        }
                    )
                    .subscribe();
                subscriptions.push(userChannel);
            }
        };

        setupUserListener();

        return () => {
            subscriptions.forEach(s => {
                if (s && typeof s.unsubscribe === 'function') s.unsubscribe();
                else supabase.removeChannel(s);
            });
        };
    }, [paymentResult?.localPaymentId, step, supabase, lang]);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-[1300px] w-[95vw] p-0 gap-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sm:rounded-[3rem] shadow-2xl">
                <div className="flex flex-col xl:flex-row h-full max-h-[90vh]">

                    {/* COL 1: SW Plan & Pricing */}
                    <div className="xl:w-[360px] xl:flex-none bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-8 flex flex-col relative overflow-y-auto custom-scrollbar">
                        {/* Plan Navigation Overlay Arrows */}
                        <div className="flex justify-end gap-2 z-30 mb-4">
                            <button onClick={prevPlan} className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 shadow-sm">
                                <ArrowLeft size={16} strokeWidth={3} />
                            </button>
                            <button onClick={nextPlan} className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 shadow-sm">
                                <ArrowRight size={16} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Lock Icon Gradient */}
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-8 border-2 border-slate-900 dark:border-white/20 ring-4 ring-slate-900/10 dark:ring-white/5">
                            <LockIcon size={20} className="drop-shadow-sm" />
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={currentPlan?.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="flex flex-col flex-1 z-10"
                            >
                                <div className="space-y-4 mb-8">
                                    <h2 className="text-[10px] font-black tracking-[0.2em] text-indigo-600 uppercase">
                                        {t.selectedSub}
                                    </h2>
                                    <DialogTitle className="text-4xl font-black tracking-tighter text-slate-900 dark:text-white leading-tight">
                                        {typeof currentPlan?.name === 'object' ? (currentPlan.name[lang as keyof typeof currentPlan.name] || currentPlan.name.pt) : currentPlan?.name}
                                    </DialogTitle>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-bold leading-relaxed">
                                        {typeof currentPlan?.short_desc === 'object' ? (currentPlan.short_desc[lang] || currentPlan.short_desc.pt) : currentPlan?.short_desc}
                                    </p>
                                </div>


                                <div className="mb-10 p-5 rounded-3xl bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800/50 flex gap-4 items-start shadow-sm">
                                    <div className="bg-indigo-100 dark:bg-indigo-800 p-2 rounded-xl text-indigo-600 dark:text-indigo-400">
                                        <Shield size={18} strokeWidth={3} />
                                    </div>
                                    <div className="space-y-1">
                                        <h5 className="text-[11px] font-black uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                                            {t.subscriptionNoteTitle}
                                        </h5>
                                        <p className="text-[10px] font-bold text-indigo-600/70 dark:text-indigo-400/70 leading-relaxed">
                                            {t.subscriptionNoteDesc}
                                        </p>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">{t.benefits}</h3>
                                    <ul className="space-y-3 pb-8">
                                        {displayFeatures.map((feature: any, i: number) => (
                                            <li key={i} className="flex items-start gap-4 text-xs text-slate-700 dark:text-slate-300">
                                                <div className="rounded-full p-1 bg-emerald-500 text-white shrink-0 shadow-lg shadow-emerald-500/20">
                                                    <Check size={10} strokeWidth={4} />
                                                </div>
                                                <span className="font-bold pt-0.5">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    {/* COL 2: Infra & Cloud Plans */}
                    <div className="xl:w-[420px] xl:flex-none bg-slate-100/50 dark:bg-slate-900/50 border-r border-slate-100 dark:border-slate-800 p-8 flex flex-col overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/20">
                                <Database size={24} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{t.infraTitle}</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{t.infraSubtitle}</p>
                            </div>
                        </div>

                        <div className="space-y-4">


                            {/* BYODB Card */}
                            <div
                                onClick={() => setSelectedCloudPlanId('byodb')}
                                className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all relative overflow-hidden ${selectedCloudPlanId === 'byodb' ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-[0_8px_30px_rgb(79,70,229,0.12)]' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-300/50'}`}
                            >
                                <div className="flex items-start justify-between mb-2">
                                    <div>
                                        <h4 className={`text-lg font-black ${selectedCloudPlanId === 'byodb' ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>{t.byodbTitle}</h4>
                                        <div className="text-sm font-black text-slate-500 mt-1">{t.byodbSovereignty}</div>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedCloudPlanId === 'byodb' ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300 dark:border-slate-700'}`}>
                                        {selectedCloudPlanId === 'byodb' && <Check size={14} strokeWidth={4} className="text-white" />}
                                    </div>
                                </div>
                                <p className={`text-[11px] font-medium leading-relaxed mt-3 ${selectedCloudPlanId === 'byodb' ? 'text-indigo-700/80 dark:text-indigo-300/80' : 'text-slate-500'}`}>
                                    {t.byodbDesc}
                                </p>
                            </div>

                            {/* Cloud Plans from API */}
                            {cloudPlans.map(cp => {
                                const isSelected = selectedCloudPlanId === cp.id;
                                const planName = cp.name[lang as keyof typeof cp.name] || cp.name.pt;
                                const planSubtitle = cp.subtitle[lang as keyof typeof cp.subtitle] || cp.subtitle.pt;
                                const badgeText = cp.badge ? (cp.badge[lang as keyof typeof cp.badge] || cp.badge.pt) : null;
                                const price = cp.price_monthly;

                                return (
                                    <div
                                        key={cp.id}
                                        onClick={() => setSelectedCloudPlanId(cp.id)}
                                        className={`p-5 rounded-[1.5rem] border-2 cursor-pointer transition-all relative overflow-hidden ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 shadow-[0_8px_30px_rgb(79,70,229,0.12)]' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-300/50'}`}
                                    >
                                        <div className="relative z-10">
                                            {badgeText && (
                                                <div className={`inline-block mb-3 px-2.5 py-1 text-[8px] font-black uppercase tracking-widest rounded-full border ${isSelected ? 'bg-indigo-600/10 text-indigo-700 dark:text-indigo-300 border-indigo-600/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'}`}>
                                                    {badgeText}
                                                </div>
                                            )}

                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className={`text-lg font-black ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-slate-800 dark:text-slate-200'}`}>
                                                    {planName}
                                                </h4>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 dark:border-slate-700'}`}>
                                                    {isSelected && <Check size={14} strokeWidth={4} />}
                                                </div>
                                            </div>

                                            <div className="flex items-baseline gap-1 mt-1 mb-3">
                                                <span className={`text-xl font-black ${isSelected ? 'text-indigo-900 dark:text-indigo-100' : 'text-indigo-600 dark:text-indigo-400'}`}>+ {formatPrice(price)}</span>
                                                <span className={`text-[10px] font-bold uppercase tracking-widest ${isSelected ? 'text-indigo-900/50 dark:text-indigo-100/50' : 'text-slate-400'}`}>{t.perMonth}</span>

                                                {/* Calculate Equivalent if billing cycle > monthly */}
                                                {billingCycle !== 'monthly' && cp.discounts && (
                                                    <span className={`ml-2 text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-md ${isSelected ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                                                        {billingCycle === 'yearly' && cp.discounts.yearly ? `-${cp.discounts.yearly}% OFF` : ''}
                                                        {billingCycle === 'semiannual' && cp.discounts.semiannual ? `-${cp.discounts.semiannual}% OFF` : ''}
                                                        {billingCycle === 'quarterly' && cp.discounts.quarterly ? `-${cp.discounts.quarterly}% OFF` : ''}
                                                    </span>
                                                )}
                                            </div>

                                            <p className={`text-[11px] font-medium leading-relaxed ${isSelected ? 'text-indigo-700/80 dark:text-indigo-300/80' : 'text-slate-500'}`}>
                                                {planSubtitle}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* COL 3: Identity & Payment */}
                    <div className="xl:flex-1 flex flex-col bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar relative p-8 md:p-10">
                        <button onClick={handleClose} className="absolute top-8 right-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all z-50 p-2.5 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                            <X size={18} strokeWidth={3} />
                        </button>

                        <div className="space-y-5">
                            {/* Unified Billing Cycle Selector */}
                            <div className="grid grid-cols-4 gap-1 bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-xl w-full border border-slate-200/50 dark:border-slate-700/50 mt-2">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                                >
                                    {t.monthly}
                                </button>
                                <button
                                    onClick={() => setBillingCycle('quarterly')}
                                    className={`px-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${billingCycle === 'quarterly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                                >
                                    {t.quarterly}
                                </button>
                                <button
                                    onClick={() => setBillingCycle('semiannual')}
                                    className={`px-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${billingCycle === 'semiannual' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                                >
                                    {t.semiannual}
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-1 py-2 rounded-lg text-[8px] font-black uppercase tracking-tighter transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}
                                >
                                    {t.yearly}
                                </button>
                            </div>

                            {/* Values Breakdown */}
                            <div className="bg-slate-50 dark:bg-slate-900 rounded-3xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm mt-2">
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                                        <div className="flex flex-col">
                                            <span>{t.systemLabel} {currentDiscountPerc > 0 ? <span className="text-[10px] text-emerald-500 font-black tracking-tighter ml-1">(-{currentDiscountPerc}%)</span> : ''}</span>
                                        </div>
                                        <span>{formatPrice(baseTotal)}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs font-bold text-slate-500 uppercase tracking-widest pb-2 border-b border-slate-200 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <span>{t.infraCloudLabel} {selectedCloudPlanId !== 'byodb' && cloudDiscountPerc > 0 ? <span className="text-[10px] text-emerald-500 font-black tracking-tighter ml-1">(-{cloudDiscountPerc}%)</span> : ''}</span>
                                        </div>
                                        <span>{selectedCloudPlanId === 'byodb' ? formatPrice(0) : formatPrice(cloudTotal)}</span>
                                    </div>

                                    {hasAnyDiscount && (
                                        <>
                                            <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                                                <span>{t.original}</span>
                                                <span className="line-through">{formatPrice(full)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[11px] font-bold text-emerald-500 uppercase tracking-widest gap-2 mt-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="truncate">{t.planDiscountLabel} {t.totalSavings}</span>
                                                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 text-[9px] font-black shadow-sm">
                                                        {Math.round(((full - currentTotal) / full) * 100)}% OFF
                                                    </span>
                                                </div>
                                                <span className="whitespace-nowrap">- {formatPrice(currentDiscountValue)}</span>
                                            </div>
                                        </>
                                    )}
                                    <div className={`${hasAnyDiscount ? 'pt-3 border-t border-slate-200/50 dark:border-slate-800' : 'pt-2'} flex flex-col items-end gap-1 mt-1`}>
                                        <div className="flex justify-between items-end w-full">
                                            <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.totalValue}</span>
                                            <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tracking-tighter">{formatPrice(totalDisplay)}</span>
                                        </div>
                                        {billingCycle !== 'monthly' && (
                                            <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mt-1 animate-in fade-in slide-in-from-right-2">
                                                {t.equivalentTo} {formatPrice(monthlyEquivalent)} {t.perMonth}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 1: IDENTITY */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-800">
                                        <User size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{t.identification}</h3>
                                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest italic">{t.step1}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] uppercase font-black text-slate-400 tracking-wider ml-1">{t.document}</Label>
                                        <Input
                                            placeholder="000.000.000-00"
                                            value={cpfCnpj}
                                            onChange={handleCpfCnpjChange}
                                            className="h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[9px] uppercase font-black text-slate-400 tracking-wider ml-1">{t.whatsapp}</Label>
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            value={whatsapp}
                                            onChange={handleWhatsAppChange}
                                            className="h-10 rounded-lg bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold px-4 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="hidden"></div>
                                </div>
                            </div>

                            {/* SECTION 2: PAYMENT */}
                            <div className="space-y-4 pt-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-800">
                                        <Zap size={20} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{t.payment}</h3>
                                        <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest italic">{t.step2}</p>
                                    </div>
                                </div>

                                {/* Step 2: Summary View */}
                                <div className="space-y-3">
                                    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm">
                                        <h4 className="text-[9px] font-black uppercase tracking-widest text-indigo-600 mb-2">{t.step2}</h4>
                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-tight mb-2">
                                            {getSummaryText()}
                                        </p>

                                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic">
                                            "{t.incentiveMsg}"
                                        </p>
                                        <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                            <p className="text-[10px] font-bold text-slate-600 dark:text-slate-400">
                                                {t.redirectMsg}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-3">
                                    <ShieldCheck className="text-emerald-500 shrink-0" size={20} strokeWidth={2.5} />
                                    <p className="text-[9px] font-bold text-emerald-700 dark:text-emerald-400 tracking-tighter leading-tight">
                                        {t.secureEnv}
                                    </p>
                                </div>

                                <div className="space-y-2.5">
                                    <button
                                        type="button"
                                        onClick={handlePayment}
                                        disabled={isLoading}
                                        className="w-full h-12 rounded-xl shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-3 border-none cursor-pointer outline-none bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-70 disabled:cursor-not-allowed"
                                    >
                                        <span className="text-sm font-black uppercase tracking-[0.1em] text-white">
                                            {isLoading ? (lang === 'pt' ? 'Processando...' : 'Processing...') : t.confirmPay}
                                        </span>
                                        {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Zap size={18} className="fill-current text-yellow-400" />}
                                    </button>

                                    <div className="flex items-center justify-center gap-1.5 text-[7px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        <Lock size={8} className="shrink-0" />
                                        <span>{t.securePayment}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* SUCCESS OVERLAY */}
                <AnimatePresence>
                    {step === 2 && (
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 z-[100] bg-white dark:bg-slate-950 flex flex-col items-center justify-center p-12 text-center"
                        >
                            <button
                                onClick={handleClose}
                                className="absolute top-10 right-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all z-[110] p-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50"
                            >
                                <X size={20} strokeWidth={3} />
                            </button>
                            <div className="w-28 h-28 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-10 relative">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 rounded-full bg-emerald-500"
                                />
                                <CheckCircle2 size={56} strokeWidth={3} className="relative z-10" />
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 italic leading-none">
                                {paymentResult?.invoiceUrl ? t.paymentReady : t.congrats}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg max-w-sm mx-auto leading-relaxed mb-12">
                                {paymentResult?.invoiceUrl ? t.paymentReadyMsg : t.successMsg}
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-8 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.totalValue}</p>
                                <p className="text-3xl font-black text-indigo-600">{formatPrice(totalDisplay)}</p>
                            </div>

                            {isPopupBlocked && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mb-10 p-6 bg-amber-50 dark:bg-amber-900/20 border-2 border-dashed border-amber-300 dark:border-amber-800 rounded-[2rem] text-amber-800 dark:text-amber-400 text-xs font-bold leading-relaxed max-w-sm"
                                >
                                    {t.popupBlocked}
                                </motion.div>
                            )}
                            <Button
                                className="h-16 px-16 rounded-2xl bg-indigo-600 text-white font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                onClick={() => {
                                    if (paymentResult?.invoiceUrl) {
                                        window.open(paymentResult.invoiceUrl, '_blank');
                                    } else {
                                        setStep(1);
                                        setPaymentResult(null);
                                        onClose();
                                    }
                                }}
                            >
                                {paymentResult?.invoiceUrl ? t.goToPayment : t.startNow}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog >
    );
}
