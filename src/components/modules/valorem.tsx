
import React from 'react';
import { Credentials } from '@/types';
import { TrendingUp, TrendingDown, Clock, CreditCard, PieChart, Plus } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const Valorem: React.FC<{ credentials: Credentials }> = ({ credentials }) => {
    const data = [
        { name: 'Jan', value: 45000 },
        { name: 'Fev', value: 32000 },
        { name: 'Mar', value: 68000 },
        { name: 'Abr', value: 48000 },
        { name: 'Mai', value: 92000 },
        { name: 'Jun', value: 55000 },
    ];

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-emerald-600 text-white p-3 rounded-xl shadow-lg shadow-emerald-200 dark:shadow-emerald-900/40">
                        <CreditCard size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">Gestão Valorem</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Controle financeiro e análise de fluxo de caixa</p>
                    </div>
                </div>
                <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                    <Plus size={18} /> Novo Lançamento
                </button>
            </div>

            <div className="space-y-8">
                {/* Top Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: 'Receita Líquida', value: 'R$ 142.500', sub: '+12% vs mês ant.', icon: TrendingUp, color: 'text-emerald-500', bg: 'bg-emerald-50', dbg: 'dark:bg-emerald-900/20' },
                        { label: 'Custo Operacional', value: 'R$ 38.200', sub: '-3% vs mês ant.', icon: TrendingDown, color: 'text-rose-500', bg: 'bg-rose-50', dbg: 'dark:bg-rose-900/20' },
                        { label: 'A Receber', value: 'R$ 215.000', sub: 'Próximos 60 dias', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50', dbg: 'dark:bg-amber-900/20' },
                        { label: 'Honorários Pagos', value: '85%', sub: 'Taxa de adimplência', icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-50', dbg: 'dark:bg-indigo-900/20' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between transition-colors">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.dbg} ${stat.color}`}>
                                    <stat.icon size={24} />
                                </div>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{stat.label}</p>
                                <h4 className="text-2xl font-bold text-slate-800 dark:text-white">{stat.value}</h4>
                                <p className={`text-xs mt-1 font-semibold ${stat.color}`}>{stat.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Chart */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                        <div className="flex items-center justify-between mb-8">
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg flex items-center gap-2">
                                <PieChart size={20} className="text-indigo-500" /> Fluxo de Caixa (Mensal)
                            </h3>
                            <select className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs px-3 py-1.5 focus:outline-none dark:text-white font-medium">
                                <option>Últimos 6 meses</option>
                                <option>Este ano</option>
                            </select>
                        </div>
                        <div className="h-72 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.3} />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} dy={10} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', backgroundColor: '#1e293b', color: '#f8fafc', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }} />
                                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                                        {data.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={index === data.length - 2 ? '#4f46e5' : '#334155'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Recent Transactions */}
                    <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-6">Últimos Lançamentos</h3>
                        <div className="space-y-6 flex-1">
                            {[
                                { title: 'Honorário - Proc. 1234', date: 'Hoje, 14:20', val: '+ R$ 5.200', type: 'up' },
                                { title: 'Custas de Protocolo', date: 'Ontem', val: '- R$ 120', type: 'down' },
                                { title: 'Aluguel Escritório', date: '25 Out', val: '- R$ 4.500', type: 'down' },
                                { title: 'Acordo Liquidado', date: '24 Out', val: '+ R$ 12.800', type: 'up' },
                            ].map((t, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'up' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400'}`}>
                                            {t.type === 'up' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">{t.title}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t.date}</p>
                                        </div>
                                    </div>
                                    <p className={`text-sm font-bold ${t.type === 'up' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>{t.val}</p>
                                </div>
                            ))}
                        </div>
                        <button className="w-full mt-8 py-3 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                            Ver Todos os Lançamentos
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Valorem;
