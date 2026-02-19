import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, FileEdit, Check, X, ChevronUp, ChevronDown, ChevronRight,
    Package, ShieldCheck, RefreshCw, AlertTriangle, DollarSign,
    Zap, Sparkles, LayoutGrid, Layers, Settings, Radio, Database
} from 'lucide-react';
import { Plan, Credentials, Suite, PlanPermission, Feature } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { GeminiService } from '@/services/gemini';
import { createPlan, updatePlan, deletePlan, togglePlanActive, getPlanPermissions, updatePlanPermissions, getFeatures } from '@/app/actions/plan-actions';
import { toast } from '../ui/toast';

interface Props {
    credentials: Credentials;
}

const BR_FLAG = "https://flagcdn.com/w40/br.png";
const US_FLAG = "https://flagcdn.com/w40/us.png";
const ES_FLAG = "https://flagcdn.com/w40/es.png";

const PlanManagement: React.FC<Props> = ({ credentials }) => {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [planToDelete, setPlanToDelete] = useState<Plan | null>(null);
    const [isTranslating, setIsTranslating] = useState(false);
    const [filter, setFilter] = useState<'all' | 'individual' | 'combo'>('all');
    const [activeTab, setActiveTab] = useState<'details' | 'permissions'>('details');
    const [allSuites, setAllSuites] = useState<Suite[]>([]);
    const [allFeatures, setAllFeatures] = useState<Feature[]>([]);
    const [planPermissions, setPlanPermissions] = useState<string[]>([]);
    const [dbPermissions, setDbPermissions] = useState<string[]>([]);
    const [expandedSuites, setExpandedSuites] = useState<string[]>([]);

    const initialFormData: Partial<Plan> = {
        name: '',
        short_desc: { pt: '', en: '', es: '' },
        monthly_price: 0,
        monthly_discount: 0,
        yearly_price: 0,
        yearly_discount: 0,
        features: { pt: [], en: [], es: [] },
        recommended: false,
        active: true,
        order_index: 0,
        is_combo: false
    };

    const [formData, setFormData] = useState<Partial<Plan>>(initialFormData);
    const [activeLang, setActiveLang] = useState<'pt' | 'en' | 'es'>('pt');
    const supabase = createMasterClient();
    const gemini = new GeminiService(credentials.geminiKey);

    useEffect(() => {
        fetchPlans();
        fetchSuites();
        fetchFeaturesList();
    }, []);

    useEffect(() => {
        if (editingPlan) {
            fetchPermissions(editingPlan.id);
            setActiveTab('details');
        } else {
            setPlanPermissions([]);
            setDbPermissions([]);
            setExpandedSuites([]);
        }
    }, [editingPlan]);

    const fetchPlans = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('plans')
            .select('*')
            .order('order_index', { ascending: true });

        if (!error && data) setPlans(data);
        setLoading(false);
    };

    const fetchSuites = async () => {
        const { data } = await supabase
            .from('suites')
            .select('*')
            .order('order_index', { ascending: true });
        if (data) setAllSuites(data);
    };

    const fetchFeaturesList = async () => {
        const result = await getFeatures();
        if (result.success && result.features) {
            setAllFeatures(result.features);
        }
    };

    const fetchPermissions = async (planId: string) => {
        const result = await getPlanPermissions(planId);
        if (result.success && result.permissions) {
            setPlanPermissions(result.permissions);
            setDbPermissions(result.permissions);
        } else {
            setPlanPermissions([]);
            setDbPermissions([]);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();

        try {
            const planData = {
                ...formData,
                monthly_price: Number(formData.monthly_price) || 0,
                monthly_discount: Number(formData.monthly_discount) || 0,
                yearly_price: Number(formData.yearly_price) || 0,
                yearly_discount: Number(formData.yearly_discount) || 0,
                order_index: editingPlan ? Number(formData.order_index) : plans.length
            };

            const result = editingPlan
                ? await updatePlan(editingPlan.id, planData)
                : await createPlan(planData);

            if (!result.success || !result.plan) {
                throw new Error(result.error || 'Falha ao salvar o plano (dados não retornados)');
            }

            const savedPlan = result.plan;
            if (savedPlan.id) {
                const permResult = await updatePlanPermissions(savedPlan.id, planPermissions);
                if (permResult.success) {
                    setDbPermissions([...planPermissions]); // Sync baseline for cycle
                }
            }

            toast.success(editingPlan ? 'Plano e permissões atualizados!' : 'Plano criado com sucesso!');

            if (!editingPlan) {
                setEditingPlan(null);
                setFormData(initialFormData);
                setPlanPermissions([]);
                setDbPermissions([]);
            }
            fetchPlans();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar plano');
        }
    };

    const toggleSuitePermission = (suiteId: string) => {
        const suiteFeatures = allFeatures.filter(f => f.suite_id === suiteId).map(f => f.id);
        const currentEnabled = suiteFeatures.filter(id => planPermissions.includes(id));
        const dbEnabled = suiteFeatures.filter(id => dbPermissions.includes(id));

        const isAll = currentEnabled.length === suiteFeatures.length && suiteFeatures.length > 0;
        const isNone = currentEnabled.length === 0;
        const isDbMatch = currentEnabled.length === dbEnabled.length &&
            currentEnabled.every(id => dbEnabled.includes(id));

        const otherPermissions = planPermissions.filter(id => !suiteFeatures.includes(id));

        if (isDbMatch && !isAll) {
            // State: DB (Match) -> Go to ALL
            setPlanPermissions([...otherPermissions, ...suiteFeatures]);
        } else if (isAll) {
            // State: ALL -> Go to NONE
            setPlanPermissions(otherPermissions);
        } else if (isNone) {
            // State: NONE -> Go to DB (if DB had something, else go to ALL)
            if (dbEnabled.length > 0) {
                setPlanPermissions([...otherPermissions, ...dbEnabled]);
            } else {
                setPlanPermissions([...otherPermissions, ...suiteFeatures]);
            }
        } else {
            // State: CUSTOM (Partially matching something else) -> Go to ALL
            setPlanPermissions([...otherPermissions, ...suiteFeatures]);
        }
    };

    const toggleFeaturePermission = (featureId: string) => {
        if (planPermissions.includes(featureId)) {
            setPlanPermissions(planPermissions.filter(id => id !== featureId));
        } else {
            setPlanPermissions([...planPermissions, featureId]);
        }
    };

    const toggleSuiteExpansion = (suiteId: string) => {
        if (expandedSuites.includes(suiteId)) {
            setExpandedSuites(expandedSuites.filter(id => id !== suiteId));
        } else {
            setExpandedSuites([...expandedSuites, suiteId]);
        }
    };

    const handleToggleStatus = async (plan: Plan) => {
        try {
            const result = await togglePlanActive(plan.id, !plan.active);
            if (!result.success) throw new Error(result.error);
            toast.success(`Plano ${plan.active ? 'desativado' : 'ativado'} com sucesso!`);
            fetchPlans();
        } catch (err: any) {
            toast.error('Erro ao alterar status: ' + err.message);
        }
    };

    const handleDelete = async () => {
        if (!planToDelete) return;
        try {
            const result = await deletePlan(planToDelete.id);
            if (!result.success) throw new Error(result.error);
            setPlanToDelete(null);
            fetchPlans();
        } catch (err: any) {
            alert('Erro ao excluir: ' + err.message);
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= plans.length) return;

        try {
            await Promise.all([
                supabase.from('plans').update({ order_index: swapIndex }).eq('id', plans[index].id),
                supabase.from('plans').update({ order_index: index }).eq('id', plans[swapIndex].id)
            ]);
            fetchPlans();
        } catch (err) {
            console.error('Swap failed', err);
        }
    };

    const handleTranslate = async () => {
        if (!formData.short_desc?.[activeLang]) {
            toast.error('Preencha a Bio Curta para traduzir.');
            return;
        }

        setIsTranslating(true);

        try {
            const payload = {
                name: formData.name,
                short_desc: formData.short_desc![activeLang],
                features: formData.features![activeLang]
            };

            const targetLangs = (['pt', 'en', 'es'] as const).filter(l => l !== activeLang);
            const translations = await gemini.translateSuite(payload, targetLangs as unknown as string[]);

            const newShortDesc = { ...formData.short_desc };
            const newFeatures = { ...formData.features };

            Object.keys(translations).forEach((lang: any) => {
                newShortDesc[lang as 'pt' | 'en' | 'es'] = translations[lang].short_desc;
                newFeatures[lang as 'pt' | 'en' | 'es'] = translations[lang].features || [];
            });

            setFormData({
                ...formData,
                short_desc: newShortDesc as any,
                features: newFeatures as any
            });

            toast.success('Tradução baseada em IA concluída!');
        } catch (err: any) {
            toast.error('Erro na tradução: ' + err.message);
        } finally {
            setIsTranslating(false);
        }
    };

    const filteredPlans = plans.filter(p => {
        if (filter === 'combo') return p.is_combo;
        if (filter === 'individual') return !p.is_combo;
        return true;
    });

    if (loading && plans.length === 0) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Gestão de Planos</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">Configure os pacotes e preços do Veritum Pro.</p>
                </div>
                <div className="flex bg-white dark:bg-slate-900 p-1 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                    {(['all', 'individual', 'combo'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${filter === f ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
                        >
                            {f === 'all' ? 'Todos' : f === 'individual' ? 'Individuais' : 'Combos'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 items-start">
                {/* Table Column (List) - Left side, narrower */}
                <div className="w-full lg:w-[30%] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] sticky top-8">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Listagem</span>
                        <div className="flex gap-2 text-[10px] font-bold">
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /></span>
                            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-slate-300" /></span>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                            <tr>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Ordem</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">Plano</th>
                                <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredPlans.map((p, idx) => (
                                <tr key={p.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group ${editingPlan?.id === p.id ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col items-center gap-0">
                                            <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-0.5 text-slate-300 hover:text-indigo-600 disabled:opacity-10"><ChevronUp size={14} /></button>
                                            <button onClick={() => handleMove(idx, 'down')} disabled={idx === filteredPlans.length - 1} className="p-0.5 text-slate-300 hover:text-indigo-600 disabled:opacity-10"><ChevronDown size={14} /></button>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-1.5 h-6 rounded-full shrink-0 ${p.is_combo ? 'bg-amber-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                                            <span className="font-bold text-slate-800 dark:text-white block leading-tight text-[11px] truncate max-w-[120px]">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                onClick={() => handleToggleStatus(p)}
                                                className={`p-1.5 rounded-lg transition-all shadow-sm ${p.active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                                title={p.active ? 'Plano Ativo' : 'Plano Inativo'}
                                            >
                                                <Radio size={14} className={p.active ? 'fill-emerald-500/20' : ''} />
                                            </button>
                                            <button
                                                onClick={() => { setEditingPlan(p); setFormData(p); }}
                                                className={`p-1.5 rounded-lg transition-all shadow-sm ${editingPlan?.id === p.id ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                            >
                                                <FileEdit size={14} />
                                            </button>
                                            <button onClick={() => setPlanToDelete(p)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Form Column - Right side, wider */}
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[700px]">
                    <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
                                <DollarSign size={28} />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                    {editingPlan ? (
                                        <span className="flex items-center gap-2">
                                            <span className="opacity-40 font-black">Editando:</span>
                                            <span className="text-indigo-600 dark:text-indigo-400">{formData.name || 'Sem Nome'}</span>
                                        </span>
                                    ) : 'Novo Plano'}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('details')}
                                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all ${activeTab === 'details' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        Detalhes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('permissions')}
                                        className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md transition-all ${activeTab === 'permissions' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-indigo-600'}`}
                                    >
                                        Permissões
                                    </button>
                                </div>
                            </div>
                        </div>
                        {editingPlan && (
                            <button
                                onClick={() => { setEditingPlan(null); setFormData(initialFormData); setPlanPermissions([]); }}
                                className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm"
                            >
                                <X size={14} /> Cancelar Seleção
                            </button>
                        )}
                    </div>

                    <form onSubmit={handleSave} className="p-8 space-y-8">
                        {activeTab === 'details' ? (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nome do Plano</label>
                                            <div className="relative group">
                                                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                                <input
                                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white transition-all shadow-sm"
                                                    placeholder="EX: ESSENTIAL PRO"
                                                    value={formData.name}
                                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                                    required
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between ml-1">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Descrição Curta</label>
                                                <div className="flex gap-1">
                                                    {(['pt', 'en', 'es'] as const).map(l => (
                                                        <button
                                                            key={l}
                                                            type="button"
                                                            onClick={() => setActiveLang(l)}
                                                            className={`w-5 h-5 rounded-full border-2 overflow-hidden transition-all ${activeLang === l ? 'border-indigo-600 scale-110 shadow-md' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                                        >
                                                            <img src={l === 'pt' ? BR_FLAG : l === 'en' ? US_FLAG : ES_FLAG} alt={l} className="w-full h-full object-cover" />
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="relative group">
                                                <Sparkles className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors shadow-sm" size={18} />
                                                <textarea
                                                    className="w-full pl-12 pr-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white resize-none min-h-[80px]"
                                                    placeholder="Breve slogan ou diferencial do plano..."
                                                    value={formData.short_desc?.[activeLang] || ''}
                                                    onChange={e => setFormData({ ...formData, short_desc: { ...formData.short_desc!, [activeLang]: e.target.value } })}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleTranslate}
                                                    disabled={isTranslating}
                                                    className="absolute right-4 bottom-4 p-2 bg-indigo-600 text-white rounded-lg hover:bg-slate-800 transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/20"
                                                    title="Traduzir via Gemini IA"
                                                >
                                                    {isTranslating ? <RefreshCw size={14} className="animate-spin" /> : <Zap size={14} />}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preço Mensal (R$)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white transition-all shadow-sm"
                                                    value={formData.monthly_price}
                                                    onChange={e => setFormData({ ...formData, monthly_price: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Desconto (%)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600 transition-all shadow-sm"
                                                    value={formData.monthly_discount}
                                                    onChange={e => setFormData({ ...formData, monthly_discount: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Preço Anual (R$)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white transition-all shadow-sm"
                                                    value={formData.yearly_price}
                                                    onChange={e => setFormData({ ...formData, yearly_price: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Desconto (%)</label>
                                                <input
                                                    type="number"
                                                    className="w-full px-4 py-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600 transition-all shadow-sm"
                                                    value={formData.yearly_discount}
                                                    onChange={e => setFormData({ ...formData, yearly_discount: parseFloat(e.target.value) })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Funcionalidades Básicas (Bullet Points)</label>
                                    <div className="relative group">
                                        <LayoutGrid className="absolute left-4 top-4 text-slate-400 group-focus-within:text-indigo-600" size={18} />
                                        <textarea
                                            rows={4}
                                            className="w-full px-12 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white resize-none shadow-sm"
                                            placeholder="Uma funcionalidade por linha..."
                                            value={formData.features?.[activeLang]?.join('\n') || ''}
                                            onChange={e => setFormData({ ...formData, features: { ...formData.features!, [activeLang]: e.target.value.split('\n').filter(l => l.trim() !== '') } })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-amber-200 transition-colors shadow-sm">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={formData.recommended} onChange={e => setFormData({ ...formData, recommended: e.target.checked })} />
                                            <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-amber-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                                            <span className="ml-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Plano Recomendado</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-emerald-200 transition-colors shadow-sm">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={formData.active} onChange={e => setFormData({ ...formData, active: e.target.checked })} />
                                            <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                                            <span className="ml-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Ativo para Venda</span>
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-indigo-200 transition-colors shadow-sm">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={formData.is_combo} onChange={e => setFormData({ ...formData, is_combo: e.target.checked })} />
                                            <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                                            <span className="ml-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">Plano Combo</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800 shadow-sm">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1 flex items-center gap-2">
                                        <ShieldCheck size={14} /> Controle de Acesso Granular
                                    </h4>
                                    <p className="text-[9px] text-indigo-600/70 font-medium leading-relaxed italic">
                                        Selecione quais suítes e funcionalidades específicas estarão liberadas neste plano.
                                    </p>
                                </div>

                                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                    {allSuites.map(suite => {
                                        const suiteFeatures = allFeatures.filter(f => f.suite_id === suite.id);
                                        const currentEnabled = suiteFeatures.filter(f => planPermissions.includes(f.id));
                                        const dbEnabled = suiteFeatures.filter(f => dbPermissions.includes(f.id));

                                        const isAll = suiteFeatures.length > 0 && currentEnabled.length === suiteFeatures.length;
                                        const isNone = currentEnabled.length === 0;
                                        const isDbMatch = currentEnabled.length === dbEnabled.length &&
                                            currentEnabled.every(f => dbPermissions.includes(f.id));

                                        const isExpanded = expandedSuites.includes(suite.id);
                                        const isEnabled = currentEnabled.length > 0;

                                        return (
                                            <div key={suite.id} className={`p-4 rounded-3xl border transition-all ${isEnabled ? 'bg-white dark:bg-slate-900 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-slate-50/50 dark:bg-slate-950/20 border-slate-100 dark:border-slate-800'} ${!isEnabled && !isExpanded ? 'opacity-60' : 'opacity-100'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div
                                                        className="flex items-center gap-3 cursor-pointer flex-1 group"
                                                        onClick={() => toggleSuiteExpansion(suite.id)}
                                                    >
                                                        <div className={`p-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}>
                                                            <ChevronRight size={14} className="text-slate-400 group-hover:text-indigo-600" />
                                                        </div>
                                                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isEnabled ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                                            <Package size={16} />
                                                        </div>
                                                        <div>
                                                            <h5 className="text-[11px] font-black uppercase tracking-tight dark:text-white leading-none">{suite.name}</h5>
                                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{suite.suite_key}</span>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => toggleSuitePermission(suite.id)}
                                                        className={`p-1.5 rounded-lg transition-all ${isAll ? 'bg-indigo-600 text-white shadow-md' :
                                                            isDbMatch ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400' :
                                                                isEnabled ? 'bg-indigo-200 text-indigo-700' :
                                                                    'bg-slate-200 dark:bg-slate-800 text-slate-400'
                                                            }`}
                                                        title={
                                                            isAll ? "Clique para desmarcar tudo" :
                                                                isDbMatch ? "Dados Originais (Clique para marcar tudo)" :
                                                                    isNone ? "Vazio (Clique para restaurar originais)" :
                                                                        "Seleção Parcial (Clique para marcar tudo)"
                                                        }
                                                    >
                                                        {
                                                            isAll ? <Check size={14} /> :
                                                                isDbMatch ? <Database size={14} /> :
                                                                    isNone ? <Plus size={14} /> :
                                                                        <Layers size={14} />
                                                        }
                                                    </button>
                                                </div>

                                                {isExpanded && suiteFeatures.length > 0 && (
                                                    <div className="grid grid-cols-1 gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        {suiteFeatures.map(feature => {
                                                            const isFeatEnabled = planPermissions.includes(feature.id);
                                                            return (
                                                                <button
                                                                    key={feature.id}
                                                                    type="button"
                                                                    onClick={() => toggleFeaturePermission(feature.id)}
                                                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[9px] font-bold uppercase tracking-tight transition-all ${isFeatEnabled ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-800' : 'bg-slate-50 border-slate-100 text-slate-400 dark:bg-slate-950/20 dark:border-slate-800 hover:border-slate-200'}`}
                                                                >
                                                                    <div className={`w-3.5 h-3.5 rounded flex items-center justify-center border transition-all ${isFeatEnabled ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
                                                                        {isFeatEnabled && <Check size={10} strokeWidth={4} />}
                                                                    </div>
                                                                    <div className="flex flex-col items-start text-left">
                                                                        <span>{feature.display_name}</span>
                                                                        {feature.description && <span className="text-[7px] lowercase opacity-60 normal-case leading-tight">{feature.description}</span>}
                                                                    </div>
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-[1.01] active:scale-95 transition-all text-sm flex items-center justify-center gap-3 mt-4"
                        >
                            <ShieldCheck size={18} /> {editingPlan ? 'Salvar Alterações' : 'Criar Plano no Ecossistema'}
                        </button>
                    </form>
                </div>
            </div>

            {/* Delete Modal */}
            {planToDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                            <AlertTriangle size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Excluir Plano?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                Você removerá <span className="font-bold text-slate-800 dark:text-slate-200">"{planToDelete.name}"</span> das opções de venda.
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setPlanToDelete(null)} className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-xs">Não</button>
                            <button onClick={handleDelete} className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-rose-600/20">Sim, Excluir</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanManagement;
