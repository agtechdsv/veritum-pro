'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShieldAlert, GitBranch, FileEdit, DollarSign, BarChart3,
    MessageSquare, Globe, Moon, Sun, ArrowRight, Check,
    LogIn, UserPlus, ChevronRight, Scale, LogOut, User,
    Briefcase, Zap, Lock, LayoutDashboard, Database, Cloud, Crown
} from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
import { CompanyModal } from '@/components/company-modal';
import { SuiteDetailModal } from '@/components/suite-detail-modal';
import { CheckoutModal } from '@/components/modules/checkout-modal';
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { UserMenu } from '@/components/ui/user-menu'
import { getModuleMeta } from '@/utils/module-meta';
import { useTranslation } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';
import { Footer } from '@/components/shared/footer';

interface Suite {
    id: string;
    title: string;
    sub: string;
    desc: string;
    icon: React.ElementType;
    color: string;
}

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3v18"></path><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M7 21h10"></path></svg>
    </div>
);

export default function LandingPage() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)
    useEffect(() => {
        setMounted(true)
    }, [])

    return (
        <Suspense fallback={<div className="min-h-screen bg-white dark:bg-slate-950 flex items-center justify-center transition-colors duration-500"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
            <LandingPageContent
                theme={theme}
                setTheme={setTheme}
                resolvedTheme={resolvedTheme}
                mounted={mounted}
            />
        </Suspense>
    )
}

import { createMasterClient } from '@/lib/supabase/master';
import { Suite as DbSuite } from '@/types';


