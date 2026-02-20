'use client'

import React, { useState, useEffect } from 'react';
import {
    Check, ChevronDown, ChevronUp, Star, Zap,
    ArrowRight, ChevronRight, Moon, Sun, Scale,
    Shield, BarChart3, MessageSquare, Wallet,
    PenTool, Radar, HelpCircle, Briefcase,
    Building2, Users2, Sparkles, Send, Calendar as CalendarIcon,
    ChevronLeft
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    isSameMonth,
    isSameDay,
    addDays,
    isBefore,
    startOfDay
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { AuthModal } from '@/components/auth-modal';
import { createMasterClient } from '@/lib/supabase/master';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <Scale className="h-6 w-6" />
    </div>
);

export default function PricingPage() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
    const [showComparison, setShowComparison] = useState(false);

    const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
    const [demoFormStatus, setDemoFormStatus] = useState<'idle' | 'submitting' | 'success'>('idle');
    const [demoFormData, setDemoFormData] = useState({
        name: '',
        email: '',
        whatsapp: '',
        teamSize: ''
    });
    const [selectedRange, setSelectedRange] = useState<{ start: Date | null, end: Date | null }>({ start: null, end: null });
    const [currentMonth, setCurrentMonth] = useState(new Date());

    const formatWhatsApp = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 2) return numbers;
        if (numbers.length <= 7) return `(${numbers.slice(0, 2)}) ${numbers.slice(2)}`;
        return `(${numbers.slice(0, 2)}) ${numbers.slice(2, 7)}-${numbers.slice(7, 11)}`;
    };

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleDemoSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedRange.start || !selectedRange.end) {
            alert('Por favor, selecione o período para a demonstração.');
            return;
        }
        setDemoFormStatus('submitting');

        try {
            const supabase = createMasterClient();
            const { error } = await supabase.from('demo_requests').insert([
                {
                    full_name: demoFormData.name,
                    email: demoFormData.email,
                    whatsapp: demoFormData.whatsapp,
                    team_size: demoFormData.teamSize,
                    preferred_start: selectedRange.start.toISOString(),
                    preferred_end: selectedRange.end.toISOString(),
                    status: 'pending'
                }
            ]);

            if (error) throw error;

            setDemoFormStatus('success');
            setTimeout(() => {
                setIsDemoModalOpen(false);
                setDemoFormStatus('idle');
                setDemoFormData({ name: '', email: '', whatsapp: '', teamSize: '' });
                setSelectedRange({ start: null, end: null });
            }, 6000);
        } catch (err: any) {
            console.error('Error saving demo request:', err);
            alert('Erro ao salvar solicitação: ' + err.message);
            setDemoFormStatus('idle');
        }
    };

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light');
    };

    if (!mounted) return null;

    const plans = [
        {
            name: 'START',
            desc: 'Para advogados autônomos e novos escritórios. A base sólida para organizar a rotina.',
            price: 'R$ 297',
            period: '/mês',
            features: [
                'Nexus PRO: Gestão e Kanban (500 proc.)',
                'Valorem PRO: Financeiro e PIX',
                'Vox Clientis: Portal do Cliente Básico',
                'Suporte via E-mail e Chat'
            ],
            cta: 'Começar Teste Grátis',
            featured: false,
            color: 'border-slate-200 dark:border-slate-800'
        },
        {
            name: 'GROWTH',
            desc: 'Para escritórios em crescimento e bancas estruturadas. O motor de inteligência e automação.',
            price: 'R$ 597',
            period: '/mês',
            features: [
                'Tudo do plano Start, mais:',
                'Sentinel PRO: Captura Antecipada',
                'Scriptor PRO: IA Geradora de Peças',
                'Nexus PRO: Automação de Workflows',
                'Vox Clientis: WhatsApp e IA Tradutora',
                'Suporte Prioritário'
            ],
            cta: 'Começar teste grátis',
            featured: true,
            color: 'border-indigo-500 dark:border-indigo-400 shadow-2xl shadow-indigo-500/20'
        },
        {
            name: 'STRATEGY',
            desc: 'Para diretorias jurídicas e corporações. O cockpit estratégico com jurimetria.',
            price: 'Sob Consulta',
            period: '',
            features: [
                'Tudo do plano Growth, mais:',
                'Cognitio PRO: BI e Jurimetria Preditiva',
                'Nexus PRO: Gestão de Ativos e Frota',
                'Valorem PRO: Relatórios de Contingência',
                'Gerente de Sucesso Dedicado (CSM)'
            ],
            cta: 'Agendar Demonstração',
            featured: false,
            color: 'border-slate-200 dark:border-slate-800'
        }
    ];

    const comparisonData = [
        { category: 'Gestão Processual (Nexus)', start: true, growth: true, strategy: true, label: 'Kanban e Prazos' },
        { category: 'Gestão Processual (Nexus)', start: false, growth: true, strategy: true, label: 'Workflows Automatizados' },
        { category: 'Gestão Processual (Nexus)', start: false, growth: false, strategy: true, label: 'Gestão de Ativos e Frota' },
        { category: 'Vigilância (Sentinel)', start: false, growth: true, strategy: true, label: 'Captura Antecipada (Distribuição)' },
        { category: 'Vigilância (Sentinel)', start: false, growth: true, strategy: true, label: 'Monitoramento de Diários' },
        { category: 'Inteligência (Scriptor)', start: false, growth: true, strategy: true, label: 'IA Generativa de Peças' },
        { category: 'Inteligência (Scriptor)', start: false, growth: true, strategy: true, label: 'Auditoria de Risco (IA)' },
        { category: 'Financeiro (Valorem)', start: true, growth: true, strategy: true, label: 'Fluxo de Caixa e PIX' },
        { category: 'Financeiro (Valorem)', start: false, growth: false, strategy: true, label: 'Provisionamento e PJe-Calc' },
        { category: 'Relacionamento (Vox)', start: 'Básico', growth: 'Completo', strategy: 'Completo', label: 'Portal do Cliente' },
        { category: 'Relacionamento (Vox)', start: false, growth: true, strategy: true, label: 'Tradução IA e WhatsApp' },
        { category: 'Estratégia (Cognitio)', start: false, growth: false, strategy: true, label: 'BI e Jurimetria Preditiva' }
    ];

    return (
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                VERITUM <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Início</Link>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <Link href="/?login=true" className="font-bold px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                            Entrar
                        </Link>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-44 pb-20 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-5xl md:text-7xl font-black mb-8 text-slate-900 dark:text-white leading-[1.05] tracking-tight">
                        Seu momento na advocacia, <br />
                        nosso <span className="text-branding-gradient">melhor plano.</span>
                    </h1>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Escolha o plano que acompanha o seu ritmo. Do autônomo ao departamento jurídico corporativo, temos a arquitetura exata para o seu crescimento.
                    </p>
                </div>
            </section>

            {/* Pricing Cards */}
            <section className="pb-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
                        {plans.map((plan, i) => (
                            <div key={i} className={`relative flex flex-col p-10 rounded-[3rem] border bg-white dark:bg-slate-950 transition-all duration-500 ${plan.color} ${plan.featured ? 'lg:-mt-4 lg:mb-4 lg:p-12 z-10' : ''}`}>
                                {plan.featured && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">
                                        Mais Popular
                                    </div>
                                )}
                                <div className="mb-10">
                                    <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest mb-4">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1 mb-6">
                                        <span className="text-5xl font-black text-slate-900 dark:text-white">{plan.price}</span>
                                        <span className="text-slate-400 font-bold">{plan.period}</span>
                                    </div>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                        {plan.desc}
                                    </p>
                                </div>
                                <div className="flex-1 space-y-4 mb-10">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex gap-3 items-start group">
                                            <div className="mt-1 bg-emerald-500/10 text-emerald-500 p-0.5 rounded-full group-hover:scale-110 transition-transform">
                                                <Check size={14} strokeWidth={4} />
                                            </div>
                                            <span className="text-slate-600 dark:text-slate-300 text-sm font-bold leading-tight">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                                <button
                                    onClick={() => {
                                        if (plan.name === 'STRATEGY') {
                                            setIsDemoModalOpen(true);
                                        } else {
                                            setIsAuthModalOpen(true);
                                        }
                                    }}
                                    className={`w-full py-5 rounded-2xl font-black text-lg transition-all ${plan.name === 'START'
                                        ? 'border-2 border-indigo-600 text-indigo-600 dark:text-indigo-400 dark:border-indigo-400 bg-transparent hover:bg-indigo-50 dark:hover:bg-indigo-900/10 shadow-none'
                                        : plan.featured
                                            ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/40 hover:bg-indigo-700 hover:scale-[1.02]'
                                            : 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    {plan.cta}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Comparison Table Toggle */}
            <section className="pb-32 px-6">
                <div className="max-w-4xl mx-auto text-center">
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-sm mb-8">Quer analisar cada detalhe técnico?</p>
                    <button
                        onClick={() => setShowComparison(!showComparison)}
                        className="inline-flex items-center gap-3 px-8 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl font-black text-slate-900 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm group"
                    >
                        {showComparison ? 'Ocultar' : 'Ver'} comparativo completo de funcionalidades
                        {showComparison ? <ChevronUp size={20} className="group-hover:-translate-y-1 transition-transform" /> : <ChevronDown size={20} className="group-hover:translate-y-1 transition-transform" />}
                    </button>

                    {showComparison && (
                        <div className="mt-16 overflow-hidden rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-3xl bg-white dark:bg-slate-900 animate-fade-in">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                        <th className="text-left p-8 text-xs font-black uppercase text-slate-400 tracking-widest">Funcionalidade</th>
                                        <th className="p-8 text-xs font-black uppercase text-slate-400 tracking-widest">Start</th>
                                        <th className="p-8 text-xs font-black uppercase text-indigo-500 tracking-widest">Growth</th>
                                        <th className="p-8 text-xs font-black uppercase text-slate-400 tracking-widest">Strategy</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {comparisonData.map((row, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                                            <td className="p-8 text-left">
                                                <div className="text-[10px] font-black uppercase text-indigo-500 mb-1 opacity-70">{row.category}</div>
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{row.label}</div>
                                            </td>
                                            <td className="p-8 text-center">
                                                {typeof row.start === 'boolean' ? (row.start ? <Check className="mx-auto text-emerald-500" strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />) : <span className="text-xs font-bold text-slate-500">{row.start}</span>}
                                            </td>
                                            <td className="p-8 text-center bg-indigo-50/30 dark:bg-indigo-500/5">
                                                {typeof row.growth === 'boolean' ? (row.growth ? <Check className="mx-auto text-indigo-500" strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />) : <span className="text-xs font-bold text-indigo-500">{row.growth}</span>}
                                            </td>
                                            <td className="p-8 text-center">
                                                {typeof row.strategy === 'boolean' ? (row.strategy ? <Check className="mx-auto text-emerald-500" strokeWidth={3} /> : <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto" />) : <span className="text-xs font-bold text-slate-500">{row.strategy}</span>}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </section>

            {/* Bundle Justification */}
            <section className="py-32 px-6 bg-slate-900 dark:bg-slate-950 rounded-[4rem] mx-6 relative overflow-hidden text-white">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-20 relative z-10">
                    <div className="flex-1 space-y-10">
                        <h2 className="text-5xl md:text-6xl font-black leading-tight tracking-tighter uppercase">
                            Por que escolher o <br />
                            <span className="text-branding-gradient">Ecossistema?</span>
                        </h2>
                        <p className="text-xl text-slate-300 leading-relaxed font-medium">
                            Ferramentas isoladas geram retrabalho. Desenhamos nossos planos para garantir o <span className="text-white italic">Flow</span> perfeito. Um módulo alimenta o outro, eliminando 100% da digitação manual de dados.
                        </p>
                    </div>
                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {[
                            { title: 'Sentinel Captura', desc: 'Identifica o processo na distribuição.' },
                            { title: 'Nexus Delega', desc: 'Cria a tarefa para sua equipe.' },
                            { title: 'Scriptor Redige', desc: 'IA gera a defesa em minutos.' },
                            { title: 'Vox Notifica', desc: 'Avisa o cliente automaticamente.' }
                        ].map((item, i) => (
                            <div key={i} className="p-6 bg-white/5 border border-white/10 rounded-3xl">
                                <h4 className="font-black mb-1 uppercase tracking-tight text-indigo-400">{item.title}</h4>
                                <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* A La Carte Modules */}
            <section className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-sm">Flexibilidade Total</span>
                        <h2 className="text-5xl font-black mt-4 text-slate-900 dark:text-white uppercase tracking-tighter">Módulos Avulsos</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium max-w-2xl mx-auto">Precisa de uma solução pontual? Você não precisa levar o ecossistema inteiro se quiser resolver apenas um desafio imediato.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                        <div className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <Radar size={32} />
                            </div>
                            <h3 className="text-3xl font-black mb-4 text-slate-900 dark:text-white tracking-tight leading-snug">Sentinel Radar</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                                Ideal para quem só precisa monitorar diários oficiais e capturar novos processos sem a gestão completa.
                            </p>
                            <Link href="/sentinel" className="flex items-center gap-2 font-black text-indigo-600 dark:text-indigo-400 hover:gap-3 transition-all uppercase tracking-widest text-sm">
                                Saiba mais <ArrowRight size={18} />
                            </Link>
                        </div>

                        <div className="p-10 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-slate-100 dark:border-slate-800 hover:bg-white dark:hover:bg-slate-900 transition-all group">
                            <div className="w-16 h-16 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                                <BarChart3 size={32} />
                            </div>
                            <h3 className="text-3xl font-black mb-4 text-slate-900 dark:text-white tracking-tight leading-snug">Cognitio Analytics</h3>
                            <p className="text-slate-500 dark:text-slate-400 font-medium mb-10 leading-relaxed">
                                Ideal para diretores que já usam outro sistema de gestão, mas precisam da nossa Jurimetria de Magistrados.
                            </p>
                            <Link href="/cognitio" className="flex items-center gap-2 font-black text-blue-600 dark:text-blue-400 hover:gap-3 transition-all uppercase tracking-widest text-sm">
                                Agendar Demo <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ */}
            <section className="py-32 px-6 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-900">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl font-black mb-20 text-center text-slate-900 dark:text-white uppercase tracking-tighter">Dúvidas Frequentes</h2>
                    <div className="space-y-6">
                        {[
                            { q: 'Preciso de cartão de crédito para o teste grátis?', a: 'Não. Acreditamos na nossa tecnologia. Você testa os planos Start ou Growth por 14 dias com acesso total, sem burocracia.' },
                            { q: 'Como funciona o limite de processos?', a: 'O sistema não cobra por "processo arquivado". Nós precificamos baseados nos seus casos ativos, garantindo que você pague apenas pelo que gera esforço real.' },
                            { q: 'Posso mudar de plano depois?', a: 'A qualquer momento. O Veritum PRO tem uma arquitetura modular. Faça upgrade ou downgrade com apenas um clique a partir das suas configurações.' }
                        ].map((faq, i) => (
                            <div key={i} className="p-8 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-sm">
                                <h4 className="font-black text-lg text-slate-900 dark:text-white mb-4 flex gap-3 text-left">
                                    <HelpCircle className="text-indigo-500 shrink-0" size={24} />
                                    {faq.q}
                                </h4>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium pl-9">
                                    {faq.a}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white leading-tight">
                        A advocacia do futuro <br />
                        <span className="text-branding-gradient">não usa planilhas.</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Junte-se ao ecossistema Veritum PRO hoje mesmo e transforme seu escritório em uma máquina de performance.
                    </p>
                    <button
                        onClick={() => setIsAuthModalOpen(true)}
                        className="bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all cursor-pointer uppercase tracking-tight"
                    >
                        Criar Minha Conta Agora
                    </button>
                    <p className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-widest italic">
                        Desenvolvido por AgTech | LegalTech de Alta Performance © 2024
                    </p>
                </div>
            </section>

            {/* Demo Modal */}
            {isDemoModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-md animate-fade-in">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[3rem] p-10 shadow-3xl border border-slate-100 dark:border-slate-800 relative overflow-hidden">
                        {demoFormStatus === 'success' ? (
                            <div className="text-center py-10 animate-scale-up">
                                <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8">
                                    <Sparkles size={40} />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase tracking-tighter">Solicitação Recebida!</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium text-lg leading-relaxed">
                                    Um de nossos consultores especializados entrará em contato via WhatsApp para confirmar o **melhor horário** na data que você sugeriu.
                                </p>
                            </div>
                        ) : (
                            <>
                                <button
                                    onClick={() => setIsDemoModalOpen(false)}
                                    className="absolute top-8 right-8 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-400"
                                >
                                    <ChevronDown className="rotate-180" size={24} />
                                </button>

                                <div className="mb-10">
                                    <div className="w-12 h-12 bg-indigo-600/10 text-indigo-600 rounded-xl flex items-center justify-center mb-6">
                                        <Briefcase size={24} />
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2">Demonstração Estratégica</h3>
                                    <p className="text-slate-500 dark:text-slate-400 font-medium">Preencha os dados abaixo para qualificar seu atendimento.</p>
                                </div>

                                <form onSubmit={handleDemoSubmit} className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Nome Completo</label>
                                        <input
                                            required
                                            type="text"
                                            placeholder="Ex: Dr. Alexandre Aguiar"
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold"
                                            value={demoFormData.name}
                                            onChange={(e) => setDemoFormData({ ...demoFormData, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">E-mail Corporativo</label>
                                            <input
                                                required
                                                type="email"
                                                placeholder="nome@escritorio.com"
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold"
                                                value={demoFormData.email}
                                                onChange={(e) => setDemoFormData({ ...demoFormData, email: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">WhatsApp</label>
                                            <input
                                                required
                                                type="tel"
                                                placeholder="(11) 99999-9999"
                                                className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold"
                                                value={demoFormData.whatsapp}
                                                onChange={(e) => setDemoFormData({ ...demoFormData, whatsapp: formatWhatsApp(e.target.value) })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pb-4">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Tamanho da Equipe / Volume</label>
                                        <select
                                            required
                                            className="w-full p-4 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all font-bold appearance-none cursor-pointer"
                                            value={demoFormData.teamSize}
                                            onChange={(e) => setDemoFormData({ ...demoFormData, teamSize: e.target.value })}
                                        >
                                            <option value="">Selecione uma opção...</option>
                                            <option value="1-5">1 a 5 advogados (Novo Escritório)</option>
                                            <option value="6-20">6 a 20 advogados (Escritório em Expansão)</option>
                                            <option value="+20">+20 advogados ou Depto. Jurídico</option>
                                        </select>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Selecione o intervalo de datas desejado</label>

                                        <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-3xl p-5">
                                            {/* Calendar Header */}
                                            <div className="flex items-center justify-between mb-6 px-2">
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                                                    disabled={isBefore(startOfMonth(subMonths(currentMonth, 1)), startOfMonth(new Date()))}
                                                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400 disabled:opacity-20"
                                                >
                                                    <ChevronLeft size={20} />
                                                </button>
                                                <h4 className="font-black uppercase tracking-widest text-sm text-slate-800 dark:text-white">
                                                    {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                                                </h4>
                                                <button
                                                    type="button"
                                                    onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                                                    className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-xl transition-all text-slate-400"
                                                >
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>

                                            {/* Calendar Grid */}
                                            <div className="grid grid-cols-7 gap-1 text-center">
                                                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
                                                    <div key={i} className="text-[10px] font-black text-slate-400 pb-2">{day}</div>
                                                ))}
                                                {(() => {
                                                    const days = [];
                                                    let day = startOfWeek(startOfMonth(currentMonth));
                                                    const lastDay = endOfWeek(endOfMonth(currentMonth));

                                                    while (day <= lastDay) {
                                                        const cloneDay = day;
                                                        const isSelected = (selectedRange.start && isSameDay(cloneDay, selectedRange.start)) ||
                                                            (selectedRange.end && isSameDay(cloneDay, selectedRange.end));
                                                        const isInRange = selectedRange.start && selectedRange.end &&
                                                            cloneDay > selectedRange.start && cloneDay < selectedRange.end;
                                                        const isToday = isSameDay(cloneDay, new Date());
                                                        const isDisabled = isBefore(startOfDay(cloneDay), startOfDay(new Date()));
                                                        const isCurrentMonth = isSameMonth(cloneDay, currentMonth);

                                                        days.push(
                                                            <button
                                                                key={day.toString()}
                                                                type="button"
                                                                disabled={isDisabled}
                                                                onClick={() => {
                                                                    if (!selectedRange.start || (selectedRange.start && selectedRange.end)) {
                                                                        setSelectedRange({ start: cloneDay, end: null });
                                                                    } else if (cloneDay < selectedRange.start) {
                                                                        setSelectedRange({ start: cloneDay, end: selectedRange.start });
                                                                    } else {
                                                                        setSelectedRange({ ...selectedRange, end: cloneDay });
                                                                    }
                                                                }}
                                                                className={`
                                                                    h-10 w-full rounded-xl flex items-center justify-center text-sm font-bold transition-all
                                                                    ${!isCurrentMonth ? 'text-slate-300 dark:text-slate-700' : 'text-slate-700 dark:text-slate-200'}
                                                                    ${isSelected ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : isInRange ? 'bg-indigo-600/10 text-indigo-600 dark:bg-indigo-600/20' : isToday ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10' : 'hover:bg-white dark:hover:bg-slate-900'}
                                                                    ${isDisabled ? 'opacity-20 cursor-not-allowed hover:bg-transparent' : 'cursor-pointer'}
                                                                `}
                                                            >
                                                                {format(cloneDay, 'd')}
                                                            </button>
                                                        );
                                                        day = addDays(day, 1);
                                                    }
                                                    return days;
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex flex-col gap-1 px-2">
                                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <Sparkles size={14} className="text-indigo-500" />
                                                Clique uma vez para o início e outra para o fim do período desejado.
                                            </p>
                                            <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-2">
                                                <ChevronRight size={14} className="text-indigo-500" />
                                                Entraremos em contato para confirmar o melhor horário dentro deste intervalo.
                                            </p>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={demoFormStatus === 'submitting' || !selectedRange.start || !selectedRange.end}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-lg hover:bg-indigo-700 hover:scale-[1.02] shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100 disabled:shadow-none mt-4"
                                    >
                                        {demoFormStatus === 'submitting' ? (
                                            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <>
                                                Confirmar Sugestão <Send size={20} />
                                            </>
                                        )}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                </div>
            )}

            <AuthModal
                isOpen={isAuthModalOpen}
                onClose={() => setIsAuthModalOpen(false)}
                mode="register"
            />
        </div>
    );
}
