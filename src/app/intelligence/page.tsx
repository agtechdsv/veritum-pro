'use client'

import React, { useState, useEffect } from 'react';
import {
    Lightbulb, Brain, Zap, ShieldCheck, TrendingUp, Bot,
    ArrowRight, Check, Moon, Sun, LayoutDashboard,
    LogOut, Sparkles, MessageSquare, Radar, ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
import { CompanyModal } from '@/components/company-modal';
import { Footer } from '@/components/shared/footer';
import { createMasterClient } from '@/lib/supabase/master';
import { UserMenu } from '@/components/ui/user-menu';
import { useTranslation } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';

const Logo = () => (
    <div className="bg-amber-500/10 p-2 rounded-lg flex items-center justify-center text-amber-500 dark:bg-amber-500/20 dark:text-amber-400">
        <Lightbulb className="h-6 w-6" />
    </div>
);

export default function IntelligenceHubLanding() {
    const { t } = useTranslation();
    const { setTheme, resolvedTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
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
        <div id="top" className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-500 font-sans selection:bg-amber-500/30 selection:text-amber-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                INTELLIGENCE <span className="text-branding-gradient">HUB</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="font-medium text-branding-gradient hover:opacity-80 transition-all">{t('pricingPage.nav.portal')}</Link>
                        <a href="#top" className="font-medium text-slate-800 dark:text-white">{t('landingPages.intelligenceHub.nav.home')}</a>
                        <a href="#vision" className="font-medium hover:text-amber-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.intelligenceHub.nav.vision')}</a>
                        <a href="#features" className="font-medium hover:text-amber-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.intelligenceHub.nav.features')}</a>
                        <a href="#flow" className="font-medium hover:text-amber-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.intelligenceHub.nav.ux')}</a>
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
                                    href="/veritumpro"
                                    className="hidden xl:flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-full font-bold text-sm shadow-xl shadow-amber-500/20 transition-all hover:scale-105"
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
                                    className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-xl transition-all cursor-pointer"
                                >
                                    <LogOut size={18} /> {t('nav.login')}
                                </button>
                                <button
                                    onClick={() => {
                                        setAuthMode('register');
                                        setIsAuthModalOpen(true);
                                    }}
                                    className="bg-amber-500 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-amber-500/20 hover:scale-105 transition-all text-sm cursor-pointer"
                                >
                                    {t('landingPages.nexus.hero.cta1')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="relative">
                {/* Dobra 1: Hero Section */}
                <section className="relative pt-52 pb-32 px-6 overflow-hidden bg-white dark:bg-[#020617] transition-colors duration-500">
                    <div className="max-w-7xl mx-auto flex flex-col items-center text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 text-xs font-black uppercase tracking-widest mb-10"
                        >
                            <Sparkles size={14} className="animate-pulse" /> {t('landingPages.intelligenceHub.hero.tag')}
                        </motion.div>

                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1 }}
                            className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1] text-slate-900 dark:text-white uppercase"
                        >
                            {t('landingPages.intelligenceHub.hero.title').split(' ').map((word: string, i: number) => {
                                if (['antecipar', 'oportunidades.', 'anticipating', 'opportunities.', 'anticipar', 'oportunidades.'].includes(word.toLowerCase())) {
                                    return <span key={i} className="text-branding-gradient">{word} </span>
                                }
                                return word + ' '
                            })}
                        </motion.h1>

                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 max-w-4xl mb-14 leading-relaxed font-medium"
                        >
                            {t('landingPages.intelligenceHub.hero.subtitle')}
                        </motion.p>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="flex flex-col sm:flex-row items-center gap-6"
                        >
                            <a href="#flow" className="w-full sm:w-auto px-12 py-5 rounded-[2rem] border-2 border-slate-200 dark:border-slate-800 font-black text-xl hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-slate-600 dark:text-slate-300">
                                {t('landingPages.intelligenceHub.hero.cta2')}
                            </a>
                        </motion.div>
                    </div>

                    {/* Animated Background Orbs */}
                    <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-amber-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
                    <div className="absolute top-1/2 -right-20 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none animate-pulse" style={{ animationDelay: '1s' }}></div>
                </section>

                {/* Dobra 2: A Dor vs Solução */}
                <section id="vision" className="py-40 px-6 bg-slate-50 dark:bg-slate-950/50 transition-colors relative overflow-hidden">
                    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="space-y-8"
                        >
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tighter italic leading-tight">
                                {t('landingPages.intelligenceHub.pain.title')}
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-[1.8]">
                                {t('landingPages.intelligenceHub.pain.description')}
                            </p>
                            <div className="p-8 bg-amber-500/5 border border-amber-500/20 rounded-3xl">
                                <p className="text-amber-600 dark:text-amber-400 font-bold italic">
                                    "O Intelligence Hub atua como um consultor estratégico invisível que trabalha 24 horas por dia."
                                </p>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="relative"
                        >
                            <div className="bg-slate-100 dark:bg-slate-900 p-6 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-3xl">
                                <div className="bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden p-8 space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <Zap size={20} />
                                            </div>
                                            <span className="font-black text-sm tracking-widest text-slate-400 uppercase">Golden Alert</span>
                                        </div>
                                        <div className="px-4 py-1.5 bg-rose-500/10 text-rose-500 rounded-full text-[10px] font-black uppercase tracking-tighter animate-bounce">
                                            Risco de Crise Identificado
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="h-4 w-3/4 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                                        <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                                        <div className="h-4 w-1/2 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
                                    </div>
                                    <div className="p-6 bg-amber-500 rounded-2xl text-white">
                                        <div className="flex items-center gap-3 mb-2">
                                            <Brain size={20} />
                                            <span className="font-bold">Insight da IA:</span>
                                        </div>
                                        <p className="text-sm font-medium opacity-90">
                                            Nova jurisprudência do STJ afeta 127 processos da sua carteira. Ação recomendada: Propor acordo preventivo.
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Paz Psicológica Label */}
                            <div className="absolute -bottom-6 -right-6 bg-emerald-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-xl flex items-center gap-2">
                                <ShieldCheck size={20} /> PAZ PSICOLÓGICA
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Dobra 3: As Funcionalidades */}
                <section id="features" className="py-40 px-6">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-24">
                            <h2 className="text-5xl md:text-6xl font-black text-slate-900 dark:text-white tracking-tighter mb-6">
                                {t('landingPages.intelligenceHub.features.title')}
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 font-medium">
                                {t('landingPages.intelligenceHub.features.subtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {[
                                { key: 'alerts', icon: Bell, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                                { key: 'semantic', icon: Brain, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
                                { key: 'opportunities', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                                { key: 'risks', icon: ShieldCheck, color: 'text-rose-500', bg: 'bg-rose-500/10' }
                            ].map((item, i) => {
                                const Icon = item.icon;
                                return (
                                    <motion.div
                                        key={item.key}
                                        initial={{ opacity: 0, y: 30 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.5, delay: i * 0.1 }}
                                        viewport={{ once: true }}
                                        className="p-10 rounded-[3.5rem] bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-amber-400 transition-all duration-500 group"
                                    >
                                        <div className={`w-16 h-16 rounded-2xl ${item.bg} ${item.color} flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500`}>
                                            <Icon size={32} />
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-4 italic tracking-tight">
                                            {t(`landingPages.intelligenceHub.features.items.${item.key}.title`)}
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                            {t(`landingPages.intelligenceHub.features.items.${item.key}.desc`)}
                                        </p>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* Dobra 4: Fluxo de Valor */}
                <section id="flow" className="py-40 px-6 bg-slate-900 text-white rounded-[4rem] mx-6 mb-32 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-amber-500 via-transparent to-transparent"></div>

                    <div className="max-w-5xl mx-auto relative z-10">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-black mb-6 tracking-tighter">
                                {t('landingPages.intelligenceHub.flow.title')}
                            </h2>
                            <p className="text-amber-400 font-bold uppercase tracking-widest">
                                {t('landingPages.intelligenceHub.flow.subtitle')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                            {/* Horizontal Lines (Desktop) */}
                            <div className="hidden md:block absolute top-[40px] left-1/3 w-1/3 h-px bg-gradient-to-r from-amber-500/50 to-transparent"></div>
                            <div className="hidden md:block absolute top-[40px] left-2/3 w-1/3 h-px bg-gradient-to-r from-amber-500/50 to-transparent"></div>

                            {[
                                { icon: Radar, key: 'radar', color: 'text-blue-400' },
                                { icon: Bot, key: 'hub', color: 'text-amber-400' },
                                { icon: TrendingUp, key: 'profit', color: 'text-emerald-400' }
                            ].map((step, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    transition={{ duration: 0.5, delay: i * 0.2 }}
                                    viewport={{ once: true }}
                                    className="flex flex-col items-center text-center gap-6"
                                >
                                    <div className={`w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center ${step.color} shadow-2xl`}>
                                        <step.icon size={36} />
                                    </div>
                                    <p className="text-lg font-bold leading-relaxed">
                                        {t(`landingPages.intelligenceHub.flow.${step.key}`)}
                                    </p>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Dobra 5: CTA Final */}
                <section className="py-40 px-6 text-center relative">
                    <div className="max-w-4xl mx-auto">
                        <motion.h2
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="text-5xl md:text-7xl font-black mb-10 text-slate-900 dark:text-white tracking-tighter italic leading-tight"
                        >
                            {t('landingPages.intelligenceHub.finalCta.title')}
                        </motion.h2>
                        <motion.p
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.1 }}
                            viewport={{ once: true }}
                            className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 mb-16 max-w-2xl mx-auto font-medium"
                        >
                            {t('landingPages.intelligenceHub.finalCta.subtitle')}
                        </motion.p>
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            viewport={{ once: true }}
                        >
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="px-16 py-6 bg-amber-500 text-white rounded-full font-black text-2xl shadow-3xl shadow-amber-500/30 hover:scale-110 active:scale-95 transition-all uppercase tracking-tighter flex items-center gap-4 mx-auto"
                            >
                                {t('landingPages.intelligenceHub.finalCta.button')} <ArrowRight size={28} />
                            </button>
                        </motion.div>
                    </div>
                </section>
            </main>

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

// Custom icons used in flow
const Bell = (props: any) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"></path><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"></path></svg>
);
