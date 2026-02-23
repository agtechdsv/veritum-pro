
import React, { useState, useEffect } from 'react';
import { Credentials, FinancialTransaction, Lawsuit, Person } from '@/types';
import {
    TrendingUp, TrendingDown, Clock, CreditCard, PieChart, Plus,
    Search, Filter, Calendar, MoreHorizontal, DollarSign,
    CheckCircle2, XCircle, AlertCircle, ArrowUpRight, ArrowDownRight,
    Wallet, Receipt, Landmark, BarChart3, ChevronRight, Scale, User
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { createClient } from '@supabase/supabase-js';

const Valorem: React.FC<{ credentials: Credentials; permissions: any }> = ({ credentials, permissions }) => {
    // Data State
    const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTx, setEditingTx] = useState<Partial<FinancialTransaction> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
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
            name: new Date(t.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }),
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
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-600 text-white p-3 rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
                        <Wallet size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">VALOREM PRO</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Gestão Financeira & Fluxo de Caixa Jurídico</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingTx({ entry_type: 'Credit', status: 'Pendente', transaction_date: new Date().toISOString() }); setIsModalOpen(true); }}
                    className="bg-emerald-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-95"
                >
                    <Plus size={18} /> Novo Lançamento
                </button>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Saldo em Caixa</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{formatCurrency(totalIncome - totalExpense)}</p>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-xl"><Landmark size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Receita (Total)</p>
                        <p className="text-2xl font-black text-emerald-600">{formatCurrency(totalIncome)}</p>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl"><TrendingUp size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm border-l-4 border-l-amber-500">
                    <div>
                        <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">A Receber</p>
                        <p className="text-2xl font-black text-amber-600">{formatCurrency(pendingAmount)}</p>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-xl"><Clock size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">Despesas</p>
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
                                <BarChart3 size={14} className="text-indigo-500" /> Movimentação de Caixa
                            </h3>
                            <button className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 hover:scale-105 transition-transform">Ver Relatórios Completos</button>
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
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Extrato Recente</h3>
                            <div className="flex items-center gap-2">
                                <Search size={14} className="text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Buscar lançamentos..."
                                    className="bg-transparent border-none outline-none text-[11px] font-bold text-slate-700 dark:text-white"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/30 dark:bg-slate-800/30 sticky top-0 backdrop-blur-md">
                                    <tr className="text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                        <th className="px-6 py-4">Data</th>
                                        <th className="px-6 py-4">Lançamento</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {loading ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Conciliando dados...</td></tr>
                                    ) : filteredTransactions.length === 0 ? (
                                        <tr><td colSpan={4} className="p-8 text-center text-xs font-bold text-slate-400 uppercase tracking-widest">Nenhum lançamento encontrado.</td></tr>
                                    ) : filteredTransactions.map(tx => (
                                        <tr key={tx.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                            <td className="px-6 py-4 text-[10px] font-bold text-slate-400 font-mono whitespace-nowrap uppercase">
                                                {new Date(tx.transaction_date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
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
                            <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Eficácia de Cobrança</p>
                            <h2 className="text-4xl font-black mb-4">92.4%</h2>
                            <div className="flex items-center gap-2 mb-6">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-500 w-[92.4%]" />
                                </div>
                            </div>
                            <p className="text-xs text-indigo-200 font-medium leading-relaxed">
                                Sua taxa de recebimento está acima da média do mercado (85%). Continue assim!
                            </p>
                        </div>
                        <div className="absolute top-[-20px] right-[-20px] p-10 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                    </div>

                    <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                            <PieChart size={14} className="text-indigo-500" /> Divisão por Categoria
                        </h3>
                        <div className="space-y-4">
                            {[
                                { label: 'Honorários', val: 65, color: 'bg-indigo-500' },
                                { label: 'Operacional', val: 20, color: 'bg-emerald-500' },
                                { label: 'Custas', val: 15, color: 'bg-rose-500' },
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

            {/* Modal de Transação */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Novo Lançamento</h3>
                                <p className="text-xs text-slate-500 font-medium flex items-center gap-1">Gestão de receitas e custos do escritório.</p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTransaction} className="p-8 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingTx({ ...editingTx, entry_type: 'Credit' })}
                                    className={`p-4 rounded-2xl border-2 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${editingTx?.entry_type === 'Credit' ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400'
                                        }`}
                                >
                                    <ArrowUpRight size={18} /> Receita
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setEditingTx({ ...editingTx, entry_type: 'Debit' })}
                                    className={`p-4 rounded-2xl border-2 font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${editingTx?.entry_type === 'Debit' ? 'bg-rose-50 border-rose-500 text-rose-600' : 'bg-slate-50 border-transparent text-slate-400'
                                        }`}
                                >
                                    <ArrowDownRight size={18} /> Despesa
                                </button>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Descrição / Título</label>
                                    <input
                                        required
                                        value={editingTx?.title || ''}
                                        onChange={e => setEditingTx({ ...editingTx, title: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                                        placeholder="Ex: Honorários - Processo 001/24"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Valor (BRL)</label>
                                        <input
                                            required
                                            type="number"
                                            step="0.01"
                                            value={editingTx?.amount || ''}
                                            onChange={e => setEditingTx({ ...editingTx, amount: Number(e.target.value) })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold"
                                            placeholder="0,00"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Status</label>
                                        <select
                                            value={editingTx?.status || 'Pendente'}
                                            onChange={e => setEditingTx({ ...editingTx, status: e.target.value as any })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold uppercase tracking-widest text-[10px]"
                                        >
                                            <option value="Pendente">Aguardando Pagamento</option>
                                            <option value="Pago">Liquidado / Pago</option>
                                            <option value="Cancelado">Cancelado / Estornado</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Processo Nexus</label>
                                        <select
                                            value={editingTx?.lawsuit_id || ''}
                                            onChange={e => setEditingTx({ ...editingTx, lawsuit_id: e.target.value })}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold text-xs"
                                        >
                                            <option value="">Não vinculado a processo</option>
                                            {lawsuits.map(law => (
                                                <option key={law.id} value={law.id}>{law.cnj_number}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Pessoa / Cliente</label>
                                        <select
                                            value={editingTx?.person_id || ''}
                                            onChange={e => setEditingTx({ ...editingTx, person_id: e.target.value })}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all dark:text-white font-bold text-xs"
                                        >
                                            <option value="">Não vinculado a pessoa</option>
                                            {persons.map(p => (
                                                <option key={p.id} value={p.id}>{p.full_name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Descartar</button>
                                <button type="submit" className="flex-[2] px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-600/30 transition-all flex items-center justify-center gap-2">
                                    <CheckCircle2 size={20} /> Efetivar Lançamento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Valorem;
