'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, BookOpen, Heart, Shield, Zap, ChevronRight, Scale, Moon, Sun, Globe } from 'lucide-react';
import Link from 'next/link';
import { useTheme } from 'next-themes';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3v18"></path><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M7 21h10"></path></svg>
    </div>
);

export default function HistoryPage() {
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    if (!mounted) return null;

    return (
        <div className="min-h-screen transition-colors duration-500 bg-white text-slate-900 dark:bg-slate-950 dark:text-white selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-200">
            {/* Nav */}
            <nav className="fixed top-0 w-full z-50 glass border-b transition-colors duration-300 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Logo />
                        <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white transition-all group-hover:scale-105">
                            VERITUM <span className="text-branding-gradient">PRO</span>
                        </span>
                    </Link>

                    <div className="flex items-center gap-4">
                        <button onClick={toggleTheme} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all text-slate-600 dark:text-slate-400">
                            {resolvedTheme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
                        </button>
                        <Link
                            href="/"
                            className="flex items-center gap-2 px-6 py-2.5 border border-slate-200 dark:border-slate-800 rounded-full font-bold text-sm transition-all hover:bg-slate-50 dark:hover:bg-slate-800"
                        >
                            <ArrowLeft size={16} /> Voltar para o Início
                        </Link>
                    </div>
                </div>
            </nav>

            <main className="relative">
                {/* Hero Section */}
                <section className="relative pt-44 pb-32 px-6 overflow-hidden flex flex-col items-center justify-center text-center">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <h1 className="text-5xl md:text-8xl font-black tracking-tight mb-8 leading-[1.1] max-w-5xl mx-auto">
                            A Busca pela <span className="text-branding-gradient">Clareza</span>.<br />
                            A Busca pela <span className="text-indigo-600 dark:text-indigo-400">Verdade</span>.
                        </h1>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.5, duration: 1 }}
                            className="w-24 h-1 bg-gradient-to-r from-indigo-600 to-emerald-500 mx-auto rounded-full mb-12"
                        />
                    </motion.div>

                    {/* Background elements */}
                    <div className="absolute top-1/4 left-0 w-96 h-96 bg-indigo-400/20 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-emerald-400/10 blur-[150px] rounded-full pointer-events-none"></div>
                </section>

                {/* Section 1: The Pain */}
                <section className="py-32 px-6 relative bg-slate-50 dark:bg-slate-900/50 transition-colors">
                    <div className="max-w-4xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="flex flex-col gap-8"
                        >
                            <div className="flex items-center gap-4">
                                <span className="px-4 py-1 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black uppercase tracking-[0.2em]">O Propósito</span>
                                <div className="h-px flex-1 bg-slate-200 dark:border-slate-800" />
                            </div>
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white italic">A dor que nos moveu</h2>
                            <div className="space-y-6 text-xl text-slate-600 dark:text-slate-400 font-medium leading-[1.8]">
                                <p>
                                    Sabemos que a advocacia moderna se tornou um mar de caos. Entre sistemas judiciais complexos, planilhas intermináveis e o medo constante de perder um prazo fatal, o advogado perdeu o seu bem mais precioso: <span className="text-indigo-600 dark:text-indigo-400 font-bold">o tempo para pensar estrategicamente e a qualidade de vida.</span>
                                </p>
                                <p>
                                    O mercado estava cheio de softwares, mas a maioria parecia ter sido desenhada para dificultar, e não para ajudar. Sentíamos que a tecnologia jurídica precisava de menos burocracia e mais humanidade.
                                </p>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* Section 2: The Birth */}
                <section className="py-40 px-6 relative">
                    <div className="max-w-4xl mx-auto text-center relative z-10">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8 }}
                            viewport={{ once: true }}
                            className="p-12 md:p-20 bg-white/50 dark:bg-slate-900/50 backdrop-blur-3xl rounded-[3rem] border border-white dark:border-slate-800 shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent opacity-50" />

                            <Sparkles className="w-12 h-12 text-emerald-500 mx-auto mb-8 animate-pulse" />
                            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-8 mb-12 uppercase tracking-tighter italic">O nascimento de um Ecossistema</h2>
                            <p className="text-2xl text-slate-600 dark:text-slate-300 font-medium leading-relaxed">
                                Foi dessa frustração que nasceu o nosso ecossistema. Nós não queríamos criar apenas "mais um sistema de gestão". <span className="bg-indigo-600/5 px-2 rounded-lg italic">Queríamos construir um parceiro silencioso</span>, uma inteligência invisível que trabalhasse nos bastidores para que os escritórios pudessem focar no que realmente importa: <span className="text-branding-gradient font-black">a justiça e os seus clientes.</span>
                            </p>
                        </motion.div>
                    </div>

                    {/* Floating Orbs */}
                    <div className="absolute top-1/2 left-10 w-32 h-32 bg-indigo-500/20 blur-3xl rounded-full" />
                    <div className="absolute bottom-1/4 right-10 w-48 h-48 bg-emerald-500/10 blur-3xl rounded-full" />
                </section>

                {/* Section 3: The Meaning of Veritum (Premium Card Style) */}
                <section className="py-40 px-6 bg-slate-900 text-white relative overflow-hidden">
                    {/* Noise texture overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />

                    <div className="max-w-6xl mx-auto relative z-10">
                        <div className="text-center mb-24">
                            <h2 className="text-5xl md:text-7xl font-black mb-8 italic tracking-tighter">O Significado de <span className="text-branding-gradient">Veritum</span></h2>
                            <p className="text-xl text-slate-400 max-w-2xl mx-auto font-medium">
                                Quando fomos batizar nossa plataforma, não queríamos uma palavra que significasse apenas "dados corretos". Queríamos algo que fosse além dos números e olhasse para as pessoas.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center italic">
                            {[
                                {
                                    title: "Veritas",
                                    subtitle: "A verdade abstrata",
                                    desc: "O conceito geral de justiça que você defende. O ideal.",
                                    color: "from-slate-700 to-slate-800",
                                    icon: Shield
                                },
                                {
                                    title: "Verum",
                                    subtitle: "O fato frio",
                                    desc: "A prova objetiva, o documento anexado aos autos. Dados brutos.",
                                    color: "from-blue-800 to-blue-900",
                                    icon: Scale
                                },
                                {
                                    title: "Veritum",
                                    subtitle: "A verdade sentida",
                                    desc: "A realidade experimentada. O aspecto psicológico da paz mental.",
                                    color: "bg-branding-gradient shadow-[0_0_50px_rgba(16,185,129,0.3)] scale-110 h-[100%]",
                                    icon: Heart,
                                    isSpecial: true
                                }
                            ].map((item, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0, y: 50 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.2, duration: 0.6 }}
                                    viewport={{ once: true }}
                                    className={`p-10 rounded-[3rem] border flex flex-col items-center gap-6 group transition-all duration-500 ${item.isSpecial ? 'bg-branding-gradient border-white/20' : 'bg-slate-800/50 border-white/10'}`}
                                >
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110 ${item.isSpecial ? 'bg-white/20' : 'bg-white/5'}`}>
                                        <item.icon className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-4xl font-black uppercase tracking-widest">{item.title}</h3>
                                    <h4 className={`text-sm font-bold uppercase tracking-[0.2em] ${item.isSpecial ? 'text-white/80' : 'text-indigo-400'}`}>{item.subtitle}</h4>
                                    <p className={`text-lg font-medium leading-relaxed ${item.isSpecial ? 'text-white' : 'text-slate-400'}`}>
                                        {item.desc}
                                    </p>
                                    {item.isSpecial && (
                                        <div className="mt-4 px-4 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest">A Escolha Veritum</div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 4: Deep Dive */}
                <section className="py-40 px-6 bg-white dark:bg-slate-950 transition-colors">
                    <div className="max-w-5xl mx-auto">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                whileInView={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                                className="relative aspect-square"
                            >
                                <div className="absolute inset-10 bg-indigo-600 rounded-[4rem] rotate-6 opacity-10 animate-pulse" />
                                <div className="absolute inset-10 bg-emerald-500 rounded-[4rem] -rotate-3 opacity-10 animate-pulse" />
                                <div className="absolute inset-0 bg-slate-100 dark:bg-slate-900 rounded-[4rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex items-center justify-center p-12">
                                    {/* Justice Background Image */}
                                    <img
                                        src="/justice-bg.png"
                                        alt="Justiça"
                                        className="absolute inset-0 w-full h-full object-cover opacity-[0.1] dark:opacity-[0.07] grayscale brightness-150 pointer-events-none"
                                    />
                                    <Zap className="w-32 h-32 text-indigo-600 dark:text-indigo-400 absolute opacity-5" />
                                    <div className="text-center italic z-10">
                                        <h4 className="text-7xl font-black mb-2 bg-gradient-to-b from-indigo-600 to-white bg-clip-text text-transparent pb-2">
                                            PAZ
                                        </h4>
                                        <p className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-widest">Psicológica</p>
                                    </div>
                                </div>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: 50 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.8 }}
                                viewport={{ once: true }}
                                className="space-y-8"
                            >
                                <p className="text-2xl text-slate-600 dark:text-slate-400 font-medium leading-[1.8]">
                                    E no Direito, onde a verdade muitas vezes fica oculta sob pilhas de documentos e prazos, entregar Veritum significa entregar a <span className="text-slate-900 dark:text-white font-black italic">paz mental.</span>
                                </p>
                                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                                    É a tranquilidade psicológica de saber que nenhum prazo será perdido. O Veritum PRO existe para trazer a clareza à tona: ele ilumina o seu escritório, transformando o caos processual em controle visual, dados brutos em jurimetria exata, e tarefas repetitivas em automação inteligente.
                                </p>
                                <p className="text-xl text-slate-500 dark:text-slate-400 font-bold border-l-4 border-indigo-500 pl-6 italic">
                                    Nós simplificamos a tecnologia para que você sinta a verdadeira liberdade de advogar e possa elevar a sua performance ao máximo.
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-40 px-6 text-center bg-slate-50 dark:bg-slate-900/40 relative overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                        viewport={{ once: true }}
                        className="max-w-4xl mx-auto relative z-10"
                    >
                        <h2 className="text-4xl md:text-6xl font-black mb-12 italic leading-tight scale-[1.05]">
                            Veritum PRO - A verdade sobre o seu escritório, <br />
                            <span className="text-branding-gradient">o controle sobre o seu futuro.</span>
                        </h2>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 m-12">
                            <Link
                                href="/?login=true"
                                className="px-12 py-5 bg-indigo-600 text-white rounded-full font-black text-xl shadow-2xl shadow-indigo-600/30 hover:scale-110 hover:bg-indigo-700 transition-all uppercase tracking-tight flex items-center gap-3"
                            >
                                Começar Agora <ArrowLeft className="rotate-180" size={24} />
                            </Link>
                        </div>
                    </motion.div>

                    {/* Animated background lines */}
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute top-0 left-1/4 w-px h-full bg-gradient-to-b from-transparent via-indigo-500 to-transparent" />
                        <div className="absolute top-0 right-1/4 w-px h-full bg-gradient-to-b from-transparent via-emerald-500 to-transparent" />
                    </div>
                </section>
            </main>

            {/* Simple Footer */}
            <footer className="py-20 px-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 transition-colors">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-3">
                        <Logo />
                        <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white transition-all group-hover:scale-105">
                            VERITUM <span className="text-branding-gradient">PRO</span>
                        </span>
                    </div>
                    <p className="text-sm text-slate-400 dark:text-slate-500 font-medium italic">
                        BYODB Architecture & Legal Intelligence.
                    </p>
                    <div className="flex items-center gap-8">
                        <Link href="/privacy" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Privacidade</Link>
                        <Link href="/terms" className="text-xs font-bold uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">Termos</Link>
                    </div>
                </div>
            </footer>
        </div>
    );
}
