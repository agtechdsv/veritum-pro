'use client'

import React, { useEffect, useState } from 'react'
import { createMasterClient } from '@/lib/supabase/master'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Server, Save, Plus, Trash2, Check, ExternalLink, Loader2, Sparkles, RefreshCw } from 'lucide-react'
import { toast } from '@/components/ui/toast'
import { useTranslation } from '@/contexts/language-context'
import { GeminiService } from '@/services/gemini'
import { Credentials } from '@/types'

const BR_FLAG = "https://flagcdn.com/w40/br.png";
const US_FLAG = "https://flagcdn.com/w40/us.png";
const ES_FLAG = "https://flagcdn.com/w40/es.png";

export interface CloudFeature {
    category?: string;
    text: { pt: string; en: string; es: string } | string;
    isSub?: boolean;
}

export interface CloudPlan {
    id: string;
    code_name: string;
    name: { pt: string; en: string; es: string } | any;
    badge: { pt: string; en: string; es: string } | any;
    subtitle: { pt: string; en: string; es: string } | any;
    price_monthly: number;
    discounts: { monthly?: number; quarterly: number; semiannual: number; yearly: number } | any;
    credits: { pt: string; en: string; es: string } | any;
    need_more: { pt: string; en: string; es: string } | any;
    features_title: { pt: string; en: string; es: string } | any;
    features: CloudFeature[];
    is_active: boolean;
}

