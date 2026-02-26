'use client'

import React, { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, CreditCard, PieChart, ArrowRight,
    ChevronRight, Moon, Sun, Scale, BarChart3,
    QrCode, Smartphone, Receipt, FileSpreadsheet, Zap,
    MousePointer2, CheckCircle2, AlertCircle, Banknote,
    ArrowDownToLine, Users2, FileOutput, LogOut, Briefcase,
    Eye, ShieldCheck
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth-modal';
import { CompanyModal } from '@/components/company-modal';
import { createMasterClient } from '@/lib/supabase/master';
import { UserMenu } from '@/components/ui/user-menu';
import { useTranslation } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';

const Logo = () => (
    <div className="bg-emerald-600/10 p-2 rounded-lg flex items-center justify-center text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
        <Wallet className="h-6 w-6" />
    </div>
);

export default function ValoremLanding() {
    const { t, locale } = useTranslation();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [hasAccess, setHasAccess] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(undefined);
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

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
        <div id="top" className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-emerald-100 selection:text-emerald-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                VALOREM <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="font-medium text-branding-gradient hover:opacity-80 transition-all">{t('pricingPage.nav.portal')}</Link>
                        <a href="#top" className="font-medium text-slate-800 dark:text-white">{t('landingPages.valorem.nav.home')}</a>
                        <a href="#vision" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.valorem.nav.vision')}</a>
                        <a href="#features" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.valorem.nav.features')}</a>
                        <a href="#ux" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.valorem.nav.ux')}</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <LanguageSelector />
                        {currentUser === undefined ? (
                            <div className="w-24 h-10 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-xl" />
                        ) : currentUser ? (
                            <UserMenu user={currentUser} supabase={createMasterClient()} />
                        ) : hasAccess ? (
                            <Link href="/?login=true" className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all">
                                <LogOut size={18} /> {t('nav.login')}
                            </Link>
                        ) : null}
                        {(hasAccess || currentUser) && (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all text-sm"
                            >
                                {t('landingPages.valorem.hero.cta1')}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Dobra 1: Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
                            <Banknote size={14} className="animate-pulse" /> {t('landingPages.valorem.hero.badge')}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-slate-900 dark:text-white">
                            {t('landingPages.valorem.hero.title').split(' ').map((word: string, i: number) => {
                                if (word.toLowerCase() === 'piloto' || word.toLowerCase() === 'automático.' || word.toLowerCase() === 'autopilot.' || word.toLowerCase() === 'on') {
                                    return <React.Fragment key={i}><span className="text-branding-gradient">{word}</span> </React.Fragment>
                                }
                                return word + ' '
                            })}
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
                            {t('landingPages.valorem.hero.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {(hasAccess || currentUser) && (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-4 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-emerald-600/40 hover:scale-105 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {t('landingPages.valorem.hero.cta1')} <ArrowRight size={20} />
                                </button>
                            )}
                            <a href="#vision" className="w-full sm:w-auto px-10 py-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-slate-600 dark:text-slate-300">
                                {t('landingPages.valorem.hero.cta2')}
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {/* Financial Dashboard & Mobile PIX Mockup */}
                        <div className="relative z-10">
                            {/* Main Dashboard Card */}
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] p-4 border border-slate-200 dark:border-slate-800 shadow-3xl transform rotate-2">
                                <div className="bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] flex flex-col p-8">
                                    <div className="flex justify-between items-end mb-8">
                                        <div>
                                            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">{t('landingPages.valorem.mockup.monthly')}</div>
                                            <div className="text-3xl font-black text-emerald-500">R$ 142.500,00</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingUp size={16} /></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-end gap-2 px-2">
                                        {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                                            <div key={i} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 transition-colors rounded-t-lg relative group" style={{ height: `${h}%` }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    R$ {h}k
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-px bg-slate-100 dark:bg-slate-900 w-full mt-4" />
                                    <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Jan</span><span>Mar</span><span>Mai</span><span>Jul</span><span>Set</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Mockup with PIX Overlay */}
                            <div className="absolute -bottom-10 -left-10 w-48 aspect-[9/19] bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl p-3 z-20 transform -rotate-6">
                                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden flex flex-col">
                                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 flex justify-center py-1">
                                        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                            <QrCode size={64} className="text-slate-900 dark:text-white" />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[8px] font-black uppercase text-emerald-500 mb-1">{t('landingPages.valorem.mockup.pix')}</div>
                                            <div className="text-xs font-black text-slate-900 dark:text-white">R$ 2.450,00</div>
                                        </div>
                                        <div className="w-full h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-emerald-500/20">
                                            {t('landingPages.valorem.mockup.pay')}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background blobs */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-400/10 blur-[100px] rounded-full" />
                    </div>
                </div>

                {/* Animated Background Elements */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-400/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Dobra 2: SEÇÃO DE IMPACTO / DASHBOARD VISUAL */}
            <section id="vision" className="py-32 px-6 bg-slate-50 dark:bg-slate-950/40 border-y border-slate-100 dark:border-slate-900 transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {[
                                { label: t('landingPages.valorem.stats.revenue'), val: '+42%', color: 'text-emerald-500', icon: TrendingUp },
                                { label: t('landingPages.valorem.stats.overdue'), val: '-65%', color: 'text-rose-500', icon: AlertCircle },
                                { label: t('landingPages.valorem.stats.provision'), val: 'R$ 2.4M', color: 'text-emerald-600', icon: Scale },
                                { label: t('landingPages.valorem.stats.liquidity'), val: t('landingPages.valorem.stats.liquidityVal'), color: 'text-indigo-500', icon: BarChart3 }
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
                            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter text-slate-900 dark:text-white uppercase">
                                {t('landingPages.valorem.vision.title').split(' ').map((word: string, i: number) => {
                                    if (word.toLowerCase() === 'isso' || word.toLowerCase() === 'por' || word.toLowerCase() === 'você.' || word.toLowerCase() === 'for' || word.toLowerCase() === 'you.') {
                                        return <React.Fragment key={i}><span className="text-branding-gradient">{word}</span> </React.Fragment>
                                    }
                                    return word + ' '
                                })}
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                {t('landingPages.valorem.vision.desc')}
                            </p>
                            <div className="p-6 bg-emerald-600/5 rounded-2xl border border-emerald-600/10 italic text-emerald-600 dark:text-emerald-400 font-bold">
                                {t('landingPages.valorem.vision.quote')}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dobra 3: Funcionalidades */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black tracking-[0.2em] uppercase text-sm">{t('landingPages.valorem.features.category')}</span>
                        <h2 className="text-5xl font-black mt-4 text-slate-900 dark:text-white uppercase tracking-tighter">{t('landingPages.valorem.features.title')}</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">{t('landingPages.valorem.features.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            {
                                title: t('landingPages.valorem.features.items.management.title'),
                                desc: t('landingPages.valorem.features.items.management.desc'),
                                icon: Receipt,
                                color: 'bg-emerald-500/10 text-emerald-500'
                            },
                            {
                                title: t('landingPages.valorem.features.items.billing.title'),
                                desc: t('landingPages.valorem.features.items.billing.desc'),
                                icon: CreditCard,
                                color: 'bg-indigo-500/10 text-indigo-500'
                            },
                            {
                                title: t('landingPages.valorem.features.items.calc.title'),
                                desc: t('landingPages.valorem.features.items.calc.desc'),
                                icon: FileSpreadsheet,
                                color: 'bg-rose-500/10 text-rose-500'
                            },
                            {
                                title: t('landingPages.valorem.features.items.reports.title'),
                                desc: t('landingPages.valorem.features.items.reports.desc'),
                                icon: PieChart,
                                color: 'bg-amber-500/10 text-amber-500'
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
                                <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 hover:gap-3 transition-all">
                                    {t('landingPages.valorem.features.cta')} <ChevronRight size={16} />
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
                        <h2 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter uppercase mb-6">
                            {t('landingPages.valorem.ux.title').split(' ').map((word: string, i: number) => (
                                <React.Fragment key={i}>
                                    {word.toLowerCase() === 'finanças' || word.toLowerCase() === 'idioma.' || word.toLowerCase() === 'finances' || word.toLowerCase() === 'language.' ? <span className="text-branding-gradient">{word}</span> : word}{' '}
                                </React.Fragment>
                            ))}
                        </h2>
                        <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium">
                            {t('landingPages.valorem.ux.subtitle')}
                        </p>
                        <div className="space-y-6">
                            {[
                                { title: t('landingPages.valorem.ux.items.conciliation.title'), desc: t('landingPages.valorem.ux.items.conciliation.desc'), icon: CheckCircle2 },
                                { title: t('landingPages.valorem.ux.items.sharing.title'), desc: t('landingPages.valorem.ux.items.sharing.desc'), icon: Users2 },
                                { title: t('landingPages.valorem.ux.items.export.title'), desc: t('landingPages.valorem.ux.items.export.desc'), icon: FileOutput }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start p-6 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all duration-300 shadow-sm group">
                                    <item.icon className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-1 group-hover:scale-110 transition-transform" size={24} />
                                    <div>
                                        <h4 className="font-black text-lg mb-1 uppercase tracking-tight text-slate-900 dark:text-white">{item.title}</h4>
                                        <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative aspect-square lg:aspect-auto h-full min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-blue-600/20 blur-3xl opacity-50"></div>
                        <div className="relative z-10 w-full h-full border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900/80 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col justify-center gap-8 shadow-2xl shadow-emerald-500/5 transition-colors duration-300">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="h-4 w-32 bg-slate-100 dark:bg-white/20 rounded-full" />
                                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-xs">V</div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-8 w-full bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10" />
                                    <div className="h-8 w-full bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10" />
                                    <div className="h-8 w-2/3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/10" />
                                </div>
                                <div className="pt-4 flex justify-end">
                                    <div className="h-10 w-32 bg-emerald-600 rounded-xl flex items-center justify-center text-[10px] font-black text-white uppercase shadow-lg shadow-emerald-600/20">{t('landingPages.valorem.ux.button')}</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer / CTA Final */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white leading-tight">
                        {t('landingPages.valorem.finalCta.title').split(' ').map((word: string, i: number) => {
                            if (word.toLowerCase() === 'preocupar' || word.toLowerCase() === 'menos?' || word.toLowerCase() === 'worry' || word.toLowerCase() === 'less?') {
                                return <React.Fragment key={i}><span className="text-branding-gradient">{word}</span> </React.Fragment>
                            }
                            return word + ' '
                        })}
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        {t('landingPages.valorem.finalCta.subtitle')}
                    </p>
                    {(hasAccess || currentUser) && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full sm:w-auto bg-emerald-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-600/40 hover:scale-105 hover:bg-emerald-700 transition-all cursor-pointer"
                            >
                                {t('landingPages.valorem.finalCta.button1')}
                            </button>
                            <Link
                                href="/pricing"
                                className="w-full sm:w-auto px-12 py-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {t('landingPages.valorem.finalCta.button2')}
                            </Link>
                        </div>
                    )}
                    <p className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-widest">
                        {t('landingPages.valorem.finalCta.footer')}
                    </p>
                </div>
            </section>

            {/* Final Footer */}
            <footer className="py-20 border-t border-slate-100 dark:border-slate-900 bg-slate-50/10 transition-colors">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <div className="flex items-center gap-2">
                                <Logo />
                                <span className="text-2xl font-black tracking-tighter dark:text-white text-slate-900 uppercase">
                                    VALOREM <span className="text-branding-gradient">PRO</span>
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs text-center md:text-left">
                                {t('landingPages.valorem.footer.slogan')}
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale size={24} className="text-emerald-600" />
                                <span className="text-lg font-black dark:text-white text-slate-900 uppercase">VERITUM <span className="text-branding-gradient">PRO</span></span>
                            </div>
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium italic max-w-sm">
                                <button
                                    onClick={() => setIsCompanyModalOpen(true)}
                                    className="group relative transition-all duration-300 hover:scale-[1.02] cursor-pointer not-italic inline-flex items-center"
                                >
                                    <span className="text-slate-400 dark:text-slate-500 font-medium">
                                        {locale === 'pt' ? 'Desenvolvido por ' : locale === 'es' ? 'Desarrollado por ' : 'Developed by '}
                                    </span>
                                    <span className="text-indigo-600 dark:text-indigo-400 font-extrabold ml-1 flex items-center">
                                        AGTech
                                        <sup className="ml-0.5 text-[10px] opacity-70 group-hover:opacity-100 transition-opacity">©</sup>
                                    </span>
                                    {/* Tooltip */}
                                    <span className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none shadow-2xl border border-slate-800 scale-90 group-hover:scale-100 z-[60]">
                                        {locale === 'pt' ? 'Clique para saber mais' : locale === 'es' ? 'Clic para saber más' : 'Click to learn more'}
                                    </span>
                                </button>
                                {locale === 'pt' ? ' | LegalTech de Alta Performance © 2026 Todos os direitos reservados.' : ' | High Performance LegalTech © 2026 All rights reserved.'}
                            </p>
                        </div>
                    </div>
                </div>
            </footer>

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                mode="register"
            />

            <CompanyModal
                isOpen={isCompanyModalOpen}
                onClose={() => setIsCompanyModalOpen(false)}
            />
        </div>
    );
}
