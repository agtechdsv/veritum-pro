import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, LockIcon, Save } from 'lucide-react';

interface JustificationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    justificationText: string;
    setJustificationText: (text: string) => void;
    t: any;
}

export const JustificationModal: React.FC<JustificationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    justificationText,
    setJustificationText,
    t
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div key="justification-modal-overlay" className="fixed inset-0 z-[400] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[3rem] shadow-[0_32px_128px_-16px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-10">
                            <div className="flex items-center gap-6 mb-8">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 rounded-[1.5rem] shadow-inner">
                                    <LockIcon size={32} />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter leading-none">
                                        Justificativa
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] mt-2">
                                        Procedimento de Segurança & Auditoria
                                    </p>
                                </div>
                            </div>

                            <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                                Esta alteraçao impacta o status do registro e requer uma breve justificativa para o histórico de auditoria.
                            </p>

                            <textarea
                                value={justificationText}
                                onChange={e => setJustificationText(e.target.value)}
                                className="w-full px-8 py-6 bg-slate-50 dark:bg-slate-950 border-2 border-slate-100 dark:border-slate-800 rounded-[2rem] focus:ring-4 focus:ring-indigo-600/10 focus:border-indigo-600 outline-none transition-all dark:text-white font-bold text-base min-h-[160px] resize-none"
                                placeholder="Descreva o motivo desta alteração..."
                            />

                            <div className="flex gap-4 mt-10">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-[11px]"
                                >
                                    {t('common.cancel')}
                                </button>
                                <button
                                    onClick={onConfirm}
                                    disabled={!justificationText.trim()}
                                    className="flex-[2] px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed text-[11px]"
                                >
                                    <Save size={20} /> Salvar Alteração
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
