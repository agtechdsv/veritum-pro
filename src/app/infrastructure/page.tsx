'use client'

import React, { useState, useEffect } from 'react';
import {
    Shield, Database, Cloud, Check, ChevronRight,
    ArrowRight, Lock, Server, Cpu, Activity,
    HelpCircle, Globe, Scale, LayoutDashboard, LogOut,
    Moon, Sun
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useTranslation } from '@/contexts/language-context';
import { LanguageSelector } from '@/components/ui/language-selector';
import { UserMenu } from '@/components/ui/user-menu';
import { createMasterClient } from '@/lib/supabase/master';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
import { CompanyModal } from '@/components/company-modal';
import { Footer } from '@/components/shared/footer';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <Scale className="h-6 w-6" />
    </div>
);

export default function InfrastructurePage() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const { t, locale } = useTranslation();
    const [mounted, setMounted] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(undefined);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const [legalModal, setLegalModal] = useState({ isOpen: false, type: 'privacy' as 'privacy' | 'terms' });
    const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);

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
                    .select('name, avatar_url, role, plan_id, access_group_id, access_groups(name)')
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

    const sections = {
        hero: t('infrastructurePage.hero'),
        architecture: t('infrastructurePage.architecture'),
        enterprise: t('infrastructurePage.enterprise'),
        faq: t('infrastructurePage.faq')
    };

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-[1400px] mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white uppercase">
                                VERITUM <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden lg:flex items-center gap-8">
                        <Link href="/" className="font-medium text-branding-gradient hover:opacity-80 transition-all">{t('pricingPage.nav.portal')}</Link>
                        <a href="#top" className="font-medium text-slate-800 dark:text-white">{t('infrastructurePage.nav.home')}</a>
                        <a href="#architecture" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('infrastructurePage.nav.architecture')}</a>
                        <a href="#security" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('infrastructurePage.nav.security')}</a>
                        <a href="#faq" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('infrastructurePage.nav.faq')}</a>
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
                                    className="hidden xl:flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-bold text-sm shadow-xl shadow-indigo-600/20 transition-all hover:scale-105"
                                >
                                    <LayoutDashboard size={18} />
                                    {t('nav.dashboard')}
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

            {/* Hero Section */}
            <section id="top" className="pt-44 pb-32 px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 mb-8 border border-indigo-100 dark:border-indigo-800/50">
                        <Shield size={16} className="animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.2em]">{sections.enterprise.label}</span>
                    </div>
                    <h1 className="text-5xl md:text-7xl font-black mb-8 text-slate-900 dark:text-white leading-[1.1] tracking-tight uppercase">
                        {sections.hero.title}
                    </h1>
                    <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 leading-relaxed max-w-3xl mx-auto font-medium">
                        {sections.hero.subtitle}
                    </p>
                </div>

                {/* Animated Background Gradients */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none animate-pulse"></div>
                <div className="absolute top-1/4 right-0 w-[400px] h-[400px] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none"></div>
            </section>

            {/* Infrastructure Options */}
            <section id="architecture" className="py-32 px-6 bg-slate-50 dark:bg-slate-900/30">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-24">
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6 tracking-tighter">
                            {sections.architecture.title}
                        </h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto font-medium leading-relaxed">
                            {sections.architecture.subtitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* Managed Cloud */}
                        <div className="group p-12 rounded-[3.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xl shadow-slate-200/50 dark:shadow-none hover:border-indigo-500 transition-all duration-500">
                            <div className="mb-10 w-20 h-20 bg-indigo-600 text-white rounded-3xl flex items-center justify-center shadow-2xl shadow-indigo-600/40 group-hover:scale-110 transition-transform duration-500">
                                <Cloud size={40} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase">
                                {sections.architecture.cloud.title}
                            </h3>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                                {sections.architecture.cloud.desc}
                            </p>
                            <div className="space-y-4">
                                {(sections.architecture.cloud.features || []).map((item: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* BYODB */}
                        <div className="group p-12 rounded-[3.5rem] bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 hover:border-indigo-400 transition-all duration-500 shadow-3xl">
                            <div className="mb-10 w-20 h-20 bg-indigo-600/10 dark:bg-white/10 text-indigo-600 dark:text-white rounded-3xl flex items-center justify-center border border-indigo-600/20 dark:border-white/20 group-hover:scale-110 transition-transform duration-500">
                                <Database size={40} />
                            </div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-6 uppercase">
                                {sections.architecture.byodb.title}
                            </h3>
                            <p className="text-lg text-slate-500 dark:text-slate-400 font-medium leading-relaxed mb-10">
                                {sections.architecture.byodb.desc}
                            </p>
                            <div className="space-y-4">
                                {(sections.architecture.byodb.features || []).map((item: string, i: number) => (
                                    <div key={i} className="flex items-center gap-3 text-sm font-bold text-slate-600 dark:text-slate-300">
                                        <div className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                                            <Check size={12} strokeWidth={4} />
                                        </div>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Enterprise Security Section */}
            <section id="security" className="py-32 px-6">
                <div className="max-w-7xl mx-auto rounded-[4rem] bg-indigo-600 p-12 md:p-24 relative overflow-hidden shadow-3xl animate-fade-in text-white">
                    <div className="relative z-10 max-w-3xl">
                        <span className="inline-block px-4 py-1.5 bg-white/20 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-white/30 backdrop-blur-md">
                            {sections.enterprise.spotlight}
                        </span>
                        <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight tracking-tighter">
                            {sections.enterprise.title}
                        </h2>
                        <p className="text-xl md:text-2xl text-indigo-50 font-medium leading-relaxed mb-12">
                            {sections.enterprise.subtitle}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {[
                                { icon: Lock, label: sections.enterprise.sso },
                                { icon: Server, label: sections.enterprise.soc2 },
                                { icon: Activity, label: sections.enterprise.monitoring }
                            ].map((item, i) => (
                                <div key={i} className="flex flex-col gap-4 p-6 bg-white/10 rounded-3xl border border-white/10 backdrop-blur-sm">
                                    <item.icon size={32} />
                                    <span className="font-black text-sm uppercase tracking-tight">{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Decorative blobs */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-400/20 blur-[80px] rounded-full translate-x-1/4 translate-y-1/4"></div>
                </div>
            </section>

            {/* FAQ Technical Section */}
            <section id="faq" className="py-32 px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black mb-20 text-center text-slate-900 dark:text-white tracking-tighter">
                        {sections.faq.title}
                    </h2>
                    <div className="space-y-6">
                        {sections.faq.questions?.map((faq: any, i: number) => (
                            <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-sm group hover:shadow-xl transition-all duration-300">
                                <h4 className="font-black text-xl text-slate-900 dark:text-white mb-4 flex gap-4 text-left">
                                    <div className="bg-indigo-600/10 p-2 rounded-xl text-indigo-600">
                                        <HelpCircle size={24} />
                                    </div>
                                    <span className="pt-1">{faq.q}</span>
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-14 text-lg">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center bg-white dark:bg-slate-950">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-4xl md:text-5xl font-black mb-8 text-slate-900 dark:text-white leading-tight tracking-tighter">
                        {t('infrastructurePage.engineer.title')} <span className="text-branding-gradient">{t('infrastructurePage.engineer.accent')}</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 font-medium">
                        {t('infrastructurePage.engineer.subtitle')}
                    </p>
                    <Link
                        href="/pricing#infrastructure"
                        className="inline-flex items-center gap-3 bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-lg shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all uppercase tracking-tight"
                    >
                        {t('infrastructurePage.engineer.cta')} <ArrowRight size={20} />
                    </Link>
                </div>
            </section>

            <Footer
                setIsCompanyModalOpen={setIsCompanyModalOpen}
                openLegal={openLegal}
                showSecurityLink={false}
            />

            <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} mode={authMode} />
            <LegalModal isOpen={legalModal.isOpen} onClose={() => setLegalModal({ ...legalModal, isOpen: false })} type={legalModal.type} />
            <CompanyModal isOpen={isCompanyModalOpen} onClose={() => setIsCompanyModalOpen(false)} />
        </div>
    );
}
