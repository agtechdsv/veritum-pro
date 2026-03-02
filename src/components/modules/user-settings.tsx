
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPreferences, Plan, Suite, Feature, ModuleId } from '@/types';
import {
    Database, Key, Globe, Save, ShieldCheck, AlertCircle, Building2,
    Crown, Zap, CheckCircle2, ArrowRight, FileText, Scale, DollarSign,
    Calendar, Search, Mic, Trash2, CreditCard
} from 'lucide-react';
import { createMasterClient } from '@/lib/supabase/master';
import { toast } from '../ui/toast';
import OrganizationForm from '../ui/organization-form';
import { useTranslation } from '@/contexts/language-context';
import { getFeatures, getPlanPermissions } from '@/app/actions/plan-actions';
import { CheckoutModal } from './checkout-modal';
import { Filter, ChevronDown } from 'lucide-react';

interface Props {
    user: User;
    preferences: UserPreferences;
    onUpdateUser: (u: User) => void;
    onUpdatePrefs: (p: UserPreferences) => void;
    initialTab?: 'org' | 'plan' | 'cancel';
}

const UserSettings: React.FC<Props> = ({ user, preferences, onUpdatePrefs, initialTab }) => {
    const { t, locale } = useTranslation();
    const isSubscriptionAdmin = user.role === 'Master' ||
        ['Sócio-Administrador', 'Sócio Administrador', 'Administrador'].includes(user.role);

    const [activeTab, setActiveTab] = useState<'org' | 'plan' | 'cancel'>(initialTab || 'org');

    // Plan Hub States
    const [loadingPlanData, setLoadingPlanData] = useState(false);
    const [planData, setPlanData] = useState<{
        plans: Plan[];
        suites: Suite[];
        features: Feature[];
        userPermissions: string[];
    } | null>(null);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly'>('monthly');
    const [modulesBillingCycle, setModulesBillingCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly'>('monthly');

    // Checkout States
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState<{ planName?: string; moduleName?: string; type: 'plan' | 'module' }>({ type: 'plan' });

    // Cancellation States
    const [cancelReasons, setCancelReasons] = useState<number[]>([]);
    const [cancelFeedback, setCancelFeedback] = useState<string>('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    // Master Selector States
    const isMaster = user.role === 'Master';
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>(user.id);
    const [targetUser, setTargetUser] = useState<User>(user);
    const [loadingTarget, setLoadingTarget] = useState(false);

    const supabase = createMasterClient();

    useEffect(() => {
        if (isMaster && allUsers.length === 0) {
            fetchAllUsers();
        }
    }, [isMaster]);

    useEffect(() => {
        if (selectedUserId === user.id) {
            setTargetUser(user);
            if (activeTab === 'plan') fetchPlanData(user.id);
        } else {
            fetchTargetUser(selectedUserId);
        }
    }, [selectedUserId, activeTab]);

    const fetchAllUsers = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('role', ['Sócio-Administrador', 'Sócio Administrador'])
            .order('name', { ascending: true });

        if (!error && data) {
            setAllUsers(data as User[]);
        }
    };

    const fetchTargetUser = async (uid: string) => {
        setLoadingTarget(true);
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, plans(name)')
                .eq('id', uid)
                .single();

            if (!error && data) {
                const u = data as any;
                // Normalize plan name if fetched from join
                const targetU: User = {
                    ...u,
                    plan_name: u.plans?.name || u.plan_name
                };
                setTargetUser(targetU);
                if (activeTab === 'plan') fetchPlanData(uid);
            }
        } catch (err) {
            console.error('Error fetching target user:', err);
        } finally {
            setLoadingTarget(false);
        }
    };

    const fetchPlanData = async (uid: string) => {
        setLoadingPlanData(true);
        try {
            const [suitesRes, plansRes, featuresRes] = await Promise.all([
                supabase.from('suites').select('*').order('order_index', { ascending: true }),
                supabase.from('plans').select('*').eq('active', true).order('order_index', { ascending: true }),
                getFeatures()
            ]);

            // Need the specific user's plan for permissions
            const { data: userCurrent } = await supabase.from('users').select('plan_id, role').eq('id', uid).single();

            let userPermissions: string[] = [];
            if (userCurrent?.plan_id) {
                const permRes = await getPlanPermissions(userCurrent.plan_id);
                if (permRes.success) {
                    userPermissions = permRes.permissions || [];
                }
            } else if (userCurrent?.role === 'Master') {
                if (featuresRes.success && featuresRes.features) {
                    userPermissions = featuresRes.features.map(f => f.id);
                }
            }

            if (!suitesRes.error && !plansRes.error && featuresRes.success) {
                setPlanData({
                    suites: suitesRes.data as Suite[],
                    plans: plansRes.data as Plan[],
                    features: featuresRes.features as Feature[],
                    userPermissions
                });
            }
        } catch (err) {
            console.error('Error fetching plan data:', err);
        } finally {
            setLoadingPlanData(false);
        }
    };

    const handleCheckout = (type: 'plan' | 'module', name: string) => {
        setCheckoutData({ type, [type === 'plan' ? 'planName' : 'moduleName']: name });
        setIsCheckoutOpen(true);
    };

    const handleCancelSubscription = async () => {
        if (cancelReasons.length === 0) {
            toast.error(t('management.settings.plan.cancelReasonLabel'));
            return;
        }

        setIsCancelling(true);
        try {
            const reasonText = cancelReasons
                .map(idx => t(`management.settings.plan.cancelReasonOption${idx}`))
                .join(', ');

            const { data, error } = await supabase.functions.invoke('asaas-cancel-subscription', {
                body: { reason: reasonText, feedback: cancelFeedback }
            });

            if (error) throw error;
            toast.success(t('management.settings.plan.cancelSuccess'));
            setTimeout(() => window.location.reload(), 2000);
        } catch (err: any) {
            toast.error(t('management.settings.plan.cancelError'));
        } finally {
            setIsCancelling(false);
        }
    };

    const renderPriceDetails = (p: Plan, cycle: string) => {
        const basePrice = p.monthly_price || 0;
        let months = 1;
        let discount = 0;

        if (cycle === 'monthly') { months = 1; discount = p.monthly_discount || 0; }
        else if (cycle === 'quarterly') { months = 3; discount = p.quarterly_discount || 0; }
        else if (cycle === 'semiannual') { months = 6; discount = p.semiannual_discount || 0; }
        else if (cycle === 'yearly') { months = 12; discount = p.yearly_discount || 0; }

        const fullPrice = basePrice * months;
        const finalPrice = discount > 0 ? fullPrice * (1 - discount / 100) : fullPrice;
        const installmentValue = finalPrice / (p.installments || (cycle === 'monthly' ? 1 : months));
        const originalPrice = fullPrice;

        return { finalPrice, discount, installmentValue, months, originalPrice };
    };

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            {/* Master Context Selector */}
            {isMaster && (
                <div className="flex justify-center mb-0">
                    <div className="relative group/filter z-50">
                        <div className="flex items-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                            <Filter size={18} className="text-amber-500" />
                            <select
                                className="bg-transparent outline-none appearance-none pr-8 cursor-pointer font-black uppercase tracking-tight"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                            >
                                <option value={user.id}>{t('management.users.masterFilter.self') || 'MEU PRÓPRIO CONTEXTO'}</option>
                                <optgroup label={t('management.users.masterFilter.clients') || 'CLIENTES'}>
                                    {allUsers.filter(u => u.id !== user.id).map(c => (
                                        <option key={c.id} value={c.id}>🏢 {(typeof c.name === 'object' ? ((c.name as any).pt || (c.name as any).en || '') : (c.name || '')).toUpperCase()} ({c.email})</option>
                                    ))}
                                </optgroup>
                            </select>
                            <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                    </div>
                </div>
            )}

            {/* Header & Tabs */}
            <div className="flex flex-col items-center">
                <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 md:gap-4 mb-8">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{isMaster && selectedUserId !== user.id ? `Perfil: ${typeof targetUser.name === 'object' ? ((targetUser.name as any).pt || (targetUser.name as any).en) : targetUser.name}` : t('management.settings.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase text-[10px] opacity-70">Workspace Hub</p>
                </div>

                <div className="flex bg-slate-100 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
                    <button
                        onClick={() => setActiveTab('org')}
                        className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 ${activeTab === 'org'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xl border border-slate-200 dark:border-slate-700'
                            : 'text-slate-400 hover:text-slate-600'
                            }`}
                    >
                        <Building2 size={14} /> {t('management.settings.tabs.org')}
                    </button>
                    <button
                        onClick={() => setActiveTab('plan')}
                        className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 ${activeTab === 'plan'
                            ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-xl border border-slate-200 dark:border-slate-700'
                            : 'text-slate-400 hover:text-amber-500'
                            }`}
                    >
                        <Crown size={14} /> {t('management.settings.tabs.plan')}
                    </button>
                    <button
                        onClick={() => setActiveTab('cancel')}
                        className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all flex items-center gap-2 ${activeTab === 'cancel'
                            ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xl border border-slate-200 dark:border-slate-700'
                            : 'text-slate-400 hover:text-rose-500'
                            }`}
                    >
                        <AlertCircle size={14} /> {t('management.settings.plan.cancelSubscription')}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                {activeTab === 'org' && <OrganizationForm adminId={targetUser.id} />}

                {activeTab === 'plan' && (
                    <div className="space-y-12 animate-in slide-in-from-right-8 duration-500">
                        {loadingPlanData ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('management.settings.plan.syncing') || 'Sincronizando Ecossistema...'}</p>
                            </div>
                        ) : planData ? (
                            <>
                                {/* Current Plan Header */}
                                <section className="bg-gradient-to-br from-amber-500 to-orange-600 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all hover:scale-[1.01]">
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full mb-6">
                                                <Crown size={14} className="text-amber-100" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-50">{t('management.settings.plan.currentPlan')}</span>
                                            </div>
                                            <h3 className="text-5xl font-black uppercase tracking-tighter mb-2">
                                                {typeof targetUser.plan_name === 'object' ? ((targetUser.plan_name as any)[locale] || (targetUser.plan_name as any).pt) : (targetUser.plan_name || (planData?.plans.find(p => p.id === targetUser.plan_id)?.name as any)?.[locale] || (planData?.plans.find(p => p.id === targetUser.plan_id)?.name as any)?.pt || 'Veritum PRO trial')}
                                            </h3>
                                            <p className="text-amber-100 font-bold opacity-80 uppercase tracking-widest text-xs">{t('management.settings.plan.planAccess')}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCheckout('plan', 'Veritum Pro (Upgrade)')}
                                            className="bg-white text-orange-600 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 w-full md:w-auto"
                                        >
                                            <Zap size={18} className="fill-current" />
                                            {t('management.settings.plan.upgrade') || 'Fazer Upgrade'}
                                        </button>
                                    </div>
                                    <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
                                        <Crown size={300} />
                                    </div>
                                </section>

                                {/* Modules Section */}
                                <div className="space-y-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                        <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{t('management.settings.plan.ecosystemModules')}</h3>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {planData.suites.map((suite) => {
                                            const suiteFeatures = planData.features.filter((f: Feature) => f.suite_id === suite.id);
                                            const userFeaturesInSuite = suiteFeatures.filter((f: Feature) => planData.userPermissions.includes(f.id));
                                            const hasAllFeatures = suiteFeatures.length > 0 && userFeaturesInSuite.length === suiteFeatures.length;

                                            return (
                                                <div key={suite.id} className={`p-6 rounded-[2rem] border transition-all ${hasAllFeatures ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`p-3 rounded-xl ${hasAllFeatures ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-200 text-slate-400'}`}>
                                                            {/* Simple icon logic based on name or ID */}
                                                            <Database size={24} />
                                                        </div>
                                                        <span className={`flex items-center gap-1.5 px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full ${hasAllFeatures ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                            {hasAllFeatures ? <><CheckCircle2 size={12} /> {t('management.settings.plan.statusUnlocked')}</> : t('management.settings.plan.statusLocked')}
                                                        </span>
                                                    </div>
                                                    <h4 className={`text-sm font-black mb-1 ${hasAllFeatures ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>
                                                        {typeof suite.name === 'object' ? (suite.name[locale as keyof typeof suite.name] || suite.name.pt) : suite.name}
                                                    </h4>
                                                    <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                                                        {suite.short_desc?.[locale as keyof typeof suite.short_desc] || suite.short_desc?.pt || 'Módulo inteligente de gestão.'}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Commercial Plans Section */}
                                <div className="space-y-8 pt-6">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{t('management.settings.plan.commercialPlans')}</h3>
                                        </div>
                                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl">
                                            {['monthly', 'quarterly', 'semiannual', 'yearly'].map((cycle) => (
                                                <button
                                                    key={cycle}
                                                    onClick={() => setBillingCycle(cycle as any)}
                                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${billingCycle === cycle ? 'bg-white dark:bg-slate-700 text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {cycle === 'monthly' ? t('management.settings.plan.monthly') : cycle === 'quarterly' ? t('management.settings.plan.quarterly') : cycle === 'semiannual' ? t('management.settings.plan.semiannual') : t('management.settings.plan.yearly')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {planData.plans.filter(p => p.is_combo).map((p) => {
                                            const { finalPrice, discount, installmentValue, months, originalPrice } = renderPriceDetails(p, billingCycle);
                                            const isCurrent = p.id === targetUser.plan_id;

                                            return (
                                                <div key={p.id} className={`relative p-8 rounded-[2.5rem] border flex flex-col h-full transition-all group ${isCurrent ? 'bg-white border-amber-300 shadow-2xl scale-105 z-10' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200'}`}>
                                                    {p.recommended && (
                                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black uppercase px-6 py-2 rounded-full shadow-lg z-20">Recomendado</div>
                                                    )}
                                                    <h4 className={`text-xl font-black uppercase tracking-tighter mb-2 ${isCurrent ? 'text-indigo-600' : 'text-slate-800 dark:text-white'}`}>
                                                        {(p.name as any)?.[locale] || (p.name as any)?.pt}
                                                    </h4>
                                                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 min-h-[20px]">
                                                        {(p as any).short_desc?.[locale] || (p as any).short_desc?.pt || (p as any).description?.[locale] || (p as any).description?.pt}
                                                    </p>

                                                    <div className="mb-8 items-baseline">
                                                        <div className="flex flex-col mb-1">
                                                            {discount > 0 && (
                                                                <span className="text-xs text-rose-500 font-black line-through opacity-70 mb-1">
                                                                    R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            )}
                                                            <div className="flex items-baseline gap-1 relative">
                                                                <span className={`text-xs font-bold uppercase tracking-widest ${isCurrent ? 'text-slate-500' : 'text-slate-400'}`}>R$</span>
                                                                <span className={`text-5xl font-black ${isCurrent ? 'text-slate-900' : 'text-slate-900 dark:text-white'}`}>{(finalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                                {discount > 0 && <span className="absolute -top-6 right-0 bg-emerald-500 text-white text-[10px] font-black px-2 py-1 rounded-lg animate-pulse">{discount}% OFF</span>}
                                                            </div>
                                                        </div>
                                                        {billingCycle !== 'monthly' && (
                                                            <p className="text-[10px] font-bold text-emerald-600 mt-2 italic">ou {months}x de R$ {installmentValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} sem juros</p>
                                                        )}
                                                    </div>

                                                    <ul className="space-y-4 mb-10 flex-1">
                                                        {((p.features as any)?.[locale] || (p.features as any)?.pt || []).map((feat: string, i: number) => (
                                                            <li key={i} className={`flex items-start gap-2 text-[10px] font-bold ${isCurrent ? 'text-slate-700' : 'text-slate-600 dark:text-slate-400'}`}>
                                                                <CheckCircle2 size={14} className="text-emerald-500 shrink-0 mt-0.5" /> {feat}
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <button
                                                        onClick={() => handleCheckout('plan', typeof p.name === 'object' ? (p.name[locale as keyof typeof p.name] || p.name.pt) : p.name)}
                                                        disabled={isCurrent}
                                                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all shadow-lg ${isCurrent ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                                                    >
                                                        {isCurrent ? t('management.settings.plan.current') : t('management.settings.plan.acquirePlan')}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Standalone Modules Section (Módulos Avulsos) */}
                                <div className="space-y-8 pt-12 border-t border-slate-100 dark:border-slate-800">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">{t('management.settings.plan.aLaCarteModules')}</h3>
                                        </div>
                                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-xl">
                                            {['monthly', 'quarterly', 'semiannual', 'yearly'].map((cycle) => (
                                                <button
                                                    key={cycle}
                                                    onClick={() => setModulesBillingCycle(cycle as any)}
                                                    className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${modulesBillingCycle === cycle ? 'bg-white dark:bg-slate-700 text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {cycle === 'monthly' ? t('management.settings.plan.monthly') : cycle === 'quarterly' ? t('management.settings.plan.quarterly') : cycle === 'semiannual' ? t('management.settings.plan.semiannual') : t('management.settings.plan.yearly')}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                        {planData.plans.filter(p => !p.is_combo).map((p) => {
                                            const { finalPrice, discount, installmentValue, months, originalPrice } = renderPriceDetails(p, modulesBillingCycle);
                                            const pNamePt = (p.name as any)?.pt || '';
                                            const hasModule = planData.userPermissions.some(perm => pNamePt.toLocaleLowerCase().includes(perm.toLocaleLowerCase()));

                                            return (
                                                <div key={p.id} className={`p-8 rounded-[2.5rem] border flex flex-col h-full transition-all hover:shadow-xl ${hasModule ? 'bg-white border-emerald-100 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200'}`}>
                                                    <h4 className="text-lg font-black uppercase tracking-tighter mb-1 text-slate-800 dark:text-white">
                                                        {(p.name as any)?.[locale] || (p.name as any)?.pt}
                                                    </h4>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">{t('management.settings.plan.individualModule')}</p>

                                                    <div className="mb-8 items-baseline">
                                                        <div className="flex flex-col mb-1">
                                                            {discount > 0 && (
                                                                <span className="text-[10px] text-rose-500 font-black line-through opacity-70 mb-1">
                                                                    R$ {originalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                                                </span>
                                                            )}
                                                            <div className="flex items-baseline gap-1 relative">
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">R$</span>
                                                                <span className="text-4xl font-black text-slate-900 dark:text-white">{(finalPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                                                <span className="text-[10px] font-bold text-slate-400 ml-1 uppercase">/mês</span>
                                                                {discount > 0 && <span className="absolute -top-6 right-0 bg-indigo-500 text-white text-[9px] font-black px-2 py-1 rounded-lg">-{discount}% Off</span>}
                                                            </div>
                                                        </div>
                                                        {modulesBillingCycle !== 'monthly' && (
                                                            <p className="text-[9px] font-bold text-indigo-600 mt-2 italic">ou {months} meses de contrato</p>
                                                        )}
                                                    </div>

                                                    <ul className="space-y-3 mb-10 flex-1">
                                                        {(p.features?.[locale as keyof typeof p.features] || p.features?.pt || []).slice(0, 4).map((feat: string, i: number) => (
                                                            <li key={i} className="flex items-start gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                                <div className="w-1 h-1 bg-indigo-400 rounded-full mt-1.5 shrink-0" /> {feat}
                                                            </li>
                                                        ))}
                                                    </ul>

                                                    <button
                                                        onClick={() => handleCheckout('module', typeof p.name === 'object' ? (p.name[locale as keyof typeof p.name] || p.name.pt) : p.name)}
                                                        className={`w-full py-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${hasModule ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-white text-slate-900 border-2 border-slate-200 hover:border-indigo-600'}`}
                                                    >
                                                        {hasModule ? t('management.settings.plan.liberated') : t('management.settings.plan.acquireModule')}
                                                    </button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </>
                        ) : null}
                    </div>
                )}

                {activeTab === 'cancel' && (
                    <div className="w-full py-10 animate-in zoom-in duration-500">
                        <div className="text-center mb-12">
                            <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(244,63,94,0.2)]">
                                <AlertCircle size={40} className="text-rose-500" />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 uppercase">{t('management.settings.plan.cancelTitle')}</h2>
                            <p className="text-slate-500 font-bold italic text-sm max-w-lg mx-auto leading-relaxed">{t('management.settings.plan.cancelSubtitle')}</p>
                        </div>

                        <div className="space-y-8 bg-[#0f172a] p-10 rounded-[3rem] border border-slate-800 shadow-2xl">
                            <div className="space-y-6">
                                <label className="block text-[10px] font-black text-rose-500 uppercase tracking-[0.2em] ml-1">{t('management.settings.plan.cancelReasonLabel')} *</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[1, 2, 3, 4, 5].map((idx) => {
                                        const label = t(`management.settings.plan.cancelReasonOption${idx}`) || (
                                            idx === 1 ? 'Preço muito alto' :
                                                idx === 2 ? 'Dificuldade de uso' :
                                                    idx === 3 ? 'Falta de recursos necessários' :
                                                        idx === 4 ? 'Migrando para outro software' : 'Outro motivo'
                                        );
                                        const isSelected = cancelReasons.includes(idx);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => setCancelReasons(prev => prev.includes(idx) ? prev.filter(r => r !== idx) : [...prev, idx])}
                                                className={`p-5 rounded-2xl border-2 transition-all font-black uppercase tracking-widest text-[11px] flex items-center justify-between text-left group ${isSelected ? 'bg-[#ff0055] border-[#ff0055] text-white' : 'bg-[#1e293b]/50 border-slate-800 text-slate-400 hover:border-slate-700'}`}
                                            >
                                                <span>{label}</span>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-white border-white' : 'border-slate-700 group-hover:border-slate-500'}`}>
                                                    {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-[#ff0055]" />}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 pt-6 border-t border-slate-800">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">{t('management.settings.plan.cancelFeedbackPlaceholder')}</label>
                                <textarea
                                    value={cancelFeedback}
                                    onChange={e => setCancelFeedback(e.target.value)}
                                    placeholder={t('management.settings.plan.cancelFeedbackPlaceholder')}
                                    rows={4}
                                    className="w-full p-6 bg-[#1e293b]/30 border-2 border-slate-800 rounded-[2rem] outline-none focus:border-[#ff0055] transition-all font-bold text-white placeholder:text-slate-700"
                                />
                            </div>

                            {!showCancelConfirm ? (
                                <button
                                    onClick={() => {
                                        if (cancelReasons.length === 0) {
                                            toast.error(t('management.settings.plan.cancelReasonLabel') || 'Selecione pelo menos 1 motivo.');
                                            return;
                                        }
                                        setShowCancelConfirm(true);
                                    }}
                                    className="w-full h-16 rounded-2xl bg-[#ff0055] text-white font-black uppercase tracking-widest text-xs shadow-[0_10px_30px_rgba(255,0,85,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3"
                                >
                                    <Zap size={18} className="fill-current" />
                                    {t('management.settings.plan.cancelButton')}
                                </button>
                            ) : (
                                <div className="p-8 rounded-[2.5rem] bg-[#ff0055] text-white shadow-2xl space-y-8 animate-in slide-in-from-bottom-4 duration-300">
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/20 rounded-2xl">
                                            <AlertCircle size={28} className="text-white" />
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black uppercase tracking-tighter">{t('management.settings.plan.cancelConfirmTitle')}</h4>
                                            <p className="text-[11px] font-bold opacity-90 leading-relaxed italic mt-1">{t('management.settings.plan.cancelConfirmMessage')}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setShowCancelConfirm(false)}
                                            className="flex-1 py-4 bg-white text-[#ff0055] rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-50 transition-all"
                                        >
                                            {t('management.settings.plan.keepPlan')}
                                        </button>
                                        <button
                                            onClick={handleCancelSubscription}
                                            disabled={isCancelling}
                                            className="flex-1 py-4 bg-black/20 border border-white/30 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:bg-black/30 transition-all"
                                        >
                                            {isCancelling ? t('common.loading') : <><div className="w-1.5 h-1.5 rounded-full bg-white border border-rose-500" /> {t('management.settings.plan.cancelButton')}</>}
                                        </button>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center justify-center gap-2 text-[9px] font-black text-slate-600 uppercase tracking-widest mt-4">
                                <ShieldCheck size={14} /> {t('management.settings.plan.secureOperation')}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                {...checkoutData}
            />
        </div>
    );
};

export default UserSettings;
