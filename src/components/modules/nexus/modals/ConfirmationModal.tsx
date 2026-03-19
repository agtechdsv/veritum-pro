import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle } from 'lucide-react';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    type?: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
    cancelLabel?: string;
    t?: any;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    type = 'info',
    confirmLabel,
    cancelLabel,
    t
}) => {
    const defaultConfirm = t?.('common.confirm') || 'Confirmar';
    const defaultCancel = t?.('common.cancel') || 'Cancelar';
    return (
        <AnimatePresence>
            {isOpen && (
                <div key="confirm-modal-overlay" className="fixed inset-0 z-[350] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-8 text-center pt-10">
                            <div className={`w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center mb-6 ${
                                type === 'danger' ? 'bg-rose-50 text-rose-500 dark:bg-rose-900/20' :
                                type === 'warning' ? 'bg-amber-50 text-amber-500 dark:bg-amber-900/20' :
                                'bg-indigo-50 text-indigo-500 dark:bg-indigo-900/20'
                            }`}>
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-2">
                                {title}
                            </h3>
                            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-8 px-4 leading-relaxed">
                                {message}
                            </p>

                            <div className="flex gap-4">
                                <button
                                    onClick={onClose}
                                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-[10px]"
                                >
                                    {cancelLabel || defaultCancel}
                                </button>
                                <button
                                    onClick={() => { onConfirm(); onClose(); }}
                                    className={`flex-1 px-8 py-4 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl transition-all text-[10px] ${
                                        type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' :
                                        type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' :
                                        'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
                                    }`}
                                >
                                    {confirmLabel || defaultConfirm}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
