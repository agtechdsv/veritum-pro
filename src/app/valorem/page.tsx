'use client'

import React, { useState, useEffect } from 'react';
import {
    Wallet, TrendingUp, CreditCard, PieChart, ArrowRight,
    ChevronRight, Moon, Sun, Scale, BarChart3,
    QrCode, Smartphone, Receipt, FileSpreadsheet, Zap,
    MousePointer2, CheckCircle2, AlertCircle, Banknote,
    ArrowDownToLine, Users2, FileOutput, LogOut
} from 'lucide-react';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AuthModal } from '@/components/auth-modal';

const Logo = () => (
    <div className="bg-emerald-600/10 p-2 rounded-lg flex items-center justify-center text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
        <Wallet className="h-6 w-6" />
    </div>
);

export default function ValoremLanding() {
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
        <div id="top" className="min-h-screen bg-white dark:bg-slate-950 transition-colors duration-300 font-sans selection:bg-emerald-100 selection:text-emerald-900">
            {/* Navbar */}
            <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-slate-900">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="flex items-center gap-2 group">
                            <Logo />
                            <span className="text-xl font-black tracking-tighter text-slate-900 dark:text-white group-hover:opacity-80 transition-opacity uppercase">
                                VALOREM <span className="text-branding-gradient">PRO</span>
                            </span>
                        </Link>
                    </div>

                    <div className="hidden md:flex items-center gap-8">
                        <Link href="/" className="text-base font-bold text-branding-gradient hover:opacity-80 transition-all">Portal</Link>
                        <a href="#top" className="text-sm font-bold text-slate-800 dark:text-white">Início</a>
                        <a href="#vision" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">Visão</a>
                        <a href="#features" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">Funcionalidades</a>
                        <a href="#ux" className="text-sm font-bold text-slate-600 dark:text-slate-400 hover:text-emerald-600 transition-colors">Diferencial</a>
                    </div>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <Link href="/?login=true" className="hidden sm:flex items-center gap-2 font-bold px-4 py-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-xl transition-all">
                            <LogOut size={18} /> Entrar
                        </Link>
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold shadow-xl shadow-emerald-600/20 hover:scale-105 transition-all text-sm"
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
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-widest mb-8 animate-fade-in">
                            <Banknote size={14} className="animate-pulse" /> Inteligência Financeira Jurídica
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-[1.05] text-slate-900 dark:text-white">
                            Sua saúde financeira <br />
                            em <span className="text-branding-gradient">piloto automático.</span>
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 max-w-xl mb-12 leading-relaxed font-medium">
                            Receba seus honorários sem burocracia. Diga adeus às planilhas confusas e à inadimplência. O Valorem PRO resolve cálculos judiciais e automatiza cobranças.
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <button
                                onClick={() => setIsAuthModalOpen(true)}
                                className="w-full sm:w-auto bg-emerald-600 text-white px-10 py-4 rounded-[1.5rem] font-bold text-lg shadow-2xl shadow-emerald-600/40 hover:scale-105 hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                            >
                                Começar Teste Grátis <ArrowRight size={20} />
                            </button>
                            <a href="#vision" className="w-full sm:w-auto px-10 py-4 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-center text-slate-600 dark:text-slate-300">
                                Saiba mais
                            </a>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {/* Financial Dashboard & Mobile PIX Mockup */}
                        <div className="relative z-10">
                            {/* Main Dashboard Card */}
                            <div className="bg-slate-100 dark:bg-slate-800 rounded-[2.5rem] p-4 border border-slate-200 dark:border-slate-800 shadow-3xl transform rotate-2">
                                <div className="bg-white dark:bg-slate-950 rounded-[2rem] overflow-hidden border border-slate-200 dark:border-slate-800 aspect-[4/3] flex flex-col p-8">
                                    <div className="flex justify-between items-end mb-8">
                                        <div>
                                            <div className="text-[10px] font-black tracking-widest text-slate-400 uppercase mb-1">Receita Mensal</div>
                                            <div className="text-3xl font-black text-emerald-500">R$ 142.500,00</div>
                                        </div>
                                        <div className="flex gap-2">
                                            <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500"><TrendingUp size={16} /></div>
                                        </div>
                                    </div>
                                    <div className="flex-1 flex items-end gap-2 px-2">
                                        {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                                            <div key={i} className="flex-1 bg-emerald-500/20 hover:bg-emerald-500/40 transition-colors rounded-t-lg relative group" style={{ height: `${h}%` }}>
                                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[8px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                                    R$ {h}k
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="h-px bg-slate-100 dark:bg-slate-900 w-full mt-4" />
                                    <div className="mt-4 flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                        <span>Jan</span><span>Mar</span><span>Mai</span><span>Jul</span><span>Set</span>
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Mockup with PIX Overlay */}
                            <div className="absolute -bottom-10 -left-10 w-48 aspect-[9/19] bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 shadow-2xl p-3 z-20 transform -rotate-6">
                                <div className="w-full h-full bg-white dark:bg-slate-900 rounded-[2rem] overflow-hidden flex flex-col">
                                    <div className="h-4 w-full bg-slate-100 dark:bg-slate-800 flex justify-center py-1">
                                        <div className="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full" />
                                    </div>
                                    <div className="p-4 flex-1 flex flex-col items-center justify-center gap-4">
                                        <div className="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700">
                                            <QrCode size={64} className="text-slate-900 dark:text-white" />
                                        </div>
                                        <div className="text-center">
                                            <div className="text-[8px] font-black uppercase text-emerald-500 mb-1">Pagamento via PIX</div>
                                            <div className="text-xs font-black text-slate-900 dark:text-white">R$ 2.450,00</div>
                                        </div>
                                        <div className="w-full h-8 bg-emerald-500 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-emerald-500/20">
                                            Pagar Agora
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        {/* Decorative background blobs */}
                        <div className="absolute -top-10 -right-10 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full" />
                        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-emerald-400/10 blur-[100px] rounded-full" />
                    </div>
                </div>

                {/* Animated Background Elements */}
                <div className="absolute top-1/4 left-0 w-96 h-96 bg-emerald-400/5 blur-[120px] rounded-full pointer-events-none"></div>
                <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-600/5 blur-[150px] rounded-full pointer-events-none"></div>
            </section>

            {/* Dobra 2: SEÇÃO DE IMPACTO / DASHBOARD VISUAL */}
            <section id="vision" className="py-32 px-6 bg-slate-50 dark:bg-slate-950/40 border-y border-slate-100 dark:border-slate-900 transition-colors">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col lg:flex-row items-center gap-16">
                        <div className="flex-1 grid grid-cols-2 gap-4">
                            {[
                                { label: 'Receitas no Mês', val: '+42%', color: 'text-emerald-500', icon: TrendingUp },
                                { label: 'Inadimplência', val: '-65%', color: 'text-rose-500', icon: AlertCircle },
                                { label: 'Provisão de Risco', val: 'R$ 2.4M', color: 'text-emerald-600', icon: Scale },
                                { label: 'Liquidez Hoje', val: 'Alta', color: 'text-indigo-500', icon: BarChart3 }
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
                                Pare de cobrar clientes. <br />
                                Deixe o sistema fazer <span className="text-branding-gradient">isso por você.</span>
                            </h2>
                            <p className="text-xl text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                O Valorem PRO foi desenhado para quem advoga e não quer perder tempo com tarefas burocráticas de tesouraria. Saiba exatamente quem pagou, quem está devendo e qual é a projeção de faturamento do trimestre.
                            </p>
                            <div className="p-6 bg-emerald-600/5 rounded-2xl border border-emerald-600/10 italic text-emerald-600 dark:text-emerald-400 font-bold">
                                "Uma visão em tempo real, do centavo ao milhão, sem precisar ser um especialista em finanças."
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Dobra 3: Funcionalidades */}
            <section id="features" className="py-32 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-20 max-w-3xl mx-auto">
                        <span className="text-emerald-600 dark:text-emerald-400 font-black tracking-[0.2em] uppercase text-sm">Tecnologia Financeira</span>
                        <h2 className="text-5xl font-black mt-4 text-slate-900 dark:text-white uppercase tracking-tighter">Funcionalidades de Elite</h2>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mt-4 leading-relaxed font-medium">Ferramentas criadas para garantir a rentabilidade e a transparência do seu negócio.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        {[
                            {
                                title: 'Gestão Financeira Inteligente',
                                desc: 'Assuma o controle total. Gerencie honorários, custas e fluxo de caixa. Vincule cada despesa diretamente ao processo do cliente.',
                                icon: Receipt,
                                color: 'bg-emerald-500/10 text-emerald-500'
                            },
                            {
                                title: 'Emissão de Boletos e PIX Integrado',
                                desc: 'Profissionalize suas cobranças. Gere QR Codes PIX e boletos com lembretes automáticos e baixa instantânea no sistema.',
                                icon: CreditCard,
                                color: 'bg-indigo-500/10 text-indigo-500'
                            },
                            {
                                title: 'Integração PJe-Calc e Atualizações',
                                desc: 'Fim da dor de cabeça com cálculos judiciais. Importe dados governamentais e atualize valores com índices monetários reais.',
                                icon: FileSpreadsheet,
                                color: 'bg-rose-500/10 text-rose-500'
                            },
                            {
                                title: 'Provisionamento e Relatórios de Contingência',
                                desc: 'A visão exigida por grandes diretorias. Calcule provisões de risco e monitore valores retidos em depósitos judiciais.',
                                icon: PieChart,
                                color: 'bg-amber-500/10 text-amber-500'
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
                                <button className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 hover:gap-3 transition-all">
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
                            Finanças traduzidas <br />
                            para o seu <span className="text-branding-gradient">idioma.</span>
                        </h2>
                        <p className="text-xl text-slate-300 leading-relaxed font-medium">
                            Você é de humanas, e nós entendemos isso. Em vez de telas repletas de jargões contábeis, o Valorem PRO usa gráficos visuais e ícones intuitivos.
                        </p>
                        <div className="space-y-6">
                            {[
                                { title: 'Conciliação Visual', desc: 'Cores que indicam imediatamente o que está pago, atrasado ou pendente.', icon: CheckCircle2 },
                                { title: 'Rateio Descomplicado', desc: 'Divisão automática de honorários entre sócios e parceiros.', icon: Users2 },
                                { title: 'Exportação Transparente', desc: 'Exporte relatórios para o seu contador com apenas um clique.', icon: FileOutput }
                            ].map((item, i) => (
                                <div key={i} className="flex gap-4 items-start p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                                    <item.icon className="text-emerald-400 shrink-0 mt-1" size={24} />
                                    <div>
                                        <h4 className="font-black text-lg mb-1 uppercase tracking-tight">{item.title}</h4>
                                        <p className="text-slate-400 text-sm font-medium">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="flex-1 relative aspect-square lg:aspect-auto h-full min-h-[500px]">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-emerald-400/20 blur-3xl opacity-50"></div>
                        <div className="relative z-10 w-full h-full border border-white/10 bg-white/5 backdrop-blur-3xl rounded-[3rem] p-10 flex flex-col justify-center gap-8">
                            <div className="p-8 border border-white/10 bg-white/5 rounded-3xl space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="h-4 w-24 bg-white/20 rounded-full" />
                                    <div className="h-8 w-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center"><TrendingUp size={16} /></div>
                                </div>
                                <div className="h-8 w-48 bg-white/10 rounded-xl" />
                                <div className="flex gap-2">
                                    <div className="flex-1 h-32 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex flex-col items-center justify-center gap-2">
                                        <div className="text-2xl font-black text-emerald-400">85%</div>
                                        <div className="text-[8px] font-black uppercase text-slate-500">Eficiência</div>
                                    </div>
                                    <div className="flex-1 h-32 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2">
                                        <div className="text-2xl font-black text-white">$4.2k</div>
                                        <div className="text-[8px] font-black uppercase text-slate-500">Hoje</div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-12 flex-1 bg-emerald-500 text-white rounded-2xl flex items-center justify-center font-bold text-xs">PIX Direto</div>
                                <div className="h-12 flex-1 bg-white/10 text-white rounded-2xl flex items-center justify-center font-bold text-xs border border-white/10">Boleto</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer / CTA Final */}
            <section className="py-32 px-6 text-center">
                <div className="max-w-4xl mx-auto">
                    <h2 className="text-5xl md:text-6xl font-black mb-8 text-slate-900 dark:text-white leading-tight">
                        Pronto para lucrar mais e se <span className="text-branding-gradient">preocupar menos?</span>
                    </h2>
                    <p className="text-xl text-slate-500 dark:text-slate-400 mb-12 leading-relaxed max-w-2xl mx-auto font-medium">
                        Integrado perfeitamente ao Nexus PRO, o Valorem garante que todo o seu trabalho jurídico seja devidamente registrado, cobrado e recebido.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                        <button
                            onClick={() => setIsAuthModalOpen(true)}
                            className="w-full sm:w-auto bg-emerald-600 text-white px-12 py-5 rounded-[2.5rem] font-black text-xl shadow-2xl shadow-emerald-600/40 hover:scale-105 hover:bg-emerald-700 transition-all cursor-pointer"
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
                                    VALOREM <span className="text-branding-gradient">PRO</span>
                                </span>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xs text-center md:text-left">
                                O controle financeiro de quem advoga com previsibilidade.
                            </p>
                        </div>

                        <div className="flex flex-col items-center md:items-end gap-2 text-center md:text-right">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale size={24} className="text-emerald-600" />
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
