'use client'

import React, { useState, useEffect } from 'react';
import {
    BarChart3, Brain, Scale, Building2, ArrowRight,
    ChevronRight, Moon, Sun, PieChart, TrendingUp,
    ShieldCheck, Target, Zap, MousePointer2,
    FileText, Presentation, LayoutDashboard, Search
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth-modal';

const Logo = () => (
    <div className="bg-blue-600/10 p-2 rounded-lg flex items-center justify-center text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
        <BarChart3 className="h-6 w-6" />
    </div>
);

export default function CognitioLanding() {
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
        <div className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-blue-100 selection:text-blue-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                COGNITIO <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <a href="#vision" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">Visão</a>
                        <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">Funcionalidades</a>
                        <a href="#ux" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-blue-600 transition-colors">Diferencial</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <Link href="/?login=true" className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-all">
                            Entrar
                        </Link>
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-blue-600/20 hover:scale-105 transition-all text-sm"
                        >
                            Agendar Demonstração
                        </button>
                    </div>
                </div>
            </nav>

            {/* Dobra 1: Hero Section */}
            <section className="relative pt-44 pb-32 px-6 overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1 text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
                            <Target size={14} className="animate-pulse" /> Inteligência Jurídica Preditiva
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-slate-900 dark:text-white">
                            O olhar estratégico <br />
                            que a sua <span className="text-branding-gradient">diretoria exige.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
                            Advocacia guiada por dados. Transforme dados complexos em previsibilidade financeira e decisões de alto impacto para seu departamento ou banca.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full sm:w-auto bg-blue-600 text-white px-10 py-4 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-blue-600/40 hover:scale-105 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 uppercase tracking-tight"
                            >
                                Agendar Demonstração <ArrowRight size={20} />
                            </button>
                            <a href="#vision" className="w-full sm:w-auto px-10 py-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-slate-600 dark:text-slate-300">
                                Saiba mais
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {/* Executive Dashboard Mockup */}
                        <div className="relative z-10">
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-[3rem] p-5 shadow-3xl border border-slate-200 dark:border-slate-800 transform rotate-1">
                                <div className="bg-white dark:bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] flex flex-col p-8">
                                    <div className="grid grid-cols-3 gap-4 mb-8">
                                        {[
                                            { label: 'KPI Global', val: '94.2%', sub: '+3.1%', color: 'text-emerald-500' },
                                            { label: 'Risco Ativo', val: 'R$ 12M', sub: '-12%', color: 'text-rose-500' },
                                            { label: 'Sentenças', val: '1.2k', sub: 'Hoje', color: 'text-blue-500' }
                                        ].map((kpi, i) => (
                                            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                                <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">{kpi.label}</div>
                                                <div className="text-xl font-black text-slate-900 dark:text-white">{kpi.val}</div>
                                                <div className={`text-[10px] font-bold ${kpi.color}`}>{kpi.sub}</div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análise de Êxito por Tribunal</div>
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 rounded-full bg-blue-500" />
                                                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            {[85, 62, 91, 44].map((w, i) => (
                                                <div key={i} className="space-y-1">
                                                    <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                                        <span>TRT-0{i + 1}</span>
                                                        <span>{w}%</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                                        <div className="h-full bg-branding-gradient rounded-full" style={{ width: `${w}%` }} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background blobs */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-blue-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                    </div>
                </div>

                {/* Animated Background Elements */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-blue-400/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-400/5 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Dobra 2: SEÇÃO DE IMPACTO / DASHBOARD VISUAL */}
            <section id="vision" className="py-32 px-6 bg-slate-50 dark:bg-slate-950/40 border-y border-slate-100 dark:border-slate-900 transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {[
                                { label: 'Taxa de Êxito', val: '72%', color: 'text-emerald-500', icon: Target },
                                { label: 'Risco Mitigado', val: 'R$ 8.5M', color: 'text-blue-600', icon: ShieldCheck },
                                { label: 'Tempo Médio', val: '14 Meses', color: 'text-indigo-500', icon: Zap },
                                { label: 'Previsibilidade', val: 'Alta', color: 'text-blue-500', icon: Brain }
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
                                Pare de advogar no escuro. <br />
                                A intuição cede <span className="text-branding-gradient">lugar à precisão.</span>
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                Grandes bancas e departamentos jurídicos corporativos não podem depender de "achismos". O Cognitio PRO lê o histórico de milhares de decisões para que você saiba quando é mais vantajoso um acordo ou o litígio.
                            </p>
                            <div className="p-6 bg-blue-600/5 rounded-2xl border border-blue-600/10 italic text-blue-600 dark:text-blue-400 font-bold">
                                "Tenha o raio-x completo da sua operação na palma da mão e preste contas à diretoria com segurança absoluta."
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dobra 3: Funcionalidades */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-blue-600 dark:text-blue-400 font-black tracking-[0.2em] uppercase text-sm">Tecnologia Analítica</span>
                        <h2 className="text-5xl font-black mt-4 text-slate-900 dark:text-white uppercase tracking-tighter">Funcionalidades de Elite</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">Ferramentas criadas para sócios e diretores que precisam de respostas rápidas e exatas.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            {
                                title: 'Dashboards e BI Jurídico',
                                desc: 'Visualize a performance de toda a operação em painéis interativos. Identifique gargalos e métricas de produtividade em tempo real.',
                                icon: LayoutDashboard,
                                color: 'bg-blue-500/10 text-blue-500'
                            },
                            {
                                title: 'Análise Preditiva de Desfechos (IA)',
                                desc: 'Nossa IA cruza dados de jurisprudência e histórico processual para calcular a probabilidade de ganho antes mesmo do protocolo.',
                                icon: Brain,
                                color: 'bg-emerald-500/10 text-emerald-500'
                            },
                            {
                                title: 'Raio-X de Magistrados e Comarcas',
                                desc: 'Conheça a mente de quem vai julgar. Relatórios detalhados sobre como cada tribunal costuma decidir em temas específicos.',
                                icon: Scale,
                                color: 'bg-indigo-500/10 text-indigo-500'
                            },
                            {
                                title: 'Visão Corporativa e Provisionamento',
                                desc: 'Acompanhe custos por filial ou projeto. Descubra quais setores enfrentam maior litigiosidade e atue preventivamente.',
                                icon: Building2,
                                color: 'bg-slate-500/10 text-slate-500'
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
                                <button className="text-sm font-bold text-blue-600 dark:text-blue-400 flex items-center gap-2 hover:gap-3 transition-all">
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
                            O fim da <br />
                            <span className="text-branding-gradient">"Parede de Números".</span>
                        </h2>
                        <p className="text-xl text-slate-300 leading-relaxed font-medium">
                            Executivos não têm tempo para decifrar planilhas. Projetamos o Cognitio PRO com as melhores práticas de visualização para decisões rápidas.
                        </p>
                        <div className="space-y-6">
                            {[
                                { title: 'Divulgação Progressiva', desc: 'Cenário macro limpo com possibilidade de aprofundamento total em um clique.', icon: MousePointer2 },
                                { title: 'Destaque de Tendências', desc: 'Gráficos codificados por cores que indicam riscos e oportunidades instantaneamente.', icon: TrendingUp },
                                { title: 'Exportação Executiva', desc: 'Gere relatórios visuais perfeitos para apresentações em segundos.', icon: Presentation }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <item.icon className="text-blue-400 shrink-0 mt-1" size={24} />
                                    <div>
                                        <h4 className="font-black text-lg mb-1 uppercase tracking-tight">{item.title}</h4>
                                        <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative aspect-square lg:aspect-auto h-full min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-emerald-600/20 blur-3xl opacity-50"></div>
                        <div className="relative z-10 w-full h-full border border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col justify-center gap-8">
                            <div className="space-y-6">
                                <div className="flex justify-between items-center">
                                    <div className="h-4 w-32 bg-white/20 rounded-full" />
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20" />
                                        <div className="w-8 h-8 rounded-lg bg-blue-500/20" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="h-32 bg-white/10 rounded-2xl border border-white/10 animate-pulse" />
                                    <div className="h-32 bg-white/10 rounded-2xl border border-white/10 animate-pulse" style={{ animationDelay: '0.5s' }} />
                                </div>
                                <div className="space-y-3">
                                    <div className="h-2 w-full bg-white/10 rounded-full" />
                                    <div className="h-2 w-full bg-white/10 rounded-full" />
                                    <div className="h-2 w-2/3 bg-white/10 rounded-full" />
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
                        Pronto para liderar com <span className="text-branding-gradient">inteligência de dados?</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Ideal para bancas estruturadas e corporações que buscam excelência, previsibilidade e rentabilidade em sua operação jurídica.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="w-full sm:w-auto bg-blue-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-blue-600/40 hover:scale-105 hover:bg-blue-700 transition-all cursor-pointer uppercase tracking-tight"
                        >
                            Agendar Demonstração Exclusiva
                        </button>
                        <Link
                            href="/pricing"
                            className="w-full sm:w-auto px-12 py-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 font-bold text-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all font-sans uppercase tracking-tight"
                        >
                            Ver Planos de Assinatura
                        </Link>
                    </div>
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
                                    COGNITIO <span className="text-branding-gradient">PRO</span>
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs text-center md:text-left">
                                A tecnologia de quem dita as regras do jogo.
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale size={24} className="text-blue-600" />
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
