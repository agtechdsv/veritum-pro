'use client'

import React, { useState, useEffect } from 'react';
import {
    MessageSquare, Smartphone, Zap, Heart, MessageCircle,
    ArrowRight, ChevronRight, Moon, Sun, Scale,
    Bell, Globe, Shield, Search, ArrowDownToLine,
    LayoutDashboard, Sparkles, UserCheck, LogOut, Briefcase
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
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <MessageSquare className="h-6 w-6" />
    </div>
);

const WhatsAppIcon = () => (
    <div className="bg-emerald-500 p-2 rounded-full text-white shadow-lg">
        <MessageCircle size={24} />
    </div>
);

export default function VoxLanding() {
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
        <div id="top" className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                VOX <span className="text-branding-gradient">CLIENTIS</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="font-medium text-branding-gradient hover:opacity-80 transition-all">{t('pricingPage.nav.portal')}</Link>
                        <a href="#top" className="font-medium text-slate-800 dark:text-white">{t('landingPages.vox.nav.home')}</a>
                        <a href="#vision" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.vox.nav.vision')}</a>
                        <a href="#features" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.vox.nav.features')}</a>
                        <a href="#ux" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">{t('landingPages.vox.nav.ux')}</a>
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
                            <Link href="/?login=true" className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                                <LogOut size={18} /> {t('nav.login')}
                            </Link>
                        ) : null}
                        {(hasAccess || currentUser) && (
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all text-sm"
                            >
                                {t('landingPages.vox.hero.cta1')}
                            </button>
                        )}
                    </div>
                </div>
            </nav>

            {/* Dobra 1: Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
                            <Sparkles size={14} className="animate-pulse" /> {t('landingPages.vox.hero.badge')}
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-slate-900 dark:text-white">
                            {t('landingPages.vox.hero.title').split(' ').map((word: string, i: number) => {
                                if (word.toLowerCase() === '"doutor,' || word.toLowerCase() === 'como' || word.toLowerCase() === 'está' || word.toLowerCase() === 'o' || word.toLowerCase() === 'meu' || word.toLowerCase() === 'caso?"' || word.toLowerCase() === '"doctor,' || word.toLowerCase() === 'how' || word.toLowerCase() === 'is' || word.toLowerCase() === 'my' || word.toLowerCase() === 'case' || word.toLowerCase() === 'doing?"') {
                                    return <React.Fragment key={i}><span className="text-branding-gradient">{word}</span> </React.Fragment>
                                }
                                return word + ' '
                            })}
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
                            {t('landingPages.vox.hero.subtitle')}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            {(hasAccess || currentUser) && (
                                <button
                                    onClick={() => setIsAuthModalOpen(true)}
                                    className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                                >
                                    {t('landingPages.vox.hero.cta1')} <ArrowRight size={20} />
                                </button>
                            )}
                            <a href="#vision" className="w-full sm:w-auto px-10 py-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-slate-600 dark:text-slate-300">
                                {t('landingPages.vox.hero.cta2')}
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {/* WhatsApp Notification Mockup */}
                        <div className="relative z-10 flex justify-center">
                            <div className="w-72 aspect-[9/19] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-3xl p-4 relative">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20" />
                                <div className="w-full h-full bg-[#E5DDD5] dark:bg-slate-950 rounded-[2rem] overflow-hidden flex flex-col relative">
                                    <div className="h-14 bg-[#075E54] dark:bg-slate-900 flex items-center px-4 gap-3 text-white">
                                        <div className="w-8 h-8 rounded-full bg-slate-200" />
                                        <div className="flex-1">
                                            <div className="text-[10px] font-bold">{t('landingPages.vox.mockup.title1')}</div>
                                            <div className="text-[8px] opacity-80">{t('landingPages.vox.mockup.status')}</div>
                                        </div>
                                    </div>
                                    <div className="flex-1 p-4 space-y-4">
                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-2xl rounded-tl-none shadow-sm text-[10px] text-slate-800 dark:text-slate-200 max-w-[85%] animate-fade-in-up">
                                            <p className="font-bold mb-1">{t('landingPages.vox.mockup.msg1')}</p>
                                            <p>{t('landingPages.vox.mockup.msg2')}</p>
                                            <div className="text-[8px] text-slate-400 text-right mt-1">{t('landingPages.vox.mockup.time')}</div>
                                        </div>
                                        <div className="bg-indigo-100 dark:bg-indigo-900/40 p-3 rounded-2xl rounded-tl-none shadow-sm text-[10px] text-indigo-900 dark:text-indigo-200 max-w-[85%] border border-indigo-200 dark:border-indigo-800/50 animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                                            <div className="flex items-center gap-1 mb-1">
                                                <Sparkles size={8} className="text-indigo-600" />
                                                <span className="font-bold">{t('landingPages.vox.mockup.aiLabel')}</span>
                                            </div>
                                            <p>{t('landingPages.vox.mockup.msg3')}</p>
                                        </div>
                                    </div>
                                    <div className="h-12 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex items-center px-4 gap-2">
                                        <div className="flex-1 h-8 bg-slate-50 dark:bg-slate-800 rounded-full" />
                                        <div className="w-8 h-8 bg-[#128C7E] rounded-full flex items-center justify-center text-white"><ArrowRight size={14} /></div>
                                    </div>
                                </div>
                            </div>

                            {/* Floating Stats */}
                            <div className="absolute top-1/4 -right-10 bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 animate-bounce" style={{ animationDuration: '3s' }}>
                                <div className="text-[10px] font-black uppercase text-emerald-500 mb-1">{t('landingPages.vox.mockup.clientBanner')}</div>
                                <div className="flex items-center gap-2">
                                    <Heart size={16} className="text-rose-500 fill-rose-500" />
                                    <span className="text-lg font-black text-slate-900 dark:text-white">{t('landingPages.vox.mockup.percentage')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Decorative background blobs */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
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
                                { label: t('landingPages.vox.vision.stats.messages'), val: t('landingPages.vox.vision.stats.messagesVal'), color: 'text-indigo-600', icon: Bell },
                                { label: t('landingPages.vox.vision.stats.timeSaved'), val: t('landingPages.vox.vision.stats.timeSavedVal'), color: 'text-emerald-500', icon: Zap },
                                { label: t('landingPages.vox.vision.stats.satisfaction'), val: t('landingPages.vox.vision.stats.satisfactionVal'), color: 'text-rose-500', icon: Heart },
                                { label: t('landingPages.vox.vision.stats.availability'), val: t('landingPages.vox.vision.stats.availabilityVal'), color: 'text-blue-500', icon: Globe }
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
                                {t('landingPages.vox.vision.title').split(' ').map((word: string, i: number) => (
                                    <React.Fragment key={i}>
                                        {word.toLowerCase() === 'piloto' || word.toLowerCase() === 'automático.' || word.toLowerCase() === 'autopilot.' ? <span className="text-branding-gradient">{word}</span> : word}{' '}
                                    </React.Fragment>
                                ))}
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                {t('landingPages.vox.vision.desc1')}
                            </p>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                {t('landingPages.vox.vision.desc2')}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dobra 3: Funcionalidades */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-sm">{t('landingPages.vox.features.category')}</span>
                        <h2 className="text-5xl font-black mt-4 text-slate-900 dark:text-white uppercase tracking-tighter">{t('landingPages.vox.features.title')}</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">{t('landingPages.vox.features.subtitle')}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            {
                                title: t('landingPages.vox.features.items.translator.title'),
                                desc: t('landingPages.vox.features.items.translator.desc'),
                                icon: Sparkles,
                                color: 'bg-indigo-500/10 text-indigo-500'
                            },
                            {
                                title: t('landingPages.vox.features.items.automation.title'),
                                desc: t('landingPages.vox.features.items.automation.desc'),
                                icon: Smartphone,
                                color: 'bg-emerald-500/10 text-emerald-500'
                            },
                            {
                                title: t('landingPages.vox.features.items.portal.title'),
                                desc: t('landingPages.vox.features.items.portal.desc'),
                                icon: LayoutDashboard,
                                color: 'bg-blue-500/10 text-blue-500'
                            },
                            {
                                title: t('landingPages.vox.features.items.proactive.title'),
                                desc: t('landingPages.vox.features.items.proactive.desc'),
                                icon: Bell,
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
                                    {t('landingPages.vox.features.cta')} <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Dobra 4: UX e Diferencial */}
            <section id="ux" className="py-32 px-6 bg-slate-900 dark:bg-slate-900/80 rounded-[4rem] mx-6 relative overflow-hidden text-white">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
                    <div className="flex-1 space-y-10">
                        <h2 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter uppercase mb-6">
                            {t('landingPages.vox.ux.title').split(' ').map((word: string, i: number) => (
                                <React.Fragment key={i}>
                                    {word.toLowerCase() === 'indicações.' || word.toLowerCase() === 'referrals.' ? <span className="text-branding-gradient">{word}</span> : word}{' '}
                                </React.Fragment>
                            ))}
                        </h2>
                        <p className="text-xl text-slate-300 leading-relaxed font-medium">
                            {t('landingPages.vox.ux.subtitle')}
                        </p>
                        <div className="space-y-6">
                            {[
                                { title: t('landingPages.vox.ux.items.boundaries.title'), desc: t('landingPages.vox.ux.items.boundaries.desc'), icon: Shield },
                                { title: t('landingPages.vox.ux.items.accessibility.title'), desc: t('landingPages.vox.ux.items.accessibility.desc'), icon: UserCheck },
                                { title: t('landingPages.vox.ux.items.notifications.title'), desc: t('landingPages.vox.ux.items.notifications.desc'), icon: Zap }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <item.icon className="text-indigo-400 shrink-0 mt-1" size={24} />
                                    <div>
                                        <h4 className="font-black text-lg mb-1 uppercase tracking-tight">{item.title}</h4>
                                        <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative aspect-square lg:aspect-auto h-full min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20 blur-3xl opacity-50"></div>
                        <div className="relative z-10 w-full h-full border border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col justify-center gap-8">
                            <div className="p-8 border border-white/10 bg-white/5 rounded-3xl space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-slate-700" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-4 w-32 bg-white/20 rounded-full" />
                                        <div className="h-2 w-24 bg-white/10 rounded-full" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="h-2 w-full bg-white/5 rounded-full" />
                                    <div className="h-2 w-full bg-white/5 rounded-full" />
                                    <div className="h-2 w-[80%] bg-white/5 rounded-full" />
                                </div>
                                <div className="pt-4 border-t border-white/5 flex justify-between">
                                    <div className="h-8 w-24 bg-indigo-500/20 rounded-lg flex items-center justify-center text-[8px] font-black text-indigo-400 uppercase">{t('landingPages.vox.ux.mockupLabels.chat')}</div>
                                    <div className="h-8 w-24 bg-emerald-500/20 rounded-lg flex items-center justify-center text-[8px] font-black text-emerald-400 uppercase">{t('landingPages.vox.ux.mockupLabels.process')}</div>
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
                        {t('landingPages.vox.finalCta.title').split(' ').map((word: string, i: number) => (
                            <React.Fragment key={i}>
                                {word.toLowerCase() === 'atendimento?' || word.toLowerCase() === 'service?' ? <span className="text-branding-gradient">{word}</span> : word}{' '}
                            </React.Fragment>
                        ))}
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        {t('landingPages.vox.finalCta.subtitle')}
                    </p>
                    {(hasAccess || currentUser) && (
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all cursor-pointer"
                            >
                                {t('landingPages.vox.finalCta.button1')}
                            </button>
                            <Link
                                href="/pricing"
                                className="w-full sm:w-auto px-12 py-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                            >
                                {t('landingPages.vox.finalCta.button2')}
                            </Link>
                        </div>
                    )}
                    <p className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-widest">
                        {t('landingPages.vox.finalCta.footer')}
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
                                    VOX <span className="text-branding-gradient">CLIENTIS</span>
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs text-center md:text-left">
                                {t('landingPages.vox.footer.slogan')}
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale size={24} className="text-indigo-600" />
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
