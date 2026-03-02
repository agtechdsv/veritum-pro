import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, FileEdit, Check, X, ChevronUp, ChevronDown,
    Package, ShieldCheck, Globe, Radio, RefreshCw, AlertTriangle
} from 'lucide-react';
import { Suite, Credentials, Feature } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { GeminiService } from '@/services/gemini';
import { toast } from '../ui/toast';
import { useTranslation } from '@/contexts/language-context';

interface Props {
    credentials: Credentials;
}

const BR_FLAG = "https://flagcdn.com/w40/br.png";
const US_FLAG = "https://flagcdn.com/w40/us.png";
const ES_FLAG = "https://flagcdn.com/w40/es.png";

const SuiteManagement: React.FC<Props> = ({ credentials }) => {
    const { t, locale } = useTranslation();
    const [suites, setSuites] = useState<Suite[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingSuite, setEditingSuite] = useState<Suite | null>(null);
    const [suiteToDelete, setSuiteToDelete] = useState<Suite | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);

    const initialFormData: Partial<Suite> = {
        suite_key: '',
        name: { pt: '', en: '', es: '' },
        short_desc: { pt: '', en: '', es: '' },
        detailed_desc: { pt: '', en: '', es: '' },
        features: { pt: [], en: [], es: [] },
        icon_svg: '',
        active: true,
        order_index: 0
    };

    const [formData, setFormData] = useState<Partial<Suite>>(initialFormData);
    const [activeLang, setActiveLang] = useState<'pt' | 'en' | 'es'>('pt');
    const [activeTab, setActiveTab] = useState<'metadata' | 'features'>('metadata');
    const [suiteFeatures, setSuiteFeatures] = useState<Partial<Feature>[]>([]);
    const [deletedFeatureIds, setDeletedFeatureIds] = useState<string[]>([]);
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
            let savedSuiteId: string;

            const { features: _f1, ...dataToUpdate } = formData as any;

            if (editingSuite) {
                const { error, data } = await supabase
                    .from('suites')
                    .update(dataToUpdate)
                    .eq('id', editingSuite.id)
                    .select()
                    .single();
                if (error) throw error;
                savedSuiteId = editingSuite.id;
                toast.success(t('management.master.suites.toast.successUpdate'));
            } else {
                const { error, data } = await supabase
                    .from('suites')
                    .insert([{ ...dataToUpdate, order_index: suites.length }])
                    .select()
                    .single();
                if (error) throw error;
                savedSuiteId = data.id;
                toast.success(t('management.master.suites.toast.successCreate'));
            }

            // Deal with feature deletions
            if (deletedFeatureIds.length > 0) {
                await supabase.from('features').delete().in('id', deletedFeatureIds);
            }

            // Deal with feature upserts
            if (savedSuiteId && suiteFeatures.length > 0) {
                const featuresToUpsert = suiteFeatures.map(f => ({
                    ...(f.id ? { id: f.id } : {}),
                    suite_id: savedSuiteId,
                    feature_key: f.feature_key,
                    display_name: f.display_name,
                    description: f.description
                }));
                const { error: featError } = await supabase.from('features').upsert(featuresToUpsert);
                if (featError) throw featError;
            }

            setEditingSuite(null);
            setFormData(initialFormData);
            setSuiteFeatures([]);
            setDeletedFeatureIds([]);
            fetchSuites();
        } catch (err: any) {
            toast.error(t('management.master.suites.toast.errorSave') || 'Erro crítico ao salvar o Módulo e/ou Funcionalidades. Tente novamente.');
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
            toast.error(t('management.master.suites.toast.errorStatus', { error: err.message }));
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
            toast.error(t('management.master.suites.toast.errorDelete', { error: err.message }));
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
            toast.error(t('management.master.suites.toast.fillBio'));
            return;
        }

        if (!credentials.geminiKey) {
            toast.error(t('management.master.suites.toast.noGemini'));
            return;
        }

        setIsTranslating(true);

        try {
            const payload = {
                name: formData.name?.[activeLang] || '',
                short_desc: formData.short_desc![activeLang],
                detailed_desc: formData.detailed_desc![activeLang],
                features: suiteFeatures.map(f => ({
                    feature_key: f.feature_key || '',
                    display_name: f.display_name?.[activeLang] || '',
                    description: f.description?.[activeLang] || ''
                }))
            };

            const targetLangs = (['pt', 'en', 'es'] as const).filter(l => l !== activeLang);
            const translations = await gemini.translateSuite(payload, targetLangs as unknown as string[]);

            const newName = { ...formData.name };
            const newShortDesc = { ...formData.short_desc };
            const newDetailedDesc = { ...formData.detailed_desc };
            const newSuiteFeatures = [...suiteFeatures];

            Object.keys(translations).forEach((lang: any) => {
                newName[lang as 'pt' | 'en' | 'es'] = translations[lang].name;
                newShortDesc[lang as 'pt' | 'en' | 'es'] = translations[lang].short_desc;
                newDetailedDesc[lang as 'pt' | 'en' | 'es'] = translations[lang].detailed_desc;

                const translatedFeatures = translations[lang].features || [];
                translatedFeatures.forEach((tFeat: any) => {
                    const index = newSuiteFeatures.findIndex(f => f.feature_key === tFeat.feature_key);
                    if (index !== -1) {
                        newSuiteFeatures[index] = {
                            ...newSuiteFeatures[index],
                            display_name: {
                                ...(newSuiteFeatures[index].display_name || { pt: '', en: '', es: '' }),
                                [lang]: tFeat.display_name
                            },
                            description: {
                                ...(newSuiteFeatures[index].description || { pt: '', en: '', es: '' }),
                                [lang]: tFeat.description
                            }
                        };
                    }
                });
            });

            setFormData({
                ...formData,
                name: newName as any,
                short_desc: newShortDesc as any,
                detailed_desc: newDetailedDesc as any
            });
            setSuiteFeatures(newSuiteFeatures);

            toast.success(t('management.master.suites.toast.successTranslate'));
        } catch (err: any) {
            toast.error(t('management.master.suites.toast.errorTranslate', { error: err.message }));
        } finally {
            setIsTranslating(false);
        }
    };

    const openEdit = async (suite: Suite) => {
        setEditingSuite(suite);
        setFormData(suite);
        setActiveTab('metadata');
        const activeLocale = (locale === 'en' || locale === 'es') ? locale : 'pt';
        setActiveLang(activeLocale);
        const { data } = await supabase.from('features').select('*').eq('suite_id', suite.id).order('feature_key');
        if (data) {
            setSuiteFeatures(data);
        } else {
            setSuiteFeatures([]);
        }
        setDeletedFeatureIds([]);
    };

    const cancelEdit = () => {
        setEditingSuite(null);
        setFormData(initialFormData);
        setSuiteFeatures([]);
        setDeletedFeatureIds([]);
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
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">{t('management.master.suites.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">{t('management.master.suites.subtitle')}</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Table Column - Left (Narrower) */}
                <div className="w-full lg:w-[30%] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] sticky top-8 flex flex-col">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('management.master.suites.listTitle')}</span>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                            <tr>
                                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.suites.table.order')}</th>
                                <th className="px-4 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.suites.table.module')}</th>
                                <th className="px-4 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('management.master.suites.table.actions')}</th>
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
                                                dangerouslySetInnerHTML={{ __html: s.icon_svg || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-5 h-5"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>' }}
                                            />
                                            <div className="min-w-0">
                                                <span className="font-bold text-slate-800 dark:text-white block leading-tight text-[11px] truncate">
                                                    {typeof s.name === 'object' ? (s.name[locale as keyof typeof s.name] || s.name.pt) : s.name}
                                                </span>
                                                <code className="text-[9px] text-slate-400 uppercase font-bold tracking-widest truncate block">{s.suite_key}</code>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleToggleStatus(s)}
                                                className={`p-1.5 transition-all duration-200 rounded-lg cursor-pointer ${s.active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                                title={s.active ? t('management.master.suites.table.visible') : t('management.master.suites.table.hidden')}
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
                            <p className="font-black uppercase tracking-widest mt-4 text-[10px]">{t('management.master.suites.table.noActive')}</p>
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
                                        {editingSuite ? t('management.master.suites.form.edit') : t('management.master.suites.form.add')}
                                    </h2>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{t('management.master.suites.form.metadata')}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {editingSuite ? (
                                    <>
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm shadow-indigo-600/20"
                                        >
                                            <ShieldCheck size={16} /> {t('management.master.suites.form.saveChanges')}
                                        </button>
                                        <button onClick={cancelEdit} className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-rose-500 transition-colors bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm font-black uppercase text-[10px] tracking-widest">
                                            <X size={16} /> {t('management.master.suites.form.cancelSelection')}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        onClick={handleSave}
                                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm shadow-indigo-600/20"
                                    >
                                        <Plus size={16} /> {t('management.master.suites.form.publish')}
                                    </button>
                                )}
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            <div className="flex flex-col gap-4 border-b border-slate-200 dark:border-slate-800 pb-0">
                                <div className="flex items-center justify-between mb-2">
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
                                        {isTranslating ? t('management.master.suites.form.translating') : t('management.master.suites.form.translateIA')}
                                    </button>
                                </div>
                                <div className="flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('metadata')}
                                        className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'metadata' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Metadados
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('features')}
                                        className={`pb-3 px-2 text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'features' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        Funcionalidades
                                    </button>
                                </div>
                            </div>

                            {activeTab === 'metadata' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.suites.form.idKey')}</label>
                                            <input
                                                required
                                                placeholder="EX: VOX_KEY"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white transition-all uppercase"
                                                value={formData.suite_key}
                                                onChange={e => setFormData({ ...formData, suite_key: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.suites.form.mainName')}</label>
                                            <input
                                                required
                                                placeholder="EX: Vox Clientis"
                                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white transition-all"
                                                value={formData.name?.[activeLang] || ''}
                                                onChange={e => setFormData({ ...formData, name: { ...formData.name!, [activeLang]: e.target.value } })}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.suites.form.shortBio')} ({activeLang.toUpperCase()})</label>
                                                <input
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                                                    value={formData.short_desc?.[activeLang] || ''}
                                                    onChange={e => setFormData({ ...formData, short_desc: { ...formData.short_desc!, [activeLang]: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.suites.form.cardDetails')} ({activeLang.toUpperCase()})</label>
                                                <textarea
                                                    rows={2}
                                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white resize-none"
                                                    value={formData.detailed_desc?.[activeLang] || ''}
                                                    onChange={e => setFormData({ ...formData, detailed_desc: { ...formData.detailed_desc!, [activeLang]: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.suites.form.iconSvg')}</label>
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
                                            <span className="ml-3 text-[11px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('management.master.suites.form.activePortal')}</span>
                                        </label>
                                    </div>
                                </>
                            )}

                            {activeTab === 'features' && (
                                <div className="space-y-4">

                                    <div className="grid grid-cols-2 gap-4">
                                        {suiteFeatures.map((feat, idx) => (
                                            <div key={idx} className="p-4 space-y-3 relative group bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
                                                <button type="button" onClick={() => {
                                                    const newFeats = [...suiteFeatures];
                                                    const removed = newFeats.splice(idx, 1)[0];
                                                    setSuiteFeatures(newFeats);
                                                    if (removed.id) setDeletedFeatureIds([...deletedFeatureIds, removed.id]);
                                                }} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 bg-white dark:bg-slate-800 rounded-full p-1 shadow-sm border border-slate-200 dark:border-slate-700">
                                                    <Trash2 size={14} />
                                                </button>
                                                <div className="space-y-1.5 w-11/12">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Feature Key</label>
                                                    <input
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white uppercase"
                                                        value={feat.feature_key || ''}
                                                        onChange={e => {
                                                            const newFeats = [...suiteFeatures];
                                                            newFeats[idx].feature_key = e.target.value.toUpperCase();
                                                            setSuiteFeatures(newFeats);
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nome ({activeLang.toUpperCase()})</label>
                                                    <input
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                                                        value={feat.display_name?.[activeLang] || ''}
                                                        onChange={e => {
                                                            const newFeats = [...suiteFeatures];
                                                            newFeats[idx].display_name = { ...(newFeats[idx].display_name || { pt: '', en: '', es: '' }), [activeLang]: e.target.value };
                                                            setSuiteFeatures(newFeats);
                                                        }}
                                                    />
                                                </div>
                                                <div className="space-y-1.5">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição ({activeLang.toUpperCase()})</label>
                                                    <input
                                                        className="w-full px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-xs focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white"
                                                        value={feat.description?.[activeLang] || ''}
                                                        onChange={e => {
                                                            const newFeats = [...suiteFeatures];
                                                            newFeats[idx].description = { ...(newFeats[idx].description || { pt: '', en: '', es: '' }), [activeLang]: e.target.value };
                                                            setSuiteFeatures(newFeats);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ))}

                                        <button type="button" onClick={() => setSuiteFeatures([...suiteFeatures, { feature_key: '', display_name: { pt: '', en: '', es: '' }, description: { pt: '', en: '', es: '' } }])} className="col-span-2 w-full p-4 flex items-center justify-center gap-2 text-indigo-600 font-bold text-xs border border-dashed border-indigo-200 dark:border-indigo-900/50 rounded-2xl bg-indigo-50/50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-all uppercase tracking-widest">
                                            <Plus size={16} /> Adicionar Funcionalidade
                                        </button>
                                    </div>
                                </div>
                            )}

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
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('management.master.suites.delete.title')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                {t('management.master.suites.delete.message', { name: typeof suiteToDelete.name === 'object' ? (suiteToDelete.name[locale as keyof typeof suiteToDelete.name] || suiteToDelete.name.pt) : suiteToDelete.name })}
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button
                                onClick={() => setSuiteToDelete(null)}
                                className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all"
                            >
                                {t('management.master.suites.delete.cancel')}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                {t('management.master.suites.delete.confirm')}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuiteManagement;
