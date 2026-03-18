import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    XCircle, Building2, FileText, History, Trash2, Pencil, Calendar, Download, 
    Sparkles, Save, ChevronDown, Clock, Loader2, Zap, User as UserIcon, Plus,
    CheckCircle2
} from 'lucide-react';
import { Asset, Person, Lawsuit, TimelineEntry, TeamMember, User, AssetDocument } from '@/types';
import { useTranslation } from '@/contexts/language-context';
import { BlockedTabOverlay, PremiumFileUpload } from '../nexus-components';

interface AssetModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingAsset: Partial<Asset> | null;
    setEditingAsset: (asset: Partial<Asset> | null) => void;
    activeTab: string;
    setActiveTab: (tab: any) => void;
    handleSaveAsset: (e: React.FormEvent) => void;
    persons: Person[];
    lawsuits: Lawsuit[];
    justificationText: string;
    setJustificationText: (text: string) => void;
    assetTimeline: TimelineEntry[];
    setAssetTimeline: (timeline: TimelineEntry[]) => void;
    isTimelineLoading: boolean;
    team: TeamMember[];
    user: User;
    assetDocuments: AssetDocument[];
    pendingAssetDocuments: { file: File, docData: Partial<AssetDocument> }[];
    setPendingAssetDocuments: (docs: any) => void;
    isAssetDocModalOpen: boolean;
    setIsAssetDocModalOpen: (open: boolean) => void;
    editingAssetDoc: Partial<AssetDocument> | null;
    setEditingAssetDoc: (doc: Partial<AssetDocument> | null) => void;
    handleSaveAssetDocument: (e: React.FormEvent) => void;
    assetDocUploadRef: React.RefObject<any>;
    assetDocFile: File | null;
    setAssetDocFile: (file: File | null) => void;
    handleDownloadFile: (url: string, title: string) => void;
    handleSummarizeDocument: (doc: any) => void;
    handleDeleteAssetDocument: (id: string) => void;
}

