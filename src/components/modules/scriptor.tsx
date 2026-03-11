
import React, { useState, useEffect, useRef } from 'react';
import { Credentials, LegalDocument, DocumentTemplate, Lawsuit, User, UserPreferences } from '@/types';
import {
    Wand2, Save, FileText, Download, Wand, ChevronDown, Plus,
    Search, Filter, History, Trash2, Layout, Sparkles,
    ChevronRight, Scale, User as UserIcon, Clock, CheckCircle2, AlertCircle,
    BookOpen, FilePlus, Copy, Send, FileEdit, Zap, Shield
} from 'lucide-react';
import { createDynamicClient } from '@/utils/supabase/client';
import { GeminiService } from '@/services/gemini';
import { useTranslation } from '@/contexts/language-context';
import { motion, AnimatePresence } from 'framer-motion';
import DocumentTemplatesTab from './document-templates';
import { createMasterClient } from '@/lib/supabase/master';
import { useModule } from '@/app/veritumpro/layout';

const Scriptor: React.FC<{ credentials: Credentials; user: User; permissions: any }> = ({ credentials, user, permissions }) => {
    // Data State
    const [documents, setDocuments] = useState<LegalDocument[]>([]);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [team, setTeam] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Mode & UI State
    const [mode, setMode] = useState<'draft' | 'library'>('draft');
    const { t, locale } = useTranslation();
    const { preferences, allClients, selectedClientId, onSelectClient, credentials: contextCreds, user: contextUser } = useModule();
    
    // Explicitly check role without OR to avoid confusion between current context and original prop
    const currentUserRole = contextUser?.role || user.role;
    const isMaster = currentUserRole?.toLowerCase() === 'master';

    // Editor State
    const [currentDoc, setCurrentDoc] = useState<Partial<LegalDocument> | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedLawsuitId, setSelectedLawsuitId] = useState<string>('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const supabase = React.useMemo(() => 
        createDynamicClient(contextCreds.supabaseUrl, contextCreds.supabaseAnonKey),
        [contextCreds.supabaseUrl, contextCreds.supabaseAnonKey]
    );
    const masterSupabase = createMasterClient();
    const gemini = new GeminiService(contextCreds.geminiKey);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchData();
        checkTemplates();
    }, [supabase]);

    const fetchData = async () => {
        if (isMaster && !selectedClientId) {
            setDocuments([]);
            setTemplates([]);
            setLawsuits([]);
            setTeam([]);
            setLoading(false);
            return; // MASTER users must select a client before we query Tenant DB
        }

        setLoading(true);
        try {
            const conditions = [`id.eq.${user.id}`, `parent_user_id.eq.${user.id}`];
            if (user.parent_user_id) {
                conditions.push(`id.eq.${user.parent_user_id}`);
                conditions.push(`parent_user_id.eq.${user.parent_user_id}`);
            }

            const safeQuery = async (query: any) => {
                try {
                    const res = await query;
                    return res;
                } catch (err) {
                    return { data: [], error: err as any };
                }
            };

            const [docsRes, tempStdRes, tempCustRes, lawRes, teamRes] = await Promise.all([
                safeQuery(supabase.from('legal_documents').select('*').order('updated_at', { ascending: false })),
                safeQuery(masterSupabase.from('veritum_standard_templates').select('*').order('category')),
                safeQuery(supabase.from('document_templates').select('*').is('deleted_at', null).order('category')),
                safeQuery(supabase.from('lawsuits').select('*')),
                safeQuery(supabase.from('team_members').select('*'))
            ]);

            // Silently handle errors for missing tables
            if (docsRes.error && docsRes.error.code !== 'PGRST116') console.warn('Legal Docs error:', docsRes.error);
            if (tempCustRes.error && tempCustRes.error.code !== 'PGRST116') console.warn('Custom Templates error:', tempCustRes.error);
            if (lawRes.error && lawRes.error.code !== 'PGRST116') console.warn('Lawsuits error:', lawRes.error);

            setDocuments(docsRes.data || []);
            
            // Merge templates for the drafting sidebar
            const combinedTemplates = [
                ...(tempStdRes.data || []).map((t: any) => ({ ...t, is_standard: true })),
                ...(tempCustRes.data || []).map((t: any) => ({ ...t, is_standard: false }))
            ];
            setTemplates(combinedTemplates);
            
            setLawsuits(lawRes.data || []);
            setTeam(teamRes.data || []);

            if (docsRes.data && docsRes.data.length > 0 && !currentDoc) {
                setCurrentDoc(docsRes.data[0]);
            }
        } catch (err) {
            console.error('Error fetching Scriptor data:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkTemplates = async () => {
        const { count } = await supabase.from('document_templates').select('*', { count: 'exact', head: true });
        if (count === 0) {
            await supabase.from('document_templates').insert([
                { title: 'Contestação Padrão', category: 'Cível', content: '...', base_prompt: 'Elabore uma contestação cível...' },
                { title: 'Petição Inicial - Alimentos', category: 'Família', content: '...', base_prompt: 'Redija uma petição inicial...' }
            ]);
            fetchData();
        }
    };

    const handleAutoSave = (doc: Partial<LegalDocument>) => {
        setSaveStatus('saving');
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                if (doc.id) {
                    await supabase.from('legal_documents').update({
                        content: doc.content,
                        title: doc.title,
                        lawsuit_id: doc.lawsuit_id,
                        updated_at: new Date().toISOString()
                    }).eq('id', doc.id);
                }
                setSaveStatus('saved');
                setTimeout(() => setSaveStatus('idle'), 2000);
            } catch (err) {
                setSaveStatus('error');
            }
        }, 1000);
    };

    const handleCreateNew = async () => {
        const newDoc = {
            title: t('modules.scriptor.newDocument'),
            content: '',
            version: 1
        };
        const { data, error } = await supabase.from('legal_documents').insert([newDoc]).select();
        if (data) {
            setDocuments([data[0], ...documents]);
            setCurrentDoc(data[0]);
        }
    };

    const handleAIGenerate = async () => {
        if (!prompt || !currentDoc) return;
        setIsGenerating(true);
        try {
            let context = `Objetivo: ${prompt}\n`;
            if (selectedLawsuitId) {
                const law = lawsuits.find(l => l.id === selectedLawsuitId);
                if (law) {
                    context += `Contexto do Processo: CNJ ${law.cnj_number}, Título: ${law.case_title}. Sphere: ${law.sphere}, Court: ${law.court}.\n`;
                }
            }

            const result = await gemini.generateDraft(context);
            const updatedContent = currentDoc.content ? `${currentDoc.content}\n\n${result}` : result;
            const updatedDoc = { ...currentDoc, content: updatedContent };
            setCurrentDoc(updatedDoc);
            handleAutoSave(updatedDoc);
            setPrompt('');
        } catch (err) {
            console.error('AI Generation failed:', err);
        } finally {
            setIsGenerating(false);
        }
    };

    const useTemplate = (temp: DocumentTemplate) => {
        if (temp.base_prompt) setPrompt(temp.base_prompt);
    };

    if (isMaster && !selectedClientId) {
        return (
            <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-900 rounded-[2rem] items-center justify-center space-y-4 border border-dashed border-amber-300 dark:border-amber-800/50">
                <Shield size={48} className="text-amber-500" />
                <h2 className="text-xl font-bold text-slate-800 dark:text-white uppercase tracking-widest">Acesso Master</h2>
                <p className="text-slate-500 text-sm max-w-md text-center">Por favor, selecione um escritório no menu lateral de configurações ou no cabeçalho do módulo para continuar.</p>
                <div className="bg-amber-100 text-amber-800 px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest mt-4">
                    Aguardando Contexto
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full space-y-6 high-density">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-amber-600 text-white p-3 rounded-2xl shadow-lg shadow-amber-200 dark:shadow-amber-900/40">
                        <FileText size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">SCRIPTOR PRO</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium tracking-tight">Ecossistema de Inteligência e Produção Técnica</p>
                    </div>
                </div>

                {/* Mode Switcher */}
                <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner backdrop-blur-sm">
                    <button
                        onClick={() => setMode('draft')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${mode === 'draft'
                            ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-xl shadow-amber-600/5 scale-[1.02]'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                    >
                        <Wand size={14} /> AI Writing
                    </button>
                    <button
                        onClick={() => setMode('library')}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.1em] transition-all flex items-center gap-2 ${mode === 'library'
                            ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-xl shadow-indigo-600/5 scale-[1.02]'
                            : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                            }`}
                    >
                        <BookOpen size={14} /> Biblioteca Hub
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${saveStatus === 'saving' ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' :
                        saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            saveStatus === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                'bg-slate-50 text-slate-400 border-slate-200 opacity-50'
                        }`}>
                        {saveStatus === 'saving' && <Clock size={12} />}
                        {saveStatus === 'saved' && <CheckCircle2 size={12} />}
                        {saveStatus === 'idle' ? 'Cloud Sync' :
                            saveStatus === 'saving' ? t('modules.scriptor.saving') :
                                saveStatus === 'saved' ? t('modules.scriptor.synced') : t('modules.scriptor.saveError')}
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-hidden">
                <AnimatePresence mode="wait">
                    {mode === 'draft' ? (
                        <motion.div
                            key="draft"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-full"
                        >
                            {/* Left Side: Intelligence */}
                            <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
                                <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                                    <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                        <Sparkles size={14} /> Scriptor AI
                                    </h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('modules.scriptor.nexusContext')}</label>
                                            <select
                                                value={selectedLawsuitId}
                                                onChange={(e) => setSelectedLawsuitId(e.target.value)}
                                                className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-amber-500 outline-none text-slate-700 dark:text-white"
                                            >
                                                <option value="">{t('modules.scriptor.noProcessLink')}</option>
                                                {lawsuits.map(law => (
                                                    <option key={law.id} value={law.id}>{law.cnj_number} - {law.case_title}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('modules.scriptor.draftInstruction')}</label>
                                            <textarea
                                                value={prompt}
                                                onChange={(e) => setPrompt(e.target.value)}
                                                placeholder={t('modules.scriptor.draftPlaceholder')}
                                                className="w-full h-32 p-4 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white font-medium resize-none leading-relaxed"
                                            />
                                        </div>
                                        <button
                                            onClick={handleAIGenerate}
                                            disabled={isGenerating || !currentDoc}
                                            className="w-full bg-amber-500 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 size={18} />}
                                            {t('modules.scriptor.generateAI')}
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                                    <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center gap-2">
                                        <Zap size={14} className="text-indigo-500" />
                                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('modules.scriptor.library')}</h3>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                                        {templates.map(temp => (
                                            <button
                                                key={temp.id}
                                                onClick={() => useTemplate(temp)}
                                                className="w-full p-3 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 group"
                                            >
                                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tight mb-1">{temp.category}</p>
                                                <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors line-clamp-2">{temp.title}</p>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Center: Editor */}
                            <div className="lg:col-span-2 flex flex-col h-full gap-4">
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-md flex-1 flex flex-col overflow-hidden">
                                    <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
                                        <div className="flex items-center gap-2 flex-1">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                                                <FileEdit size={14} className="text-slate-400" />
                                            </div>
                                            <input
                                                value={currentDoc?.title || ''}
                                                onChange={(e) => {
                                                    const updated = { ...currentDoc, title: e.target.value };
                                                    setCurrentDoc(updated);
                                                    handleAutoSave(updated);
                                                }}
                                                className="bg-transparent border-none outline-none font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight px-2 w-full max-w-md"
                                                placeholder={t('modules.scriptor.docTitlePlaceholder')}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all"><Download size={18} /></button>
                                            <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                    <textarea
                                        value={currentDoc?.content || ''}
                                        onChange={(e) => {
                                            const updated = { ...currentDoc, content: e.target.value };
                                            setCurrentDoc(updated);
                                            handleAutoSave(updated);
                                        }}
                                        className="flex-1 p-12 bg-transparent outline-none resize-none font-serif text-lg leading-[1.8] text-slate-700 dark:text-slate-300 scrollbar-thin overflow-y-auto"
                                        placeholder={t('modules.scriptor.editorPlaceholder')}
                                    />
                                </div>
                            </div>

                            {/* Right Side: History */}
                            <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                                <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                                    <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <History size={14} className="text-rose-500" /> {t('modules.scriptor.history')}
                                    </h3>
                                    <button
                                        onClick={handleCreateNew}
                                        className="p-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl hover:scale-110 transition-all shadow-md active:scale-95"
                                    >
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto no-scrollbar">
                                    {documents.map(doc => (
                                        <button
                                            key={doc.id}
                                            onClick={() => setCurrentDoc(doc)}
                                            className={`w-full p-4 text-left border-b border-slate-50 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-1 ${currentDoc?.id === doc.id ? 'bg-amber-50/50 dark:bg-amber-900/10 border-r-4 border-r-amber-500' : ''}`}
                                        >
                                            <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate">{doc.title}</p>
                                            <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                                <Clock size={10} />
                                                {new Date(doc.updated_at || '').toLocaleDateString()}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            key="library"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="h-full overflow-y-auto no-scrollbar"
                        >
                            <div className="bg-white dark:bg-slate-900/40 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-8 shadow-inner">
                                <DocumentTemplatesTab user={user} credentials={contextCreds} />
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default Scriptor;
