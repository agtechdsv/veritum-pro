'use client'

import React, { useEffect, useState } from 'react'
import { createMasterClient } from '@/lib/supabase/master'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Mail, Save, Loader2 } from 'lucide-react'
import { toast } from '@/components/ui/toast'

interface EmailConfig {
    [lang: string]: {
        email: string
        name: string
    }
}

interface EmailSetting {
    id: string
    scenario_key: string
    config: EmailConfig
}

const SCENARIOS = [
    { key: 'general', label: 'Dúvidas Gerais e Parcerias' },
    { key: 'sales', label: 'Vendas VIP e Agendamentos' },
    { key: 'billing', label: 'Gestão de Assinaturas e Financeiro' },
    { key: 'support', label: 'Ajuda Técnica e Suporte' },
]

export function EmailSettingsManager() {
    const [settings, setSettings] = useState<EmailSetting[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<string | null>(null)
    const supabase = createMasterClient()

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const { data, error } = await supabase
                .from('email_settings')
                .select('*')
                .order('scenario_key', { ascending: true })

            if (error) throw error
            setSettings(data || [])
        } catch (error: any) {
            toast.error('Erro ao carregar configurações de e-mail')
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdate = async (setting: EmailSetting) => {
        setSaving(setting.id)
        try {
            const { error } = await supabase
                .from('email_settings')
                .update({ config: setting.config, updated_at: new Date().toISOString() })
                .eq('id', setting.id)

            if (error) throw error
            toast.success('Configuração atualizada com sucesso')
        } catch (error: any) {
            toast.error('Erro ao salvar configuração')
            console.error(error)
        } finally {
            setSaving(null)
        }
    }

    const updateConfig = (settingId: string, lang: string, field: 'email' | 'name', value: string) => {
        setSettings(prev => prev.map(s => {
            if (s.id !== settingId) return s
            return {
                ...s,
                config: {
                    ...s.config,
                    [lang]: {
                        ...s.config[lang],
                        [field]: value
                    }
                }
            }
        }))
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
            <div className="flex items-center gap-3 mb-8">
                <div className="p-3 bg-indigo-500/10 rounded-2xl">
                    <Mail className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">Gestão de E-mails</h1>
                    <p className="text-slate-400 text-sm">Configure os aliases (FROM) agrupados por cenário (JSONB).</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {SCENARIOS.map((scenario) => {
                    const setting = settings.find(s => s.scenario_key === scenario.key)
                    if (!setting) return null

                    return (
                        <Card key={setting.id} className="bg-slate-900/50 border-slate-800 border-none overflow-hidden group">
                            <CardHeader className="border-b border-slate-800 bg-slate-800/30 flex-row items-center justify-between space-y-0">
                                <div>
                                    <CardTitle className="text-lg text-white">{scenario.label}</CardTitle>
                                    <CardDescription>Traduções e e-mails</CardDescription>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => handleUpdate(setting)}
                                    disabled={saving === setting.id}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 px-4"
                                >
                                    {saving === setting.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Salvar
                                </Button>
                            </CardHeader>
                            <CardContent className="p-6 space-y-6">
                                {['pt', 'en'].map((lang) => (
                                    <div key={lang} className="space-y-3">
                                        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-widest">
                                            <span>{lang === 'pt' ? 'Português (BR)' : 'Inglês (US)'}</span>
                                        </div>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 uppercase">E-mail</Label>
                                                <Input
                                                    value={setting.config[lang]?.email || ''}
                                                    onChange={(e) => updateConfig(setting.id, lang, 'email', e.target.value)}
                                                    className="bg-slate-950 border-slate-800 h-9 text-sm focus:ring-indigo-500"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-slate-500 uppercase">Nome</Label>
                                                <Input
                                                    value={setting.config[lang]?.name || ''}
                                                    onChange={(e) => updateConfig(setting.id, lang, 'name', e.target.value)}
                                                    className="bg-slate-950 border-slate-800 h-9 text-sm focus:ring-indigo-500"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    )
                })}
            </div>
        </div>
    )
}
