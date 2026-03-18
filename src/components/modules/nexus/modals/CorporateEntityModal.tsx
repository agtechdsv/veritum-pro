import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    XCircle, Building2, Users, FileText, History, Trash2, Pencil, Calendar, 
    Download, Sparkles, Save, ChevronDown, Clock, Loader2, Zap, User as UserIcon, 
    Plus, Network, Shield, Check
} from 'lucide-react';
import { 
    CorporateEntity, Shareholder, CorporateDocument, TimelineEntry, 
    TeamMember, User, EntityType, TaxRegime, EntityStatus 
} from '@/types';
import { useTranslation } from '@/contexts/language-context';
import { BlockedTabOverlay, PremiumFileUpload } from '../nexus-components';

interface CorporateEntityModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingEntity: Partial<CorporateEntity> | null;
    setEditingEntity: (entity: Partial<CorporateEntity> | null) => void;
    activeTab: 'basic' | 'qsa' | 'docs' | 'timeline';
    setActiveTab: (tab: 'basic' | 'qsa' | 'docs' | 'timeline') => void;
    handleSaveEntity: (e: React.FormEvent) => void;
    handleOpenNexoVisual: (type: 'corporate', entity: any) => void;
    shareholders: Shareholder[];
    corporateDocuments: CorporateDocument[];
    pendingCorporateDocuments: { file: File, docData: Partial<CorporateDocument> }[];
    setPendingCorporateDocuments: (docs: any) => void;
    corporateTimeline: TimelineEntry[];
    isTimelineLoading: boolean;
    team: TeamMember[];
    user: User;
    justificationText: string;
    setJustificationText: (text: string) => void;
    handleDeleteShareholder: (id: string) => void;
    handleDeleteDocument: (id: string) => void;
    handleDownloadFile: (url: string, title: string) => void;
    handleSummarizeDocument: (doc: any) => void;
    
    // Shareholder Modal Props
    isShareholderModalOpen: boolean;
    setIsShareholderModalOpen: (open: boolean) => void;
    editingShareholder: Partial<Shareholder> | null;
    setEditingShareholder: (sh: Partial<Shareholder> | null) => void;
    handleSaveShareholder: (e: React.FormEvent) => void;
    
    // Document Modal Props
    isDocumentModalOpen: boolean;
    setIsDocumentModalOpen: (open: boolean) => void;
    editingDocument: Partial<CorporateDocument> | null;
    setEditingDocument: (doc: Partial<CorporateDocument> | null) => void;
    handleSaveDocument: (e: React.FormEvent) => void;
    corporateDocUploadRef: any;
    setCorporateDocFile: (file: File | null) => void;

    // Constants
    ENTITY_TYPES: EntityType[];
    TAX_REGIMES: TaxRegime[];
    ENTITY_STATUSES: EntityStatus[];
    formatCurrency: (val: number) => string;
}

