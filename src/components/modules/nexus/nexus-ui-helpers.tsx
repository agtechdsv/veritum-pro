import React from 'react';
import { Search, Filter, XCircle } from 'lucide-react';

interface FilterBarProps {
    t: any;
    filterSearchTerm: string;
    setFilterSearchTerm: (v: string) => void;
    filterResponsibleId: string;
    setFilterResponsibleId: (v: string) => void;
    filterLawsuitId: string;
    setFilterLawsuitId: (v: string) => void;
    team: any[];
    lawsuits: any[];
}

export const NexusFilterBar: React.FC<FilterBarProps> = ({
    t, filterSearchTerm, setFilterSearchTerm,
    filterResponsibleId, setFilterResponsibleId,
    filterLawsuitId, setFilterLawsuitId,
    team, lawsuits
}) => (
    <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
        <div className="flex-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder={t('common.placeholders.search')}
                    value={filterSearchTerm}
                    onChange={e => setFilterSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                />
            </div>
        </div>
        <div className="w-48">
            <select
                value={filterResponsibleId}
                onChange={e => setFilterResponsibleId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
            >
                <option value="">👤 {t('common.filters.allMembers')}</option>
                {team.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
        </div>
        <div className="w-64">
            <select
                value={filterLawsuitId}
                onChange={e => setFilterLawsuitId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
            >
                <option value="">⚖️ {t('common.filters.allProcesses')}</option>
                {lawsuits.map(law => <option key={law.id} value={law.id}>{law.cnj_number || law.case_title}</option>)}
            </select>
        </div>
        {(filterSearchTerm || filterResponsibleId || filterLawsuitId) && (
            <button
                onClick={() => { setFilterSearchTerm(''); setFilterResponsibleId(''); setFilterLawsuitId(''); }}
                className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                title={t('common.clearFilters')}
            >
                <Filter size={16} className="relative z-10" />
                <XCircle size={14} className="relative z-10 -ml-1" />
            </button>
        )}
    </div>
);

interface AssetFilterBarProps {
    t: any;
    assetSearch: string;
    setAssetSearch: (v: string) => void;
    assetStatusFilter: string;
    setAssetStatusFilter: (v: string) => void;
    assetTypeFilter: string;
    setAssetTypeFilter: (v: string) => void;
}

export const AssetFilterBar: React.FC<AssetFilterBarProps> = ({
    t, assetSearch, setAssetSearch,
    assetStatusFilter, setAssetStatusFilter,
    assetTypeFilter, setAssetTypeFilter
}) => (
    <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
        <div className="flex-1">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                    type="text"
                    placeholder={t('modules.nexus.assets.searchPlaceholder')}
                    value={assetSearch}
                    onChange={e => setAssetSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                />
            </div>
        </div>
        <div className="w-48">
            <select
                value={assetStatusFilter}
                onChange={e => setAssetStatusFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
            >
                <option value="">🏢 {t('common.filters.allStatuses')}</option>
                {Object.entries(t('common.statuses.asset', { returnObjects: true }) as Record<string, string>).map(([key, val]) => <option key={key} value={val}>{val}</option>)}
            </select>
        </div>
        <div className="w-64">
            <select
                value={assetTypeFilter}
                onChange={e => setAssetTypeFilter(e.target.value)}
                className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
            >
                <option value="">📦 {t('common.filters.allTypes')}</option>
                {Object.entries(t('common.types.asset', { returnObjects: true }) as Record<string, string>).map(([key, val]) => <option key={key} value={val}>{val}</option>)}
            </select>
        </div>
        {(assetSearch || assetStatusFilter || assetTypeFilter) && (
            <button
                onClick={() => { setAssetSearch(''); setAssetStatusFilter(''); setAssetTypeFilter(''); }}
                className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                title={t('common.clearFilters')}
            >
                <Filter size={16} />
                <XCircle size={14} className="-ml-1" />
            </button>
        )}
    </div>
);

export const NexusStatusBadge = ({ id, currentStatus, type, options, setStatusPopover }: any) => {
    const colors: Record<string, string> = {
        'Ativo': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'Suspenso': 'bg-amber-50 text-amber-600 border-amber-100',
        'Arquivado': 'bg-slate-50 text-slate-600 border-slate-100',
        'Incial': 'bg-indigo-50 text-indigo-600 border-indigo-100',
        'Concluído': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'Ativa': 'bg-emerald-50 text-emerald-600 border-emerald-100',
        'Inativa': 'bg-rose-50 text-rose-600 border-rose-100',
        'Baixada': 'bg-slate-50 text-slate-600 border-slate-100',
        'Suspensa': 'bg-amber-50 text-amber-600 border-amber-100'
    };
    return (
        <button
            onClick={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                setStatusPopover({ id, currentStatus, type, options, rect });
            }}
            className={`px-2 py-1 rounded-lg text-[9px] font-black border uppercase tracking-widest transition-all hover:scale-105 active:scale-95 ${colors[currentStatus] || 'bg-slate-50 text-slate-500'}`}
        >
            {currentStatus}
        </button>
    );
};
