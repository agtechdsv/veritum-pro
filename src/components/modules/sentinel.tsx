
import React, { useState } from 'react';
import { Credentials } from '@/types';
import { GeminiService } from '@/services/gemini';
import { Search, Plus, AlertCircle, TrendingUp, TrendingDown, Minus, Shield } from 'lucide-react';

const Sentinel: React.FC<{ credentials: Credentials }> = ({ credentials }) => {
    const [searchTerm, setSearchTerm] = useState('');

    // Static mock data from source
    const mockClippings = [
        { id: '1', company: 'Tech Corp', source: 'Portal Jurídico', content: 'Processo movido contra Tech Corp por violação de patentes.', sentiment: 'negativo', score: 0.85, date: '2023-10-25' },
        { id: '2', company: 'Global Logistics', source: 'Diário Oficial', content: 'Nova sentença favorável à Global Logistics em recurso trabalhista.', sentiment: 'positivo', score: 0.92, date: '2023-10-24' },
        { id: '3', company: 'Foodie SA', source: 'Gazeta Local', content: 'Acordo firmado entre Foodie SA e sindicato dos trabalhadores.', sentiment: 'neutro', score: 0.5, date: '2023-10-23' },
    ];

    return (
        <div className="flex flex-col h-full space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-rose-600 text-white p-3 rounded-xl shadow-lg shadow-rose-200 dark:shadow-rose-900/40">
                        <Shield size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">Monitoramento Sentinel</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Análise de clippings e monitoramento de reputação IA</p>
                    </div>
                </div>
                <button className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 px-6 py-2.5 rounded-xl font-semibold flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm">
                    <Plus size={18} /> Novo Alerta
                </button>
            </div>

            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors">
                        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 rounded-xl flex items-center justify-center">
                            <AlertCircle size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Alertas de Crise</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">12</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors">
                        <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 rounded-xl flex items-center justify-center">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Sentimento Positivo</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">64%</p>
                        </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-4 transition-colors">
                        <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl flex items-center justify-center">
                            <Search size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Termos Monitorados</p>
                            <p className="text-2xl font-bold text-slate-900 dark:text-white">158</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 items-center justify-between">
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white">Clipping Inteligente</h3>
                        <div className="flex gap-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                                <input
                                    placeholder="Pesquisar resultados..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:text-white"
                                />
                            </div>
                            <button className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20">
                                <Plus size={16} /> Novo Alerta
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">
                                    <th className="px-6 py-4">Data</th>
                                    <th className="px-6 py-4">Empresa / Termo</th>
                                    <th className="px-6 py-4">Fonte</th>
                                    <th className="px-6 py-4">Snippet do Conteúdo</th>
                                    <th className="px-6 py-4">Sentimento IA</th>
                                    <th className="px-6 py-4">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {mockClippings.map((clipping) => (
                                    <tr key={clipping.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400 whitespace-nowrap">{clipping.date}</td>
                                        <td className="px-6 py-4 font-medium text-slate-800 dark:text-slate-100">{clipping.company}</td>
                                        <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-400">{clipping.source}</td>
                                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300 max-w-md truncate">{clipping.content}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${clipping.sentiment === 'positivo' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' :
                                                clipping.sentiment === 'negativo' ? 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400' :
                                                    'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                                }`}>
                                                {clipping.sentiment === 'positivo' && <TrendingUp size={12} />}
                                                {clipping.sentiment === 'negativo' && <TrendingDown size={12} />}
                                                {clipping.sentiment === 'neutro' && <Minus size={12} />}
                                                {clipping.sentiment.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 text-sm font-semibold">Ver Detalhes</button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Sentinel;
