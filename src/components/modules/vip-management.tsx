import React, { useState, useEffect } from 'react';
import {
    Plus, Trash2, FileEdit, Check, X, ChevronUp, ChevronDown,
    Zap, Sparkles, AlertTriangle, Crown, Settings, Radio, Layers, Database
} from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';
import { Credentials, Plan } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { toast } from '../ui/toast';

interface Props {
    credentials: Credentials;
}

const BR_FLAG = "https://flagcdn.com/w40/br.png";
const US_FLAG = "https://flagcdn.com/w40/us.png";
const ES_FLAG = "https://flagcdn.com/w40/es.png";

type TranslationStr = { pt: string; en: string; es: string };

interface VipBenefit {
    id: string;
    name: TranslationStr;
    short_desc: TranslationStr;
    long_desc: TranslationStr;
    benefit_type: 'feature' | 'discount' | 'service' | 'physical' | 'other';
    status: 'active' | 'inactive';
    icon_name: string;
    benefit_key: string;
    metadata: Record<string, any>;
    order_index?: number;
}

interface VipBenefitPlan {
    id?: string;
    benefit_id: string;
    plan_id: string;
    cycles: string[];
    is_locked: boolean;
}

type BillingCycle = 'monthly' | 'quarterly' | 'semiannual' | 'annual';

interface ReferralRule {
    id?: string;
    plan_id: string;
    billing_cycle: BillingCycle;
    points_generated: number;
}

