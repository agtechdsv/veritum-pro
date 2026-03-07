
import React, { useState, useEffect } from 'react';
import { Credentials, FinancialTransaction, Lawsuit, Person, User } from '@/types';
import {
    TrendingUp, TrendingDown, Clock, CreditCard, PieChart, Plus,
    Search, Filter, Calendar, MoreHorizontal, DollarSign,
    CheckCircle2, XCircle, AlertCircle, ArrowUpRight, ArrowDownRight,
    Wallet, Receipt, Landmark, BarChart3, ChevronRight, Scale, User as UserIcon, ChevronDown
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { createClient } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from '@/contexts/language-context';
import { toast } from '@/components/ui/toast';
import { createMasterClient } from '@/lib/supabase/master';

const Valorem: React.FC<{ credentials: Credentials; user: User; permissions: any }> = ({ credentials, user, permissions }) => {
    // Data State
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Partial<FinancialTransaction> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const { t, locale } = useTranslation();

    // Master Selection States
    const isMaster = user.role === 'Master';
    const [selectedUserId, setSelectedUserId] = useState<string>(isMaster ? '' : user.id);
    const [allUsers, setAllUsers] = useState<any[]>([]);

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

    useEffect(() => {
        if (isMaster) {
            fetchClients();
        }
    }, [isMaster]);

    useEffect(() => {
        fetchData();
    }, [selectedUserId]);

    const fetchClients = async () => {
        const supMaster = createMasterClient();
        const { data } = await supMaster
            .from('users')
            .select('id, name, email, role')
            .in('role', ['Sócio-Administrador', 'Sócio Administrador'])
            .order('name');
        if (data) setAllUsers(data);
    };

    const fetchData = async () => {
        if (isMaster && !selectedUserId) {
            setTransactions([]);
            setLawsuits([]);
            setPersons([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        // Clear previous state
        setTransactions([]);
        setLawsuits([]);
        setPersons([]);

        try {
            // Note: In a real multi-tenant BYODB setup, we would need to dynamically switch 
            // the supabase client instance based on the selectedUserId's credentials.
            // For now, we assume the current client has access or we filter by user_id if unified.
            // If it's pure BYODB, this 'supabase' instance should be the client-specific one.

            const [txRes, lawRes, personRes] = await Promise.all([
                supabase.from('financial_transactions').select('*').order('transaction_date', { ascending: false }),
                supabase.from('lawsuits').select('*'),
                supabase.from('persons').select('*')
            ]);
            setTransactions(txRes.data || []);
            setLawsuits(lawRes.data || []);
            setPersons(personRes.data || []);
        } catch (err) {
            console.error('Error fetching financial data:', err);
            toast.error('Erro ao carregar dados financeiros');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveTransaction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTx?.id) {
                const { error } = await supabase.from('financial_transactions').update(editingTx).eq('id', editingTx.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('financial_transactions').insert([editingTx]);
                if (error) throw error;
            }
            setIsModalOpen(false);
            setEditingTx(null);
            fetchData();
        } catch (err) {
            console.error('Error saving transaction:', err);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // Analytics
    const totalIncome = transactions.filter(t => t.entry_type === 'Credit').reduce((acc, t) => acc + Number(t.amount), 0);
    const totalExpense = transactions.filter(t => t.entry_type === 'Debit').reduce((acc, t) => acc + Number(t.amount), 0);
    const pendingAmount = transactions.filter(t => t.status === 'Pendente').reduce((acc, t) => acc + Number(t.amount), 0);

    const chartData = transactions.length > 0
        ? transactions.slice(0, 10).reverse().map(t => ({
            name: new Date(t.transaction_date).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' }),
            value: Number(t.amount),
            type: t.entry_type
        }))
        : [
            { name: 'Jan', value: 4500, type: 'Credit' },
            { name: 'Fev', value: 3200, type: 'Credit' },
            { name: 'Mar', value: 6800, type: 'Credit' },
            { name: 'Abr', value: 4800, type: 'Credit' },
            { name: 'Mai', value: 9200, type: 'Credit' },
            { name: 'Jun', value: 5500, type: 'Credit' },
        ];

    const filteredTransactions = transactions.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col h-full space-y-6 high-density">
            {/* Header */}
            <div className="flex items-center justify-between shrink-0">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
                            <Wallet size={24} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.valorem.title')}</h1>
                            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{t('modules.valorem.subtitle')}</p>
                        </div>
                    </div>

                    <button
                        onClick={() => { setEditingTx({ entry_type: 'Credit', status: 'Pendente', transaction_date: new Date().toISOString() }); setIsModalOpen(true); }}
                        className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-600/30 active:scale-95"
                    >
                        <Plus size={16} /> {t('modules.valorem.newTransaction')}
                    </button>
                </div>

                {/* Master Context Selector */}
                {isMaster && (
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pl-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{t('modules.valorem.masterContext')}</span>
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">{t('modules.valorem.selectClient')}</span>
                        </div>
                        <div className="relative">
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-xs font-black tracking-widest text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer min-w-[260px] appearance-none pr-10"
                            >
                                <option value="">{t('modules.valorem.clientPlaceholder')}</option>
                                <optgroup label={t('modules.valorem.clientGroup')}>
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

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.valorem.stats.balance')}</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(totalIncome - totalExpense)}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl"><Landmark size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('modules.valorem.stats.income')}</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><TrendingUp size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm border-l-4 border-l-amber-500">
                    <div>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{t('modules.valorem.stats.pending')}</p>
                        <p className="text-2xl font-black text-amber-600">{formatCurrency(pendingAmount)}</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl"><Clock size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t('modules.valorem.stats.expense')}</p>
                        <p className="text-2xl font-black text-rose-600">{formatCurrency(totalExpense)}</p>
                    </div>
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl"><TrendingDown size={20} /></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Dashboard: Chart & Table */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Chart Card */}
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={14} className="text-indigo-500" /> {t('modules.valorem.chart.title')}
                            </h3>
                            <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-transform">{t('modules.valorem.chart.fullReports')}</button>
                        </div>
                        <div className="h-48 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                                    <XAxis dataKey="name" hide />
                                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '12px' }} />
                                    <Area type="monotone" dataKey="value" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorVal)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Transactions List */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col h-[400px]">
                        <div className="p-5 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">{t('modules.valorem.list.title')}</h3>
                            <div className="flex items-center gap-2">
                                <Search size={14} className="text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder={t('modules.valorem.list.searchPlaceholder')}
                                    className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/30 dark:bg-slate-800/30 sticky top-0 backdrop-blur-md">
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4">{t('modules.valorem.list.date')}</th>
                                        <th className="px-6 py-4">{t('modules.valorem.list.description')}</th>
                                        <th className="px-6 py-4">{t('modules.valorem.list.status')}</th>
                                        <th className="px-6 py-4 text-right">{t('modules.valorem.list.value')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{t('modules.valorem.list.loading')}</td></tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">{t('modules.valorem.list.empty')}</td></tr>
                                    ) : filteredTransactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-400 font-mono whitespace-nowrap uppercase">
                                                {new Date(tx.transaction_date).toLocaleDateString(locale === 'pt' ? 'pt-BR' : locale === 'es' ? 'es-ES' : 'en-US', { day: '2-digit', month: 'short' })}
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-xs font-black text-slate-700 dark:text-slate-200 line-clamp-1">{tx.title}</p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">{tx.category || 'Geral'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${tx.status === 'Pago' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                    tx.status === 'Pendente' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        'bg-slate-100 text-slate-400 border-slate-200'
                                                    }`}>
                                                    {tx.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <p className={`text-xs font-black ${tx.entry_type === 'Credit' ? 'text-emerald-600' : 'text-slate-700 dark:text-slate-200'}`}>
                                                    {tx.entry_type === 'Credit' ? '+' : '-'} {formatCurrency(tx.amount)}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar: Summary & Alerts */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                        <div className="relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{t('modules.valorem.sidebar.efficiency')}</p>
                            <h2 className="text-4xl font-black mb-4">92.4%</h2>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[92.4%]" />
                                </div>
                            </div>
                            <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                                {t('modules.valorem.sidebar.efficiencyNote')}
                            </p>
                        </div>
                        <div className="absolute top-[-20px] right-[-20px] p-10 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <PieChart size={14} className="text-indigo-500" /> {t('modules.valorem.sidebar.categoryDivision')}
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: t('modules.valorem.sidebar.categories.fees'), val: 65, color: 'bg-indigo-500' },
                                { label: t('modules.valorem.sidebar.categories.operational'), val: 20, color: 'bg-emerald-500' },
                                { label: t('modules.valorem.sidebar.categories.costs'), val: 15, color: 'bg-rose-500' },
                            ].map((cat, i) => (
                                <div key={i} className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">
                                        <span className="text-slate-500">{cat.label}</span>
                                        <span className="text-slate-800 dark:text-white">{cat.val}%</span>
                                    </div>
                                    <div className="h-1 bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                                        <div className={`h-full ${cat.color} rounded-full`} style={{ width: `${cat.val}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Transaction Drawer */}
            <AnimatePresence>
                {isModalOpen && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsModalOpen(false)}
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
                                    <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.valorem.drawer.title')}</h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">{t('modules.valorem.drawer.subtitle')}</p>
                                </div>
                                <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all">
                                    <XCircle size={28} />
                                </button>
                            </div>
                            <form onSubmit={handleSaveTransaction} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
                                    <div className="grid grid-cols-2 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setEditingTx({ ...editingTx, entry_type: 'Credit' })}
                                            className={`p-5 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${editingTx?.entry_type === 'Credit' ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-lg shadow-emerald-500/10' : 'bg-slate-50 border-transparent text-slate-400'
                                                }`}
                                        >
                                            <ArrowUpRight size={18} /> {t('modules.valorem.drawer.income')}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setEditingTx({ ...editingTx, entry_type: 'Debit' })}
                                            className={`p-5 rounded-2xl border-2 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 transition-all ${editingTx?.entry_type === 'Debit' ? 'bg-rose-50 border-rose-500 text-rose-600 shadow-lg shadow-rose-500/10' : 'bg-slate-50 border-transparent text-slate-400'
                                                }`}
                                        >
                                            <ArrowDownRight size={18} /> {t('modules.valorem.drawer.expense')}
                                        </button>
                                    </div>

                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.valorem.drawer.labelDescription')}</label>
                                            <input
                                                required
                                                value={editingTx?.title || ''}
                                                onChange={e => setEditingTx({ ...editingTx, title: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                                                placeholder={t('modules.valorem.drawer.placeholderDescription')}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.valorem.drawer.labelAmount')}</label>
                                                <input
                                                    required
                                                    type="number"
                                                    step="0.01"
                                                    value={editingTx?.amount || ''}
                                                    onChange={e => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-black text-lg text-emerald-600 dark:text-emerald-400"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.valorem.drawer.labelStatus')}</label>
                                                <select
                                                    value={editingTx?.status || 'Pendente'}
                                                    onChange={e => setEditingTx({ ...editingTx, status: e.target.value as any })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold uppercase tracking-widest text-[10px]"
                                                >
                                                    <option value="Pendente">{t('modules.valorem.drawer.statuses.pending')}</option>
                                                    <option value="Pago">{t('modules.valorem.drawer.statuses.paid')}</option>
                                                    <option value="Cancelado">{t('modules.valorem.drawer.statuses.canceled')}</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.valorem.drawer.labelLawsuit')}</label>
                                                <select
                                                    value={editingTx?.lawsuit_id || ''}
                                                    onChange={e => setEditingTx({ ...editingTx, lawsuit_id: e.target.value })}
                                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold text-xs"
                                                >
                                                    <option value="">{t('modules.valorem.drawer.placeholderLawsuit')}</option>
                                                    {lawsuits.map(law => (
                                                        <option key={law.id} value={law.id}>{law.cnj_number}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.valorem.drawer.labelPerson')}</label>
                                                <select
                                                    value={editingTx?.person_id || ''}
                                                    onChange={e => setEditingTx({ ...editingTx, person_id: e.target.value })}
                                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold text-xs"
                                                >
                                                    <option value="">{t('modules.valorem.drawer.placeholderPerson')}</option>
                                                    {persons.map(p => (
                                                        <option key={p.id} value={p.id}>{p.full_name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                    <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-[10px]">{t('common.cancel') || 'Descartar'}</button>
                                    <button type="submit" className="flex-[2] px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 text-[10px]">
                                        <CheckCircle2 size={16} /> {t('modules.valorem.drawer.save')}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default Valorem;
