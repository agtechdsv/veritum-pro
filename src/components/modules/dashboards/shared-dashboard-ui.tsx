'use client'

import React from 'react';
import { LucideIcon, ChevronRight } from 'lucide-react';

interface CardProps {
    title: string;
    description: string;
    subtitle?: string;
    icon: LucideIcon;
    color: string;
    onClick: () => void;
    isLocked?: boolean;
}

import { Lock } from 'lucide-react';
import { toast } from '../../ui/toast';

export const DashboardCard: React.FC<CardProps> = ({ title, description, subtitle, icon: Icon, color, onClick, isLocked }) => {
    return (
        <button
            onClick={() => {
                if (isLocked) {
                    toast.error('Este módulo não faz parte do seu plano atual.');
                    return;
                }
                onClick();
            }}
            className={`group relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 rounded-[2.5rem] text-left transition-all hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-500/10 hover:border-indigo-500/30 cursor-pointer overflow-hidden ${isLocked ? 'opacity-75 grayscale-[0.5]' : ''}`}
        >
            {/* Background Glow */}
            {!isLocked && <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full opacity-0 group-hover:opacity-10 transition-all duration-700 blur-3xl ${color.replace('text-', 'bg-')}`} />}

            {isLocked && (
                <div className="absolute top-6 right-6 p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-xl animate-in fade-in zoom-in duration-300 z-10" title="Módulo não incluído no seu plano">
                    <Lock size={20} />
                </div>
            )}

            <div className="flex flex-col h-full gap-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover:scale-110 group-hover:rotate-3 shadow-sm ${isLocked ? 'bg-slate-100 text-slate-400' : `${color.replace('text-', 'bg-')}/10 ${color}`}`}>
                    <Icon size={28} />
                </div>

                <div className="flex-1 space-y-2">
                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {title.split(/\b(PRO)\b/i).map((part, i) =>
                            part.toUpperCase() === 'PRO' ? (
                                <span key={i} className="text-branding-gradient">{part}</span>
                            ) : part
                        )}
                    </h3>

                    {subtitle && (
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-500/60 dark:text-indigo-400/40 pb-1">
                            {subtitle}
                        </p>
                    )}

                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400 italic line-clamp-3">
                        {description}
                    </p>
                </div>

                {isLocked && (
                    <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 tracking-widest italic text-center">
                        Este módulo não faz parte do seu plano atual.
                    </p>
                )}

                <div className={`flex items-center gap-2 text-xs font-black uppercase tracking-widest transition-all transform translate-x-[-10px] group-hover:translate-x-0 ${isLocked ? 'text-amber-600' : 'text-indigo-600 dark:text-indigo-400 opacity-0 group-hover:opacity-100'}`}>
                    {isLocked ? 'Adquirir Módulo' : 'Acessar Módulo'} <ChevronRight size={14} />
                </div>
            </div>
        </button>
    );
};
