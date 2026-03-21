import React from 'react';
import { motion } from 'framer-motion';
import { 
    Plus, Search, Scale, Clock, CheckCircle2, TrendingUp, 
    Network, Pencil, Calendar, Filter, XCircle, 
    User as UserIcon 
} from 'lucide-react';
import { Lawsuit, Task, TeamMember, Credentials } from '@/types';
import IntelligenceWidget from '../../../shared/intelligence-widget';

interface TasksTabProps {
    t: any;
    credentials: Credentials;
    lawsuits: Lawsuit[];
    filteredTasks: Task[];
    team: TeamMember[];
    loading: boolean;
    view: 'kanban' | 'list';
    setView: (v: 'kanban' | 'list') => void;
    filterSearchTerm: string;
    setFilterSearchTerm: (v: string) => void;
    filterResponsibleId: string;
    setFilterResponsibleId: (v: string) => void;
    filterLawsuitId: string;
    setFilterLawsuitId: (v: string) => void;
    setEditingTask: (v: Partial<Task> | null) => void;
    setIsTaskModalOpen: (v: boolean) => void;
    setActiveTaskTab: (v: 'basic' | 'advanced') => void;
    handleOpenNexoVisual: (type: 'task', data: any) => void;
    handleDropTask: (e: React.DragEvent, newStatus: string) => void;
    handleDragStartTask: (e: React.DragEvent, taskId: string) => void;
}

