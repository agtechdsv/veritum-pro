
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    FileText, Plus, Search, Trash2, Edit3, Save, 
    X, Check, Info, FileEdit, Layout, Sparkles,
    ChevronRight, Copy, Database, Cloud, Zap,
    Crown, Lock, ExternalLink
} from 'lucide-react';
import { createDynamicClient } from '@/utils/supabase/client';
import { User, UserPreferences } from '@/types';
import { GeminiService } from '@/services/gemini';
import { toast } from '../ui/toast';
import { useTranslation } from '@/contexts/language-context';
import { createMasterClient } from '@/lib/supabase/master';

interface Template {
    id: string;
    title: string;
    category: string;
    content: string;
    base_prompt?: string;
    created_at: string;
    is_standard?: boolean;
}

interface Props {
    user: User;
    credentials: { supabaseUrl: string; supabaseAnonKey: string };
}

const DOCUMENT_TAGS = [
    { tag: '{{nome_cliente}}', description: 'Nome completo do cliente' },
    { tag: '{{cpf}}', description: 'CPF do cliente' },
    { tag: '{{rg}}', description: 'RG do cliente' },
    { tag: '{{nacionalidade}}', description: 'Nacionalidade' },
    { tag: '{{estado_civil}}', description: 'Estado Civil' },
    { tag: '{{profissao}}', description: 'Profissão' },
    { tag: '{{endereco_completo}}', description: 'Endereço completo' },
    { tag: '{{cidade_cliente}}', description: 'Cidade do cliente' },
    { tag: '{{estado_cliente}}', description: 'Estado (UF) do cliente' },
    { tag: '{{email_cliente}}', description: 'E-mail do cliente' },
    { tag: '{{telefone_cliente}}', description: 'Telefone do cliente' },
    { tag: '{{data_hoje}}', description: 'Data atual formatada' },
    { tag: '{{cidade_escritorio}}', description: 'Cidade do escritório' },
    { tag: '{{nome_advogado}}', description: 'Nome do advogado responsável' },
    { tag: '{{oab_number}}', description: 'Número da OAB' },
    { tag: '{{oab_uf}}', description: 'UF da OAB' },
];

