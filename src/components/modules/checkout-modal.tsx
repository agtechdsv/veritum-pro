"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    Lock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getPlans } from "@/app/actions/plan-actions";
import { Plan } from "@/types";
import { useTranslation } from "@/contexts/language-context";

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
    const [currentPlanIndex, setCurrentPlanIndex] = useState(0);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
    const [step, setStep] = useState<1 | 2>(1);

    // Form fields
    const [cpfCnpj, setCpfCnpj] = useState("");
    const [whatsapp, setWhatsapp] = useState("");
    const [installments, setInstallments] = useState("1");
    const [isCash, setIsCash] = useState(false);

    // Card fields
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");

    const lang = (locale as 'pt' | 'en' | 'es') || 'pt';

    const translations = {
        pt: {
            selectedSub: "Assinatura Selecionada",
            monthly: "Mensal",
            yearly: "Anual",
            original: "Original",
            savings: "Economia",
            totalValue: "Total",
            benefits: "Benefícios Inclusos",
            identification: "Identificação",
            step1: "Passo 1: Seus dados",
            document: "Documento (CPF ou CNPJ)",
            whatsapp: "WhatsApp",
            payment: "Pagamento",
            step2: "Passo 2: Ativação",
            pix: "PIX",
            boleto: "BOLETO",
            card: "CARTÃO",
            installments: "Parcelamento",
            cardNumber: "Número do cartão",
            cardName: "Nome no cartão",
            validity: "Validade",
            cvv: "CVV",
            secureEnv: "Ambiente seguro e criptografado. Sua assinatura será ativada instantaneamente após a confirmação.",
            confirmPay: "Confirmar e Pagar",
            securePayment: "Pagamento Seguro via ASAAS S.A.",
            congrats: "PARABÉNS!",
            successMsg: "Sua assinatura foi processada com sucesso. Aproveite todos os recursos.",
            startNow: "Começar Agora",
            cashPrice: "À vista no PIX/Boleto",
            cashLabel: "à vista",
            interestFree: "sem juros",
            payCash: "Pagar à vista com desconto anual",
            pixAuto: "Pix Automático",
            boletoRecurrent: "Boleto recorrente",
            cardRecurrent: "Cobrança Recorrente"
        },
        en: {
            selectedSub: "Selected Subscription",
            monthly: "Monthly",
            yearly: "Yearly",
            original: "Original",
            savings: "Savings",
            totalValue: "Total",
            benefits: "Included Benefits",
            identification: "Identification",
            step1: "Step 1: Your details",
            document: "Document (ID or Tax ID)",
            whatsapp: "WhatsApp",
            payment: "Payment",
            step2: "Step 2: Activation",
            pix: "PIX",
            boleto: "TICKET",
            card: "CARD",
            installments: "Installments",
            cardNumber: "Card Number",
            cardName: "Name on Card",
            validity: "Validity",
            cvv: "CVV",
            secureEnv: "Secure and encrypted environment. Your subscription will be activated instantly after confirmation.",
            confirmPay: "Confirm and Pay",
            securePayment: "Secure Payment via ASAAS S.A.",
            congrats: "CONGRATULATIONS!",
            successMsg: "Your subscription has been successfully processed. Enjoy all the features.",
            startNow: "Start Now",
            cashPrice: "Cash on PIX/Ticket",
            cashLabel: "cash",
            interestFree: "interest free",
            payCash: "Pay cash with yearly discount",
            pixAuto: "Automatic Pix",
            boletoRecurrent: "Recurring Ticket",
            cardRecurrent: "Recurring Charge"
        },
        es: {
            selectedSub: "Suscripción Seleccionada",
            monthly: "Mensual",
            yearly: "Anual",
            original: "Original",
            savings: "Ahorro",
            totalValue: "Total",
            benefits: "Beneficios Incluidos",
            identification: "Identificación",
            step1: "Paso 1: Sus datos",
            document: "Documento (DNI o RUC)",
            whatsapp: "WhatsApp",
            payment: "Pago",
            step2: "Paso 2: Activación",
            pix: "PIX",
            boleto: "BOLETO",
            card: "TARJETA",
            installments: "Cuotas",
            cardNumber: "Número de tarjeta",
            cardName: "Nombre en la tarjeta",
            validity: "Validez",
            cvv: "CVV",
            secureEnv: "Ambiente seguro y encriptado. Su suscripción se activará instantáneamente después de la confirmación.",
            confirmPay: "Confirmar y Pagar",
            securePayment: "Pago Seguro vía ASAAS S.A.",
            congrats: "¡FELICIDADES!",
            successMsg: "Su suscripción ha sido procesada con éxito. Disfrute de todas las funciones.",
            startNow: "Empezar Ahora",
            cashPrice: "Al contado en PIX/Boleto",
            cashLabel: "al contado",
            interestFree: "sin intereses",
            payCash: "Pagar al contado con descuento anual",
            pixAuto: "Pix Automático",
            boletoRecurrent: "Boleto recurrente",
            cardRecurrent: "Cobro Recurrente"
        }
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
        const loadPlans = async () => {
            const result = await getPlans();
            if (result.success && result.plans) {
                setPlans(result.plans);
                const index = result.plans.findIndex((p: Plan) => p.name === initialPlanName);
                if (index !== -1) setCurrentPlanIndex(index);
            }
        };
        if (isOpen) {
            loadPlans();
        }
    }, [isOpen, initialPlanName]);

    const handleClose = () => {
        setStep(1);
        onClose();
    };

    const nextPlan = () => {
        setCurrentPlanIndex((prev) => (prev + 1) % plans.length);
    };

    const prevPlan = () => {
        setCurrentPlanIndex((prev) => (prev - 1 + plans.length) % plans.length);
    };

    const currentPlan = plans[currentPlanIndex];
    if (!currentPlan && isOpen) return null;

    const calculatePricing = () => {
        if (!currentPlan) return { full: 0, discount: 0, total: 0, cashTotal: 0, discountPerc: 0 };
        const isMonthly = billingCycle === 'monthly';
        const basePrice = isMonthly ? currentPlan.monthly_price : currentPlan.yearly_price;
        const discountPerc = isMonthly ? (currentPlan.monthly_discount || 0) : (currentPlan.yearly_discount || 0);
        const discountValue = basePrice * (discountPerc / 100);
        const totalValue = basePrice - discountValue;

        let cashTotal = 0;
        if (!isMonthly && currentPlan.yearly_cash_discount) {
            cashTotal = totalValue * (1 - (currentPlan.yearly_cash_discount / 100));
        }

        return {
            full: basePrice,
            discount: discountValue,
            total: totalValue,
            cashTotal,
            discountPerc
        };
    };

    const { full, discount, total, cashTotal, discountPerc } = calculatePricing();

    const totalDisplay = isCash
        ? cashTotal
        : (billingCycle === 'monthly' ? total * parseInt(installments) : total);

    const formatPrice = (value: number) => {
        return new Intl.NumberFormat(lang === 'pt' ? 'pt-BR' : lang === 'es' ? 'es-ES' : 'en-US', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const installments_options = Array.from({
        length: billingCycle === 'monthly' ? 12 : (currentPlan?.installments || 1)
    }, (_, i) => {
        const count = i + 1;
        if (billingCycle === 'monthly') {
            return {
                value: `${count}`,
                label: `${count}x de ${formatPrice(total)}`
            };
        }
        return {
            value: `${count}`,
            label: `${count}x de ${formatPrice(total / count)} ${count === 1 ? t.cashLabel : t.interestFree}`
        };
    });

    const getPaymentTitle = () => {
        if (paymentMethod === 'pix') return t.pixAuto;
        if (paymentMethod === 'boleto') return t.boletoRecurrent;
        return t.cardRecurrent;
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
            <DialogContent className="max-w-6xl p-0 gap-0 overflow-hidden border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 sm:rounded-[3rem] shadow-2xl">
                <div className="flex flex-col md:flex-row h-full max-h-[90vh]">

                    {/* LEFT COLUMN (40%): Plan Info & Pricing */}
                    <div className="md:w-[40%] bg-slate-50 dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 p-8 md:p-12 flex flex-col relative overflow-hidden group">
                        {/* Plan Navigation Overlay Arrows */}
                        <div className="absolute top-10 right-10 flex gap-2 z-30">
                            <button onClick={prevPlan} className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 shadow-sm">
                                <ArrowLeft size={16} strokeWidth={3} />
                            </button>
                            <button onClick={nextPlan} className="p-2.5 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-400 hover:text-indigo-600 transition-all hover:scale-110 shadow-sm">
                                <ArrowRight size={16} strokeWidth={3} />
                            </button>
                        </div>

                        {/* Lock Icon Gradient */}
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shadow-2xl shadow-indigo-600/40 mb-10 border-2 border-slate-900 dark:border-white/20 ring-4 ring-slate-900/10 dark:ring-white/5">
                            <LockIcon size={24} className="drop-shadow-sm" />
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
                                        {currentPlan?.name}
                                    </DialogTitle>
                                    <p className="text-slate-600 dark:text-slate-400 text-sm font-bold leading-relaxed">
                                        {currentPlan?.short_desc?.[lang]}
                                    </p>
                                </div>

                                {/* Billing Cycle Toggle */}
                                <div className="flex bg-slate-200/50 dark:bg-slate-800/50 p-1 rounded-2xl w-fit mb-10 border border-slate-200/50 dark:border-slate-700/50">
                                    <button
                                        onClick={() => setBillingCycle('monthly')}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}`}
                                    >
                                        {t.monthly}
                                    </button>
                                    <button
                                        onClick={() => setBillingCycle('yearly')}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-md' : 'text-slate-400 hover:text-slate-500 dark:hover:text-slate-300'}`}
                                    >
                                        {t.yearly}
                                    </button>
                                </div>

                                {/* Values Breakdown */}
                                <div className="bg-white/40 dark:bg-white/5 backdrop-blur-md rounded-3xl p-6 border border-white/50 dark:border-white/10 mb-10 shadow-sm">
                                    <div className="space-y-2">
                                        {discountPerc > 0 && (
                                            <>
                                                <div className="flex justify-between text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                                    <span>{t.original}</span>
                                                    <span className="line-through">{formatPrice(full * (billingCycle === 'monthly' ? parseInt(installments) : 1))}</span>
                                                </div>
                                                <div className="flex justify-between text-[11px] font-bold text-emerald-500 uppercase tracking-widest">
                                                    <span>{t.savings} ({discountPerc}%)</span>
                                                    <span>- {formatPrice(discount * (billingCycle === 'monthly' ? parseInt(installments) : 1))}</span>
                                                </div>
                                            </>
                                        )}
                                        <div className={`${discountPerc > 0 ? 'pt-4 border-t border-slate-200/30 dark:border-white/10' : ''} flex flex-col items-end gap-1`}>
                                            <div className="flex justify-between items-end w-full">
                                                <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t.totalValue}</span>
                                                <span className="text-4xl font-black text-slate-950 dark:text-white tracking-tighter">{formatPrice(totalDisplay)}</span>
                                            </div>
                                            {billingCycle === 'yearly' && cashTotal > 0 && (
                                                <motion.div
                                                    animate={{ opacity: [0.6, 1, 0.6] }}
                                                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                                                    className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-1"
                                                >
                                                    {t.cashPrice}: {formatPrice(cashTotal)} (-{currentPlan.yearly_cash_discount}%)
                                                </motion.div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Features List */}
                                <div className="space-y-4">
                                    <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">{t.benefits}</h3>
                                    <ul className="space-y-3">
                                        {(currentPlan?.features?.[lang] || []).map((feature, i) => (
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

                    {/* RIGHT COLUMN (60%): Identity & Payment (Stacked) */}
                    <div className="md:w-[60%] flex flex-col bg-white dark:bg-slate-950 overflow-y-auto custom-scrollbar relative">
                        <button onClick={handleClose} className="absolute top-10 right-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all z-50 p-3 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full shadow-lg border border-slate-200/50 dark:border-slate-700/50">
                            <X size={20} strokeWidth={3} />
                        </button>

                        <div className="p-10 md:p-14 space-y-12">
                            {/* SECTION 1: IDENTITY */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-800">
                                        <User size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{t.identification}</h3>
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest italic">{t.step1}</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1">{t.document}</Label>
                                        <Input
                                            placeholder="000.000.000-00"
                                            value={cpfCnpj}
                                            onChange={handleCpfCnpjChange}
                                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold px-6 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[10px] uppercase font-black text-slate-400 tracking-wider ml-1">{t.whatsapp}</Label>
                                        <Input
                                            placeholder="(00) 00000-0000"
                                            value={whatsapp}
                                            onChange={handleWhatsAppChange}
                                            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold px-6 text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* SECTION 2: PAYMENT */}
                            <div className="space-y-8 pt-4">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-indigo-600 border border-slate-100 dark:border-slate-800">
                                        <CreditCard size={24} strokeWidth={2.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">{t.payment}</h3>
                                        <p className="text-slate-400 text-[11px] font-bold uppercase tracking-widest italic">{t.step2}</p>
                                    </div>
                                </div>

                                {/* Payment Method Selector */}
                                <div className="grid grid-cols-3 p-1.5 bg-slate-50 dark:bg-slate-900 rounded-2xl gap-1 border border-slate-100 dark:border-slate-800">
                                    {[
                                        { id: 'pix', label: t.pix, icon: Zap },
                                        { id: 'boleto', label: t.boleto, icon: FileText },
                                        { id: 'card', label: t.card, icon: CreditCard }
                                    ].map((method) => (
                                        <button
                                            key={method.id}
                                            onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                                            className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${paymentMethod === method.id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'}`}
                                        >
                                            <method.icon size={16} strokeWidth={3} />
                                            {method.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Installments / Card Details */}
                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        {billingCycle === 'yearly' && (paymentMethod === 'pix' || paymentMethod === 'boleto') && cashTotal > 0 && (
                                            <div
                                                onClick={() => setIsCash(!isCash)}
                                                className={`p-4 rounded-xl border transition-all cursor-pointer flex items-center gap-4 ${isCash ? 'bg-indigo-600 border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'}`}
                                            >
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isCash ? 'bg-white border-white' : 'border-slate-200'}`}>
                                                    {isCash && <Check size={14} className="text-indigo-600" strokeWidth={4} />}
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`text-[10px] font-black uppercase tracking-widest ${isCash ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                        {t.payCash}
                                                    </p>
                                                    <p className={`text-[11px] font-bold ${isCash ? 'text-white/80' : 'text-slate-500'}`}>
                                                        {formatPrice(cashTotal)} (-{currentPlan.yearly_cash_discount}%)
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {!isCash && (
                                            <div className="space-y-2">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">{getPaymentTitle()}</Label>
                                                <div className="relative group">
                                                    <select
                                                        value={installments}
                                                        onChange={(e) => setInstallments(e.target.value)}
                                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 h-12 rounded-xl px-8 font-black text-sm text-slate-900 dark:text-white appearance-none cursor-pointer focus:ring-2 focus:ring-indigo-500 outline-none transition-all shadow-sm"
                                                    >
                                                        {installments_options.map((opt) => (
                                                            <option key={opt.value} value={opt.value} className="bg-white dark:bg-slate-950">{opt.label}</option>
                                                        ))}
                                                    </select>
                                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300 group-hover:text-indigo-500 transition-colors">
                                                        <ArrowRight size={18} className="rotate-90" strokeWidth={3} />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {paymentMethod === 'card' && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                                            <div className="grid grid-cols-1 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.cardNumber}</Label>
                                                    <Input
                                                        placeholder="0000 0000 0000 0000"
                                                        value={cardNumber}
                                                        onChange={handleCardNumberChange}
                                                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold text-xs dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.cardName}</Label>
                                                    <Input
                                                        placeholder="NOME COMO NO CARTÃO"
                                                        value={cardName}
                                                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                                                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold text-xs dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.validity}</Label>
                                                    <Input
                                                        placeholder="MM/AA"
                                                        value={cardExpiry}
                                                        onChange={handleCardExpiryChange}
                                                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold text-xs dark:text-white"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t.cvv}</Label>
                                                    <Input
                                                        placeholder="000"
                                                        value={cardCvv}
                                                        onChange={handleCardCvvChange}
                                                        className="h-12 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800 font-bold text-xs dark:text-white"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="p-5 rounded-[1.5rem] bg-emerald-50/50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 flex items-center gap-4">
                                    <ShieldCheck className="text-emerald-500 shrink-0" size={24} strokeWidth={2.5} />
                                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-tighter leading-tight">
                                        {t.secureEnv}
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <button
                                        type="button"
                                        onClick={() => setStep(2)}
                                        className="w-full h-16 rounded-xl shadow-2xl hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-4 border-none cursor-pointer outline-none bg-indigo-600 hover:bg-indigo-700 text-white"
                                    >
                                        <span className="text-lg font-black uppercase tracking-[0.1em] text-white">
                                            {t.confirmPay}
                                        </span>
                                        <Zap size={24} className="fill-current text-yellow-400" />
                                    </button>

                                    <div className="flex items-center justify-center gap-2 text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                        <Lock size={10} className="shrink-0" />
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
                            <div className="w-28 h-28 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-2xl shadow-emerald-500/40 mb-10 relative">
                                <motion.div
                                    animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="absolute inset-0 rounded-full bg-emerald-500"
                                />
                                <CheckCircle2 size={56} strokeWidth={3} className="relative z-10" />
                            </div>
                            <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 italic leading-none">{t.congrats}</h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold text-lg max-w-sm mx-auto leading-relaxed mb-12">
                                {t.successMsg}
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 rounded-2xl mb-12 border border-slate-100 dark:border-slate-800">
                                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1">{t.totalValue}</p>
                                <p className="text-3xl font-black text-indigo-600">{formatPrice(totalDisplay)}</p>
                            </div>
                            <Button
                                className="h-16 px-16 rounded-2xl bg-slate-950 dark:bg-indigo-600 text-white font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl"
                                onClick={handleClose}
                            >
                                {t.startNow}
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </DialogContent>
        </Dialog>
    );
}
