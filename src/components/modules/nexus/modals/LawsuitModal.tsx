import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, XCircle, Calendar, AlertTriangle, Network, Shield, FileText, Zap, DollarSign, History, Sparkles, Brain, Loader2, Plus, Download, Trash2, Check, User as UserIcon, Clock, Search, TrendingUp, TrendingDown, CheckCircle2 } from 'lucide-react';
import { PremiumCombobox, BlockedTabOverlay, PremiumFileUpload } from '../nexus-components';
import { MovementsTab } from './MovementsTab';
import { useTranslation } from '@/contexts/language-context';


import { Lawsuit, Person, TeamMember, LawsuitDocument, TimelineEntry, FinancialTransaction, Movement } from '@/types';

interface LawsuitModalProps {
    isLawsuitModalOpen: boolean;
    setIsLawsuitModalOpen: any;
    setLawsuitTimeline: any;
    setActiveLawsuitTab: any;
    editingLawsuit: Partial<Lawsuit> | null;
    handleOpenNexoVisual: any;
    setActiveTab: any;
    setEditingAsset: any;
    setIsAssetModalOpen: any;
    activeLawsuitTab: string;
    persons: Person[];
    setEditingLawsuit: any;
    isLoadingCities: boolean;
    cities: any[];
    handleSaveLawsuit: any;
    lawsuitTimeline: TimelineEntry[];
    team: TeamMember[];
    user: any;
    aiLawsuitSummary: string | null;
    isAiSummarizing: boolean;
    handleSummarizeWithAI: any;
    lawsuitDocuments: LawsuitDocument[];
    pendingLawsuitDocuments: any[];
    setEditingLawsuitDoc: any;
    setIsLawsuitDocModalOpen: any;
    handleSummarizeDocument: any;
    handleDeleteLawsuitDocument: any;
    setPendingLawsuitDocuments: any;
    handleFetchLawsuitFinances: any;
    formatCurrency: any;
    formatCNJ: any;
    ESFERAS: string[];
    UFS: string[];
    TRIBUNAIS: Record<string, any>;
    RITOS: Record<string, string[]>;
    chambers: any[];
    lawsuitFinances: FinancialTransaction[];
    isFinancialLoading: boolean;
    handleSaveFinancialTransaction: any;
    handleDeleteFinancialTransaction: any;
    isLawsuitTimelineLoading: boolean;
    setAiLawsuitSummary: any;
    isLawsuitDocModalOpen: boolean;
    editingLawsuitDoc: Partial<LawsuitDocument> | null;
    handleSaveLawsuitDocument: (e: React.FormEvent) => void;
    lawsuitDocUploadRef: React.RefObject<any>;
    lawsuitDocFile: File | null;
    setLawsuitDocFile: (file: File | null) => void;
    movements: Movement[];
    isMovementsLoading: boolean;
}

