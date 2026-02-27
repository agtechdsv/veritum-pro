'use client'

import React, { useState, useEffect } from 'react'
import { Plus, CreditCard, Shield, Settings2, Trash2, Key, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { createMasterClient } from '@/lib/supabase/master'
import { createFintechSubAccount } from './actions'
import { useTranslation } from '@/contexts/language-context'
import { toast } from '@/components/ui/toast'
import { AsaasSubAccount } from '@/types'

export default function FintechPage() {
    const [subAccounts, setSubAccounts] = useState<AsaasSubAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [open, setOpen] = useState(false)
    const { t } = useTranslation()
    const supabase = createMasterClient()

    useEffect(() => {
        fetchSubAccounts()
    }, [])

    async function fetchSubAccounts() {
        setLoading(true)
        const { data, error } = await supabase
            .from('asaas_sub_accounts')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            toast.error('Erro ao carregar contas.')
        } else {
            setSubAccounts(data || [])
        }
        setLoading(false)
    }

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        setIsCreating(true)
        const formData = new FormData(e.currentTarget)

        const result = await createFintechSubAccount(formData)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Subconta criada com sucesso!')
            setOpen(false)
            fetchSubAccounts()
        }
        setIsCreating(false)
    }

    return (
        <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-700">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Gerenciamento Fintech</h1>
                    <p className="text-slate-500 dark:text-slate-400">Gerencie subcontas e identidades no Asaas.</p>
                </div>

                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2 shadow-lg shadow-indigo-500/20">
                            <Plus className="w-4 h-4" />
                            Nova Subconta
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                                <Shield className="w-6 h-6 text-indigo-600" />
                                Criar Identidade Financeira
                            </DialogTitle>
                            <DialogDescription>
                                Isso criará uma nova subconta no Asaas vinculada ao seu CNPJ principal.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit} className="space-y-6 py-4">
                            <div className="space-y-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="brandingName">Nome de Branding (Ex: VERITUM PRO)</Label>
                                    <Input
                                        id="brandingName"
                                        name="brandingName"
                                        placeholder="Como aparecerá no boleto"
                                        required
                                        className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="email">E-mail de Notificação</Label>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="financeiro@empresa.com"
                                        required
                                        className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="cpfCnpj">CPF/CNPJ da AGTech</Label>
                                        <Input
                                            id="cpfCnpj"
                                            name="cpfCnpj"
                                            placeholder="00.000.000/0000-00"
                                            required
                                            className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="accountType">Tipo</Label>
                                        <select
                                            name="accountType"
                                            className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        >
                                            <option value="product">Produto (Interno)</option>
                                            <option value="user">Usuário (Marketplace)</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="phone">Telefone (Opcional)</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="(11) 99999-9999"
                                        className="bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                                    />
                                </div>
                            </div>

                            <DialogFooter>
                                <Button type="submit" disabled={isCreating} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-6 text-lg font-semibold transition-all duration-300">
                                    {isCreating ? 'Conectando ao Asaas...' : 'Ativar Unidade de Negócio'}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-[200px] w-full rounded-xl bg-slate-100 dark:bg-slate-800/50 animate-pulse" />
                    ))
                ) : subAccounts.length === 0 ? (
                    <Card className="col-span-full py-12 border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent">
                        <CardContent className="flex flex-col items-center justify-center gap-4 text-center">
                            <CreditCard className="w-12 h-12 text-slate-300" />
                            <div className="space-y-1">
                                <p className="text-lg font-medium text-slate-900 dark:text-white">Nenhuma subconta ativa</p>
                                <p className="text-sm text-slate-500">Comece criando uma subconta para o VERITUM PRO.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : subAccounts.map((account) => (
                    <Card key={account.id} className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 group">
                        <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <CardHeader className="pb-2">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${account.account_type === 'product' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                    {account.account_type}
                                </span>
                            </div>
                            <CardTitle className="text-xl font-bold text-slate-900 dark:text-white line-clamp-1">{account.branding_name}</CardTitle>
                            <CardDescription className="flex items-center gap-1">
                                ID: <span className="font-mono text-[11px]">{account.asaas_id}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-0">
                            <div className="p-3 bg-slate-50 dark:bg-slate-950 rounded-lg space-y-2">
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-500 flex items-center gap-1"><Key className="w-3 h-3" /> API KEY</span>
                                    <span className="text-slate-900 dark:text-white font-mono">••••••••••••{account.api_key.slice(-4)}</span>
                                </div>
                                <div className="flex justify-between items-center text-[11px]">
                                    <span className="text-slate-500 flex items-center gap-1"><Settings2 className="w-3 h-3" /> STATUS</span>
                                    <span className="text-green-500 font-bold uppercase">{account.status}</span>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 justify-between group">
                                <span className="text-xs font-medium">Configurações Avançadas</span>
                                <Settings2 className="w-4 h-4 text-slate-400 group-hover:text-indigo-500 transition-colors" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-indigo-600 border-none overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Info className="w-32 h-32 text-white" />
                </div>
                <CardContent className="p-8 relative z-10 flex flex-col md:flex-row items-center gap-6">
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md">
                        <CreditCard className="w-10 h-10 text-white" />
                    </div>
                    <div className="flex-1 space-y-1">
                        <h3 className="text-xl font-bold text-white">Próximo Passo: Split de Pagamentos</h3>
                        <p className="text-indigo-100 text-sm max-w-2xl">
                            Agora que você pode gerenciar subcontas, podemos configurar regras de comissionamento automático.
                            Sempre que uma subconta receber, você pode mover uma parte para a conta principal AGTech.
                        </p>
                    </div>
                    <Button className="bg-white text-indigo-600 hover:bg-white/90 whitespace-nowrap">
                        Documentação Split
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
