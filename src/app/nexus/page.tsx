'use client'

import React, { useState, useEffect } from 'react';
import {
    LayoutDashboard, CheckCircle2, Clock, Users, ArrowRight,
    ChevronRight, Moon, Sun, ShieldCheck, Scale, BarChart3,
    Kanban, Workflow, Building2, FileText, Zap, MousePointer2, LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth-modal';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <LayoutDashboard className="h-6 w-6" />
    </div>
);

export default function NexusLanding() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
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
                                NEXUS <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="text-base font-bold text-branding-gradient hover:opacity-80 transition-all">Portal</Link>
                        <a href="#top" className="text-sm font-bold text-slate-800 dark:text-white">Início</a>
                        <a href="#vision" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Visão</a>
                        <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Funcionalidades</a>
                        <a href="#ux" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Diferencial</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <Link href="/?login=true" className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                            <LogOut size={18} /> Entrar
                        </Link>
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all text-sm"
                        >
                            Teste Grátis
                        </button>
                    </div>
                </div>
            </nav>

            {/* Dobra 1: Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
                            <Zap size={14} className="animate-pulse" /> Gestão de Alta Performance
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-slate-900 dark:text-white">
                            A central de <br />
                            <span className="text-branding-gradient">comando</span> do seu <br />
                            escritório.
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
                            Onde o caos se transforma em clareza. Centralize processos, prazos e equipe em um único painel inteligente. O Nexus PRO elimina planilhas e automatiza a sua rotina.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                Começar Teste Grátis <ArrowRight size={20} />
                            </button>
                            <a href="#vision" className="w-full sm:w-auto px-10 py-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-slate-600 dark:text-slate-300">
                                Saiba mais
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {/* Kanban & Dashboard Mockup */}
                        <div className="relative z-10 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] p-4 border border-slate-200 dark:border-slate-800 shadow-3xl">
                            <div className="bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] flex flex-col">
                                <div className="h-12 border-b border-slate-100 dark:border-slate-900 flex items-center px-6 justify-between bg-white dark:bg-slate-950">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    </div>
                                    <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Nexus PRO Kanban</div>
                                    <div className="w-3" />
                                </div>
                                <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-900/30 overflow-hidden">
                                    <div className="grid grid-cols-3 gap-4 h-full">
                                        {/* Column 1: A Fazer */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-2 mb-4">
                                                <span className="text-[10px] font-black uppercase text-slate-400">A Fazer (12)</span>
                                                <div className="w-4 h-4 rounded-full bg-indigo-600/10 flex items-center justify-center text-indigo-600 text-[8px] font-bold">+</div>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                                                <div className="h-2 w-16 bg-rose-500/20 rounded" />
                                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                                <div className="h-1.5 w-1/2 bg-slate-100 dark:bg-slate-800 rounded" />
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                                                <div className="h-2 w-12 bg-amber-500/20 rounded" />
                                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                            </div>
                                        </div>
                                        {/* Column 2: Em Andamento */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-2 mb-4">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Em Andamento (5)</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm border-l-4 border-l-indigo-500 space-y-2">
                                                <div className="h-2 w-20 bg-indigo-500/20 rounded" />
                                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                                <div className="flex gap-1">
                                                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                    <div className="w-4 h-4 rounded-full bg-slate-200 dark:bg-slate-800" />
                                                </div>
                                            </div>
                                        </div>
                                        {/* Column 3: Concluído */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between px-2 mb-4">
                                                <span className="text-[10px] font-black uppercase text-slate-400">Concluído (84)</span>
                                            </div>
                                            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm opacity-60 space-y-2">
                                                <div className="h-2 w-10 bg-emerald-500/20 rounded" />
                                                <div className="h-3 w-full bg-slate-100 dark:bg-slate-800 rounded line-through" />
                                            </div>
                                        </div>
                                    </div>
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

            {/* Dobra 2: SEÇÃO DE IMPACTO / COCKPIT VISUAL */}
            <section id="vision" className="py-32 px-6 bg-slate-50 dark:bg-slate-950/40 border-y border-slate-100 dark:border-slate-900 transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {[
                                { label: 'Prazos Hoje', val: '12', color: 'text-rose-500', icon: Clock },
                                { label: 'Tarefas Concluídas', val: '84', color: 'text-emerald-500', icon: CheckCircle2 },
                                { label: 'Produtividade', val: '+35%', color: 'text-indigo-500', icon: BarChart3 },
                                { label: 'Colaboradores', val: '18', color: 'text-slate-500', icon: Users }
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
                        <div className="flex-1 space-y-8">
                            <h2 className="text-4xl md:text-5xl font-black leading-tight tracking-tighter text-slate-900 dark:text-white uppercase">
                                Gestão que acompanha o seu <span className="text-branding-gradient">ritmo.</span>
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                O Nexus PRO é o coração operacional do ecossistema Veritum. Desenhado para reduzir a carga cognitiva da sua equipe, ele reúne todas as pontas soltas da advocacia em um fluxo de trabalho claro e intuitivo.
                            </p>
                            <div className="p-6 bg-indigo-600/5 rounded-2xl border border-indigo-600/10 italic text-indigo-600 dark:text-indigo-400 font-bold">
                                "Saiba exatamente quem está fazendo o quê, em qual prazo e com qual prioridade."
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dobra 3: Funcionalidades */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-sm">Tecnologia Operacional</span>
                        <h2 className="text-5xl font-black mt-4 text-slate-900 dark:text-white uppercase tracking-tighter">Funcionalidades de Alto Nível</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">Ferramentas criadas para escritórios que não têm tempo a perder.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            {
                                title: 'Gestão de Processos e Prazos (Kanban)',
                                desc: 'Transforme a ansiedade em controle. Acompanhe processos, audiências e tarefas em um mural Kanban totalmente visual.',
                                icon: Kanban,
                                color: 'bg-rose-500/10 text-rose-500'
                            },
                            {
                                title: 'Workflows Avançados e Automação',
                                desc: 'Delegue no piloto automático. Crie fluxos de trabalho inteligentes que distribuem tarefas para a sua equipe automaticamente.',
                                icon: Workflow,
                                color: 'bg-indigo-500/10 text-indigo-500'
                            },
                            {
                                title: 'Gestão de Ativos e Bens em Litígio',
                                desc: 'Tenha o mapa completo da execução. Controle certidões, matrículas, frotas e imóveis atrelados a processos jurídicos.',
                                icon: Building2,
                                color: 'bg-emerald-500/10 text-emerald-500'
                            },
                            {
                                title: 'Controle Societário e Ciclo de Vida',
                                desc: 'Domine o consultivo corporativo. Gerencie contratos não-financeiros, procurações e atos societários com alertas automáticos.',
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
                                    Saiba mais <ChevronRight size={16} />
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
                            Design pensado para o seu <br />
                            <span className="text-branding-gradient">Flow de trabalho.</span>
                        </h2>
                        <p className="text-xl text-slate-300 leading-relaxed font-medium">
                            Diga adeus aos sistemas travados e difíceis de aprender. O Nexus PRO foi criado sob rigorosos princípios de design centrado no usuário. Menos cliques, zero distrações e foco total no que importa.
                        </p>
                        <div className="flex flex-col gap-6">
                            <div className="flex gap-4 items-start p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                <MousePointer2 className="text-emerald-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-black text-lg mb-1 uppercase tracking-tight">Divulgação Progressiva</h4>
                                    <p className="text-slate-400 text-sm font-medium">Você visualiza o painel macro e acessa os detalhes apenas quando precisa.</p>
                                </div>
                            </div>
                            <div className="flex gap-4 items-start p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                <ShieldCheck className="text-indigo-400 shrink-0 mt-1" />
                                <div>
                                    <h4 className="font-black text-lg mb-1 uppercase tracking-tight">Interface Sem Ruído</h4>
                                    <p className="text-slate-400 text-sm font-medium">Elimine ferramentas complexas que atrasam sua equipe. O foco é seu aliado.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 relative aspect-square lg:aspect-auto h-full min-h-[500px]">
                        {/* Large decorative mockup or visual element here */}
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-emerald-600/20 blur-3xl opacity-50"></div>
                        <div className="relative z-10 w-full h-full border border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col justify-center">
                            <div className="space-y-6">
                                <div className="h-4 w-48 bg-white/20 rounded-full" />
                                <div className="h-1 bg-white/10 w-full rounded-full" />
                                <div className="grid grid-cols-2 gap-6 pt-6">
                                    <div className="h-32 bg-white/10 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><CheckCircle2 size={24} /></div>
                                        <span className="text-xs font-black uppercase text-slate-400">Eficiência</span>
                                    </div>
                                    <div className="h-32 bg-white/10 rounded-3xl border border-white/10 flex flex-col items-center justify-center gap-2">
                                        <div className="w-10 h-10 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center"><Zap size={24} /></div>
                                        <span className="text-xs font-black uppercase text-slate-400">Automação</span>
                                    </div>
                                </div>
                                <div className="h-1 bg-white/10 w-full rounded-full" />
                                <div className="h-4 w-32 bg-white/20 rounded-full ml-auto" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-tr from-indigo-500/5 to-emerald-500/5"></div>
            </section>

            {/* Footer / CTA Final */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white leading-tight">
                        Pronto para revolucionar a sua <span className="text-branding-gradient">gestão jurídica?</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        O Nexus PRO é a base sólida da sua operação e se conecta de forma nativa às outras inteligências do Ecossistema Veritum.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all cursor-pointer"
                        >
                            Começar Agora - É Grátis
                        </button>
                        <Link
                            href="/pricing"
                            className="w-full sm:w-auto px-12 py-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Ver Planos de Assinatura
                        </Link>
                    </div>
                    <p className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-widest">
                        Sem cartão de crédito • Configuração em 2 minutos
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
                                    NEXUS <span className="text-branding-gradient">PRO</span>
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs text-center md:text-left">
                                A central de comando de quem advoga com estratégia.
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale size={24} className="text-indigo-600" />
                                <span className="text-lg font-black dark:text-white text-slate-900 uppercase">VERITUM <span className="text-branding-gradient">PRO</span></span>
                            </div>
                            <p className="text-sm text-slate-400 dark:text-slate-500 font-medium italic max-w-sm">
                                Desenvolvido por AgTech | LegalTech de Alta Performance © 2024 Todos os direitos reservados.
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
        </div>
    );
}
