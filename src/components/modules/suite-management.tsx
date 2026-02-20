import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, FileEdit, Check, X, ChevronUp, ChevronDown,
    Package, ShieldCheck, Globe, Radio, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Suite, Credentials } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { GeminiService } from '@/services/gemini';
import { toast } from '../ui/toast';

interface Props {
    credentials: Credentials;
}

const BR_FLAG = "https://flagcdn.com/w40/br.png";
const US_FLAG = "https://flagcdn.com/w40/us.png";
const ES_FLAG = "https://flagcdn.com/w40/es.png";

const SuiteManagement: React.FC<Props> = ({ credentials }) => {
    const [suites, setSuites] = useState<Suite[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSuite, setEditingSuite] = useState<Suite | null>(null);
    const [suiteToDelete, setSuiteToDelete] = useState<Suite | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const initialFormData: Partial<Suite> = {
        suite_key: '',
        name: '',
        short_desc: { pt: '', en: '', es: '' },
        detailed_desc: { pt: '', en: '', es: '' },
        features: { pt: [], en: [], es: [] },
        icon_svg: '',
        active: true,
        order_index: 0
    };

    const [formData, setFormData] = useState<Partial<Suite>>(initialFormData);
    const [activeLang, setActiveLang] = useState<'pt' | 'en' | 'es'>('pt');
    const supabase = createMasterClient();
    const gemini = new GeminiService(credentials.geminiKey);

    useEffect(() => {
        fetchSuites();
    }, []);

    const fetchSuites = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('suites')
            .select('*')
            .order('order_index', { ascending: true });

        if (!error && data) setSuites(data);
        setLoading(false);
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        try {
            if (editingSuite) {
                const { error } = await supabase
                    .from('suites')
                    .update(formData)
                    .eq('id', editingSuite.id);
                if (error) throw error;
                toast.success('Suíte atualizada com sucesso!');
            } else {
                const { error } = await supabase
                    .from('suites')
                    .insert([{ ...formData, order_index: suites.length }]);
                if (error) throw error;
                toast.success('Suíte criada com sucesso!');
            }

            setEditingSuite(null);
            setFormData(initialFormData);
            fetchSuites();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar suíte');
        }
    };

    const handleToggleStatus = async (suite: Suite) => {
        try {
            const { error } = await supabase
                .from('suites')
                .update({ active: !suite.active })
                .eq('id', suite.id);
            if (error) throw error;
            fetchSuites();
        } catch (err: any) {
            alert('Erro ao alterar status: ' + err.message);
        }
    };

    const handleDelete = async () => {
        if (!suiteToDelete) return;
        try {
            const { error } = await supabase.from('suites').delete().eq('id', suiteToDelete.id);
            if (error) throw error;
            setSuiteToDelete(null);
            fetchSuites();
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= suites.length) return;

        try {
            await Promise.all([
                supabase.from('suites').update({ order_index: swapIndex }).eq('id', suites[index].id),
                supabase.from('suites').update({ order_index: index }).eq('id', suites[swapIndex].id)
            ]);
            fetchSuites();
        } catch (err) {
            console.error('Swap failed', err);
        }
    };

    const handleTranslate = async () => {
        if (!formData.short_desc?.[activeLang]) {
            toast.error('Preencha ao menos a Bio Curta para traduzir.');
            return;
        }

        if (!credentials.geminiKey) {
            toast.error('Chave do Gemini não configurada. Por favor, adicione sua API Key nas Configurações.');
            return;
        }

        setIsTranslating(true);

        try {
            const payload = {
                short_desc: formData.short_desc![activeLang],
                detailed_desc: formData.detailed_desc![activeLang],
                features: formData.features![activeLang]
            };

            const targetLangs = (['pt', 'en', 'es'] as const).filter(l => l !== activeLang);
            const translations = await gemini.translateSuite(payload, targetLangs as unknown as string[]);

            const newShortDesc = { ...formData.short_desc };
            const newDetailedDesc = { ...formData.detailed_desc };
            const newFeatures = { ...formData.features };

            Object.keys(translations).forEach((lang: any) => {
                newShortDesc[lang as 'pt' | 'en' | 'es'] = translations[lang].short_desc;
                newDetailedDesc[lang as 'pt' | 'en' | 'es'] = translations[lang].detailed_desc;
                newFeatures[lang as 'pt' | 'en' | 'es'] = translations[lang].features || [];
            });

            setFormData({
                ...formData,
                short_desc: newShortDesc as any,
                detailed_desc: newDetailedDesc as any,
                features: newFeatures as any
            });

            toast.success('Tradução baseada em IA concluída!');
        } catch (err: any) {
            toast.error('Erro na tradução: ' + err.message);
        } finally {
            setIsTranslating(false);
        }
    };

    const openEdit = (suite: Suite) => {
        setEditingSuite(suite);
        setFormData(suite);
    };

    const cancelEdit = () => {
        setEditingSuite(null);
        setFormData(initialFormData);
    };

    if (loading && suites.length === 0) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão de Suítes</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">Configure a vitrine do seu ecossistema jurídico.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Table Column - Left (Narrower) */}
                <div className="w-full lg:w-[30%] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] sticky top-8 flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listagem de Módulos</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ordem</th>
                                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Módulo</th>
                                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {suites.map((s, idx) => (
                                <tr key={s.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group ${editingSuite?.id === s.id ? 'bg-indigo-50/30 dark:bg-indigo-900/10' : ''}`}>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col items-center gap-0">
                                            <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-0.5 text-slate-300 hover:text-indigo-600 disabled:opacity-10 transition-colors"><ChevronUp size={14} /></button>
                                            <button onClick={() => handleMove(idx, 'down')} disabled={idx === suites.length - 1} className="p-0.5 text-slate-300 hover:text-indigo-600 disabled:opacity-10 transition-colors"><ChevronDown size={14} /></button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className="w-10 h-10 shrink-0 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center text-indigo-600 shadow-sm transition-transform p-2"
                                                dangerouslySetInnerHTML={{ __html: s.icon_svg || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-package"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>' }}
                                            />
                                            <div className="min-w-0">
                                                <span className="font-bold text-slate-800 dark:text-white block leading-tight text-[11px] truncate">{s.name}</span>
                                                <code className="text-[9px] text-slate-400 uppercase font-bold tracking-widest truncate block">{s.suite_key}</code>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleToggleStatus(s)}
                                                className={`p-1.5 transition-all duration-200 rounded-lg cursor-pointer ${s.active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                                title={s.active ? 'Módulo Visível' : 'Módulo Oculto'}
                                            >
                                                <Radio size={16} className={s.active ? 'fill-emerald-500/20' : ''} />
                                            </button>
                                            <button
                                                onClick={() => openEdit(s)}
                                                className={`p-1.5 rounded-lg transition-all ${editingSuite?.id === s.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                <FileEdit size={16} />
                                            </button>
                                            <button
                                                onClick={() => setSuiteToDelete(s)}
                                                className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition-all"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {suites.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-20">
                            <Package size={48} />
                            <p className="font-black uppercase tracking-widest mt-4 text-[10px]">Nenhuma suíte ativa</p>
                        </div>
                    )}
                </div>

                {/* Form Column - Right (Wider) */}
                <div className="flex-1">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                    <Package size={28} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {editingSuite ? 'Editar Módulo' : 'Novo Módulo'}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Metadata do Ecossistema</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {editingSuite ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm shadow-indigo-600/20"
                                        >
                                            <ShieldCheck size={16} /> Salvar Alterações
                                        </button>
                                        <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-500 transition-colors bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm font-black uppercase text-[10px] tracking-widest">
                                            <X size={16} /> Cancelar Seleção
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm shadow-indigo-600/20"
                                    >
                                        <Plus size={16} /> Publicar Módulo
                                    </button>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Key Identificadora</label>
                                    <input
                                        required
                                        placeholder="EX: VOX_KEY"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white transition-all uppercase"
                                        value={formData.suite_key}
                                        onChange={e => setFormData({ ...formData, suite_key: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome Principal</label>
                                    <input
                                        required
                                        placeholder="EX: Vox Clientis"
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white transition-all"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {(['pt', 'en', 'es'] as const).map(lang => (
                                            <button
                                                key={lang}
                                                type="button"
                                                onClick={() => setActiveLang(lang)}
                                                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all p-0.5 hover:scale-110 active:scale-95 ${activeLang === lang ? 'border-indigo-600 shadow-lg shadow-indigo-600/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                                title={lang.toUpperCase()}
                                            >
                                                <img
                                                    src={lang === 'pt' ? BR_FLAG : lang === 'en' ? US_FLAG : ES_FLAG}
                                                    alt={lang}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleTranslate}
                                        disabled={isTranslating}
                                        className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-all disabled:opacity-50"
                                    >
                                        <RefreshCw size={12} className={isTranslating ? 'animate-spin' : ''} />
                                        {isTranslating ? 'Traduzindo...' : 'Traduzir via IA'}
                                    </button>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Bio Curta ({activeLang.toUpperCase()})</label>
                                        <input
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                                            value={formData.short_desc?.[activeLang] || ''}
                                            onChange={e => setFormData({ ...formData, short_desc: { ...formData.short_desc!, [activeLang]: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Detalhes do Card ({activeLang.toUpperCase()})</label>
                                        <textarea
                                            rows={2}
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white resize-none"
                                            value={formData.detailed_desc?.[activeLang] || ''}
                                            onChange={e => setFormData({ ...formData, detailed_desc: { ...formData.detailed_desc!, [activeLang]: e.target.value } })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Recursos / Features ({activeLang.toUpperCase()})</label>
                                        <textarea
                                            rows={3}
                                            placeholder="Item 1&#10;Item 2"
                                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white resize-none"
                                            value={formData.features?.[activeLang]?.join('\n') || ''}
                                            onChange={e => setFormData({ ...formData, features: { ...formData.features!, [activeLang]: e.target.value.split('\n').filter(l => l.trim() !== '') } })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Código SVG do Ícone</label>
                                <textarea
                                    rows={3}
                                    placeholder="<svg>...</svg>"
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-mono focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white resize-none"
                                    value={formData.icon_svg}
                                    onChange={e => setFormData({ ...formData, icon_svg: e.target.value })}
                                />
                            </div>

                            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700">
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input type="checkbox" className="sr-only peer" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                                    <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div>
                                    <span className="ml-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Ativa no Portal</span>
                                </label>
                            </div>

                            {/* Submit button removed from bottom - moved to header */}
                        </form>
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            {suiteToDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-600/10 scale-110">
                            <AlertTriangle size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Confirmar Exclusão</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                Você está prestes a remover permanentemente a suíte <span className="font-bold text-slate-800 dark:text-slate-200">"{suiteToDelete.name}"</span> do ecossistema. Esta ação não pode ser desfeita.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setSuiteToDelete(null)}
                                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Sim, Excluir
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuiteManagement;
