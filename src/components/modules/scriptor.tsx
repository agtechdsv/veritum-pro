
import React, { useState, useEffect, useRef } from 'react';
import { Credentials, LegalDocument, DocumentTemplate, Lawsuit, User } from '@/types';
import {
    Wand2, Save, FileText, Download, Wand, ChevronDown, Plus,
    Search, Filter, History, Trash2, Layout, Sparkles,
    ChevronRight, Scale, User as UserIcon, Clock, CheckCircle2, AlertCircle,
    BookOpen, FilePlus, Copy, Send
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { GeminiService } from '@/services/gemini';

const Scriptor: React.FC<{ credentials: Credentials; user: User; permissions: any }> = ({ credentials, user, permissions }) => {
    // Data State
    const [documents, setDocuments] = useState<LegalDocument[]>([]);
    const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [team, setTeam] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    // Editor State
    const [currentDoc, setCurrentDoc] = useState<Partial<LegalDocument> | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedLawsuitId, setSelectedLawsuitId] = useState<string>('');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
    const gemini = new GeminiService(credentials.geminiKey);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        fetchData();
        // Load default mock templates if empty
        checkTemplates();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Hierarchy Logic for Team (Responsibles)
            const conditions = [`id.eq.${user.id}`, `parent_user_id.eq.${user.id}`];
            if (user.parent_user_id) {
                conditions.push(`id.eq.${user.parent_user_id}`);
                conditions.push(`parent_user_id.eq.${user.parent_user_id}`);
            }

            const [docsRes, tempRes, lawRes, teamRes] = await Promise.all([
                supabase.from('legal_documents').select('*').order('updated_at', { ascending: false }),
                supabase.from('document_templates').select('*').order('category'),
                supabase.from('lawsuits').select('*'),
                supabase.from('users').select('*').or(conditions.join(',')).eq('active', true)
            ]);
            setDocuments(docsRes.data || []);
            setTemplates(tempRes.data || []);
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
                { title: 'Contestação Padrão', category: 'Cível', base_prompt: 'Elabore uma contestação cível focada em prefacial de mérito...' },
                { title: 'Petição Inicial - Alimentos', category: 'Família', base_prompt: 'Redija uma petição inicial de ação de alimentos, considerando o binômio necessidade-possibilidade...' },
                { title: 'Contrato de Prestação de Serviços', category: 'Contratos', base_prompt: 'Crie um contrato de prestação de serviços advocatícios com cláusula de êxito...' }
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
            title: 'Novo Documento sem Título',
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
            // Context Enrichment
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
        setPrompt(temp.base_prompt);
    };

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
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Redação Jurídica Aumentada por IA</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all ${saveStatus === 'saving' ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' :
                        saveStatus === 'saved' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                            saveStatus === 'error' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                'bg-slate-50 text-slate-400 border-slate-200 opacity-50'
                        }`}>
                        {saveStatus === 'saving' && <Clock size={12} />}
                        {saveStatus === 'saved' && <CheckCircle2 size={12} />}
                        {saveStatus === 'error' && <AlertCircle size={12} />}
                        {saveStatus === 'idle' ? 'Cloud Sync' :
                            saveStatus === 'saving' ? 'Salvando...' :
                                saveStatus === 'saved' ? 'Sincronizado' : 'Erro ao Salvar'}
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-lg active:scale-95"
                    >
                        <Plus size={18} /> Novo Documento
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
                {/* Left Side: Intelligence & History */}
                <div className="lg:col-span-1 flex flex-col gap-6 overflow-hidden">
                    {/* IA Drafting Panel */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-amber-600 uppercase tracking-widest flex items-center gap-2">
                                <Sparkles size={14} /> Scriptor AI
                            </h3>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Contexto do Nexus</label>
                                <select
                                    value={selectedLawsuitId}
                                    onChange={(e) => setSelectedLawsuitId(e.target.value)}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl text-[11px] font-bold focus:ring-2 focus:ring-amber-500 outline-none text-slate-700 dark:text-white"
                                >
                                    <option value="">Sem vínculo processual</option>
                                    {lawsuits.map(law => (
                                        <option key={law.id} value={law.id}>{law.cnj_number} - {law.case_title}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Instrução de Redação</label>
                                <textarea
                                    value={prompt}
                                    onChange={(e) => setPrompt(e.target.value)}
                                    placeholder="Descreva o que deseja redigir..."
                                    className="w-full h-32 p-4 text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-2xl focus:ring-2 focus:ring-amber-500 outline-none dark:text-white font-medium resize-none leading-relaxed"
                                />
                            </div>

                            <button
                                onClick={handleAIGenerate}
                                disabled={isGenerating || !currentDoc}
                                className="w-full bg-amber-500 text-white py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-600 transition-all shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isGenerating ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Wand2 size={18} />}
                                Gerar via IA
                            </button>
                        </div>
                    </div>

                    {/* Templates & Library */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                        <div className="p-5 border-b border-slate-50 dark:border-slate-800">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={14} className="text-indigo-500" /> Biblioteca
                            </h3>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar">
                            {templates.map(temp => (
                                <button
                                    key={temp.id}
                                    onClick={() => useTemplate(temp)}
                                    className="w-full p-3 text-left rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-indigo-100 dark:hover:border-indigo-900 group"
                                >
                                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-tight mb-1">{temp.category}</p>
                                    <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 group-hover:text-indigo-600 transition-colors">{temp.title}</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Center: Editor Area */}
                <div className="lg:col-span-2 flex flex-col h-full gap-4">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-md flex-1 flex flex-col overflow-hidden">
                        {/* Editor Toolbar */}
                        <div className="p-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/30 dark:bg-slate-800/20">
                            <input
                                value={currentDoc?.title || ''}
                                onChange={(e) => {
                                    const updated = { ...currentDoc, title: e.target.value };
                                    setCurrentDoc(updated);
                                    handleAutoSave(updated);
                                }}
                                className="bg-transparent border-none outline-none font-black text-slate-800 dark:text-white text-sm uppercase tracking-tight px-2 w-full max-w-md"
                                placeholder="Título do Documento"
                            />
                            <div className="flex items-center gap-2">
                                <button className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/40 rounded-xl transition-all"><Download size={18} /></button>
                                <button className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/40 rounded-xl transition-all"><Trash2 size={18} /></button>
                            </div>
                        </div>

                        {/* Text Area */}
                        <textarea
                            value={currentDoc?.content || ''}
                            onChange={(e) => {
                                const updated = { ...currentDoc, content: e.target.value };
                                setCurrentDoc(updated);
                                handleAutoSave(updated);
                            }}
                            className="flex-1 p-12 bg-transparent outline-none resize-none font-serif text-lg leading-[1.8] text-slate-700 dark:text-slate-300 scrollbar-thin scrollbar-thumb-slate-100 dark:scrollbar-thumb-slate-800"
                            placeholder="A petição começa aqui..."
                        />
                    </div>
                </div>

                {/* Right Side: Documents List */}
                <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                            <History size={14} className="text-rose-500" /> Histórico
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar">
                        {documents.map(doc => (
                            <button
                                key={doc.id}
                                onClick={() => setCurrentDoc(doc)}
                                className={`w-full p-4 text-left border-b border-slate-50 dark:border-slate-800 transition-all hover:bg-slate-50 dark:hover:bg-slate-800 flex flex-col gap-1 ${currentDoc?.id === doc.id ? 'bg-amber-50/50 dark:bg-amber-900/10 border-r-4 border-r-amber-500' : ''
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <p className="text-[11px] font-black text-slate-800 dark:text-white uppercase truncate pr-4">{doc.title}</p>
                                    <div className="bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded text-[8px] font-black text-slate-500 dark:text-slate-300">v{doc.version}</div>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                    <Clock size={10} />
                                    {new Date(doc.updated_at || '').toLocaleDateString('pt-BR')}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Scriptor;
