'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Sparkles, ArrowRight, ShieldCheck, Scale, Gift, CheckCircle2, Star } from 'lucide-react';
import { getReferrerName } from './actions';
import { useRouter, useParams } from 'next/navigation';

export default function InvitePage() {
    const params = useParams();
    const code = params.code as string;
    const [referrerName, setReferrerName] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchReferrer = async () => {
            if (!code) return;
            const name = await getReferrerName(code);
            if (name) {
                setReferrerName(name);
            }
            setLoading(false);
        };
        fetchReferrer();
    }, [code]);

    const handleAccept = () => {
        router.push(`/?signup=true&invite=${code.toUpperCase()}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
                <div className="w-16 h-16 relative">
                    <div className="absolute inset-0 border-4 border-amber-500/20 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs animate-pulse">Preparando Convite Vip...</p>
            </div>
        );
    }

    if (!referrerName) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-md w-full bg-slate-900 border border-slate-800 p-10 rounded-[3rem] shadow-2xl"
                >
                    <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-rose-500/20">
                        <ShieldCheck size={40} />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-4">Convite Inválido</h1>
                    <p className="text-slate-400 font-medium mb-10 leading-relaxed text-sm">Este link de acesso VIP expirou ou não existe em nossos registros corporativos.</p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-slate-800 text-white py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-700 transition"
                    >
                        Ir para a Página Inicial
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] text-slate-200 font-sans overflow-x-hidden flex flex-col items-center justify-center relative p-6 selection:bg-amber-500/30">
            {/* Ambient Backgrounds */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-amber-500/10 blur-[150px] rounded-full pointer-events-none opacity-50" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-indigo-500/10 blur-[150px] rounded-full pointer-events-none opacity-50" />
            <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" />

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-2xl w-full relative z-10"
            >
                {/* VIP Header Logo */}
                <div className="flex justify-center mb-12">
                    <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 px-6 py-3 rounded-full backdrop-blur-md">
                        <Scale className="text-white" size={20} />
                        <span className="text-white font-black uppercase tracking-[0.2em] text-sm">Veritum Pro</span>
                    </div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 rounded-[3rem] p-8 md:p-14 shadow-2xl relative overflow-hidden">
                    {/* Golden Glow Inside Card */}
                    <div className="absolute -top-32 -right-32 w-64 h-64 bg-amber-500/20 blur-[80px] rounded-full pointer-events-none" />

                    <div className="text-center relative z-10">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                            className="w-24 h-24 bg-gradient-to-br from-amber-400 to-amber-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-xl shadow-amber-500/20 border border-white/20"
                        >
                            <Crown size={40} className="text-white drop-shadow-md" />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-6">
                                <Sparkles size={14} className="text-amber-500" />
                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Acesso VIP Liberado</span>
                            </div>

                            <h1 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6 leading-[1.1]">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                                    {referrerName}
                                </span>
                                <br />
                                te convidou para o Clube.
                            </h1>

                            <p className="text-base text-slate-400 font-medium mb-12 leading-relaxed max-w-lg mx-auto">
                                Ao aceitar este convite, você receberá acesso prioritário ao ecossistema <strong className="text-slate-200">Veritum Pro</strong>, a plataforma jurídica de alta performance.
                            </p>
                        </motion.div>

                        {/* Feature Points */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="bg-black/20 border border-white/5 rounded-3xl p-6 text-left mb-10 space-y-4"
                        >
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={18} />
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Acesso Imediato</h4>
                                    <p className="text-xs text-slate-400 font-medium">Liberação instantânea do seu ambiente de trabalho.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <CheckCircle2 className="text-emerald-500 mt-0.5 shrink-0" size={18} />
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Tecnologia Premium</h4>
                                    <p className="text-xs text-slate-400 font-medium">Inteligência Artificial e automação de ponta a ponta.</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4">
                                <Star className="text-amber-500 mt-0.5 shrink-0" size={18} />
                                <div>
                                    <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-1">Vantagem do Convite</h4>
                                    <p className="text-xs text-slate-400 font-medium">Você será vinculado diretamente à rede de {referrerName.split(' ')[0]}.</p>
                                </div>
                            </div>
                        </motion.div>

                        <motion.button
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.8 }}
                            onClick={handleAccept}
                            className="group w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-5 px-8 rounded-2xl font-black uppercase tracking-[0.15em] text-sm shadow-[0_10px_40px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 border border-white/20"
                        >
                            Aceitar Convite VIP
                            <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </motion.button>

                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest mt-6">
                            Você criará sua conta de forma 100% segura.
                        </p>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
