'use client';

import React from 'react';
import Link from 'next/link';
import {
    Crown, Sparkles, ShieldCheck, Mail, Users, ArrowRight, Zap,
    Target, ArrowUpRight, CheckCircle2, Trophy, Moon, Sun,
    LogOut, LayoutDashboard
} from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
import { CompanyModal } from '@/components/company-modal';
import { Footer } from '@/components/shared/footer';
import { createMasterClient } from '@/lib/supabase/master';
import { useTranslation } from '@/contexts/language-context';
import { useTheme } from 'next-themes';
import { LanguageSelector } from '@/components/ui/language-selector';
import { UserMenu } from '@/components/ui/user-menu';

export default function ClubeVipPage() {
    const { setTheme, resolvedTheme } = useTheme();
    const [isAuthModalOpen, setIsAuthModalOpen] = React.useState(false);
    const [authMode, setAuthMode] = React.useState<'login' | 'register'>('login');
    const [currentUser, setCurrentUser] = React.useState<any>(null);
    const [legalModal, setLegalModal] = React.useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
        isOpen: false,
        type: 'privacy'
    });
    const [isCompanyModalOpen, setIsCompanyModalOpen] = React.useState(false);
    const { locale, t } = useTranslation();

    const openLegal = (type: 'privacy' | 'terms') => {
        setLegalModal({ isOpen: true, type });
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };
    const supabase = createMasterClient();

    React.useEffect(() => {
        const checkUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url, role, plan_id')
                    .eq('id', user.id)
                    .single();

                setCurrentUser({ ...user, profile });
            }
        };
        checkUser();
    }, []);

    const handleActivateClick = (e: React.MouseEvent) => {
        if (!currentUser) {
            e.preventDefault();
            setAuthMode('login');
            setIsAuthModalOpen(true);
        }
    };
    return (
        <main className="min-h-screen bg-[#020617] text-slate-300 font-sans selection:bg-amber-500/30 overflow-x-hidden">
            {/* Header Reduzido */}
            <nav className="fixed w-full z-50 bg-[#0f172a]/80 backdrop-blur-xl border-b border-white/5">
                <div className="max-w-[1400px] mx-auto px-6 h-20 flex flex-col md:flex-row items-center justify-between pointer-events-auto gap-4 md:gap-0">
                    <div className="flex items-center gap-3 w-full md:w-auto mt-2 md:mt-0 pt-2 lg:pt-0 pb-2 md:pb-0 justify-center md:justify-start">
                        <Link href="/">
                            <img src="https://veritumpro.com/logo-veritum-2026.png" alt="Veritum PRO" className="h-6" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                            <div className="text-xl font-black uppercase tracking-tighter text-white inline-flex items-center gap-2">
                                Veritum PRO
                                <span className="px-2 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded text-[9px] tracking-widest text-white shadow-lg shadow-amber-500/20">VIP</span>
                            </div>
                        </Link>
                    </div>
                    <div className="hidden md:flex items-center gap-8">
                        {[
                            { name: t('clubeVip.nav.home'), href: '#herovip' },
                            { name: t('clubeVip.nav.benefits'), href: '#beneficios' },
                            { name: t('clubeVip.nav.rewards'), href: '#recompensas' },
                            { name: t('clubeVip.nav.goal'), href: '#meta' }
                        ].map((item) => (
                            <a
                                key={item.name}
                                href={item.href}
                                className="font-medium text-slate-400 hover:text-amber-500 transition-colors"
                            >
                                {item.name}
                            </a>
                        ))}
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

            {/* HERO SECTION */}
            <section id="herovip" className="relative pt-40 md:pt-48 pb-20 md:pb-32 px-6">
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-amber-500/20 rounded-full blur-[150px] pointer-events-none" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[150px] pointer-events-none" />

                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-amber-500/30 bg-amber-500/10 mb-8 animate-in slide-in-from-bottom-4 duration-700">
                        <Crown size={14} className="text-amber-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-500">{t('clubeVip.hero.access')}</span>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter mb-8 leading-[0.9] animate-in slide-in-from-bottom-6 duration-700 delay-100">
                        {t('clubeVip.hero.title').split(' ').slice(0, -2).join(' ')} <br className="hidden md:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-orange-500">
                            {t('clubeVip.hero.title').split(' ').slice(-2).join(' ')}
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl font-medium text-slate-400 leading-relaxed max-w-2xl mx-auto mb-12 animate-in slide-in-from-bottom-8 duration-700 delay-200">
                        {t('clubeVip.hero.subtitle').split('Clube VIP Veritum PRO')[0]}
                        <strong className="text-white font-black">Clube VIP Veritum PRO</strong>
                        {t('clubeVip.hero.subtitle').split('Clube VIP Veritum PRO')[1]}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in slide-in-from-bottom-10 duration-700 delay-300">
                        <Link
                            href="/veritum/settings?tab=vip"
                            onClick={handleActivateClick}
                            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-full font-black uppercase tracking-widest text-xs flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(245,158,11,0.3)] hover:shadow-[0_0_60px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all"
                        >
                            <Sparkles size={16} className="fill-current" /> {t('clubeVip.hero.ctaActivate')}
                        </Link>
                        <a href="#beneficios" className="w-full sm:w-auto px-8 py-4 bg-transparent border border-slate-700 text-white rounded-full font-black uppercase tracking-widest text-xs hover:bg-slate-800 transition-all">
                            {t('clubeVip.hero.ctaLearn')}
                        </a>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 1: E-MAIL EXCLUSIVO */}
            <section id="beneficios" className="py-24 md:py-32 px-6 bg-slate-900 border-y border-white/5 relative overflow-hidden">
                <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 md:gap-24 items-center">
                    <div className="order-2 lg:order-1 relative">
                        <div className="absolute inset-0 bg-indigo-500/20 blur-[100px] rounded-full pointer-events-none" />

                        <div className="bg-[#0f172a] border border-slate-700/50 rounded-[3rem] p-8 md:p-12 shadow-2xl relative z-10 hover:-translate-y-2 transition-transform duration-500">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-4 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                                    <ShieldCheck size={32} className="text-indigo-400" />
                                </div>
                                <div>
                                    <h4 className="text-xl font-black text-white uppercase tracking-tighter">{t('clubeVip.benefits.webmail')}</h4>
                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">{t('clubeVip.benefits.military')}</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 flex items-center justify-between group cursor-pointer hover:border-indigo-500/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center group-hover:bg-indigo-500/20 transition-colors">
                                            <Mail size={20} className="text-slate-400 group-hover:text-indigo-400 transition-colors" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white uppercase tracking-widest">{t('clubeVip.benefits.address')}</p>
                                            <p className="text-sm font-bold text-indigo-400 mt-1">seu.nome@veritumpro.com</p>
                                        </div>
                                    </div>
                                    <ArrowUpRight size={20} className="text-slate-600 group-hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-5 bg-slate-900/50 border border-white/5 rounded-2xl">
                                        <Target size={20} className="text-emerald-400 mb-3" />
                                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{t('clubeVip.benefits.smartFilter')}</h5>
                                        <p className="text-[10px] text-slate-500 font-semibold">{t('clubeVip.benefits.smartFilterDesc')}</p>
                                    </div>
                                    <div className="p-5 bg-slate-900/50 border border-white/5 rounded-2xl">
                                        <Zap size={20} className="text-amber-400 mb-3" />
                                        <h5 className="text-[10px] font-black text-white uppercase tracking-widest mb-1">{t('clubeVip.benefits.earlyAccess')}</h5>
                                        <p className="text-[10px] text-slate-500 font-semibold">{t('clubeVip.benefits.earlyAccessDesc')}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 space-y-6">
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-[0.9]">
                            {t('clubeVip.benefits.title').split(' ').slice(0, -2).join(' ')} <br className="hidden md:block" />
                            {t('clubeVip.benefits.title').split(' ').slice(-2).join(' ')}
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                            {t('clubeVip.benefits.subtitle').split('@veritumpro.com')[0]}
                            <strong className="text-indigo-400 font-bold">@veritumpro.com</strong>
                            {t('clubeVip.benefits.subtitle').split('@veritumpro.com')[1] || '.'}
                        </p>
                        <p className="text-sm text-slate-500 leading-relaxed">
                            {t('clubeVip.benefits.description')}
                        </p>
                        <ul className="space-y-4 pt-6">
                            {(t('clubeVip.benefits.items') as string[]).map((item, i) => (
                                <li key={i} className="flex items-center gap-3 text-xs font-black text-slate-300 uppercase tracking-widest">
                                    <CheckCircle2 size={16} className="text-indigo-500" /> {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            {/* SEÇÃO 2: GAMIFICAÇÃO & INDICAÇÃO */}
            <section id="recompensas" className="py-24 md:py-32 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center max-w-3xl mx-auto mb-16 md:mb-24">
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                            <Users size={32} className="text-emerald-400" />
                        </div>
                        <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter leading-[0.9] mb-6">
                            {t('clubeVip.rewards.title').split('Zere a sua assinatura.')[0]}
                            <span className="text-emerald-400">{t('clubeVip.rewards.title').split('.').slice(-1)[0].trim()}</span>
                        </h2>
                        <p className="text-lg text-slate-400 leading-relaxed font-medium">
                            {t('clubeVip.rewards.subtitle')}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-start">
                        <div className="space-y-8">
                            <p className="text-sm text-slate-400 leading-relaxed border-l-4 border-emerald-500 pl-6 py-2">
                                {t('clubeVip.rewards.detail').split('(1 Ponto = 1% OFF)')[0]}
                                <strong className="text-white font-black">(1 Ponto = 1% OFF)</strong>.
                            </p>

                            <div className="space-y-4 pt-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-6">{t('clubeVip.rewards.accelerators')}</h4>

                                {(() => {
                                    const pointsTable = {
                                        start: [1, 2, 3, 5],
                                        growth: [2, 4, 7, 10],
                                        strategy: [3, 6, 11, 15]
                                    };

                                    const PlanTooltip = ({ points }: { points: number[] }) => (
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-6 w-52 bg-slate-900/98 backdrop-blur-3xl border border-white/10 rounded-2xl p-4 shadow-[0_0_50px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.1)] opacity-0 invisible translate-x-2 scale-95 group-hover:opacity-100 group-hover:visible group-hover:translate-x-0 group-hover:scale-100 transition-all duration-300 z-50 pointer-events-none">
                                            <div className="space-y-2">
                                                {[
                                                    { label: t('clubeVip.rewards.cycles.monthly'), val: points[0] },
                                                    { label: t('clubeVip.rewards.cycles.quarterly'), val: points[1] },
                                                    { label: t('clubeVip.rewards.cycles.semiannually'), val: points[2] },
                                                    { label: t('clubeVip.rewards.cycles.annually'), val: points[3] }
                                                ].map((cycle, idx) => (
                                                    <div key={idx} className="flex justify-between items-center text-[10px] uppercase tracking-wider font-bold">
                                                        <span className="text-slate-500">{cycle.label}</span>
                                                        <span className="text-white">{cycle.val} {cycle.val === 1 ? t('clubeVip.rewards.cycles.point') : t('clubeVip.rewards.cycles.points')}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="absolute left-full top-1/2 -translate-y-1/2 border-8 border-transparent border-l-slate-900/95" />
                                        </div>
                                    );

                                    return (
                                        <>
                                            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between group hover:border-slate-700 transition-colors relative overflow-visible">
                                                <PlanTooltip points={pointsTable.start} />
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-slate-800 rounded-full flex justify-center items-center font-black text-slate-400">01</div>
                                                    <div>
                                                        <h5 className="text-sm font-black text-white uppercase tracking-widest">{t('clubeVip.rewards.plans.start.name')}</h5>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t('clubeVip.rewards.plans.start.desc')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-cyan-400">{t('clubeVip.rewards.plans.start.points')}</p>
                                                    <p className="text-[9px] font-black text-cyan-400/50 uppercase tracking-widest">{t('clubeVip.rewards.plans.start.label')}</p>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between group hover:border-amber-500/30 transition-colors relative overflow-visible">
                                                <PlanTooltip points={pointsTable.growth} />
                                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-500/5 to-transparent flex translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 pointer-events-none" />
                                                <div className="flex items-center gap-4 relative z-10">
                                                    <div className="w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex justify-center items-center font-black">02</div>
                                                    <div>
                                                        <h5 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">{t('clubeVip.rewards.plans.growth.name')} <Sparkles size={14} className="text-amber-500" /></h5>
                                                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">{t('clubeVip.rewards.plans.growth.desc')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right relative z-10">
                                                    <p className="text-2xl font-black text-amber-400">{t('clubeVip.rewards.plans.growth.points')}</p>
                                                    <p className="text-[9px] font-black text-amber-400/50 uppercase tracking-widest">{t('clubeVip.rewards.plans.growth.label')}</p>
                                                </div>
                                            </div>

                                            <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 border border-indigo-500/30 rounded-3xl flex items-center justify-between shadow-[0_0_30px_rgba(99,102,241,0.1)] group hover:border-indigo-400 transition-colors relative overflow-visible">
                                                <PlanTooltip points={pointsTable.strategy} />
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-indigo-500 text-white rounded-full flex justify-center items-center font-black shadow-lg">03</div>
                                                    <div>
                                                        <h5 className="text-sm font-black text-white uppercase tracking-widest flex items-center gap-2">{t('clubeVip.rewards.plans.strategy.name')} <Crown size={14} className="text-indigo-400" /></h5>
                                                        <p className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest mt-1">{t('clubeVip.rewards.plans.strategy.desc')}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-2xl font-black text-indigo-400">{t('clubeVip.rewards.plans.strategy.points')}</p>
                                                    <p className="text-[9px] font-black text-indigo-400/50 uppercase tracking-widest">{t('clubeVip.rewards.plans.strategy.label')}</p>
                                                </div>
                                            </div>
                                        </>
                                    );
                                })()}
                            </div>
                        </div>

                        <div id="meta" className="space-y-6">
                            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-10 relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/20 blur-[60px] rounded-full pointer-events-none" />
                                <Trophy size={40} className="text-emerald-400 mb-6" />
                                <h3 className="text-2xl font-black text-white uppercase tracking-tighter mb-4">{t('clubeVip.goal.title')}</h3>
                                <p className="text-sm text-emerald-100/70 font-medium leading-relaxed mb-6">
                                    {t('clubeVip.goal.description')}
                                </p>
                                <div className="h-4 bg-black/30 rounded-full p-1 overflow-hidden relative">
                                    <div className="w-full h-full bg-gradient-to-r from-emerald-600 to-emerald-400 rounded-full" />
                                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxwYXRoIGQ9Ik0wIDQwTDAgMEwyMCAwbDIwIDQwaC0yMEwiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4xKSIgZmlsbC1ydWxlPSJldmVub2RkIi8+Cjwvc3ZnPg==')] opacity-50 animation-shift" />
                                </div>
                                <p className="text-right text-[10px] font-black text-emerald-400 uppercase tracking-widest mt-3">{t('clubeVip.goal.progress')}</p>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-10 flex gap-6">
                                <div className="shrink-0 p-4 bg-slate-800 rounded-2xl h-min">
                                    <Target size={24} className="text-slate-400" />
                                </div>
                                <div>
                                    <h3 className="text-base font-black text-white uppercase tracking-widest mb-2">{t('clubeVip.goal.persistenceTitle')}</h3>
                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                                        {t('clubeVip.goal.persistenceDesc').split('Mantenha sua rede ativa')[0]}
                                        <br /><br /><strong className="text-slate-300 font-black">{t('clubeVip.goal.persistenceDesc').match(/Mantenha sua rede ativa.*/)?.[0]}</strong>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA FINAL */}
            <section id="adesao" className="py-24 px-6 border-t border-white/5 relative bg-gradient-to-b from-transparent to-amber-500/5">
                <div className="max-w-4xl mx-auto text-center">
                    <Crown size={48} className="text-amber-500 mx-auto mb-8 opacity-50" />
                    <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-8 leading-[0.9]">
                        {t('clubeVip.ctaFinal.title1')} <br className="hidden md:block" />
                        <span className="text-amber-500">{t('clubeVip.ctaFinal.title2')}</span>
                    </h2>
                    <Link
                        href="/veritum/settings?tab=vip"
                        onClick={handleActivateClick}
                        className="inline-flex items-center gap-4 bg-white text-amber-600 px-10 py-5 rounded-full font-black uppercase tracking-widest text-sm shadow-[0_10px_40px_rgba(245,158,11,0.2)] hover:scale-105 transition-all"
                    >
                        {t('clubeVip.ctaFinal.button')} <ArrowRight size={18} />
                    </Link>
                </div>
            </section>

            <Footer setIsCompanyModalOpen={setIsCompanyModalOpen} openLegal={openLegal} showVipLink={false} />

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

        </main>
    );
}
