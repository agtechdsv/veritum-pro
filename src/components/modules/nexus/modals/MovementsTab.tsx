import React from 'react';
import { Search, Loader2, History } from 'lucide-react';
import { Movement } from '@/types';
import { BlockedTabOverlay } from '../nexus-components';

interface MovementsTabProps {
    movements: Movement[];
    isLoading: boolean;
    lawsuitId?: string;
    t: any;
}

export const MovementsTab: React.FC<MovementsTabProps> = ({ movements = [], isLoading, lawsuitId, t }) => {
    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                        {t('modules.nexus.movements.title') || 'Andamentos Inteligentes'}
                    </h4>
                    <p className="text-xs text-slate-500 font-bold">
                        {t('modules.nexus.movements.subtitle') || 'Capturas automatizadas do Sentinel'}
                    </p>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                    <Search size={24} />
                </div>
            </div>

            <div className="relative">
                {!lawsuitId ? (
                    <BlockedTabOverlay message={t('modules.nexus.movements.empty') || 'A gestão de andamentos estará disponível após a criação deste processo.'} />
                ) : isLoading ? (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                        <Loader2 size={48} className="text-indigo-500 mb-4 animate-spin" />
                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">
                            {t('modules.nexus.movements.loading') || 'Buscando andamentos...'}
                        </p>
                    </div>
                ) : movements.length === 0 ? (
                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                        <Search size={48} className="text-slate-300 mb-4" />
                        <p className="text-slate-400 font-bold italic">
                            {t('modules.nexus.movements.empty') || 'Nenhum andamento vinculado.'}
                        </p>
                    </div>
                ) : movements.map((m, idx) => (
                    <div key={m.id} className="relative pl-10 pb-10 group">
                        {idx < movements.length - 1 && (
                            <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors" />
                        )}
                        
                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-2xl z-10 flex items-center justify-center shadow-sm border ${
                            m.sentiment_score && m.sentiment_score > 0.5
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
                                : m.sentiment_score && m.sentiment_score < -0.5
                                ? 'bg-rose-50 border-rose-200 text-rose-600 dark:bg-rose-900/20 dark:border-rose-800'
                                : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800'
                        }`}>
                            <Search size={14} />
                        </div>

                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-900/40">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex gap-2">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full border border-slate-200 dark:border-slate-700">
                                        {m.source}
                                    </span>
                                    {m.sentiment_score !== undefined && (
                                        <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                            m.sentiment_score > 0.5 ? 'bg-emerald-100 text-emerald-700' : m.sentiment_score < -0.5 ? 'bg-rose-100 text-rose-700' : 'bg-blue-100 text-blue-700'
                                        }`}>
                                            AI Sentiment: {(m.sentiment_score * 100).toFixed(0)}%
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] font-bold text-slate-400">
                                    {m.created_at ? new Date(m.created_at).toLocaleString('pt-BR') : 'Agora'}
                                </span>
                            </div>
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed tracking-tight text-justify">
                                {m.translated_text || m.original_text}
                            </p>
                            {m.translated_text && m.original_text && (
                                <details className="mt-4 border-t border-slate-100 dark:border-slate-800 pt-4">
                                    <summary className="text-[10px] text-indigo-600 dark:text-indigo-400 font-black uppercase cursor-pointer hover:underline list-none flex items-center gap-2">
                                        <History size={10} /> {t('modules.nexus.movements.show_original') || 'Ver Texto Original'}
                                    </summary>
                                    <div className="mt-3 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 font-medium leading-relaxed italic">
                                        {m.original_text}
                                    </div>
                                </details>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
