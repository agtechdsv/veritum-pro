import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    LayoutGrid, List, Trello, Plus, History, Pencil, Trash2, 
    Network, Zap, Shield, Upload, Search, Filter, XCircle, 
    User as UserIcon, Scale, ChevronRight
} from 'lucide-react';
import { Lawsuit, TeamMember, Person } from '@/types';

interface LawsuitsTabProps {
    t: any;
    locale: string;
    lawsuits: Lawsuit[];
    filteredLawsuits: Lawsuit[];
    processViewStyle: 'grid' | 'list' | 'kanban';
    setProcessViewStyle: (val: 'grid' | 'list' | 'kanban') => void;
    lawsuitSearch: string;
    setLawsuitSearch: (val: string) => void;
    lawsuitStatusFilter: string;
    setLawsuitStatusFilter: (val: string) => void;
    lawsuitLawyerFilter: string;
    setLawsuitLawyerFilter: (val: string) => void;
    team: TeamMember[];
    persons: Person[];
    loading: boolean;
    LAWSUIT_STATUSES: string[];
    handleDropLawsuit: (e: React.DragEvent, status: string) => void;
    handleDragStartLawsuit: (e: React.DragEvent, id: string) => void;
    handleOpenHistory: (id: string, type: 'lawsuit' | 'asset' | 'corporate', title: string) => void;
    handleSoftDeleteLawsuit: (id: string) => void;
    handleOpenNexoVisual: (type: any, data: any) => void;
    renderStatusBadge: (id: string, currentStatus: string, type: 'lawsuit' | 'asset' | 'corporate', options: string[]) => React.ReactNode;
    setEditingLawsuit: (val: any) => void;
    setPendingLawsuitDocuments: (val: any[]) => void;
    setIsLawsuitModalOpen: (val: boolean) => void;
    setActiveLawsuitTab: (val: 'basic' | 'advanced' | 'docs' | 'timeline' | 'financeiro' | 'ai') => void;
    setActiveTab: (val: 'overview' | 'pessoas' | 'processos' | 'tarefas' | 'agenda' | 'ativos' | 'societario' | 'documentos') => void;
    setEditingTask: (val: any) => void;
    setIsTaskModalOpen: (val: boolean) => void;
    setActiveTaskTab: (val: 'basic' | 'advanced') => void;
    setEditingAsset: (val: any) => void;
    setIsAssetModalOpen: (val: boolean) => void;
    setEditingLawsuitDoc: (val: any) => void;
    setIsLawsuitDocModalOpen: (val: boolean) => void;
}

