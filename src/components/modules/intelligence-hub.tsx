
import React, { useState, useEffect } from 'react';
import { Credentials, GoldenAlert, Clipping, KnowledgeArticle, User } from '@/types';
import {
    Sparkles, Brain, Zap, Target, ArrowRight, CheckCircle,
    XCircle, Clock, Filter, AlertTriangle, TrendingUp,
    Layout, Search, BookOpen, Scale, FileText, ChevronRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

const IntelligenceHub: React.FC<{ credentials: Credentials; user: User; permissions: any }> = ({ credentials, user, permissions }) => {
    const [alerts, setAlerts] = useState<(GoldenAlert & { clipping?: Clipping, knowledge?: KnowledgeArticle })[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'actioned'>('all');

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

    useEffect(() => {
        fetchAlerts();

        const subscription = supabase
            .channel('golden_alerts_live')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'golden_alerts' }, () => {
                fetchAlerts();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [filter]);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('golden_alerts')
                .select('*, clipping:clippings(*), knowledge:knowledge_articles(*)')
                .order('created_at', { ascending: false });

            if (filter === 'unread') query = query.eq('status', 'unread');
            if (filter === 'actioned') query = query.eq('status', 'actioned');

            const { data, error } = await query;
            if (error) throw error;
            setAlerts(data || []);
        } catch (err: any) {
            console.warn('Intelligence Hub not fully initialized for this database (tables might be missing).', err.message || err.code || '');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (alertId: string, status: 'actioned' | 'dismissed') => {
        try {
            await supabase.from('golden_alerts').update({ status }).eq('id', alertId);
            fetchAlerts();
        } catch (err) {
            console.error('Error updating alert status:', err);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 85) return 'text-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800';
        if (score >= 60) return 'text-amber-500 bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800';
        return 'text-slate-500 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700';
    };

    return (
        <div className="flex flex-col h-full space-y-6 high-density">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-500 text-white p-3 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-amber-900/40">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">INTELLIGENCE HUB</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Insights Proativos & Oportunidades Jurídicas</p>
                    </div>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {(['all', 'unread', 'actioned'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setFilter(t)}
                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === t
                                ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            {t === 'all' ? 'Tudo' : t === 'unread' ? 'Novos' : 'Processados'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-slate-900 text-white p-6 rounded-[2rem] shadow-xl relative overflow-hidden group">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest mb-1">Total Intelligence</p>
                        <h2 className="text-3xl font-black">{alerts.length}</h2>
                        <p className="text-[10px] text-slate-400 font-bold mt-2">Alertas gerados este mês</p>
                    </div>
                    <Sparkles className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:scale-125 transition-transform duration-1000" size={120} />
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Ações Pendentes</p>
                        <h2 className="text-3xl font-black text-slate-800 dark:text-white">{alerts.filter(a => a.status === 'unread').length}</h2>
                    </div>
                    <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl"><Target size={24} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Taxa de Conversão</p>
                        <h2 className="text-3xl font-black text-emerald-600">85%</h2>
                    </div>
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl"><TrendingUp size={24} /></div>
                </div>
            </div>

            {/* Alerts Container */}
            <div className="flex-1 overflow-y-auto pr-2 h-[calc(100vh-320px)] no-scrollbar">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 text-slate-300">
                        <Zap className="animate-spin" size={48} />
                        <p className="text-sm font-black uppercase tracking-widest">Sincronizando Inteligência...</p>
                    </div>
                ) : alerts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center space-y-4 opacity-40">
                        <Brain size={64} className="text-slate-300" />
                        <div className="text-center">
                            <p className="text-sm font-black uppercase tracking-widest">Nenhum Golden Alert</p>
                            <p className="text-[10px] font-bold">Monitore mais termos no Sentinel PRO para gerar insights.</p>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {alerts.map((alert) => (
                            <div
                                key={alert.id}
                                className={`group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border transition-all hover:shadow-2xl hover:scale-[1.01] flex flex-col md:flex-row gap-8 relative overflow-hidden ${alert.status === 'unread' ? 'border-amber-200 dark:border-amber-900/50 shadow-amber-500/5' : 'border-slate-100 dark:border-slate-800 opacity-80'
                                    }`}
                            >
                                {/* Impact Score Badge */}
                                <div className="md:w-32 flex flex-col items-center justify-center gap-3 shrink-0">
                                    <div className={`w-20 h-20 rounded-full flex flex-col items-center justify-center border-2 ${getScoreColor(alert.match_score)} transition-all group-hover:scale-110`}>
                                        <span className="text-2xl font-black">{Math.round(alert.match_score)}</span>
                                        <span className="text-[8px] font-black uppercase tracking-tighter opacity-60">Impacto</span>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${alert.intelligence_type === 'Opportunity' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                        alert.intelligence_type === 'Risk' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                            'bg-indigo-50 text-indigo-600 border-indigo-200'
                                        }`}>
                                        {alert.intelligence_type}
                                    </span>
                                </div>

                                {/* Content Section */}
                                <div className="flex-1 space-y-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest uppercase">
                                            <Scale size={14} className="text-indigo-500" />
                                            Detectado via {alert.clipping?.source || 'Portal Externo'}
                                        </div>
                                        <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">
                                            {alert.clipping?.content ? (alert.clipping.content.length > 120 ? alert.clipping.content.substring(0, 120) + '...' : alert.clipping.content) : 'Publicação sem conteúdo'}
                                        </h3>
                                    </div>

                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 relative">
                                        <Sparkles className="absolute top-4 right-4 text-amber-500 opacity-20" size={24} />
                                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 flex items-center gap-2">
                                            <Brain size={14} /> Raciocínio Estratégico IA
                                        </h4>
                                        <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic">
                                            "{alert.reasoning}"
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-4 pt-2">
                                        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-100 dark:border-indigo-800 transition-all hover:bg-indigo-100">
                                            <BookOpen size={14} />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black uppercase opacity-60">Tese Correlata</span>
                                                <span className="text-[10px] font-bold truncate max-w-[200px]">{alert.knowledge?.title || 'Conhecimento Interno'}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl border border-slate-100 dark:border-slate-700">
                                            <Clock size={14} />
                                            <div className="flex flex-col">
                                                <span className="text-[8px] font-black uppercase opacity-60">Capturado em</span>
                                                <span className="text-[10px] font-bold">{new Date(alert.created_at || '').toLocaleDateString('pt-BR')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions Section */}
                                <div className="md:w-48 flex flex-col gap-3 shrink-0 justify-center">
                                    <button
                                        onClick={() => handleAction(alert.id, 'actioned')}
                                        className="w-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl"
                                    >
                                        <FileText size={16} /> Criar Petição
                                    </button>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleAction(alert.id, 'actioned')}
                                            className="flex-1 bg-emerald-500 text-white py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-emerald-600 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <CheckCircle size={14} /> Validar
                                        </button>
                                        <button
                                            onClick={() => handleAction(alert.id, 'dismissed')}
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 text-slate-400 py-3 rounded-2xl font-black uppercase tracking-widest text-[9px] hover:bg-rose-50 hover:text-rose-500 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            <XCircle size={14} /> Ignorar
                                        </button>
                                    </div>
                                </div>

                                {alert.status === 'unread' && (
                                    <div className="absolute top-0 right-0 w-24 h-24 overflow-hidden pointer-events-none">
                                        <div className="absolute top-2 right-[-24px] rotate-45 bg-amber-500 text-white px-8 py-1 text-[8px] font-black uppercase tracking-widest shadow-xl">Novo</div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default IntelligenceHub;
