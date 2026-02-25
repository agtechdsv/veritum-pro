import React, { useState, useEffect } from 'react';
import { Credentials, Lawsuit, Task, TeamMember, Person } from '@/types';
import { Plus, MoreHorizontal, Calendar, Scale, Search, Filter, ArrowRight, AlertTriangle, CheckCircle2, Clock, MapPin, Shield, User, Users, Save, XCircle, Pencil, ChevronRight, Zap } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import IntelligenceWidget from '../shared/intelligence-widget';
import { useTranslation } from '@/contexts/language-context';

const Nexus: React.FC<{ credentials: Credentials; permissions: any }> = ({ credentials, permissions }) => {
    const { t } = useTranslation();
    const [view, setView] = useState<'kanban' | 'list'>('kanban');
    const [lawsuits, setLawsuits] = useState<Lawsuit[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [team, setTeam] = useState<TeamMember[]>([]);
    const [persons, setPersons] = useState<Person[]>([]);
    const [loading, setLoading] = useState(true);

    // UI State
    const [isLawsuitModalOpen, setIsLawsuitModalOpen] = useState(false);
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingLawsuit, setEditingLawsuit] = useState<Partial<Lawsuit> | null>(null);
    const [editingTask, setEditingTask] = useState<Partial<Task> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedLawsuitFields, setExpandedLawsuitFields] = useState(true);

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

    useEffect(() => {
        fetchAll();
    }, []);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const [lawData, taskData, teamData, personData] = await Promise.all([
                supabase.from('lawsuits').select('*').is('deleted_at', null).limit(50),
                supabase.from('tasks').select('*').is('deleted_at', null).limit(100),
                supabase.from('team_members').select('*').is('deleted_at', null),
                supabase.from('persons').select('*').is('deleted_at', null)
            ]);
            setLawsuits(lawData.data || []);
            setTasks(taskData.data || []);
            setTeam(teamData.data || []);
            setPersons(personData.data || []);
        } catch (err) {
            console.error('Error loading Nexus data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLawsuit = async (e: React.FormEvent) => {
        e.preventDefault();

        // CNJ Strict Validation (Golden Rule: Data Integrity)
        const cnjRegex = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/;
        if (editingLawsuit?.cnj_number && !cnjRegex.test(editingLawsuit.cnj_number)) {
            alert(t('modules.nexus.modals.lawsuit.validation.cnj'));
            return;
        }

        try {
            if (editingLawsuit?.id) {
                const { error } = await supabase.from('lawsuits').update(editingLawsuit).eq('id', editingLawsuit.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('lawsuits').insert([editingLawsuit]);
                if (error) throw error;
            }
            setIsLawsuitModalOpen(false);
            setEditingLawsuit(null);
            setExpandedLawsuitFields(false);
            fetchAll();
        } catch (err) {
            console.error('Error saving lawsuit:', err);
        }
    };

    const handleSaveTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingTask?.id) {
                const { error } = await supabase.from('tasks').update(editingTask).eq('id', editingTask.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('tasks').insert([editingTask]);
                if (error) throw error;
            }
            setIsTaskModalOpen(false);
            setEditingTask(null);
            fetchAll();
        } catch (err) {
            console.error('Error saving task:', err);
        }
    };

    const handleSoftDeleteLawsuit = async (id: string) => {
        if (!window.confirm(t('modules.nexus.kanban.deleteConfirm'))) return;
        try {
            await supabase.from('lawsuits').update({ deleted_at: new Date().toISOString() }).eq('id', id);
            fetchAll();
        } catch (err) {
            console.error('Error deleting lawsuit:', err);
        }
    };

    const columns = ['A Fazer', 'Em Andamento', 'Concluído', 'Atrasado'];

    const getColumnTranslation = (col: string) => {
        switch (col) {
            case 'A Fazer': return t('modules.nexus.kanban.todo');
            case 'Em Andamento': return t('modules.nexus.kanban.doing');
            case 'Concluído': return t('modules.nexus.kanban.done');
            case 'Atrasado': return t('modules.nexus.kanban.late');
            default: return col;
        }
    };

    const getPriorityTranslation = (priority: string) => {
        switch (priority) {
            case 'Baixa': return t('modules.nexus.modals.task.priorities.Low');
            case 'Média': return t('modules.nexus.modals.task.priorities.Medium');
            case 'Alta': return t('modules.nexus.modals.task.priorities.High');
            case 'Urgente': return t('modules.nexus.modals.task.priorities.Urgent');
            default: return priority;
        }
    };

    const getSeverityColor = (dueDate: string, status: string) => {
        if (status === 'Concluído') return 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600';
        const now = new Date();
        const due = new Date(dueDate);
        const diffHours = (due.getTime() - now.getTime()) / (1000 * 60 * 60);

        if (diffHours < 0) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'; // Late
        if (diffHours < 24) return 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 border-rose-100'; // Urgent
        if (diffHours < 48) return 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-100'; // Attention
        return 'bg-slate-50 dark:bg-slate-800 text-slate-500 border-slate-200'; // Normal
    };

    return (
        <div className="flex flex-col h-full space-y-6 high-density">
            {/* Top Bar / Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 text-white p-3 rounded-xl shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40">
                        <Scale size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800 dark:text-white transition-colors text-gradient">NEXUS PRO</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{t('modules.nexus.subtitle')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setView('kanban')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'kanban' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {t('modules.nexus.views.kanban')}
                        </button>
                        <button
                            onClick={() => setView('list')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${view === 'list' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {t('modules.nexus.views.list')}
                        </button>
                    </div>
                    <button
                        onClick={() => { setEditingTask({ status: 'A Fazer' }); setIsTaskModalOpen(true); }}
                        className="bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95 border border-slate-700"
                    >
                        <Plus size={18} /> {t('modules.nexus.newTask')}
                    </button>
                    <button
                        onClick={() => { setEditingLawsuit({ status: 'Ativo' }); setIsLawsuitModalOpen(true); }}
                        className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                    >
                        <Plus size={18} /> {t('modules.nexus.newLawsuit')}
                    </button>
                </div>
            </div>

            {/* 💎 GOLDEN ALERTS (F-PATTERN) */}
            <IntelligenceWidget credentials={credentials} moduleContext="Operacional / Nexus" limit={3} />

            {/* KPIs Top Area */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.metrics.active')}</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{lawsuits.filter(l => l.status === 'Ativo').length}</p>
                    </div>
                    <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg"><Scale size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest">{t('modules.nexus.metrics.deadlines')}</p>
                        <p className="text-2xl font-black text-rose-600">{tasks.filter(t => t.status !== 'Concluído' && (new Date(t.due_date).getTime() - new Date().getTime()) < 86400000).length}</p>
                    </div>
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg"><Clock size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.metrics.pending')}</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{tasks.filter(t => t.status !== 'Concluído').length}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg"><CheckCircle2 size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('modules.nexus.metrics.completion')}</p>
                        <p className="text-2xl font-black text-emerald-600">
                            {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'Concluído').length / tasks.length) * 100) : 0}%
                        </p>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
                </div>
            </div>

            {/* Main Content: Kanban Board */}
            <div className="flex-1 flex gap-6 overflow-x-auto pb-4 no-scrollbar">
                {columns.map((column) => (
                    <div key={column} className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-3xl p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4">
                        <div className="flex items-center justify-between px-2">
                            <h3 className="font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${column === 'Atrasado' ? 'bg-rose-500' :
                                    column === 'Concluído' ? 'bg-emerald-500' : 'bg-slate-400'
                                    }`} />
                                {getColumnTranslation(column)}
                                <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                    {tasks.filter(t => t.status === column).length}
                                </span>
                            </h3>
                            <button className="text-slate-400 hover:text-slate-600"><Plus size={16} /></button>
                        </div>

                        <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
                            {loading ? (
                                <div className="py-8 text-center text-slate-400 text-xs font-bold animate-pulse">{t('modules.nexus.kanban.loading')}</div>
                            ) : tasks.filter(t => t.status === column).map((task) => {
                                const law = lawsuits.find(l => l.id === task.lawsuit_id);
                                const resp = team.find(t_ => t_.id === task.responsible_id);
                                return (
                                    <div key={task.id} className="bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing group">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md border ${getSeverityColor(task.due_date, task.status)}`}>
                                                {getPriorityTranslation(task.priority || 'Média')}
                                            </span>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button className="p-1 text-slate-400 hover:text-indigo-600"><Pencil size={12} /></button>
                                            </div>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-2">{task.title}</h4>
                                        {law && <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-3 flex items-center gap-1"><Scale size={10} /> {law.cnj_number}</p>}

                                        <div className="flex items-center justify-between mt-auto pt-3 border-t border-slate-50 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-200 dark:border-slate-700" title={resp?.full_name}>
                                                    {resp?.full_name?.charAt(0) || <User size={10} />}
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400">{resp?.full_name?.split(' ')[0]}</span>
                                            </div>
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <Calendar size={10} />
                                                <span className="text-[10px] font-bold">{new Date(task.due_date).toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'short' })}</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Lawsuit Modal (Case Use 3) */}
            {isLawsuitModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.lawsuit.title')}</h3>
                                <p className="text-xs text-slate-500 font-medium">{t('modules.nexus.modals.lawsuit.subtitle')}</p>
                            </div>
                            <button onClick={() => setIsLawsuitModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveLawsuit} className="p-8 space-y-6 overflow-y-auto no-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.lawsuit.labelCnj')}</label>
                                    <input
                                        required
                                        value={editingLawsuit?.cnj_number || ''}
                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, cnj_number: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-mono font-bold text-lg"
                                        placeholder={t('modules.nexus.modals.lawsuit.placeholderCnj')}
                                    />
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.lawsuit.labelTitle')}</label>
                                    <input
                                        value={editingLawsuit?.case_title || ''}
                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, case_title: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                                        placeholder={t('modules.nexus.modals.lawsuit.placeholderTitle')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.lawsuit.labelAuthor')}</label>
                                    <select
                                        required
                                        value={editingLawsuit?.author_id || ''}
                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, author_id: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                    >
                                        <option value="">{t('modules.nexus.modals.lawsuit.selectCrm')}</option>
                                        {persons.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.lawsuit.labelDefendant')}</label>
                                    <select
                                        required
                                        value={editingLawsuit?.defendant_id || ''}
                                        onChange={e => setEditingLawsuit({ ...editingLawsuit, defendant_id: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                    >
                                        <option value="">{t('modules.nexus.modals.lawsuit.selectCrm')}</option>
                                        {persons.map(p => <option key={p.id} value={p.id}>{p.full_name}</option>)}
                                    </select>
                                </div>

                                <div className="md:col-span-2">
                                    <button
                                        type="button"
                                        onClick={() => setExpandedLawsuitFields(!expandedLawsuitFields)}
                                        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-700 transition-all"
                                    >
                                        {expandedLawsuitFields ? t('modules.nexus.modals.lawsuit.advancedHide') : t('modules.nexus.modals.lawsuit.advancedShow')}
                                        <ChevronRight size={14} className={`transition-transform ${expandedLawsuitFields ? 'rotate-90' : ''}`} />
                                    </button>
                                </div>

                                {expandedLawsuitFields && (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.lawsuit.labelLawyer')}</label>
                                            <select
                                                required
                                                value={editingLawsuit?.responsible_lawyer_id || ''}
                                                onChange={e => setEditingLawsuit({ ...editingLawsuit, responsible_lawyer_id: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                            >
                                                <option value="">{t('modules.nexus.modals.lawsuit.selectTeam')}</option>
                                                {team.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.lawsuit.labelSphere')}</label>
                                                <input
                                                    value={editingLawsuit?.sphere || ''}
                                                    onChange={e => setEditingLawsuit({ ...editingLawsuit, sphere: e.target.value })}
                                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    placeholder={t('modules.nexus.modals.lawsuit.placeholderSphere')}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{t('modules.nexus.modals.lawsuit.labelValue')}</label>
                                                <input
                                                    type="number"
                                                    value={editingLawsuit?.value || ''}
                                                    onChange={e => setEditingLawsuit({ ...editingLawsuit, value: Number(e.target.value) })}
                                                    className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold"
                                                    placeholder={t('modules.nexus.modals.lawsuit.placeholderValue')}
                                                />
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="pt-8 flex gap-4">
                                <button type="button" onClick={() => setIsLawsuitModalOpen(false)} className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all">{t('modules.nexus.modals.lawsuit.cancel')}</button>
                                <button type="submit" className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2">
                                    <Save size={20} /> {t('modules.nexus.modals.lawsuit.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Task Modal (The "Vínculo" Rule) */}
            {isTaskModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                        <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/50">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.modals.task.title')}</h3>
                                <p className="text-xs text-slate-500 font-medium">{t('modules.nexus.modals.task.subtitle')}</p>
                            </div>
                            <button onClick={() => setIsTaskModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveTask} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('modules.nexus.modals.task.labelTitle')}</label>
                                    <input
                                        required
                                        value={editingTask?.title || ''}
                                        onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                        placeholder={t('modules.nexus.modals.task.placeholderTitle')}
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('modules.nexus.modals.task.labelLawsuit')}</label>
                                    <select
                                        required
                                        value={editingTask?.lawsuit_id || ''}
                                        onChange={e => setEditingTask({ ...editingTask, lawsuit_id: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold text-xs"
                                    >
                                        <option value="">{t('modules.nexus.modals.task.selectLawsuit')}</option>
                                        {lawsuits.map(law => <option key={law.id} value={law.id}>{law.cnj_number} - {law.case_title}</option>)}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('modules.nexus.modals.task.labelResponsible')}</label>
                                    <select
                                        required
                                        value={editingTask?.responsible_id || ''}
                                        onChange={e => setEditingTask({ ...editingTask, responsible_id: e.target.value })}
                                        className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold text-xs"
                                    >
                                        <option value="">{t('modules.nexus.modals.task.selectTeam')}</option>
                                        {team.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('modules.nexus.modals.task.labelDueDate')}</label>
                                        <input
                                            required
                                            type="datetime-local"
                                            value={editingTask?.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ''}
                                            onChange={e => setEditingTask({ ...editingTask, due_date: new Date(e.target.value).toISOString() })}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-xs dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">{t('modules.nexus.modals.task.labelPriority')}</label>
                                        <select
                                            value={editingTask?.priority || 'Média'}
                                            onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as any })}
                                            className="w-full px-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-600 font-bold text-xs"
                                        >
                                            <option value="Baixa">{t('modules.nexus.modals.task.priorities.Low')}</option>
                                            <option value="Média">{t('modules.nexus.modals.task.priorities.Medium')}</option>
                                            <option value="Alta">{t('modules.nexus.modals.task.priorities.High')}</option>
                                            <option value="Urgente">{t('modules.nexus.modals.task.priorities.Urgent')}</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">{t('modules.nexus.modals.task.cancel')}</button>
                                <button type="submit" className="flex-[2] px-8 py-4 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-black shadow-xl transition-all flex items-center justify-center gap-2 text-xs">
                                    <Plus size={16} /> {t('modules.nexus.modals.task.save')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for KPI area
const TrendingUp = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>
);

export default Nexus;
