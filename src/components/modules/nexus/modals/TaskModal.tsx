import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Save, XCircle, Calendar, AlertTriangle } from 'lucide-react';
import { Task, Lawsuit, TeamMember } from '@/types';
import { useTranslation } from '@/contexts/language-context';

interface TaskModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingTask: Partial<Task> | null;
    setEditingTask: (task: Partial<Task> | null) => void;
    activeTaskTab: 'basic' | 'advanced';
    setActiveTaskTab: (tab: 'basic' | 'advanced') => void;
    handleSaveTask: (e: React.FormEvent) => void;
    lawsuits: Lawsuit[];
    team: TeamMember[];
    columns: string[];
    getColumnTranslation: (col: string) => string;
}

export const TaskModal: React.FC<TaskModalProps> = ({
    isOpen,
    onClose,
    editingTask,
    setEditingTask,
    activeTaskTab,
    setActiveTaskTab,
    handleSaveTask,
    lawsuits,
    team,
    columns,
    getColumnTranslation
}) => {
    const { t } = useTranslation();

    return (
        <AnimatePresence>
            {isOpen && (
                <div key="task-drawer-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Drawer Content */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white tracking-tighter">
                                        {editingTask?.id ? t('modules.nexus.modals.task.titleEdit') : t('modules.nexus.modals.task.title')}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-bold mt-1">
                                        {t('modules.nexus.modals.task.subtitle')}
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                >
                                    <XCircle size={28} />
                                </button>
                            </div>

                            {/* Tab Switcher - Premium Style */}
                            <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-80">
                                <button
                                    type="button"
                                    onClick={() => setActiveTaskTab('basic')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${activeTaskTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <Calendar size={14} /> {t('modules.nexus.modals.task.tabs.basic')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setActiveTaskTab('advanced')}
                                    className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-xs font-black transition-all ${activeTaskTab === 'advanced' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                >
                                    <AlertTriangle size={14} /> {t('modules.nexus.modals.task.tabs.advanced')}
                                </button>
                            </div>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSaveTask} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                                    {activeTaskTab === 'basic' ? (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelTitle')}</label>
                                                <input
                                                    required
                                                    value={editingTask?.title || ''}
                                                    onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                    placeholder={t('modules.nexus.modals.task.placeholderTitle')}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelLawsuit')}</label>
                                                <select
                                                    required
                                                    value={editingTask?.lawsuit_id || ''}
                                                    onChange={e => setEditingTask({ ...editingTask, lawsuit_id: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                >
                                                    <option value="">{t('modules.nexus.modals.task.selectLawsuit')}</option>
                                                    {lawsuits.map(law => <option key={law.id} value={law.id}>{law.cnj_number} - {law.case_title}</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelResponsible')}</label>
                                                <select
                                                    required
                                                    value={editingTask?.responsible_id || ''}
                                                    onChange={e => setEditingTask({ ...editingTask, responsible_id: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                >
                                                    <option value="">{t('modules.nexus.modals.task.selectResponsible')}</option>
                                                    {team.map(t => <option key={t.id} value={t.id}>{t.full_name} ({t.role})</option>)}
                                                </select>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelDueDate')}</label>
                                                <input
                                                    required
                                                    type="datetime-local"
                                                    value={editingTask?.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ''}
                                                    onChange={e => setEditingTask({ ...editingTask, due_date: e.target.value })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-8 animate-in fade-in duration-300">
                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 px-1">{t('modules.nexus.modals.task.labelPriority')}</label>
                                                <div className="grid grid-cols-2 gap-3">
                                                    {['Low', 'Medium', 'High', 'Urgent'].map(p => (
                                                        <button
                                                            key={p}
                                                            type="button"
                                                            onClick={() => setEditingTask({ ...editingTask, priority: p as any })}
                                                            className={`px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-wider transition-all border ${editingTask?.priority === p
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xl shadow-indigo-600/20 scale-105'
                                                                : 'bg-white dark:bg-slate-950 text-slate-500 border-slate-200 dark:border-slate-800 hover:border-indigo-300'
                                                                }`}
                                                        >
                                                            {t(`modules.nexus.modals.task.priorities.${p}`)}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.task.labelStatus')}</label>
                                                <select
                                                    value={editingTask?.status || 'A Fazer'}
                                                    onChange={e => setEditingTask({ ...editingTask, status: e.target.value as any })}
                                                    className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                                >
                                                    {columns.map(col => <option key={col} value={col}>{getColumnTranslation(col)}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Footer Buttons */}
                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                >
                                    {t('modules.nexus.modals.task.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    <Save size={20} /> {t('modules.nexus.modals.task.save')}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
