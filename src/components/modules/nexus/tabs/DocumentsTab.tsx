import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, FileText, Network, ExternalLink, Sparkles, Download, 
    ArrowRight, Trash2, Loader2, Filter, XCircle, Scale, Shield, Building2 
} from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';

interface DocumentsTabProps {
    docSearch: string;
    setDocSearch: (val: string) => void;
    docOriginFilter: string;
    setDocOriginFilter: (val: string) => void;
    docTypeFilter: string;
    setDocTypeFilter: (val: string) => void;
    isGlobalDocsLoading: boolean;
    filteredGlobalDocuments: any[];
    uniqueDocTypes: string[];
    handleOpenNexoVisual: (type: 'lawsuit' | 'corporate' | 'asset' | 'task' | 'document' | 'person', data: any) => void;
    handleSummarizeDocument: (doc: any) => void;
    handleDownloadFile: (url: string, title: string) => void;
    handleEditGlobalDocumentOrigin: (doc: any) => void;
    handleDeleteGlobalDocument: (doc: any) => void;
}

export const DocumentsTab = ({
    docSearch,
    setDocSearch,
    docOriginFilter,
    setDocOriginFilter,
    docTypeFilter,
    setDocTypeFilter,
    isGlobalDocsLoading,
    filteredGlobalDocuments,
    uniqueDocTypes,
    handleOpenNexoVisual,
    handleSummarizeDocument,
    handleDownloadFile,
    handleEditGlobalDocumentOrigin,
    handleDeleteGlobalDocument
}: DocumentsTabProps) => {
    const { t } = useTranslation();

    const renderOriginBadge = (origin: string, name: string) => {
        const icons: Record<string, React.ReactNode> = {
            lawsuit: <Scale size={12} className="text-white" />,
            asset: <Shield size={12} className="text-white" />,
            corporate: <Building2 size={12} className="text-white" />
        };
        const colors: Record<string, string> = {
            lawsuit: 'bg-indigo-500',
            asset: 'bg-emerald-500',
            corporate: 'bg-amber-500'
        };
        const labels: Record<string, string> = {
            lawsuit: t('modules.nexus.tabs.processes'),
            asset: t('modules.nexus.tabs.assets'),
            corporate: t('modules.nexus.tabs.corporate')
        };

        const icon = icons[origin] || <FileText size={12} className="text-white" />;
        const color = colors[origin] || 'bg-slate-500';
        const label = labels[origin] || t('common.others');

        return (
            <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg shrink-0 ${color}`}>
                    {icon}
                </div>
                <div className="flex flex-col min-w-0">
                    <span className="text-[8px] font-black uppercase text-slate-400 leading-none mb-0.5">{label}</span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{name}</span>
                </div>
            </div>
        );
    };

    const renderGlobalDocumentsFilterBar = () => (
        <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t('modules.nexus.documents.searchPlaceholder')}
                        value={docSearch}
                        onChange={e => setDocSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>
            <div className="w-48">
                <select
                    value={docOriginFilter}
                    onChange={e => setDocOriginFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">📌 {t('modules.nexus.documents.allOrigins')}</option>
                    <option value="lawsuit">⚖️ {t('modules.nexus.tabs.processes')}</option>
                    <option value="asset">🛡️ {t('modules.nexus.tabs.assets')}</option>
                    <option value="corporate">🏢 {t('modules.nexus.tabs.corporate')}</option>
                </select>
            </div>
            <div className="w-56">
                <select
                    value={docTypeFilter}
                    onChange={e => setDocTypeFilter(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">📄 {t('common.filters.allTypes')}</option>
                    {uniqueDocTypes.map(type => <option key={type} value={type}>{type}</option>)}
                </select>
            </div>
            {(docSearch || docOriginFilter || docTypeFilter) && (
                <button
                    onClick={() => { setDocSearch(''); setDocOriginFilter(''); setDocTypeFilter(''); }}
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
        <div className="flex-1 overflow-hidden flex flex-col min-h-0">
            {renderGlobalDocumentsFilterBar()}
            
            <div className="flex-1 overflow-y-auto pr-2 no-scrollbar">
                <AnimatePresence mode="wait">
                    {isGlobalDocsLoading ? (
                        <motion.div 
                            key="loading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="h-full flex flex-col items-center justify-center py-20"
                        >
                            <Loader2 size={48} className="text-indigo-600 animate-spin mb-4" />
                            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Consolidando documentos globais...</p>
                        </motion.div>
                    ) : filteredGlobalDocuments.length === 0 ? (
                        <motion.div 
                            key="empty"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="h-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50"
                        >
                            <FileText size={64} className="text-slate-200 dark:text-slate-800 mb-4" />
                            <h3 className="text-lg font-black text-slate-400 uppercase tracking-tighter">Nenhum documento encontrado</h3>
                            <p className="text-sm text-slate-400 font-medium mt-1">Tente ajustar seus filtros ou busca global.</p>
                        </motion.div>
                    ) : (
                        <motion.div 
                            key="grid"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10"
                        >
                            {filteredGlobalDocuments.map((doc, idx) => (
                                <motion.div
                                    key={doc.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="bg-white dark:bg-slate-950 p-5 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/40 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all group relative overflow-hidden"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-transform">
                                            <FileText size={20} />
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('document', doc); }}
                                                className="p-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                title="Ver Mapa Mental (Nexo Visual)"
                                            >
                                                <Network size={14} />
                                            </button>
                                            <button 
                                                onClick={() => doc.file_url && window.open(doc.file_url, '_blank')}
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                title="Visualizar Documento"
                                            >
                                                <ExternalLink size={18} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <h4 className="font-black text-slate-800 dark:text-white text-sm line-clamp-1 group-hover:text-indigo-600 transition-colors capitalize">
                                                {doc.title}
                                            </h4>
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 block">
                                                {doc.document_type}
                                            </span>
                                        </div>

                                        <div className="pt-4 border-t border-slate-50 dark:border-slate-800/50 flex flex-col gap-3">
                                            {renderOriginBadge(doc.origin_type, doc.origin_name || 'N/A')}
                                            
                                            <div className="flex items-center justify-between mt-2">
                                                <div className="flex flex-col">
                                                    <span className="text-[8px] font-black uppercase text-slate-400 leading-none mb-0.5 whitespace-nowrap">Data do Evento</span>
                                                    <span className="text-[10px] font-bold text-slate-500">
                                                        {doc.event_date ? new Date(doc.event_date).toLocaleDateString('pt-BR') : 'Sem Data'}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    <button 
                                                        type="button" 
                                                        onClick={() => handleSummarizeDocument(doc)}
                                                        className="p-2 bg-slate-50 dark:bg-slate-800 text-amber-500 hover:text-amber-600 transition-all rounded-xl"
                                                        title="Resumo IA"
                                                    >
                                                        <Sparkles size={16} />
                                                    </button>
                                                    {doc.file_url && (
                                                        <button 
                                                            onClick={() => handleDownloadFile(doc.file_url, doc.title || 'documento')}
                                                            className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-all rounded-xl"
                                                            title="Fazer Download"
                                                        >
                                                            <Download size={16} />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleEditGlobalDocumentOrigin(doc)}
                                                        className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all rounded-xl"
                                                        title={doc.origin_type === 'lawsuit' ? 'Ir para o Processo' : doc.origin_type === 'asset' ? 'Ir para o Ativo' : 'Ir para o Societário'}
                                                    >
                                                        <ArrowRight size={16} />
                                                    </button>
                                                    <button 
                                                        onClick={() => handleDeleteGlobalDocument(doc)}
                                                        className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all rounded-xl"
                                                        title="Excluir Documento"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
