'use client'

import React, { useState, useEffect } from 'react';
import {
    ShieldAlert, Bell, Search, ArrowRight, Check,
    Zap, Clock, Target, Globe, Moon, Sun, Scale,
    LogIn, UserPlus, ChevronRight, Menu, X, BarChart3,
    Eye, ShieldCheck, ZapOff, Sparkles
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { AuthModal } from '@/components/auth-modal';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <ShieldAlert className="h-6 w-6" />
    </div>
);

export default function SentinelLanding() {
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
                                SENTINEL <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors">Início</Link>
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
                            <Sparkles size={14} className="animate-pulse" /> Inteligência Jurídica Ativa
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-slate-900 dark:text-white">
                            Aja antes da <br />
                            <span className="text-branding-gradient">citação oficial.</span> <br />
                            O radar definitivo.
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed">
                            Monitore publicações, intimações e descubra novos processos no momento da distribuição. O Sentinel PRO varre o Brasil inteiro para que você nunca mais tenha medo de perder um prazo ou sofrer uma revelia.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"
                            >
                                Começar Teste Grátis <ArrowRight size={20} />
                            </button>
                            <a href="#pricing" onClick={(e) => { e.preventDefault(); router.push('/#pricing'); }} className="w-full sm:w-auto px-10 py-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-slate-600 dark:text-slate-300">
                                Conhecer Planos
                            </a>
                        </div>
                        <p className="mt-8 text-sm font-bold text-slate-400 dark:text-slate-500 flex items-center gap-2">
                            <Check size={16} className="text-emerald-500" /> Junte-se a advogados que deixaram de buscar processos manualmente.
                        </p>
                    </div>

                    <div className="flex-1 relative">
                        <div className="relative z-10 bg-slate-100 dark:bg-slate-900 rounded-[2.5rem] p-4 border border-slate-200 dark:border-slate-800 shadow-3xl transform rotate-2 hover:rotate-0 transition-transform duration-500">
                            {/* Dashboard Mockup - Focal point with Red Badge */}
                            <div className="bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] flex flex-col relative group">
                                <div className="h-12 border-b border-slate-100 dark:border-slate-900 flex items-center px-6 justify-between">
                                    <div className="flex gap-1.5">
                                        <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500" />
                                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500" />
                                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500" />
                                    </div>
                                    <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Sentinel PRO Cockpit</div>
                                    <div className="w-3" />
                                </div>
                                <div className="p-8 flex-1 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <div className="h-6 w-32 bg-slate-100 dark:bg-slate-800 rounded-lg" />
                                        <div className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-full animate-pulse">
                                            12 ALERTAS DE CRISE
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="h-28 bg-indigo-600/5 rounded-2xl border border-indigo-600/10 p-4 flex flex-col justify-end">
                                            <div className="text-[10px] font-bold text-indigo-600 mb-1">INTIMAÇÕES HOJE</div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white">42</div>
                                        </div>
                                        <div className="h-28 bg-emerald-600/5 rounded-2xl border border-emerald-600/10 p-4 flex flex-col justify-end">
                                            <div className="text-[10px] font-bold text-emerald-600 mb-1">TEMPO SALVO</div>
                                            <div className="text-3xl font-black text-slate-800 dark:text-white">18h</div>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-14 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center px-4 gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500"><ShieldAlert size={18} /></div>
                                            <div className="flex-1 space-y-1">
                                                <div className="h-2 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                            </div>
                                        </div>
                                        <div className="h-14 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center px-4 gap-4">
                                            <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-500"><Bell size={18} /></div>
                                            <div className="flex-1 space-y-1">
                                                <div className="h-2 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800 rounded" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 bg-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            </div>
                        </div>
                        {/* Decorative elements */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                    </div>
                </div>

                {/* Background blobs */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-400/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-400/5 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Dobra 2: A Visão Geral */}
            <section id="vision" className="py-32 px-6 bg-slate-50 dark:bg-slate-950/40 transition-colors relative overflow-hidden">
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-8 text-slate-900 dark:text-white uppercase tracking-tighter">
                        O seu "Cockpit" de <span className="text-branding-gradient">Vigilância Jurídica.</span>
                    </h2>
                    <p className="text-xl md:text-2xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                        O Sentinel PRO não é apenas um buscador, é o sensor de riscos do ecossistema Veritum. Processamos milhares de publicações e movimentações processuais por dia, filtrando o ruído e entregando apenas o que é estritamente relevante para você e seus clientes.
                    </p>
                    <div className="mt-12 p-8 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-xl border border-slate-100 dark:border-slate-800 text-lg text-slate-600 dark:text-slate-300">
                        Com um painel visual limpo e inteligente, agrupamos as informações para que você saiba exatamente onde sua atenção é necessária hoje, reduzindo a fadiga de olhar para dezenas de telas.
                    </div>
                </div>
            </section>

            {/* Dobra 3: As Funcionalidades */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20">
                        <span className="text-indigo-600 dark:text-indigo-400 font-black tracking-[0.2em] uppercase text-sm">Tecnologia Proativa</span>
                        <h2 className="text-5xl font-black mt-4 text-slate-900 dark:text-white uppercase tracking-tighter">Funcionalidades Sugeridas</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {/* Card 1 */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start bg-slate-50/50 dark:bg-slate-900/30 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 group hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 bg-rose-500/10 rounded-[1.25rem] flex items-center justify-center text-rose-500 group-hover:scale-110 transition-transform">
                                <Search size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">Antecipe-se à Revelia</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Não espere o oficial de justiça bater à porta. Nossos robôs detectam novas ações no exato momento do peticionamento (distribuição). Receba alertas de processos até 30 dias antes da citação oficial.
                                </p>
                            </div>
                        </div>

                        {/* Card 2 */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start bg-slate-50/50 dark:bg-slate-900/30 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 group hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 bg-indigo-500/10 rounded-[1.25rem] flex items-center justify-center text-indigo-500 group-hover:scale-110 transition-transform">
                                <Bell size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">Zero Prazos Perdidos</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Esqueça a busca manual. O Sentinel PRO varre automaticamente os Diários Oficiais, DJEN e os tribunais do país. Receba alertas inteligentes de intimações e movimentações em tempo real.
                                </p>
                            </div>
                        </div>

                        {/* Card 3 */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start bg-slate-50/50 dark:bg-slate-900/30 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 group hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 bg-emerald-500/10 rounded-[1.25rem] flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <Globe size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">Proteja a Reputação do Cliente</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    A vigilância vai além dos tribunais. Monitore marcas em jornais, portais de notícias e órgãos de defesa do consumidor (Procon, Consumidor.gov). Atue como um escudo corporativo proativo.
                                </p>
                            </div>
                        </div>

                        {/* Card 4 */}
                        <div className="flex flex-col lg:flex-row gap-8 items-start bg-slate-50/50 dark:bg-slate-900/30 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 group hover:bg-white dark:hover:bg-slate-900 transition-all duration-300">
                            <div className="w-16 h-16 shrink-0 bg-violet-500/10 rounded-[1.25rem] flex items-center justify-center text-violet-500 group-hover:scale-110 transition-transform">
                                <BarChart3 size={32} />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-2xl font-black mb-3 text-slate-900 dark:text-white tracking-tight">Inteligência que lê por você</h3>
                                <p className="text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    Nossa IA lê publicações e classifica o conteúdo instantaneamente. indicadores visuais (como vermelho para Risco Alto) ajudam você a priorizar urgências em um segundo.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dobra 4: Por que o Sentinel PRO é diferente? */}
            <section id="ux" className="py-32 px-6 bg-slate-900 dark:bg-slate-900/80 text-white rounded-[4rem] mx-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1 space-y-8">
                        <h2 className="text-5xl font-black tracking-tighter uppercase leading-tight">
                            Uma interface que <br />
                            <span className="text-branding-gradient">pensa como um advogado.</span>
                        </h2>
                        <p className="text-xl text-slate-300 leading-relaxed font-medium">
                            Ferramentas complexas atrasam o seu trabalho. Projetamos o Sentinel PRO para garantir foco total. Sem "muralhas de dados", você visualiza gráficos limpos, navegação intuitiva e alertas codificados por cores que evitam erros.
                        </p>
                        <ul className="space-y-4">
                            {[
                                "Foco total: Menos cliques, mais resultados.",
                                "Alertas por cores: Priorização instantânea.",
                                "Resumos por IA: Deixe a leitura densa para nós.",
                                "Ação rápida: Transforme alertas em tarefas com um clique."
                            ].map((text, i) => (
                                <li key={i} className="flex items-center gap-3 font-bold text-slate-200">
                                    <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 border border-emerald-500/30">
                                        <Check size={14} />
                                    </div>
                                    {text}
                                </li>
                            ))}
                        </ul>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <div className="aspect-square bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex flex-col justify-center items-center text-center gap-4 hover:bg-white/10 transition-colors">
                            <Eye size={40} className="text-indigo-400" />
                            <span className="font-bold text-sm">Visão 360º</span>
                        </div>
                        <div className="aspect-square bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex flex-col justify-center items-center text-center gap-4 hover:bg-white/10 transition-colors">
                            <ShieldCheck size={40} className="text-emerald-400" />
                            <span className="font-bold text-sm">Segurança Total</span>
                        </div>
                        <div className="aspect-square bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex flex-col justify-center items-center text-center gap-4 hover:bg-white/10 transition-colors">
                            <Zap size={40} className="text-amber-400" />
                            <span className="font-bold text-sm">Ação Instantânea</span>
                        </div>
                        <div className="aspect-square bg-white/5 backdrop-blur-md rounded-3xl border border-white/10 p-6 flex flex-col justify-center items-center text-center gap-4 hover:bg-white/10 transition-colors">
                            <ZapOff size={40} className="text-rose-400" />
                            <span className="font-bold text-sm">Fim do Stress</span>
                        </div>
                    </div>
                </div>
                {/* Decorative background */}
                <div className="absolute top-0 right-0 w-full h-full bg-gradient-to-br from-indigo-600/20 to-transparent"></div>
            </section>

            {/* Final CTA */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white leading-tight">
                        Pronto para nunca mais se preocupar com <span className="text-branding-gradient">Publicações?</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed">
                        O Sentinel PRO é brilhante sozinho, mas é imbatível no Ecossistema Veritum. Junte-se a centenas de escritórios que elevaram sua segurança operacional.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="w-full sm:w-auto bg-indigo-600 text-white px-12 py-5 rounded-[2rem] font-bold text-xl shadow-2xl shadow-indigo-600/40 hover:scale-105 hover:bg-indigo-700 transition-all cursor-pointer"
                        >
                            Começar Agora - É Grátis
                        </button>
                        <Link
                            href="/pricing"
                            className="w-full sm:w-auto px-12 py-5 rounded-[2rem] border border-slate-200 dark:border-slate-800 font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all"
                        >
                            Ver Planos de Assinatura
                        </Link>
                    </div>
                    <p className="mt-8 text-sm text-slate-400 font-bold uppercase tracking-widest">
                        Sem cartão de crédito • Configuração rápida
                    </p>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-20 border-t border-slate-100 dark:border-slate-900 bg-slate-50/30 dark:bg-slate-950/30">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-12">
                        <div className="flex flex-col items-center md:items-start gap-4">
                            <div className="flex items-center gap-2">
                                <Logo />
                                <span className="text-2xl font-black tracking-tighter dark:text-white text-slate-900 uppercase">
                                    SENTINEL <span className="text-branding-gradient">PRO</span>
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs text-center md:text-left">
                                O radar proativo de quem não aceita o risco da revelia.
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale size={24} className="text-indigo-600" />
                                <span className="text-lg font-black dark:text-white text-slate-900">VERITUM <span className="text-branding-gradient">PRO</span></span>
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
