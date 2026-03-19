import React from 'react';
import { 
    Plus, Search, LayoutGrid, List, Trello, Network, 
    User as UserIcon, Scale, History, Pencil, Upload, Trash2 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Asset, Person, Lawsuit, Credentials } from '@/types';

interface AssetsTabProps {
    t: (key: string, variables?: Record<string, any>) => any;
    credentials: Credentials;
    persons: Person[];
    lawsuits: Lawsuit[];
    loading: boolean;
    assetSearch: string;
    setAssetSearch: (v: string) => void;
    assetStatusFilter: string;
    setAssetStatusFilter: (v: string) => void;
    assetTypeFilter: string;
    setAssetTypeFilter: (v: string) => void;
    assetViewStyle: 'grid' | 'list' | 'kanban';
    setAssetViewStyle: (v: 'grid' | 'list' | 'kanban') => void;
    filteredAssets: Asset[];
    ASSET_STATUSES: string[];
    handleDropAsset: (e: React.DragEvent, status: string) => void;
    handleDragStartAsset: (e: React.DragEvent, id: string) => void;
    handleOpenNexoVisual: (type: 'asset', data: Asset) => void;
    handleOpenHistory: (id: string, type: 'asset', title: string) => void;
    handleSoftDeleteAsset: (id: string) => void;
    setEditingAsset: (a: Partial<Asset>) => void;
    setIsAssetModalOpen: (b: boolean) => void;
    setEditingAssetDoc: (d: any) => void;
    setIsAssetDocModalOpen: (b: boolean) => void;
    renderStatusBadge: (id: string, status: string, type: 'asset', statuses: string[]) => React.ReactNode;
}

