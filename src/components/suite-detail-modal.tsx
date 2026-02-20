'use client'

import React from 'react';
import { X, Check } from 'lucide-react';
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Suite } from '@/types';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    suite: Suite | null;
}

export function SuiteDetailModal({ isOpen, onClose, suite }: Props) {
    const { theme } = useTheme()

    if (!suite) return null;

    // Default to PT for the landing page context
    const lang = 'pt';

    return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] p-0 bg-transparent border-none shadow-none">
                <div className={`relative w-full flex flex-col rounded-[2.5rem] shadow-2xl border overflow-hidden transition-all ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <DialogTitle className="sr-only">{suite.name}</DialogTitle>

                    {/* Header */}
                    <div className="p-8 pb-6 flex items-start justify-between border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-5">
                            <div
                                className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400"
                                dangerouslySetInnerHTML={{ __html: suite.icon_svg }}
                            />
                            <div>
                                <h2 className="text-3xl font-black tracking-tight dark:text-white text-slate-900 leading-none mb-2">
                                    {suite.name}
                                </h2>
                                <p className="text-sm text-branding-gradient font-bold uppercase tracking-wider">
                                    {suite.short_desc[lang] || ''}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                            <X size={24} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                        <div className="space-y-8">
                            {/* Description */}
                            <section>
                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Sobre o Módulo</h3>
                                <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-lg font-medium">
                                    {suite.detailed_desc[lang]}
                                </p>
                            </section>

                            {/* Features */}
                            {suite.features?.[lang] && suite.features[lang].length > 0 && (
                                <section>
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Funcionalidades & Recursos</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {suite.features[lang].map((feature, i) => (
                                            <div key={i} className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 transition-colors">
                                                <div className="w-6 h-6 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                                    <Check size={14} strokeWidth={3} />
                                                </div>
                                                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{feature}</span>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="p-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/30 dark:bg-slate-800/20">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                            <span className="text-[10px] font-black dark:text-slate-400 text-slate-500 uppercase tracking-widest">Módulo Disponível para Ativação</span>
                        </div>
                        <button
                            onClick={onClose}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all uppercase tracking-wider"
                        >
                            Fechar Detalhes
                        </button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
