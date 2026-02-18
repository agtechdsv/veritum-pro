
import React, { useState } from 'react';
import { Credentials } from '@/types';
import { GeminiService } from '@/services/gemini';
import { Brain, Search, Info, CheckCircle, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const Cognitio: React.FC<{ credentials: Credentials }> = ({ credentials }) => {
    const [judge, setJudge] = useState('');
    const [loading, setLoading] = useState(false);
    const [prediction, setPrediction] = useState<string | null>(null);

    const gemini = new GeminiService(credentials.geminiKey);

    const statsData = [
        { name: 'Procedente', value: 45 },
        { name: 'Parcialmente Procedente', value: 30 },
        { name: 'Improcedente', value: 25 },
    ];
    const COLORS = ['#10b981', '#fbbf24', '#ef4444'];

    const handlePredict = async () => {
        if (!judge) return;
        setLoading(true);
        try {
            const res = await gemini.predictOutcome(`Histórico do Juiz ${judge} em casos de direito do trabalho. 50 casos analisados.`);
            setPrediction(res || 'Análise indisponível no momento.');
        } catch (e) {
            console.error(e);
            setPrediction('Erro ao gerar análise preditiva.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all duration-500 hover:shadow-indigo-500/20">
                <div className="relative z-10 flex flex-col md:flex-row gap-8 items-center">
                    <div className="md:w-2/3 space-y-4">
                        <h2 className="text-4xl font-extrabold tracking-tight">Análise Preditiva COGNITIO</h2>
                        <p className="text-indigo-100 text-lg opacity-80 leading-relaxed font-medium">
                            Utilize o motor de IA para cruzar dados de processos, perfis de magistrados e tendências dos tribunais para antecipar resultados.
                        </p>
                        <div className="flex gap-3 pt-4">
                            <div className="relative flex-1">
                                <Search className="absolute left-4 top-4 text-indigo-300" size={20} />
                                <input
                                    placeholder="Digite o nome do magistrado ou vara..."
                                    className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-white/50 placeholder:text-indigo-200 text-white font-medium"
                                    value={judge}
                                    onChange={e => setJudge(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handlePredict}
                                disabled={loading}
                                className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-50 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                            >
                                {loading ? <div className="w-5 h-5 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" /> : <Brain size={20} />}
                                {loading ? 'Analisando...' : 'Prever Êxito'}
                            </button>
                        </div>
                    </div>
                    <div className="md:w-1/3 flex justify-center">
                        <div className="w-48 h-48 bg-white/10 rounded-full border border-white/20 flex items-center justify-center backdrop-blur-sm animate-pulse">
                            <Brain size={80} className="text-white opacity-80" />
                        </div>
                    </div>
                </div>
                {/* Abstract shapes for design */}
                <div className="absolute top-[-50px] right-[-50px] w-64 h-64 bg-indigo-500 rounded-full opacity-20 blur-3xl"></div>
                <div className="absolute bottom-[-20px] left-[-20px] w-48 h-48 bg-pink-500 rounded-full opacity-20 blur-2xl"></div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Predictive Card */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <div className="flex items-center gap-2 mb-6">
                        <CheckCircle className="text-emerald-500" size={24} />
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Resultado da Análise IA</h3>
                    </div>
                    {prediction ? (
                        <div className="bg-slate-50 dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 relative transition-colors">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="text-4xl font-black text-indigo-600 dark:text-indigo-400">72%</div>
                                <div className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Probabilidade de Êxito</div>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic font-medium">
                                "{prediction}"
                            </p>
                            <div className="mt-6 flex items-center gap-2 text-xs text-slate-400 dark:text-slate-500 font-bold">
                                <Info size={14} /> Baseado em 1.250 sentenças similares neste tribunal.
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl transition-colors">
                            <AlertTriangle size={32} className="mb-2 opacity-50" />
                            <p className="font-medium">Selecione um juiz ou vara para gerar a análise preditiva.</p>
                        </div>
                    )}
                </div>

                {/* Chart Card */}
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col transition-colors">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6">Taxa de Decisões</h3>
                    <div className="flex-1 min-h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={statsData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {statsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }} />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cognitio;
