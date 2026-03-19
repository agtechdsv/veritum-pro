import React from 'react';
import { motion } from 'framer-motion';
import { Scale, Clock, CheckCircle2, TrendingUp, Filter, Zap, Loader2, Wallet, Landmark, BarChart3, PieChart, TrendingDown } from 'lucide-react';
import Link from 'next/link';
import IntelligenceWidget from '@/components/shared/intelligence-widget';

interface OverviewTabProps {
    t: any;
    locale: string;
    loading: boolean;
    lawsuits: any[];
    tasks: any[];
    assets: any[];
    financialStats: any;
    financeStartDate: string;
    setFinanceStartDate: (val: string) => void;
    financeEndDate: string;
    setFinanceEndDate: (val: string) => void;
    fetchAll: () => void;
    credentials: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
    t, locale, loading, lawsuits, tasks, assets, financialStats,
    financeStartDate, setFinanceStartDate, financeEndDate, setFinanceEndDate,
    fetchAll, credentials
}) => {
    return (
        <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col h-full space-y-8 p-8">
                {/* Header Overview */}
                <div className="flex flex-col md:flex-row pb-6 border-b-4 border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            {t('modules.nexus.tabs.overview')}
                        </h1>
                        <p className="text-slate-500 font-bold tracking-wide mt-1 italic">
                            {t('modules.nexus.overview.subtitle')}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-2xl flex items-center gap-3">
                            <div className={`w-2 h-2 rounded-full ${loading ? 'bg-amber-500 animate-ping' : 'bg-indigo-600 animate-pulse'}`} />
                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">
                                {t('modules.nexus.overview.status.label')}: {loading ? t('modules.nexus.overview.status.syncing') : t('modules.nexus.overview.status.synced')}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Cockpit Visual - KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { 
                            label: t('modules.nexus.metrics.active'), 
                            val: lawsuits.filter(l => l.status === 'Ativo').length, 
                            color: 'text-indigo-600', 
                            bg: 'bg-indigo-50 dark:bg-indigo-900/30',
                            icon: Scale, 
                            trend: '+12%' 
                        },
                        { 
                            label: t('modules.nexus.metrics.deadlines'), 
                            val: tasks.filter(t => t.status !== 'Concluído' && (new Date(t.due_date).getTime() - new Date().getTime()) < 86400000).length, 
                            color: 'text-rose-600', 
                            bg: 'bg-rose-50 dark:bg-rose-900/30',
                            icon: Clock, 
                            trend: t('modules.nexus.overview.metricsTrends.urgent')
                        },
                        { 
                            label: t('modules.nexus.metrics.pending'), 
                            val: tasks.filter(t => t.status !== 'Concluído').length, 
                            color: 'text-amber-600', 
                            bg: 'bg-amber-50 dark:bg-amber-900/30',
                            icon: CheckCircle2, 
                            trend: t('modules.nexus.overview.metricsTrends.queue')
                        },
                        { 
                            label: t('modules.nexus.metrics.completion'), 
                            val: `${tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Concluído').length / tasks.length) * 100) : 0}%`, 
                            color: 'text-emerald-600', 
                            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                            icon: TrendingUp, 
                            trend: t('modules.nexus.overview.metricsTrends.productivity')
                        }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-slate-800/50 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-indigo-500/10 transition-colors" />
                            
                            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                <stat.icon size={28} />
                            </div>
                            
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className={`text-4xl font-black tracking-tighter mb-2 ${stat.color}`}>
                                        {loading ? (
                                            <motion.div 
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="h-10 w-16 bg-slate-100 dark:bg-slate-800 rounded-xl"
                                            />
                                        ) : stat.val}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {stat.label}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`text-[10px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl border ${
                                        stat.trend.includes('+') ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                        stat.trend === 'Urgente' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                        'bg-slate-50 text-slate-500 border-slate-100'
                                    }`}>
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Financial Filter Bar */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-white/50 dark:bg-slate-900/50 p-6 px-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 backdrop-blur-xl">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                            <Filter size={20} />
                        </div>
                        <div>
                            <h3 className="text-sm font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('modules.nexus.finance.filtersTitle') || 'Filtros Financeiros'}</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest leading-none mt-1">{t('modules.nexus.finance.filtersSubtitle') || 'Ajuste o período para análise de performance'}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-4">
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.dateRange.start') || 'Início'}</span>
                            <input 
                                type="date" 
                                value={financeStartDate}
                                onChange={(e) => setFinanceStartDate(e.target.value)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white"
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">{t('common.dateRange.end') || 'Fim'}</span>
                            <input 
                                type="date" 
                                value={financeEndDate}
                                onChange={(e) => setFinanceEndDate(e.target.value)}
                                className="px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all dark:text-white"
                            />
                        </div>
                        <button 
                            onClick={fetchAll}
                            disabled={loading}
                            className="h-10 mt-5 px-6 bg-indigo-600 hover:bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50 group hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} className="group-hover:animate-pulse" />} 
                            {t('common.apply') || 'Aplicar'}
                        </button>
                    </div>
                </div>

                {/* Financial Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { 
                            label: t('modules.nexus.finance.fees'), 
                            val: `${locale === 'en' ? '$' : 'R$'} ${financialStats.totalCredits.toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                            color: 'text-emerald-600', 
                            bg: 'bg-emerald-50 dark:bg-emerald-900/30',
                            icon: Wallet, 
                            trend: t('modules.nexus.overview.metricsTrends.revenue')
                        },
                        { 
                            label: t('modules.nexus.finance.costs'), 
                            val: `${locale === 'en' ? '$' : 'R$'} ${financialStats.totalDebits.toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                            color: 'text-rose-600', 
                            bg: 'bg-rose-50 dark:bg-rose-900/30',
                            icon: TrendingDown, 
                            trend: t('modules.nexus.overview.metricsTrends.expenses')
                        },
                        { 
                            label: t('modules.nexus.finance.balance'), 
                            val: `${locale === 'en' ? '$' : 'R$'} ${financialStats.balance.toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 
                            color: 'text-indigo-600', 
                            bg: 'bg-indigo-50 dark:bg-indigo-900/30',
                            icon: Landmark, 
                            trend: t('modules.nexus.overview.metricsTrends.net')
                        },
                        { 
                            label: t('modules.nexus.finance.roi'), 
                            val: financialStats.totalDebits > 0 ? `${((financialStats.balance / financialStats.totalDebits) * 100).toLocaleString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}%` : '--%', 
                            color: 'text-amber-600', 
                            bg: 'bg-amber-50 dark:bg-amber-900/30',
                            icon: BarChart3, 
                            trend: t('modules.nexus.overview.metricsTrends.performance')
                        }
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-none hover:-translate-y-2 transition-all duration-500 group relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-slate-100 dark:bg-slate-800/50 blur-3xl -mr-16 -mt-16 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
                            
                            <div className={`w-14 h-14 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform`}>
                                <stat.icon size={28} />
                            </div>
                            
                            <div className="flex items-end justify-between">
                                <div>
                                    <div className={`text-3xl font-black tracking-tighter mb-2 ${stat.color}`}>
                                        {loading ? (
                                            <motion.div 
                                                animate={{ opacity: [0.3, 0.6, 0.3] }}
                                                transition={{ duration: 1.5, repeat: Infinity }}
                                                className="h-9 w-24 bg-slate-100 dark:bg-slate-800 rounded-xl"
                                            />
                                        ) : stat.val}
                                    </div>
                                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        {stat.label}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[9px] font-black uppercase tracking-tight px-3 py-1.5 rounded-xl border bg-slate-50 text-slate-500 border-slate-100">
                                        {stat.trend}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Insights AI - Premium Widget */}
                    <div className="lg:col-span-2 space-y-6">
                        <IntelligenceWidget credentials={credentials} moduleContext="Estratégico / Nexus" limit={3} />
                        
                        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl p-8">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                                    <PieChart className="text-indigo-600" size={20} /> {t('modules.nexus.overview.assetDistribution')}
                                </h3>
                                <Link href="/veritumpro/nexus?tab=ativos" className="text-xs font-bold text-indigo-600 hover:underline uppercase tracking-widest">{t('common.viewAll')}</Link>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {['Imóvel', 'Veículo', 'Empresa / Quotas', 'Outros'].map((type, i) => {
                                    const count = assets.filter(a => a.asset_type === type).length;
                                    const typeLabel = type === 'Imóvel' ? t('modules.nexus.assets.types.RealEstate') :
                                                    type === 'Veículo' ? t('modules.nexus.assets.types.Vehicle') :
                                                    type === 'Empresa / Quotas' ? t('modules.nexus.assets.types.Corporate') :
                                                    t('modules.nexus.assets.types.Others');
                                    return (
                                        <div key={i} className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-white/5 transition-all hover:bg-white dark:hover:bg-slate-800 shadow-sm hover:shadow-md">
                                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 truncate">{typeLabel}</div>
                                            <div className="text-2xl font-black text-slate-800 dark:text-white">{count}</div>
                                            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-3 overflow-hidden">
                                                <motion.div 
                                                    className={`h-full ${i % 2 === 0 ? 'bg-indigo-600' : 'bg-emerald-600'}`}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${Math.min(100, (count / (assets.length || 1)) * 100)}%` }}
                                                    transition={{ duration: 1, delay: i * 0.1 }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Timeline / Recent Activity Placeholder or side widget */}
                    <div className="space-y-6">
                         {/* Here we could put a general timeline or summary */}
                    </div>
                </div>
            </div>
        </div>
    );
};
