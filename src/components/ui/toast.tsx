'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info';

interface ToastMessage {
    id: string;
    type: ToastType;
    message: string;
}

// Global state for toast (Simple Singleton Pattern)
type ToastListener = (toasts: ToastMessage[]) => void;
let listeners: ToastListener[] = [];
let toasts: ToastMessage[] = [];

const notify = () => {
    listeners.forEach(l => l([...toasts]));
};

export const toast = {
    success: (msg: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        toasts = [...toasts, { id, type: 'success', message: msg }];
        notify();
        setTimeout(() => toast.dismiss(id), 5000);
    },
    error: (msg: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        toasts = [...toasts, { id, type: 'error', message: msg }];
        notify();
        setTimeout(() => toast.dismiss(id), 6000);
    },
    info: (msg: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        toasts = [...toasts, { id, type: 'info', message: msg }];
        notify();
        setTimeout(() => toast.dismiss(id), 5000);
    },
    dismiss: (id: string) => {
        toasts = toasts.filter(t => t.id !== id);
        notify();
    }
};

export const ToastContainer = () => {
    const [activeToasts, setActiveToasts] = useState<ToastMessage[]>([]);

    useEffect(() => {
        const handleUpdate = (newList: ToastMessage[]) => setActiveToasts(newList);
        listeners.push(handleUpdate);
        return () => {
            listeners = listeners.filter(l => l !== handleUpdate);
        };
    }, []);

    return (
        <div className="fixed top-8 right-8 z-[9999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {activeToasts.map((t) => (
                    <motion.div
                        key={t.id}
                        layout
                        initial={{ opacity: 0, scale: 0.9, x: 50, filter: 'blur(10px)' }}
                        animate={{ opacity: 1, scale: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, scale: 0.8, x: 20, filter: 'blur(4px)', transition: { duration: 0.2 } }}
                        className="pointer-events-auto"
                    >
                        <div className={`
                            min-w-[320px] max-w-[420px] p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-start gap-4 transition-colors
                            ${t.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300' :
                                t.type === 'error' ? 'bg-rose-500/10 border-rose-500/30 text-rose-800 dark:text-rose-300' :
                                    'bg-indigo-500/10 border-indigo-500/30 text-indigo-800 dark:text-indigo-300'}
                        `}>
                            <div className={`mt-0.5 shrink-0 ${t.type === 'success' ? 'text-emerald-500' : t.type === 'error' ? 'text-rose-500' : 'text-indigo-500'}`}>
                                {t.type === 'success' && <CheckCircle2 size={20} />}
                                {t.type === 'error' && <AlertCircle size={20} />}
                                {t.type === 'info' && <Info size={20} />}
                            </div>
                            <div className="flex-1">
                                <p className="text-[11px] font-black uppercase tracking-widest mb-0.5">
                                    {t.type === 'success' ? 'Sucesso!' : t.type === 'error' ? 'Ops! Erro' : 'Informação'}
                                </p>
                                <p className="text-[13px] font-medium leading-snug">{t.message}</p>
                            </div>
                            <button
                                onClick={() => toast.dismiss(t.id)}
                                className="shrink-0 p-1 hover:bg-black/5 dark:hover:bg-white/5 rounded-lg transition-colors"
                            >
                                <X size={16} className="opacity-40 hover:opacity-100 transition-opacity" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
