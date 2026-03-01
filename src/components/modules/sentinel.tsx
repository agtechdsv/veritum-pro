
import React, { useState, useEffect } from 'react';
import { Credentials, MonitoringAlert, Clipping, Lawsuit, User } from '@/types';
import {
    Search, Plus, AlertCircle, TrendingUp, TrendingDown, Minus,
    Shield, Activity, Bell, Filter, MoreHorizontal, ExternalLink,
    CheckCircle2, XCircle, Clock, Database, Brain, Sparkles, Pencil,
    ToggleLeft, ToggleRight, Trash2, Link as LinkIcon, ArrowRight
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { GeminiService } from '@/services/gemini';
import { useTranslation } from '@/contexts/language-context';

const Sentinel: React.FC<{ credentials: Credentials; user: User; permissions: any }> = ({ credentials, user, permissions }) => {
    const { t } = useTranslation();
    const [alerts, setAlerts] = useState<MonitoringAlert[]>([]);
    const [clippings, setClippings] = useState<Clipping[]>([]);
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // UI State
    const [isAlertModalOpen, setIsAlertModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
    const [selectedClipping, setSelectedClipping] = useState<Clipping | null>(null);
    const [editingAlert, setEditingAlert] = useState<Partial<MonitoringAlert> | null>(null);
    const [analyzingId, setAnalyzingId] = useState<string | null>(null);
    const [matchingId, setMatchingId] = useState<string | null>(null);

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [alertsRes, clippingsRes, lawsuitsRes] = await Promise.all([
                supabase.from('monitoring_alerts').select('*').order('created_at', { ascending: false }),
                supabase.from('clippings').select('*').order('captured_at', { ascending: false }),
                supabase.from('lawsuits').select('*')
            ]);
            setAlerts(alertsRes.data || []);
            setClippings(clippingsRes.data || []);
            setLawsuits(lawsuitsRes.data || []);
        } catch (err) {
            console.error('Error fetching Sentinel data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingAlert?.id) {
                const { error } = await supabase.from('monitoring_alerts').update(editingAlert).eq('id', editingAlert.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('monitoring_alerts').insert([editingAlert]);
                if (error) throw error;
            }
            setIsAlertModalOpen(false);
            setEditingAlert(null);
            fetchData();
        } catch (err) {
            console.error('Error saving alert:', err);
        }
    };

    const handleRunAI = async (clipping: Clipping) => {
        setAnalyzingId(clipping.id);
        try {
            const gemini = new GeminiService(credentials.geminiKey);
            const result = await gemini.analyzeSentiment(clipping.content);

            if (result.sentiment) {
                const { error } = await supabase
                    .from('clippings')
                    .update({
                        sentiment: result.sentiment.charAt(0).toUpperCase() + result.sentiment.slice(1).toLowerCase(),
                        score: result.score
                    })
                    .eq('id', clipping.id);
                if (error) throw error;
                fetchData();
            }
        } catch (err) {
            console.error('AI Analysis failed:', err);
        } finally {
            setAnalyzingId(null);
        }
    };

    const handleRunIntelligence = async (clipping: Clipping) => {
        setMatchingId(clipping.id);
        try {
            const gemini = new GeminiService(credentials.geminiKey);
            await gemini.runGoldenIntelligence(clipping.id);
            // After matching, we can show a success toast or just refresh
            fetchData();
        } catch (err) {
            console.error('Golden Intelligence failed:', err);
        } finally {
            setMatchingId(null);
        }
    };

    const handleLinkToNexus = async (lawsuitId: string) => {
        if (!selectedClipping) return;
        try {
            const { error: clipError } = await supabase
                .from('clippings')
                .update({ lawsuit_id: lawsuitId })
                .eq('id', selectedClipping.id);
            if (clipError) throw clipError;

            // Also create a movement in Nexus
            const { error: moveError } = await supabase
                .from('movements')
                .insert([{
                    lawsuit_id: lawsuitId,
                    description: `[SENTINEL PRO] Nova publicação capturada: ${selectedClipping.source}`,
                    content: selectedClipping.content,
                    movement_date: new Date().toISOString()
                }]);
            if (moveError) throw moveError;

            setIsLinkModalOpen(false);
            setSelectedClipping(null);
            fetchData();
        } catch (err) {
            console.error('Error linking to Nexus:', err);
        }
    };

    const toggleAlertStatus = async (alert: MonitoringAlert) => {
        try {
            const { error } = await supabase
                .from('monitoring_alerts')
                .update({ is_active: !alert.is_active })
                .eq('id', alert.id);
            if (error) throw error;
            fetchData();
        } catch (err) {
            console.error('Error toggling alert status:', err);
        }
    };

    const filteredClippings = clippings.filter(c =>
        c.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.source?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const positiveCount = clippings.filter(c => c.sentiment === 'Positivo').length;
    const negativeCount = clippings.filter(c => c.sentiment === 'Negativo').length;
    const totalSentiment = clippings.length > 0 ? Math.round((positiveCount / clippings.length) * 100) : 0;

    return (
        <div className="flex flex-col h-full space-y-6 high-density">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-600 text-white p-3 rounded-2xl shadow-lg shadow-rose-200 dark:shadow-rose-900/40">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">SENTINEL PRO</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('modules.sentinel.subtitle')}</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingAlert({ is_active: true, alert_type: 'Keyword' }); setIsAlertModalOpen(true); }}
                    className="bg-rose-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-rose-700 transition-all shadow-lg shadow-rose-600/20 active:scale-95"
                >
                    <Plus size={18} /> {t('modules.sentinel.newMonitor')}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.sentinel.metrics.active')}</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{alerts.filter(a => a.is_active).length}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl"><Bell size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t('modules.sentinel.metrics.risks')}</p>
                        <p className="text-2xl font-black text-rose-600">{negativeCount}</p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl"><TrendingDown size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('modules.sentinel.metrics.score')}</p>
                        <p className="text-2xl font-black text-emerald-600">{totalSentiment}%</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><TrendingUp size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.sentinel.metrics.captures')}</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{clippings.length}</p>
                    </div>
                    <div className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-xl"><Database size={20} /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Side: Active Monitoring List */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Activity size={14} className="text-rose-500" />
                            {t('modules.sentinel.list.title')}
                        </h3>
                    </div>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold">{t('modules.sentinel.list.loading')}</div>
                        ) : alerts.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-bold bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                                {t('modules.sentinel.list.empty')}
                            </div>
                        ) : alerts.map(alert => (
                            <div key={alert.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-rose-300 dark:hover:border-rose-700 transition-all group">
                                <div className="flex items-start justify-between mb-2">
                                    <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-[9px] font-black text-slate-500 dark:text-slate-400 rounded-lg uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                        {alert.alert_type}
                                    </span>
                                    <button
                                        onClick={() => toggleAlertStatus(alert)}
                                        className={`transition-colors ${alert.is_active ? 'text-emerald-500' : 'text-slate-300'}`}
                                    >
                                        {alert.is_active ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                                    </button>
                                </div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{alert.title}</h4>
                                <p className="text-xs text-slate-400 font-medium font-mono truncate">{alert.term}</p>

                                <div className="mt-3 pt-3 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        onClick={() => { setEditingAlert(alert); setIsAlertModalOpen(true); }}
                                        className="text-[10px] font-black uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:underline"
                                    >
                                        <Pencil size={12} /> {t('modules.sentinel.table.tooltips.edit')}
                                    </button>
                                    <span className="text-[10px] font-bold text-slate-300 italic">{t('modules.sentinel.list.capturing')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Clippings Table */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                    <div className="flex items-center justify-between px-2">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <Database size={14} className="text-indigo-500" />
                            {t('modules.sentinel.table.title')}
                        </h3>
                        <div className="flex items-center gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={14} />
                                <input
                                    placeholder={t('modules.sentinel.table.filterPlaceholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-rose-500 dark:text-white"
                                />
                            </div>
                            <button className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-400 hover:text-rose-500 transition-colors">
                                <Filter size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex-1 flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4">{t('modules.sentinel.table.headers.statusIA')}</th>
                                        <th className="px-6 py-4">{t('modules.sentinel.table.headers.source')}</th>
                                        <th className="px-6 py-4">{t('modules.sentinel.table.headers.fragment')}</th>
                                        <th className="px-6 py-4">{t('modules.sentinel.table.headers.date')}</th>
                                        <th className="px-6 py-4 text-center">{t('modules.sentinel.table.headers.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {loading ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-bold animate-shimmer">{t('modules.sentinel.table.loading')}</td></tr>
                                    ) : filteredClippings.length === 0 ? (
                                        <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-400 text-xs font-bold">{t('modules.sentinel.table.empty')}</td></tr>
                                    ) : filteredClippings.map(clipping => (
                                        <tr key={clipping.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1 items-start">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${clipping.sentiment === 'Positivo' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-100 dark:border-emerald-800' :
                                                        clipping.sentiment === 'Negativo' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100 dark:border-rose-800' :
                                                            'bg-slate-100 dark:bg-slate-800 text-slate-500 border-slate-200 dark:border-slate-700'
                                                        }`}>
                                                        {clipping.sentiment === 'Positivo' ? <TrendingUp size={12} /> : clipping.sentiment === 'Negativo' ? <TrendingDown size={12} /> : <Minus size={12} />}
                                                        {clipping.sentiment === 'Positivo' ? t('modules.sentinel.table.sentiment.positive') :
                                                            clipping.sentiment === 'Negativo' ? t('modules.sentinel.table.sentiment.negative') :
                                                                t('modules.sentinel.table.sentiment.neutral')}
                                                    </span>
                                                    {clipping.score && (
                                                        <div className="flex items-center gap-1 text-[9px] font-black text-slate-400 ml-1">
                                                            <Brain size={10} className="text-indigo-500" />
                                                            {t('modules.sentinel.table.scoreIA', { score: Math.round(clipping.score * 100) })}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-slate-800 dark:text-white mb-0.5">{clipping.source || 'Portal Jurídico'}</p>
                                                <p className="text-[10px] text-slate-400 font-bold">{alerts.find(a => a.id === clipping.alert_id)?.title || 'Termo Externo'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-xs font-medium">
                                                    {clipping.content}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-[11px] text-slate-500 dark:text-slate-400 font-mono font-bold whitespace-nowrap">
                                                {new Date(clipping.captured_at || '').toLocaleDateString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        onClick={() => handleRunIntelligence(clipping)}
                                                        disabled={matchingId === clipping.id}
                                                        title={t('modules.sentinel.table.tooltips.golden')}
                                                        className={`p-2 rounded-xl transition-all ${matchingId === clipping.id ? 'animate-pulse text-amber-500' :
                                                            'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/40'
                                                            }`}
                                                    >
                                                        <Sparkles size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (clipping.sentiment === 'Neutro' || !clipping.sentiment) {
                                                                handleRunAI(clipping);
                                                            }
                                                        }}
                                                        disabled={analyzingId === clipping.id}
                                                        title={t('modules.sentinel.table.tooltips.analyze')}
                                                        className={`p-2 rounded-xl transition-all ${analyzingId === clipping.id ? 'animate-pulse text-indigo-500' :
                                                            'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40'
                                                            }`}
                                                    >
                                                        <Brain size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => { setSelectedClipping(clipping); setIsLinkModalOpen(true); }}
                                                        title={t('modules.sentinel.table.tooltips.link')}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                    >
                                                        <LinkIcon size={16} />
                                                    </button>
                                                    <button
                                                        title={t('modules.sentinel.table.tooltips.view')}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all"
                                                    >
                                                        <ExternalLink size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Link to Nexus Modal */}
            {isLinkModalOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.sentinel.modals.link.title')}</h3>
                                <p className="text-xs text-slate-500 font-medium">{t('modules.sentinel.modals.link.subtitle')}</p>
                            </div>
                            <button onClick={() => setIsLinkModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="p-8 space-y-4">
                            <div className="space-y-3 max-h-[40vh] overflow-y-auto no-scrollbar pr-2">
                                {lawsuits.length === 0 ? (
                                    <p className="text-center py-4 text-slate-400 text-xs font-bold">{t('modules.sentinel.modals.link.empty')}</p>
                                ) : lawsuits.map(law => (
                                    <button
                                        key={law.id}
                                        onClick={() => handleLinkToNexus(law.id)}
                                        className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700 rounded-2xl hover:border-indigo-500 hover:bg-white dark:hover:bg-slate-800 transition-all group"
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-black text-slate-800 dark:text-white uppercase tracking-widest">{law.cnj_number}</span>
                                            <ArrowRight size={14} className="text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium truncate mt-1">{law.case_title || t('modules.sentinel.modals.link.noTitle')}</p>
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => setIsLinkModalOpen(false)}
                                className="w-full px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
                            >
                                {t('modules.sentinel.modals.link.cancel')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Alert Modal */}
            {isAlertModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.sentinel.modals.config.title')}</h3>
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1"><Sparkles size={12} className="text-rose-500" /> {t('modules.sentinel.modals.config.subtitle')}</p>
                            </div>
                            <button onClick={() => setIsAlertModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAlert} className="p-8 space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.sentinel.modals.config.labelTitle')}</label>
                                <input
                                    required
                                    value={editingAlert?.title || ''}
                                    onChange={e => setEditingAlert({ ...editingAlert, title: e.target.value })}
                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-white font-bold"
                                    placeholder={t('modules.sentinel.modals.config.placeholderTitle')}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.sentinel.modals.config.labelType')}</label>
                                    <select
                                        required
                                        value={editingAlert?.alert_type || ''}
                                        onChange={e => setEditingAlert({ ...editingAlert, alert_type: e.target.value as any })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none text-slate-800 dark:text-white font-bold"
                                    >
                                        <option value="Keyword">{t('modules.sentinel.modals.config.types.Keyword')}</option>
                                        <option value="OAB">{t('modules.sentinel.modals.config.types.OAB')}</option>
                                        <option value="CNJ">{t('modules.sentinel.modals.config.types.CNJ')}</option>
                                        <option value="Company">{t('modules.sentinel.modals.config.types.Company')}</option>
                                        <option value="Person">{t('modules.sentinel.modals.config.types.Person')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.sentinel.modals.config.labelTerm')}</label>
                                    <input
                                        required
                                        value={editingAlert?.term || ''}
                                        onChange={e => setEditingAlert({ ...editingAlert, term: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-rose-500 outline-none transition-all dark:text-white font-mono font-bold"
                                        placeholder={t('modules.sentinel.modals.config.placeholderTerm')}
                                    />
                                </div>
                            </div>

                            <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex items-start gap-3">
                                <AlertCircle className="text-rose-500 shrink-0 mt-0.5" size={18} />
                                <p className="text-[10px] text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
                                    {t('modules.sentinel.modals.config.footer')}
                                </p>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsAlertModalOpen(false)} className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">{t('modules.sentinel.modals.config.discard')}</button>
                                <button type="submit" className="flex-[2] px-8 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-rose-700 shadow-xl shadow-rose-600/30 transition-all flex items-center justify-center gap-2">
                                    <Activity size={20} /> {t('modules.sentinel.modals.config.start')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Sentinel;
