'use client';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Zap, Shield, Globe, Users, Scale, MessageSquare, Moon, Sun, LayoutDashboard, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';
import { useTheme } from 'next-themes';
import { UserMenu } from '@/components/ui/user-menu';
import { createMasterClient } from '@/lib/supabase/master';
import { LegalModal } from '@/components/legal-modal';
import { CompanyModal } from '@/components/company-modal';
import { AuthModal } from '@/components/auth-modal';
import { Footer } from '@/components/shared/footer';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3v18"></path><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M7 21h10"></path></svg>
    </div>
);

export default function HistoryPage() {
    const { t, locale } = useTranslation();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(undefined);
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({ isOpen: false, type: 'privacy' });
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

    useEffect(() => {
        setMounted(true);
        const supabase = createMasterClient();
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url, role, plan_id, access_groups(name)')
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
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    const openLegal = (type: 'privacy' | 'terms') => {
        setLegalModal({ isOpen: true, type });
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen transition-colors duration-500 bg-white text-slate-900 dark:bg-slate-950 dark:text-white selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 glass border-b transition-colors duration-300 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                HISTORY <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        <Link href="/" className="font-medium text-branding-gradient hover:opacity-80 transition-all">{t('pricingPage.nav.portal')}</Link>
                        <a href="#top" className="font-medium text-slate-800 dark:text-white">{t('storyPage.nav.home')}</a>
                        <a href="#purpose" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('storyPage.nav.purpose')}</a>
                        <a href="#birth" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('storyPage.nav.birth')}</a>
                        <a href="#meaning" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('storyPage.nav.meaning')}</a>
                        <a href="#peace" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('storyPage.nav.peace')}</a>
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

            <main className="relative">
                {/* Hero Section */}
                <section id="top" className="relative pt-44 pb-32 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <div className="relative inline-block">
                            <h1 className="text-6xl md:text-8xl font-black mb-4 tracking-tighter text-slate-900 dark:text-white uppercase">
                                {t('storyPage.title')}
                            </h1>
                            <p className="text-2xl md:text-3xl font-bold bg-branding-gradient bg-clip-text text-transparent italic">
                                {t('storyPage.subtitle')}
                            </p>
                        </div>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-emerald-500 mx-auto rounded-full mb-12"
                        />
                    </motion.div>

                    {/* Background elements */}
                    <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-400/20 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-400/10 blur-[150px] rounded-full pointer-events-none"></div>
                </section>

                {/* Section 1: The Pain */}
                <section id="purpose" className="py-32 px-6 relative bg-slate-50 dark:bg-slate-900/50 transition-colors">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="flex flex-col gap-8"
                        >
                            <div className="flex items-center gap-4">
                                <span className="px-4 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-[0.2em]">{t('storyPage.purpose')}</span>
                                <div className="h-px flex-1 bg-slate-200 dark:border-slate-800" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white italic">
                                {t('storyPage.pain.title')}
                            </h2>
                            <div className="space-y-6 text-xl text-slate-600 dark:text-slate-400 font-medium leading-[1.8]">
                                <p>
                                    {t('storyPage.pain.content1')}
                                </p>
                                <p>
                                    {t('storyPage.pain.content2')}
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Section 2: The Birth */}
                <section id="birth" className="py-40 px-6 relative">
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="p-12 md:p-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[3rem] border border-white dark:border-slate-800 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

                            <Sparkles className="w-12 h-12 text-emerald-500 mx-auto mb-8 animate-pulse" />
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-12 tracking-tighter italic">
                                {t('storyPage.birth.title')}
                            </h2>
                            <p className="text-2xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                {t('storyPage.birth.content')}
                            </p>
                        </motion.div>
                    </div>

                    {/* Floating Orbs */}
                    <div className="absolute top-1/2 left-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                    <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
                </section>

                {/* Section 3: The Meaning of Veritum (Premium Card Style) */}
                <section id="meaning" className="py-40 px-6 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white relative overflow-hidden transition-colors duration-500">
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center mb-24">
                            <h2 className="text-4xl md:text-5xl font-black mb-8 tracking-tighter italic">
                                {t('storyPage.meaning.title')}
                            </h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
                                {t('storyPage.meaning.content')}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center italic">
                            {[
                                {
                                    title: t('storyPage.meaning.veritas.title'),
                                    subtitle: t('storyPage.meaning.veritas.subtitle'),
                                    desc: t('storyPage.meaning.veritas.desc'),
                                    icon: Shield
                                },
                                {
                                    title: t('storyPage.meaning.verum.title'),
                                    subtitle: t('storyPage.meaning.verum.subtitle'),
                                    desc: t('storyPage.meaning.verum.desc'),
                                    icon: Scale
                                },
                                {
                                    title: t('storyPage.meaning.veritum.title'),
                                    subtitle: t('storyPage.meaning.veritum.subtitle'),
                                    desc: t('storyPage.meaning.veritum.desc'),
                                    icon: MessageSquare,
                                    isSpecial: true
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.2, duration: 0.6 }}
                                    viewport={{ once: true }}
                                    className={`p-10 rounded-[3rem] border flex flex-col items-center gap-6 group transition-all duration-500 shadow-sm ${item.isSpecial ? 'bg-branding-gradient border-white/20 text-white' : 'bg-white dark:bg-slate-800/50 border-slate-200 dark:border-white/10'}`}
                                >
                                    <div className={`w-20 h-20 rounded-3xl flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-500 ${item.isSpecial ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-900 dark:text-white'}`}>
                                        <item.icon size={36} strokeWidth={1.5} />
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <span className={`text-[10px] font-black uppercase tracking-[0.2em] mb-2 block ${item.isSpecial ? 'text-white/70' : 'text-indigo-600 dark:text-indigo-400'}`}>
                                                {item.subtitle}
                                            </span>
                                            <h3 className={`text-4xl font-black italic tracking-tighter ${item.isSpecial ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                {item.title}
                                            </h3>
                                        </div>
                                        <p className={`text-sm leading-relaxed font-medium ${item.isSpecial ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {item.desc}
                                        </p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 4: Deep Dive */}
                <section id="peace" className="py-40 px-6 bg-white dark:bg-slate-950 transition-colors">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                                className="relative aspect-square"
                            >
                                <div className="absolute inset-10 bg-indigo-600 rounded-[4rem] rotate-6 opacity-10 animate-pulse" />
                                <div className="absolute inset-10 bg-emerald-500 rounded-[4rem] -rotate-3 opacity-10 animate-pulse" />
                                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center p-12">
                                    {/* Justice Background Image */}
                                    <img
                                        src="/justice-bg.png"
                                        alt="Justiça"
                                        className="absolute inset-0 w-full h-full object-cover opacity-[0.1] dark:opacity-[0.07] grayscale brightness-150 pointer-events-none"
                                    />
                                    <Zap className="w-32 h-32 text-indigo-600 dark:text-indigo-400 absolute opacity-5" />
                                    <div className="text-center italic z-10">
                                        <h4 className="text-7xl font-black mb-2 bg-gradient-to-b from-indigo-600 to-white bg-clip-text text-transparent pb-2">
                                            {t('storyPage.deepDive.peaceTitle')}
                                        </h4>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest">{t('storyPage.deepDive.peaceSubtitle')}</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                                className="space-y-8"
                            >
                                <p className="text-2xl text-slate-600 dark:text-slate-400 font-medium leading-[1.8]">
                                    {t('storyPage.deepDive.content1')}
                                </p>
                                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    {t('storyPage.deepDive.content2')}
                                </p>
                                <p className="text-xl text-slate-500 dark:text-slate-400 font-bold border-l-4 border-indigo-500 pl-6 italic">
                                    {t('storyPage.deepDive.quote')}
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-40 px-6 text-center bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto relative z-10"
                    >
                        <h2 className="text-4xl md:text-5xl font-black mb-12 leading-tight scale-[1.05] italic">
                            {t('storyPage.cta.title')}
                        </h2>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 m-12">
                            {currentUser ? (
                                <Link
                                    href="/veritum"
                                    className="px-12 py-5 bg-indigo-600 text-white rounded-full font-black text-xl shadow-2xl shadow-indigo-600/30 hover:scale-110 hover:bg-indigo-700 transition-all uppercase tracking-tight flex items-center gap-3"
                                >
                                    {t('hero.ctaPrimary')} <ArrowLeft className="rotate-180" size={24} />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="px-12 py-5 bg-indigo-600 text-white rounded-full font-black text-xl shadow-2xl shadow-indigo-600/30 hover:scale-[1.05] active:scale-[0.98] hover:bg-indigo-700 transition-all uppercase tracking-tight flex items-center gap-3 cursor-pointer border-none"
                                >
                                    {t('hero.ctaPrimary')} <ArrowLeft className="rotate-180" size={24} />
                                </button>
                            )}
                        </div>
                    </motion.div>

                    {/* Animated background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-500 to-transparent" />
                        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
                    </div>
                </section>
            </main>

            {/* Standard Footer */}
            <Footer setIsCompanyModalOpen={setIsCompanyModalOpen} openLegal={openLegal} />

            <LegalModal
                isOpen={legalModal.isOpen}
                onClose={() => setLegalModal({ ...legalModal, isOpen: false })}
                type={legalModal.type}
            />

            <CompanyModal
                isOpen={isCompanyModalOpen}
                onClose={() => setIsCompanyModalOpen(false)}
            />

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                mode={authMode}
            />
        </div>
    );
}
