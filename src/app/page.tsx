'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShieldAlert, GitBranch, FileEdit, DollarSign, BarChart3,
    MessageSquare, Globe, Moon, Sun, ArrowRight, Check,
    LogIn, UserPlus, ChevronRight, Scale, LogOut, User,
    Briefcase, Zap, Lock, LayoutDashboard
} from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
import { SuiteDetailModal } from '@/components/suite-detail-modal';
import { useTheme } from 'next-themes'
import Link from 'next/link'
import { AnimatePresence } from 'framer-motion'
import { UserMenu } from '@/components/ui/user-menu'
import { getModuleMeta } from '@/utils/module-meta';
import { useTranslation } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';

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
        <Suspense fallback={<div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>}>
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

    useEffect(() => {
        if (searchParams.get('login') === 'true' && (hasAccess || currentUser)) {
            setAuthMode('login');
            setIsAuthModalOpen(true);
            router.replace('/', { scroll: false });
        }
    }, [searchParams, router, hasAccess, currentUser]);

    useEffect(() => {
        if (mounted) {
            const accessParam = searchParams.get('access');
            const savedAccess = localStorage.getItem('veritum_access');

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

    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
        isOpen: false,
        type: 'privacy'
    });

    const [detailModal, setDetailModal] = useState<{ isOpen: boolean; suite: DbSuite | null }>({
        isOpen: false,
        suite: null
    });


    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile, error } = await supabase
                    .from('users')
                    .select('name, avatar_url, role, plan_id, access_group_id, access_groups(name, name_loc), plans:plan_id(name)')
                    .eq('id', user.id)
                    .single();

                if (error) console.error("Error fetching user profile:", error);

                if (profile) {
                    const profileData = profile as any;
                    const groupNameRaw = Array.isArray(profileData?.access_groups)
                        ? profileData.access_groups[0]?.name
                        : profileData?.access_groups?.name;

                    const groupNameTranslated = Array.isArray(profileData?.access_groups)
                        ? (profileData.access_groups[0]?.name_loc?.[locale] || profileData.access_groups[0]?.name)
                        : (profileData?.access_groups?.name_loc?.[locale] || profileData?.access_groups?.name);

                    const planName = profileData?.plans?.name || (Array.isArray(profileData?.plans) ? profileData?.plans[0]?.name : undefined);

                    profileData.plan_name = planName;
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
                }

                setCurrentUser({ ...user, profile });
            } else {
                setCurrentUser(null);
            }
        };
        fetchUser();

        const fetchData = async () => {
            const { data: suitesRes } = await supabase.from('suites').select('*').eq('active', true).order('order_index', { ascending: true });
            if (suitesRes) setSuites(suitesRes);

            // Now resolve auth and everything else
            await fetchUser();
            setIsLoading(false);
        };
        fetchData();
    }, [supabase]);

    const openAuth = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
    };

    const openLegal = (type: 'privacy' | 'terms') => {
        setLegalModal({ isOpen: true, type });
    };

    useEffect(() => {
        if (mounted) {
            const savedTheme = localStorage.getItem('veritum-theme');
            if (savedTheme) {
                setTheme(savedTheme);
            }
        }
    }, [mounted, setTheme]);

    const toggleTheme = () => {
        const currentTheme = theme === 'system' ? resolvedTheme : theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
        localStorage.setItem('veritum-theme', newTheme);
    }

    // Prevent hydration mismatch
    if (!mounted) return null

    return (
        <div className="min-h-screen transition-colors duration-500 bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 glass border-b transition-colors duration-300 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white">VERITUM <span className="text-branding-gradient">PRO</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#" className="font-medium hover:text-indigo-600 transition-colors text-slate-800 dark:text-white">{t('nav.home')}</a>
                        <a href="#modules" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('nav.modules')}</a>
                        <a href="#pricing" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('nav.pricing')}</a>
                        <Link href="/history" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('nav.story')}</Link>
                    </div>

                    <div className="flex items-center gap-4">
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
                                    className="hidden sm:flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all hover:scale-105"
                                >
                                    <LayoutDashboard size={18} />
                                    Painel Pro
                                </Link>
                                <UserMenu user={currentUser} supabase={supabase} />
                            </div>
                        ) : hasAccess ? (
                            <>
                                <button onClick={() => openAuth('login')} className="hidden sm:flex items-center gap-2 font-semibold px-4 py-2 hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer">
                                    <LogIn size={18} /> {t('nav.login')}
                                </button>
                                <button onClick={() => openAuth('register')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer">
                                    <UserPlus size={18} /> {t('nav.register')}
                                </button>
                            </>
                        ) : null}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] text-slate-900 dark:text-white">
                        {t('hero.title')} <span className="text-branding-gradient">{t('hero.titleAccent')}</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                        {t('hero.subtitle')}
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        {(hasAccess || currentUser) && (
                            <button onClick={() => openAuth('register')} className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-bold text-lg shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer">
                                {t('hero.ctaPrimary')} <ArrowRight size={20} />
                            </button>
                        )}
                        <Link href="/pricing" className="w-full sm:w-auto px-10 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center cursor-pointer">
                            {t('hero.ctaSecondary')}
                        </Link>
                    </div>
                </div>

                {/* Background blobs */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-400/20 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-400/10 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Modules Grid */}
            <section id="modules" className="py-32 px-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 border-y border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">{t('modules.title')}</h2>
                        <p className="text-slate-500 dark:text-slate-400">{t('modules.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {isLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-900/50 h-64 rounded-[2rem] animate-pulse"></div>
                            ))
                        ) : (
                            (() => {
                                const groupKeywords = ['Sócio-Administrativo', 'Sócio-Administrador', 'Sócio Administrador'];
                                const isSocioAdmin = currentUser?.profile?.role === 'Master' || (userGroupName && groupKeywords.some(g => userGroupName.includes(g)));

                                const displaySuites = suites.filter(suite => {
                                    if (!currentUser) return true; // Visitors see everything (Saiba mais)
                                    if (isSocioAdmin) return true; // SocioAdmins see everything (Locked/Unlocked)

                                    const suiteKey = suite.suite_key.toLowerCase().replace('_key', '');

                                    // 1. Plan Check (HIGH PRIORITY)
                                    const hasPlanAccess = planPermissions.includes(suiteKey);
                                    if (!hasPlanAccess) return false;

                                    // 2. Access Group Check (RBAC)
                                    if (currentUser.profile?.access_group_id) {
                                        const suiteFeatureIds = allFeatures.filter(f => f.suite_id === suite.id).map(f => f.id);
                                        const hasGroupAccess = groupPermissions.some(p => suiteFeatureIds.includes(p.feature_id) && p.can_access);
                                        return hasGroupAccess;
                                    }

                                    return true;
                                });

                                return displaySuites.map((suite) => {
                                    const suiteKey = suite.suite_key.toLowerCase().replace('_key', '');
                                    const hasPlanAccess = planPermissions.includes(suiteKey);

                                    // isLocked: Only for SocioAdmin if module not in plan
                                    const isLocked = currentUser && isSocioAdmin && !hasPlanAccess;

                                    // For cards that are visible, we decide if they can 'Access' or 'Learn More'
                                    // If we are here, and not an admin, we MUST have access (because of the filter)
                                    const showLearnMore = !currentUser;

                                    const meta = getModuleMeta(suite.suite_key);
                                    const Icon = meta?.icon || LayoutDashboard;
                                    const iconColor = meta?.color || 'text-indigo-600';

                                    return (
                                        <div key={suite.id} className={`relative bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group flex flex-col ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}>
                                            {isLocked && (
                                                <div className="absolute top-6 right-6 p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl" title={t('modules.notInPlan')}>
                                                    <Lock size={20} />
                                                </div>
                                            )}

                                            <div
                                                className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center transition-transform group-hover:scale-110 ${isLocked ? 'bg-slate-50 dark:bg-slate-800 text-slate-400' : `${iconColor.replace('text-', 'bg-')}/10 ${iconColor}`}`}
                                            >
                                                <Icon size={32} />
                                            </div>
                                            <h3 className="text-2xl font-bold mb-1 text-slate-800 dark:text-white">
                                                {suite.name.split(/\b(PRO)\b/i).map((part, i) =>
                                                    part.toUpperCase() === 'PRO' ? (
                                                        <span key={i} className="text-branding-gradient">{part}</span>
                                                    ) : part
                                                )}
                                            </h3>
                                            <h4 className="text-indigo-600 dark:text-indigo-400 text-sm font-bold versalete mb-4">
                                                {suite.short_desc?.[locale] || suite.short_desc?.pt || ''}
                                            </h4>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6 flex-grow">
                                                {suite.detailed_desc?.[locale] || suite.detailed_desc?.pt || ''}
                                            </p>

                                            {isLocked && (
                                                <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 mb-4 tracking-widest italic text-center">
                                                    {t('modules.notInPlan')}
                                                </p>
                                            )}

                                            <button
                                                onClick={() => {
                                                    if (isLocked) {
                                                        router.push('/pricing');
                                                    } else if (showLearnMore) {
                                                        const suiteSlug = suite.suite_key.toLowerCase().replace('_key', '');
                                                        router.push(`/${suiteSlug}`);
                                                    } else {
                                                        router.push(`/veritum?module=${suite.suite_key}`);
                                                    }
                                                }}
                                                className={`font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all mt-auto cursor-pointer ${isLocked ? 'text-amber-600 dark:text-amber-500' : 'text-indigo-600 dark:text-indigo-400'}`}
                                            >
                                                {isLocked ? t('modules.acquire') : (showLearnMore ? t('modules.learnMore') : t('modules.access'))} <ChevronRight size={16} />
                                            </button>
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

            {/* Pricing */}
            <section id="pricing" className="py-32 px-6 bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <h2 className="text-4xl md:text-5xl font-black mb-6 text-slate-900 dark:text-white uppercase tracking-tighter">
                            {t('pricing.title').split('crescimento').map((part: string, i: number) =>
                                i === 0 ? <React.Fragment key={i}>{part}</React.Fragment> : <span key={i} className="text-branding-gradient">crescimento.</span>
                            )}
                        </h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                            {t('pricing.subtitle')}
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
                            <div key={i} className="relative p-10 bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300 group flex flex-col items-center text-center">
                                {card.badge && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg">
                                        {card.badge}
                                    </div>
                                )}
                                <div className={`w-16 h-16 rounded-2xl bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${card.color}`}>
                                    <card.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 text-slate-900 dark:text-white uppercase tracking-tight">{card.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {card.desc}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="text-center">
                        <Link
                            href="/pricing"
                            className="inline-flex items-center gap-3 bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all uppercase tracking-tight"
                        >
                            {t('pricing.compare')} <ArrowRight size={24} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white">VERITUM <span className="text-branding-gradient">PRO</span></span>
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">
                        {locale === 'pt' ? 'Desenvolvido por AgTech | LegalTech de Alta Performance © 2024 Todos os direitos reservados.' : 'Developed by AgTech | High Performance LegalTech © 2024 All rights reserved.'}
                    </p>
                    <div className="flex gap-6">
                        <Link
                            href="/privacy"
                            onClick={(e) => { e.preventDefault(); openLegal('privacy'); }}
                            className="text-sm text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                            {t('common.privacy')}
                        </Link>
                        <Link
                            href="/terms"
                            onClick={(e) => { e.preventDefault(); openLegal('terms'); }}
                            className="text-sm text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                        >
                            {t('common.terms')}
                        </Link>
                    </div>
                </div>
            </footer>

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
        </div>
    );
}
