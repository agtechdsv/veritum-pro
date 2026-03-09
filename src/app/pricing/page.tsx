'use client'

import React, { useState, useEffect } from 'react';
import {
    Check, ChevronDown, ChevronUp, Star, Zap,
    ArrowRight, ChevronRight, Moon, Sun, Scale,
    Shield, BarChart3, MessageSquare, Wallet,
    PenTool, Radar, HelpCircle, Briefcase,
    Building2, Users2, Sparkles, Send, Calendar as CalendarIcon,
    ChevronLeft, LogOut, LayoutDashboard, X, Database, Cloud,
    Lock, ShieldAlert, Crown
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isBefore,
    startOfDay
} from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
import { CompanyModal } from '@/components/company-modal';
import { CheckoutModal } from '@/components/modules/checkout-modal';
import { createMasterClient } from '@/lib/supabase/master';
import { UserMenu } from '@/components/ui/user-menu';
import { useTranslation } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';
import { Footer } from '@/components/shared/footer';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <Scale className="h-6 w-6" />
    </div>
);

export default function PricingPage() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { t, locale } = useTranslation();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
    const [showComparison, setShowComparison] = useState(true);
    const [hasAccess, setHasAccess] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(undefined);
    const [legalModal, setLegalModal] = useState({ isOpen: false, type: 'privacy' as 'privacy' | 'terms' });
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState<{ planName?: string; moduleName?: string; type: 'plan' | 'module' }>({ type: 'plan' });

    const dateLocale = locale === 'en' ? enUS : ptBR;

    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [demoFormStatus, setDemoFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [demoFormData, setDemoFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        teamSize: ''
    });
    const [selectedRange, setSelectedRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const [dbPlans, setDbPlans] = useState<any[]>([]);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly'>('monthly');
    const [modulesBillingCycle, setModulesBillingCycle] = useState<'monthly' | 'quarterly' | 'semiannual' | 'yearly'>('monthly');

    const formatWhatsApp = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    useEffect(() => {
        setMounted(true);
        const savedAccess = localStorage.getItem('veritum_access');
        if (savedAccess === 'granted') {
            setHasAccess(true);
        }

        const supabase = createMasterClient();
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('name, avatar_url, role, plan_id, access_group_id, access_groups(name), plans:plan_id(name)')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error("Error fetching user profile:", error.message || error);
                }

                if (profile) {
                    const profileData = profile as any;
                    const groupRes = Array.isArray(profileData?.access_groups) ? profileData.access_groups[0] : profileData?.access_groups;

                    const groupNameRaw = typeof groupRes?.name === 'object' ? (groupRes.name.pt || groupRes.name.en || '') : (groupRes?.name || '');
                    const groupNameTranslated = typeof groupRes?.name === 'object' ? (groupRes.name[locale] || groupNameRaw) : groupNameRaw;

                    const userName = typeof profileData?.name === 'object'
                        ? (profileData.name[locale] || profileData.name.pt || profileData.name.en || 'Usuário')
                        : (profileData?.name || user.user_metadata?.full_name || user.user_metadata?.name || 'Usuário');

                    const rawPlanName = profileData?.plans
                        ? (typeof (profileData.plans as any).name === 'object'
                            ? ((profileData.plans as any).name[locale] || (profileData.plans as any).name.pt || (profileData.plans as any).name.en || 'Pro')
                            : ((profileData.plans as any).name || 'Pro'))
                        : (Array.isArray(profileData?.plans) && profileData.plans[0]
                            ? (typeof (profileData.plans[0] as any).name === 'object'
                                ? ((profileData.plans[0] as any).name[locale] || (profileData.plans[0] as any).name.pt || (profileData.plans[0] as any).name.en || 'Pro')
                                : ((profileData.plans[0] as any).name || 'Pro'))
                            : 'Pro');

                    profileData.name = userName;
                    profileData.plan_name = rawPlanName;
                    profileData.access_group_name = groupNameRaw;
                    profileData.translated_group_name = groupNameTranslated;

                    setCurrentUser({ ...user, profile: profileData });
                } else {
                    setCurrentUser({ ...user, profile: null });
                }
            } else {
                setCurrentUser(null);
            }
        };
        fetchUser();

        const fetchPlans = async () => {
            const { data } = await supabase.from('plans').select('*').eq('active', true).order('order_index');
            if (data) setDbPlans(data);
        };
        fetchPlans();
    }, []);

    // Handle hash scrolling for internal links like #infrastructure
    useEffect(() => {
        let scrollTimeout: NodeJS.Timeout;

        const executeScroll = (id: string, smooth: boolean = true) => {
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
            }
        };

        const handleHashScroll = (isInitial: boolean = false) => {
            if (typeof window !== 'undefined' && window.location.hash) {
                const id = window.location.hash.replace('#', '');

                if (isInitial) {
                    // Start scroll only when plans are loaded to prevent falling in steps
                    if (dbPlans.length > 0) {
                        scrollTimeout = setTimeout(() => executeScroll(id, true), 300);
                    }
                } else {
                    executeScroll(id, true);
                }
            }
        };

        if (mounted) {
            handleHashScroll(true);
            window.addEventListener('hashchange', () => handleHashScroll(false));
            return () => {
                window.removeEventListener('hashchange', () => handleHashScroll(false));
                if (scrollTimeout) clearTimeout(scrollTimeout);
            };
        }
    }, [mounted, dbPlans.length]); // Re-run once dbPlans are available

    const handleDemoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRange.start || !selectedRange.end) {
            alert(t('pricingPage.demoModal.calendar.error') || 'Por favor, selecione o período para a demonstração.');
            return;
        }
        setDemoFormStatus('submitting');

        try {
            const supabase = createMasterClient();
            const { error } = await supabase.from('demo_requests').insert([
                {
                    full_name: demoFormData.name,
                    email: demoFormData.email,
                    whatsapp: demoFormData.whatsapp,
                    team_size: demoFormData.teamSize,
                    preferred_start: selectedRange.start.toISOString(),
                    preferred_end: selectedRange.end.toISOString(),
                    status: 'pending'
                }
            ]);

            if (error) throw error;

            setDemoFormStatus('success');
            setTimeout(() => {
                setIsDemoModalOpen(false);
                setDemoFormStatus('idle');
                setDemoFormData({ name: '', email: '', whatsapp: '', teamSize: '' });
                setSelectedRange({ start: null, end: null });
            }, 6000);
        } catch (err: any) {
            console.error('Error saving demo request:', err);
            alert('Erro ao salvar solicitação: ' + err.message);
            setDemoFormStatus('idle');
        }
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    };

    const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
        const href = e.currentTarget.getAttribute('href');
        if (href && href.startsWith('#')) {
            e.preventDefault();
            const id = href.replace('#', '');
            const element = document.getElementById(id);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
                window.history.pushState(null, '', href);
            }
        }
    };

    const openLegal = (type: 'privacy' | 'terms') => {
        setLegalModal({ isOpen: true, type });
    };

    const openAuth = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
    };

    if (!mounted) return null;

    const plans = [
        {
            name: t('pricingPage.plans.start.name'),
            desc: t('pricingPage.plans.start.desc'),
            price: t('pricingPage.plans.start.price'),
            period: t('pricingPage.plans.start.period'),
            features: [
                t('pricingPage.plans.start.features.0'),
                t('pricingPage.plans.start.features.1'),
                t('pricingPage.plans.start.features.2'),
                t('pricingPage.plans.start.features.3')
            ],
            cta: t('pricingPage.plans.start.cta'),
            featured: false,
            color: 'border-slate-200 dark:border-slate-800'
        },
        {
            name: t('pricingPage.plans.growth.name'),
            desc: t('pricingPage.plans.growth.desc'),
            price: t('pricingPage.plans.growth.price'),
            period: t('pricingPage.plans.growth.period'),
            features: [
                t('pricingPage.plans.growth.features.0'),
                t('pricingPage.plans.growth.features.1'),
                t('pricingPage.plans.growth.features.2'),
                t('pricingPage.plans.growth.features.3'),
                t('pricingPage.plans.growth.features.4'),
                t('pricingPage.plans.growth.features.5')
            ],
            cta: t('pricingPage.plans.growth.cta'),
            featured: true,
            color: 'border-indigo-500 dark:border-indigo-400 shadow-2xl shadow-indigo-500/20'
        },
        {
            name: t('pricingPage.plans.strategy.name'),
            desc: t('pricingPage.plans.strategy.desc'),
            price: t('pricingPage.plans.strategy.price'),
            period: t('pricingPage.plans.strategy.period'),
            features: [
                t('pricingPage.plans.strategy.features.0'),
                t('pricingPage.plans.strategy.features.1'),
                t('pricingPage.plans.strategy.features.2'),
                t('pricingPage.plans.strategy.features.3'),
                t('pricingPage.plans.strategy.features.4')
            ],
            cta: t('pricingPage.plans.strategy.cta'),
            featured: false,
            color: 'border-slate-200 dark:border-slate-800'
        }
    ];

    const comparisonData = [
        { category: t('pricingPage.comparison.categories.nexus'), start: true, growth: true, strategy: true, label: t('pricingPage.comparison.features.kanban') },
        { category: t('pricingPage.comparison.categories.nexus'), start: false, growth: true, strategy: true, label: t('pricingPage.comparison.features.workflows') },
        { category: t('pricingPage.comparison.categories.nexus'), start: false, growth: false, strategy: true, label: t('pricingPage.comparison.features.assets') },
        { category: t('pricingPage.comparison.categories.sentinel'), start: false, growth: true, strategy: true, label: t('pricingPage.comparison.features.capture') },
        { category: t('pricingPage.comparison.categories.sentinel'), start: false, growth: true, strategy: true, label: t('pricingPage.comparison.features.monitoring') },
        { category: t('pricingPage.comparison.categories.scriptor'), start: false, growth: true, strategy: true, label: t('pricingPage.comparison.features.genAi') },
        { category: t('pricingPage.comparison.categories.scriptor'), start: false, growth: true, strategy: true, label: t('pricingPage.comparison.features.audit') },
        { category: t('pricingPage.comparison.categories.valorem'), start: true, growth: true, strategy: true, label: t('pricingPage.comparison.features.cashflow') },
        { category: t('pricingPage.comparison.categories.valorem'), start: false, growth: false, strategy: true, label: t('pricingPage.comparison.features.provisioning') },
        { category: t('pricingPage.comparison.categories.vox'), start: t('pricingPage.comparison.features.portalBasic'), growth: t('pricingPage.comparison.features.portalFull'), strategy: t('pricingPage.comparison.features.portalFull'), label: t('pricingPage.comparison.features.portal') },
        { category: t('pricingPage.comparison.categories.vox'), start: false, growth: true, strategy: true, label: t('pricingPage.comparison.features.translation') },
        { category: t('pricingPage.comparison.categories.cognitio'), start: false, growth: false, strategy: true, label: t('pricingPage.comparison.features.bi') }
    ];

    return (
        <div id="top" className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between whitespace-nowrap">
                    <div className="flex items-center gap-2 shrink-0">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase whitespace-nowrap">
                                VERITUM <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center gap-5">
                        <Link href="/" className="font-medium text-branding-gradient hover:opacity-80 transition-all">{t('pricingPage.nav.portal')}</Link>
                        <a href="#top" onClick={handleNavClick} className="font-medium text-slate-800 dark:text-white">{t('pricingPage.nav.home')}</a>
                        {dbPlans.filter(p => !p.is_combo).length > 0 && (
                            <a href="#modulos-avulsos" onClick={handleNavClick} className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('pricingPage.nav.modules')}</a>
                        )}
                        <a href="#comparison" onClick={handleNavClick} className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('pricingPage.nav.comparison')}</a>
                        <a href="#infrastructure" onClick={handleNavClick} className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('pricingPage.nav.byodb')}</a>
                        <a href="#subscription" onClick={handleNavClick} className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('pricingPage.nav.subscription')}</a>
                        <a href="#faq" onClick={handleNavClick} className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('pricingPage.nav.faq')}</a>
                    </div>

                    <div className="flex items-center gap-2">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <LanguageSelector />
                        {currentUser === undefined ? (
                            <div className="w-32 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
                        ) : currentUser ? (
                            <div className="flex items-center gap-3">
                                <Link
                                    href="/veritum"
                                    className="hidden xl:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all hover:scale-105"
                                >
                                    <LayoutDashboard size={18} />
                                    {t('pricingPage.nav.painel')}
                                </Link>
                                <UserMenu
                                    user={currentUser}
                                    supabase={createMasterClient()}
                                    onPlanClick={() => {
                                        setCheckoutData({ type: 'plan', planName: currentUser?.profile?.plan_name });
                                        setIsCheckoutOpen(true);
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => openAuth('login')}
                                    className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all cursor-pointer"
                                >
                                    <LogOut size={18} /> {t('nav.login')}
                                </button>
                                <button
                                    onClick={() => openAuth('register')}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all text-sm cursor-pointer"
                                >
                                    {t('landingPages.nexus.hero.cta1')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-44 pb-20 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-black mb-8 text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                        {t('pricingPage.hero.title')} <br />
                        {t('pricingPage.hero.titleAccent').split(' ').map((word: string, i: number) => (
                            <span key={i} className={i === 1 ? "text-branding-gradient" : ""}>{word} </span>
                        ))}
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl mx-auto font-medium">
                        {t('pricingPage.hero.subtitle')}
                    </p>
                    <p className="text-lg text-slate-600 dark:text-slate-400 font-medium mt-6 mb-12 leading-relaxed max-w-2xl mx-auto">
                        {t('pricingPage.hero.cancelGuarantee')}
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section id="plans" className="pb-32 px-6 scroll-mt-32">
                <div className="max-w-7xl mx-auto">
                    <div className="flex justify-center mb-12">
                        <div className="flex flex-wrap justify-center items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl gap-1">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {t('pricingPage.billing.monthly')}
                            </button>
                            <button
                                onClick={() => setBillingCycle('quarterly')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'quarterly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {t('pricingPage.billing.quarterly')}
                            </button>
                            <button
                                onClick={() => setBillingCycle('semiannual')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'semiannual' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {t('pricingPage.billing.semiannual')}
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                {t('pricingPage.billing.yearly')}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                        {dbPlans.filter(p => p.is_combo).length > 0 ? dbPlans.filter(p => p.is_combo).map((plan, i) => {
                            const isCurrentPlan = currentUser?.profile?.plan_id === plan.id;
                            const groupName = currentUser?.profile?.access_groups?.name;
                            const isSocioAdmin = currentUser?.profile?.role === 'Master' ||
                                (groupName && typeof groupName === 'object' && ((groupName as any).pt?.includes('Sócio-Administra') || (groupName as any).en?.includes('Partner')));

                            const basePrice = plan.monthly_price || 0;
                            let months = 1;
                            let discount = 0;
                            let cycleLabel = t('pricingPage.billing.perMonth');

                            if (billingCycle === 'monthly') {
                                months = 1;
                                discount = plan.monthly_discount || 0;
                                cycleLabel = t('pricingPage.billing.perMonth');
                            } else if (billingCycle === 'quarterly') {
                                months = 3;
                                discount = plan.quarterly_discount || 0;
                                cycleLabel = t('pricingPage.billing.perQuarter');
                            } else if (billingCycle === 'semiannual') {
                                months = 6;
                                discount = plan.semiannual_discount || 0;
                                cycleLabel = t('pricingPage.billing.perSemiannual');
                            } else if (billingCycle === 'yearly') {
                                months = 12;
                                discount = plan.yearly_discount || 0;
                                cycleLabel = t('pricingPage.billing.perYear');
                            }

                            const fullPrice = basePrice * months;
                            const finalPrice = discount > 0 ? fullPrice * (1 - discount / 100) : fullPrice;
                            const monthlyEquivalentPrice = finalPrice / months;

                            const lang = locale as 'pt' | 'en' | 'es';
                            const dbPlanName = typeof plan.name === 'string' ? plan.name : (plan.name?.[lang] || plan.name?.pt || '');
                            const planKey = `pricingPage.plans.${dbPlanName.toLowerCase()}`;
                            const localPlanName = t(`${planKey}.name`);
                            const planName = localPlanName !== `${planKey}.name` ? localPlanName : dbPlanName;

                            const rawFeatures = plan.features?.[lang] || plan.features?.pt || plan.features;
                            const localFeatures = t(`${planKey}.features`);
                            const features = (localFeatures !== `${planKey}.features` && Array.isArray(localFeatures))
                                ? localFeatures
                                : (Array.isArray(rawFeatures) ? rawFeatures : (typeof rawFeatures === 'object' && rawFeatures !== null ? Object.values(rawFeatures) : []));

                            const dbDesc = typeof plan.short_desc === 'object' ? (plan.short_desc?.[lang] || plan.short_desc?.pt) : plan.short_desc;
                            const localDesc = t(`${planKey}.desc`);
                            const shortDesc = localDesc !== `${planKey}.desc` ? localDesc : dbDesc;

                            return (
                                <div key={i} className={`relative flex flex-col p-10 rounded-[3rem] border transition-all duration-500 flex-1 ${plan.recommended ? 'bg-white dark:bg-slate-950 border-indigo-500 dark:border-indigo-400 shadow-2xl shadow-indigo-500/20 lg:-mt-4 lg:mb-4 lg:p-12 z-10' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800'}`}>
                                    {plan.recommended && (
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                            {t('management.settings.plan.recommended') || 'RECOMENDADO'}
                                        </div>
                                    )}
                                    <div className="mb-10">
                                        <h3 className={`text-xl font-black mb-4 ${isCurrentPlan ? 'text-amber-500' : 'text-slate-400'}`}>
                                            {planName} {isCurrentPlan && `(${t('management.settings.plan.current') || 'Atual'})`}
                                        </h3>

                                        <div className="mb-8 flex flex-col items-baseline gap-1 relative">
                                            {discount > 0 ? (
                                                <span className="text-[15px] font-bold text-slate-500 line-through decoration-rose-500 decoration-2">
                                                    R$ {fullPrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                                                </span>
                                            ) : (
                                                <div className="h-[22.5px]" />
                                            )}

                                            <div className="flex flex-col gap-0.5 relative group">
                                                <div className="flex items-baseline gap-1">
                                                    <span className="text-4xl lg:text-5xl font-black text-slate-900 dark:text-white whitespace-nowrap">R$ {(finalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                    <span className="text-sm font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                        {cycleLabel}
                                                    </span>
                                                    {discount > 0 && (
                                                        <div className="absolute -top-6 right-0 md:-right-6 px-3 py-1.5 rounded-full text-[10px] font-black shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse whitespace-nowrap bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 scale-110 z-20">
                                                            {discount}% OFF
                                                        </div>
                                                    )}
                                                </div>
                                                {billingCycle !== 'monthly' && (
                                                    <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-2 animate-in fade-in slide-in-from-left-2 duration-500">
                                                        <p>Equivalente a R$ {monthlyEquivalentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mês</p>
                                                    </div>
                                                )}
                                            </div>
                                            <p className="text-[12px] text-slate-500 mt-6 font-medium leading-relaxed">
                                                {shortDesc}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex-1 space-y-4 mb-10">
                                        {features.map((feature: string, idx: number) => (
                                            <div key={idx} className="flex gap-3 items-start group">
                                                <div className="mt-1 bg-emerald-500/10 text-emerald-500 p-0.5 rounded-full group-hover:scale-110 transition-transform">
                                                    <Check size={14} strokeWidth={4} />
                                                </div>
                                                <span className="text-slate-600 dark:text-slate-300 text-sm font-bold leading-tight">{feature}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {(isCurrentPlan) ? (
                                        <div className="w-full py-5 text-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-sm border border-emerald-100 dark:border-emerald-800 flex justify-center items-center gap-2">
                                            <Check size={18} /> {t('management.settings.plan.liberated') || 'Liberado'}
                                        </div>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                let userToUse = currentUser;
                                                if (userToUse === undefined) {
                                                    const supabase = createMasterClient();
                                                    const { data: { user } } = await supabase.auth.getUser();
                                                    userToUse = user;
                                                }

                                                const isStrategy = planName.toLowerCase().includes('strategy') || planName.toLowerCase().includes('estrategia');
                                                if (isStrategy && !userToUse) {
                                                    setIsAuthModalOpen(true);
                                                } else if (isStrategy && userToUse) {
                                                    setCheckoutData({ type: 'plan', planName: planName });
                                                    setIsCheckoutOpen(true);
                                                } else if (userToUse) {
                                                    setCheckoutData({ type: 'plan', planName: planName });
                                                    setIsCheckoutOpen(true);
                                                } else {
                                                    setIsAuthModalOpen(true);
                                                }
                                            }}
                                            className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${!plan.recommended
                                                ? 'border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/10 shadow-none'
                                                : 'bg-branding-gradient animate-gradient text-white shadow-2xl shadow-blue-600/30 hover:scale-[1.02]'
                                                }`}
                                        >
                                            {currentUser ? (t('management.settings.plan.acquirePlan') || 'Adquirir Plano') : (t('pricingPage.plans.start.cta') || 'Começar Teste Grátis')}
                                        </button>
                                    )}

                                    {/* CLUBE VIP BANNER FOR PREMIUM PLANS */}
                                    {(planName.toLowerCase().includes('growth') || planName.toLowerCase().includes('strategy') || planName.toLowerCase().includes('crescimento') || planName.toLowerCase().includes('estrategia')) && (
                                        <Link href="/clube-vip" className="mt-4 p-3 bg-gradient-to-r from-amber-500/10 flex items-center gap-3 to-orange-500/10 border border-amber-500/30 rounded-xl relative overflow-hidden group hover:border-amber-500/50 transition-colors cursor-pointer block">
                                            <div className="absolute top-0 right-0 w-20 h-20 bg-amber-500/10 blur-[20px] rounded-full pointer-events-none" />
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
                                                <Crown size={16} />
                                            </div>
                                            <div className="flex-1 text-left relative z-10">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-500 group-hover:underline">{t('pricingPage.infrastructure.vipBonusTitle') || 'Clube VIP Veritum'}</p>
                                                <p className="text-[9px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{t('pricingPage.infrastructure.vipBonusDesc')}</p>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="col-span-3 flex justify-center py-20">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            </div>
                        )}
                    </div>

                    {dbPlans.filter(p => !p.is_combo).length > 0 && (
                        <div id="modulos-avulsos" className="mt-40 scroll-mt-32">
                            <div className="text-center mb-16">
                                <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-sm">{t('pricingPage.modules.badge')}</span>
                                <h2 className="text-4xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white tracking-tighter">{t('pricingPage.modules.title')}</h2>
                                <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium max-w-3xl mx-auto">{t('pricingPage.modules.subtitle')}</p>

                                <div className="flex justify-center mt-12 mb-4">
                                    <div className="flex flex-wrap justify-center items-center bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-2xl gap-1">
                                        <button
                                            onClick={() => setModulesBillingCycle('monthly')}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modulesBillingCycle === 'monthly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            {t('management.settings.plan.monthly') || 'MENSAL'}
                                        </button>
                                        <button
                                            onClick={() => setModulesBillingCycle('quarterly')}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modulesBillingCycle === 'quarterly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            {t('management.settings.plan.quarterly') || 'TRIMESTRAL'}
                                        </button>
                                        <button
                                            onClick={() => setModulesBillingCycle('semiannual')}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modulesBillingCycle === 'semiannual' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            {t('management.settings.plan.semiannual') || 'SEMESTRAL'}
                                        </button>
                                        <button
                                            onClick={() => setModulesBillingCycle('yearly')}
                                            className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${modulesBillingCycle === 'yearly' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md translate-y-[-1px]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                        >
                                            {t('management.settings.plan.yearly') || 'ANUAL'}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
                                {dbPlans.filter(p => !p.is_combo).map((plan, i) => {
                                    const isCurrentPlan = currentUser?.profile?.plan_id === plan.id;
                                    const isSocioAdmin = currentUser?.profile?.role === 'Master' || (currentUser?.profile?.access_groups && currentUser.profile.access_groups.name?.includes('Sócio-Administra'));

                                    const basePrice = plan.monthly_price || 0;
                                    let months = 1;
                                    let discount = 0;
                                    let cycleLabel = '/ mês';

                                    if (modulesBillingCycle === 'monthly') {
                                        months = 1;
                                        discount = plan.monthly_discount || 0;
                                        cycleLabel = (t('management.settings.plan.perMonth') || '/ mês');
                                    } else if (modulesBillingCycle === 'quarterly') {
                                        months = 3;
                                        discount = plan.quarterly_discount || 0;
                                        cycleLabel = '/ 3 meses';
                                    } else if (modulesBillingCycle === 'semiannual') {
                                        months = 6;
                                        discount = plan.semiannual_discount || 0;
                                        cycleLabel = '/ 6 meses';
                                    } else if (modulesBillingCycle === 'yearly') {
                                        months = 12;
                                        discount = plan.yearly_discount || 0;
                                        cycleLabel = (t('management.settings.plan.perYear') || '/ ano');
                                    }

                                    const fullPrice = basePrice * months;
                                    const finalPrice = discount > 0 ? fullPrice * (1 - discount / 100) : fullPrice;
                                    const monthlyEquivalentPrice = finalPrice / months;

                                    const lang = locale as 'pt' | 'en' | 'es';
                                    const planName = typeof plan.name === 'string' ? plan.name : (plan.name?.[lang] || plan.name?.pt || '');
                                    const rawFeatures = plan.features?.[lang] || plan.features?.pt || plan.features;
                                    const features = Array.isArray(rawFeatures) ? rawFeatures : (typeof rawFeatures === 'object' && rawFeatures !== null ? Object.values(rawFeatures) : []);

                                    return (
                                        <div key={i} className={`relative flex flex-col p-8 rounded-[2rem] border transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl flex-1 bg-white dark:bg-slate-900/50 border-slate-200 dark:border-slate-800`}>
                                            <div className="mb-6">
                                                <h3 className={`text-lg font-black mb-2 ${isCurrentPlan ? 'text-amber-500' : 'text-slate-900 dark:text-white'}`}>
                                                    {planName} {isCurrentPlan && `(${t('management.settings.plan.current') || 'Atual'})`}
                                                </h3>

                                                <div className="mb-4 flex flex-col items-baseline gap-1 relative">
                                                    {discount > 0 ? (
                                                        <span className="text-[13px] font-bold text-slate-500 line-through decoration-rose-500 decoration-2">
                                                            R$ {basePrice?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                                                        </span>
                                                    ) : (
                                                        <div className="h-[19.5px]" />
                                                    )}

                                                    <div className="flex flex-col gap-0.5 relative group">
                                                        <div className="flex items-baseline gap-1">
                                                            <span className="text-3xl font-black text-slate-900 dark:text-white whitespace-nowrap">R$ {(finalPrice || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">
                                                                {cycleLabel}
                                                            </span>
                                                            {discount > 0 && (
                                                                <div className="absolute -top-4 -right-1 px-2 py-1 rounded-full text-[8px] font-black shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-pulse whitespace-nowrap bg-emerald-500 text-slate-950 ring-2 ring-emerald-400/50 rotate-6 z-20">
                                                                    {discount}% OFF
                                                                </div>
                                                            )}
                                                        </div>
                                                        {modulesBillingCycle !== 'monthly' && (
                                                            <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 mt-1 animate-in fade-in slide-in-from-left-2 duration-500">
                                                                <p>Equivalente a R$ {monthlyEquivalentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mês</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed min-h-[48px]">
                                                    {typeof plan.short_desc === 'object' ? (plan.short_desc?.[lang] || plan.short_desc?.pt) : plan.short_desc}
                                                </p>
                                            </div>

                                            <div className="mt-auto pt-6 border-t border-slate-100 dark:border-slate-800">
                                                {(isCurrentPlan) ? (
                                                    <div className="w-full py-4 text-center bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl font-black uppercase tracking-widest text-[10px] border border-emerald-100 dark:border-emerald-800 flex justify-center items-center gap-2">
                                                        <Check size={16} /> {t('management.settings.plan.liberated') || 'Liberado'}
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={async () => {
                                                            let userToUse = currentUser;
                                                            if (userToUse === undefined) {
                                                                const supabase = createMasterClient();
                                                                const { data: { user } } = await supabase.auth.getUser();
                                                                userToUse = user;
                                                            }

                                                            if (userToUse) {
                                                                setCheckoutData({ type: 'module', moduleName: planName });
                                                                setIsCheckoutOpen(true);
                                                            } else {
                                                                setIsAuthModalOpen(true);
                                                            }
                                                        }}
                                                        className={`w-full py-4 rounded-xl font-black text-[10px] tracking-widest uppercase transition-all shadow-sm border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700`}
                                                    >
                                                        {currentUser ? (t('management.settings.plan.acquireModule') || 'Adquirir Módulo') : (t('pricingPage.plans.start.cta') || 'Começar Teste Grátis')}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </section>

            {/* Comparison Table Toggle */}
            <section id="comparison" className="pb-32 px-6 scroll-mt-32">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-8">{t('pricingPage.comparison.label')}</p>
                    <button
                        onClick={() => setShowComparison(!showComparison)}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
                    >
                        {showComparison ? t('pricingPage.comparison.hide') : t('pricingPage.comparison.show')} {t('pricingPage.comparison.cta')}
                        {showComparison ? <ChevronUp size={20} className="group-hover:-translate-y-1 transition-transform" /> : <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />}
                    </button>

                    {showComparison && (
                        <div className="mt-16 overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-3xl bg-white dark:bg-slate-900 animate-fade-in">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left p-8 text-xs font-black uppercase text-slate-400 tracking-widest">{t('pricingPage.comparison.headers.feature')}</th>
                                        <th className="p-8 text-xs font-black uppercase text-slate-400 tracking-widest">{t('pricingPage.comparison.headers.start')}</th>
                                        <th className="p-8 text-xs font-black uppercase text-indigo-500 tracking-widest">{t('pricingPage.comparison.headers.growth')}</th>
                                        <th className="p-8 text-xs font-black uppercase text-slate-400 tracking-widest">{t('pricingPage.comparison.headers.strategy')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {comparisonData.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="p-8 text-left">
                                                <div className="text-[10px] font-black uppercase text-indigo-500 mb-1 opacity-70">{row.category}</div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{row.label}</div>
                                            </td>
                                            <td className="p-8 text-center">
                                                {typeof row.start === 'boolean' ? (row.start ? <Check className="mx-auto text-emerald-500" strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />) : <span className="text-xs font-bold text-slate-500">{row.start}</span>}
                                            </td>
                                            <td className="p-8 text-center bg-indigo-50/30 dark:bg-indigo-500/5">
                                                {typeof row.growth === 'boolean' ? (row.growth ? <Check className="mx-auto text-indigo-500" strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />) : <span className="text-xs font-bold text-indigo-500">{row.growth}</span>}
                                            </td>
                                            <td className="p-8 text-center">
                                                {typeof row.strategy === 'boolean' ? (row.strategy ? <Check className="mx-auto text-emerald-500" strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />) : <span className="text-xs font-bold text-slate-500">{row.strategy}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* Bundle Justification */}
            <section className="py-32 px-6 bg-slate-50 dark:bg-slate-900/80 rounded-[4rem] mx-6 relative overflow-hidden text-slate-900 dark:text-white border border-slate-100 dark:border-none transition-colors duration-300">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
                    <div className="flex-1 space-y-10">
                        <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter text-slate-900 dark:text-white">
                            {t('pricingPage.whyChoose.title')} <br />
                            <span className="text-branding-gradient">{t('pricingPage.whyChoose.titleAccent')}</span>
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {t('pricingPage.whyChoose.subtitle').split('Flow').map((part: string, i: number) => (
                                i === 0 ? <React.Fragment key={i}>{part}</React.Fragment> : <React.Fragment key={i}><span className="text-slate-900 dark:text-white italic">Flow</span>{part}</React.Fragment>
                            ))}
                        </p>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { title: t('pricingPage.whyChoose.items.0.title'), desc: t('pricingPage.whyChoose.items.0.desc') },
                            { title: t('pricingPage.whyChoose.items.1.title'), desc: t('pricingPage.whyChoose.items.1.desc') },
                            { title: t('pricingPage.whyChoose.items.2.title'), desc: t('pricingPage.whyChoose.items.2.desc') },
                            { title: t('pricingPage.whyChoose.items.3.title'), desc: t('pricingPage.whyChoose.items.3.desc') }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 rounded-3xl shadow-sm">
                                <h4 className="font-black mb-1 tracking-tight text-indigo-600 dark:text-indigo-400">{item.title}</h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Infrastructure Section */}
            <section id="infrastructure" className="pb-32 px-6 bg-white dark:bg-slate-950 transition-colors duration-300 scroll-mt-32">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                            {t('pricingPage.infrastructure.eliteTitle')}
                        </span>
                        <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">
                            {t('pricingPage.infrastructure.dbPlans.title')}
                        </h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                        {/* Pro Plan - Cloud Professional */}
                        <div className="relative p-12 rounded-[3.5rem] bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-col hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl group">
                            <div className="absolute -top-4 right-12 bg-branding-gradient text-white px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:scale-110 transition-transform">
                                {t('pricingPage.infrastructure.dbPlans.pro.badge')}
                            </div>

                            <div className="mb-10">
                                <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                    {t('pricingPage.infrastructure.dbPlans.pro.name')}
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-base leading-relaxed">
                                    {t('pricingPage.infrastructure.dbPlans.pro.subtitle')}
                                </p>
                            </div>

                            <div className="flex-grow space-y-10">
                                {['compute', 'storage', 'security'].map((cat) => (
                                    <div key={cat} className="space-y-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-indigo-600 dark:text-indigo-400">
                                                {cat === 'compute' ? <Zap size={16} /> : cat === 'storage' ? <Database size={16} /> : <Lock size={16} />}
                                            </div>
                                            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                                                {t(`pricingPage.infrastructure.dbPlans.pro.categories.${cat}`)}
                                            </p>
                                        </div>
                                        <div className="space-y-3 pl-2">
                                            {(t('pricingPage.infrastructure.dbPlans.pro.features') as any[]).filter(f => f.category === cat).map((feature, idx) => (
                                                <div key={idx} className={`flex gap-3 items-start ${feature.isSub ? 'ml-8 -mt-2 opacity-70' : ''}`}>
                                                    {!feature.isSub && <Check size={14} className="mt-1 text-emerald-500 flex-shrink-0" strokeWidth={3} />}
                                                    <span className={`text-sm ${feature.isSub ? 'text-slate-400 italic' : 'text-slate-600 dark:text-slate-300 font-semibold'}`}>
                                                        {feature.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800">
                                <div className="mb-6 flex flex-col">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">{t('pricingPage.infrastructure.dbPlans.pro.price')}</span>
                                        <span className="text-slate-400 font-bold text-sm tracking-tight">{t('pricingPage.infrastructure.dbPlans.pro.interval')}</span>
                                    </div>
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black mt-2 uppercase tracking-widest">
                                        {t('pricingPage.infrastructure.dbPlans.pro.credits')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (currentUser) {
                                            setCheckoutData({ type: 'plan', planName: t('pricingPage.infrastructure.dbPlans.pro.name') as string });
                                            setIsCheckoutOpen(true);
                                        } else {
                                            openAuth('register');
                                        }
                                    }}
                                    className="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-slate-900/10 cursor-pointer"
                                >
                                    {t('pricingPage.infrastructure.dbPlans.pro.cta')}
                                </button>
                            </div>
                        </div>

                        {/* Team Plan - Cloud Enterprise */}
                        <div className="relative p-12 rounded-[3.5rem] bg-white dark:bg-slate-950 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 flex flex-col hover:border-indigo-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 group">
                            <div className="absolute -top-4 right-12 bg-white text-slate-900 px-5 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl group-hover:rotate-3 transition-transform">
                                {t('pricingPage.infrastructure.dbPlans.team.badge')}
                            </div>

                            <div className="mb-10">
                                <h4 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
                                    {t('pricingPage.infrastructure.dbPlans.team.name')}
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-base leading-relaxed">
                                    {t('pricingPage.infrastructure.dbPlans.team.subtitle')}
                                </p>
                            </div>

                            <div className="flex-grow space-y-6">
                                <p className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.2em] mb-6">
                                    {t('pricingPage.infrastructure.dbPlans.team.featuresTitle')}
                                </p>
                                <div className="space-y-5">
                                    {(t('pricingPage.infrastructure.dbPlans.team.features') as any[]).map((feature, idx) => (
                                        <div key={idx} className={`flex gap-3 items-start ${feature.isSub ? 'ml-8 -mt-2 opacity-60' : ''}`}>
                                            {!feature.isSub && (
                                                <div className="mt-1 w-5 h-5 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center flex-shrink-0">
                                                    <ShieldAlert size={12} />
                                                </div>
                                            )}
                                            <span className={`text-sm ${feature.isSub ? 'text-slate-400 dark:text-slate-500 italic' : 'text-slate-600 dark:text-slate-200 font-semibold'}`}>
                                                {feature.text}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="mt-12 pt-10 border-t border-slate-100 dark:border-slate-800">
                                <div className="mb-6 flex flex-col">
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black text-slate-900 dark:text-white">{t('pricingPage.infrastructure.dbPlans.team.price')}</span>
                                        <span className="text-slate-400 dark:text-slate-500 font-bold text-sm tracking-tight">{t('pricingPage.infrastructure.dbPlans.team.interval')}</span>
                                    </div>
                                    <p className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black mt-2 uppercase tracking-widest">
                                        {t('pricingPage.infrastructure.dbPlans.team.credits')}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        if (currentUser) {
                                            setCheckoutData({ type: 'plan', planName: t('pricingPage.infrastructure.dbPlans.team.name') as string });
                                            setIsCheckoutOpen(true);
                                        } else {
                                            openAuth('register');
                                        }
                                    }}
                                    className="w-full py-5 bg-indigo-600 text-white dark:bg-white dark:text-slate-900 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-indigo-600/10 cursor-pointer"
                                >
                                    {t('pricingPage.infrastructure.dbPlans.team.cta')}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-20 text-center">
                        <Link
                            href="/infrastructure"
                            className="text-sm text-slate-400 hover:text-indigo-600 font-bold transition-all flex items-center justify-center gap-2 group cursor-pointer"
                        >
                            {t('pricingPage.infrastructure.specificationsLink')}
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Subscription vs Installment Breakdown */}
            <section id="subscription" className="py-20 px-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-[3.5rem] p-10 md:p-16 border border-slate-100 dark:border-slate-800 shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-16">
                            <div className="lg:w-1/2 space-y-8">
                                <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest">
                                    {t('pricingPage.subscriptionModel.badge')}
                                </span>
                                <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white leading-tight tracking-tighter">
                                    {t('pricingPage.subscriptionModel.title')}
                                </h2>
                                <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {t('pricingPage.subscriptionModel.subtitle')}
                                </p>
                            </div>
                            <div className="lg:w-1/2 grid grid-cols-1 gap-6 w-full">
                                <div className="p-8 rounded-[2rem] bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 transform hover:scale-[1.02] transition-all">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-white/20 p-2 rounded-xl">
                                            <Check className="text-white" size={24} strokeWidth={3} />
                                        </div>
                                        <h4 className="text-xl font-bold">{t('pricingPage.subscriptionModel.subscription.title')}</h4>
                                    </div>
                                    <p className="text-indigo-50 font-medium leading-relaxed">
                                        {t('pricingPage.subscriptionModel.subscription.desc')}
                                    </p>
                                </div>
                                <div className="p-8 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 opacity-60 grayscale-[0.5]">
                                    <div className="flex items-center gap-4 mb-4">
                                        <div className="bg-slate-200 dark:bg-slate-700 p-2 rounded-xl text-slate-400">
                                            <X size={24} strokeWidth={3} />
                                        </div>
                                        <h4 className="text-xl font-bold text-slate-700 dark:text-slate-300">{t('pricingPage.subscriptionModel.installment.title')}</h4>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        {t('pricingPage.subscriptionModel.installment.desc')}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="mt-16 pt-12 border-t border-slate-100 dark:border-slate-800 relative z-10 text-center">
                            <p className="text-slate-600 dark:text-slate-400 font-bold leading-relaxed italic max-w-4xl mx-auto px-4">
                                "{t('pricingPage.subscriptionModel.modelDescription')}"
                            </p>
                        </div>

                        {/* Abstract background shapes */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500/5 blur-[100px] rounded-full pointer-events-none"></div>
                    </div>
                </div>
            </section>


            {/* FAQ */}
            <section id="faq" className="py-32 px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black mb-20 text-center text-slate-900 dark:text-white tracking-tighter">{t('pricingPage.faq.title')}</h2>
                    <div className="space-y-6">
                        {[
                            { q: t('pricingPage.faq.questions.0.q'), a: t('pricingPage.faq.questions.0.a') },
                            { q: t('pricingPage.faq.questions.1.q'), a: t('pricingPage.faq.questions.1.a') },
                            { q: t('pricingPage.faq.questions.2.q'), a: t('pricingPage.faq.questions.2.a') },
                            { q: t('pricingPage.faq.questions.3.q'), a: t('pricingPage.faq.questions.3.a') },
                            { q: t('pricingPage.faq.questions.4.q'), a: t('pricingPage.faq.questions.4.a') },
                            { q: t('pricingPage.faq.questions.5.q'), a: t('pricingPage.faq.questions.5.a') }
                        ].map((faq, i) => (
                            <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h4 className="font-black text-lg text-slate-900 dark:text-white mb-4 flex gap-3 text-left">
                                    <HelpCircle className="text-indigo-500 shrink-0" size={24} />
                                    {faq.q}
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-9">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black mb-8 text-slate-900 dark:text-white leading-tight tracking-tighter">
                        {t('pricingPage.finalCta.title')} <br />
                        <span className="text-branding-gradient">{t('pricingPage.finalCta.titleAccent')}</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        {t('pricingPage.finalCta.subtitle')}
                    </p>
                    {currentUser === undefined ? (
                        <div className="w-48 h-16 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-[2.5rem] mx-auto mt-4" />
                    ) : currentUser ? (
                        <Link
                            href="/veritum"
                            className="inline-flex items-center justify-center bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all cursor-pointer uppercase tracking-tight"
                        >
                            {t('pricingPage.finalCta.dashboard')}
                        </Link>
                    ) : (
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all cursor-pointer uppercase tracking-tight"
                        >
                            {t('pricingPage.finalCta.button')}
                        </button>
                    )}
                    <p className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-widest italic">
                        {t('pricingPage.finalCta.footer')}
                    </p>
                </div>
            </section>


            {/* Demo Modal */}
            {isDemoModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-10 shadow-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        {demoFormStatus === 'success' ? (
                            <div className="text-center py-10 animate-scale-up">
                                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <Sparkles size={40} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">{t('pricingPage.demoModal.successTitle')}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                                    {t('pricingPage.demoModal.successDesc').split('**').map((part: string, i: number) => (
                                        i === 1 ? <strong key={i}>{part}</strong> : <React.Fragment key={i}>{part}</React.Fragment>
                                    ))}
                                </p>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsDemoModalOpen(false)}
                                    className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"
                                >
                                    <ChevronDown className="rotate-180" size={24} />
                                </button>

                                <div className="mb-10">
                                    <div className="w-12 h-12 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                        <Briefcase size={24} />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">{t('pricingPage.demoModal.title')}</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">{t('pricingPage.demoModal.subtitle')}</p>
                                </div>

                                <form onSubmit={handleDemoSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('pricingPage.demoModal.labels.name')}</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder={t('pricingPage.demoModal.placeholders.name')}
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold"
                                            value={demoFormData.name}
                                            onChange={(e) => setDemoFormData({ ...demoFormData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('pricingPage.demoModal.labels.email')}</label>
                                            <input
                                                required
                                                type="email"
                                                placeholder={t('pricingPage.demoModal.placeholders.email')}
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold"
                                                value={demoFormData.email}
                                                onChange={(e) => setDemoFormData({ ...demoFormData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('pricingPage.demoModal.labels.whatsapp')}</label>
                                            <input
                                                required
                                                type="tel"
                                                placeholder={t('pricingPage.demoModal.placeholders.whatsapp')}
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold"
                                                value={demoFormData.whatsapp}
                                                onChange={(e) => setDemoFormData({ ...demoFormData, whatsapp: formatWhatsApp(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pb-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('pricingPage.demoModal.labels.teamSize')}</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold appearance-none cursor-pointer"
                                            value={demoFormData.teamSize}
                                            onChange={(e) => setDemoFormData({ ...demoFormData, teamSize: e.target.value })}
                                        >
                                            <option value="">{t('pricingPage.demoModal.placeholders.teamSize')}</option>
                                            <option value="1-5">{t('pricingPage.demoModal.teamOptions.small')}</option>
                                            <option value="6-20">{t('pricingPage.demoModal.teamOptions.medium')}</option>
                                            <option value="+20">{t('pricingPage.demoModal.teamOptions.large')}</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">{t('pricingPage.demoModal.labels.dateRange')}</label>

                                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl p-5">
                                            {/* Calendar Header */}
                                            <div className="flex items-center justify-between mb-6 px-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                                    disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(new Date()))}
                                                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400 disabled:opacity-20"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <h4 className="font-black uppercase tracking-widest text-sm text-slate-800 dark:text-white">
                                                    {format(currentMonth, locale === 'en' ? 'MMMM yyyy' : 'MMMM yyyy', { locale: dateLocale })}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>

                                            {/* Calendar Grid */}
                                            <div className="grid grid-cols-7 gap-1 text-center">
                                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                                                    <div key={i} className="text-[10px] font-black text-slate-400 pb-2">{day}</div>
                                                ))}
                                                {(() => {
                                                    const days = [];
                                                    let day = startOfWeek(startOfMonth(currentMonth));
                                                    const lastDay = endOfWeek(endOfMonth(currentMonth));

                                                    while (day <= lastDay) {
                                                        const cloneDay = day;
                                                        const isSelected = (selectedRange.start && isSameDay(cloneDay, selectedRange.start)) ||
                                                            (selectedRange.end && isSameDay(cloneDay, selectedRange.end));
                                                        const isInRange = selectedRange.start && selectedRange.end &&
                                                            cloneDay > selectedRange.start && cloneDay < selectedRange.end;
                                                        const isToday = isSameDay(cloneDay, new Date());
                                                        const isDisabled = isBefore(startOfDay(cloneDay), startOfDay(new Date()));
                                                        const isCurrentMonth = isSameMonth(cloneDay, currentMonth);

                                                        days.push(
                                                            <button
                                                                key={day.toString()}
                                                                type="button"
                                                                disabled={isDisabled}
                                                                onClick={() => {
                                                                    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
                                                                        setSelectedRange({ start: cloneDay, end: null });
                                                                    } else if (cloneDay < selectedRange.start) {
                                                                        setSelectedRange({ start: cloneDay, end: selectedRange.start });
                                                                    } else {
                                                                        setSelectedRange({ ...selectedRange, end: cloneDay });
                                                                    }
                                                                }}
                                                                className={`
                                                                    h-10 w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all
                                                                    ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-200'}
                                                                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : isInRange ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-600/20' : isToday ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-white dark:hover:bg-slate-900'}
                                                                    ${isDisabled ? 'opacity-20 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
                                                                `}
                                                            >
                                                                {format(cloneDay, 'd')}
                                                            </button>
                                                        );
                                                        day = addDays(day, 1);
                                                    }
                                                    return days;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 px-2">
                                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <Sparkles size={14} className="text-indigo-500" />
                                                {t('pricingPage.demoModal.calendar.tooltip1')}
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <ChevronRight size={14} className="text-indigo-500" />
                                                {t('pricingPage.demoModal.calendar.tooltip2')}
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={demoFormStatus === 'submitting' || !selectedRange.start || !selectedRange.end}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 hover:scale-[1.02] shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 disabled:shadow-none mt-4"
                                    >
                                        {demoFormStatus === 'submitting' ? (
                                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                {t('pricingPage.demoModal.submitBtn')} <Send size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                mode={authMode}
            />

            <LegalModal
                isOpen={legalModal.isOpen}
                onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
                type={legalModal.type}
            />

            <CompanyModal
                isOpen={isCompanyModalOpen}
                onClose={() => setIsCompanyModalOpen(false)}
            />

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                {...checkoutData}
            />

            <Footer setIsCompanyModalOpen={setIsCompanyModalOpen} openLegal={openLegal} />
        </div>
    );
}