function LandingPageContent({ theme, setTheme, resolvedTheme, mounted }: any) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [suites, setSuites] = useState<DbSuite[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(undefined);
    const [planPermissions, setPlanPermissions] = useState<string[]>([]);
    const [userGroupName, setUserGroupName] = useState<string | null>(null);
    const [groupPermissions, setGroupPermissions] = useState<any[]>([]);
    const [allFeatures, setAllFeatures] = useState<any[]>([]);
    const [hasAccess, setHasAccess] = useState(false);
    const { locale, t } = useTranslation();
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createMasterClient();

    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
        isOpen: false,
        type: 'privacy'
    });

    const [detailModal, setDetailModal] = useState<{ isOpen: boolean; suite: DbSuite | null }>({
        isOpen: false,
        suite: null
    });
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [checkoutData, setCheckoutData] = useState<{ planName?: string; moduleName?: string; type: 'plan' | 'module' }>({ type: 'plan' });

    useEffect(() => {
        if (mounted) {
            const accessParam = searchParams.get('access');
            const inviteParam = searchParams.get('invite');
            const savedAccess = localStorage.getItem('veritum_access');

            // Persist invitation code
            if (inviteParam) {
                console.log('Detectada indicação VIP:', inviteParam);
                localStorage.setItem('veritum_ref_code', inviteParam.toUpperCase());
            }

            if (accessParam === 'veritas') {
                localStorage.setItem('veritum_access', 'granted');
                // Set cookie for middleware
                document.cookie = "veritum_access=granted; path=/; max-age=31536000"; // 1 year
                setHasAccess(true);

                // Clean URL
                const params = new URLSearchParams(searchParams.toString());
                params.delete('access');
                const newUrl = params.toString() ? `/?${params.toString()}` : '/';
                router.replace(newUrl, { scroll: false });
            } else if (savedAccess === 'granted') {
                setHasAccess(true);
            }
        }
    }, [mounted, searchParams, router]);

    const loadInitialData = React.useCallback(async () => {
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('name, avatar_url, role, plan_id, access_group_id, access_groups(name), plans:plan_id(name)')
                .eq('id', user.id)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error("Error fetching user profile:", profileError.message || profileError);
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

                setUserGroupName(groupNameRaw);

                // Fetch plan permissions
                const planId = profile.plan_id;
                if (planId) {
                    const { data: perms } = await supabase
                        .from('plan_permissions')
                        .select('features(suites(suite_key))')
                        .eq('plan_id', planId);

                    if (perms) {
                        const suitesWithAccess = Array.from(new Set(
                            perms.map((p: any) => p.features?.suites?.suite_key?.toLowerCase().replace('_key', ''))
                                .filter(Boolean)
                        )) as string[];
                        setPlanPermissions(suitesWithAccess);
                    }
                } else if (user.user_metadata?.parent_user_id) {
                    const { data: parent } = await supabase
                        .from('users')
                        .select('plan_id, plans:plan_id(name)')
                        .eq('id', user.user_metadata.parent_user_id)
                        .single();
                    if (parent?.plan_id) {
                        const parentData = parent as any;
                        const inheritedPlanName = parentData?.plans?.name || (Array.isArray(parentData?.plans) ? parentData?.plans[0]?.name : undefined);
                        profileData.plan_name = inheritedPlanName;

                        const { data: perms } = await supabase
                            .from('plan_permissions')
                            .select('features(suites(suite_key))')
                            .eq('plan_id', parent.plan_id);

                        if (perms) {
                            const suitesWithAccess = Array.from(new Set(
                                perms.map((p: any) => p.features?.suites?.suite_key?.toLowerCase().replace('_key', ''))
                                    .filter(Boolean)
                            )) as string[];
                            setPlanPermissions(suitesWithAccess);
                        }
                    }
                }

                // Fetch Dynamic Permissions (RBAC)
                const { data: featData } = await supabase.from('features').select('id, suite_id');
                if (featData) setAllFeatures(featData as any);

                if (profileData?.access_group_id && profileData?.role !== 'Master') {
                    const { data: permData } = await supabase
                        .from('group_permissions')
                        .select('*')
                        .eq('group_id', profileData.access_group_id);

                    if (permData) setGroupPermissions(permData);
                }
                setCurrentUser({ ...user, profile: profileData });
            } else {
                setCurrentUser({ ...user, profile: null });
            }
        } else {
            setCurrentUser(null);
        }

        const { data: suitesRes } = await supabase.from('suites').select('*').eq('active', true).order('order_index', { ascending: true });
        if (suitesRes) setSuites(suitesRes);

        setIsLoading(false);
    }, [supabase, locale]);

    useEffect(() => {
        loadInitialData();

        // Listener para mudanças de autenticação (importante para login via Popup/Google)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
            if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'USER_UPDATED') {
                loadInitialData();
            }
        });

        return () => subscription.unsubscribe();
    }, [loadInitialData, supabase]);

    useEffect(() => {
        if (currentUser && isAuthModalOpen) {
            setIsAuthModalOpen(false);
        }
    }, [currentUser, isAuthModalOpen]);

    useEffect(() => {
        const isLogin = searchParams.get('login') === 'true';
        const isSignup = searchParams.get('signup') === 'true';

        if (isLogin && !currentUser && currentUser !== undefined) {
            setAuthMode('login');
            setIsAuthModalOpen(true);
            const params = new URLSearchParams(searchParams.toString());
            params.delete('login');
            router.replace(params.toString() ? `/?${params.toString()}` : '/', { scroll: false });
        } else if (isSignup && !currentUser && currentUser !== undefined) {
            setAuthMode('register');
            setIsAuthModalOpen(true);
            const params = new URLSearchParams(searchParams.toString());
            params.delete('signup');
            router.replace(params.toString() ? `/?${params.toString()}` : '/', { scroll: false });
        }
    }, [searchParams, router, currentUser]);

    const openAuth = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
    };

    const openLegal = (type: 'privacy' | 'terms') => {
        setLegalModal({ isOpen: true, type });
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    }

    // Prevent hydration mismatch
    if (!mounted) return null

    return (
        <div className="min-h-screen transition-colors duration-500 bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass border-b transition-colors duration-300 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800">
                <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between whitespace-nowrap">
                    <div className="flex items-center gap-2 shrink-0">
                        <Logo />
                        <span className="font-extrabold text-xl tracking-tighter text-slate-900 dark:text-white whitespace-nowrap">VERITUM <span className="text-branding-gradient">PRO</span></span>
                    </div>

                    <div className="hidden lg:flex items-center gap-5">
                        <a href="#" className="font-medium hover:text-indigo-600 transition-colors text-slate-800 dark:text-white">{t('nav.home')}</a>
                        <a href="#modules" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('nav.modules')}</a>
                        <a href="#pricing" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('nav.pricing')}</a>
                        <Link href="/history" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('nav.story')}</Link>
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
                                    Painel Pro
                                </Link>
                                <UserMenu
                                    user={currentUser}
                                    supabase={supabase}
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

            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                {...checkoutData}
            />

            {/* Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <h1 className="text-5xl md:text-[4.25rem] font-black tracking-tight mb-8 leading-[1.1] text-slate-900 dark:text-white whitespace-pre-line max-w-5xl mx-auto">
                        {t('hero.title')} <span className="text-branding-gradient">{t('hero.titleAccent')}</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                        {t('hero.subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button
                            onClick={async () => {
                                let userToUse = currentUser;
                                if (userToUse === undefined) {
                                    const { data: { user } } = await supabase.auth.getUser();
                                    userToUse = user;
                                }

                                if (userToUse) {
                                    router.push('/veritum');
                                } else {
                                    openAuth('register');
                                }
                            }}
                            className="w-full sm:w-auto bg-branding-gradient animate-gradient text-white px-10 py-4 rounded-[2rem] font-black text-lg shadow-2xl shadow-blue-600/30 hover:scale-105 transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                            {t('hero.ctaPrimary')} <ArrowRight size={20} strokeWidth={3} />
                        </button>
                        <Link href="/pricing" className="w-full sm:w-auto px-10 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center cursor-pointer">
                            {t('hero.ctaSecondary')}
                        </Link>
                    </div>
                </div>

                {/* Background blobs */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-400/20 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-400/10 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Specialized Modules Showcase */}
            <section id="modules" className="py-32 px-6 bg-[#020617] transition-colors duration-300 border-y border-slate-900 relative">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl md:text-5xl font-black mb-4 text-white tracking-tighter">
                            {t('modules.title').split('Especializados').map((part: string, i: number) =>
                                i === 0 ? <React.Fragment key={i}>{part}</React.Fragment> : <span key={i} className="text-branding-gradient">Especializados</span>
                            )}
                        </h2>
                        <p className="text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
                            {t('modules.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {isLoading ? (
                            Array.from({ length: 7 }).map((_, i) => (
                                <div key={i} className="bg-slate-900/50 h-80 rounded-[2rem] border border-slate-800 animate-pulse"></div>
                            ))
                        ) : (
                            (() => {
                                // Define the 7 core modules to showcase
                                const coreModules = [
                                    { id: 'sentinel', key: 'SENTINEL_KEY' },
                                    { id: 'nexus', key: 'NEXUS_KEY' },
                                    { id: 'scriptor', key: 'SCRIPTOR_KEY' },
                                    { id: 'valorem', key: 'VALOREM_KEY' },
                                    { id: 'cognitio', key: 'COGNITIO_KEY' },
                                    { id: 'vox', key: 'VOX_KEY' },
                                    { id: 'intelligence', key: 'INTELLIGENCE_KEY' }
                                ];

                                // Use suites from DB or fallback to core modules for display
                                const displayData = suites.length > 0 ? suites : coreModules.map(m => ({
                                    id: m.id,
                                    suite_key: m.key,
                                    name: t(`modules.${m.id}.title`),
                                    short_desc: { pt: t(`modules.${m.id}.subtitle`), en: t(`modules.${m.id}.subtitle`), es: t(`modules.${m.id}.subtitle`) },
                                    detailed_desc: { pt: t(`modules.${m.id}.description`), en: t(`modules.${m.id}.description`), es: t(`modules.${m.id}.description`) }
                                }));

                                const groupKeywords = ['Sócio-Administrativo', 'Sócio-Administrador', 'Sócio Administrador'];
                                const isSocioAdmin = currentUser?.profile?.role === 'Master' || (userGroupName && groupKeywords.some(g => userGroupName.includes(g)));

                                return displayData.map((suite: any) => {
                                    const suiteKey = suite.suite_key?.toLowerCase().replace('_key', '') || suite.id;
                                    const hasPlanAccess = planPermissions.includes(suiteKey);
                                    const isLocked = currentUser && isSocioAdmin && !hasPlanAccess && suites.length > 0;

                                    const meta = getModuleMeta(suite.suite_key || suite.id);
                                    const Icon = meta?.icon || LayoutDashboard;
                                    const iconColor = meta?.color || 'text-indigo-600';

                                    const suiteName = typeof suite.name === 'object' ? (suite.name[locale] || suite.name.pt || '') : (suite.name || '');
                                    const suiteSubtitle = typeof suite.short_desc === 'object' ? (suite.short_desc[locale] || suite.short_desc.pt || '') : (suite.short_desc || '');
                                    const suiteDesc = typeof suite.detailed_desc === 'object' ? (suite.detailed_desc[locale] || suite.detailed_desc.pt || '') : (suite.detailed_desc || '');

                                    return (
                                        <div
                                            key={suite.id}
                                            className={`group relative bg-[#0f172a]/40 backdrop-blur-sm p-10 rounded-[2.5rem] border border-slate-800 transition-all duration-300 flex flex-col hover:bg-[#0f172a]/60 ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}
                                        >
                                            <div className={`w-14 h-14 rounded-2xl mb-8 flex items-center justify-center transition-all duration-300 ${isLocked ? 'bg-slate-800 text-slate-400' : `${iconColor.replace('text-', 'bg-')}/10 ${iconColor}`}`}>
                                                <Icon size={28} />
                                            </div>

                                            <div className="space-y-2 mb-8 flex-grow text-left">
                                                <h3 className="text-2xl font-black text-white leading-none">
                                                    {suiteName.split(/\b(PRO)\b/i).map((part: string, i: number) =>
                                                        part.toUpperCase() === 'PRO' ? (
                                                            <span key={i} className="text-branding-gradient">{part}</span>
                                                        ) : part
                                                    )}
                                                </h3>
                                                <div className="text-indigo-400 text-sm font-bold">
                                                    {suiteSubtitle}
                                                </div>
                                                <p className="text-slate-400 text-sm leading-relaxed font-medium mt-4">
                                                    {suiteDesc}
                                                </p>
                                            </div>

                                            <div className="relative z-10 text-left mt-auto pt-6">
                                                <button
                                                    onClick={() => {
                                                        if (isLocked) {
                                                            setCheckoutData({ type: 'module', moduleName: suiteName });
                                                            setIsCheckoutOpen(true);
                                                        } else if (currentUser) {
                                                            router.push(`/veritum/${suiteKey}`);
                                                        } else {
                                                            router.push(`/${suiteKey}`);
                                                        }
                                                    }}
                                                    className="flex items-center gap-2 text-indigo-400 hover:text-indigo-200 font-bold text-sm transition-all group-hover:gap-3 cursor-pointer"
                                                >
                                                    {isLocked ? t('modules.acquire') : (currentUser ? t('modules.access') : t('modules.learnMore'))}
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>

                                            {isLocked && (
                                                <div className="mt-4 flex items-center gap-2 text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest italic">
                                                    <Lock size={12} />
                                                    {t('modules.notInPlan')}
                                                </div>
                                            )}
                                        </div>
                                    );
                                });
                            })()
                        )}
                    </div>
                </div>
            </section>

            <SuiteDetailModal
                isOpen={detailModal.isOpen}
                onClose={() => setDetailModal(prev => ({ ...prev, isOpen: false }))}
                suite={detailModal.suite}
            />

            {/* Pricing Section */}
            <section id="pricing" className="py-32 px-6 bg-[#020617] transition-colors duration-300 relative border-b border-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-white tracking-tighter">
                            {t('pricing.title').split('Crescimento').map((part: string, i: number) =>
                                i === 0 ? <React.Fragment key={i}>{part}</React.Fragment> : <span key={i} className="text-branding-gradient">Crescimento.</span>
                            )}
                        </h2>
                        <p className="text-xl text-slate-400 font-medium leading-relaxed">
                            {t('pricing.subtitle')}
                        </p>
                        <p className="text-lg text-slate-500 font-medium mt-6 leading-relaxed max-w-2xl mx-auto italic">
                            {t('pricing.cancelGuarantee')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        {[
                            {
                                title: t('pricing.plans.start.title'),
                                desc: t('pricing.plans.start.desc'),
                                icon: Briefcase,
                                color: 'text-blue-500',
                                badge: null
                            },
                            {
                                title: t('pricing.plans.growth.title'),
                                desc: t('pricing.plans.growth.desc'),
                                icon: Zap,
                                color: 'text-indigo-600',
                                badge: t('pricing.plans.growth.badge')
                            },
                            {
                                title: t('pricing.plans.strategy.title'),
                                desc: t('pricing.plans.strategy.desc'),
                                icon: BarChart3,
                                color: 'text-emerald-500',
                                badge: t('pricing.plans.strategy.badge')
                            }
                        ].map((card, i) => (
                            <div key={i} className="relative p-10 bg-[#0f172a]/40 backdrop-blur-sm rounded-[3rem] border border-slate-800 hover:bg-[#0f172a]/60 hover:border-indigo-500/30 transition-all duration-500 group flex flex-col items-center text-center">
                                {card.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {card.badge}
                                    </div>
                                )}
                                <div className={`w-16 h-16 rounded-2xl bg-slate-800 shadow-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${card.color}`}>
                                    <card.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 text-white tracking-tight">{card.title}</h3>
                                <p className="text-slate-400 font-medium leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-3 bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all uppercase tracking-tight cursor-pointer"
                        >
                            {t('pricing.compare')} <ArrowRight size={24} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Infrastructure Section - Cloud Plans focus */}
            <section id="infrastructure" className="pb-32 px-6 bg-[#020617] transition-colors duration-300">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16 max-w-4xl mx-auto">
                        <span className="text-indigo-400 font-bold tracking-[0.3em] uppercase text-xs mb-4 block">
                            Infraestrutura de Elite
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black text-white tracking-tighter">
                            {t('pricingPage.infrastructure.subtitle')}
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
                        {/* BYODB Card */}
                        <div className="group p-12 rounded-[3.5rem] bg-[#0f172a]/40 backdrop-blur-sm border border-slate-800 hover:border-indigo-500/50 transition-all duration-500 hover:shadow-2xl flex flex-col items-center text-center">
                            <div className="mb-8 w-20 h-20 bg-white/10 text-white rounded-[2rem] flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform duration-500">
                                <Database size={40} />
                            </div>
                            <h4 className="text-2xl font-black text-white mb-4 tracking-tight">
                                {t('pricingPage.infrastructure.byodbTitle')}
                            </h4>
                            <p className="text-slate-400 font-medium leading-relaxed mb-10 text-sm">
                                {t('pricingPage.infrastructure.byodbDesc')}
                            </p>
                            <div className="mt-auto px-8 py-3 bg-emerald-500/10 text-emerald-500 rounded-full font-black text-xs uppercase tracking-widest border border-emerald-500/20">
                                {t('management.settings.plan.liberated') || 'Liberado'}
                            </div>
                        </div>

                        {/* Managed Cloud Card */}
                        <div className="group p-12 rounded-[3.5rem] bg-slate-950 text-white border border-slate-800 hover:border-indigo-400/50 transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-500/10 relative flex flex-col items-center text-center">
                            <div className="absolute -top-4 right-10 bg-branding-gradient text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg z-10">
                                POPULAR 🔥
                            </div>
                            <div className="mb-8 w-20 h-20 bg-indigo-600 text-white rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-600/40 group-hover:scale-110 transition-transform duration-500">
                                <Cloud size={40} />
                            </div>
                            <h4 className="text-2xl font-black text-white mb-4 tracking-tight">
                                {t('pricingPage.infrastructure.cloudTitle')}
                            </h4>
                            <p className="text-slate-400 font-medium leading-relaxed mb-10 text-sm">
                                {t('pricingPage.infrastructure.cloudDesc')}
                            </p>
                            <Link
                                href="/infrastructure"
                                className="mt-auto text-indigo-400 hover:text-indigo-200 font-bold text-sm transition-all flex items-center gap-2 group-hover:gap-3"
                            >
                                {t('pricingPage.infrastructure.learnMore')}
                                <ArrowRight size={16} />
                            </Link>
                        </div>
                    </div>

                    <div className="mt-20 text-center flex flex-col items-center gap-8">
                        <Link
                            href="/infrastructure"
                            className="text-sm text-slate-400 hover:text-indigo-400 font-bold transition-all flex items-center justify-center gap-2 group cursor-pointer"
                        >
                            {t('pricingPage.infrastructure.specificationsLink')}
                            <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </Link>

                        <Link
                            href="/pricing#infrastructure"
                            className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all uppercase tracking-tight cursor-pointer"
                        >
                            {t('pricing.compare')} <ArrowRight size={20} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Standard Footer */}
            <Footer setIsCompanyModalOpen={setIsCompanyModalOpen} openLegal={openLegal} />

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
        </div >
    );
}