export const TasksTab = ({
    t,
    credentials,
    lawsuits,
    filteredTasks,
    team,
    loading,
    view,
    setView,
    filterSearchTerm,
    setFilterSearchTerm,
    filterResponsibleId,
    setFilterResponsibleId,
    filterLawsuitId,
    setFilterLawsuitId,
    setEditingTask,
    setIsTaskModalOpen,
    setActiveTaskTab,
    handleOpenNexoVisual,
    handleDropTask,
    handleDragStartTask
}: TasksTabProps) => {

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
            case 'Baixa':
            case 'Low': return t('modules.nexus.modals.task.priorities.Low');
            case 'Média':
            case 'Medium': return t('modules.nexus.modals.task.priorities.Medium');
            case 'Alta':
            case 'High': return t('modules.nexus.modals.task.priorities.High');
            case 'Urgente':
            case 'Urgent': return t('modules.nexus.modals.task.priorities.Urgent');
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

    const getTaskUrgencyInfo = (dueDate: string, status: string) => {
        if (status === 'Concluído') return { label: 'Concluído', color: 'emerald', days: 0, isToday: false };
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const due = new Date(dueDate);
        due.setHours(0, 0, 0, 0);

        const diffTime = due.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 0) return { label: 'Atrasado', color: 'rose', days: Math.abs(diffDays), isToday: false };
        if (diffDays === 0) return { label: 'Vence Hoje', color: 'rose', days: 0, isToday: true };
        if (diffDays === 1) return { label: 'Vence Amanhã', color: 'amber', days: 1, isToday: false };
        return { label: `Em ${diffDays} dias`, color: 'slate', days: diffDays, isToday: false };
    };

    const renderFilterBar = () => (
        <div className="flex gap-4 mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
            <div className="flex-1">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                        type="text"
                        placeholder={t('common.placeholders.search')}
                        value={filterSearchTerm}
                        onChange={e => setFilterSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                    />
                </div>
            </div>
            <div className="w-48">
                <select
                    value={filterResponsibleId}
                    onChange={e => setFilterResponsibleId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">👤 {t('common.filters.allMembers')}</option>
                    {team.map(t_ => <option key={t_.id} value={t_.id}>{t_.full_name}</option>)}
                </select>
            </div>
            <div className="w-64">
                <select
                    value={filterLawsuitId}
                    onChange={e => setFilterLawsuitId(e.target.value)}
                    className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white"
                >
                    <option value="">⚖️ {t('common.filters.allProcesses')}</option>
                    {lawsuits.map(law => <option key={law.id} value={law.id}>{law.cnj_number || law.case_title}</option>)}
                </select>
            </div>
            {(filterSearchTerm || filterResponsibleId || filterLawsuitId) && (
                <button
                    onClick={() => { setFilterSearchTerm(''); setFilterResponsibleId(''); setFilterLawsuitId(''); }}
                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all flex items-center gap-2 border border-transparent hover:border-rose-200 dark:hover:border-rose-800"
                    title={t('common.clearFilters')}
                >
                    <Filter size={16} className="relative z-10" />
                    <XCircle size={14} className="relative z-10 -ml-1" />
                </button>
            )}
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="px-8 pt-8">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-6">
                        <div>
                            <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.tabs.tasks')}</h1>
                            <p className="text-slate-500 font-bold">{t('modules.nexus.description')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setEditingTask({ status: 'A Fazer' }); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                className="bg-slate-800 text-white px-6 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                            >
                                <Plus size={14} /> {t('modules.nexus.newTask')}
                            </button>
                            <div className="flex w-72 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                                <button
                                    onClick={() => setView('kanban')}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'kanban' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    Kanban
                                </button>
                                <button
                                    onClick={() => setView('list')}
                                    className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${view === 'list' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                                >
                                    Lista
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
                <IntelligenceWidget credentials={credentials} moduleContext="Operacional / Nexus" limit={5} />
            </div>

            <div className="px-8 mt-4">
                {renderFilterBar()}
            </div>

            {/* KPIs Top Area */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 animate-in fade-in slide-in-from-top-4 duration-500">
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
                        <p className="text-2xl font-black text-rose-600">{filteredTasks.filter(t_ => t_.status !== 'Concluído' && (new Date(t_.due_date).getTime() - new Date().getTime()) < 86400000).length}</p>
                    </div>
                    <div className="p-2 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-lg"><Clock size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.metrics.pending')}</p>
                        <p className="text-2xl font-black text-slate-800 dark:text-white">{filteredTasks.filter(t_ => t_.status !== 'Concluído').length}</p>
                    </div>
                    <div className="p-2 bg-slate-50 dark:bg-slate-800 text-slate-400 rounded-lg"><CheckCircle2 size={20} /></div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('modules.nexus.metrics.completion')}</p>
                        <p className="text-2xl font-black text-emerald-600">
                            {filteredTasks.length > 0 ? Math.round((filteredTasks.filter(t_ => t_.status === 'Concluído').length / filteredTasks.length) * 100) : 0}%
                        </p>
                    </div>
                    <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-lg"><TrendingUp size={20} /></div>
                </div>
            </div>

            {/* Main Content */}
            {view === 'kanban' ? (
                <div className="flex-1 flex gap-6 overflow-x-auto p-8 pt-0 no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                    {columns.map((column) => (
                        <div
                            key={column}
                            className="flex-shrink-0 w-80 bg-slate-100/40 dark:bg-slate-950/40 rounded-[2rem] p-4 border border-slate-200 dark:border-slate-900 flex flex-col gap-4"
                            onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                            onDragLeave={(e) => { e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); }}
                            onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('bg-indigo-50/50', 'dark:bg-indigo-900/10', 'border-indigo-300', 'dark:border-indigo-800/50'); handleDropTask(e, column); }}
                        >
                            <div className="flex items-center justify-between px-2 mb-2">
                                <h3 className="font-black text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${column === 'Atrasado' ? 'bg-rose-500' :
                                        column === 'Concluído' ? 'bg-emerald-500' : 'bg-slate-400'
                                        }`} />
                                    {getColumnTranslation(column)}
                                    <span className="ml-2 px-2 py-0.5 bg-white dark:bg-slate-800 rounded-lg text-[10px] border border-slate-200 dark:border-slate-800 font-bold">
                                        {filteredTasks.filter(t_ => t_.status === column).length}
                                    </span>
                                </h3>
                            </div>

                            <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pb-6 rounded-xl">
                                {loading ? (
                                    <div className="py-8 text-center text-slate-400 text-xs font-bold animate-pulse">{t('modules.nexus.empty.syncing')}</div>
                                ) : filteredTasks.filter(t_ => t_.status === column).map((task) => {
                                    const law = lawsuits.find(l => l.id === task.lawsuit_id);
                                    const resp = team.find(t_ => t_.id === task.responsible_id);
                                    const urgency = getTaskUrgencyInfo(task.due_date, task.status);

                                    return (
                                        <motion.div
                                            key={task.id}
                                            draggable
                                            onDragStart={(e: any) => {
                                                handleDragStartTask(e, task.id);
                                                (e.currentTarget as any).classList.add('opacity-50');
                                            }}
                                            onDragEnd={(e) => {
                                                (e.currentTarget as any).classList.remove('opacity-50');
                                            }}
                                            animate={urgency.isToday ? { 
                                                borderColor: ["#ef4444", "#fda4af", "#ef4444"],
                                                boxShadow: ["0 0 0px rgba(239, 68, 68, 0)", "0 0 10px rgba(239, 68, 68, 0.3)", "0 0 0px rgba(239, 68, 68, 0)"]
                                            } : {}}
                                            transition={urgency.isToday ? { duration: 2, repeat: Infinity } : { duration: 0.2 }}
                                            className={`bg-white dark:bg-slate-900 p-5 rounded-2xl shadow-sm border ${urgency.isToday ? 'border-rose-500' : 'border-slate-200 dark:border-slate-800'} hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-700 transition-all cursor-grab active:cursor-grabbing group`}
                                            onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md border ${getSeverityColor(task.due_date, task.status)}`}>
                                                    {getPriorityTranslation(task.priority || 'Média')}
                                                </span>
                                                <div className="flex gap-1.5 transition-all">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('task', task); }}
                                                        className="p-1 px-1.5 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/40 rounded-lg hover:bg-indigo-100 hover:scale-110 active:scale-95 transition-all shadow-sm border border-indigo-100 dark:border-indigo-800/50"
                                                        title="Ver Mapa Mental (Nexo Visual)"
                                                    >
                                                        <Network size={12} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingTask(task); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                                        className="p-1 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded cursor-pointer"
                                                    >
                                                        <Pencil size={12} />
                                                    </button>
                                                </div>
                                            </div>
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-tight mb-3">{task.title}</h4>
                                            {law && <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-1"><Scale size={10} /> {law.cnj_number}</p>}

                                            <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[8px] font-black border border-slate-200 dark:border-slate-700" title={resp?.full_name}>
                                                        {resp?.full_name?.charAt(0) || <UserIcon size={10} />}
                                                    </div>
                                                    <span className="text-[10px] font-bold text-slate-400 truncate max-w-[80px]">{resp?.full_name?.split(' ')[0]}</span>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <div className="flex items-center gap-1 text-slate-400">
                                                        <Calendar size={10} />
                                                        <span className="text-[10px] font-bold">{new Date(task.due_date).toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                    </div>
                                                    {task.status !== 'Concluído' && (
                                                        <span className={`text-[8px] font-black uppercase tracking-tighter mt-1 ${urgency.color === 'rose' ? 'text-rose-500 animate-pulse' : 'text-slate-400'}`}>
                                                            {urgency.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex-1 flex flex-col p-8 pt-0 overflow-y-auto no-scrollbar animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.task.labelTitle')}</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('common.status')}</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Prioridade</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.task.labelDueDate')}</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.task.labelResponsible')}</th>
                                        <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('modules.nexus.table.headers.actions')}</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">Nenhuma tarefa encontrada.</td>
                                        </tr>
                                    ) : filteredTasks.map((task) => {
                                        const resp = team.find(t_ => t_.id === task.responsible_id);
                                        const urgency = getTaskUrgencyInfo(task.due_date, task.status);
                                        return (
                                            <tr key={task.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-bold text-slate-700 dark:text-slate-200">{task.title}</div>
                                                    {lawsuits.find(l => l.id === task.lawsuit_id) && (
                                                        <div className="text-[10px] text-indigo-500 font-bold uppercase mt-1">
                                                            ⚖️ {lawsuits.find(l => l.id === task.lawsuit_id)?.cnj_number}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase border ${
                                                        task.status === 'Concluído' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                        task.status === 'Atrasado' ? 'bg-rose-50 text-rose-600 border-rose-100' :
                                                        'bg-slate-50 text-slate-600 border-slate-100'
                                                    }`}>
                                                        {getColumnTranslation(task.status)}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`text-[10px] font-bold ${
                                                        task.priority === 'Urgente' ? 'text-rose-600' :
                                                        task.priority === 'Alta' ? 'text-amber-600' :
                                                        'text-slate-500'
                                                    }`}>
                                                        {getPriorityTranslation(task.priority || 'Média')}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <div className="text-sm font-bold text-slate-600 dark:text-slate-300">
                                                            {new Date(task.due_date).toLocaleDateString('pt-BR')}
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${urgency.color === 'rose' ? 'text-rose-500' : 'text-slate-400'}`}>
                                                            {urgency.label}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black text-xs">
                                                            {resp?.full_name?.charAt(0) || <UserIcon size={14} />}
                                                        </div>
                                                        <span className="font-bold text-slate-600 dark:text-slate-300 text-sm">{resp?.full_name || 'Não atribuída'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={(e) => { e.stopPropagation(); handleOpenNexoVisual('task', task); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title="Ver Mapa Mental (Nexo Visual)"
                                                        >
                                                            <Network size={18} />
                                                        </button>
                                                        <button
                                                            onClick={() => { setEditingTask(task); setIsTaskModalOpen(true); setActiveTaskTab('basic'); }}
                                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                            title={t('common.edit')}
                                                        >
                                                            <Pencil size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