export function CloudSettingsManager({ credentials }: { credentials?: Credentials }) {
    const { t, locale } = useTranslation()
    const activeLocale = (locale === 'en' || locale === 'es') ? locale : 'pt';
    const [activeLang, setActiveLang] = useState<'pt' | 'en' | 'es'>(activeLocale)

    const [plans, setPlans] = useState<CloudPlan[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const [translating, setTranslating] = useState<string | null>(null)

    const supabase = createMasterClient()
    const gemini = credentials?.geminiKey ? new GeminiService(credentials.geminiKey) : null

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const { data, error } = await supabase
                .from('cloud_plans')
                .select('*')
                .order('price_monthly', { ascending: true })

            if (error) throw error
            setPlans(data || [])
        } catch (error: any) {
            toast.error(t('common.error') || 'Erro ao carregar os planos Cloud.')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (plan: CloudPlan) => {
        setSaving(plan.id)
        try {
            const { data, error } = await supabase
                .from('cloud_plans')
                .update({
                    code_name: plan.code_name,
                    name: plan.name,
                    badge: plan.badge,
                    subtitle: plan.subtitle,
                    price_monthly: plan.price_monthly,
                    discounts: plan.discounts,
                    credits: plan.credits,
                    need_more: plan.need_more,
                    features_title: plan.features_title,
                    features: plan.features
                })
                .eq('id', plan.id)
                .select()

            if (error) throw error
            if (!data || data.length === 0) {
                toast.error('Erro de Permissão: Nenhuma linha atualizada (RLS bloqueou).')
                throw new Error("RLS blocked the update or zero rows affected.")
            }
            toast.success(t('common.success') || 'Plano salvo com sucesso!')
        } catch (error: any) {
            toast.error(t('common.error') || 'Erro ao salvar plano.')
            console.error(error)
        } finally {
            setSaving(null)
        }
    }

    const updatePlan = (planId: string, fieldPath: string[], value: any) => {
        setPlans(prev => prev.map(p => {
            if (p.id !== planId) return p

            const newPlan: any = { ...p }
            // Ensure immutability for the immediate child (e.g. name, badge, etc)
            if (fieldPath.length > 1) {
                const parentField = fieldPath[0]
                newPlan[parentField] = { ...(newPlan[parentField] || {}) }
            }

            let current = newPlan
            for (let i = 0; i < fieldPath.length - 1; i++) {
                if (current[fieldPath[i]] == null) {
                    current[fieldPath[i]] = {}
                }
                current = current[fieldPath[i]]
            }
            current[fieldPath[fieldPath.length - 1]] = value
            return newPlan
        }))
    }

    const addFeature = (planId: string) => {
        setPlans(prev => prev.map(p => {
            if (p.id !== planId) return p
            return {
                ...p,
                features: [...(p.features || []), { text: { pt: '', en: '', es: '' }, isSub: false, category: 'compute' }]
            }
        }))
    }

    const removeFeature = (planId: string, index: number) => {
        setPlans(prev => prev.map(p => {
            if (p.id !== planId) return p
            const newFeatures = [...p.features]
            newFeatures.splice(index, 1)
            return { ...p, features: newFeatures }
        }))
    }

    const updateFeature = (planId: string, index: number, field: keyof CloudFeature, value: any, lang?: 'pt' | 'en' | 'es') => {
        setPlans(prev => prev.map(p => {
            if (p.id !== planId) return p
            const newFeatures = [...p.features]
            const feature = { ...newFeatures[index] }

            if (field === 'text' && lang) {
                const currentText = typeof feature.text === 'object' && feature.text !== null ? feature.text : { pt: String(feature.text || ''), en: String(feature.text || ''), es: String(feature.text || '') }
                feature.text = { ...currentText, [lang]: value }
            } else {
                feature[field] = value as never
            }

            newFeatures[index] = feature
            return { ...p, features: newFeatures }
        }))
    }

    const handleTranslatePlan = async (plan: CloudPlan) => {
        if (!gemini) {
            toast.error(t('master.gemini.error') || 'Configure sua chave do Gemini.')
            return
        }

        setTranslating(plan.id)
        try {
            const payload = {
                name: plan.name?.[activeLang] || '',
                badge: plan.badge?.[activeLang] || '',
                subtitle: plan.subtitle?.[activeLang] || '',
                credits: plan.credits?.[activeLang] || '',
                need_more: plan.need_more?.[activeLang] || '',
                features_title: plan.features_title?.[activeLang] || '',
                features: (plan.features || []).map(f => ({
                    category: f.category || '',
                    text: typeof f.text === 'object' && f.text !== null ? f.text[activeLang] || '' : String(f.text || ''),
                    isSub: f.isSub
                }))
            }

            const targetLangs = (['pt', 'en', 'es'] as const).filter(l => l !== activeLang)
            const translations = await gemini.translateSuite(payload, targetLangs as unknown as string[])

            const newName = { ...(plan.name || {}) }
            const newBadge = { ...(plan.badge || {}) }
            const newSubtitle = { ...(plan.subtitle || {}) }
            const newCredits = { ...(plan.credits || {}) }
            const newNeedMore = { ...(plan.need_more || {}) }
            const newFeaturesTitle = { ...(plan.features_title || {}) }

            // Immutable deep clone of features
            const newFeatures = (plan.features || []).map(f => ({
                ...f,
                text: typeof f.text === 'object' && f.text !== null
                    ? { ...(f.text as any) }
                    : { pt: String(f.text || ''), en: '', es: '' }
            }))

            targetLangs.forEach(l => {
                const tr = translations[l]
                if (tr) {
                    if (tr.name) newName[l] = tr.name
                    if (tr.badge) newBadge[l] = tr.badge
                    if (tr.subtitle) newSubtitle[l] = tr.subtitle
                    if (tr.credits) newCredits[l] = tr.credits
                    if (tr.need_more) newNeedMore[l] = tr.need_more
                    if (tr.features_title) newFeaturesTitle[l] = tr.features_title

                    // Fallbacks in case Gemini translates the JSON keys
                    const tFeatures = tr.features || tr.recursos || tr.features_list || tr.caracteristicas || tr.funciones || tr.caratterísticas

                    if (tFeatures && Array.isArray(tFeatures)) {
                        tFeatures.forEach((tFeat: any, idx: number) => {
                            if (newFeatures[idx]) {
                                newFeatures[idx].text[l] = tFeat.text || tFeat.texto || tFeat.desc || ''
                            }
                        })
                    }
                }
            })

            setPlans(prev => prev.map(p => {
                if (p.id !== plan.id) return p
                return {
                    ...p,
                    name: newName,
                    badge: newBadge,
                    subtitle: newSubtitle,
                    credits: newCredits,
                    need_more: newNeedMore,
                    features_title: newFeaturesTitle,
                    features: newFeatures
                }
            }))

            toast.success(t('master.translate.success') || 'Sucesso!')
        } catch (err: any) {
            console.error(err)
            toast.error(t('master.translate.error') || 'Erro ao traduzir usando IA.')
        } finally {
            setTranslating(null)
        }
    }

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-8">
                <div className="flex items-center gap-3">
                    <div className="p-3 bg-emerald-500/10 rounded-2xl">
                        <Server className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 dark:text-white tracking-tight">{t('managementCloud.title') || 'Gestão de Cloud / Add-Ons'}</h1>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('managementCloud.subtitle') || 'Gerencie os pacotes do Veritum Cloud (banco de dados, storage) exibidos no checkout.'}</p>
                    </div>
                </div>

                {/* Flags Selector at Top */}
                <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-slate-400 ml-2">{t('managementCloud.editing') || 'Editando em:'}</span>
                    <div className="flex items-center gap-2">
                        {(['pt', 'en', 'es'] as const).map(l => (
                            <button
                                key={l}
                                type="button"
                                onClick={() => setActiveLang(l)}
                                className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all p-0.5 hover:scale-110 active:scale-95 ${activeLang === l ? 'border-indigo-600 shadow-lg shadow-indigo-600/20' : 'border-transparent opacity-40 hover:opacity-100'}`}
                                title={l.toUpperCase()}
                            >
                                <img
                                    src={l === 'pt' ? BR_FLAG : l === 'en' ? US_FLAG : ES_FLAG}
                                    alt={l}
                                    className="w-full h-full object-cover rounded-full"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {plans.map((plan) => (
                    <Card key={plan.id} className="bg-white dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <CardHeader className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30 flex-row items-center justify-between space-y-0 p-4 sm:p-6">
                            <div>
                                <CardTitle className="text-lg text-slate-800 dark:text-white uppercase font-black">{plan.name?.[activeLang] || plan.name?.pt || t('managementCloud.unnamed') || 'Sem Nome'}</CardTitle>
                                <CardDescription className="text-slate-500 font-mono text-xs">{plan.code_name}</CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline" size="sm"
                                    onClick={() => handleTranslatePlan(plan)}
                                    disabled={translating === plan.id || !gemini}
                                    className="h-9 px-3 text-[10px] uppercase font-bold bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 border-none hover:bg-indigo-100 dark:hover:bg-indigo-900/60"
                                >
                                    {translating === plan.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                                    <span className="hidden sm:inline">{t('managementCloud.translateAI') || 'Traduzir IA'}</span>
                                </Button>
                                <Button
                                    size="sm"
                                    onClick={() => handleUpdate(plan)}
                                    disabled={saving === plan.id}
                                    className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 px-4 shadow-md shadow-emerald-600/20 h-9 text-[10px] uppercase font-bold tracking-wider"
                                >
                                    {saving === plan.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    <span className="hidden sm:inline">{t('common.save') || 'Salvar'}</span>
                                </Button>
                            </div>
                        </CardHeader>

                        <CardContent className="p-4 sm:p-6 space-y-8">
                            {/* Basics */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">{t('managementCloud.baseInfo') || 'Informações Base'}</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t('managementCloud.monthlyPrice') || 'Preço Mensal (R$)'}</Label>
                                        <Input
                                            type="number"
                                            value={plan.price_monthly}
                                            onChange={(e) => updatePlan(plan.id, ['price_monthly'], parseFloat(e.target.value))}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-mono text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{t('managementCloud.codeName') || 'Code Name'}</Label>
                                        <Input
                                            value={plan.code_name}
                                            onChange={(e) => updatePlan(plan.id, ['code_name'], e.target.value)}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Desconto Mensal (%)</Label>
                                        <Input
                                            type="number"
                                            value={plan.discounts?.monthly || 0}
                                            onChange={(e) => updatePlan(plan.id, ['discounts', 'monthly'], parseFloat(e.target.value) || 0)}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-mono text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Desconto Trimestral (%)</Label>
                                        <Input
                                            type="number"
                                            value={plan.discounts?.quarterly || 0}
                                            onChange={(e) => updatePlan(plan.id, ['discounts', 'quarterly'], parseFloat(e.target.value) || 0)}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-mono text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Desconto Semestral (%)</Label>
                                        <Input
                                            type="number"
                                            value={plan.discounts?.semiannual || 0}
                                            onChange={(e) => updatePlan(plan.id, ['discounts', 'semiannual'], parseFloat(e.target.value) || 0)}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-mono text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Desconto Anual (%)</Label>
                                        <Input
                                            type="number"
                                            value={plan.discounts?.yearly || 0}
                                            onChange={(e) => updatePlan(plan.id, ['discounts', 'yearly'], parseFloat(e.target.value) || 0)}
                                            className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-white font-mono text-xs rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Translations */}
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800 pb-2">{t('managementCloud.translationsDisplay') || 'Traduções (Display)'} - {activeLang.toUpperCase()}</h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('managementCloud.planName') || 'Nome do Plano'}</Label>
                                        <Input
                                            value={plan.name?.[activeLang] || ''}
                                            onChange={(e) => updatePlan(plan.id, ['name', activeLang], e.target.value)}
                                            className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('managementCloud.badge') || 'Badge (Opcional)'}</Label>
                                        <Input
                                            value={plan.badge?.[activeLang] || ''}
                                            onChange={(e) => updatePlan(plan.id, ['badge', activeLang], e.target.value)}
                                            className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('managementCloud.subtitleLabel') || 'Subtítulo'}</Label>
                                        <Input
                                            value={plan.subtitle?.[activeLang] || ''}
                                            onChange={(e) => updatePlan(plan.id, ['subtitle', activeLang], e.target.value)}
                                            className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('managementCloud.credits') || 'Créditos Inclusos'}</Label>
                                        <Input
                                            value={plan.credits?.[activeLang] || ''}
                                            onChange={(e) => updatePlan(plan.id, ['credits', activeLang], e.target.value)}
                                            className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('managementCloud.needMore') || 'Call to Action (Need More)'}</Label>
                                        <Input
                                            value={plan.need_more?.[activeLang] || ''}
                                            onChange={(e) => updatePlan(plan.id, ['need_more', activeLang], e.target.value)}
                                            className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5 sm:col-span-2">
                                        <Label className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">{t('managementCloud.featuresTitle') || 'Título das Features'}</Label>
                                        <Input
                                            value={plan.features_title?.[activeLang] || ''}
                                            onChange={(e) => updatePlan(plan.id, ['features_title', activeLang], e.target.value)}
                                            className="bg-white dark:bg-slate-950/50 border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Features */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                    <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{t('managementCloud.featuresList') || 'Features'} - {activeLang.toUpperCase()}</h4>
                                    <Button variant="outline" size="sm" onClick={() => addFeature(plan.id)} className="h-7 text-[10px] font-bold uppercase tracking-widest rounded-lg border-dashed">
                                        <Plus className="w-3 h-3 mr-1" /> {t('managementCloud.addFeature') || 'Adicionar Feature'}
                                    </Button>
                                </div>

                                <div className="space-y-2">
                                    {(plan.features || []).map((feature, index) => {
                                        const textValue = typeof feature.text === 'object' && feature.text !== null ? feature.text[activeLang] || '' : (activeLang === 'pt' ? String(feature.text || '') : '');
                                        return (
                                            <div key={index} className="flex items-center gap-2 p-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => updateFeature(plan.id, index, 'isSub', !feature.isSub)}
                                                    className={`h-8 w-8 p-0 shrink-0 ${feature.isSub ? 'text-indigo-400' : 'text-slate-300'}`}
                                                    title={t('managementCloud.markSub') || 'Sub-feature'}
                                                >
                                                    <Sparkles className="w-4 h-4" />
                                                </Button>
                                                <Input
                                                    value={feature.category || ''}
                                                    onChange={(e) => updateFeature(plan.id, index, 'category', e.target.value)}
                                                    placeholder={t('managementCloud.catPlaceholder') || "Categoria (ex: compute)"}
                                                    className="w-24 sm:w-32 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8"
                                                />
                                                <Input
                                                    value={textValue}
                                                    onChange={(e) => updateFeature(plan.id, index, 'text', e.target.value, activeLang)}
                                                    placeholder={t('managementCloud.descPlaceholder') || "Texto da feature..."}
                                                    className="flex-1 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs h-8"
                                                />
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => removeFeature(plan.id, index)}
                                                    className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        )
                                    })}
                                    {(plan.features || []).length === 0 && (
                                        <p className="text-[10px] uppercase font-bold text-slate-400 text-center py-4 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">{t('management.cloud.noFeatures') || 'Nenhuma feature cadastrada.'}</p>
                                    )}
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
