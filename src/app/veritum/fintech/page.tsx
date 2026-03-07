'use client'

import React, { useState, useEffect } from 'react'
import { Plus, CreditCard, Shield, Settings2, Trash2, Key, Info, XCircle, Filter, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createMasterClient } from '@/lib/supabase/master'
import { createFintechSubAccount } from './actions'
import { useTranslation } from '@/contexts/language-context'
import { toast } from '@/components/ui/toast'
import { AsaasSubAccount, User } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'

export default function FintechPage() {
    const [subAccounts, setSubAccounts] = useState<AsaasSubAccount[]>([])
    const [loading, setLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const { t } = useTranslation()
    const supabase = createMasterClient()

    // Master Context Selection
    const [allUsers, setAllUsers] = useState<User[]>([])
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [currentUser, setCurrentUser] = useState<User | null>(null)

    useEffect(() => {
        fetchInitialData()
    }, [])

    useEffect(() => {
        if (selectedUserId) {
            fetchSubAccounts(selectedUserId)
        }
    }, [selectedUserId])

    async function fetchInitialData() {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (!authUser) return

        const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('id', authUser.id)
            .single()

        if (profile) {
            setCurrentUser(profile)
            setSelectedUserId(profile.id)

            if (profile.role === 'Master') {
                const { data: clients } = await supabase
                    .from('users')
                    .select('*')
                    .in('role', ['Sócio-Administrador', 'Sócio Administrador'])
                    .order('name')

                if (clients) setAllUsers(clients)
            }
        }
    }

    async function fetchSubAccounts(userId: string) {
        setLoading(true)
        const { data, error } = await supabase
            .from('asaas_sub_accounts')
            .select('*')
            .eq('admin_id', userId)
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

        // Ensure we pass the selectedUserId if we want to create it for that context
        // But the action currently uses auth user. Let's keep consistency for now or fix action.
        // The action's logic might need update if Master creates FOR someone else, 
        // but typically Admin creates for themselves. For now, let's stick to the UI polish.

        const result = await createFintechSubAccount(formData)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Subconta criada com sucesso!')
            setIsDrawerOpen(false)
            fetchSubAccounts(selectedUserId)
        }
        setIsCreating(false)
    }

    const isMaster = currentUser?.role === 'Master'

    return (
        <div className="flex flex-col gap-8 p-8 animate-in fade-in duration-700 max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                            <CreditCard size={24} />
                        </div>
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Gerenciamento Fintech</h1>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Subcontas e Identidades Asaas</p>
                        </div>
                    </div>

                    <button
                        onClick={() => setIsDrawerOpen(true)}
                        className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/30 active:scale-95"
                    >
                        <Plus size={16} /> Nova Subconta
                    </button>
                </div>

                {/* Master Context Selector */}
                {isMaster && (
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pl-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Contexto Master</span>
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">Selecione o Cliente</span>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-xs font-black tracking-widest text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer min-w-[260px] appearance-none pr-10"
                            >
                                <option value="">--- Selecione um Cliente ---</option>
                                <option value={currentUser?.id}>Meu Contexto Mestre</option>
                                <optgroup label="CLIENTES (SÓCIOS ADM)">
                                    {allUsers.map(u => {
                                        const rawName = typeof u.name === 'object' ? ((u.name as any).pt || (u.name as any).en || '') : (u.name || '');
                                        const formattedName = rawName.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                        const formattedEmail = (u.email || '').toLowerCase();
                                        return (
                                            <option key={u.id} value={u.id}>
                                                🏢 {formattedName} ({formattedEmail})
                                            </option>
                                        );
                                    })}
                                </optgroup>
                            </select>
                            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    Array(3).fill(0).map((_, i) => (
                        <div key={i} className="h-[200px] w-full rounded-3xl bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 animate-pulse" />
                    ))
                ) : subAccounts.length === 0 ? (
                    <Card className="col-span-full py-20 border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent rounded-[2.5rem]">
                        <CardContent className="flex flex-col items-center justify-center gap-6 text-center">
                            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                <CreditCard className="w-10 h-10 text-slate-300" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Nenhuma subconta ativa</p>
                                <p className="text-sm text-slate-500 max-w-sm">Comece criando uma subconta para automatizar seu faturamento e split de pagamentos.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : subAccounts.map((account) => (
                    <Card key={account.id} className="overflow-hidden border-slate-200 dark:border-slate-800 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500 group rounded-[2.5rem] bg-white dark:bg-slate-900">
                        <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-red-500 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                        <CardHeader className="p-8 pb-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <span className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${account.account_type === 'product' ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                                    {account.account_type === 'product' ? 'Unidade Interna' : 'Marketplace'}
                                </span>
                            </div>
                            <CardTitle className="text-2xl font-black text-slate-800 dark:text-white line-clamp-1 uppercase tracking-tighter">{account.branding_name}</CardTitle>
                            <CardDescription className="flex items-center gap-2 mt-2">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asaas ID:</span>
                                <span className="font-mono text-xs text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-500/5 px-2 py-0.5 rounded-lg">{account.asaas_id}</span>
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            <div className="p-5 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800/50 space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Key className="w-4 h-4" /> Token API</span>
                                    <span className="text-slate-900 dark:text-white font-mono text-xs font-bold bg-white dark:bg-slate-900 px-3 py-1 rounded-lg border border-slate-100 dark:border-slate-800">••••••••••••{account.api_key.slice(-4)}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Settings2 className="w-4 h-4" /> Qualidade</span>
                                    <span className="flex items-center gap-2 text-emerald-500 font-black uppercase text-[10px] tracking-widest">
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        {account.status}
                                    </span>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full h-14 border-slate-200 dark:border-slate-800 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/50 justify-between group/btn px-6 transition-all duration-300 border-2">
                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">Painel de Controle</span>
                                <Settings2 className="w-5 h-5 text-slate-400 group-hover/btn:text-indigo-500 group-hover/btn:rotate-90 transition-all duration-500" />
                            </Button>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Card className="bg-indigo-600 border-none overflow-hidden relative rounded-[2.5rem] shadow-2xl shadow-indigo-600/30">
                <div className="absolute top-0 right-0 p-8 opacity-20 rotate-12">
                    <Info className="w-48 h-48 text-white" />
                </div>
                <CardContent className="p-10 relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="p-6 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 shadow-inner">
                        <CreditCard className="w-12 h-12 text-white" />
                    </div>
                    <div className="flex-1 space-y-3">
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Automação de Recebíveis</h3>
                        <p className="text-indigo-50 text-base max-w-2xl font-medium leading-relaxed">
                            Agora que você pode gerenciar subcontas, o próximo passo é configurar o <strong>Split de Pagamentos Rule-Based</strong>.
                            Mova comissões automaticamente da conta principal para cada unidade de negócio.
                        </p>
                    </div>
                    <Button className="bg-white text-indigo-600 hover:bg-white/90 whitespace-nowrap px-10 py-7 text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl transition-all active:scale-95">
                        Guia de Integração Split
                    </Button>
                </CardContent>
            </Card>

            {/* Premium Transaction Drawer */}
            <AnimatePresence>
                {isDrawerOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsDrawerOpen(false)}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 38, stiffness: 220, mass: 1 }}
                            className="relative h-full w-full max-w-xl bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-[-30px_0_70px_-15px_rgba(0,0,0,0.3)] overflow-hidden flex flex-col p-0"
                        >
                            <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                                <div>
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Identidade Fintech</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Configuração de Nova Subconta Asaas</p>
                                </div>
                                <button onClick={() => setIsDrawerOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                                    <XCircle size={28} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                                    <div className="space-y-8">
                                        <div className="grid gap-4">
                                            <Label htmlFor="brandingName" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Nome de Branding (Ex: VERITUM PRO)</Label>
                                            <Input
                                                id="brandingName"
                                                name="brandingName"
                                                placeholder="Como aparecerá no boleto"
                                                required
                                                className="h-14 px-6 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                            />
                                        </div>

                                        <div className="grid gap-4">
                                            <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">E-mail de Notificação Financeira</Label>
                                            <Input
                                                id="email"
                                                name="email"
                                                type="email"
                                                placeholder="financeiro@empresa.com"
                                                required
                                                className="h-14 px-6 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-8">
                                            <div className="grid gap-4">
                                                <Label htmlFor="cpfCnpj" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">CPF/CNPJ da Identidade</Label>
                                                <Input
                                                    id="cpfCnpj"
                                                    name="cpfCnpj"
                                                    placeholder="00.000.000/0000-00"
                                                    required
                                                    className="h-14 px-6 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                                />
                                            </div>
                                            <div className="grid gap-4">
                                                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo de Unidade</Label>
                                                <div className="relative">
                                                    <select
                                                        name="accountType"
                                                        className="h-14 w-full px-6 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black uppercase text-[10px] tracking-widest appearance-none"
                                                    >
                                                        <option value="product">Unidade Interna</option>
                                                        <option value="user">Marketplace / Externo</option>
                                                    </select>
                                                    <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid gap-4">
                                            <Label htmlFor="phone" className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Telefone para Contato (Opcional)</Label>
                                            <Input
                                                id="phone"
                                                name="phone"
                                                placeholder="(11) 99999-9999"
                                                className="h-14 px-6 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold"
                                            />
                                        </div>
                                    </div>

                                    <div className="p-6 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-3xl flex gap-4">
                                        <div className="p-2 h-fit rounded-lg bg-amber-200 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                                            <Shield size={18} />
                                        </div>
                                        <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 leading-relaxed uppercase tracking-tight">
                                            Esta ação criará uma subconta vinculada no Asaas. Tenha certeza de que os dados acima estão corretos para aprovação automática.
                                        </p>
                                    </div>
                                </div>

                                <div className="p-10 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setIsDrawerOpen(false)}
                                        className="flex-1 px-8 py-5 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all text-[10px] border-2 border-transparent"
                                    >
                                        Descartar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isCreating}
                                        className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-2xl shadow-indigo-600/40 transition-all flex items-center justify-center gap-3 text-[10px] disabled:opacity-50"
                                    >
                                        {isCreating ? 'Sincronizando...' : 'Ativar Identidade Fintech'}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    )
}
