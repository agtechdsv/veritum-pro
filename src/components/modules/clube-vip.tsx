import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User } from '@/types';
import { Crown, Sparkles, Mail, Link, Copy, Check, Target, Trophy, ChevronDown, ChevronUp, Gift } from 'lucide-react';
import { toast } from '../ui/toast';

interface Props {
    user: User;
    onUpdateUser: (updatedUser: User) => void;
}

const ClubeVIP: React.FC<Props> = ({ user, onUpdateUser }) => {
    // For demo/development purposes, falling back to local state if db fields dont exist yet
    const [isVipActive, setIsVipActive] = useState(user.vip_active || false);
    const [vipPoints, setVipPoints] = useState(user.vip_points || 0); // 0 to start
    const [vipCode, setVipCode] = useState(user.vip_code || `VIP-${user.name.split(' ')[0].toUpperCase()}`);

    const [copiedLink, setCopiedLink] = useState(false);
    const [showExtract, setShowExtract] = useState(false);

    // Mock data for extract
    const extractMocks = [
        { name: 'João Silva Advocacia', plan: 'Plano Growth Anual', points: 12 },
        { name: 'Pereira & Associados', plan: 'Plano Strategy Mensal', points: 8 },
        { name: 'Mendes Legal', plan: 'Plano Start Anual', points: 5 },
    ];

    // Compute progress
    const progress = Math.min(vipPoints, 100);
    const extraPoints = Math.max(0, vipPoints - 100);
    const discount = progress;

    const handleActivateSubmit = () => {
        setIsVipActive(true);
        onUpdateUser({ ...user, vip_active: true, vip_points: 0, vip_code: vipCode });
        toast.success('Clube VIP Ativado com Sucesso!');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(`https://veritumpro.com/invite/${vipCode}`);
        setCopiedLink(true);
        toast.success('Link copiado para a área de transferência!');
        setTimeout(() => setCopiedLink(false), 2000);
    };

    if (!isVipActive) {
        return (
            <div className="max-w-4xl mx-auto py-12 px-6 animate-in fade-in zoom-in-95 duration-500">
                <div className="bg-[#0f172a] p-10 md:p-14 rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 blur-[120px] rounded-full pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />

                    <div className="relative z-10 text-center max-w-2xl mx-auto mb-10">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-amber-400 to-amber-600 shadow-xl shadow-amber-500/20 mb-8 border border-white/10">
                            <Crown size={32} className="text-white drop-shadow-md" />
                        </div>
                        <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter mb-6">
                            Clube VIP Veritum
                        </h2>
                        <p className="text-lg font-bold text-slate-400 leading-relaxed mb-4">
                            Você faz parte do grupo de escritórios de alta performance.
                        </p>
                        <p className="text-[14px] font-medium text-slate-500 leading-relaxed">
                            Ative o seu perfil VIP gratuitamente para resgatar sua caixa postal exclusiva
                            <span className="text-slate-300 font-bold"> (@veritumpro.com)</span> e gerar o seu link de embaixador.
                            A cada colega que assinar a plataforma pelo seu link, você ganha Pontos VIP (1 Ponto = 1% OFF).
                            Acumule 100 pontos para zerar a sua assinatura e guarde saldos excedentes para os próximos meses.
                        </p>
                    </div>

                    <div className="relative z-10 flex justify-center">
                        <button
                            onClick={handleActivateSubmit}
                            className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-[0.15em] text-sm shadow-[0_10px_30px_rgba(245,158,11,0.3)] hover:scale-105 active:scale-95 transition-all flex items-center gap-3 border border-white/20"
                        >
                            <Sparkles size={18} />
                            Ativar Benefícios VIP
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in mt-10 fade-in duration-500">
            {/* Header VIP */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 rounded-[2.5rem] p-8 md:p-10 shadow-2xl border border-slate-800 relative overflow-hidden">
                <div className="absolute -right-20 -top-20 opacity-5 pointer-events-none">
                    <Crown size={300} className="text-amber-500" />
                </div>

                <div className="flex items-center gap-6 relative z-10">
                    <div className="w-16 h-16 rounded-2xl bg-amber-500 text-amber-950 flex items-center justify-center shadow-lg shadow-amber-500/20 border-2 border-amber-400/50">
                        <Crown size={30} />
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Painel do Embaixador</h2>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mt-1">Benefícios Ativos</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* BLOCO 1 & BLOCO 2 (Left Column) */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Bloco 1: Acessos */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:scale-[1.01]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                <Mail size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Seus Acessos</h3>
                        </div>
                        <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
                            Sua caixa postal VIP está ativa! Acesse em: <br />
                            <span className="text-slate-900 dark:text-white mt-1 inline-block font-black text-xs">{user.name.split(' ')[0].toLowerCase()}@veritumpro.com</span>
                        </p>
                        <a
                            href="#"
                            className="inline-flex w-full items-center justify-center gap-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/30 dark:hover:text-indigo-400 transition-all border border-transparent hover:border-indigo-200 dark:hover:border-indigo-800"
                        >
                            <Mail size={14} /> Acessar Webmail
                        </a>
                    </div>

                    {/* Bloco 2: Link Indicação */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none transition-all hover:scale-[1.01]">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                <Link size={20} />
                            </div>
                            <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-white">Seu Link de Indicação</h3>
                        </div>
                        <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">
                            Compartilhe o link abaixo com seus colegas de profissão ou peça para inserirem o seu código no checkout.
                        </p>
                        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-900/30 p-4 rounded-[1.5rem] mb-6">
                            <p className="text-[10px] font-bold text-amber-700 dark:text-amber-500 flex items-center gap-2 leading-relaxed italic">
                                💡 Convites que resultam em assinaturas <strong className="font-black">Anuais</strong> multiplicam os seus pontos rapidamente!
                            </p>
                        </div>

                        <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 p-2 pl-4 rounded-[1.5rem] mb-4">
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 truncate pr-2">
                                veritumpro.com/invite/{vipCode}
                            </span>
                            <button
                                onClick={handleCopy}
                                className={`p-3 rounded-xl transition-all ${copiedLink ? 'bg-emerald-500 text-white' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 shadow-sm border border-slate-200 dark:border-slate-700 hover:text-indigo-600'}`}
                                aria-label="Copiar link"
                            >
                                {copiedLink ? <Check size={16} /> : <Copy size={16} />}
                            </button>
                        </div>
                        <div className="text-center">
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">
                                Seu Código: <strong className="text-slate-700 dark:text-slate-200 text-xs">{vipCode}</strong>
                            </span>
                        </div>
                    </div>
                </div>

                {/* BLOCO 3 & 4 (Right Column) */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Bloco 3: Dashboard Descontos */}
                    <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-10 md:p-12 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 blur-[100px] rounded-full pointer-events-none" />
                        <div className="absolute bottom-0 left-0 w-80 h-80 bg-amber-500/10 blur-[100px] rounded-full pointer-events-none" />

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10 relative z-10">
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tighter text-white mb-2 flex items-center gap-3">
                                    <Target className="text-indigo-400" size={24} />
                                    Dashboard de Descontos
                                </h3>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sua Meta: 100 Pontos VIP (Assinatura Zerada)</p>
                            </div>

                            {progress === 100 && (
                                <div className="px-5 py-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-2xl flex items-center gap-2 animate-pulse">
                                    <Trophy size={16} className="text-emerald-400" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">100% OFF ALCANÇADO 🎉</span>
                                </div>
                            )}
                        </div>

                        {/* Progress Bar Container */}
                        <div className="relative mb-14 mt-6 z-10">
                            <div className="flex justify-between text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">
                                <span>0</span>
                                <span>100 Pontos</span>
                            </div>
                            <div className="h-6 w-full bg-slate-900/80 border border-slate-800 rounded-full overflow-hidden p-1 shadow-inner relative">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${progress}%` }}
                                    transition={{ duration: 1.5, ease: "easeOut" }}
                                    className={`h-full rounded-full flex items-center justify-end pr-2 shadow-[0_0_20px_rgba(255,255,255,0.3)] 
                                        ${progress === 100 ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-indigo-500 to-amber-500'}`}
                                >
                                    {progress > 10 && (
                                        <span className="text-[9px] font-black text-white/90">{progress}%</span>
                                    )}
                                </motion.div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                            <div className="bg-slate-900/60 border border-slate-800 p-5 rounded-3xl backdrop-blur-md">
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Pontos Neste Ciclo</p>
                                <p className="text-3xl font-black text-white flex items-baseline gap-1">
                                    {vipPoints} <span className="text-[10px] text-slate-500 uppercase">Pts</span>
                                </p>
                            </div>
                            <div className="bg-slate-900/60 border border-emerald-900/30 p-5 rounded-3xl backdrop-blur-md relative overflow-hidden group">
                                <p className="text-[9px] font-black text-emerald-500/70 uppercase tracking-widest mb-2 z-10 relative">Desconto Na Renovação</p>
                                <p className="text-3xl font-black text-emerald-400 flex items-baseline gap-1 z-10 relative">
                                    {discount}% <span className="text-[10px] text-emerald-500/50 uppercase tracking-widest">OFF</span>
                                </p>
                                {progress === 100 && (
                                    <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-all pointer-events-none" />
                                )}
                            </div>
                            <div className="bg-slate-900/60 border border-amber-900/30 p-5 rounded-3xl backdrop-blur-md">
                                <p className="text-[9px] font-black text-amber-500/70 uppercase tracking-widest mb-2">Saldo Extra (Próx. Mês)</p>
                                <p className="text-3xl font-black text-amber-400 flex items-baseline gap-1">
                                    {extraPoints} <span className="text-[10px] text-amber-500/50 uppercase">Pts</span>
                                </p>
                            </div>
                        </div>

                        {/* Temporary DEV Controller for showing Gamification */}
                        <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between z-10 relative">
                            <span className="text-[9px] text-slate-600 font-black uppercase tracking-widest">Apenas para Gamificação (Testes UI):</span>
                            <div className="flex gap-2">
                                <button onClick={() => setVipPoints(v => Math.max(0, v - 10))} className="px-3 py-1 bg-slate-800 text-slate-400 rounded-lg text-xs font-bold">-10</button>
                                <button onClick={() => setVipPoints(v => v + 25)} className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-lg text-xs font-bold">+25</button>
                                <button onClick={() => setVipPoints(100)} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold">100</button>
                                <button onClick={() => setVipPoints(140)} className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-lg text-xs font-bold">140</button>
                            </div>
                        </div>
                    </div>

                    {/* Bloco 4: Extrato de Indicações */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                        <button
                            onClick={() => setShowExtract(!showExtract)}
                            className="w-full flex items-center justify-between p-8 md:px-10 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all outline-none"
                        >
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-xl">
                                    <Gift size={20} />
                                </div>
                                <div className="text-left">
                                    <h3 className="text-lg font-black uppercase tracking-tighter text-slate-800 dark:text-white">Extrato de Indicações</h3>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Veja de onde vieram seus pontos</p>
                                </div>
                            </div>
                            <div className="text-slate-400 bg-slate-100 dark:bg-slate-800 p-2 rounded-xl">
                                {showExtract ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                            </div>
                        </button>

                        <AnimatePresence>
                            {showExtract && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className="border-t border-slate-100 dark:border-slate-800"
                                >
                                    <div className="p-8 md:px-10 space-y-4">
                                        {extractMocks.map((item, i) => (
                                            <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-[1.5rem] border border-slate-100 dark:border-slate-800/50 hover:border-slate-200 dark:hover:border-slate-700 transition-all gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                                                        <Check size={16} strokeWidth={3} />
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-800 dark:text-white">{item.name}</h4>
                                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.plan}</span>
                                                    </div>
                                                </div>
                                                <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl font-black text-xs uppercase tracking-widest shrink-0 self-start md:self-auto">
                                                    + {item.points} Pontos
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </div>
    );
};

export default ClubeVIP;
