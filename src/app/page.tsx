'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShieldAlert, GitBranch, FileEdit, DollarSign, BarChart3,
    MessageSquare, Globe, Moon, Sun, ArrowRight, Check,
    LogIn, UserPlus, ChevronRight, Scale, LogOut, User
} from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
import { SuiteDetailModal } from '@/components/suite-detail-modal';
import { PlanCarousel } from '@/components/plan-carousel';
import { useTheme } from 'next-themes'
import Link from 'next/link'

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
    const [suitesLoading, setSuitesLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const supabase = createMasterClient();

    useEffect(() => {
        if (searchParams.get('login') === 'true') {
            setAuthMode('login');
            setIsAuthModalOpen(true);
            router.replace('/', { scroll: false });
        }
    }, [searchParams, router]);

    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
        isOpen: false,
        type: 'privacy'
    });

    const [detailModal, setDetailModal] = useState<{ isOpen: boolean; suite: DbSuite | null }>({
        isOpen: false,
        suite: null
    });

    const [plans, setPlans] = useState<any[]>([]);
    const [plansLoading, setPlansLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        };
        fetchUser();

        const fetchData = async () => {
            setSuitesLoading(true);
            setPlansLoading(true);

            const [suitesRes, plansRes] = await Promise.all([
                supabase.from('suites').select('*').eq('active', true).order('order_index', { ascending: true }),
                supabase.from('plans').select('*').eq('active', true).order('order_index', { ascending: true })
            ]);

            if (suitesRes.data) setSuites(suitesRes.data);
            if (plansRes.data) setPlans(plansRes.data);

            setSuitesLoading(false);
            setPlansLoading(false);
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
                        <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white">VERITUM <span className="text-indigo-600">PRO</span></span>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#" className="font-medium hover:text-indigo-600 transition-colors text-slate-800 dark:text-white">Início</a>
                        <a href="#suites" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">Suítes</a>
                        <a href="#pricing" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">Planos</a>
                        <a href="#about" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">Sobre</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <div className="flex items-center gap-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-600 dark:text-slate-400 transition-all">
                            <Globe size={20} />
                            <span className="text-xs font-bold">PT</span>
                        </div>

                        {currentUser ? (
                            <div className="flex items-center gap-4">
                                <Link href="/veritum" className="flex items-center gap-2 font-bold text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-all">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center">
                                        <User size={16} />
                                    </div>
                                    <span className="hidden sm:inline">Painel</span>
                                </Link>
                                <button
                                    onClick={async () => {
                                        await supabase.auth.signOut();
                                        setCurrentUser(null);
                                    }}
                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all cursor-pointer"
                                    title="Sair"
                                >
                                    <LogOut size={20} />
                                </button>
                            </div>
                        ) : (
                            <>
                                <button onClick={() => openAuth('login')} className="hidden sm:flex items-center gap-2 font-semibold px-4 py-2 hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300 cursor-pointer">
                                    <LogIn size={18} /> Entrar
                                </button>
                                <button onClick={() => openAuth('register')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer">
                                    <UserPlus size={18} /> Começar Grátis
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <span className="inline-block bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-6">
                        A Nova Era do Direito Digital
                    </span>
                    <h1 className="text-6xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] text-slate-900 dark:text-white">
                        O Ecossistema <span className="text-indigo-600">Jurídico</span> <br className="hidden lg:block" />
                        Modular & Inteligente
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 max-w-3xl mx-auto mb-12 leading-relaxed">
                        Uma arquitetura BYODB (Bring Your Own Database) completa para escritórios de alta performance.
                        Seu dado, sua infraestrutura, nossas suítes inteligentes.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <button onClick={() => openAuth('register')} className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-[2rem] font-bold text-lg shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 cursor-pointer">
                            Começar Agora <ArrowRight size={20} />
                        </button>
                        <a href="#pricing" className="w-full sm:w-auto px-10 py-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center cursor-pointer">
                            Ver planos e preços
                        </a>
                    </div>
                </div>

                {/* Background blobs */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-400/20 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-purple-400/10 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Suites Grid */}
            <section id="suites" className="py-32 px-6 bg-slate-50 dark:bg-slate-950 transition-colors duration-300 border-y border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">Suítes Especializadas</h2>
                        <p className="text-slate-500 dark:text-slate-400">Arquitetura modular projetada para o ciclo de vida jurídico completo.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {suitesLoading ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-slate-50 dark:bg-slate-900/50 h-64 rounded-[2rem] animate-pulse"></div>
                            ))
                        ) : (
                            suites.map((suite) => (
                                <div key={suite.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                                    <div
                                        className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform text-indigo-600`}
                                        dangerouslySetInnerHTML={{ __html: suite.icon_svg }}
                                    />
                                    <h3 className="text-2xl font-bold mb-1 text-slate-800 dark:text-white">{suite.name}</h3>
                                    <h4 className="text-indigo-600 dark:text-indigo-400 text-sm font-bold versalete mb-4">
                                        {suite.short_desc?.pt || ''}
                                    </h4>
                                    <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                        {suite.detailed_desc?.pt || ''}
                                    </p>

                                    <button
                                        onClick={() => {
                                            if (currentUser) {
                                                router.push(`/veritum?module=${suite.suite_key}`);
                                            } else {
                                                setDetailModal({ isOpen: true, suite });
                                            }
                                        }}
                                        className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all mt-auto cursor-pointer"
                                    >
                                        {currentUser ? 'Acessar Módulo' : 'Saiba Mais'} <ChevronRight size={16} />
                                    </button>
                                </div>
                            ))
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
                    <div className="text-center mb-12">
                        <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">Planos que acompanham seu crescimento</h2>
                        <p className="text-slate-500 dark:text-slate-400 mb-10">Transparência total, sem letras miúdas.</p>

                        {/* Billing Toggle */}
                        <div className="flex items-center justify-center gap-4 mb-16">
                            <span className={`text-sm font-bold ${billingCycle === 'monthly' ? 'text-indigo-600' : 'text-slate-400'}`}>MENSAL</span>
                            <button
                                onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                                className="w-16 h-8 bg-slate-100 dark:bg-slate-800 rounded-full relative p-1 transition-all"
                            >
                                <div className={`w-6 h-6 bg-indigo-600 rounded-full shadow-lg transition-all transform ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`} />
                            </button>
                            <span className={`text-sm font-bold ${billingCycle === 'yearly' ? 'text-indigo-600' : 'text-slate-400'}`}>ANUAL</span>
                            {billingCycle === 'yearly' && (
                                <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest animate-bounce">
                                    Economize até 20%
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Combos Section */}
                    {plans.some(p => p.is_combo) && (
                        <div className="mb-20">
                            <div className="flex items-center gap-4 mb-10">
                                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Pacotes de Elite (Combos)</h3>
                                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                            </div>
                            <PlanCarousel
                                plans={plans.filter(p => p.is_combo)}
                                billingCycle={billingCycle}
                                openAuth={openAuth}
                            />
                        </div>
                    )}

                    {/* Individual Modules Section */}
                    {plans.some(p => !p.is_combo) && (
                        <div>
                            <div className="flex items-center gap-4 mb-10">
                                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Módulos Individuais</h3>
                                <div className="h-px bg-slate-200 dark:bg-slate-800 flex-1" />
                            </div>
                            <PlanCarousel
                                plans={plans.filter(p => !p.is_combo)}
                                billingCycle={billingCycle}
                                openAuth={openAuth}
                            />
                        </div>
                    )}
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 px-6 border-t border-slate-100 dark:border-slate-900 bg-slate-50 dark:bg-slate-950 transition-colors">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white">VERITUM <span className="text-indigo-600">PRO</span></span>
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium">© 2024 Veritum Pro. Todos os direitos reservados.</p>
                    <div className="flex gap-6">
                        <button onClick={() => openLegal('privacy')} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Privacidade</button>
                        <button onClick={() => openLegal('terms')} className="text-sm text-slate-500 hover:text-indigo-600 transition-colors">Termos</button>
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