const DocumentTemplatesTab: React.FC<Props> = ({ user, credentials }) => {
    const { t } = useTranslation();
    const [templates, setTemplates] = useState<Template[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'master' | 'office'>('master');
    const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    // Form states
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        content: '',
        base_prompt: ''
    });

    const supabase = React.useMemo(() => {
        return createDynamicClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
    }, [credentials.supabaseUrl, credentials.supabaseAnonKey]);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const masterClient = createMasterClient();
            
            // 1. Fetch Standard Templates from Master (Public/Shared)
            const { data: standardData, error: standardError } = await masterClient
                .from('veritum_standard_templates')
                .select('*')
                .order('title', { ascending: true });

            // 2. Fetch Custom Templates from Client Tenant
            const { data: customData, error: customError } = await supabase
                .from('document_templates')
                .select('*')
                .is('deleted_at', null)
                .order('title', { ascending: true });

            let combined: Template[] = [];

            if (standardData) {
                combined = [...combined, ...standardData.map(t => ({ ...t, is_standard: true }))];
            }

            if (customData) {
                combined = [...combined, ...customData.map(t => ({ ...t, is_standard: false }))];
            }

            setTemplates(combined);

            if (customError) {
                console.warn('[DocumentHub] Error fetching custom templates (Client DB):', customError.message);
                // We still show the standard ones if they loaded
            }
        } catch (err: any) {
            console.error('[DocumentHub] Hybrid Fetch Exception:', err);
            toast.error(`Erro ao sincronizar biblioteca hibrida.`);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (template: Template) => {
        setEditingTemplate(template);
        setFormData({
            title: template.title,
            category: template.category || '',
            content: template.content,
            base_prompt: template.base_prompt || ''
        });
        setShowForm(true);
    };

    const handleCreate = () => {
        setEditingTemplate(null);
        setFormData({
            title: '',
            category: 'Geral',
            content: '',
            base_prompt: ''
        });
        setShowForm(true);
    };

    const handleSave = async () => {
        if (!formData.title || !formData.content) {
            toast.error('Título e Conteúdo são obrigatórios.');
            return;
        }

        setIsSaving(true);
        try {
            // Logic: If editing a Standard template, we SAVE AS COPY into the client DB.
            // If editing a Custom template (not standard), we UPDATE the existing record.
            if (editingTemplate && !editingTemplate.is_standard) {
                const { error } = await supabase
                    .from('document_templates')
                    .update({
                        title: formData.title,
                        category: formData.category,
                        content: formData.content,
                        base_prompt: formData.base_prompt,
                        updated_at: new Date().toISOString()
                    })
                    .eq('id', editingTemplate.id);

                if (error) throw error;
                toast.success('Template atualizado com sucesso!');
            } else {
                // This branch handles BOTH creating new templates AND "saving as copy" standard ones
                const { error } = await supabase
                    .from('document_templates')
                    .insert([{
                        title: editingTemplate?.is_standard ? `${formData.title} (Cópia)` : formData.title,
                        category: formData.category,
                        content: formData.content,
                        base_prompt: formData.base_prompt
                    }]);

                if (error) throw error;
                toast.success(editingTemplate?.is_standard ? 'Cópia salva na sua biblioteca!' : 'Novo template criado!');
            }
            setShowForm(false);
            fetchTemplates();
        } catch (err) {
            console.error('Error saving template:', err);
            toast.error('Erro ao salvar template.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = (template: Template) => {
        if (template.is_standard) {
            toast.error('Modelos Veritum Standard não podem ser excluídos.');
            return;
        }
        
        setTemplateToDelete(template);
        setIsDeleteDialogOpen(true);
    };

    const confirmDelete = async () => {
        if (!templateToDelete) return;

        try {
            const { error } = await supabase
                .from('document_templates')
                .delete()
                .eq('id', templateToDelete.id);

            if (error) throw error;
            toast.success('Template excluído.');
            fetchTemplates();
        } catch (err) {
            console.error('Error deleting template:', err);
            toast.error('Erro ao excluir template.');
        } finally {
            setIsDeleteDialogOpen(false);
            setTemplateToDelete(null);
        }
    };

    const filteredTemplates = templates.filter(t => 
        (activeTab === 'master' ? t.is_standard : !t.is_standard) &&
        (t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const insertTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            content: prev.content + ' ' + tag + ' '
        }));
    };

    // Helper for previewing (simplified)
    const renderPreview = (text: string) => {
        let preview = text;
        DOCUMENT_TAGS.forEach(tagInfo => {
            const regex = new RegExp(tagInfo.tag.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            preview = preview.replace(regex, `<span class="bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 px-1 rounded font-bold">${tagInfo.tag}</span>`);
        });
        return preview.replace(/\n/g, '<br/>');
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-indigo-600 rounded-full" />
                    <div>
                        <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-800 dark:text-white">Motor de Documentos</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Gestão de Templates Veritum Standard</p>
                    </div>
                </div>

                {!showForm && (
                    <button
                        onClick={handleCreate}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                    >
                        <Plus size={18} /> Novo Template
                    </button>
                )}
            </div>

            <AnimatePresence mode="wait">
                {showForm ? (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-1 lg:grid-cols-12 gap-8"
                    >
                        {/* Editor Side */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-2">
                                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                                            <FileEdit size={20} />
                                        </div>
                                        <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">{editingTemplate ? 'Editar Template' : 'Criar Novo Template'}</h3>
                                    </div>
                                    <button 
                                        onClick={() => setShowForm(false)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all"
                                    >
                                        <X size={20} className="text-slate-400" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título do Modelo</label>
                                            <input 
                                                value={formData.title}
                                                onChange={e => setFormData({...formData, title: e.target.value})}
                                                placeholder="Ex: Procuração Ad Judicia"
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-slate-800 dark:text-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Categoria</label>
                                            <select 
                                                value={formData.category}
                                                onChange={e => setFormData({...formData, category: e.target.value})}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-slate-800 dark:text-white appearance-none"
                                            >
                                                <option value="Judicial">Judicial</option>
                                                <option value="Contratos">Contratos</option>
                                                <option value="Compliance">Compliance</option>
                                                <option value="Administrativo">Administrativo</option>
                                                <option value="Acordos">Acordos</option>
                                                <option value="Notificações">Notificações</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Conteúdo (Markdown/Texto)</label>
                                            <span className="text-[9px] font-black text-indigo-500 uppercase">Tags ativas: {'{{tags}}'}</span>
                                        </div>
                                        <textarea 
                                            value={formData.content}
                                            onChange={e => setFormData({...formData, content: e.target.value})}
                                            placeholder="Cole seu modelo aqui ou digite usando {{tags}}..."
                                            rows={15}
                                            className="w-full px-6 py-6 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 rounded-3xl font-medium outline-none focus:ring-2 focus:ring-indigo-600 transition-all text-slate-800 dark:text-white custom-scrollbar font-mono text-sm leading-relaxed"
                                        />
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save size={18} />}
                                            Salvar Template
                                        </button>
                                        <button
                                            onClick={() => setShowForm(false)}
                                            className="px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs border border-transparent hover:border-slate-300 dark:hover:border-slate-700 transition-all"
                                        >
                                            Cancelar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Tags & Preview */}
                        <div className="lg:col-span-5 space-y-8">
                            {/* Tags helper */}
                            <div className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
                                    <Database size={120} className="text-white" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-6">
                                        <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl">
                                            <Zap size={20} className="fill-current" />
                                        </div>
                                        <h3 className="text-white font-black uppercase tracking-widest text-xs">Variáveis de Mapeamento</h3>
                                    </div>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-6">Clique na tag para inserir no editor:</p>
                                    
                                    <div className="grid grid-cols-2 gap-2">
                                        {DOCUMENT_TAGS.map(tag => (
                                            <button
                                                key={tag.tag}
                                                onClick={() => insertTag(tag.tag)}
                                                className="group flex flex-col items-start p-3 bg-slate-800/50 hover:bg-indigo-600 border border-slate-700 hover:border-indigo-400 rounded-xl transition-all text-left"
                                            >
                                                <span className="text-[11px] font-black text-white mb-1 font-mono tracking-tighter">{tag.tag}</span>
                                                <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-100 uppercase truncate w-full">{tag.description}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Live Preview (Simplified) */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-xl overflow-hidden flex flex-col">
                                <div className="flex items-center gap-2 mb-6">
                                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                                        <Layout size={20} />
                                    </div>
                                    <h3 className="font-black uppercase tracking-widest text-xs text-slate-400">Preview Dinâmico</h3>
                                </div>
                                
                                <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-8 rounded-3xl border border-slate-100 dark:border-slate-800 overflow-y-auto max-h-[400px] custom-scrollbar">
                                    {formData.content ? (
                                        <div 
                                            className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif"
                                            dangerouslySetInnerHTML={{ __html: renderPreview(formData.content) }}
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center h-full text-slate-400 py-20 text-center">
                                            <FileText size={48} className="opacity-20 mb-4" />
                                            <p className="text-xs font-bold uppercase tracking-widest opacity-50">O preview aparecerá aqui conforme você edita.</p>
                                        </div>
                                    )}
                                </div>
                                <p className="mt-4 text-[9px] text-slate-400 font-bold uppercase tracking-widest text-center italic">Este é um preview simplificado. O documento final será gerado em PDF/DOCX.</p>
                            </div>
                        </div>
                    </motion.div>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="space-y-6"
                    >
                        {/* Filters & Search */}
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row gap-4 items-center">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={20} />
                                <input 
                                    placeholder="Buscar por título ou categoria..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-16 pr-6 py-4 bg-slate-50 dark:bg-slate-800/50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold transition-all"
                                />
                            </div>
                            <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl w-full md:w-auto">
                                <button
                                    onClick={() => setActiveTab('master')}
                                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'master' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                >
                                    Global / Master
                                </button>
                                <button
                                    onClick={() => setActiveTab('office')}
                                    className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'office' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                                >
                                    Meu Escritório
                                </button>
                            </div>
                            <div className="flex gap-2">
                                <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 dark:border-slate-800 whitespace-nowrap hidden lg:block">
                                    {filteredTemplates.length} Templates
                                </div>
                            </div>
                        </div>

                        {loading ? (
                             <div className="flex flex-col items-center justify-center py-32 space-y-4">
                                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando Biblioteca...</p>
                            </div>
                        ) : filteredTemplates.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredTemplates.map((item) => (
                                    <motion.div
                                        key={item.id}
                                        whileHover={{ y: -5 }}
                                        className="group bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:border-indigo-200 dark:hover:border-indigo-900/50 transition-all cursor-pointer relative overflow-hidden"
                                        onClick={() => handleEdit(item)}
                                    >
                                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                                            <FileText size={100} />
                                        </div>
                                        
                                        <div className="relative z-10">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className={`p-3 rounded-2xl ${item.is_standard ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 border border-amber-200/50' : 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'}`}>
                                                    {item.is_standard ? <Crown size={24} /> : <FileText size={24} />}
                                                </div>
                                                <div className="flex items-center gap-1">
                                                    {!item.is_standard && (
                                                        <>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                                                                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-indigo-600 rounded-full transition-all"
                                                            >
                                                                <Edit3 size={18} />
                                                            </button>
                                                            <button 
                                                                onClick={(e) => { e.stopPropagation(); handleDelete(item); }}
                                                                className="p-2 hover:bg-rose-50 dark:hover:bg-rose-900/30 text-slate-400 hover:text-rose-500 rounded-full transition-all"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                    {item.is_standard && (
                                                        <div className="flex items-center gap-1 px-3 py-1 bg-amber-100 dark:bg-amber-900/40 rounded-full border border-amber-200 dark:border-amber-800">
                                                            <Lock size={10} className="text-amber-600" />
                                                            <span className="text-[8px] font-black uppercase text-amber-700 dark:text-amber-400">Veritum Standard</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <h3 className="text-lg font-black text-slate-800 dark:text-white mb-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">{item.title}</h3>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-6">{item.category}</p>
                                            
                                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{item.is_standard ? 'Biblioteca Global' : 'Modelo do Escritório'}</span>
                                                    <span className="text-[10px] font-black text-slate-600 dark:text-slate-500">{new Date(item.created_at).toLocaleDateString()}</span>
                                                </div>
                                                <button className={`flex items-center gap-1 px-4 py-2 ${item.is_standard ? 'bg-amber-500 text-white' : 'bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400'} text-[10px] font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-all shadow-sm`}>
                                                    {item.is_standard ? 'Usar' : 'Ver'} <ChevronRight size={14} />
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[3.5rem] p-24 text-center">
                                <div className="p-8 bg-slate-50 dark:bg-slate-8050 rounded-full w-32 h-32 flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <Cloud size={64} className="text-slate-200" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter mb-4">Nenhum template encontrado</h3>
                                <p className="text-slate-500 font-bold text-sm max-w-sm mx-auto mb-10 leading-relaxed italic">Comece criando seu primeiro modelo ou importe os padrões da Veritum.</p>
                                <button 
                                    onClick={handleCreate}
                                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-2xl transition-all"
                                >
                                    Criar Agora
                                </button>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {isDeleteDialogOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-200 dark:border-slate-800"
                        >
                            <div className="flex flex-col items-center text-center space-y-4">
                                <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/30 text-rose-500 rounded-full flex items-center justify-center mb-2">
                                    <Trash2 size={32} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Excluir Template</h3>
                                <p className="text-sm font-bold text-slate-500 mb-6">
                                    Deseja realmente remover "{templateToDelete?.title}"? Esta ação não poderá ser desfeita.
                                </p>
                                
                                <div className="flex gap-3 w-full mt-4">
                                    <button
                                        onClick={() => { setIsDeleteDialogOpen(false); setTemplateToDelete(null); }}
                                        className="flex-1 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-slate-200 dark:hover:bg-slate-700 transition-all border border-transparent hover:border-slate-300 dark:hover:border-slate-700"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl shadow-rose-500/20 transition-all"
                                    >
                                        Excluir
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default DocumentTemplatesTab;
