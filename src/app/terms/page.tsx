'use client'

import React from 'react';
import { ArrowLeft, FileText, Scale } from 'lucide-react';
import Link from 'next/link';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3v18"></path><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M7 21h10"></path></svg>
    </div>
);

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white transition-colors duration-500">
            <div className="fixed top-1/4 left-0 w-96 h-96 bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-400/5 blur-[150px] rounded-full pointer-events-none"></div>

            <nav className="fixed top-0 w-full z-50 glass border-b transition-colors duration-300 backdrop-blur-md bg-white/70 dark:bg-slate-950/70 border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-3">
                        <Logo />
                        <span className="font-extrabold text-2xl tracking-tighter text-slate-900 dark:text-white">VERITUM <span className="text-branding-gradient">PRO</span></span>
                    </Link>
                    <Link href="/" className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-indigo-600 transition-colors">
                        <ArrowLeft size={16} /> Voltar ao Início
                    </Link>
                </div>
            </nav>

            <main className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 font-black tracking-tight">
                        <FileText size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900 dark:text-white">
                        Termos de <span className="text-branding-gradient">Serviço</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">Atualizado em Fevereiro 2024</p>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-loose space-y-8">
                    <section>
                        <p className="text-lg">Bem-vindo ao <strong className="text-branding-gradient">Veritum Pro</strong>, o ecossistema jurídico modular de alta performance.</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">1. Aceitação dos Termos</h2>
                        <p>Ao acessar este aplicativo, você concorda em cumprir estes termos de serviço e todas as leis aplicáveis ao exercício da advocacia e proteção de dados (LGPD).</p>
                    </section>
                </div>
            </main>
        </div>
    );
}
