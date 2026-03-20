
import React, { useState, useEffect } from 'react';
import { Credentials, GoldenAlert, Clipping, KnowledgeArticle } from '@/types';
import {
    Zap, Sparkles, Brain, ChevronDown, ChevronUp,
    AlertCircle, Info, TrendingUp, ArrowRight,
    Scale, BookOpen, Clock
} from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';
import { listGoldenAlerts } from '@/app/actions/intelligence-actions';
import GoldenDetailModal from './golden-detail-modal';

interface Props {
    credentials: Credentials;
    limit?: number;
    moduleContext?: string;
    targetUserId?: string;
    onActionComplete?: () => void;
}

const IntelligenceWidget: React.FC<Props> = ({ credentials, limit = 3, moduleContext, targetUserId, onActionComplete }) => {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState<(GoldenAlert & { clipping?: Clipping, knowledge?: KnowledgeArticle })[]>([]);
    const [loading, setLoading] = useState(true);
    const [expandedAlertaId, setExpandedAlertaId] = useState<string | null>(null);
    const [selectedDetailAlert, setSelectedDetailAlert] = useState<(GoldenAlert & { clipping?: Clipping, knowledge?: KnowledgeArticle }) | null>(null);

    // Defensive check: If no credentials provided (BYODB not set), don't crash
    if (!credentials?.supabaseUrl) return null;

    useEffect(() => {
        fetchTopAlerts();
    }, [targetUserId]);

    const fetchTopAlerts = async () => {
        setLoading(true);
        try {
            const { data, error } = await listGoldenAlerts({
                status: 'unread',
                limit,
                targetUserId
            });

            if (error) throw new Error(error);
            setAlerts(data || []);
            setLoading(false);
        } catch (err: any) {
            console.warn('Intelligence Module not fully initialized for this database (tables might be missing).', err.message || err.code || '');
            setLoading(false);
        }
    };

    const getPriorityStyles = (priority: string | undefined, type: string) => {
        // Natureza do Alerta (Cor)
        if (type === 'Risk') return {
            bg: 'bg-rose-50 dark:bg-rose-900/20',
            border: 'border-rose-200 dark:border-rose-800',
            text: 'text-rose-600 dark:text-rose-400',
            icon: <AlertCircle className="text-rose-500" size={18} />,
            label: t('common.intelligenceWidget.urgencyRisk') || 'URGÊNCIA / RISCO'
        };

        if (type === 'Opportunity') return {
            bg: 'bg-indigo-50 dark:bg-indigo-900/20',
            border: 'border-indigo-200 dark:border-indigo-800',
            text: 'text-indigo-600 dark:text-indigo-400',
            icon: <TrendingUp className="text-indigo-500" size={18} />,
            label: t('common.intelligenceWidget.trendOpportunity') || 'TENDÊNCIA / OPORTUNIDADE'
        };

        // Fallback for others (Similar Success, etc.)
        return {
            bg: 'bg-amber-50 dark:bg-amber-900/20',
            border: 'border-amber-200 dark:border-amber-800',
            text: 'text-amber-600 dark:text-amber-400',
            icon: <Zap className="text-amber-500" size={18} />,
            label: t('common.intelligenceWidget.attention') || 'INSIGHT ESTRATÉGICO'
        };
    };

    if (loading) return (
        <div className="w-full h-32 flex items-center justify-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-slate-400 animate-pulse">
                <Brain size={20} className="animate-bounce" />
                <span className="text-xs font-black uppercase tracking-widest">{t('common.intelligenceWidget.loading')}</span>
            </div>
        </div>
    );

    if (alerts.length === 0) return null;

    return (
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className="flex items-center justify-between px-2">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                    <Sparkles size={14} className="text-amber-500" /> Golden Alerts Intelligence
                </h3>
                {moduleContext && (
                    <span className="text-[10px] font-bold text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1 rounded-full border border-indigo-100 dark:border-indigo-800">
                        {t('common.context')}: {moduleContext}
                    </span>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {alerts.map((alert) => {
                    const styles = getPriorityStyles(alert.priority, alert.intelligence_type);
                    const isExpanded = expandedAlertaId === alert.id;

                    return (
                        <div
                            key={alert.id}
                            className={`relative group bg-white dark:bg-slate-900 rounded-[2.5rem] border ${styles.border} shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]`}
                        >
                            {/* Priority Header */}
                            <div className={`px-6 py-3 border-b ${styles.border} ${styles.bg} flex items-center justify-between`}>
                                <div className="flex items-center gap-2">
                                    {styles.icon}
                                    <span className={`text-[9px] font-black uppercase tracking-widest ${styles.text}`}>{styles.label}</span>
                                </div>
                                <div className="flex items-center gap-1.5 bg-white/50 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-white/20">
                                    <Zap size={10} className="text-amber-500" />
                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-300">{Math.round(alert.match_score)}%</span>
                                </div>
                            </div>

                            {/* Main Content */}
                            <div className="p-6 space-y-4">
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-[8px] font-bold text-slate-400 uppercase tracking-tight">
                                        <Scale size={12} /> {t('common.intelligenceWidget.detectedIn')} {alert.clipping?.source || t('common.intelligenceWidget.publication')}
                                    </div>
                                    <h4 className="text-sm font-black text-slate-800 dark:text-white leading-tight line-clamp-2 min-h-[2.5rem]">
                                        {alert.clipping?.content || t('common.intelligenceWidget.noTitle')}
                                    </h4>
                                </div>

                                {/* Progressive Disclosure Area */}
                                <div className="space-y-3">
                                    <button
                                        onClick={() => setExpandedAlertaId(isExpanded ? null : alert.id)}
                                        className="w-full flex items-center justify-between text-[9px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-colors py-1"
                                    >
                                        {isExpanded ? t('common.intelligenceWidget.hideReasoning') : t('common.intelligenceWidget.showReasoning')}
                                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                    </button>

                                    {isExpanded && (
                                        <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2 duration-300">
                                            <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed italic">
                                                "{alert.reasoning}"
                                            </p>

                                            {alert.knowledge && (
                                                <div className="mt-3 pt-3 border-t border-slate-200/50 dark:border-slate-800 flex items-center gap-2">
                                                    <BookOpen size={12} className="text-amber-500" />
                                                    <span className="text-[9px] font-bold text-slate-500 truncate">{alert.knowledge.title}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* Action Bar */}
                                <div className="flex items-center gap-2 pt-2 border-t border-slate-50 dark:border-slate-800">
                                    <button 
                                        onClick={() => setSelectedDetailAlert(alert)}
                                        className="flex-1 bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-1.5 shadow-lg"
                                    >
                                        {t('common.intelligenceWidget.explore') || 'Explorar'} <ArrowRight size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* Time Badge */}
                            <div className="absolute top-12 right-6 opacity-10 pointer-events-none group-hover:opacity-30 transition-opacity">
                                <Clock size={48} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {selectedDetailAlert && (
                <GoldenDetailModal 
                    isOpen={!!selectedDetailAlert}
                    onClose={() => setSelectedDetailAlert(null)}
                    alert={selectedDetailAlert}
                    onActionComplete={() => {
                        fetchTopAlerts();
                        if (onActionComplete) onActionComplete();
                    }}
                />
            )}
        </div>
    );
};

export default IntelligenceWidget;
