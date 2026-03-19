import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { XCircle, Save } from 'lucide-react';

interface EventModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingEvent: any;
    setEditingEvent: (event: any) => void;
    handleSaveEvent: (e: React.FormEvent) => void;
    t: any;
    lawsuits?: any[];
    team?: any[];
}

export const EventModal: React.FC<EventModalProps> = ({
    isOpen,
    onClose,
    editingEvent,
    setEditingEvent,
    handleSaveEvent,
    t,
    lawsuits,
    team
}) => {
    return (
        <AnimatePresence>
            {isOpen && (
                <div key="event-drawer-overlay" className="fixed inset-0 z-[300] flex justify-end overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                        className="relative w-full max-w-xl bg-white dark:bg-slate-900 shadow-[-20px_0_50px_-10px_rgba(0,0,0,0.1)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800"
                    >
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                            <div className="flex items-center justify-between mb-2">
                                <div>
                                    <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                        {editingEvent?.id ? t('modules.nexus.modals.event.titleEdit') || 'Editar Evento' : t('modules.nexus.modals.event.title') || 'Novo Evento'}
                                    </h3>
                                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
                                        Agenda de Consultas e Prazos
                                    </p>
                                </div>
                                <button
                                    onClick={onClose}
                                    className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                >
                                    <XCircle size={28} />
                                </button>
                            </div>
                        </div>

                        <form onSubmit={handleSaveEvent} className="flex-1 flex flex-col overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Tipo de Evento</label>
                                        <select
                                            required
                                            value={editingEvent?.event_type || 'Outro'}
                                            onChange={e => setEditingEvent({ ...editingEvent, event_type: e.target.value as any })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                        >
                                            {['Audiência', 'Reunião', 'Despacho', 'Diligência', 'Outro'].map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.event.labelTitle')}</label>
                                        <input
                                            required
                                            value={editingEvent?.title || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, title: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                            placeholder={t('modules.nexus.modals.event.placeholderTitle')}
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Início</label>
                                            <input
                                                required
                                                type="datetime-local"
                                                value={editingEvent?.start_date ? new Date(editingEvent.start_date).toISOString().slice(0, 16) : ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, start_date: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold text-xs"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Fim (Opcional)</label>
                                            <input
                                                type="datetime-local"
                                                value={editingEvent?.end_date ? new Date(editingEvent.end_date).toISOString().slice(0, 16) : ''}
                                                onChange={e => setEditingEvent({ ...editingEvent, end_date: e.target.value })}
                                                className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold text-xs"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">Localização (Física ou Link)</label>
                                        <input
                                            value={editingEvent?.location || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, location: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                            placeholder="Ex: Fórum Central ou Zoom Link"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.event.labelLawsuit')} (Opcional)</label>
                                        <select
                                            value={editingEvent?.lawsuit_id || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, lawsuit_id: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                        >
                                            <option value="">{t('modules.nexus.modals.event.selectLawsuit')}</option>
                                            {(lawsuits || []).map((law: any) => <option key={law.id} value={law.id}>{law.cnj_number} - {law.case_title}</option>)}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">{t('modules.nexus.modals.event.labelResponsible')}</label>
                                        <select
                                            required
                                            value={editingEvent?.responsible_id || ''}
                                            onChange={e => setEditingEvent({ ...editingEvent, responsible_id: e.target.value })}
                                            className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white font-bold"
                                        >
                                            <option value="">{t('modules.nexus.modals.event.selectResponsible')}</option>
                                            {(team || []).map((te: any) => <option key={te.id} value={te.id}>{te.full_name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50 flex gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-8 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs"
                                >
                                    {t('modules.nexus.modals.event.cancel')}
                                </button>
                                <button
                                    type="submit"
                                    className="flex-[2] px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 text-xs"
                                >
                                    <Save size={20} /> Salvar Evento
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
