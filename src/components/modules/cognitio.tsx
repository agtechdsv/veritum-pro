
import React, { useState, useEffect } from 'react';
import { Credentials, KnowledgeArticle, HistoricalOutcome, TeamMember, Lawsuit } from '@/types';
import { GeminiService } from '@/services/gemini';
import {
    Brain, Search, Info, CheckCircle, AlertTriangle, BookOpen,
    Sparkles, TrendingUp, Filter, History, ChevronRight,
    BarChart3, PieChart as PieChartIcon, Layout, Scale, Gavel,
    Tag, User, Calendar, Plus, Save, Trash2, ExternalLink, XCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { createClient } from '@supabase/supabase-js';
import IntelligenceWidget from '../shared/intelligence-widget';

const Cognitio: React.FC<{ credentials: Credentials; permissions: any }> = ({ credentials, permissions }) => {
    // Data State
    const [articles, setArticles] = useState<KnowledgeArticle[]>([]);
    const [outcomes, setOutcomes] = useState<HistoricalOutcome[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [loading, setLoading] = useState(true);

    // AI Prediction State
    const [predictInput, setPredictInput] = useState('');
    const [isPredicting, setIsPredicting] = useState(false);
    const [prediction, setPrediction] = useState<{ score: string; text: string } | null>(null);

    // Library State
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Todos');
    const [isArticleModalOpen, setIsArticleModalOpen] = useState(false);
    const [editingArticle, setEditingArticle] = useState<Partial<KnowledgeArticle> | null>(null);

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);
    const gemini = new GeminiService(credentials.geminiKey);

    useEffect(() => {
        fetchData();
        checkInitialContent();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [artRes, outRes, teamRes, lawRes] = await Promise.all([
                supabase.from('knowledge_articles').select('*').order('created_at', { ascending: false }),
                supabase.from('historical_outcomes').select('*'),
                supabase.from('team_members').select('*').eq('is_active', true),
                supabase.from('lawsuits').select('*')
            ]);
            setArticles(artRes.data || []);
            setOutcomes(outRes.data || []);
            setTeam(teamRes.data || []);
            setLawsuits(lawRes.data || []);
        } catch (err) {
            console.error('Error fetching Cognitio data:', err);
        } finally {
            setLoading(false);
        }
    };

    const checkInitialContent = async () => {
        const { count } = await supabase.from('knowledge_articles').select('*', { count: 'exact', head: true });
        if (count === 0) {
            await supabase.from('knowledge_articles').insert([
                { title: 'Tese: Majoração de Dano Moral em Atraso de Vôo', content: 'A jurisprudência atual do STJ tem consolidado o entendimento de que...', category: 'Direito Civil', tags: ['STJ', 'Consumidor'] },
                { title: 'Inversão do Ônus da Prova (CDC)', content: 'Para a inversão do ônus da prova, é necessária a verossimilhança das alegações...', category: 'Direito do Consumidor', tags: ['Processual', 'CDC'] }
            ]);

            await supabase.from('historical_outcomes').insert([
                { judge_name: 'Dr. Roberto Souza', court: '1ª Vara Cível', case_type: 'Trabalhista', outcome: 'Procedente' },
                { judge_name: 'Dr. Roberto Souza', court: '1ª Vara Cível', case_type: 'Trabalhista', outcome: 'Procedente' },
                { judge_name: 'Dr. Roberto Souza', court: '1ª Vara Cível', case_type: 'Trabalhista', outcome: 'Improcedente' },
                { judge_name: 'Dra. Maria Helena', court: '3ª Vara Cível', case_type: 'Cível', outcome: 'Parcialmente Procedente' }
            ]);
            fetchData();
        }
    };

    const handlePredict = async () => {
        if (!predictInput) return;
        setIsPredicting(true);
        try {
            const res = await gemini.predictOutcome(predictInput);
            // AI returns percent and text. We split for better UI
            const scoreMatch = res.match(/(\d+)%/);
            const score = scoreMatch ? scoreMatch[1] + '%' : '75%';
            const text = res.replace(/(\d+)%/, '').trim();
            setPrediction({ score, text });
        } catch (err) {
            console.error('Prediction failed:', err);
        } finally {
            setIsPredicting(false);
        }
    };

    const handleSaveArticle = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingArticle?.id) {
                await supabase.from('knowledge_articles').update(editingArticle).eq('id', editingArticle.id);
            } else {
                await supabase.from('knowledge_articles').insert([editingArticle]);
            }
            setIsArticleModalOpen(false);
            setEditingArticle(null);
            fetchData();
        } catch (err) {
            console.error('Error saving article:', err);
        }
    };

    // Analytics Data
    const outcomeStats = [
        { name: 'Procedente', value: outcomes.filter(o => o.outcome === 'Procedente').length || 10 },
        { name: 'Parcial', value: outcomes.filter(o => o.outcome === 'Parcialmente Procedente').length || 15 },
        { name: 'Improcedente', value: outcomes.filter(o => o.outcome === 'Improcedente').length || 5 },
    ];
    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    const filteredArticles = articles.filter(a =>
        (a.title.toLowerCase().includes(searchTerm.toLowerCase()) || a.category?.toLowerCase().includes(searchTerm.toLowerCase())) &&
        (selectedCategory === 'Todos' || a.category === selectedCategory)
    );

    const categories = ['Todos', ...Array.from(new Set(articles.map(a => a.category).filter(Boolean)))];

    return (
        <div className="flex flex-col h-full space-y-6 high-density">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                        <Brain size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">COGNITIO PRO</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Inteligência Jurídica & Base de Conhecimento</p>
                    </div>
                </div>
                <button
                    onClick={() => { setEditingArticle({}); setIsArticleModalOpen(true); }}
                    className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                >
                    <Plus size={18} /> Nova Tese / Artigo
                </button>
            </div>

            {/* 💎 GOLDEN ALERTS (F-PATTERN) */}
            <IntelligenceWidget credentials={credentials} moduleContext="Inteligência / Cognitio" limit={3} />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-180px)]">
                {/* Left Side: Prediction Engine */}
                <div className="lg:col-span-2 flex flex-col gap-6 overflow-hidden">
                    {/* Predictive AI Hero */}
                    <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Sparkles size={18} className="text-indigo-400" />
                                <h3 className="text-xs font-black uppercase tracking-widest opacity-80">Motor de Análise Preditiva</h3>
                            </div>
                            <h2 className="text-2xl font-black leading-tight">Antecipe o desfecho do processo com precisão.</h2>
                            <div className="flex gap-3 pt-2">
                                <textarea
                                    value={predictInput}
                                    onChange={e => setPredictInput(e.target.value)}
                                    placeholder="Ex: Vara Cível de Curitiba, Magistrado Roberto Souza, Ação de Alimentos..."
                                    className="flex-1 bg-white/10 border border-white/10 rounded-2xl p-4 text-[11px] font-bold focus:ring-2 focus:ring-indigo-500 outline-none text-white placeholder:text-indigo-300 resize-none h-24"
                                />
                            </div>
                            <button
                                onClick={handlePredict}
                                disabled={isPredicting || !predictInput}
                                className="w-full bg-white text-slate-900 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isPredicting ? <div className="w-5 h-5 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin" /> : <Gavel size={18} />}
                                Gerar Predição IA
                            </button>
                        </div>
                        <div className="absolute top-[-20px] right-[-20px] p-24 bg-indigo-500/20 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-1000" />
                    </div>

                    {/* Result and Charts */}
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-hidden">
                        {/* Prediction Result */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <CheckCircle size={14} className="text-emerald-500" /> Resultado Estimado
                            </h3>
                            {prediction ? (
                                <div className="flex-1 flex flex-col justify-center gap-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-indigo-600 dark:text-indigo-400">{prediction.score}</span>
                                        <span className="text-[10px] font-black text-slate-400 uppercase">de chance</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 leading-relaxed italic">
                                        "{prediction.text}"
                                    </p>
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40">
                                    <Info size={40} className="text-slate-300 mb-2" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-tight">Aguardando dados de entrada...</p>
                                </div>
                            )}
                        </div>

                        {/* Chart */}
                        <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-4">
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={14} className="text-rose-500" /> Histórico do Magistrado
                            </h3>
                            <div className="flex-1">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={outcomeStats}
                                            innerRadius={45}
                                            outerRadius={65}
                                            paddingAngle={8}
                                            dataKey="value"
                                        >
                                            {outcomeStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', fontSize: '10px' }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Side: Knowledge Library */}
                <div className="lg:col-span-2 flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <BookOpen size={16} className="text-indigo-500" /> Biblioteca de Teses & Jurisprudência
                            </h3>
                            <span className="text-[10px] font-black text-slate-400 uppercase">{articles.length} Itens</span>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 relative">
                                <Search size={14} className="absolute left-4 top-3.5 text-slate-400" />
                                <input
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    placeholder="Buscar por termo ou palavras-chave..."
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[11px] font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <select
                                value={selectedCategory}
                                onChange={e => setSelectedCategory(e.target.value)}
                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-4 text-[10px] font-black uppercase tracking-tight text-slate-500 outline-none"
                            >
                                {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                        {filteredArticles.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 opacity-50">
                                <Search size={48} className="mb-4" />
                                <p className="text-sm font-black uppercase tracking-widest">Nenhuma tese encontrada</p>
                            </div>
                        ) : filteredArticles.map(art => (
                            <div
                                key={art.id}
                                className="group p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900 transition-all hover:shadow-xl hover:shadow-indigo-500/5 bg-slate-50/30 dark:bg-slate-800/20"
                            >
                                <div className="flex items-start justify-between mb-3">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">{art.category || 'Geral'}</p>
                                        <h4 className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors">{art.title}</h4>
                                    </div>
                                    <div className="flex gap-1">
                                        {art.tags?.slice(0, 2).map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-[8px] font-black text-slate-500 dark:text-slate-300 rounded uppercase tracking-tighter">#{tag}</span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium line-clamp-2 leading-relaxed mb-4">
                                    {art.content}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-400">
                                        <User size={12} /> Equipe Veritum
                                        <span className="opacity-30">•</span>
                                        <Calendar size={12} /> {new Date(art.created_at || '').toLocaleDateString('pt-BR')}
                                    </div>
                                    <button
                                        onClick={() => { setEditingArticle(art); setIsArticleModalOpen(true); }}
                                        className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-1 hover:gap-2 transition-all"
                                    >
                                        Ler Completo <ChevronRight size={14} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Modal de Artigo/Tese */}
            {isArticleModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300 h-5/6 flex flex-col">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Gestão de Conhecimento</h3>
                                <p className="text-xs text-slate-500 font-medium">Cadastre novas teses, jurisprudências e notas de estudo.</p>
                            </div>
                            <button onClick={() => setIsArticleModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveArticle} className="p-8 flex-1 flex flex-col gap-6 overflow-y-auto">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Título da Tese / Artigo</label>
                                    <input
                                        required
                                        value={editingArticle?.title || ''}
                                        onChange={e => setEditingArticle({ ...editingArticle, title: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-bold"
                                        placeholder="Título claro e objetivo..."
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Categoria Jurídica</label>
                                        <input
                                            value={editingArticle?.category || ''}
                                            onChange={e => setEditingArticle({ ...editingArticle, category: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-bold"
                                            placeholder="Ex: Direito Civil"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Tags (separadas por vírgula)</label>
                                        <input
                                            value={editingArticle?.tags?.join(', ') || ''}
                                            onChange={e => setEditingArticle({ ...editingArticle, tags: e.target.value.split(',').map(t => t.trim()) })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-bold uppercase tracking-widest text-[10px]"
                                            placeholder="STF, Recurso, Civil..."
                                        />
                                    </div>
                                </div>

                                <div className="flex-1 min-h-[200px] flex flex-col">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Conteúdo Jurídico</label>
                                    <textarea
                                        required
                                        value={editingArticle?.content || ''}
                                        onChange={e => setEditingArticle({ ...editingArticle, content: e.target.value })}
                                        className="flex-1 w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all dark:text-white font-medium text-xs leading-relaxed resize-none"
                                        placeholder="Desenvolva o raciocínio jurídico aqui..."
                                    />
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsArticleModalOpen(false)} className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">Descartar</button>
                                <button type="submit" className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
                                    <Save size={20} /> Salvar Conhecimento
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Cognitio;
