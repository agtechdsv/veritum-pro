'use client'

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    ShieldAlert, GitBranch, FileEdit, DollarSign, BarChart3,
    MessageSquare, Globe, Moon, Sun, ArrowRight, Check,
    LogIn, UserPlus, ChevronRight, Scale
} from 'lucide-react';
import { AuthModal } from '@/components/auth-modal';
import { LegalModal } from '@/components/legal-modal';
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

function LandingPageContent({ theme, setTheme, resolvedTheme, mounted }: any) {
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
    const searchParams = useSearchParams();
    const router = useRouter();

    useEffect(() => {
        if (searchParams.get('login') === 'true') {
            setAuthMode('login');
            setIsAuthModalOpen(true);
            // Clear the param after opening to avoid re-triggering on manual refresh
            router.replace('/', { scroll: false });
        }
    }, [searchParams, router]);

    // State for Legal Modals
    const [legalModal, setLegalModal] = useState<{ isOpen: boolean; type: 'privacy' | 'terms' }>({
        isOpen: false,
        type: 'privacy'
    });

    const suites: Suite[] = [
        {
            id: 'sentinel',
            title: 'Sentinel Pro',
            sub: 'Vigilância E Monitoramento',
            desc: 'Clipping inteligente e captura antecipada de processos.',
            icon: ShieldAlert,
            color: 'text-rose-500'
        },
        {
            id: 'nexus',
            title: 'Nexus Pro',
            sub: 'Gestão De Workflow',
            desc: 'Kanban jurídico e automação de tarefas recorrentes.',
            icon: GitBranch,
            color: 'text-indigo-500'
        },
        {
            id: 'scriptor',
            title: 'Scriptor Pro',
            sub: 'Inteligência Documental',
            desc: 'Redação assistida por IA e gestão de contratos (CLM).',
            icon: FileEdit,
            color: 'text-amber-500'
        },
        {
            id: 'valorem',
            title: 'Valorem Pro',
            sub: 'Controladoria Financeira',
            desc: 'Gestão de honorários e cálculos judiciais precisos.',
            icon: DollarSign,
            color: 'text-emerald-500'
        },
        {
            id: 'cognitio',
            title: 'Cognitio Pro',
            sub: 'Jurimetria Avançada',
            desc: 'Análise preditiva e dashboards para tomada de decisão.',
            icon: BarChart3,
            color: 'text-cyan-500'
        },
        {
            id: 'vox',
            title: 'Vox Clientis',
            sub: 'Crm E Portal Do Cliente',
            desc: 'Comunicação transparente e tradução de "juridiquês".',
            icon: MessageSquare,
            color: 'text-violet-500'
        },
    ];

    const plans = [
        { name: 'Essencial', price: 'R$ 299', features: ['Até 2 usuários', 'Nexus Pro (Básico)', 'Scriptor Pro', 'Suporte via Ticket'] },
        { name: 'Professional', price: 'R$ 599', features: ['Até 10 usuários', 'Todas as Suítes', 'IA Ilimitada', 'Suporte 24/7'], recommended: true },
        { name: 'Enterprise', price: 'Sob Consulta', features: ['Usuários Ilimitados', 'API Customizada', 'Treinamento de IA Local', 'Gerente de Contas'] },
    ];

    const openAuth = (mode: 'login' | 'register') => {
        setAuthMode(mode);
        setIsAuthModalOpen(true);
    };

    const openLegal = (type: 'privacy' | 'terms') => {
        setLegalModal({ isOpen: true, type });
    };

    const toggleTheme = () => {
        // If theme is system, we need to know what the resolved theme is to switch to the opposite
        if (theme === 'system') {
            setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
        } else {
            setTheme(theme === 'dark' ? 'light' : 'dark')
        }
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
                        <a href="#suites" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">Suítes</a>
                        <a href="#pricing" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">Planos</a>
                        <a href="#about" className="font-medium hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">Sobre</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <div className="flex items-center gap-1 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer text-slate-600 dark:text-slate-400">
                            <Globe size={20} />
                            <span className="text-xs font-bold">PT</span>
                        </div>
                        <button onClick={() => openAuth('login')} className="hidden sm:flex items-center gap-2 font-semibold px-4 py-2 hover:text-indigo-600 transition-colors text-slate-600 dark:text-slate-300">
                            <LogIn size={18} /> Entrar
                        </button>
                        <button onClick={() => openAuth('register')} className="bg-indigo-600 text-white px-6 py-2.5 rounded-full font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2">
                            <UserPlus size={18} /> Começar Grátis
                        </button>
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
                    <div className="flex flex-wrap items-center justify-center gap-6">
                        <button onClick={() => openAuth('register')} className="bg-indigo-600 text-white px-10 py-5 rounded-2xl font-bold text-lg shadow-2xl shadow-indigo-600/40 hover:-translate-y-1 transition-all flex items-center gap-3">
                            Ver Planos e Preços <ArrowRight size={22} />
                        </button>
                        <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-10 py-5 rounded-2xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-slate-800 dark:text-white">
                            Agendar Demo
                        </button>
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
                        {suites.map((suite) => (
                            <div key={suite.id} className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 group">
                                <div className={`w-16 h-16 rounded-2xl mb-6 flex items-center justify-center bg-slate-50 dark:bg-slate-800 group-hover:scale-110 transition-transform ${suite.color}`}>
                                    <suite.icon size={32} />
                                </div>
                                <h3 className="text-2xl font-bold mb-1 text-slate-800 dark:text-white">{suite.title}</h3>
                                <h4 className="text-indigo-600 dark:text-indigo-400 text-sm font-bold versalete mb-4">
                                    {suite.sub}
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed mb-6">
                                    {suite.desc}
                                </p>
                                <button className="text-indigo-600 dark:text-indigo-400 font-bold text-sm flex items-center gap-1 group-hover:gap-2 transition-all">
                                    Conhecer Módulo <ChevronRight size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Pricing */}
            <section id="pricing" className="py-32 px-6 bg-white dark:bg-slate-950 transition-colors duration-300">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <h2 className="text-4xl font-bold mb-4 text-slate-900 dark:text-white">Planos que acompanham seu crescimento</h2>
                        <p className="text-slate-500 dark:text-slate-400">Transparência total, sem letras miúdas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div key={plan.name} className={`relative p-10 rounded-[2.5rem] border transition-all duration-300 ${plan.recommended ? 'border-indigo-600 shadow-2xl bg-white dark:bg-slate-900' : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'}`}>
                                {plan.recommended && (
                                    <span className="absolute top-0 right-10 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest">
                                        Mais Popular
                                    </span>
                                )}
                                <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">{plan.name}</h3>
                                <div className="mb-8">
                                    <span className="text-4xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                                    {plan.price !== 'Sob Consulta' && <span className="text-slate-400 dark:text-slate-500 font-medium ml-1">/mês</span>}
                                </div>
                                <ul className="space-y-4 mb-10">
                                    {plan.features.map(f => (
                                        <li key={f} className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400 font-medium">
                                            <div className="w-5 h-5 bg-indigo-100 dark:bg-indigo-900/40 rounded-full flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                                                <Check size={12} />
                                            </div>
                                            {f}
                                        </li>
                                    ))}
                                </ul>
                                <button onClick={() => openAuth('register')} className={`w-full py-4 rounded-2xl font-bold transition-all duration-300 ${plan.recommended ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20 hover:bg-indigo-700' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white'}`}>
                                    Selecionar Plano
                                </button>
                            </div>
                        ))}
                    </div>
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
