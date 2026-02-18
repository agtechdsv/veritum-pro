
import React, { useState } from 'react';
import { Credentials } from '@/types';
import { GeminiService } from '@/services/gemini';
import { Wand2, Save, FileText, Download, Wand, ChevronDown } from 'lucide-react';

const Scriptor: React.FC<{ credentials: Credentials }> = ({ credentials }) => {
    const [content, setContent] = useState('');
    const [prompt, setPrompt] = useState('');
    const [loading, setLoading] = useState(false);
    const gemini = new GeminiService(credentials.geminiKey);

    const handleAIAssist = async () => {
        if (!prompt) return;
        setLoading(true);
        try {
            const result = await gemini.generateDraft(prompt);
            setContent(prev => prev + '\n\n' + result);
            setPrompt('');
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 h-full">
            {/* Sidebar Editor Tools */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                        <Wand2 size={18} className="text-amber-500" /> Scriptor IA
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">Diga à IA o que você deseja redigir (Petição, Cláusula, Parecer...)</p>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Elabore uma cláusula de confidencialidade com multa de 10x..."
                        className="w-full h-32 p-3 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 dark:text-white resize-none"
                    />
                    <button
                        onClick={handleAIAssist}
                        disabled={loading}
                        className="w-full mt-4 bg-amber-500 text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-amber-600 transition-colors disabled:opacity-50 shadow-lg shadow-amber-500/20"
                    >
                        {loading ? 'Processando...' : <><Wand size={16} /> Gerar Minuta</>}
                    </button>
                </div>

                <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <h3 className="font-bold text-slate-800 dark:text-white mb-4">Peças Salvas</h3>
                    <div className="space-y-3">
                        {['Contestação - Alimentos.docx', 'Parecer - Tributário.pdf', 'Contrato - Prestação.docx'].map((file) => (
                            <div key={file} className="flex items-center gap-3 p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg cursor-pointer group transition-colors">
                                <FileText size={16} className="text-slate-400 group-hover:text-indigo-500" />
                                <span className="text-sm text-slate-600 dark:text-slate-300 truncate font-medium">{file}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Rich Editor Area */}
            <div className="lg:col-span-3 flex flex-col h-full space-y-4">
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm flex-1 flex flex-col overflow-hidden transition-colors">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                        <div className="flex items-center gap-1">
                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 font-extrabold">B</button>
                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 italic font-serif">I</button>
                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 underline underline-offset-4">U</button>
                            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1" />
                            <button className="p-2 hover:bg-white dark:hover:bg-slate-700 rounded-md text-slate-600 dark:text-slate-300 flex items-center gap-1 text-sm font-bold">Normal <ChevronDown size={14} /></button>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 rounded-xl text-sm font-bold transition-colors">
                                <Save size={16} /> Salvar
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition-all">
                                <Download size={16} /> Exportar
                            </button>
                        </div>
                    </div>
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        className="flex-1 p-10 focus:outline-none text-slate-800 dark:text-slate-200 bg-transparent leading-relaxed font-serif text-lg resize-none scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800"
                        placeholder="Comece a redigir seu documento aqui..."
                    />
                </div>
                <div className="flex justify-between items-center text-xs text-slate-400 dark:text-slate-500 px-2 font-medium">
                    <span>{content.length} caracteres | {content.split(/\s+/).filter(x => x).length} palavras</span>
                    <span className="flex items-center gap-1.5"><div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" /> Sincronizado com Supabase Storage</span>
                </div>
            </div>
        </div>
    );
};

export default Scriptor;