const VipManagement: React.FC<Props> = ({ credentials }) => {
    const { t, locale } = useTranslation();
    const [mainTab, setMainTab] = useState<'benefits' | 'coin_factory'>('benefits');
    const [benefits, setBenefits] = useState<VipBenefit[]>([]);
    const [allPlans, setAllPlans] = useState<Plan[]>([]);
    const [referralRules, setReferralRules] = useState<ReferralRule[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingBenefit, setEditingBenefit] = useState<VipBenefit | null>(null);
    const [benefitToDelete, setBenefitToDelete] = useState<VipBenefit | null>(null);

    // TAB Control
    const [activeTab, setActiveTab] = useState<'details' | 'rules' | 'audience'>('details');

    // Mapeamento Público
    const [benefitPlans, setBenefitPlans] = useState<VipBenefitPlan[]>([]);

    const initialFormData: Partial<VipBenefit> = {
        name: { pt: '', en: '', es: '' },
        short_desc: { pt: '', en: '', es: '' },
        long_desc: { pt: '', en: '', es: '' },
        benefit_type: 'service',
        status: 'active',
        icon_name: 'Sparkles',
        benefit_key: '',
        metadata: { cost_in_points: 0 }
    };

    const [formData, setFormData] = useState<Partial<VipBenefit>>(initialFormData);
    const [activeLang, setActiveLang] = useState<'pt' | 'en' | 'es'>('pt');
    const supabase = createMasterClient();

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        await Promise.all([fetchBenefits(), fetchPlans(), fetchReferralRules()]);
        setLoading(false);
    };

    const fetchPlans = async () => {
        const { data } = await supabase.from('plans').select('*').order('order_index');
        if (data) setAllPlans(data);
    };

    const fetchReferralRules = async () => {
        const { data } = await supabase.from('referral_rules').select('*');
        if (data) setReferralRules(data);
    };

    const fetchBenefits = async () => {
        const { data, error } = await supabase
            .from('vip_benefits')
            .select('*')
            .order('order_index', { ascending: true });

        if (!error && data) {
            const mapped = data.map(d => ({
                id: d.id,
                name: typeof d.name === 'string' ? JSON.parse(d.name) : d.name,
                short_desc: typeof d.short_desc === 'string' ? JSON.parse(d.short_desc) : d.short_desc,
                long_desc: typeof d.long_desc === 'string' ? JSON.parse(d.long_desc) : d.long_desc || { pt: '', en: '', es: '' },
                benefit_type: d.benefit_type,
                status: d.status,
                icon_name: d.icon_name,
                benefit_key: d.benefit_key || '',
                metadata: typeof d.metadata === 'string' ? JSON.parse(d.metadata) : d.metadata || {},
                order_index: d.order_index
            }));
            setBenefits(mapped);
        }
    };

    const fetchBenefitPlans = async (benefitId: string) => {
        const { data } = await supabase.from('vip_benefit_plans').select('*').eq('benefit_id', benefitId);
        if (data) {
            setBenefitPlans(data.map((d: any) => ({
                id: d.id,
                benefit_id: d.benefit_id,
                plan_id: d.plan_id,
                cycles: typeof d.cycles === 'string' ? JSON.parse(d.cycles) : d.cycles || [],
                is_locked: d.is_locked
            })));
        } else {
            setBenefitPlans([]);
        }
    };

    const handleSave = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        try {
            const rowData = {
                name: formData.name,
                short_desc: formData.short_desc,
                long_desc: formData.long_desc || { pt: '', en: '', es: '' },
                benefit_type: formData.benefit_type,
                status: formData.status,
                icon_name: formData.icon_name,
                benefit_key: formData.benefit_key?.trim() ? formData.benefit_key.trim() : null,
                metadata: formData.metadata || {},
                order_index: editingBenefit ? Number(formData.order_index) : benefits.length
            };

            let currentBenefitId = editingBenefit?.id;

            if (editingBenefit) {
                await supabase.from('vip_benefits').update(rowData).eq('id', editingBenefit.id);
                toast.success(t('management.master.vip.saveSuccess') || 'Benefício atualizado com sucesso!');
            } else {
                const { data } = await supabase.from('vip_benefits').insert([rowData]).select('id').single();
                if (data) currentBenefitId = data.id;
                toast.success(t('management.master.vip.saveSuccess') || 'Benefício criado com sucesso!');
            }

            // Save Plans mapping if we are editing or just created it
            if (currentBenefitId) {
                // Delete existing
                await supabase.from('vip_benefit_plans').delete().eq('benefit_id', currentBenefitId);
                // Insert new
                if (benefitPlans.length > 0) {
                    const toInsert = benefitPlans.map(bp => ({
                        benefit_id: currentBenefitId,
                        plan_id: bp.plan_id,
                        cycles: bp.cycles,
                        is_locked: bp.is_locked
                    }));
                    await supabase.from('vip_benefit_plans').insert(toInsert);
                }
            }

            setEditingBenefit(null);
            setFormData(initialFormData);
            setBenefitPlans([]);
            setActiveTab('details');
            fetchBenefits();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao salvar benefício');
        }
    };

    const handleToggleStatus = async (ben: VipBenefit) => {
        try {
            const newStatus = ben.status === 'active' ? 'inactive' : 'active';
            await supabase.from('vip_benefits').update({ status: newStatus }).eq('id', ben.id);
            toast.success(t('management.master.vip.statusUpdated') || 'Status atualizado');
            fetchBenefits();
        } catch (err: any) {
            toast.error(t('management.master.vip.statusError') || 'Erro ao atualizar status');
        }
    };

    const handleDelete = async () => {
        if (!benefitToDelete) return;
        try {
            await supabase.from('vip_benefits').delete().eq('id', benefitToDelete.id);
            setBenefitToDelete(null);
            fetchBenefits();
            toast.success(t('management.master.vip.deleteSuccess') || 'Benefício excluído');
        } catch (err: any) {
            toast.error(t('management.master.vip.deleteError') || 'Erro ao excluir');
        }
    };

    const handleMove = async (index: number, direction: 'up' | 'down') => {
        const swapIndex = direction === 'up' ? index - 1 : index + 1;
        if (swapIndex < 0 || swapIndex >= benefits.length) return;

        try {
            await Promise.all([
                supabase.from('vip_benefits').update({ order_index: swapIndex }).eq('id', benefits[index].id),
                supabase.from('vip_benefits').update({ order_index: index }).eq('id', benefits[swapIndex].id)
            ]);
            fetchBenefits();
        } catch (err) {
            console.error('Swap failed', err);
        }
    };

    const handlePlanToggle = (planId: string) => {
        const existing = benefitPlans.find(bp => bp.plan_id === planId);
        if (existing) {
            setBenefitPlans(benefitPlans.filter(bp => bp.plan_id !== planId));
        } else {
            setBenefitPlans([...benefitPlans, { benefit_id: editingBenefit?.id || '', plan_id: planId, cycles: ['monthly', 'quarterly', 'semiannual', 'annual'], is_locked: false }]);
        }
    };

    const handleCycleToggle = (planId: string, cycle: string) => {
        const existing = benefitPlans.find(bp => bp.plan_id === planId);
        if (!existing) return;

        let newCycles = [...existing.cycles];
        if (newCycles.includes(cycle)) {
            newCycles = newCycles.filter(c => c !== cycle);
        } else {
            newCycles.push(cycle);
        }

        setBenefitPlans(benefitPlans.map(bp => bp.plan_id === planId ? { ...bp, cycles: newCycles } : bp));
    };

    const handleSaveReferralRules = async () => {
        try {
            setLoading(true);
            const toUpsert = referralRules.map(rr => ({
                id: rr.id, // Only include ID if we are updating, but supabase upsert will figure it out if id exists
                plan_id: rr.plan_id,
                billing_cycle: rr.billing_cycle,
                points_generated: rr.points_generated,
            }));

            // Supabase allows bulk upsert if we provide ID. 
            // Better to upsert based on unique constraint (plan_id, billing_cycle).
            for (const rule of referralRules) {
                if (rule.id) {
                    await supabase.from('referral_rules').update({ points_generated: rule.points_generated }).eq('id', rule.id);
                } else {
                    await supabase.from('referral_rules').insert({
                        plan_id: rule.plan_id,
                        billing_cycle: rule.billing_cycle,
                        points_generated: rule.points_generated
                    });
                }
            }

            toast.success(t('management.master.vip.rulesSaved') || 'Regras de ganho de pontos atualizadas com sucesso!');
            await fetchReferralRules();
        } catch (err: any) {
            toast.error(err.message || t('common.error') || 'Erro ao salvar regras');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateRule = (planId: string, cycle: BillingCycle, points: number) => {
        setReferralRules(prev => {
            const existing = prev.find(r => r.plan_id === planId && r.billing_cycle === cycle);
            if (existing) {
                return prev.map(r => (r.plan_id === planId && r.billing_cycle === cycle) ? { ...r, points_generated: points } : r);
            } else {
                return [...prev, { plan_id: planId, billing_cycle: cycle, points_generated: points }];
            }
        });
    };

    if (loading && benefits.length === 0 && allPlans.length === 0) return (
        <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20">
            <div className="flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between">
                <div className="flex flex-col gap-2">
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-3">
                        <Crown className="text-amber-500" size={32} />
                        {t('management.master.vip.title') || 'Gestão Clube VIP'}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic">{t('management.master.vip.subtitle') || 'Gerencie os benefícios e regras de indicação do programa Clube VIP.'}</p>
                </div>

                {/* Main Tabs Segment Control */}
                <div className="flex items-center p-1.5 bg-slate-200/50 dark:bg-slate-800/80 rounded-2xl shadow-inner border border-slate-200/50 dark:border-slate-800/50 backdrop-blur-sm self-stretch sm:self-auto min-w-max">
                    <button
                        onClick={() => setMainTab('benefits')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 
                        ${mainTab === 'benefits' ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-md border border-slate-100 dark:border-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <Sparkles size={14} className={mainTab === 'benefits' ? 'animate-pulse' : ''} />
                        {t('management.master.vip.tabPrizes') || 'Loja de Prêmios'}
                    </button>
                    <button
                        onClick={() => setMainTab('coin_factory')}
                        className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-[14px] text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative z-10 
                        ${mainTab === 'coin_factory' ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-md border border-slate-100 dark:border-slate-800' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                    >
                        <Database size={14} className={mainTab === 'coin_factory' ? 'animate-pulse' : ''} />
                        {t('management.master.vip.tabCoins') || 'Fábrica de Moedas'}
                    </button>
                </div>
            </div>

            {loading && allPlans.length > 0 && (
                <div className="fixed top-4 right-4 z-[9999] bg-slate-900 text-white px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-2xl animate-fade-in">
                    <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> {t('management.master.vip.saving') || 'Salvando...'}
                </div>
            )}

            {mainTab === 'coin_factory' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="p-8 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-[2.5rem] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                        <div className="flex items-start gap-5 relative z-10">
                            <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20 shrink-0">
                                <Database size={28} />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-xl font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-tight">{t('management.master.vip.coinFactoryTitle') || 'Regras de Indicação (Fábrica de Moedas)'}</h2>
                                <p className="text-sm font-medium text-indigo-700/70 dark:text-indigo-300/70 max-w-2xl">
                                    {t('management.master.vip.coinFactoryDesc') || 'Defina quantos Pontos VIP o seu cliente ganha caso a pessoa que ele indicou se torne assinante de um desses planos. Se o plano não participa da promoção, deixe tudo com valor ZERO.'}
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveReferralRules}
                            disabled={loading}
                            className="flex items-center gap-2 px-6 py-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-600/30 whitespace-nowrap relative z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check size={16} /> {t('management.master.vip.saveRules') || 'Salvar Regras'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {allPlans.map(plan => {
                            const cycles: BillingCycle[] = ['monthly', 'quarterly', 'semiannual', 'annual'];
                            const getPoints = (cycle: BillingCycle) => {
                                const rule = referralRules.find(r => r.plan_id === plan.id && r.billing_cycle === cycle);
                                return rule ? rule.points_generated : 0;
                            };

                            return (
                                <div key={plan.id} className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden group hover:border-indigo-300 dark:hover:border-indigo-700/50 transition-all">
                                    <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
                                        <h3 className="font-black text-slate-800 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                            <span className="w-2 h-2 rounded-full bg-indigo-500 group-hover:animate-pulse" />
                                            {typeof plan.name === 'object' ? (plan.name[locale as keyof typeof plan.name] || plan.name.pt) : plan.name}
                                        </h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {cycles.map(cycle => (
                                            <div key={cycle} className="flex items-center justify-between gap-4">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
                                                    {cycle === 'monthly' ? (t('management.master.vip.monthly') || 'Mensal') : cycle === 'quarterly' ? (t('management.master.vip.quarterly') || 'Trimestral') : cycle === 'semiannual' ? (t('management.master.vip.semiannual') || 'Semestral') : (t('management.master.vip.annual') || 'Anual')}
                                                </span>
                                                <div className="flex flex-col relative w-32">
                                                    <input
                                                        type="number"
                                                        value={getPoints(cycle) || ''}
                                                        onChange={(e) => handleUpdateRule(plan.id, cycle, Number(e.target.value))}
                                                        className="w-full pl-4 pr-10 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none dark:text-white transition-all text-right shadow-inner tabular-nums placeholder:text-slate-300"
                                                        placeholder={t('management.master.vip.pointsPlaceholder') || "0"}
                                                        min="0"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-slate-400 uppercase tracking-widest pointer-events-none">{t('management.master.vip.pointsSuffix') || 'PTS'}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {mainTab === 'benefits' && (
                <div className="flex flex-col lg:flex-row gap-8 items-start animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Table Column */}
                    <div className="w-full lg:w-[30%] bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[600px] sticky top-8">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{t('management.master.vip.benefitsTitle') || 'Benefícios'}</span>
                        </div>
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50 dark:bg-slate-800/30">
                                <tr>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.vip.tableOrder') || 'Ord'}</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.vip.tableName') || 'Nome'}</th>
                                    <th className="px-4 py-4 text-[9px] font-black text-slate-400 uppercase tracking-widest text-right">{t('management.master.vip.tableAction') || 'Ação'}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {benefits.map((b, idx) => (
                                    <tr key={b.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group ${editingBenefit?.id === b.id ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col items-center gap-0">
                                                <button onClick={() => handleMove(idx, 'up')} disabled={idx === 0} className="p-0.5 text-slate-300 hover:text-amber-600 disabled:opacity-10"><ChevronUp size={14} /></button>
                                                <button onClick={() => handleMove(idx, 'down')} disabled={idx === benefits.length - 1} className="p-0.5 text-slate-300 hover:text-amber-600 disabled:opacity-10"><ChevronDown size={14} /></button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <div className="flex flex-col justify-center">
                                                <span className="font-bold text-slate-800 dark:text-white block leading-tight text-[11px] truncate max-w-[120px]">
                                                    {b.name[locale as keyof TranslationStr] || b.name.pt}
                                                </span>
                                                {b.benefit_key && <span className="text-[9px] font-black uppercase tracking-widest text-amber-500/70">{b.benefit_key}</span>}
                                            </div>
                                        </td>
                                        <td className="px-4 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button
                                                    onClick={() => handleToggleStatus(b)}
                                                    className={`p-1.5 rounded-lg transition-all shadow-sm ${b.status === 'active' ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                                >
                                                    <Radio size={14} className={b.status === 'active' ? 'fill-emerald-500/20' : ''} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        setEditingBenefit(b);
                                                        setFormData(b);
                                                        setActiveLang((locale === 'en' || locale === 'es') ? locale : 'pt');
                                                        fetchBenefitPlans(b.id);
                                                        setActiveTab('details');
                                                    }}
                                                    className={`p-1.5 rounded-lg transition-all shadow-sm ${editingBenefit?.id === b.id ? 'bg-amber-500 text-white' : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                                >
                                                    <FileEdit size={14} />
                                                </button>
                                                <button onClick={() => setBenefitToDelete(b)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all shadow-sm">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Form Column */}
                    <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden min-h-[700px]">
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/20">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-amber-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-amber-500/20 shrink-0">
                                    <Sparkles size={24} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                        {editingBenefit ? (t('management.master.vip.editBenefit') || 'Editar Benefício VIP') : (t('management.master.vip.newBenefit') || 'Novo Benefício VIP')}
                                    </h2>
                                    <div className="flex items-center gap-2 mt-2">
                                        <button type="button" onClick={() => setActiveTab('details')} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md transition-all ${activeTab === 'details' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>{t('management.master.vip.tabDetails') || 'Detalhes'}</button>
                                        <button type="button" onClick={() => setActiveTab('rules')} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md transition-all ${activeTab === 'rules' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>{t('management.master.vip.tabRules') || 'Regras & Custos'}</button>
                                        <button type="button" onClick={() => setActiveTab('audience')} className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md transition-all ${activeTab === 'audience' ? 'bg-amber-500 text-white' : 'text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800'}`}>{t('management.master.vip.tabAudience') || 'Público'}</button>
                                    </div>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-3">
                                <div className="flex items-center gap-2">
                                    {(['pt', 'en', 'es'] as const).map(lang => (
                                        <button key={lang} type="button" onClick={() => setActiveLang(lang)} className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all p-0.5 hover:scale-110 active:scale-95 ${activeLang === lang ? 'border-amber-500 shadow-lg shadow-amber-500/20' : 'border-transparent opacity-40 hover:opacity-100'}`} title={lang.toUpperCase()}>
                                            <img src={lang === 'pt' ? BR_FLAG : lang === 'en' ? US_FLAG : ES_FLAG} alt={lang} className="w-full h-full object-cover rounded-full" />
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-2">
                                    {editingBenefit ? (
                                        <>
                                            <button type="button" onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm shadow-amber-500/20">
                                                <Check size={14} /> {t('common.save') || 'Salvar'}
                                            </button>
                                            <button type="button" onClick={() => { setEditingBenefit(null); setFormData(initialFormData); setBenefitPlans([]); }} className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm">
                                                <X size={14} /> {t('common.cancel') || 'Cancelar'}
                                            </button>
                                        </>
                                    ) : (
                                        <button type="button" onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-xl hover:bg-amber-600 transition-all text-[10px] font-black uppercase tracking-widest shadow-sm shadow-amber-500/20">
                                            <Plus size={14} /> {t('management.master.vip.createBenefit') || 'Criar Benefício'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSave} className="p-8 space-y-6">
                            {activeTab === 'details' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.vip.detailsTitle') || 'Título'}</label>
                                                <input className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all shadow-sm" placeholder="EX: E-mail Profissional" value={formData.name?.[activeLang] || ''} onChange={e => setFormData({ ...formData, name: { ...formData.name!, [activeLang]: e.target.value } })} required />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.vip.detailsShortDesc') || 'Descrição Curta (Resumo)'}</label>
                                                <textarea className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none dark:text-white resize-none min-h-[80px]" placeholder={t('management.master.vip.detailsShortDescPlaceholder') || "Descreva o benefício em poucas palavras"} value={formData.short_desc?.[activeLang] || ''} onChange={e => setFormData({ ...formData, short_desc: { ...formData.short_desc!, [activeLang]: e.target.value } })} />
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-2 ml-1"><Zap size={12} /> {t('management.master.vip.detailsKey') || 'Chave / Slug do Sistema (Key)'}</label>
                                                <input className="w-full px-4 py-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none dark:text-amber-400 transition-all shadow-sm placeholder:text-amber-400/30" placeholder={t('management.master.vip.detailsKeyPlaceholder') || "ex: discount_next_bill, unlock_module"} value={formData.benefit_key || ''} onChange={e => setFormData({ ...formData, benefit_key: e.target.value })} />
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.vip.detailsIcon') || 'Ícone'}</label>
                                                <input className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all shadow-sm" placeholder="EX: ShieldCheck" value={formData.icon_name || ''} onChange={e => setFormData({ ...formData, icon_name: e.target.value })} />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.vip.detailsLongDesc') || 'Descrição Completa'}</label>
                                        <textarea className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-amber-500 outline-none dark:text-white resize-none min-h-[120px]" placeholder={t('management.master.vip.detailsLongDescPlaceholder') || "Mais informações a serem detalhadas no modal de resgate..."} value={formData.long_desc?.[activeLang] || ''} onChange={e => setFormData({ ...formData, long_desc: { ...formData.long_desc!, [activeLang]: e.target.value } })} />
                                    </div>

                                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-emerald-200 transition-colors shadow-sm w-max">
                                        <label className="relative inline-flex items-center cursor-pointer">
                                            <input type="checkbox" className="sr-only peer" checked={formData.status === 'active'} onChange={e => setFormData({ ...formData, status: e.target.checked ? 'active' : 'inactive' })} />
                                            <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-emerald-500 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                                            <span className="ml-3 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">{t('management.master.vip.detailsActive') || 'Ativo para Resgate de Usuários'}</span>
                                        </label>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'rules' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-200 dark:border-slate-700">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">{t('management.master.vip.rulesMath') || 'Variáveis do Motor Matemático'}</h4>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.vip.rulesCost') || 'Custo em Pontos'}</label>
                                                <input type="number" className="w-full px-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-amber-500 outline-none dark:text-white transition-all shadow-sm" value={formData.metadata?.cost_in_points || 0} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, cost_in_points: Number(e.target.value) } })} />
                                                <p className="text-[9px] text-slate-400 px-2 mt-1">{t('management.master.vip.rulesCostHint') || '(Se for inerente ao plano, deixe zero)'}</p>
                                            </div>

                                            <div className="space-y-1.5">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.vip.rulesDiscount') || 'Desconto Aplicado (%) - Opcional'}</label>
                                                <input type="number" className="w-full px-4 py-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-800/50 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-emerald-600 transition-all shadow-sm" value={formData.metadata?.discount_percentage || 0} onChange={e => setFormData({ ...formData, metadata: { ...formData.metadata, discount_percentage: Number(e.target.value) } })} />
                                            </div>
                                        </div>

                                        <div className="mt-6 space-y-1.5">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">{t('management.master.vip.rulesMetadata') || 'Metadata Avançado (Outras variáveis JSON)'}</label>
                                            <textarea
                                                className="w-full px-4 py-4 bg-slate-900 text-green-400 font-mono text-xs border border-slate-800 rounded-2xl min-h-[120px] shadow-inner"
                                                value={JSON.stringify(formData.metadata, null, 2)}
                                                onChange={(e) => {
                                                    try {
                                                        const m = JSON.parse(e.target.value);
                                                        setFormData({ ...formData, metadata: m });
                                                    } catch (err) { }
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'audience' && (
                                <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                                    <div className="p-6 bg-indigo-50 dark:bg-indigo-900/20 rounded-3xl border border-indigo-100 dark:border-indigo-800/30 flex items-start gap-4">
                                        <Database size={24} className="text-indigo-500 mt-1" />
                                        <div>
                                            <h4 className="text-sm font-black uppercase tracking-tight text-indigo-700 dark:text-indigo-400 mb-1">{t('management.master.vip.audienceTitle') || 'Elegibilidade do Benefício'}</h4>
                                            <p className="text-xs text-indigo-600/70 dark:text-indigo-400/70 font-medium">{t('management.master.vip.audienceDesc') || 'Ligue os planos e os ciclos que dão direito a este benefício. Se ele não for atrelado a nenhum (venda avulsa pro clube VIP), apenas deixe tudo desativado.'}</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {allPlans.map(plan => {
                                            const mapping = benefitPlans.find(bp => bp.plan_id === plan.id);
                                            const isEnabled = !!mapping;

                                            return (
                                                <div key={plan.id} className={`p-5 rounded-3xl transition-all border ${isEnabled ? 'bg-white dark:bg-slate-800 border-indigo-200 dark:border-indigo-700 shadow-md' : 'bg-slate-50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800/30'}`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div>
                                                            <h5 className="text-[11px] font-black uppercase tracking-tight dark:text-white">{typeof plan.name === 'object' ? (plan.name[locale as keyof typeof plan.name] || plan.name.pt) : plan.name}</h5>
                                                        </div>
                                                        <label className="relative inline-flex items-center cursor-pointer">
                                                            <input type="checkbox" className="sr-only peer" checked={isEnabled} onChange={() => handlePlanToggle(plan.id)} />
                                                            <div className="w-9 h-5 bg-slate-300 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full shadow-inner"></div>
                                                        </label>
                                                    </div>

                                                    {isEnabled && (
                                                        <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-700 animate-in fade-in slide-in-from-top-2">
                                                            <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">{t('management.master.vip.audienceCycles') || 'Ciclos Elegíveis'}</span>
                                                            <div className="grid grid-cols-2 gap-2">
                                                                {['monthly', 'quarterly', 'semiannual', 'annual'].map(cycle => (
                                                                    <button
                                                                        key={cycle}
                                                                        type="button"
                                                                        onClick={() => handleCycleToggle(plan.id, cycle)}
                                                                        className={`px-2 py-1.5 rounded-lg text-[9px] font-bold uppercase transition-all border ${mapping?.cycles.includes(cycle) ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-400' : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900 dark:border-slate-800 hover:bg-slate-100'}`}
                                                                    >
                                                                        {cycle === 'monthly' ? (t('management.master.vip.monthly') || 'Mensal') : cycle === 'quarterly' ? (t('management.master.vip.quarterly') || 'Trimestral') : cycle === 'semiannual' ? (t('management.master.vip.semiannual') || 'Semestral') : (t('management.master.vip.annual') || 'Anual')}
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {benefitToDelete && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center space-y-6">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xl">
                            <AlertTriangle size={40} />
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('management.master.vip.confirmDeleteTitle') || 'Excluir Benefício?'}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                {t('management.master.vip.confirmDeleteMessage', { name: benefitToDelete.name[locale as keyof TranslationStr] }) || `Tem certeza que deseja excluir o benefício "${benefitToDelete.name[locale as keyof TranslationStr]}"?`}
                            </p>
                        </div>
                        <div className="flex gap-4 pt-4">
                            <button type="button" onClick={() => setBenefitToDelete(null)} className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-xs">{t('management.master.vip.confirmDeleteNo') || 'Não'}</button>
                            <button type="button" onClick={handleDelete} className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs shadow-xl shadow-rose-600/20">{t('management.master.vip.confirmDeleteYes') || 'Sim, Excluir'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VipManagement;
