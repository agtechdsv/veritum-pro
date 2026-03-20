
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Sparkles, Brain, Scale, BookOpen, 
    ArrowRight, CheckCircle2, AlertCircle, 
    TrendingUp, FileText, Zap, Loader2,
    Calendar, User, MessageSquare
} from 'lucide-react';
import { GoldenAlert, Clipping, KnowledgeArticle } from '@/types';
import { updateGoldenAlertStatus, convertGoldenAlertToTask } from '@/app/actions/intelligence-actions';
import { toast } from '@/components/ui/toast';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    alert: GoldenAlert & { clipping?: Clipping, knowledge?: KnowledgeArticle };
    onActionComplete?: () => void;
}

const GoldenDetailModal: React.FC<Props> = ({ isOpen, onClose, alert, onActionComplete }) => {
    const [isActioning, setIsActioning] = useState(false);

    if (!isOpen) return null;

    const handleMarkAsRead = async () => {
        setIsActioning(true);
        try {
            await updateGoldenAlertStatus(alert.id, 'dismissed');
            toast.success('Insight arquivado com sucesso.');
            onClose();
            if (onActionComplete) onActionComplete();
        } catch (err) {
            toast.error('Erro ao atualizar status.');
        } finally {
            setIsActioning(false);
        }
    };

    const handleConvertToTask = async () => {
        setIsActioning(true);
        try {
            await convertGoldenAlertToTask(alert.id);
            toast.success('Tarefa estratégica criada no Nexus!');
            onClose();
            if (onActionComplete) onActionComplete();
        } catch (err: any) {
            console.error(err);
            toast.error('Erro ao converter insight em tarefa.');
        } finally {
            setIsActioning(false);
        }
    };

    const getTypeDetails = (type: string) => {
        switch (type) {
            case 'Risk':
                return { 
                    label: 'URGÊNCIA / RISCO', 
                    color: 'text-rose-600 dark:text-rose-400',
                    bg: 'bg-rose-50 dark:bg-rose-900/20',
                    icon: <AlertCircle className="text-rose-500" size={20} />
                };
            case 'Opportunity':
                return { 
                    label: 'TENDÊNCIA / OPORTUNIDADE', 
                    color: 'text-indigo-600 dark:text-indigo-400',
                    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
                    icon: <TrendingUp className="text-indigo-500" size={20} />
                };
            default:
                return { 
                    label: 'INSIGHT ESTRATÉGICO', 
                    color: 'text-amber-600 dark:text-amber-400',
                    bg: 'bg-amber-50 dark:bg-amber-900/20',
                    icon: <Zap className="text-amber-500" size={20} />
                };
        }
    };

    const typeStyles = getTypeDetails(alert.intelligence_type || '');

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
                {/* Backdrop with extreme blur */}
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-slate-900/60 backdrop-blur-2xl"
                />

                {/* Modal Container */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                >
                    {/* Glass header */}
                    <div className="px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-4">
                            <div className={`p-3 rounded-2xl ${typeStyles.bg}`}>
                                <Sparkles className="text-amber-500" size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    Explorar Inteligência Golden
                                </h3>
                                <div className="flex items-center gap-3 mt-1">
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${typeStyles.color}`}>
                                        {typeStyles.label}
                                    </span>
                                    <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Match Score: {Math.round(alert.match_score)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="p-3 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-colors"
                        >
                            <X size={20} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            
                            {/* Left Side: Reasoning & Strategic Plan */}
                            <div className="lg:col-span-12 space-y-8">
                                <section className="p-8 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-[2.5rem] border border-indigo-100 dark:border-indigo-900/30 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5">
                                        <Brain size={120} />
                                    </div>
                                    <div className="flex items-center gap-3 mb-6">
                                        <div className="p-2 bg-indigo-600 text-white rounded-xl">
                                            <MessageSquare size={18} />
                                        </div>
                                        <h4 className="text-sm font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Proposta Estratégica da IA</h4>
                                    </div>
                                    <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-white leading-relaxed tracking-tight italic">
                                        "{alert.reasoning}"
                                    </p>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Clipping Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <FileText className="text-slate-400" size={18} />
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recorte Detectado</h4>
                                        </div>
                                        <div className="p-6 bg-slate-50 dark:bg-slate-950/50 rounded-3xl border border-slate-100 dark:border-slate-800 italic text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
                                            {alert.clipping?.content}
                                            <div className="mt-4 flex items-center gap-2 text-[10px] font-bold uppercase text-slate-400">
                                                <Calendar size={12} /> {new Date(alert.clipping?.captured_at || '').toLocaleDateString('pt-BR')} • {alert.clipping?.source}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Knowledge Basis Section */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
                                            <BookOpen className="text-slate-400" size={18} />
                                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Base de Conhecimento (Tese)</h4>
                                        </div>
                                        <div className="p-6 bg-amber-50/30 dark:bg-amber-900/5 rounded-3xl border border-amber-100/50 dark:border-amber-900/20 text-slate-700 dark:text-slate-300">
                                            <h5 className="font-black text-slate-800 dark:text-white mb-2 uppercase tracking-tight">{alert.knowledge?.title}</h5>
                                            <p className="text-sm leading-relaxed line-clamp-6">
                                                {alert.knowledge?.content}
                                            </p>
                                            <div className="mt-4 flex items-center gap-2">
                                                {alert.knowledge?.tags?.map((tag, idx) => (
                                                    <span key={idx} className="bg-white/50 dark:bg-slate-800 px-2.5 py-1 rounded-lg text-[10px] font-bold text-slate-500 uppercase tracking-wider border border-slate-200 dark:border-slate-700">
                                                        #{tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleMarkAsRead}
                                disabled={isActioning}
                                className="px-6 py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2"
                            >
                                {isActioning ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                                Arquivar Insight
                            </button>
                        </div>

                        <div className="flex items-center gap-3">
                            <button 
                                onClick={handleConvertToTask}
                                disabled={isActioning}
                                className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-600/20 flex items-center gap-3 group disabled:opacity-50"
                            >
                                {isActioning ? <Loader2 size={18} className="animate-spin" /> : (
                                    <>
                                        Converter em Ação Prática
                                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default GoldenDetailModal;