export const AssetsTab: React.FC<AssetsTabProps> = ({
    t,
    credentials,
    persons,
    lawsuits,
    loading,
    assetSearch,
    setAssetSearch,
    assetStatusFilter,
    setAssetStatusFilter,
    assetTypeFilter,
    setAssetTypeFilter,
    assetViewStyle,
    setAssetViewStyle,
    filteredAssets,
    ASSET_STATUSES,
    handleDropAsset,
    handleDragStartAsset,
    handleOpenNexoVisual,
    handleOpenHistory,
    handleSoftDeleteAsset,
    setEditingAsset,
    setIsAssetModalOpen,
    setEditingAssetDoc,
    setIsAssetDocModalOpen,
    renderStatusBadge
}) => {
    const renderAssetFilterBar = () => (
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
        </div>
    );

    return (
        <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col h-full space-y-6">
                {/* Header Ativos */}
                <div className="flex flex-col md:flex-row pb-6 mb-2 mt-4 px-8 border-b-4 border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            {t('modules.nexus.assets.title')}
                        </h1>
                        <p className="text-slate-500 font-bold tracking-wide mt-1">
                            {t('modules.nexus.assets.subtitle')}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setAssetViewStyle('grid')}
                                className={`p-2 rounded-lg transition-all ${assetViewStyle === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title={t('common.views.grid')}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setAssetViewStyle('list')}
                                className={`p-2 rounded-lg transition-all ${assetViewStyle === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title={t('common.views.list')}
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setAssetViewStyle('kanban')}
                                className={`p-2 rounded-lg transition-all ${assetViewStyle === 'kanban' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title={t('common.views.kanban')}
                            >
                                <Trello size={18} />
                            </button>
                        </div>
                        <button
                            onClick={() => { setEditingAsset({ status: 'Ativo', asset_type: 'Imóvel' }); setIsAssetModalOpen(true); }}
                            className="bg-slate-800 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-500 dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <Plus size={14} /> {t('modules.nexus.assets.newAsset')}
                        </button>
                    </div>
                </div>

                {/* Tabela Ativos */}
                <div className="flex-1 px-8 pb-8 h-[calc(100vh-280px)]">
                    {renderAssetFilterBar()}
                    <AnimatePresence mode="wait">
                        {assetViewStyle === 'kanban' ? (
                            <motion.div
                                key="asset-kanban"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex gap-6 overflow-x-auto no-scrollbar pb-4"
                            >
                                {ASSET_STATUSES.map(status => (
                                    <div
                                        key={status}
                                        className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4"
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                        onDragLeave={(e) => { (e.currentTarget as HTMLDivElement).classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                        onDrop={(e) => { e.preventDefault(); (e.currentTarget as HTMLDivElement).classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); handleDropAsset(e, status); }}
                                    >
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    status === 'Ativo' ? 'bg-emerald-500' :
                                                    status === 'Vendido' ? 'bg-rose-500' :
                                                    status === 'Bloqueado' ? 'bg-rose-600' : 'bg-amber-500'
                                                }`} />
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{status}</h3>
                                                <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-900 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                                    {filteredAssets.filter(a => a.status === status).length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1 pb-6">
                                            {filteredAssets.filter(a => a.status === status).length === 0 ? (
                                                <div className="py-20 text-center text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">{t('common.empty')}</div>
                                            ) : (
                                                filteredAssets.filter(a => a.status === status).map(asset => {
                                                    const person = persons.find(p => p.id === asset.person_id);
                                                    const lawsuit = lawsuits.find(l => l.id === asset.lawsuit_id);
                                                    return (
                                                        <div
                                                            key={asset.id}
                                                            draggable
                                                            onDragStart={(e) => {
                                                                handleDragStartAsset(e, asset.id);
                                                                (e.currentTarget as HTMLDivElement).classList.add('opacity-50');
                                                            }}
                                                            onDragEnd={(e) => {
                                                                (e.currentTarget as HTMLDivElement).classList.remove('opacity-50');
                                                            }}
                                                            className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                                                            onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                        >
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div className="flex flex-col">
                                                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest truncate">{asset.asset_type}</div>
                                                                    <h4 className="font-bold text-slate-800 dark:text-white text-xs mt-1 line-clamp-1 leading-tight uppercase tracking-tight">{asset.title}</h4>
                                                                </div>
                                                                <div className="flex items-center gap-1.5">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('asset', asset); }}
                                                                        className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                        title={t('modules.nexus.actions.nexoVisual')}
                                                                    >
                                                                        <Network size={12} />
                                                                    </button>
                                                                    {renderStatusBadge(asset.id, asset.status, 'asset', ASSET_STATUSES)}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col gap-2 mb-4">
                                                                {person && (
                                                                    <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                                        <UserIcon size={10} /> <span className="truncate">{person.full_name}</span>
                                                                    </div>
                                                                )}
                                                                {lawsuit && (
                                                                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                                                        <Scale size={10} /> <span className="truncate">{lawsuit.cnj_number || lawsuit.case_title}</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800 mt-auto">
                                                                <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                                    {asset.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value) : '-'}
                                                                </div>
                                                                <div className="flex gap-1 transition-all">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenHistory(asset.id, 'asset', asset.title || 'Sem Título'); }}
                                                                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                        title={t('modules.nexus.processes.historyAnalysis')}
                                                                    >
                                                                        <History size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                    >
                                                                        <Pencil size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : assetViewStyle === 'list' ? (
                            <motion.div
                                key="asset-list"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col h-full"
                            >
                                <div className="overflow-x-auto h-full px-2">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.assets.asset')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.type')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.value')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.assets.link')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('common.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto">
                                            {filteredAssets.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">{t('modules.nexus.empty.assets')}</td>
                                                </tr>
                                            ) : filteredAssets.map((asset) => {
                                                const person = persons.find(p => p.id === asset.person_id);
                                                const lawsuit = lawsuits.find(l => l.id === asset.lawsuit_id);
                                                return (
                                                    <tr key={asset.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                        <td className="px-6 py-4">
                                                            <div className="font-bold text-slate-700 dark:text-slate-200 shrink-0 text-sm">{asset.title}</div>
                                                            {asset.registration_number && <div className="text-[10px] text-slate-400 font-bold mt-0.5">{asset.registration_number}</div>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                                {asset.asset_type}
                                                            </span>
                                                        </td>
                                                        <td className="px-6 py-4 font-bold text-emerald-600 dark:text-emerald-400">
                                                            {asset.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value) : '-'}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            {person && <div className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1"><UserIcon size={10} /> {person.full_name}</div>}
                                                            {lawsuit && <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1"><Scale size={10} /> {lawsuit.cnj_number || lawsuit.case_title}</div>}
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center gap-2">
                                                                {renderStatusBadge(asset.id, asset.status, 'asset', ASSET_STATUSES)}
                                                            </div>
                                                        </td>
                                                        <td className="px-6 py-4">
                                                            <div className="flex items-center justify-end gap-1 transition-all">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('asset', asset); }}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                    title={t('modules.nexus.actions.nexoVisual')}
                                                                >
                                                                    <Network size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenHistory(asset.id, 'asset', asset.title || 'Sem Título'); }}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                    title={t('modules.nexus.processes.historyAnalysis')}
                                                                >
                                                                    <History size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingAsset(asset);
                                                                        setEditingAssetDoc({
                                                                            document_type: 'Matrícula',
                                                                            event_date: new Date().toISOString()
                                                                        });
                                                                        setIsAssetDocModalOpen(true);
                                                                    }}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                    title={t('modules.nexus.modals.assetDocument.title')}
                                                                >
                                                                    <Upload size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                                    className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                >
                                                                    <Pencil size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleSoftDeleteAsset(asset.id)}
                                                                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                                    title={t('common.delete')}
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="asset-grid"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loading ? (
                                        <div className="col-span-full py-20 text-center animate-pulse text-slate-400 font-bold">{t('modules.nexus.empty.assetsSyncing')}</div>
                                    ) : filteredAssets.length === 0 ? (
                                        <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">{t('modules.nexus.empty.assets')}</div>
                                    ) : filteredAssets.map((asset) => {
                                        const person = persons.find(p => p.id === asset.person_id);
                                        const lawsuit = lawsuits.find(l => l.id === asset.lawsuit_id);
                                        return (
                                            <div key={asset.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase tracking-widest">{asset.asset_type}</span>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('asset', asset); }}
                                                            className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                            title={t('modules.nexus.actions.nexoVisual')}
                                                        >
                                                            <Network size={12} />
                                                        </button>
                                                        {renderStatusBadge(asset.id, asset.status, 'asset', ASSET_STATUSES)}
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-2 line-clamp-2 leading-tight">{asset.title}</h3>
                                                {asset.registration_number && <p className="text-[10px] text-slate-400 font-bold mb-4">{asset.registration_number}</p>}

                                                <div className="flex flex-col gap-2 mb-6">
                                                    {person && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-xl">
                                                            <UserIcon size={12} /> <span className="truncate">{person.full_name}</span>
                                                        </div>
                                                    )}
                                                    {lawsuit && (
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2 rounded-xl">
                                                            <Scale size={12} /> <span className="truncate">{lawsuit.cnj_number || lawsuit.case_title}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.assets.estimatedValue')}</span>
                                                        <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                                                            {asset.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(asset.value) : '-'}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenHistory(asset.id, 'asset', asset.title || 'Sem Título'); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title={t('modules.nexus.processes.historyAnalysis')}
                                                        >
                                                            <History size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingAsset(asset);
                                                                setEditingAssetDoc({
                                                                    document_type: 'Matrícula',
                                                                    event_date: new Date().toISOString()
                                                                });
                                                                setIsAssetDocModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                            title={t('modules.nexus.modals.assetDocument.title')}
                                                        >
                                                            <Upload size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingAsset(asset); setIsAssetModalOpen(true); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
