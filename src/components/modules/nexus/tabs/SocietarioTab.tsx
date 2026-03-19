import React from 'react';
import { 
    Plus, Search, LayoutGrid, List, Trello, Network, 
    History, Pencil, Upload, Trash2, Building2, PieChart, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { CorporateEntity, EntityStatus } from '@/types';

interface SocietarioTabProps {
    t: (key: string, variables?: Record<string, any>) => any;
    corporateSearchTerm: string;
    setCorporateSearchTerm: (v: string) => void;
    corporateViewStyle: 'grid' | 'list' | 'kanban';
    setCorporateViewStyle: (v: 'grid' | 'list' | 'kanban') => void;
    filteredEntities: CorporateEntity[];
    ENTITY_STATUSES: EntityStatus[];
    handleDropEntity: (e: React.DragEvent, status: string) => void;
    handleDragStartEntity: (e: React.DragEvent, id: string) => void;
    handleOpenNexoVisual: (type: 'corporate', data: CorporateEntity) => void;
    handleOpenHistory: (id: string, type: 'corporate', title: string) => void;
    handleEditEntity: (entity: CorporateEntity, activeTab?: any) => void;
    handleSoftDeleteEntity: (id: string) => void;
    setEditingEntity: (e: Partial<CorporateEntity>) => void;
    setShareholders: (s: any[]) => void;
    setCorporateDocuments: (d: any[]) => void;
    setIsEntityModalOpen: (b: boolean) => void;
    setActiveEntityTab: (t: any) => void;
    setEditingDocument: (d: any) => void;
    setIsDocumentModalOpen: (b: boolean) => void;
    personForQSARef: React.MutableRefObject<any>;
    renderStatusBadge: (id: string, status: string, type: 'corporate', statuses: string[]) => React.ReactNode;
}

export const SocietarioTab: React.FC<SocietarioTabProps> = ({
    t,
    corporateSearchTerm,
    setCorporateSearchTerm,
    corporateViewStyle,
    setCorporateViewStyle,
    filteredEntities,
    ENTITY_STATUSES,
    handleDropEntity,
    handleDragStartEntity,
    handleOpenNexoVisual,
    handleOpenHistory,
    handleEditEntity,
    handleSoftDeleteEntity,
    setEditingEntity,
    setShareholders,
    setCorporateDocuments,
    setIsEntityModalOpen,
    setActiveEntityTab,
    setEditingDocument,
    setIsDocumentModalOpen,
    personForQSARef,
    renderStatusBadge
}) => {
    return (
        <div className="flex-1 flex flex-col pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col h-full space-y-6">
                {/* Header Societário */}
                <div className="flex flex-col md:flex-row pb-6 mb-2 mt-4 px-8 border-b-4 border-slate-100 dark:border-slate-800">
                    <div className="flex-1">
                        <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                            {t('modules.nexus.corporate.title')}
                        </h1>
                        <p className="text-slate-500 font-bold tracking-wide mt-1">
                            {t('modules.nexus.corporate.subtitle')}
                        </p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center gap-4">
                        <div className="relative group">
                            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                            <input
                                type="text"
                                placeholder={t('modules.nexus.corporate.searchPlaceholder')}
                                value={corporateSearchTerm}
                                onChange={(e) => setCorporateSearchTerm(e.target.value)}
                                className="pl-12 pr-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-64 outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold transition-all shadow-sm"
                            />
                        </div>

                        <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                            <button
                                onClick={() => setCorporateViewStyle('grid')}
                                className={`p-2 rounded-lg transition-all ${corporateViewStyle === 'grid' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title={t('common.viewStyle.cards')}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setCorporateViewStyle('list')}
                                className={`p-2 rounded-lg transition-all ${corporateViewStyle === 'list' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title={t('common.viewStyle.list')}
                            >
                                <List size={18} />
                            </button>
                            <button
                                onClick={() => setCorporateViewStyle('kanban')}
                                className={`p-2 rounded-lg transition-all ${corporateViewStyle === 'kanban' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                title={t('common.viewStyle.kanban')}
                            >
                                <Trello size={18} />
                            </button>
                        </div>
                        <button
                            onClick={() => {
                                setEditingEntity({ status: 'Ativa', entity_type: 'LTDA' });
                                personForQSARef.current = null;
                                setShareholders([]); // Limpa manualmente para nova entidade em branco
                                setCorporateDocuments([]);
                                setIsEntityModalOpen(true);
                                setActiveEntityTab('basic');
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl hover:shadow-indigo-500/30 hover:-translate-y-1"
                        >
                            <Plus size={14} /> {t('modules.nexus.corporate.newEntity')}
                        </button>
                    </div>
                </div>

                {/* Tabela/Grade Societário */}
                <div className="flex-1 px-8 pb-8 h-[calc(100vh-280px)]">
                    <AnimatePresence mode="wait">
                        {corporateViewStyle === 'kanban' ? (
                            <motion.div
                                key="corporate-kanban"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                className="h-full flex gap-6 overflow-x-auto no-scrollbar pb-4"
                            >
                                {ENTITY_STATUSES.map(status => (
                                    <div
                                        key={status}
                                        className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4"
                                        onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                        onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                                        onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); handleDropEntity(e, status); }}
                                    >
                                        <div className="flex items-center justify-between px-2 mb-2">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-2 h-2 rounded-full ${
                                                    status === 'Ativa' ? 'bg-emerald-500' :
                                                    status === 'Baixada' ? 'bg-rose-500' :
                                                    status === 'Inativa' ? 'bg-slate-400' : 'bg-amber-500'
                                                }`} />
                                                <h3 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{status}</h3>
                                                <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-900 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                                    {filteredEntities.filter(e => e.status === status).length}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-4 px-1 pb-6">
                                            {filteredEntities.filter(e => e.status === status).length === 0 ? (
                                                <div className="py-20 text-center text-[10px] font-bold text-slate-300 italic uppercase tracking-widest">{t('common.empty')}</div>
                                            ) : (
                                                filteredEntities.filter(e => e.status === status).map(entity => (
                                                    <div
                                                        key={entity.id}
                                                        draggable
                                                        onDragStart={(e) => {
                                                            handleDragStartEntity(e, entity.id);
                                                            e.currentTarget.classList.add('opacity-50');
                                                        }}
                                                        onDragEnd={(e) => {
                                                            e.currentTarget.classList.remove('opacity-50');
                                                        }}
                                                        className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group cursor-pointer"
                                                        onClick={() => handleEditEntity(entity)}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="text-[8px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest truncate">{entity.entity_type}</div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('corporate', entity); }}
                                                                    className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                                    title="Ver Mapa Mental (Nexo Visual)"
                                                                >
                                                                    <Network size={12} />
                                                                </button>
                                                                <div className="flex gap-1 transition-all">
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleOpenHistory(entity.id, 'corporate', entity.legal_name || 'Sem Título'); }}
                                                                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                        title={t('modules.nexus.processes.historyAnalysis')}
                                                                    >
                                                                        <History size={12} />
                                                                    </button>
                                                                    <button
                                                                        onClick={(e) => { e.stopPropagation(); handleEditEntity(entity); }}
                                                                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                                    >
                                                                        <Pencil size={12} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <h4 className="font-bold text-slate-800 dark:text-white text-xs mb-3 line-clamp-2 leading-snug uppercase tracking-tight">{entity.legal_name}</h4>

                                                        <div className="flex flex-col gap-2 mb-4">
                                                            <div className="text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                                {entity.cnpj || t('common.notApplicable')}
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800">
                                                            <div className="text-[10px] font-black text-emerald-600 dark:text-emerald-400">
                                                                {entity.total_capital ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entity.total_capital) : '-'}
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                {renderStatusBadge(entity.id, entity.status, 'corporate', ENTITY_STATUSES)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        ) : corporateViewStyle === 'list' ? (
                            <motion.div 
                                key="corporate-list"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
                            >
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.client')}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.corporate.table.headers.cnpj')}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.corporate.labels.type')}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.corporate.table.headers.capital')}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                                            <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('common.actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                        {filteredEntities.length === 0 ? (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">{t('modules.nexus.corporate.empty')}</td>
                                            </tr>
                                        ) : filteredEntities.map((entity: any) => (
                                            <tr key={entity.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 dark:text-slate-200 text-sm whitespace-nowrap">{entity.legal_name}</div>
                                                    <div className="text-[10px] text-slate-400 font-bold">{entity.trading_name || t('modules.nexus.corporate.labels.noTradingName')}</div>
                                                </td>
                                                <td className="px-6 py-4 text-xs font-bold text-slate-500">{entity.cnpj || t('common.notApplicable')}</td>
                                                <td className="px-6 py-4">
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg text-[10px] font-black uppercase">
                                                        {entity.entity_type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 font-bold text-slate-600 dark:text-slate-300">
                                                    {entity.total_capital ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entity.total_capital) : '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {renderStatusBadge(entity.id, entity.status, 'corporate', ENTITY_STATUSES)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 opacity-100">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('corporate', entity); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title={t('modules.nexus.processes.viewMindMap')}
                                                        >
                                                            <Network size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenHistory(entity.id, 'corporate', entity.legal_name || t('common.veritumPro')); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title={t('modules.nexus.processes.historyAnalysis')}
                                                        >
                                                            <History size={18} />
                                                        </button>
                                                        <button
                                                            onClick={(e) => { 
                                                                e.stopPropagation(); 
                                                                setEditingEntity(entity); 
                                                                setEditingDocument({ 
                                                                    document_type: 'Contrato Social', 
                                                                    event_date: new Date().toISOString() 
                                                                });
                                                                setIsDocumentModalOpen(true); 
                                                            }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title={t('modules.nexus.modals.document.title')}

                                                        >
                                                            <Upload size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleEditEntity(entity)}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title={t('common.actions')}

                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingEntity(entity); setIsEntityModalOpen(true); setActiveEntityTab('qsa'); }}
                                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-all"
                                                            title={t('modules.nexus.corporate.actions.manageQSA')}
                                                        >
                                                            <Users size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => handleSoftDeleteEntity(entity.id)}
                                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
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
                            </motion.div>
                        ) : (
                            <motion.div
                                key="corporate-grid"
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.98 }}
                                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                            >
                                {filteredEntities.length === 0 ? (
                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold italic">{t('modules.nexus.corporate.empty')}</div>
                                 ) : filteredEntities.map((entity: CorporateEntity) => (
                                    <div key={entity.id} className="bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-2xl transition-all group relative overflow-hidden flex flex-col h-[400px] border-b-8 border-b-indigo-500">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-3xl group-hover:scale-110 transition-transform">
                                                <Building2 size={24} />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('corporate', entity); }}
                                                    className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                    title={t('modules.nexus.processes.viewMindMap')}
                                                >
                                                    <Network size={12} />
                                                </button>
                                                {renderStatusBadge(entity.id, entity.status, 'corporate', ENTITY_STATUSES)}
                                            </div>
                                        </div>

                                        <h3 className="font-black text-slate-800 dark:text-white text-xl mb-1 line-clamp-1 truncate uppercase tracking-tighter leading-tight">
                                            {entity.legal_name}
                                        </h3>
                                        <p className="text-xs font-bold text-slate-400 mb-6 uppercase tracking-widest">{entity.cnpj || t('common.notApplicable')}</p>

                                        <div className="grid grid-cols-2 gap-3 mb-8">
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">{t('modules.nexus.corporate.labels.type')}</span>
                                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200">{entity.entity_type}</span>
                                            </div>
                                            <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl">
                                                <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">{t('modules.nexus.corporate.labels.regime')}</span>
                                                <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 truncate">{entity.tax_regime || t('common.notApplicable')}</span>
                                            </div>
                                        </div>

                                        <div className="bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-[2rem] mb-6 flex items-center justify-between border border-indigo-100 dark:border-indigo-800/50">
                                            <div>
                                                <span className="text-[8px] font-black text-indigo-600 uppercase block mb-0.5">{t('modules.nexus.corporate.labels.capital')}</span>
                                                <span className="text-sm font-black text-slate-800 dark:text-white">
                                                    {entity.total_capital ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(entity.total_capital) : 'R$ 0,00'}
                                                </span>
                                            </div>
                                            <div className="w-10 h-10 bg-white dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                                                <PieChart size={18} className="text-indigo-600" />
                                            </div>
                                        </div>

                                        <div className="mt-auto flex items-center gap-2">
                                            <button 
                                                onClick={() => handleEditEntity(entity, 'qsa')}
                                                className="flex-1 bg-slate-900 dark:bg-white dark:text-slate-900 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 dark:hover:bg-slate-100 transition-all active:scale-95 shadow-lg"
                                            >
                                                {t('modules.nexus.corporate.actions.manageQSA')}
                                            </button>
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); handleOpenHistory(entity.id, 'corporate', entity.legal_name || t('common.veritumPro')); }}
                                                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                                title={t('modules.nexus.processes.historyAnalysis')}
                                            >
                                                <History size={18} />
                                            </button>
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    setEditingEntity(entity); 
                                                    setEditingDocument({ 
                                                        document_type: 'Contrato Social', 
                                                        event_date: new Date().toISOString() 
                                                    });
                                                    setIsDocumentModalOpen(true); 
                                                }}
                                                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                                title={t('modules.nexus.modals.document.title')}
                                            >
                                                <Upload size={18} />
                                            </button>
                                            <button 
                                                onClick={() => handleEditEntity(entity)}
                                                className="p-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                                            >
                                                <Pencil size={18} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
