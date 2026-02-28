import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, UserPreferences, Plan, Suite, Feature, ModuleId } from '@/types';
import {
    Database, Key, Globe, Save, ShieldCheck, AlertCircle, Building2,
    Crown, Zap, CheckCircle2, ArrowRight, FileText, Scale, DollarSign,
    Calendar, Search, Mic
} from 'lucide-react';
import { createMasterClient } from '@/lib/supabase/master';
import { toast } from '../ui/toast';
import OrganizationForm from '../ui/organization-form';
import { useTranslation } from '@/contexts/language-context';
import { getFeatures, getPlanPermissions } from '@/app/actions/plan-actions';
import { CheckoutModal } from './checkout-modal';

interface Props {
    user: User;
    preferences: UserPreferences;
    onUpdateUser: (u: User) => void;
    onUpdatePrefs: (p: UserPreferences) => void;
    initialTab?: 'infra' | 'org' | 'plan' | 'cancel';
}

const UserSettings: React.FC<Props> = ({ user, preferences, onUpdatePrefs, initialTab }) => {
    const { t, locale } = useTranslation();
    const isSubscriptionAdmin = user.role === 'Master' ||
        ['Sócio-Administrador', 'Sócio Administrador'].includes(user.role) ||
        (user.access_group_name && ['Sócio-Administrador', 'Sócio Administrador'].some(g => user.access_group_name?.includes(g)));
    const isRootAdmin = ['Master', 'Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(user.role);
    const [activeTab, setActiveTab] = useState<'infra' | 'org' | 'plan' | 'cancel'>(initialTab || (isRootAdmin ? 'infra' : 'plan'));
    const [formPrefs, setFormPrefs] = useState(preferences);
    const [saving, setSaving] = useState(false);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly'>('monthly');
    const [modulesBillingCycle, setModulesBillingCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly'>('monthly');
    const [loadingPlanData, setLoadingPlanData] = useState(false);
    const [planData, setPlanData] = useState<{
        plans: Plan[];
        suites: Suite[];
        features: Feature[];
        userPermissions: string[];
    } | null>(null);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState<{ planName?: string; moduleName?: string; type: 'plan' | 'module' }>({ type: 'plan' });
    const [cancelReasons, setCancelReasons] = useState<number[]>([]);
    const [cancelFeedback, setCancelFeedback] = useState<string>('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const supabase = createMasterClient();

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
            if (data.error) throw new Error(data.error);

            toast.success(t('management.settings.plan.cancelSuccess'));
            setShowCancelConfirm(false);
            // Optionally redirect or refresh
            setTimeout(() => window.location.reload(), 2000);
        } catch (err: any) {
            console.error('Cancellation error:', err);
            toast.error(t('management.settings.plan.cancelError'));
        } finally {
            setIsCancelling(false);
        }
    };

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    useEffect(() => {
        if (activeTab === 'plan' && !planData && isSubscriptionAdmin) {
            fetchPlanData();
        }
    }, [activeTab, planData, isSubscriptionAdmin]);

    const fetchPlanData = async () => {
        setLoadingPlanData(true);
        try {
            const [suitesRes, plansRes, featuresRes] = await Promise.all([
                supabase.from('suites').select('*').order('order_index', { ascending: true }),
                supabase.from('plans').select('*').eq('active', true).order('order_index', { ascending: true }),
                getFeatures()
            ]);

            let userPermissions: string[] = [];
            if (user.plan_id) {
                const permRes = await getPlanPermissions(user.plan_id);
                if (permRes.success) {
                    userPermissions = permRes.permissions || [];
                }
            } else if (user.role === 'Master') {
                // Master technically has all features
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

    const handleSavePrefs = async () => {
        setSaving(true);
        try {
            // Update Preferences in public.user_preferences
            const { error: prefsError } = await supabase
                .from('user_preferences')
                .update({
                    custom_supabase_url: formPrefs.custom_supabase_url,
                    custom_supabase_key: formPrefs.custom_supabase_key,
                    custom_gemini_key: formPrefs.custom_gemini_key
                })
                .eq('user_id', user.id);

            if (prefsError) throw prefsError;

            onUpdatePrefs(formPrefs);
            toast.success(t('management.settings.toast.saveSuccess'));
        } catch (err) {
            console.error('Error saving settings:', err);
            toast.error(t('management.settings.toast.saveError'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col items-center">
                <div className="flex flex-col md:flex-row items-center md:items-baseline gap-2 md:gap-4 mb-8">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('management.settings.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold tracking-tight uppercase text-[10px] opacity-70">{t('management.settings.subtitle')}</p>
                </div>

                {isRootAdmin && (
                    <div className="flex bg-slate-100 dark:bg-slate-950/50 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800/50 shadow-sm backdrop-blur-xl">
                        <button
                            onClick={() => setActiveTab('infra')}
                            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'infra'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-700'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <ShieldCheck size={14} /> {t('management.settings.tabs.infra')}
                        </button>
                        <button
                            onClick={() => setActiveTab('org')}
                            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'org'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xl shadow-indigo-500/10 border border-slate-200 dark:border-slate-700'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <Building2 size={14} /> {t('management.settings.tabs.org')}
                        </button>
                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'plan'
                                ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-xl shadow-amber-500/10 border border-slate-200 dark:border-slate-700'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-amber-500'
                                }`}
                        >
                            <Crown size={14} /> {t('management.settings.tabs.plan') || 'Minha Assinatura'}
                        </button>

                        <button
                            onClick={() => setActiveTab('cancel')}
                            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'cancel'
                                ? 'bg-white dark:bg-slate-800 text-rose-600 shadow-xl shadow-rose-500/10 border border-slate-200 dark:border-slate-700'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-rose-500'
                                }`}
                        >
                            <AlertCircle size={14} /> {t('management.settings.plan.cancelSubscription') || 'Cancelar Assinatura'}
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                {activeTab === 'infra' && (
                    <div className="space-y-10">
                        {isRootAdmin ? (
                            <section className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all hover:shadow-indigo-500/30">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={28} className="text-indigo-300" />
                                            <h3 className="text-2xl font-black uppercase tracking-tighter">{t('management.settings.infra.title')}</h3>
                                        </div>
                                        <button
                                            onClick={handleSavePrefs}
                                            disabled={saving}
                                            className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                        >
                                            {saving ? <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                                            {saving ? '...' : t('management.settings.infra.save')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">{t('management.settings.infra.urlLabel')}</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                                    <input
                                                        type="url"
                                                        placeholder={t('management.settings.infra.urlPlaceholder')}
                                                        value={formPrefs.custom_supabase_url || ''}
                                                        onChange={e => setFormPrefs({ ...formPrefs, custom_supabase_url: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">{t('management.settings.infra.keyLabel')}</label>
                                                <div className="relative">
                                                    <Database className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                                    <input
                                                        type="password"
                                                        placeholder={t('management.settings.infra.keyPlaceholder')}
                                                        value={formPrefs.custom_supabase_key || ''}
                                                        onChange={e => setFormPrefs({ ...formPrefs, custom_supabase_key: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">{t('management.settings.infra.geminiLabel')}</label>
                                                <div className="relative">
                                                    <Key className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                                    <input
                                                        type="password"
                                                        placeholder={t('management.settings.infra.geminiPlaceholder')}
                                                        value={formPrefs.custom_gemini_key || ''}
                                                        onChange={e => setFormPrefs({ ...formPrefs, custom_gemini_key: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                                                <p className="text-sm text-indigo-100 leading-relaxed font-bold">
                                                    <span className="font-black text-indigo-300 block mb-1 uppercase tracking-tighter">{t('management.settings.infra.privacyTitle')}</span>
                                                    {t('management.settings.infra.privacyDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                            </section>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                                <AlertCircle size={48} className="text-slate-300 mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">{t('management.settings.plan.restrictedSub') || 'Acesso restrito a Sócio-Administradores.'}</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'org' && isRootAdmin && (
                    <OrganizationForm adminId={user.id} />
                )}

                {activeTab === 'plan' && (
                    <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                        {!isSubscriptionAdmin ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl text-center max-w-2xl mx-auto mt-12">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-6">
                                    <ShieldCheck size={48} className="text-indigo-500" />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-800 dark:text-white">{t('management.settings.infra.restricted')}</h3>
                                <p className="text-slate-500 text-lg mb-8 leading-relaxed font-medium">
                                    {t('management.settings.plan.restrictedDesc') || 'Apenas os administradores responsáveis pela organização (Sócio-Administrador) podem visualizar detalhes ou gerenciar a assinatura.'}
                                </p>
                            </div>
                        ) : loadingPlanData ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('management.settings.plan.loading') || 'Carregando detalhes da assinatura...'}</p>
                            </div>
                        ) : planData ? (
                            <>
                                {/* Plan Header */}
                                <section className="bg-amber-500 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all hover:shadow-amber-500/30">
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full mb-6">
                                                <Crown size={14} className="text-amber-100" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-50">{t('management.settings.plan.currentPlan') || 'Plano Atual'}</span>
                                            </div>
                                            <h3 className="text-5xl font-black uppercase tracking-tighter mb-2">{user.plan_name || 'Free Trial'}</h3>
                                            <p className="text-amber-100 font-medium">{t('management.settings.plan.planAccess') || 'Acesso total ao ecossistema habilitado no seu plano.'}</p>
                                        </div>
                                        <button
                                            onClick={() => handleCheckout('plan', 'Veritum Pro (Upgrade)')}
                                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 w-full md:w-auto"
                                        >
                                            <Zap size={18} className="text-amber-500" />
                                            {t('management.settings.plan.upgrade') || 'Fazer Upgrade'}
                                        </button>
                                    </div>
                                    <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
                                        <Crown size={300} />
                                    </div>
                                </section>

                                {/* Modules Section */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3 ml-4">
                                        <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                                        <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800 dark:text-white">{t('management.settings.plan.ecosystemModules') || 'Módulos do Ecossistema'}</h3>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {planData.suites.map((suite) => {
                                            const suiteFeatures = planData.features.filter((f: Feature) => f.suite_id === suite.id);
                                            const userFeaturesInSuite = suiteFeatures.filter((f: Feature) => planData.userPermissions.includes(f.id));

                                            const hasAllFeatures = suiteFeatures.length > 0 && userFeaturesInSuite.length === suiteFeatures.length;
                                            const hasSomeFeatures = userFeaturesInSuite.length > 0 && userFeaturesInSuite.length < suiteFeatures.length;
                                            const hasNoFeatures = userFeaturesInSuite.length === 0;

                                            // Get matching icon based on suite_key or order_index
                                            const getIcon = () => {
                                                switch (suite.suite_key) {
                                                    case 'sentinel': return <ShieldCheck size={24} />;
                                                    case 'nexus': return <Scale size={24} />;
                                                    case 'scriptor': return <FileText size={24} />;
                                                    case 'valorem': return <DollarSign size={24} />;
                                                    case 'cognitio': return <Search size={24} />;
                                                    case 'vox': return <Mic size={24} />;
                                                    case 'intelligence': return <Zap size={24} />;
                                                    default: return <Database size={24} />;
                                                }
                                            };

                                            const status = hasAllFeatures ? (t('management.settings.plan.statusUnlocked') || 'Liberado') : (hasSomeFeatures ? (t('management.settings.plan.statusPartial') || 'Acesso Parcial') : (t('management.settings.plan.statusLocked') || 'Bloqueado'));
                                            const lang = locale as 'pt' | 'en' | 'es';

                                            return (
                                                <div key={suite.id} className={`p-6 rounded-[2rem] border transition-all ${hasAllFeatures ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className={`p-3 rounded-xl ${hasAllFeatures ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                                            {getIcon()}
                                                        </div>
                                                        {hasAllFeatures ? (
                                                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full">
                                                                <CheckCircle2 size={12} /> {status}
                                                            </span>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleCheckout('module', suite.name)}
                                                                className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:scale-105 transition-all cursor-pointer text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-800/50"
                                                            >
                                                                <ArrowRight size={12} /> {t('management.settings.plan.acquire') || 'Adquirir'} {hasSomeFeatures && '(Parcial)'}
                                                            </button>
                                                        )}
                                                    </div>
                                                    <h4 className={`text-sm font-black mb-1 ${hasAllFeatures ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{suite.name}</h4>
                                                    <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">
                                                        {suite.short_desc?.[lang] || suite.short_desc?.pt}
                                                    </p>
                                                    {hasSomeFeatures && (
                                                        <div className="mt-3 flex items-center gap-2">
                                                            <div className="flex-1 h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-amber-500"
                                                                    style={{ width: `${(userFeaturesInSuite.length / suiteFeatures.length) * 100}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[8px] font-black text-slate-400 uppercase">{userFeaturesInSuite.length}/{suiteFeatures.length} {t('management.settings.plan.features') || 'Funcionalidades'}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Plans Section */}
                                <div className="space-y-6 pt-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ml-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                                            <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800 dark:text-white">{t('management.settings.plan.commercialPlans') || 'Planos Comerciais'}</h3>
                                        </div>
                                        <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl self-start md:self-auto">
                                            <button
                                                onClick={() => setBillingCycle('monthly')}
                                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                {t('management.settings.plan.monthly') || 'MENSAL'}
                                            </button>
                                            <button
                                                onClick={() => setBillingCycle('quarterly')}
                                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'quarterly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                {t('management.settings.plan.quarterly') || 'TRIMESTRAL'}
                                            </button>
                                            <button
                                                onClick={() => setBillingCycle('semiannual')}
                                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'semiannual' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                {t('management.settings.plan.semiannual') || 'SEMESTRAL'}
                                            </button>
                                            <button
                                                onClick={() => setBillingCycle('yearly')}
                                                className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                            >
                                                {t('management.settings.plan.yearly') || 'ANUAL'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        {planData.plans.filter(p => p.is_combo).map((p) => {
                                            const isCurrentPlan = p.id === user.plan_id;
                                            const lang = locale as 'pt' | 'en' | 'es';
                                            const cycle = billingCycle;
                                            const basePrice = p.monthly_price || 0;
                                            let months = 1;
                                            let discount = 0;

                                            if (cycle === 'monthly') {
                                                months = 1;
                                                discount = p.monthly_discount || 0;
                                            } else if (cycle === 'quarterly') {
                                                months = 3;
                                                discount = p.quarterly_discount || 0;
                                            } else if (cycle === 'semiannual') {
                                                months = 6;
                                                discount = p.semiannual_discount || 0;
                                            } else if (cycle === 'yearly') {
                                                months = 12;
                                                discount = p.yearly_discount || 0;
                                            }

                                            const fullPrice = basePrice * months;
                                            const finalPrice = discount > 0 ? fullPrice * (1 - discount / 100) : fullPrice;
                                            const installmentValue = finalPrice / (p.installments || (cycle === 'monthly' ? 1 : months));
                                            const cashValue = finalPrice * (1 - (p.yearly_cash_discount || 0) / 100);

                                            return (
                                                <div key={p.id} className={`relative p-8 rounded-[2.5rem] border transition-all flex flex-col h-full ${isCurrentPlan ? 'bg-white dark:bg-slate-900 border-amber-300 dark:border-amber-900 shadow-2xl scale-105 z-10' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-90'}`}>
                                                    {p.recommended && (
                                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-[9px] font-black uppercase px-4 py-1.5 rounded-full tracking-[0.2em] shadow-lg">
                                                            {t('management.settings.plan.recommended') || 'RECOMENDADO'}
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div>
                                                            <h4 className={`text-xl font-black uppercase tracking-tighter ${isCurrentPlan ? 'text-amber-600' : 'text-slate-700 dark:text-slate-300'}`}>{p.name}</h4>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{p.is_combo ? (t('management.settings.plan.ecosystemCombo') || 'Ecosystem Combo') : (t('management.settings.plan.individualModule') || 'Módulo Individual')}</p>
                                                        </div>
                                                    </div>

                                                    <div className="mb-8 flex flex-col items-baseline gap-1 relative">
                                                        {discount > 0 ? (
                                                            <span className="text-[15px] font-bold text-slate-500 line-through decoration-rose-500 decoration-2">
                                                                R$ {basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                                                            </span>
                                                        ) : (
                                                            <div className="h-[22.5px]" />
                                                        )}

                                                        <div className="flex flex-col gap-0.5 relative group">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className="text-4xl font-black text-slate-800 dark:text-white">R$ {(finalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                                    {billingCycle === 'yearly' ? (t('management.settings.plan.perYear') || '/ ano') : billingCycle === 'monthly' ? (t('management.settings.plan.perMonth') || '/ mês') : billingCycle === 'quarterly' ? '/ 3 meses' : '/ 6 meses'}
                                                                </span>
                                                                {discount > 0 && (
                                                                    <div className="absolute -top-6 right-0 md:-right-6 px-3 py-1.5 rounded-full text-[10px] font-black shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse whitespace-nowrap bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 scale-110 z-20">
                                                                        {discount}% OFF
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {billingCycle !== 'monthly' && discount > 0 && (
                                                                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 animate-in fade-in slide-in-from-left-2 duration-500">
                                                                    <p>ou em até {p.installments || months}x de R$ {(installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros</p>
                                                                    {(p.yearly_cash_discount || 0) > 0 && (
                                                                        <p className="mt-1 text-slate-900 dark:text-white font-black uppercase tracking-widest">
                                                                            * À Vista: R$ {cashValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({p.yearly_cash_discount}% OFF) *
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-slate-500 mt-4 font-medium leading-relaxed">
                                                            {p.short_desc?.[lang] || p.short_desc?.pt}
                                                        </p>
                                                    </div>

                                                    <div className="space-y-3 mb-8 flex-1">
                                                        {(p.features?.[lang] || p.features?.pt || []).slice(0, 5).map((feat: string, i: number) => (
                                                            <div key={i} className="flex items-start gap-2">
                                                                <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 shrink-0" />
                                                                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{feat}</span>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {isCurrentPlan ? (
                                                        <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800">
                                                            <CheckCircle2 size={16} /> {t('management.settings.plan.statusUnlocked') || 'Liberado'}
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleCheckout('plan', p.name)}
                                                            className="w-full py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg"
                                                        >
                                                            {t('management.settings.plan.acquirePlan') || 'Adquirir Plano'}
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* A La Carte Modules Section */}
                                {planData.plans.filter(p => !p.is_combo).length > 0 && (
                                    <div className="space-y-6 pt-10">
                                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ml-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                                                <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800 dark:text-white">{t('management.settings.plan.aLaCarteModules') || 'Módulos Avulsos'}</h3>
                                            </div>
                                            <div className="flex items-center bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl self-start md:self-auto">
                                                <button
                                                    onClick={() => setModulesBillingCycle('monthly')}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${modulesBillingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                >
                                                    {t('management.settings.plan.monthly') || 'MENSAL'}
                                                </button>
                                                <button
                                                    onClick={() => setModulesBillingCycle('quarterly')}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${modulesBillingCycle === 'quarterly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                >
                                                    {t('management.settings.plan.quarterly') || 'TRIMESTRAL'}
                                                </button>
                                                <button
                                                    onClick={() => setModulesBillingCycle('semiannual')}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${modulesBillingCycle === 'semiannual' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                >
                                                    {t('management.settings.plan.semiannual') || 'SEMESTRAL'}
                                                </button>
                                                <button
                                                    onClick={() => setModulesBillingCycle('yearly')}
                                                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${modulesBillingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                                >
                                                    {t('management.settings.plan.yearly') || 'ANUAL'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {planData.plans.filter(p => !p.is_combo).map((p) => {
                                                const isCurrentPlan = p.id === user.plan_id;
                                                const lang = locale as 'pt' | 'en' | 'es';
                                                const cycle = modulesBillingCycle;
                                                const basePrice = p.monthly_price || 0;
                                                let months = 1;
                                                let discount = 0;

                                                if (cycle === 'monthly') {
                                                    months = 1;
                                                    discount = p.monthly_discount || 0;
                                                } else if (cycle === 'quarterly') {
                                                    months = 3;
                                                    discount = p.quarterly_discount || 0;
                                                } else if (cycle === 'semiannual') {
                                                    months = 6;
                                                    discount = p.semiannual_discount || 0;
                                                } else if (cycle === 'yearly') {
                                                    months = 12;
                                                    discount = p.yearly_discount || 0;
                                                }

                                                const fullPrice = basePrice * months;
                                                const finalPrice = discount > 0 ? fullPrice * (1 - discount / 100) : fullPrice;
                                                const installmentValue = finalPrice / (p.installments || (cycle === 'monthly' ? 1 : months));
                                                const cashValue = finalPrice * (1 - (p.yearly_cash_discount || 0) / 100);

                                                return (
                                                    <div key={p.id} className={`relative p-8 rounded-[2.5rem] border transition-all flex flex-col h-full ${isCurrentPlan ? 'bg-white dark:bg-slate-900 border-indigo-300 dark:border-indigo-900 shadow-2xl scale-105 z-10' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-90'}`}>
                                                        <div className="flex justify-between items-start mb-6">
                                                            <div>
                                                                <h4 className={`text-xl font-black uppercase tracking-tighter ${isCurrentPlan ? 'text-indigo-600' : 'text-slate-700 dark:text-slate-300'}`}>{p.name}</h4>
                                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{t('management.settings.plan.individualModule') || 'Módulo Individual'}</p>
                                                            </div>
                                                        </div>

                                                        <div className="mb-8 flex flex-col items-baseline gap-1 relative">
                                                            {discount > 0 ? (
                                                                <span className="text-[15px] font-bold text-slate-500 line-through decoration-rose-500 decoration-2">
                                                                    R$ {basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                                                                </span>
                                                            ) : (
                                                                <div className="h-[22.5px]" />
                                                            )}

                                                            <div className="flex flex-col gap-0.5 relative group">
                                                                <div className="flex items-baseline gap-1">
                                                                    <span className="text-4xl font-black text-slate-800 dark:text-white">R$ {(finalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                                        {modulesBillingCycle === 'yearly' ? (t('management.settings.plan.perYear') || '/ ano') : modulesBillingCycle === 'monthly' ? (t('management.settings.plan.perMonth') || '/ mês') : modulesBillingCycle === 'quarterly' ? '/ 3 meses' : '/ 6 meses'}
                                                                    </span>
                                                                    {discount > 0 && (
                                                                        <div className="absolute -top-6 right-0 md:-right-6 px-3 py-1.5 rounded-full text-[10px] font-black shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse whitespace-nowrap bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 scale-110 z-20">
                                                                            {discount}% OFF
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {modulesBillingCycle !== 'monthly' && discount > 0 && (
                                                                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-1 animate-in fade-in slide-in-from-left-2 duration-500">
                                                                        <p>ou em até {p.installments || months}x de R$ {(installmentValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} sem juros</p>
                                                                        {(p.yearly_cash_discount || 0) > 0 && (
                                                                            <p className="mt-1 text-slate-900 dark:text-white font-black uppercase tracking-widest">
                                                                                * À Vista: R$ {cashValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ({p.yearly_cash_discount}% OFF) *
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <p className="text-[10px] text-slate-500 mt-4 font-medium leading-relaxed">
                                                                {p.short_desc?.[lang] || p.short_desc?.pt}
                                                            </p>
                                                        </div>

                                                        <div className="space-y-3 mb-8 flex-1">
                                                            {(p.features?.[lang] || p.features?.pt || []).slice(0, 5).map((feat: string, i: number) => (
                                                                <div key={i} className="flex items-start gap-2">
                                                                    <CheckCircle2 size={14} className="text-indigo-500 mt-0.5 shrink-0" />
                                                                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400">{feat}</span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {isCurrentPlan ? (
                                                            <div className="w-full py-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 border border-emerald-100 dark:border-emerald-800">
                                                                <CheckCircle2 size={16} /> {t('management.settings.plan.statusUnlocked') || 'Liberado'}
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => handleCheckout('module', p.name)}
                                                                className="w-full py-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all shadow-lg"
                                                            >
                                                                {t('management.settings.plan.acquireModule') || 'Adquirir Módulo'}
                                                            </button>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                )}
                            </>
                        ) : null}
                    </div>
                )}

                {activeTab === 'cancel' && (
                    <div className="max-w-2xl mx-auto py-10 px-4">
                        <section className="text-center mb-12">
                            <div className="w-20 h-20 rounded-[2rem] bg-rose-50 dark:bg-rose-900/20 text-rose-500 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-rose-500/10">
                                <AlertCircle size={40} />
                            </div>
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-4 capitalize">
                                {t('management.settings.plan.cancelTitle')}
                            </h2>
                            <p className="text-slate-500 dark:text-slate-400 font-bold max-w-lg mx-auto leading-relaxed italic">
                                {t('management.settings.plan.cancelSubtitle')}
                            </p>
                        </section>

                        <div className="space-y-8 bg-slate-50 dark:bg-slate-900/50 p-10 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden group">
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-rose-600 uppercase tracking-[0.2em] ml-2">
                                    {t('management.settings.plan.cancelReasonLabel')} *
                                </label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[1, 2, 3, 4, 5].map((idx) => {
                                        const reasonLabel = t(`management.settings.plan.cancelReasonOption${idx}`);
                                        const isSelected = cancelReasons.includes(idx);
                                        return (
                                            <button
                                                key={idx}
                                                onClick={() => {
                                                    setCancelReasons(prev =>
                                                        prev.includes(idx)
                                                            ? prev.filter(r => r !== idx)
                                                            : [...prev, idx]
                                                    );
                                                }}
                                                className={`w-full text-left p-4 rounded-2xl border-2 transition-all font-bold flex items-center justify-between group ${isSelected
                                                    ? 'bg-rose-600 border-rose-600 text-white shadow-xl shadow-rose-600/30'
                                                    : 'bg-white dark:bg-slate-800 border-slate-100 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-rose-400'
                                                    }`}
                                            >
                                                <span>{reasonLabel}</span>
                                                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected
                                                    ? 'bg-white border-white scale-110'
                                                    : 'border-slate-200 dark:border-slate-600'
                                                    }`}>
                                                    {isSelected && (
                                                        <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-in zoom-in" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-800">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">
                                    {t('management.settings.plan.cancelFeedbackPlaceholder')}
                                </label>
                                <textarea
                                    value={cancelFeedback}
                                    onChange={(e) => setCancelFeedback(e.target.value)}
                                    placeholder="..."
                                    rows={4}
                                    className="w-full p-6 bg-white dark:bg-slate-800 border-2 border-slate-100 dark:border-slate-700 rounded-[2rem] outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-400 transition-all font-medium text-slate-800 dark:text-slate-200 placeholder:text-slate-300 shadow-sm"
                                />
                            </div>

                            {!showCancelConfirm ? (
                                <button
                                    onClick={() => {
                                        if (cancelReasons.length === 0) {
                                            toast.error(t('management.settings.plan.cancelReasonLabel'));
                                            return;
                                        }
                                        setShowCancelConfirm(true);
                                    }}
                                    className="w-full h-16 rounded-2xl bg-rose-600 text-white font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-rose-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-4"
                                >
                                    <Zap size={18} className="fill-current text-white/50" />
                                    {t('management.settings.plan.cancelButton')}
                                </button>
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-8 rounded-[2rem] bg-rose-600 text-white shadow-2xl shadow-rose-600/40 space-y-6 border-4 border-white/20"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-white/20 rounded-xl">
                                            <AlertCircle size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter mb-1">
                                                {t('management.settings.plan.cancelConfirmTitle')}
                                            </h4>
                                            <p className="text-rose-100 text-[11px] font-bold leading-relaxed italic opacity-90">
                                                {t('management.settings.plan.cancelConfirmMessage')}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex gap-4 pt-4">
                                        <button
                                            onClick={() => setShowCancelConfirm(false)}
                                            className="flex-1 h-12 rounded-xl bg-white text-rose-600 font-black uppercase tracking-widest text-[9px] hover:bg-rose-50 transition-all"
                                        >
                                            {t('common.cancel') || 'Voltar'}
                                        </button>
                                        <button
                                            onClick={handleCancelSubscription}
                                            disabled={isCancelling}
                                            className="flex-1 h-12 rounded-xl bg-slate-900/50 text-white font-black uppercase tracking-widest text-[9px] hover:bg-slate-900 transition-all flex items-center justify-center gap-2 border border-white/20 disabled:opacity-50"
                                        >
                                            {isCancelling ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 size={14} />}
                                            {isCancelling ? '...' : t('management.settings.plan.cancelButton')}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </div>

                        <div className="mt-8 flex items-center justify-center gap-3 py-4 text-slate-400">
                            <ShieldCheck size={16} />
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">
                                {t('management.settings.plan.secureOperation') || 'Operação Segura via Veritum PRO Cloud'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                {...checkoutData}
            />
        </div >
    );
};

export default UserSettings;