export const LawsuitsTab = ({
    t,
    locale,
    lawsuits,
    filteredLawsuits,
    processViewStyle,
    setProcessViewStyle,
    lawsuitSearch,
    setLawsuitSearch,
    lawsuitStatusFilter,
    setLawsuitStatusFilter,
    lawsuitLawyerFilter,
    setLawsuitLawyerFilter,
    team,
    persons,
    loading,
    LAWSUIT_STATUSES,
    handleDropLawsuit,
    handleDragStartLawsuit,
    handleOpenHistory,
    handleSoftDeleteLawsuit,
    handleOpenNexoVisual,
    renderStatusBadge,
    setEditingLawsuit,
    setPendingLawsuitDocuments,
    setIsLawsuitModalOpen,
    setActiveLawsuitTab,
    setActiveTab,
    setEditingTask,
    setIsTaskModalOpen,
    setActiveTaskTab,
    setEditingAsset,
    setIsAssetModalOpen,
    setEditingLawsuitDoc,
    setIsLawsuitDocModalOpen
}: LawsuitsTabProps) => {

    const renderLawsuitFilterBar = () => (
        <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t('modules.nexus.processes.searchPlaceholder')}
                        value={lawsuitSearch}
                        onChange={e => setLawsuitSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>
            <div className="w-48">
                <select
                    value={lawsuitStatusFilter}
                    onChange={e => setLawsuitStatusFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">⚖️ {t('common.filters.allStatuses')}</option>
                    {Object.entries(t('common.statuses.lawsuit', { returnObjects: true }) as Record<string, string>).map(([key, val]) => <option key={key} value={val}>{val}</option>)}
                </select>
            </div>
            <div className="w-64">
                <select
                    value={lawsuitLawyerFilter}
                    onChange={e => setLawsuitLawyerFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">👤 {t('common.filters.allLawyers')}</option>
                    {team.map(t_ => <option key={t_.id} value={t_.id}>{t_.full_name}</option>)}
                </select>
            </div>
            {(lawsuitSearch || lawsuitStatusFilter || lawsuitLawyerFilter) && (
                <button
                    onClick={() => { setLawsuitSearch(''); setLawsuitStatusFilter(''); setLawsuitLawyerFilter(''); }}
                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title={t('common.clearFilters')}
                >
                    <Filter size={16} />
                    <XCircle size={14} className="-ml-1" />
                </button>
            )}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col h-full space-y-6">
                {/* Header Processos */}
                <div className="flex flex-col md:flex-row pb-6 mb-2 mt-4 px-8 border-b-4 border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            {t('modules.nexus.title')}
                        </h1>
                        <p className="text-slate-500 font-bold tracking-wide mt-1">
                            Total de {lawsuits.length} {t('common.processes')}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setProcessViewStyle('grid')}
                                className={`p-2 rounded-lg transition-all ${processViewStyle === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização em Cards"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setProcessViewStyle('list')}
                                className={`p-2 rounded-lg transition-all ${processViewStyle === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização em Lista"
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setProcessViewStyle('kanban')}
                                className={`p-2 rounded-lg transition-all ${processViewStyle === 'kanban' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title="Visualização em Kanban"
                            >
                                <Trello size={18} />
                            </button>
                        </div>
                        <button
                            onClick={() => { 
                                setEditingLawsuit({ status: 'Ativo' }); 
                                setPendingLawsuitDocuments([]);
                                setIsLawsuitModalOpen(true); 
                                setActiveLawsuitTab('basic'); 
                            }}
                            className="bg-slate-800 hover:bg-indigo-600 dark:bg-white dark:hover:bg-indigo-500 dark:text-slate-900 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <Plus size={14} /> Novo Processo
                        </button>
                    </div>
                </div>

                <div className="flex-1 px-8 pb-8 h-[calc(100vh-280px)]">
                    {renderLawsuitFilterBar()}
                    <AnimatePresence mode="wait">
                        {processViewStyle === 'kanban' ? (
                            <motion.div
                                key="process-kanban"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex gap-6 overflow-x-auto no-scrollbar pb-4"
                            >
                                {LAWSUIT_STATUSES.map(status => (
                                    <div 
                                        key={status} 
                                        className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4"
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); handleDropLawsuit(e, status); }}
                                    >
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    status === 'Ativo' ? 'bg-emerald-500' :
                                                    status === 'Encerrado' ? 'bg-rose-500' :
                                                    status === 'Arquivado' ? 'bg-slate-400' : 'bg-amber-500'
                                                }`} />
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{status}</h3>
                                                <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                                    {filteredLawsuits.filter(l => l.status === status).length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1 pb-6">
                                            {filteredLawsuits.filter(l => l.status === status).length === 0 ? (
                                                <div className="py-20 text-center text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">Vazio</div>
                                            ) : (
                                                filteredLawsuits.filter(l => l.status === status).map(law => (
                                                    <div 
                                                        key={law.id} 
                                                        draggable
                                                        onDragStart={(e) => {
                                                            handleDragStartLawsuit(e, law.id);
                                                            e.currentTarget.classList.add('opacity-50');
                                                        }}
                                                        onDragEnd={(e) => {
                                                            e.currentTarget.classList.remove('opacity-50');
                                                        }}
                                                        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                                                        onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="text-[8px] font-mono font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-tight truncate">{law.cnj_number || 'Sem CNJ'}</div>
                                                            <div className="flex items-center gap-1.5">
                                                                <div className="flex gap-1 transition-all">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenHistory(law.id, 'lawsuit', law.case_title || 'Sem Título'); }}
                                                                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                        title="Análise de Histórico"
                                                                    >
                                                                        <History size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                        title={t('common.edit')}
                                                                    >
                                                                        <Pencil size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleSoftDeleteLawsuit(law.id); }}
                                                                        className="p-1 text-slate-400 hover:text-red-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                        title={t('common.delete')}
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-3 line-clamp-2 leading-snug uppercase tracking-tight">{law.case_title}</h4>
                                                        
                                                        <div className="flex items-center gap-2 mb-4">
                                                            <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black text-[9px]">
                                                                {persons.find(p => p.id === law.author_id)?.full_name?.charAt(0) || 'C'}
                                                            </div>
                                                            <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 truncate">
                                                                {persons.find(p => p.id === law.author_id)?.full_name || 'Contestação'}
                                                            </span>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                                                            <div className="text-[9px] font-black text-emerald-600 dark:text-emerald-400">
                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(law.value || 0)}
                                                            </div>
                                                            <div className="flex items-center gap-1.5">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('lawsuit', law); }}
                                                                    className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                    title="Ver Mapa Mental (Nexo Visual)"
                                                                >
                                                                    <Network size={12} />
                                                                </button>
                                                                 {renderStatusBadge(law.id, law.status, 'lawsuit', LAWSUIT_STATUSES)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : processViewStyle === 'list' ? (
                            <motion.div 
                                key="process-list"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col"
                            >
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.table.headers.cnj')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.lawsuit.labelTitle')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.client')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.lawsuit.labelValue')}</th>
                                                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('modules.nexus.table.headers.actions')}</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {loading ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300 animate-pulse"><Scale size={40} /></div>
                                                            <p className="font-bold text-slate-400 animate-pulse">{t('modules.nexus.empty.syncing')}</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredLawsuits.length === 0 ? (
                                                <tr>
                                                    <td colSpan={6} className="px-6 py-20 text-center">
                                                        <div className="flex flex-col items-center gap-3">
                                                            <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-full text-slate-300"><Scale size={40} /></div>
                                                            <p className="font-bold text-slate-400">{t('modules.nexus.empty.processes')}</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : filteredLawsuits.map((law) => (
                                                <tr key={law.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                    <td className="px-6 py-4">
                                                        <div className="font-mono text-sm font-bold text-indigo-600 dark:text-indigo-400">{law.cnj_number}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-bold text-slate-700 dark:text-slate-200">{law.case_title}</div>
                                                        <div className="text-[10px] text-slate-400 font-bold uppercase">{law.sphere}</div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center font-black text-xs">
                                                                {persons.find(p => p.id === law.author_id)?.full_name?.charAt(0) || 'C'}
                                                            </div>
                                                            <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">
                                                                {persons.find(p => p.id === law.author_id)?.full_name || 'Contestação'}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {renderStatusBadge(law.id, law.status, 'lawsuit', LAWSUIT_STATUSES)}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="font-black text-slate-800 dark:text-white">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(law.value || 0)}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-1 transition-all">
                                                             <button
                                                                 onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('lawsuit', law); }}
                                                                 className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                 title="Ver Mapa Mental (Nexo Visual)"
                                                             >
                                                                 <Network size={18} />
                                                             </button>
                                                             <button
                                                                 onClick={(e) => {
                                                                     e.stopPropagation();
                                                                     setActiveTab('tarefas');
                                                                     setEditingTask({
                                                                         status: 'A Fazer',
                                                                         lawsuit_id: law.id,
                                                                         responsible_id: law.responsible_lawyer_id || '',
                                                                         title: `${law.author_id ? (persons.find(p => p.id === law.author_id)?.full_name + ' - ') : ''}Andamento de Processo`,
                                                                         priority: 'Média'
                                                                     });
                                                                     setTimeout(() => {
                                                                         setIsTaskModalOpen(true);
                                                                         setActiveTaskTab('basic');
                                                                     }, 300);
                                                                 }}
                                                                 className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                                 title={t('modules.nexus.newTask')}
                                                             >
                                                                 <Zap size={18} />
                                                             </button>
                                                             <button
                                                                 onClick={(e) => {
                                                                     e.stopPropagation();
                                                                     setActiveTab('ativos');
                                                                     setEditingAsset({
                                                                         status: 'Ativo',
                                                                         lawsuit_id: law.id,
                                                                         person_id: law.author_id || '',
                                                                         asset_type: 'Outros'
                                                                     });
                                                                     setTimeout(() => {
                                                                         setIsAssetModalOpen(true);
                                                                     }, 300);
                                                                 }}
                                                                 className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                 title="Vincular Novo Ativo/Garantia"
                                                             >
                                                                 <Shield size={18} />
                                                             </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleOpenHistory(law.id, 'lawsuit', law.case_title || 'Sem Título');
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                title="Ver Histórico de Auditoria"
                                                            >
                                                                <History size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setEditingLawsuit(law);
                                                                    setEditingLawsuitDoc({
                                                                        document_type: 'Petição Inicial',
                                                                        event_date: new Date().toISOString()
                                                                    });
                                                                    setIsLawsuitDocModalOpen(true);
                                                                }}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                title="Upload Rápido de Documento"
                                                            >
                                                                <Upload size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                                title={t('common.edit')}
                                                            >
                                                                <Pencil size={18} />
                                                            </button>
                                                            <button
                                                                onClick={(e) => { e.stopPropagation(); handleSoftDeleteLawsuit(law.id); }}
                                                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                                title={t('common.delete')}
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="process-grid"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                transition={{ duration: 0.3 }}
                                className="flex-1 overflow-y-auto no-scrollbar pb-8"
                            >
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {loading ? (
                                        <div className="col-span-full py-20 text-center animate-pulse text-slate-400 font-bold">{t('modules.nexus.empty.syncing')}</div>
                                    ) : filteredLawsuits.length === 0 ? (
                                        <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">{t('modules.nexus.empty.processes')}</div>
                                    ) : filteredLawsuits.map((law) => {
                                        const author = persons.find(p => p.id === law.author_id);
                                        return (
                                            <div key={law.id} className="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden flex flex-col h-full">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-mono font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-tight">{law.cnj_number}</span>
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{law.sphere}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('lawsuit', law); }}
                                                            className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                            title="Ver Mapa Mental (Nexo Visual)"
                                                        >
                                                            <Network size={12} />
                                                        </button>
                                                        {renderStatusBadge(law.id, law.status, 'lawsuit', LAWSUIT_STATUSES)}
                                                    </div>
                                                </div>

                                                <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4 line-clamp-2 leading-tight">{law.case_title}</h3>

                                                <div className="flex flex-col gap-2 mb-6">
                                                    {author && (
                                                        <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50/50 dark:bg-indigo-900/10 p-2 rounded-xl">
                                                            <UserIcon size={12} /> <span className="truncate">{author.full_name}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Valor da Causa</span>
                                                        <span className="text-sm font-black text-slate-800 dark:text-white">
                                                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(law.value || 0)}
                                                        </span>
                                                    </div>
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={() => {
                                                                setActiveTab('tarefas');
                                                                setEditingTask({
                                                                    status: 'A Fazer',
                                                                    lawsuit_id: law.id,
                                                                    responsible_id: law.responsible_lawyer_id || '',
                                                                    title: `${law.author_id ? (persons.find(p => p.id === law.author_id)?.full_name + ' - ') : ''}Andamento de Processo`,
                                                                    priority: 'Média'
                                                                });
                                                                setTimeout(() => {
                                                                    setIsTaskModalOpen(true);
                                                                    setActiveTaskTab('basic');
                                                                }, 300);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition-all"
                                                            title={t('modules.nexus.newTask')}
                                                        >
                                                            <Zap size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => {
                                                                setActiveTab('ativos');
                                                                setEditingAsset({
                                                                    status: 'Ativo',
                                                                    lawsuit_id: law.id,
                                                                    person_id: law.author_id || '',
                                                                    asset_type: 'Outros'
                                                                });
                                                                setTimeout(() => {
                                                                    setIsAssetModalOpen(true);
                                                                }, 300);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title="Vincular Novo Ativo/Garantia"
                                                        >
                                                            <Shield size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleOpenHistory(law.id, 'lawsuit', law.case_title || 'Sem Título');
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title="Ver Histórico de Auditoria"
                                                        >
                                                            <History size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setEditingLawsuit(law);
                                                                setEditingLawsuitDoc({
                                                                    document_type: 'Petição Inicial',
                                                                    event_date: new Date().toISOString()
                                                                });
                                                                setIsLawsuitDocModalOpen(true);
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title="Upload Rápido de Documento"
                                                        >
                                                            <Upload size={16} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingLawsuit(law); setIsLawsuitModalOpen(true); setActiveLawsuitTab('basic'); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title={t('common.edit')}
                                                        >
                                                            <Pencil size={16} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleSoftDeleteLawsuit(law.id); }}
                                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                                            title={t('common.delete')}
                                                        >
                                                            <Trash2 size={16} />
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
