'use client'

import React, { useState, useEffect } from 'react';
import {
    FileText, Sparkles, ShieldCheck, PenTool, ArrowRight,
    ChevronRight, Moon, Sun, Scale, BarChart3,
    Search, Lock, History, Download, Zap, MousePointer2,
    CheckCircle2, AlertTriangle, Cloud
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth-modal';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <PenTool className="h-6 w-6" />
    </div>
);

export default function ScriptorLanding() {
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
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                SCRIPTOR <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#vision" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Visão</a>
                        <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Funcionalidades</a>
                        <a href="#ux" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Diferencial</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <Link href="/?login=true" className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all">
                            Entrar
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
                            <Sparkles size={14} className="animate-pulse" /> IA Documental Generativa
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-slate-900 dark:text-white">
                            A inteligência que <br />
                            <span className="text-branding-gradient">redige, revisa</span> e <br />
                            protege.
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
                            O fim da "Síndrome da Página em Branco". Transforme horas de redação e revisão em minutos com seu co-piloto jurídico alimentado por IA.
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
                        {/* Editor Mockup - Minimalist 'Notion-like' visual */}
                        <div className="relative z-10 bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] p-4 border border-slate-200 dark:border-slate-800 shadow-3xl transform -rotate-1 hover:rotate-0 transition-transform duration-500">
                            <div className="bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] flex flex-col">
                                <div className="h-12 border-b border-slate-50 dark:border-slate-900 flex items-center px-6 justify-between">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                        <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    </div>
                                    <div className="text-[10px] font-black tracking-widest text-slate-300 uppercase">Scriptor PRO Editor</div>
                                    <div className="w-3" />
                                </div>
                                <div className="p-10 flex-1 bg-white dark:bg-slate-950 space-y-6">
                                    <div className="h-8 w-1/3 bg-slate-100 dark:bg-slate-900 rounded-lg mb-8" />
                                    <div className="space-y-4">
                                        <div className="h-3 w-full bg-slate-50 dark:bg-slate-900 rounded" />
                                        <div className="h-3 w-[90%] bg-slate-50 dark:bg-slate-900 rounded" />
                                        <div className="h-3 w-4/5 bg-slate-50 dark:bg-slate-900 rounded" />
                                    </div>
                                    {/* IA suggestion box */}
                                    <div className="bg-indigo-600/5 dark:bg-indigo-500/10 border border-indigo-600/20 rounded-2xl p-6 relative group">
                                        <div className="flex items-center gap-2 mb-3">
                                            <Sparkles size={14} className="text-indigo-600 animate-pulse" />
                                            <span className="text-[10px] font-black uppercase text-indigo-600 tracking-wider">IA Co-piloto sugerindo...</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="h-3 w-full bg-indigo-600/10 rounded animate-pulse" />
                                            <div className="h-3 w-2/3 bg-indigo-600/10 rounded animate-pulse" />
                                        </div>
                                        <div className="absolute -right-4 -bottom-4 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1.5 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                                            TAB p/ Aceitar
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background blobs */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full" />
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
                                { label: 'Tempo de Redação', val: '-80%', color: 'text-indigo-600', icon: Zap },
                                { label: 'Cláusulas Abusivas', val: '142', color: 'text-rose-500', icon: AlertTriangle },
                                { label: 'Assinaturas Hoje', val: '15', color: 'text-emerald-500', icon: CheckCircle2 },
                                { label: 'Pesquisa Global', val: 'ms', color: 'text-slate-500', icon: Search }
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
                                Mais do que um editor. <br />
                                Uma <span className="text-branding-gradient">mente jurídica</span> ao seu lado.
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                O Scriptor PRO não substitui a sua estratégia, ele a potencializa. Desenvolvemos um ecossistema documental inteligente que lê, compreende o contexto e sugere as melhores práticas jurídicas.
                            </p>
                            <p className="text-lg text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                Concentre sua energia no intelecto da tese, enquanto nossos algoritmos cuidam da formatação, da revisão e da caça aos riscos ocultos.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dobra 3: Funcionalidades */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-sm">Tecnologia Documental</span>
                        <h2 className="text-5xl font-black mt-4 text-slate-900 dark:text-white uppercase tracking-tighter">Funcionalidades de Elite</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">Ferramentas criadas para bancas e departamentos que exigem produtividade máxima.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            {
                                title: 'Gerador de Peças e Contratos (IA)',
                                desc: 'Acelere a sua produção. Nossa IA analisa o contexto do seu caso e redige minutas, contestações e contratos automaticamente.',
                                icon: Sparkles,
                                color: 'bg-indigo-500/10 text-indigo-500'
                            },
                            {
                                title: 'Auditoria de Risco em Contratos (IA)',
                                desc: 'Nunca mais deixe uma "pegadinha" passar despercebida. Identifique instantaneamente cláusulas abusivas e pontos de atenção.',
                                icon: ShieldCheck,
                                color: 'bg-rose-500/10 text-rose-500'
                            },
                            {
                                title: 'Repositório Inteligente (GED)',
                                desc: 'O fim das pastas perdidas. Armazene modelos e arquivos em um cofre digital seguro com total conformidade com a LGPD.',
                                icon: Cloud,
                                color: 'bg-emerald-500/10 text-emerald-500'
                            },
                            {
                                title: 'Assinatura Digital Nativa',
                                desc: 'Feche negócios sem plataformas terceiras. Envie documentos para assinatura pelo celular com validade jurídica garantida.',
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
                            Seu ambiente de <br />
                            <span className="text-branding-gradient">foco absoluto.</span>
                        </h2>
                        <p className="text-xl text-slate-300 leading-relaxed font-medium">
                            A tecnologia só é boa quando não atrapalha. Projetamos o SCRIPTOR PRO com um design minimalista para proteger a sua concentração. Mantenha-se no Flow do início ao fim da sua redação.
                        </p>
                        <div className="space-y-6">
                            {[
                                { title: 'IA Contextual', desc: 'Ela sugere, você aprova. O controle é sempre seu.', icon: Sparkles },
                                { title: 'Versionamento Seguro', desc: 'Restaure versões anteriores com um clique.', icon: History },
                                { title: 'Busca Global', desc: 'Encontre palavras em milhares de PDFs em milissegundos.', icon: Search }
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
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 to-violet-600/20 blur-3xl opacity-50"></div>
                        <div className="relative z-10 w-full h-full border border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col justify-center gap-8">
                            <div className="space-y-4">
                                <div className="h-6 w-3/4 bg-white/10 rounded-full" />
                                <div className="h-2 w-full bg-white/5 rounded-full" />
                                <div className="h-2 w-[90%] bg-white/5 rounded-full" />
                            </div>
                            <div className="p-6 bg-white/10 rounded-3xl border border-white/20 animate-pulse">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center"><Zap size={18} className="text-indigo-400" /></div>
                                    <div className="h-4 w-32 bg-white/20 rounded-full" />
                                </div>
                                <div className="space-y-2">
                                    <div className="h-2 w-full bg-white/10 rounded-full" />
                                    <div className="h-2 w-2/3 bg-white/10 rounded-full" />
                                </div>
                            </div>
                            <div className="flex justify-between items-center px-4">
                                <div className="flex -space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600" />
                                    <div className="w-8 h-8 rounded-full bg-slate-600 border border-slate-500" />
                                </div>
                                <div className="h-8 w-24 bg-emerald-500/20 rounded-xl border border-emerald-500/30 flex items-center justify-center">
                                    <span className="text-[10px] font-black text-emerald-400 uppercase">Seguro</span>
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
                        Pronto para multiplicar a sua <span className="text-branding-gradient">capacidade de produção?</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Seja operando sozinho como um Super ChatGPT Jurídico ou integrado perfeitamente ao Ecossistema Veritum, o Scriptor PRO é a vantagem injusta do seu escritório.
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
                        Sem cartão de crédito • Configuração rápida
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
                                    SCRIPTOR <span className="text-branding-gradient">PRO</span>
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs text-center md:text-left">
                                A tecnologia de quem advoga no estado da arte.
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
