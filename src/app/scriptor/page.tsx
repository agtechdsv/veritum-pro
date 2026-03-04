'use client'

import React, { useState, useEffect } from 'react';
import {
    FileText, Sparkles, ShieldCheck, PenTool, ArrowRight,
    ChevronRight, Moon, Sun, Scale, BarChart3,
    Search, Lock, History, Download, Zap, MousePointer2,
    CheckCircle2, AlertTriangle, Cloud, LogOut, Briefcase, LayoutDashboard
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
import { CompanyModal } from '@/components/company-modal';
import { Footer } from '@/components/shared/footer';
import { createMasterClient } from '@/lib/supabase/master';
import { UserMenu } from '@/components/ui/user-menu';
import { useTranslation } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <PenTool className="h-6 w-6" />
    </div>
);

export default function ScriptorLanding() {
    const { t, locale } = useTranslation();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [hasAccess, setHasAccess] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(undefined);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
        isOpen: false,
        type: 'privacy'
    });

    const openLegal = (type: 'privacy' | 'terms') => {
        setLegalModal({ isOpen: true, type });
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
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url, role')
                    .eq('id', user.id)
                    .single();
                setCurrentUser({ ...user, profile });
            } else {
                setCurrentUser(null);
            }
        };
        fetchUser();
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    };

    if (!mounted) return null;

    return (
        <div id="top" className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                SCRIPTOR <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="font-medium text-branding-gradient hover:opacity-80 transition-all">{t('pricingPage.nav.portal')}</Link>
                        <a href="#top" className="font-medium text-slate-800 dark:text-white">{t('landingPages.scriptor.nav.home')}</a>
                        <a href="#vision" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.scriptor.nav.vision')}</a>
                        <a href="#features" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.scriptor.nav.features')}</a>
                        <a href="#ux" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.scriptor.nav.ux')}</a>
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
                                <UserMenu user={currentUser} supabase={createMasterClient()} />
                            </div>
                        ) : (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => {
                                        setAuthMode('login');
                                        setIsAuthModalOpen(true);
                                    }}
                                    className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all cursor-pointer"
                                >
                                    <LogOut size={18} /> {t('nav.login')}
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthMode('register');
                                        setIsAuthModalOpen(true);
                                    }}
                                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all text-sm cursor-pointer"
                                >
                                    {t('landingPages.nexus.hero.cta1')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Dobra 1: Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
                            <Sparkles size={14} className="animate-pulse" /> {t('landingPages.scriptor.hero.badge')}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-slate-900 dark:text-white">
                            {t('landingPages.scriptor.hero.title').split(' ').map((word: string, i: number, arr: string[]) => {
                                if (word.toLowerCase() === 'redige,' || word.toLowerCase() === 'revisa' || word.toLowerCase() === 'drafts,' || word.toLowerCase() === 'reviews,') {
                                    return <React.Fragment key={i}><span className="text-branding-gradient">{word}</span> </React.Fragment>
                                }
                                return word + ' '
                            })}
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
                            {t('landingPages.scriptor.hero.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {(hasAccess || currentUser) && (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {t('landingPages.scriptor.hero.cta1')} <ArrowRight size={20} />
                                </button>
                            )}
                            <a href="#vision" className="w-full sm:w-auto px-10 py-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-slate-600 dark:text-slate-300">
                                {t('landingPages.scriptor.hero.cta2')}
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {/* Editor Mockup - Minimalist 'Notion-like' visual */}
                        <div className="relative z-10 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] p-4 border border-slate-200 dark:border-slate-800 shadow-3xl transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] flex flex-col">
                                <div className="h-12 border-b border-slate-50 dark:border-slate-900 flex items-center px-6 justify-between">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    </div>
                                    <div className="text-[10px] font-black tracking-widest text-slate-300 uppercase">{t('landingPages.scriptor.mockup.title')}</div>
                                    <div className="w-3" />
                                </div>
                                <div className="p-10 flex-1 bg-white dark:bg-slate-950 space-y-6">
                                    <div className="h-8 w-1/3 bg-slate-100 dark:bg-slate-900 rounded-lg mb-8" />
                                    <div className="space-y-4">
                                        <div className="h-3 w-full bg-slate-50 dark:bg-slate-900 rounded" />
                                        <div className="h-3 w-[90%] bg-slate-50 dark:bg-slate-900 rounded" />
                                        <div className="h-3 w-4/5 bg-slate-50 dark:bg-slate-900 rounded" />
                                    </div>
                                    {/* IA suggestion box */}
                                    <div className="bg-indigo-600/5 dark:bg-indigo-500/10 border border-indigo-600/20 rounded-2xl p-6 relative group">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">{t('landingPages.scriptor.mockup.pilot')}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-full bg-indigo-600/10 rounded animate-pulse" />
                                            <div className="h-3 w-2/3 bg-indigo-600/10 rounded animate-pulse" />
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            {t('landingPages.scriptor.mockup.accept')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background blobs */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full" />
                    </div>
                </div>

                {/* Animated Background Elements */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-400/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-400/5 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Dobra 2: SEÇÃO DE IMPACTO / DASHBOARD VISUAL */}
            <section id="vision" className="py-32 px-6 bg-slate-50 dark:bg-slate-950/40 border-y border-slate-100 dark:border-slate-900 transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {[
                                { label: t('landingPages.scriptor.stats.drafting'), val: '-80%', color: 'text-indigo-600', icon: Zap },
                                { label: t('landingPages.scriptor.stats.clauses'), val: '142', color: 'text-rose-500', icon: AlertTriangle },
                                { label: t('landingPages.scriptor.stats.signatures'), val: '15', color: 'text-emerald-500', icon: CheckCircle2 },
                                { label: t('landingPages.scriptor.stats.search'), val: 'ms', color: 'text-slate-500', icon: Search }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none hover:scale-105 transition-transform group">
                                    <div className={`w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${stat.color}`}>
                                        <stat.icon size={24} />
                                    </div>
                                    <div className={`text-3xl font-black mb-1 ${stat.color}`}>{stat.val}</div>
                                    <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                        <div className="flex-1 space-y-8 text-left">
                            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter text-slate-900 dark:text-white">
                                {t('landingPages.scriptor.vision.title').split(' ').map((word: string, i: number) => (
                                    <React.Fragment key={i}>
                                        {word.toLowerCase() === 'mente' || word.toLowerCase() === 'jurídica' || word.toLowerCase() === 'legal' || word.toLowerCase() === 'mind' ? <span className="text-branding-gradient">{word}</span> : word}{' '}
                                    </React.Fragment>
                                ))}
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                {t('landingPages.scriptor.vision.desc1')}
                            </p>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                {t('landingPages.scriptor.vision.desc2')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dobra 3: Funcionalidades */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-sm">{t('landingPages.scriptor.features.category')}</span>
                        <h2 className="text-4xl md:text-5xl font-black mt-4 text-slate-900 dark:text-white tracking-tighter">{t('landingPages.scriptor.features.title')}</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">{t('landingPages.scriptor.features.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            {
                                title: t('landingPages.scriptor.features.items.generator.title'),
                                desc: t('landingPages.scriptor.features.items.generator.desc'),
                                icon: Sparkles,
                                color: 'bg-indigo-500/10 text-indigo-500'
                            },
                            {
                                title: t('landingPages.scriptor.features.items.auditor.title'),
                                desc: t('landingPages.scriptor.features.items.auditor.desc'),
                                icon: ShieldCheck,
                                color: 'bg-rose-500/10 text-rose-500'
                            },
                            {
                                title: t('landingPages.scriptor.features.items.repository.title'),
                                desc: t('landingPages.scriptor.features.items.repository.desc'),
                                icon: Cloud,
                                color: 'bg-emerald-500/10 text-emerald-500'
                            },
                            {
                                title: t('landingPages.scriptor.features.items.signature.title'),
                                desc: t('landingPages.scriptor.features.items.signature.desc'),
                                icon: FileText,
                                color: 'bg-violet-500/10 text-violet-500'
                            }
                        ].map((f, i) => (
                            <div key={i} className="group p-10 bg-slate-50/50 dark:bg-slate-900/30 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
                                <div className={`w-16 h-16 rounded-[1.25rem] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform ${f.color}`}>
                                    <f.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-black mb-4 text-slate-900 dark:text-white tracking-tight leading-snug">{f.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium mb-8">
                                    {f.desc}
                                </p>
                                <button className="text-sm font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-2 hover:gap-3 transition-all">
                                    {t('landingPages.scriptor.features.cta')} <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dobra 4: UX e Diferencial */}
            <section id="ux" className="py-32 px-6 bg-slate-50 dark:bg-slate-900/80 rounded-[4rem] mx-6 relative overflow-hidden text-slate-900 dark:text-white border border-slate-100 dark:border-none transition-colors duration-300">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10 transition-colors duration-300">
                    <div className="flex-1 space-y-10">
                        <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter mb-6 text-slate-900 dark:text-white">
                            {t('landingPages.scriptor.ux.title').split(' ').map((word: string, i: number) => (
                                <React.Fragment key={i}>
                                    {word.toLowerCase() === 'foco' || word.toLowerCase() === 'absoluto.' || word.toLowerCase() === 'absolute' || word.toLowerCase() === 'focus.' ? <span className="text-branding-gradient">{word}</span> : word}{' '}
                                </React.Fragment>
                            ))}
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {t('landingPages.scriptor.ux.subtitle')}
                        </p>
                        <div className="space-y-6">
                            {[
                                { title: t('landingPages.scriptor.ux.items.contextual.title'), desc: t('landingPages.scriptor.ux.items.contextual.desc'), icon: Sparkles },
                                { title: t('landingPages.scriptor.ux.items.versioning.title'), desc: t('landingPages.scriptor.ux.items.versioning.desc'), icon: History },
                                { title: t('landingPages.scriptor.ux.items.search.title'), desc: t('landingPages.scriptor.ux.items.search.desc'), icon: Search }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm group">
                                    <item.icon className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-1 group-hover:scale-110 transition-transform" size={24} />
                                    <div>
                                        <h4 className="font-black text-lg mb-1 tracking-tight text-slate-900 dark:text-white">{item.title}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative aspect-square lg:aspect-auto h-full min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 blur-3xl opacity-50"></div>
                        <div className="relative z-10 w-full h-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col justify-center gap-8 shadow-2xl shadow-indigo-500/5 transition-colors duration-300">
                            <div className="space-y-4">
                                <div className="h-6 w-3/4 bg-slate-100 dark:bg-white/10 rounded-full" />
                                <div className="h-2 w-full bg-slate-50 dark:bg-white/5 rounded-full" />
                                <div className="h-2 w-[90%] bg-slate-50 dark:bg-white/5 rounded-full" />
                            </div>
                            <div className="p-6 bg-slate-100/50 dark:bg-white/10 rounded-3xl border border-slate-200 dark:border-white/20 animate-pulse transition-colors duration-300">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center"><Zap size={18} className="text-indigo-600 dark:text-indigo-400" /></div>
                                    <div className="h-4 w-32 bg-slate-200 dark:bg-white/20 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-slate-100 dark:bg-white/10 rounded-full" />
                                    <div className="h-2 w-2/3 bg-slate-100 dark:bg-white/10 rounded-full" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center px-4">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 border border-white dark:border-slate-600" />
                                    <div className="w-8 h-8 rounded-full bg-slate-300 dark:bg-slate-600 border border-white dark:border-slate-500" />
                                </div>
                                <div className="h-8 w-24 bg-emerald-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase">Seguro</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer / CTA Final */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black mb-8 text-slate-900 dark:text-white leading-tight tracking-tighter">
                        {t('landingPages.scriptor.finalCta.title').split(' ').map((word: string, i: number) => (
                            <React.Fragment key={i}>
                                {word.toLowerCase() === 'capacidade' || word.toLowerCase() === 'produção?' || word.toLowerCase() === 'production' || word.toLowerCase() === 'capacity?' ? <span className="text-branding-gradient">{word}</span> : word}{' '}
                            </React.Fragment>
                        ))}
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        {t('landingPages.scriptor.finalCta.subtitle')}
                    </p>
                    {(hasAccess || currentUser) && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all cursor-pointer"
                            >
                                {t('landingPages.scriptor.finalCta.button1')}
                            </button>
                            <Link
                                href="/pricing"
                                className="w-full sm:w-auto px-12 py-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {t('landingPages.scriptor.finalCta.button2')}
                            </Link>
                        </div>
                    )}
                    <p className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-widest">
                        {t('landingPages.scriptor.finalCta.footer')}
                    </p>
                </div>
            </section>

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
        </div>
    );
}