export const CorporateEntityModal: React.FC<CorporateEntityModalProps> = ({
    isOpen,
    onClose,
    editingEntity,
    setEditingEntity,
    activeTab,
    setActiveTab,
    handleSaveEntity,
    handleOpenNexoVisual,
    shareholders,
    corporateDocuments,
    pendingCorporateDocuments,
    setPendingCorporateDocuments,
    corporateTimeline,
    isTimelineLoading,
    team,
    user,
    justificationText,
    setJustificationText,
    handleDeleteShareholder,
    handleDeleteDocument,
    handleDownloadFile,
    handleSummarizeDocument,
    isShareholderModalOpen,
    setIsShareholderModalOpen,
    editingShareholder,
    setEditingShareholder,
    handleSaveShareholder,
    isDocumentModalOpen,
    setIsDocumentModalOpen,
    editingDocument,
    setEditingDocument,
    handleSaveDocument,
    corporateDocUploadRef,
    setCorporateDocFile,
    ENTITY_TYPES,
    TAX_REGIMES,
    ENTITY_STATUSES,
    formatCurrency
}) => {
    const { t } = useTranslation();

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <div key="entity-modal-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={onClose}
                        />
                        <motion.div
                            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 35, stiffness: 350 }}
                            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 shadow-2xl h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-10 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-3xl font-black text-slate-800 dark:text-white tracking-tighter">
                                            {editingEntity?.id ? 'Nova Entidade' : 'Nova Entidade'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1 flex items-center gap-2">
                                            <Shield size={12} className="text-indigo-600" /> Governança & Estrutura Societária
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {editingEntity?.id && (
                                            <button
                                                type="button"
                                                onClick={() => handleOpenNexoVisual('corporate', editingEntity)}
                                                className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-2xl transition-all shadow-sm"
                                                title="Ver Mapa Mental (Nexo Visual)"
                                            >
                                                <Network size={28} className="p-1" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={onClose}
                                            className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                                        >
                                            <XCircle size={32} />
                                        </button>
                                    </div>
                                </div>

                                {/* Premium Tabs */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-[2.5rem] w-full">
                                    {[
                                        { id: 'basic', label: 'Dados Gerais', icon: Building2 },
                                        { id: 'qsa', label: 'Quadro Societário', icon: Users, isLocked: !editingEntity?.id && shareholders.length === 0 },
                                        { id: 'docs', label: 'Documentos', icon: FileText },
                                        { id: 'timeline', label: 'Histórico', icon: History, isLocked: !editingEntity?.id },
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            type="button"
                                            onClick={() => setActiveTab(tab.id as any)}
                                            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-3xl text-xs font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'} ${tab.isLocked ? 'opacity-50' : ''}`}
                                        >
                                            <tab.icon size={16} /> {tab.label} {tab.isLocked && '🔒'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <form onSubmit={handleSaveEntity} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto no-scrollbar p-10">
                                    {activeTab === 'basic' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="grid grid-cols-1 gap-6">
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Razão Social *</label>
                                                    <input
                                                        required value={editingEntity?.legal_name || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, legal_name: e.target.value })}
                                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-black transition-all text-lg"
                                                        placeholder="Ex: HOLDING PATRIMONIAL LTDA"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome Fantasia</label>
                                                    <input
                                                        value={editingEntity?.trading_name || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, trading_name: e.target.value })}
                                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                                                        placeholder="Ex: NOME DO GRUPO"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">CNPJ</label>
                                                    <input
                                                        value={editingEntity?.cnpj || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, cnpj: e.target.value })}
                                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-black text-indigo-600"
                                                        placeholder="00.000.000/0000-00"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Inscrição Estadual</label>
                                                    <input
                                                        value={editingEntity?.state_registration || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, state_registration: e.target.value })}
                                                        className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none"
                                                    />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-3 gap-6">
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo</label>
                                                    <select
                                                        value={editingEntity?.entity_type || 'LTDA'}
                                                        onChange={e => setEditingEntity({ ...editingEntity, entity_type: e.target.value as any })}
                                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-bold"
                                                    >
                                                        {ENTITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Regime Tributário</label>
                                                    <select
                                                        value={editingEntity?.tax_regime || ''}
                                                        onChange={e => setEditingEntity({ ...editingEntity, tax_regime: e.target.value as any })}
                                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-bold"
                                                    >
                                                        <option value="">Selecione...</option>
                                                        {TAX_REGIMES.map(r => <option key={r} value={r}>{r}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Status</label>
                                                    <select
                                                        value={editingEntity?.status || 'Ativa'}
                                                        onChange={e => setEditingEntity({ ...editingEntity, status: e.target.value as any })}
                                                        className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none font-bold"
                                                    >
                                                        {ENTITY_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                                                    </select>
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Justificativa da Mudança (Opcional)</label>
                                                <input
                                                    value={justificationText}
                                                    onChange={e => setJustificationText(e.target.value)}
                                                    placeholder="Motivo da alteração de status..."
                                                    className="w-full px-8 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold text-xs"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Capital Social Total (R$)</label>
                                                <div className="relative">
                                                    <div className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-400 font-bold">R$</div>
                                                    <input
                                                        type="text"
                                                        value={editingEntity?.total_capital ? formatCurrency(editingEntity.total_capital).replace('R$', '').trim() : ''}
                                                        onChange={e => {
                                                            const raw = e.target.value.replace(/\D/g, '');
                                                            setEditingEntity({ ...editingEntity, total_capital: raw ? parseInt(raw, 10) / 100 : 0 });
                                                        }}
                                                        className="w-full pl-16 pr-8 py-5 bg-indigo-50/50 dark:bg-indigo-950/20 border-2 border-indigo-100 dark:border-indigo-900/50 rounded-3xl outline-none font-black text-xl text-indigo-600"
                                                        placeholder="0,00"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'qsa' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Composição do Capital</h4>
                                                    <p className="text-xs text-slate-500 font-bold">Sócios, acionistas e participações diretas</p>
                                                </div>
                                                {editingEntity?.id && (
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingShareholder({ shareholder_type: 'Person', ownership_percentage: 0 }); setIsShareholderModalOpen(true); }}
                                                        className="p-4 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-2xl flex items-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95"
                                                        title="Adicionar Sócio"
                                                    >
                                                        <Plus size={20} />
                                                    </button>
                                                )}
                                            </div>

                                            {!editingEntity?.id && shareholders.length === 0 ? (
                                                <BlockedTabOverlay message="O Quadro Societário requer que a empresa exista primeiro na base de dados." />
                                            ) : (
                                                <div className="bg-slate-50 dark:bg-slate-800/30 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 overflow-hidden">
                                                <table className="w-full text-left">
                                                    <thead>
                                                        <tr className="bg-slate-100/50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Sócio</th>
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Participação (%)</th>
                                                            <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cotas/Ações</th>
                                                            <th className="px-8 py-5 text-right"></th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                        {shareholders.length === 0 ? (
                                                            <tr>
                                                                <td colSpan={4} className="px-8 py-12 text-center text-slate-400 font-bold italic">Nenhum sócio vinculado a esta entidade.</td>
                                                            </tr>
                                                        ) : shareholders.map(s => (
                                                            <tr key={s.id} className="group hover:bg-white dark:hover:bg-slate-800/50 transition-all">
                                                                <td className="px-8 py-6 font-bold text-slate-700 dark:text-slate-200">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 rounded-xl flex items-center justify-center font-black">
                                                                            {s.shareholder_name?.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <span className="block">{s.shareholder_name}</span>
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{s.shareholder_type === 'Person' ? 'Pessoa Física' : 'Holding / PJ'}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6">
                                                                    <div className="flex items-center gap-3">
                                                                        <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden w-24">
                                                                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.ownership_percentage}%` }} />
                                                                        </div>
                                                                        <span className="font-black text-indigo-600">{s.ownership_percentage}%</span>
                                                                    </div>
                                                                </td>
                                                                <td className="px-8 py-6 font-bold text-slate-600 dark:text-slate-400">
                                                                    {new Intl.NumberFormat('pt-BR').format(s.shares_count || 0)}
                                                                </td>
                                                                <td className="px-8 py-6 text-right">
                                                                    <div className="flex items-center justify-end gap-1">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => { setEditingShareholder(s); setIsShareholderModalOpen(true); }}
                                                                            className="p-2 text-slate-300 hover:text-indigo-500 transition-colors"
                                                                        >
                                                                            <Pencil size={16} />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleDeleteShareholder(s.id)}
                                                                            className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                                        >
                                                                            <Trash2 size={16} />
                                                                        </button>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                            )}
                                        </div>
                                    )}

                                    {activeTab === 'docs' && (
                                        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Atos & Contratos</h4>
                                                    <p className="text-xs text-slate-500 font-bold">Atas, Estatutos e Documentos de Governança</p>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => { setEditingDocument({ document_type: 'Contrato Social', event_date: new Date().toISOString() }); setIsDocumentModalOpen(true); }}
                                                    className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                                >
                                                    <Plus size={20} /> Novo Documento
                                                </button>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                {corporateDocuments.length === 0 && pendingCorporateDocuments.length === 0 ? (
                                                    <div className="col-span-full py-20 text-center text-slate-400 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                                        Nenhum documento anexado.
                                                    </div>
                                                ) : (
                                                    <>
                                                        {/* Pending Documents */}
                                                        {pendingCorporateDocuments.map((pending, idx) => (
                                                            <div key={`pending-corp-${idx}`} className="bg-amber-50/30 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-200/50 dark:border-amber-800/50 hover:border-amber-500/30 transition-all group animate-in zoom-in-95 duration-300">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-amber-600 shadow-sm animate-pulse">
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <span className="text-[8px] font-black text-amber-700 bg-amber-100 dark:bg-amber-900/60 px-3 py-1 rounded-full border border-amber-200 uppercase tracking-widest">
                                                                        Pendente
                                                                    </span>
                                                                </div>
                                                                <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1 italic">{pending.docData.title}</h5>
                                                                <p className="text-[10px] text-slate-500 font-bold mb-4">Tipo: {pending.docData.document_type || 'N/I'}</p>
                                                                
                                                                <div className="flex items-center justify-end">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setPendingCorporateDocuments((prev: any[]) => prev.filter((_, i) => i !== idx))}
                                                                        className="p-2 text-rose-400 hover:text-rose-600 transition-colors"
                                                                        title="Remover"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}

                                                        {/* Saved Documents */}
                                                        {corporateDocuments.map(doc => (
                                                            <div key={doc.id} className="bg-slate-50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all group">
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-indigo-600 shadow-sm">
                                                                        <FileText size={20} />
                                                                    </div>
                                                                    <span className="text-[9px] font-black text-slate-400 capitalize bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                                                        {doc.document_type}
                                                                    </span>
                                                                </div>
                                                                <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{doc.title}</h5>
                                                                <p className="text-[10px] text-slate-500 font-bold mb-4">Referência: {doc.event_date ? new Date(doc.event_date).toLocaleDateString() : 'N/I'}</p>
                                                                
                                                                    <div className="flex items-center gap-1">
                                                                        <button 
                                                                            type="button" 
                                                                            onClick={() => handleSummarizeDocument(doc)}
                                                                            className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                                                                            title="Resumo IA"
                                                                        >
                                                                            <Sparkles size={16} />
                                                                        </button>
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => { setEditingDocument(doc); setIsDocumentModalOpen(true); }}
                                                                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline px-2"
                                                                        >
                                                                        Editar
                                                                    </button>
                                                                    {doc.file_url && (
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleDownloadFile(doc.file_url!, doc.title || 'documento')}
                                                                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                                            title="Fazer Download"
                                                                        >
                                                                            <Download size={16} />
                                                                        </button>
                                                                    )}
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => handleDeleteDocument(doc.id)}
                                                                        className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                                                                    >
                                                                        <Trash2 size={16} />
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </>
                                                )}
                                            </div>
                                    </div>
                                    )}

                                    {activeTab === 'timeline' && (
                                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                            <div className="flex items-center justify-between mb-8">
                                                <div>
                                                    <h4 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Histórico da Entidade</h4>
                                                    <p className="text-xs text-slate-500 font-bold">Trilha de auditoria e registros de governança</p>
                                                </div>
                                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-3xl">
                                                    <History size={28} />
                                                </div>
                                            </div>

                                            <div className="relative">
                                                {!editingEntity?.id ? (
                                                    <BlockedTabOverlay message="O histórico será gerado após o registro da entidade." />
                                                ) : isTimelineLoading ? (
                                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                        <Loader2 size={48} className="text-indigo-500 mb-4 animate-spin" />
                                                        <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando histórico...</p>
                                                    </div>
                                                ) : corporateTimeline.length === 0 ? (
                                                    <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                        <Clock size={48} className="text-slate-300 mb-4" />
                                                        <p className="text-slate-400 font-bold italic">Nenhum evento registrado ainda.</p>
                                                    </div>
                                                ) : corporateTimeline.map((entry, idx) => (
                                                    <div key={entry.id} className="relative pl-12 pb-12 group">
                                                        {idx < corporateTimeline.length - 1 && (
                                                            <div className="absolute left-[19px] top-10 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors" />
                                                        )}
                                                        
                                                        <div className={`absolute left-0 top-0 w-10 h-10 rounded-[1.25rem] z-10 flex items-center justify-center shadow-sm border ${
                                                            entry.action === 'STATUS_CHANGE' 
                                                                ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800' 
                                                                : entry.action === 'CREATE'
                                                                ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                                : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                        }`}>
                                                            {entry.action === 'STATUS_CHANGE' ? <Zap size={16} /> : entry.action === 'CREATE' ? <Plus size={16} /> : <Clock size={16} />}
                                                        </div>

                                                        <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-8 rounded-[2.5rem] shadow-sm hover:shadow-xl hover:border-indigo-200 transition-all">
                                                            <div className="flex justify-between items-center mb-4">
                                                                <span className={`text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-xl ${
                                                                    entry.action === 'STATUS_CHANGE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                                }`}>
                                                                    {entry.action}
                                                                </span>
                                                                <span className="text-[10px] font-bold text-slate-400">
                                                                    {entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : 'Agora'}
                                                                </span>
                                                            </div>
                                                            <p className="text-base font-bold text-slate-700 dark:text-slate-200 leading-relaxed uppercase tracking-tight">
                                                                {entry.description}
                                                            </p>
                                                            <div className="mt-6 flex items-center gap-3 pt-4 border-t border-slate-50 dark:border-slate-800">
                                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                                    <UserIcon size={12} className="text-slate-500" />
                                                                </div>
                                                                <span className="text-xs text-slate-500 font-bold">Responsável: <span className="text-indigo-600 dark:text-indigo-400">
                                                                    {(() => {
                                                                        if (!entry.user_id) return entry.user_name || 'Sistema';
                                                                        const member = team.find(m => m.id === entry.user_id);
                                                                        if (member) return member.full_name;
                                                                        if (entry.user_id === user.id) return user.name;
                                                                        return entry.user_name || 'Sistema';
                                                                    })()}
                                                                </span></span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-3xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        Fechar
                                    </button>
                                    {(activeTab === 'basic' || !editingEntity?.id) && (
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                        >
                                            <Save size={20} /> {editingEntity?.id ? 'Salvar Alterações' : 'Criar Entidade Agora'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Shareholder Modal */}
            <AnimatePresence>
                {isShareholderModalOpen && (
                    <div key="shareholder-modal-overlay" className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                            onClick={() => setIsShareholderModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <form onSubmit={handleSaveShareholder}>
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        Dados do Sócio
                                    </h3>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Nome do Sócio / Empresa *</label>
                                        <input
                                            required value={editingShareholder?.shareholder_name || ''}
                                            onChange={e => setEditingShareholder({ ...editingShareholder, shareholder_name: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo de Sócio</label>
                                            <select
                                                value={editingShareholder?.shareholder_type || 'Person'}
                                                onChange={e => setEditingShareholder({ ...editingShareholder, shareholder_type: e.target.value as any })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold"
                                            >
                                                <option value="Person">Pessoa Física</option>
                                                <option value="Entity">Holding / Pessoa Jurídica</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Participação (%)</label>
                                            <input
                                                type="number" step="0.01"
                                                value={editingShareholder?.ownership_percentage || ''}
                                                onChange={e => setEditingShareholder({ ...editingShareholder, ownership_percentage: parseFloat(e.target.value) })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-black text-indigo-600"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Quantidade de Cotas/Ações</label>
                                        <input
                                            type="number"
                                            value={editingShareholder?.shares_count || ''}
                                            onChange={e => setEditingShareholder({ ...editingShareholder, shares_count: e.target.value ? parseInt(e.target.value) : 0 })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                    <button
                                        type="button" onClick={() => setIsShareholderModalOpen(false)}
                                        className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                    >
                                        Confirmar Sócio
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Document Modal */}
            <AnimatePresence>
                {isDocumentModalOpen && (
                    <div key="document-modal-overlay" className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
                            onClick={() => setIsDocumentModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <form onSubmit={handleSaveDocument}>
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {editingDocument?.id ? 'Editar Documento' : 'Novo Documento'}
                                    </h3>
                                </div>
                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Título do Documento *</label>
                                        <input
                                            required value={editingDocument?.title || ''}
                                            onChange={e => setEditingDocument({ ...editingDocument, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-600/10 font-bold"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo</label>
                                            <select
                                                value={editingDocument?.document_type || 'Contrato Social'}
                                                onChange={e => setEditingDocument({ ...editingDocument, document_type: e.target.value as any })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold"
                                            >
                                                <option value="Contrato Social">Contrato Social</option>
                                                <option value="Ata">Ata</option>
                                                <option value="Estatuto">Estatuto</option>
                                                <option value="Acordo de Sócios">Acordo de Sócios</option>
                                                <option value="Planilha">Planilha</option>
                                                <option value="Outros">Outros</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Data de Referência</label>
                                            <input
                                                type="date"
                                                value={editingDocument?.event_date ? new Date(editingDocument.event_date).toISOString().split('T')[0] : ''}
                                                onChange={e => setEditingDocument({ ...editingDocument, event_date: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none font-bold"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Upload do Documento</label>
                                        <PremiumFileUpload 
                                            ref={corporateDocUploadRef}
                                            isManual={true}
                                            bucket="nexus-documents"
                                            path={`corporate/${editingEntity?.id || 'temp'}`}
                                            label="Arraste o documento aqui ou clique para selecionar"
                                            onFileSelect={(file) => {
                                                setCorporateDocFile(file);
                                                if (file && !editingDocument?.title) {
                                                    setEditingDocument({ ...editingDocument, title: file.name.split('.')[0] });
                                                }
                                            }}
                                            onUploadComplete={(url) => setEditingDocument({ ...editingDocument, file_url: url })}
                                        />
                                        {editingDocument?.file_url && (
                                            <div className="mt-4 flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-2xl animate-in zoom-in-95 duration-300">
                                                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                                    <Check size={18} />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Documento Carregado</p>
                                                    <p className="text-[10px] text-emerald-600/70 truncate font-mono">{editingDocument.file_url}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                    <button
                                        type="button" onClick={() => setIsDocumentModalOpen(false)}
                                        className="flex-1 py-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-[10px] font-black uppercase tracking-widest"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20"
                                    >
                                        Salvar Documento
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </>
    );
};