export const LawsuitModal = (props: LawsuitModalProps) => {

const { t } = useTranslation();
const { 
    isLawsuitModalOpen, setIsLawsuitModalOpen, setLawsuitTimeline, setActiveLawsuitTab, 
    editingLawsuit, handleOpenNexoVisual, setActiveTab, setEditingAsset, 
    setIsAssetModalOpen, activeLawsuitTab, persons, setEditingLawsuit, 
    isLoadingCities, cities, handleSaveLawsuit, lawsuitTimeline, team, user, 
    aiLawsuitSummary, isAiSummarizing, handleSummarizeWithAI, lawsuitDocuments, 
    pendingLawsuitDocuments, setEditingLawsuitDoc, setIsLawsuitDocModalOpen, 
    handleSummarizeDocument, handleDeleteLawsuitDocument, setPendingLawsuitDocuments, 
    handleFetchLawsuitFinances, formatCurrency, formatCNJ, ESFERAS, UFS, 
    TRIBUNAIS, RITOS, chambers, lawsuitFinances, isFinancialLoading, 
    handleSaveFinancialTransaction, handleDeleteFinancialTransaction, 
    isLawsuitTimelineLoading, setAiLawsuitSummary, isLawsuitDocModalOpen,
    editingLawsuitDoc, handleSaveLawsuitDocument, lawsuitDocUploadRef,
    lawsuitDocFile, setLawsuitDocFile, movements, isMovementsLoading
} = props;

    const [authorSearch, setAuthorSearch] = React.useState('');
    const [isAuthorDropdownOpen, setIsAuthorDropdownOpen] = React.useState(false);
    const [defendantSearch, setDefendantSearch] = React.useState('');
    const [isDefendantDropdownOpen, setIsDefendantDropdownOpen] = React.useState(false);
    const [justificationText, setJustificationText] = React.useState('');
    const [isEditingFinancial, setIsEditingFinancial] = React.useState(false);
    const [editingFinancial, setEditingFinancial] = React.useState<any>(null);
return (
<>
            {/* Lawsuit Drawer (Slide-over Pattern) */}
            <AnimatePresence>
                {isLawsuitModalOpen && (
                    <div key="lawsuit-drawer-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { setIsLawsuitModalOpen(false); setLawsuitTimeline([]); setActiveLawsuitTab('basic'); }}
                        />

                        {/* Drawer Content */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                            className="relative w-full max-w-5xl bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                                            {editingLawsuit?.id ? 'Cadastro de Processo' : 'Cadastro de Processo'}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 font-bold mt-1">
                                            Central de Inteligência Jurídica Veritum
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        {editingLawsuit?.id && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleOpenNexoVisual('lawsuit', editingLawsuit)}
                                                    className="p-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 rounded-xl transition-all shadow-sm"
                                                    title="Ver Mapa Mental (Nexo Visual)"
                                                >
                                                    <Network size={28} className="p-1" />
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setIsLawsuitModalOpen(false);
                                                        setActiveTab('ativos');
                                                        setEditingAsset({
                                                            status: 'Ativo',
                                                            lawsuit_id: editingLawsuit.id,
                                                            person_id: editingLawsuit.author_id || '',
                                                            asset_type: 'Outros'
                                                        });
                                                        setTimeout(() => setIsAssetModalOpen(true), 150);
                                                    }}
                                                    className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/40 rounded-xl transition-all shadow-sm"
                                                    title="Vincular Novo Ativo/Garantia ao Processo"
                                                >
                                                    <Shield size={28} className="p-1" />
                                                </button>
                                            </>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => { setIsLawsuitModalOpen(false); setLawsuitTimeline([]); setActiveLawsuitTab('basic'); }}
                                            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                        >
                                            <XCircle size={28} />
                                        </button>
                                    </div>
                                </div>

                                {/* Tab Switcher - Premium Style */}
                                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-full">
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('basic')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Zap size={14} /> {t('common.basic') || 'Dados Básicos'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('advanced')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'advanced' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <Zap size={14} /> {t('common.advanced') || 'Avançado'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('docs')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'docs' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        <FileText size={14} /> Documentos
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => { setActiveLawsuitTab('financeiro'); if (editingLawsuit?.id) handleFetchLawsuitFinances(editingLawsuit.id); }}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'financeiro' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'} ${!editingLawsuit?.id ? 'opacity-50' : ''}`}
                                    >
                                        <DollarSign size={14} /> Financeiro {!editingLawsuit?.id && '🔒'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('timeline')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'timeline' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'} ${!editingLawsuit?.id ? 'opacity-50' : ''}`}
                                    >
                                        <History size={14} /> Histórico {!editingLawsuit?.id && '🔒'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('movements')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'movements' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'} ${!editingLawsuit?.id ? 'opacity-50' : ''}`}
                                    >
                                        <TrendingUp size={14} /> {t('modules.nexus.tabs.movements') || 'Andamentos'} {!editingLawsuit?.id && '🔒'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setActiveLawsuitTab('ai')}
                                        className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-[11px] font-black transition-all whitespace-nowrap ${activeLawsuitTab === 'ai' ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-600 shadow-xl shadow-amber-600/10' : 'text-slate-500 hover:text-slate-700'} ${!editingLawsuit?.id ? 'opacity-50' : ''}`}
                                    >
                                        <Sparkles size={14} className={activeLawsuitTab === 'ai' ? 'animate-pulse' : ''} /> {t('modules.nexus.modals.lawsuit.ai.tab') || 'IA'} {!editingLawsuit?.id && '🔒'}
                                    </button>
                                </div>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleSaveLawsuit} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                        {activeLawsuitTab === 'basic' ? (
                                            <div className="space-y-8">
                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.labelCnj')}</label>
                                                    <input
                                                        required
                                                        value={editingLawsuit?.cnj_number || ''}
                                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, cnj_number: formatCNJ(e.target.value) })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-mono font-black text-lg text-indigo-600 dark:text-indigo-400"
                                                        placeholder="0000000-00.0000.0.00.0000"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.labelTitle')}</label>
                                                    <input
                                                        value={editingLawsuit?.case_title || ''}
                                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, case_title: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                        placeholder={t('modules.nexus.modals.lawsuit.placeholderTitle')}
                                                    />
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {/* Searchable Select: Polo Ativo (Autor) */}
                                                    <div className="relative">
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.labelAuthor')}</label>
                                                        <div
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer flex items-center justify-between group hover:border-indigo-300 transition-all font-bold text-slate-800 dark:text-white"
                                                            onClick={() => { setIsAuthorDropdownOpen(!isAuthorDropdownOpen); setIsDefendantDropdownOpen(false); }}
                                                        >
                                                            <span className="truncate">
                                                                {persons.find(p => p.id === editingLawsuit?.author_id)?.full_name || t('modules.nexus.modals.lawsuit.selectCrm')}
                                                            </span>
                                                            <Search size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                        </div>

                                                        {isAuthorDropdownOpen && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                                                    <input
                                                                        autoFocus
                                                                        placeholder="Pesquisar no CRM..."
                                                                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                                        value={authorSearch}
                                                                        onChange={e => setAuthorSearch(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto no-scrollbar">
                                                                    {['Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso'].map(type => {
                                                                        const typePersons = persons.filter(p => p.person_type === type && p.full_name?.toLowerCase().includes(authorSearch.toLowerCase()));
                                                                        if (typePersons.length === 0) return null;
                                                                        return (
                                                                            <div key={type}>
                                                                                <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-slate-800/50">
                                                                                    {type}
                                                                                </div>
                                                                                {typePersons.map(p => (
                                                                                    <div
                                                                                        key={p.id}
                                                                                        className="px-6 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-sm font-bold border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                                                                                        onClick={() => {
                                                                                            setEditingLawsuit({ ...editingLawsuit, author_id: p.id });
                                                                                            setIsAuthorDropdownOpen(false);
                                                                                            setAuthorSearch('');
                                                                                        }}
                                                                                    >
                                                                                        {p.full_name}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    {/* Searchable Select: Polo Passivo (Réu) */}
                                                    <div className="relative">
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Polo Passivo (Réu)</label>
                                                        <div
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer flex items-center justify-between group hover:border-indigo-300 transition-all font-bold text-slate-800 dark:text-white"
                                                            onClick={() => { setIsDefendantDropdownOpen(!isDefendantDropdownOpen); setIsAuthorDropdownOpen(false); }}
                                                        >
                                                            <span className="truncate">
                                                                {persons.find(p => p.id === editingLawsuit?.defendant_id)?.full_name || t('modules.nexus.modals.lawsuit.selectCrm')}
                                                            </span>
                                                            <Search size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                                        </div>

                                                        {isDefendantDropdownOpen && (
                                                            <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-[150] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                                                                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                                                                    <input
                                                                        autoFocus
                                                                        placeholder="Pesquisar no CRM..."
                                                                        className="w-full bg-slate-50 dark:bg-slate-950 px-4 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                                        value={defendantSearch}
                                                                        onChange={e => setDefendantSearch(e.target.value)}
                                                                    />
                                                                </div>
                                                                <div className="max-h-60 overflow-y-auto no-scrollbar">
                                                                    {['Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso'].map(type => {
                                                                        const typePersons = persons.filter(p => p.person_type === type && p.full_name?.toLowerCase().includes(defendantSearch.toLowerCase()));
                                                                        if (typePersons.length === 0) return null;
                                                                        return (
                                                                            <div key={type}>
                                                                                <div className="px-6 py-2 bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-y border-slate-100 dark:border-slate-800/50">
                                                                                    {type}
                                                                                </div>
                                                                                {typePersons.map(p => (
                                                                                    <div
                                                                                        key={p.id}
                                                                                        className="px-6 py-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 cursor-pointer transition-colors text-sm font-bold border-b border-slate-50 dark:border-slate-800/50 last:border-0"
                                                                                        onClick={() => {
                                                                                            setEditingLawsuit({ ...editingLawsuit, defendant_id: p.id });
                                                                                            setIsDefendantDropdownOpen(false);
                                                                                            setDefendantSearch('');
                                                                                        }}
                                                                                    >
                                                                                        {p.full_name}
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div>
                                                    <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Advogado Responsável</label>
                                                    <select
                                                        required
                                                        value={editingLawsuit?.responsible_lawyer_id || ''}
                                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, responsible_lawyer_id: e.target.value })}
                                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                    >
                                                        <option value="">{t('modules.nexus.modals.lawsuit.selectTeam')}</option>
                                                        {team.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
                                                    </select>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Status do Processo</label>
                                                        <select
                                                            value={editingLawsuit?.status || 'Ativo'}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, status: e.target.value as any })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                        >
                                                            <option value="Ativo">Ativo</option>
                                                            <option value="Suspenso">Suspenso</option>
                                                            <option value="Arquivado">Arquivado</option>
                                                            <option value="Encerrado">Encerrado</option>
                                                        </select>
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

                                                    <div className="col-span-2">
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Valor da Causa</label>
                                                        <div className="relative">
                                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                                                            <input
                                                                value={editingLawsuit?.value ? formatCurrency(editingLawsuit.value) : ''}
                                                                onChange={e => {
                                                                    const raw = e.target.value.replace(/\D/g, '');
                                                                    setEditingLawsuit({ ...editingLawsuit, value: Number(raw) / 100 });
                                                                }}
                                                                className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-lg text-emerald-600 dark:text-emerald-400"
                                                                placeholder="0,00"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : activeLawsuitTab === 'advanced' ? (
                                            <div className="space-y-8 animate-in fade-in duration-300">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Esfera Judicial</label>
                                                        <select
                                                            value={editingLawsuit?.sphere || ''}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, sphere: e.target.value, court: '', rito: '' })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        >
                                                            <option value="">Esfera...</option>
                                                            {ESFERAS.map(e => <option key={e} value={e}>{e}</option>)}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Estado (UF)</label>
                                                        <select
                                                            value={editingLawsuit?.state || ''}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, state: e.target.value, court: '', city: '' })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-center"
                                                        >
                                                            <option value="">UF</option>
                                                            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Tribunal</label>
                                                        <select
                                                            value={editingLawsuit?.court || ''}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, court: e.target.value, chamber: '' })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        >
                                                            <option value="">Selecione o Tribunal...</option>
                                                            {[
                                                                ...(TRIBUNAIS[editingLawsuit?.sphere || '']?.[editingLawsuit?.state || ''] || []),
                                                                ...(TRIBUNAIS[editingLawsuit?.sphere || '']?.['Superior'] || []),
                                                                ...(TRIBUNAIS[editingLawsuit?.sphere || '']?.['default'] || [])
                                                            ].map(t_ => (
                                                                <option key={t_} value={t_}>{t_}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Rito Processual</label>
                                                        <select
                                                            value={editingLawsuit?.rito || ''}
                                                            onChange={e => setEditingLawsuit({ ...editingLawsuit, rito: e.target.value })}
                                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                        >
                                                            <option value="">Rito...</option>
                                                            {(RITOS[editingLawsuit?.sphere as keyof typeof RITOS] || RITOS['default']).map(r => (
                                                                <option key={r} value={r}>{r}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 gap-4">
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Órgão Julgador (Vara/Câmara)</label>
                                                        <PremiumCombobox
                                                            value={editingLawsuit?.chamber || ''}
                                                            onChange={val => setEditingLawsuit({ ...editingLawsuit, chamber: val })}
                                                            options={chambers}
                                                            placeholder="Ex: 12ª Vara"
                                                            creatable
                                                            disabled={!editingLawsuit?.court}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">Comarca / Cidade</label>
                                                        <PremiumCombobox
                                                            value={editingLawsuit?.city || ''}
                                                            onChange={val => setEditingLawsuit({ ...editingLawsuit, city: val })}
                                                            options={cities}
                                                            placeholder={isLoadingCities ? "Carregando cidades no servidor..." : "Selecione a Comarca..."}
                                                            disabled={!editingLawsuit?.state}
                                                            creatable
                                                        />
                                                    </div>
                                                </div>

                                                    <div className="pt-8 border-t border-slate-100 dark:border-slate-800/50">
                                                        <div className="flex items-center gap-3 mb-6">
                                                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg">
                                                                <AlertTriangle size={18} />
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avaliação de Risco</p>
                                                                <h5 className="font-black text-slate-700 dark:text-white uppercase tracking-tighter">Probabilidade & Provisão</h5>
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.advanced.riskProbability')}</label>
                                                                <select
                                                                    value={editingLawsuit?.probability_of_success || ''}
                                                                    onChange={e => setEditingLawsuit({ ...editingLawsuit, probability_of_success: e.target.value as any })}
                                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                                >
                                                                    <option value="">{t('common.notApplicable')}</option>
                                                                    <option value="Provável">{t('modules.nexus.modals.lawsuit.advanced.probHigh')}</option>
                                                                    <option value="Possível">{t('modules.nexus.modals.lawsuit.advanced.probMedium')}</option>
                                                                    <option value="Remoto">{t('modules.nexus.modals.lawsuit.advanced.probLow')}</option>
                                                                </select>
                                                            </div>
                                                            <div>
                                                                <label className="block text-[11px] font-bold text-slate-400 mb-2 px-1">{t('modules.nexus.modals.lawsuit.advanced.riskProvision')}</label>
                                                                <div className="relative">
                                                                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-slate-400">R$</span>
                                                                    <input
                                                                        value={editingLawsuit?.provision_amount ? formatCurrency(editingLawsuit.provision_amount) : ''}
                                                                        onChange={e => {
                                                                            const raw = e.target.value.replace(/\D/g, '');
                                                                            setEditingLawsuit({ ...editingLawsuit, provision_amount: Number(raw) / 100 });
                                                                        }}
                                                                        className="w-full pl-14 pr-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-black text-rose-600 dark:text-rose-400"
                                                                        placeholder="0,00"
                                                                    />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                        ) : activeLawsuitTab === 'financeiro' ? (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                {!editingLawsuit?.id ? (
                                                    <BlockedTabOverlay message="A gestão financeira estará disponível após a criação deste processo." />
                                                ) : (
                                                    <>
                                                        <div className="grid grid-cols-4 gap-4 mb-8">
                                                            <div className="p-6 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-3xl border border-emerald-100/50">
                                                                <p className="text-[10px] font-black uppercase text-emerald-600 mb-1 opacity-70">{t('modules.nexus.finance.fees')}</p>
                                                                <p className="text-xl font-black text-emerald-600">R$ {lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                            </div>
                                                            <div className="p-6 bg-rose-50/50 dark:bg-rose-900/10 rounded-3xl border border-rose-100/50">
                                                                <p className="text-[10px] font-black uppercase text-rose-600 mb-1 opacity-70">{t('modules.nexus.finance.costs')}</p>
                                                                <p className="text-xl font-black text-rose-600">R$ {lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s,t) => s + (t.amount || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                            </div>
                                                            <div className="p-6 bg-indigo-50/50 dark:bg-indigo-900/10 rounded-3xl border border-indigo-100/50 shadow-sm shadow-indigo-100/20">
                                                                <p className="text-[10px] font-black uppercase text-indigo-600 mb-1 opacity-70">{t('modules.nexus.finance.balance')}</p>
                                                                <p className="text-xl font-black text-indigo-600">R$ {(
                                                                    lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0) -
                                                                    lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s, t) => s + (t.amount || 0), 0)
                                                                ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                                            </div>
                                                            <div className={`p-6 bg-amber-50/50 dark:bg-amber-900/10 rounded-3xl border border-amber-100/50 transition-all ${
                                                                (() => {
                                                                    const cr = lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                    const db = lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                    return db > 0 && (cr - db) > 0;
                                                                })() ? 'text-amber-600' : 'text-slate-400 opacity-50'
                                                            }`}>
                                                                <p className="text-[10px] font-black uppercase mb-1 opacity-70">{t('modules.nexus.finance.roi')}</p>
                                                                <p className="text-xl font-black flex items-center gap-2">
                                                                    {(() => {
                                                                        const cr = lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                        const db = lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                        if (db <= 0) return '-%';
                                                                        const roi = ((cr - db) / db) * 100;
                                                                        return `${roi.toFixed(0)}%`;
                                                                    })()}
                                                                    {(() => {
                                                                        const cr = lawsuitFinances.filter(t => t.entry_type === 'Credit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                        const db = lawsuitFinances.filter(t => t.entry_type === 'Debit').reduce((s,t) => s + (t.amount || 0), 0);
                                                                        return db > 0 && (cr - db) > 0;
                                                                    })() && <TrendingUp size={20} className="animate-pulse" />}
                                                                </p>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center justify-between mb-8">

                                                            <div>
                                                                <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.finance.title')}</h4>
                                                                <p className="text-xs text-slate-500 font-bold">{t('modules.nexus.finance.subtitle')}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingFinancial({
                                                                            lawsuit_id: editingLawsuit.id,
                                                                            transaction_date: new Date().toISOString().split('T')[0],
                                                                            entry_type: 'Debit',
                                                                            status: 'Pendente',
                                                                            amount: 0
                                                                        });
                                                                        setIsEditingFinancial(true);
                                                                    }}
                                                                    className={`p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-2xl flex items-center gap-2 hover:bg-rose-100 transition-all font-black text-[10px] uppercase tracking-widest border border-rose-100 ${isEditingFinancial && editingFinancial?.entry_type === 'Debit' ? 'ring-2 ring-rose-500 shadow-lg shadow-rose-200 dark:shadow-rose-900/40 transform scale-105' : 'opacity-80'}`}
                                                                >
                                                                    <TrendingDown size={14} /> {t('modules.nexus.finance.addCost')}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        setEditingFinancial({
                                                                            lawsuit_id: editingLawsuit.id,
                                                                            transaction_date: new Date().toISOString().split('T')[0],
                                                                            entry_type: 'Credit',
                                                                            status: 'Pendente',
                                                                            amount: 0
                                                                        });
                                                                        setIsEditingFinancial(true);
                                                                    }}
                                                                    className={`p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl flex items-center gap-2 hover:bg-emerald-100 transition-all font-black text-[10px] uppercase tracking-widest border border-emerald-100 ${isEditingFinancial && editingFinancial?.entry_type === 'Credit' ? 'ring-2 ring-emerald-500 shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40 transform scale-105' : 'opacity-80'}`}
                                                                >
                                                                    <TrendingUp size={14} /> {t('modules.nexus.finance.addFee')}
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isEditingFinancial && editingFinancial && (
                                                            <div className="bg-slate-50 dark:bg-slate-900/80 p-6 rounded-[2.5rem] border-2 border-indigo-200 dark:border-indigo-900/40 mb-8 animate-in zoom-in-95 duration-300">
                                                                <div className="flex items-center justify-between mb-6">
                                                                    <h5 className="font-black text-xs uppercase tracking-widest text-indigo-600">
                                                                        {editingFinancial.entry_type === 'Debit' ? t('modules.nexus.finance.addCost') : t('modules.nexus.finance.addFee')}
                                                                    </h5>
                                                                    <button type="button" onClick={() => setIsEditingFinancial(false)} className="text-slate-400 hover:text-rose-500"><XCircle size={20} /></button>
                                                                </div>
                                                                <div className="grid grid-cols-2 gap-4">
                                                                    <div className="col-span-2">
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{t('modules.nexus.finance.description')}</label>
                                                                        <input 
                                                                            value={editingFinancial.title || ''}
                                                                            onChange={e => setEditingFinancial({...editingFinancial, title: e.target.value})}
                                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all"
                                                                            placeholder={t('modules.nexus.finance.placeholderDescription')}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">{t('modules.nexus.finance.value')}</label>
                                                                        <div className="relative">
                                                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-slate-400 text-xs">R$</span>
                                                                            <input 
                                                                                value={editingFinancial.amount ? formatCurrency(editingFinancial.amount) : ''}
                                                                                onChange={e => {
                                                                                    const raw = e.target.value.replace(/\D/g, '');
                                                                                    setEditingFinancial({...editingFinancial, amount: Number(raw) / 100});
                                                                                }}
                                                                                className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-black text-sm outline-none focus:ring-2 focus:ring-indigo-600 transition-all ${editingFinancial.entry_type === 'Debit' ? 'text-rose-600' : 'text-emerald-600'}`}
                                                                                placeholder="0,00"
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 px-1">Data</label>
                                                                        <input 
                                                                            type="date"
                                                                            value={editingFinancial.transaction_date?.slice(0, 10) || ''}
                                                                            onChange={e => setEditingFinancial({...editingFinancial, transaction_date: e.target.value})}
                                                                            className="w-full px-4 py-3 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl font-bold text-sm"
                                                                        />
                                                                    </div>
                                                                    <div className="col-span-2 flex gap-4 pt-2">
                                                                        <button 
                                                                            type="button"
                                                                            onClick={() => handleSaveFinancialTransaction(editingFinancial)}
                                                                            disabled={!editingFinancial.title || !editingFinancial.amount}
                                                                            className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 disabled:opacity-50 hover:bg-indigo-700 transition-all"
                                                                        >
                                                                            {t('modules.nexus.finance.confirm')}
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="space-y-4">
                                                            {isFinancialLoading ? (
                                                                <div className="py-20 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-100 dark:border-slate-800">
                                                                    <Loader2 size={32} className="text-indigo-500 animate-spin mb-4" />
                                                                    <p className="text-[10px] font-black uppercase text-slate-400">{t('modules.nexus.finance.loading')}</p>
                                                                </div>
                                                            ) : lawsuitFinances.length === 0 ? (
                                                                <div className="py-20 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-900/50 rounded-[2.5rem] border border-dashed border-slate-100 dark:border-slate-800">
                                                                    <DollarSign size={32} className="text-slate-300 mb-4" />
                                                                    <p className="text-sm font-bold text-slate-400 italic">{t('modules.nexus.finance.empty')}</p>
                                                                </div>
                                                            ) : (
                                                                lawsuitFinances.map(transaction => (
                                                                    <div key={transaction.id} className="bg-white dark:bg-slate-950 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group hover:border-indigo-200 transition-all shadow-sm">
                                                                        <div className="flex items-center gap-4">
                                                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${transaction.entry_type === 'Credit' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                                {transaction.entry_type === 'Credit' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                                                            </div>
                                                                            <div>
                                                                                <h6 className="font-bold text-slate-800 dark:text-white text-sm uppercase tracking-tight">{transaction.title}</h6>
                                                                                <p className="text-[10px] text-slate-400 font-bold">{transaction.transaction_date ? new Date(transaction.transaction_date).toLocaleDateString() : '-'}</p>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex items-center gap-6">
                                                                            <div className={`text-right font-black ${transaction.entry_type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                                                {transaction.entry_type === 'Credit' ? '+' : '-'} R$ {transaction.amount ? formatCurrency(transaction.amount) : '0,00'}
                                                                            </div>
                                                                            <button 
                                                                                type="button" 
                                                                                onClick={() => handleDeleteFinancialTransaction(transaction.id, editingLawsuit.id)}
                                                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        ) : activeLawsuitTab === 'timeline' ? (
                                            <div className="space-y-2 animate-in fade-in slide-in-from-right-4 duration-500">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.lawsuit.timeline.title')}</h4>
                                                        <p className="text-xs text-slate-500 font-bold">{t('modules.nexus.modals.lawsuit.timeline.auditDesc')}</p>
                                                    </div>
                                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl">
                                                        <History size={24} />
                                                    </div>
                                                </div>

                                                <div className="relative">
                                                    {!editingLawsuit?.id ? (
                                                        <BlockedTabOverlay message={t('modules.nexus.modals.lawsuit.timeline.emptyAudit')} />
                                                    ) : isLawsuitTimelineLoading ? (
                                                        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                            <Loader2 size={48} className="text-indigo-500 mb-4 animate-spin" />
                                                            <p className="text-slate-500 font-black uppercase tracking-widest text-[10px]">{t('modules.nexus.modals.lawsuit.timeline.loadingAudit')}</p>
                                                        </div>
                                                    ) : lawsuitTimeline.length === 0 ? (
                                                        <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] bg-slate-50/50 dark:bg-slate-900/50">
                                                            <Clock size={48} className="text-slate-300 mb-4" />
                                                            <p className="text-slate-400 font-bold italic">{t('modules.nexus.modals.lawsuit.timeline.noEvents')}</p>
                                                        </div>
                                                    ) : lawsuitTimeline.map((entry, idx) => (
                                                        <div key={entry.id} className="relative pl-10 pb-10 group">
                                                            {/* Thread Line */}
                                                            {idx < lawsuitTimeline.length - 1 && (
                                                                <div className="absolute left-[15px] top-8 bottom-0 w-[2px] bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors" />
                                                            )}
                                                            
                                                            {/* Icon Circle */}
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
                                        ) : activeLawsuitTab === 'movements' ? (
                                            <MovementsTab movements={movements} isLoading={isMovementsLoading} lawsuitId={editingLawsuit?.id} t={t} />

                                        ) : activeLawsuitTab === 'ai' ? (
                                            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                                                <div className="flex items-center justify-between mb-8">
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.lawsuit.ai.title')}</h4>
                                                        <p className="text-xs text-slate-500 font-bold">{t('modules.nexus.modals.lawsuit.ai.subtitle')}</p>
                                                    </div>
                                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-500 rounded-2xl shadow-lg shadow-amber-500/10">
                                                        <Sparkles size={24} className="animate-pulse" />
                                                    </div>
                                                </div>

                                                <div className="bg-slate-50 dark:bg-slate-900/50 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                                                    {!aiLawsuitSummary && !isAiSummarizing ? (
                                                        <div className="py-10">
                                                            <div className="w-20 h-20 rounded-full bg-white dark:bg-slate-800 shadow-xl flex items-center justify-center mb-6 mx-auto">
                                                                <Brain size={40} className="text-slate-300" />
                                                            </div>
                                                            <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">{t('modules.nexus.modals.lawsuit.ai.empty')}</h5>
                                                                <p className="text-sm text-slate-500 font-bold mb-8 max-w-[320px]">Deseja que a nossa IA processe todos os dados deste processo e gere um resumo executivo para você?</p>
                                                                <button 
                                                                    type="button"
                                                                    onClick={handleSummarizeWithAI}
                                                                    className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20 flex items-center gap-3 mx-auto"
                                                                >
                                                                    <Zap size={16} /> Gerar Resumo Agora
                                                                </button>
                                                            </div>
                                                        ) : isAiSummarizing ? (
                                                            <div className="py-20 flex flex-col items-center">
                                                                <div className="relative mb-8">
                                                                    <div className="absolute inset-0 bg-indigo-500/20 blur-3xl animate-pulse rounded-full" />
                                                                    <Loader2 size={64} className="text-indigo-600 animate-spin relative z-10" />
                                                                </div>
                                                                <h5 className="font-black text-slate-800 dark:text-white uppercase tracking-widest text-sm animate-pulse">{t('modules.nexus.modals.lawsuit.ai.loading')}</h5>
                                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-2">{t('modules.nexus.modals.lawsuit.ai.subtitle')}</p>
                                                            </div>
                                                        ) : (
                                                            <div className="w-full text-left">
                                                                <div className="p-8 bg-white dark:bg-slate-950 rounded-3xl border border-indigo-100 dark:border-indigo-900/40 shadow-inner relative overflow-hidden group">
                                                                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                                                                        <Brain size={120} />
                                                                    </div>
                                                                    <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line relative z-10">
                                                                        {aiLawsuitSummary}
                                                                    </div>
                                                                </div>
                                                                <div className="mt-8 flex items-center justify-between gap-4">
                                                                    <button 
                                                                        type="button"
                                                                        onClick={() => setAiLawsuitSummary(null)}
                                                                        className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-indigo-600 transition-colors"
                                                                    >
                                                                        {t('modules.nexus.modals.shareholder.cancel') || 'Limpar e Refazer'}
                                                                    </button>
                                                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl border border-emerald-100/50">
                                                                        <Check size={14} />
                                                                        <span className="text-[10px] font-black uppercase tracking-widest">{t('common.confirm') || 'Análise Concluída'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Documentos do Processo</h4>
                                                        <p className="text-xs text-slate-500 font-bold">Petições, Provas e Decisões</p>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setEditingLawsuitDoc({ document_type: 'Petição Inicial', event_date: new Date().toISOString() }); setIsLawsuitDocModalOpen(true); }}
                                                        className="p-4 bg-indigo-600 text-white rounded-2xl flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                                    >
                                                        <Plus size={20} /> Novo Documento
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {lawsuitDocuments.length === 0 && pendingLawsuitDocuments.length === 0 ? (
                                                        <div className="col-span-full py-20 text-center text-slate-400 font-bold italic border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-[2.5rem]">
                                                            Nenhum documento anexado a este processo.
                                                        </div>
                                                    ) : (
                                                        <>
                                                            {/* Existing saved documents */}
                                                            {lawsuitDocuments.map(doc => (
                                                                <div key={doc.id} className="bg-slate-50 dark:bg-slate-950/50 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-indigo-200 transition-all group relative overflow-hidden">
                                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-indigo-600 shadow-sm">
                                                                            <FileText size={20} />
                                                                        </div>
                                                                        <span className="text-[9px] font-black text-slate-400 capitalize bg-white dark:bg-slate-800 px-3 py-1 rounded-full border border-slate-100 dark:border-slate-700">
                                                                            {doc.document_type}
                                                                        </span>
                                                                    </div>
                                                                    <div className="relative z-10">
                                                                        <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{doc.title}</h5>
                                                                        <p className="text-[10px] text-slate-500 font-bold mb-4">Referência: {doc.event_date ? new Date(doc.event_date).toLocaleDateString() : 'N/I'}</p>
                                                                        
                                                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => { setEditingLawsuitDoc(doc); setIsLawsuitDocModalOpen(true); }}
                                                                                className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                                                                            >
                                                                                Editar
                                                                            </button>
                                                                            <div className="flex gap-2">
                                                                                <button 
                                                                                    type="button" 
                                                                                    onClick={() => handleSummarizeDocument(doc)}
                                                                                    className="p-2 text-amber-500 hover:text-amber-600 transition-colors"
                                                                                    title="Resumo IA"
                                                                                >
                                                                                    <Sparkles size={16} />
                                                                                </button>
                                                                                {doc.file_url && (
                                                                                    <a 
                                                                                        href={doc.file_url} 
                                                                                        target="_blank" 
                                                                                        rel="noopener noreferrer"
                                                                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                                                    >
                                                                                        <Download size={16} />
                                                                                    </a>
                                                                                )}
                                                                                <button 
                                                                                    type="button"
                                                                                    onClick={() => handleDeleteLawsuitDocument(doc.id)}
                                                                                    className="p-2 text-slate-300 hover:text-rose-500 transition-all"
                                                                                >
                                                                                    <Trash2 size={16} />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}

                                                            {/* Pending documents (in-memory) */}
                                                            {pendingLawsuitDocuments.map((pending, idx) => (
                                                                <div key={`pending-${idx}`} className="bg-amber-50/30 dark:bg-amber-900/10 p-6 rounded-3xl border border-amber-200/50 dark:border-amber-800/30 transition-all group relative overflow-hidden">
                                                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                                                        <div className="p-3 bg-white dark:bg-slate-800 rounded-2xl text-amber-600 shadow-sm animate-pulse">
                                                                            <FileText size={20} />
                                                                        </div>
                                                                        <div className="flex flex-col items-end gap-1">
                                                                            <span className="text-[9px] font-black text-amber-600 bg-amber-100 dark:bg-amber-900/40 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-800 uppercase tracking-widest">
                                                                                Aguardando Processo
                                                                            </span>
                                                                            <span className="text-[8px] font-bold text-slate-400 uppercase">
                                                                                {pending.docData.document_type}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="relative z-10">
                                                                        <h5 className="font-bold text-slate-800 dark:text-white text-sm mb-1 line-clamp-1">{pending.docData.title}</h5>
                                                                        <p className="text-[10px] text-slate-500 font-bold mb-4">{pending.file.name} ({(pending.file.size / 1024).toFixed(1)} KB)</p>
                                                                        
                                                                        <div className="flex items-center justify-between gap-2 mt-auto">
                                                                            <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest italic">Pendente</span>
                                                                            <button 
                                                                                type="button"
                                                                                onClick={() => setPendingLawsuitDocuments((prev: any[]) => prev.filter((_: any, i: number) => i !== idx))}
                                                                                className="p-2 text-slate-300 hover:text-rose-500 transition-colors"
                                                                            >
                                                                                <Trash2 size={16} />
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </>
                                                    )}
                                                </div>
                                        </div>
                                    )}
                                    </div>
                                </div>

                                {/* Footer Buttons */}
                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => { 
                                            setIsLawsuitModalOpen(false); 
                                            setActiveLawsuitTab('basic');
                                            setPendingLawsuitDocuments([]);
                                        }}
                                        className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                    >
                                        {t('modules.nexus.modals.lawsuit.cancel')}
                                    </button>
                                    {(activeLawsuitTab !== 'docs' || !editingLawsuit?.id) && (
                                        <button
                                            type="submit"
                                            className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                        >
                                            <Save size={20} /> {editingLawsuit?.id ? t('modules.nexus.modals.lawsuit.save') : 'Criar Processo Agora'}
                                        </button>
                                    )}
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
</>
);
};