export const AssetModal: React.FC<AssetModalProps> = ({
    isOpen,
    onClose,
    editingAsset,
    setEditingAsset,
    activeTab,
    setActiveTab,
    handleSaveAsset,
    persons,
    lawsuits,
    justificationText,
    setJustificationText,
    assetTimeline,
    setAssetTimeline,
    isTimelineLoading,
    team,
    user,
    assetDocuments,
    pendingAssetDocuments,
    setPendingAssetDocuments,
    isAssetDocModalOpen,
    setIsAssetDocModalOpen,
    editingAssetDoc,
    setEditingAssetDoc,
    handleSaveAssetDocument,
    assetDocUploadRef,
    assetDocFile,
    setAssetDocFile,
    handleDownloadFile,
    handleSummarizeDocument,
    handleDeleteAssetDocument
}) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <div key="asset-modal-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        onClick={onClose}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                                        {editingAsset?.id ? 'Editar Ativo' : 'Novo Ativo'}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                                        Gestão Patrimonial & Garantias
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                >
                                    <XCircle size={28} />
                                </button>
                            </div>
                            
                            {/* Asset Modal Tabs */}
                            <div className="mt-8">
                                <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('basic')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Building2 size={14} /> Dados Básicos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('docs')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'docs' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <FileText size={14} /> Documentos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('timeline')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-black transition-all ${activeTab === 'timeline' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl' : 'text-slate-500 hover:text-slate-700'} ${!editingAsset?.id ? 'opacity-50' : ''}`}
                                    >
                                        <History size={14} /> Histórico {!editingAsset?.id && '🔒'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveAsset} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto no-scrollbar p-8">
                                {activeTab === 'basic' ? (
                                    <div className="space-y-6 animate-in fade-in duration-500">
                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Título do Ativo *</label>
                                        <input
                                            type="text"
                                            required
                                            value={editingAsset?.title || ''}
                                            onChange={e => setEditingAsset({ ...editingAsset, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all"
                                            placeholder="Ex: Apartamento Copacabana, Hilux 2023..."
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo de Ativo</label>
                                            <div className="relative">
                                                <select
                                                    value={editingAsset?.asset_type || 'Outros'}
                                                    onChange={e => setEditingAsset({ ...editingAsset, asset_type: e.target.value as any })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer"
                                                >
                                                    <option value="Imóvel">Imóvel</option>
                                                    <option value="Veículo">Veículo</option>
                                                    <option value="Conta Bancária">Conta Bancária</option>
                                                    <option value="Ação Judicial">Ação Judicial</option>
                                                    <option value="Empresa / Quotas">Empresa / Quotas</option>
                                                    <option value="Outros">Outros</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Status</label>
                                            <div className="relative">
                                                <select
                                                    value={editingAsset?.status || 'Ativo'}
                                                    onChange={e => setEditingAsset({ ...editingAsset, status: e.target.value as any })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer"
                                                >
                                                    <option value="Ativo">Ativo</option>
                                                    <option value="Bloqueado">Bloqueado</option>
                                                    <option value="Vendido">Vendido</option>
                                                    <option value="Em Garantia">Em Garantia</option>
                                                    <option value="Alienado">Alienado</option>
                                                </select>
                                                <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.justification.label')}</label>
                                        <input
                                            value={justificationText}
                                            onChange={e => setJustificationText(e.target.value)}
                                            placeholder={t('modules.nexus.modals.justification.modalPlaceholder')}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold text-xs"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Valor Estimado (R$)</label>
                                            <input
                                                type="text"
                                                value={editingAsset?.value ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(editingAsset.value).replace('R$', '').trim() : ''}
                                                onChange={e => {
                                                    const rawValue = e.target.value.replace(/\D/g, '');
                                                    if (!rawValue) {
                                                        setEditingAsset({ ...editingAsset, value: undefined });
                                                        return;
                                                    }
                                                    setEditingAsset({ ...editingAsset, value: parseInt(rawValue, 10) / 100 });
                                                }}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                placeholder="0,00"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Doc / Registro / Matrícula</label>
                                            <input
                                                type="text"
                                                value={editingAsset?.registration_number || ''}
                                                onChange={e => setEditingAsset({ ...editingAsset, registration_number: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                placeholder="Ex: Matrícula 1234..."
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 gap-4">
                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Vincular a Pessoa (Cliente/Proprietário)</label>
                                            <div className="relative">
                                                <select
                                                    value={editingAsset?.person_id || ''}
                                                    onChange={e => setEditingAsset({ ...editingAsset, person_id: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer text-sm"
                                                >
                                                    <option value="">Nenhum</option>
                                                    {persons.map(p => (
                                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Vincular a Processo</label>
                                            <div className="relative">
                                                <select
                                                    value={editingAsset?.lawsuit_id || ''}
                                                    onChange={e => setEditingAsset({ ...editingAsset, lawsuit_id: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold appearance-none cursor-pointer text-sm"
                                                >
                                                    <option value="">Nenhum processo referenciado</option>
                                                    {lawsuits.map(law => (
                                                        <option key={law.id} value={law.id}>{law.cnj_number || law.case_title}</option>
                                                    ))}
                                                </select>
                                                <ChevronDown size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Descrição / Notas</label>
                                        <textarea
                                            rows={4}
                                            value={editingAsset?.description || ''}
                                            onChange={e => setEditingAsset({ ...editingAsset, description: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold resize-none"
                                        />
                                    </div>
                                </div>
                                ) : activeTab === 'timeline' ? (
                                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Histórico do Ativo</h4>
                                                <p className="text-xs text-slate-500 font-bold">Auditoria de movimentações e garantias</p>
                                            </div>
                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                                                <History size={24} />
                                            </div>
                                        </div>

                                        <div className="relative">
                                            {!editingAsset?.id ? (
                                                <BlockedTabOverlay message="O histórico de auditoria do patrimônio será liberado após o registro inicial do ativo." />
                                            ) : isTimelineLoading ? (
                                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                    <Loader2 size={48} className="text-indigo-500 mb-4 animate-spin" />
                                                    <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">Carregando histórico...</p>
                                                </div>
                                            ) : assetTimeline.length === 0 ? (
                                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                    <Clock size={48} className="text-slate-300 mb-4" />
                                                    <p className="text-slate-400 font-bold italic">Nenhum evento registrado ainda.</p>
                                                </div>
                                            ) : assetTimeline.map((entry, idx) => (
                                                <div key={entry.id} className="relative pl-10 pb-10 group">
                                                    {idx < assetTimeline.length - 1 && (
                                                        <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors" />
                                                    )}
                                                    
                                                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-2xl z-10 flex items-center justify-center shadow-sm border ${
                                                        entry.action === 'STATUS_CHANGE' 
                                                            ? 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800' 
                                                            : entry.action === 'CREATE'
                                                            ? 'bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800'
                                                            : 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800'
                                                    }`}>
                                                        {entry.action === 'STATUS_CHANGE' ? <Zap size={14} /> : entry.action === 'CREATE' ? <Plus size={14} /> : <Clock size={14} />}
                                                    </div>

                                                    <div className="bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all hover:border-indigo-200 dark:hover:border-indigo-900/40">
                                                        <div className="flex justify-between items-center mb-3">
                                                            <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                                                                entry.action === 'STATUS_CHANGE' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'
                                                            }`}>
                                                                {entry.action}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-slate-400">
                                                                {entry.created_at ? new Date(entry.created_at).toLocaleString('pt-BR') : 'Agora'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm font-bold text-slate-700 dark:text-slate-200 leading-relaxed uppercase tracking-tight">
                                                            {entry.description}
                                                        </p>
                                                        <div className="mt-4 flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
                                                                <UserIcon size={10} className="text-slate-500" />
                                                            </div>
                                                            <span className="text-[10px] text-slate-500 font-bold">Por: <span className="text-indigo-600 dark:text-indigo-400">
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
                                ) : (
                                    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Documentos do Ativo</h4>
                                                <p className="text-xs text-slate-500 font-bold">Matrículas, CRLVs e Avaliações</p>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => { setEditingAssetDoc({ document_type: 'Matrícula' as any, event_date: new Date().toISOString() }); setIsAssetDocModalOpen(true); }}
                                                className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                                title="Novo Documento"
                                            >
                                                <Plus size={20} />
                                                <span className="text-[10px] font-black uppercase tracking-widest">Novo</span>
                                            </button>
                                        </div>

                                        <div className="grid grid-cols-1 gap-4">
                                            {assetDocuments.length === 0 && pendingAssetDocuments.length === 0 ? (
                                                <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                                                        <FileText size={32} />
                                                    </div>
                                                    <p className="text-slate-500 font-bold">Nenhum documento anexado ao ativo</p>
                                                    <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-1">Anexe certidões, laudos ou fotos</p>
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Pending Documents */}
                                                    {pendingAssetDocuments.map((pending, idx) => (
                                                        <div key={`pending-${idx}`} className="group bg-amber-50/30 dark:bg-amber-900/10 p-6 rounded-[2.5rem] border border-amber-200/50 dark:border-amber-800/50 flex items-center justify-between shadow-sm animate-in slide-in-from-left-4 duration-300">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-900/40 text-amber-600 flex items-center justify-center shadow-inner">
                                                                    <FileText size={28} />
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm italic">{pending.docData.title}</h5>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/60 text-[8px] font-black text-amber-700 dark:text-amber-400 rounded-lg uppercase tracking-widest animate-pulse">
                                                                            Aguardando Salvamento
                                                                        </span>
                                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">
                                                                            {pending.docData.document_type}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setPendingAssetDocuments((prev: any[]) => prev.filter((_, i) => i !== idx))}
                                                                    className="p-3 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/30 rounded-xl transition-all"
                                                                    title="Remover da fila"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}

                                                    {/* Saved Documents */}
                                                    {assetDocuments.map(doc => (
                                                        <div key={doc.id} className="group bg-slate-50 dark:bg-slate-950 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-500/30 transition-all flex items-center justify-between shadow-sm hover:shadow-xl hover:shadow-indigo-500/5">
                                                            <div className="flex items-center gap-5">
                                                                <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                                                                    <FileText size={28} />
                                                                </div>
                                                                <div>
                                                                    <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tighter text-sm">{doc.title}</h5>
                                                                    <div className="flex items-center gap-3 mt-1">
                                                                        <span className="px-2 py-0.5 bg-slate-200 dark:bg-slate-800 text-[9px] font-black text-slate-600 dark:text-slate-400 rounded-lg uppercase tracking-widest">
                                                                            {doc.document_type}
                                                                        </span>
                                                                        {doc.event_date && (
                                                                            <span className="text-[10px] text-slate-400 font-bold flex items-center gap-1">
                                                                                <Calendar size={10} /> {new Date(doc.event_date).toLocaleDateString('pt-BR')}
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                {doc.file_url && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleDownloadFile(doc.file_url!, doc.title || 'documento')}
                                                                        className="p-3 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 rounded-xl transition-all"
                                                                        title="Fazer Download"
                                                                    >
                                                                        <Download size={18} />
                                                                    </button>
                                                                )}
                                                                <button 
                                                                    type="button" 
                                                                    onClick={() => handleSummarizeDocument(doc)}
                                                                    className="p-3 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-xl transition-all"
                                                                    title="Resumo IA"
                                                                >
                                                                    <Sparkles size={18} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => { setEditingAssetDoc(doc); setIsAssetDocModalOpen(true); }}
                                                                    className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 rounded-xl transition-all"
                                                                >
                                                                    <Pencil size={18} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => handleDeleteAssetDocument(doc.id)}
                                                                    className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 rounded-xl transition-all"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {(activeTab !== 'docs' || !editingAsset?.id) && (
                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                    >
                                        <Save size={20} /> {editingAsset?.id ? 'Salvar Ativo' : 'Criar Ativo Agora'}
                                    </button>
                                </div>
                            )}
                        </form>
                    </motion.div>
                </div>
            )}
            {/* Asset Document Modal */}
            <AnimatePresence>
                {isAssetDocModalOpen && (
                    <div key="asset-doc-modal-overlay" className="fixed inset-0 z-[300] flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/60 backdrop-blur-md"
                            onClick={() => setIsAssetDocModalOpen(false)}
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800"
                        >
                            <form onSubmit={handleSaveAssetDocument}>
                                <div className="p-8 border-b border-slate-100 dark:border-slate-800">
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {editingAssetDoc?.id ? t('modules.nexus.modals.document.editAssetTitle') : t('modules.nexus.modals.document.newAssetTitle')}
                                    </h3>
                                </div>

                                <div className="p-8 space-y-6">
                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.document.labelTitle')} *</label>
                                        <input
                                            required
                                            value={editingAssetDoc?.title || ''}
                                            onChange={e => setEditingAssetDoc({ ...editingAssetDoc, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            placeholder={t('modules.nexus.modals.document.placeholderTitle')}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.type')}</label>
                                            <select
                                                value={editingAssetDoc?.document_type || 'Matrícula'}
                                                onChange={e => setEditingAssetDoc({ ...editingAssetDoc, document_type: e.target.value as any })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            >
                                                <option value="Matrícula">Matrícula</option>
                                                <option value="Escritura">Escritura</option>
                                                <option value="CRLV">CRLV</option>
                                                <option value="Contrato Compra e Venda">Contrato Compra e Venda</option>
                                                <option value="Laudo de Avaliação">Laudo de Avaliação</option>
                                                <option value="Fotos">Fotos</option>
                                                <option value="Outros">Outros</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('common.referenceDate')}</label>
                                            <input
                                                type="date"
                                                value={editingAssetDoc?.event_date?.split('T')[0] || ''}
                                                onChange={e => setEditingAssetDoc({ ...editingAssetDoc, event_date: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.document.labelFile')}</label>
                                        <PremiumFileUpload
                                            ref={assetDocUploadRef}
                                            isManual={true}
                                            onUploadComplete={(url: string) => setEditingAssetDoc({ ...editingAssetDoc, file_url: url })}
                                            onFileSelect={(file: File | null) => {
                                                setAssetDocFile(file);
                                                if (file && !editingAssetDoc?.title) {
                                                    setEditingAssetDoc({ ...editingAssetDoc, title: file.name.split('.')[0] });
                                                }
                                            }}
                                            bucket="nexus-documents"
                                            path={`assets/${editingAsset?.id}`}
                                            label={t('modules.nexus.modals.document.labelFile')}
                                            accept="application/pdf,image/*"
                                        />
                                        {editingAssetDoc?.file_url && (
                                            <div className="mt-2 flex items-center gap-2 text-emerald-600 font-bold text-xs bg-emerald-50 dark:bg-emerald-900/20 p-3 rounded-xl">
                                                <CheckCircle2 size={16} /> {t('common.success')}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="p-8 bg-slate-50 dark:bg-slate-800/50 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsAssetDocModalOpen(false)}
                                        className="flex-1 px-8 py-4 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-xs"
                                    >
                                        {t('common.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all text-xs"
                                    >
                                        {t('modules.nexus.modals.document.save')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};
