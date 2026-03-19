import React from 'react';
import { 
    Plus, Search, Filter, XCircle, MapPin, Pencil, 
    ChevronLeft, ChevronRight 
} from 'lucide-react';
import { CalendarEvent, TeamMember, Lawsuit, Credentials } from '@/types';

interface CalendarTabProps {
    t: any;
    credentials: Credentials;
    team: TeamMember[];
    lawsuits: Lawsuit[];
    events: CalendarEvent[];
    filteredEvents: CalendarEvent[];
    eventView: 'calendar' | 'list';
    setEventView: (v: 'calendar' | 'list') => void;
    currentDate: Date;
    setCurrentDate: (d: Date) => void;
    setEditingEvent: (e: Partial<CalendarEvent>) => void;
    setIsEventModalOpen: (b: boolean) => void;
    handleSoftDeleteEvent: (id: string) => void;
    filterSearchTerm: string;
    setFilterSearchTerm: (v: string) => void;
    filterResponsibleId: string;
    setFilterResponsibleId: (v: string) => void;
    filterLawsuitId: string;
    setFilterLawsuitId: (v: string) => void;
}

export const CalendarTab = ({
    t,
    credentials,
    team,
    lawsuits,
    events,
    filteredEvents,
    eventView,
    setEventView,
    currentDate,
    setCurrentDate,
    setEditingEvent,
    setIsEventModalOpen,
    handleSoftDeleteEvent,
    filterSearchTerm,
    setFilterSearchTerm,
    filterResponsibleId,
    setFilterResponsibleId,
    filterLawsuitId,
    setFilterLawsuitId
}: CalendarTabProps) => {

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
        <div className="flex-1 p-8 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-500">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('modules.nexus.tabs.calendar')}</h1>
                        <p className="text-slate-500 font-bold">Visualização cronológica de compromissos</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex w-72 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-inner">
                            <button
                                onClick={() => setEventView('calendar')}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${eventView === 'calendar' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Calendário
                            </button>
                            <button
                                onClick={() => setEventView('list')}
                                className={`flex-1 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${eventView === 'list' ? 'bg-white dark:bg-indigo-600 text-indigo-600 dark:text-white shadow-md scale-[1.02]' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                            >
                                Lista
                            </button>
                        </div>
                        <button
                            onClick={() => { setEditingEvent({ event_type: 'Audiência' }); setIsEventModalOpen(true); }}
                            className="bg-slate-800 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-slate-900 transition-all shadow-lg active:scale-95"
                        >
                            <Plus size={14} /> {t('modules.nexus.modals.event.title')}
                        </button>
                    </div>
                </div>

                <div className="mt-4">
                    {renderFilterBar()}
                </div>
            </div>

            {eventView === 'list' ? (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="overflow-x-auto h-full pr-2">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Data</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.event.labelTitle')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('modules.nexus.modals.event.labelResponsible')}</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('modules.nexus.table.headers.actions')}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50 dark:divide-slate-800 overflow-y-auto">
                                {filteredEvents.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-20 text-center text-slate-500 font-bold text-sm">Nenhum evento encontrado.</td>
                                    </tr>
                                ) : filteredEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map((event) => {
                                    const resp = team.find(t_ => t_.id === event.responsible_id);
                                    const startDate = new Date(event.start_date);
                                    return (
                                        <tr key={event.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{startDate.toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { day: '2-digit', month: 'short' })}</div>
                                                <div className="text-[10px] text-slate-400 font-bold">{startDate.toLocaleTimeString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { hour: '2-digit', minute: '2-digit' })}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{event.title}</div>
                                                {event.location && <div className="text-[10px] text-slate-400 font-bold flex items-center gap-1"><MapPin size={10} /> {event.location}</div>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-lg text-[10px] font-black uppercase border border-indigo-100">
                                                    {event.event_type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-slate-700 dark:text-slate-200">{resp?.full_name || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-end gap-1">
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); setEditingEvent(event); setIsEventModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-all"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleSoftDeleteEvent(event.id); }}
                                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-all"
                                                    >
                                                        <XCircle size={18} />
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
            ) : (
                <div className="flex-1 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col p-8 animate-in fade-in zoom-in-95 duration-700">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-black text-slate-800 dark:text-white capitalize">
                            {currentDate.toLocaleDateString(t('locale') === 'en' ? 'en-US' : 'pt-BR', { month: 'long', year: 'numeric' })}
                        </h2>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))}
                                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold group"
                            >
                                <ChevronLeft size={16} className="group-active:-translate-x-1 transition-transform" />
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date())}
                                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all active:scale-95"
                            >
                                Hoje
                            </button>
                            <button
                                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))}
                                className="p-2 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all font-bold group"
                            >
                                <ChevronRight size={16} className="group-active:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto overflow-x-hidden no-scrollbar pb-4 pr-2">
                        <div className="grid grid-cols-7 gap-4 h-full">
                            {['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'].map(d => (
                                <div key={d} className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">
                                    {d}
                                </div>
                            ))}
                            {(() => {
                                const today_ = new Date();
                                const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
                                const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

                                const days = [];
                                for (let i = 0; i < firstDay.getDay(); i++) days.push(null);
                                for (let i = 1; i <= lastDay.getDate(); i++) days.push(new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

                                return days.map((day, idx) => {
                                    if (!day) return <div key={`empty-${idx}`} className="min-h-[140px] rounded-2xl bg-slate-50/50 dark:bg-slate-800/10 border border-transparent" />;

                                    const dayEvents = filteredEvents.filter(e => {
                                        const eDate = new Date(e.start_date);
                                        return eDate.getDate() === day.getDate() && eDate.getMonth() === day.getMonth() && eDate.getFullYear() === day.getFullYear();
                                    });
                                    const isToday = day.getDate() === today_.getDate() && day.getMonth() === today_.getMonth() && day.getFullYear() === today_.getFullYear();

                                    return (
                                        <div
                                            key={`day-${idx}`}
                                            className={`min-h-[140px] rounded-3xl border transition-all p-3 flex flex-col gap-2 relative cursor-pointer ${isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10 border-indigo-200 dark:border-indigo-800 shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-800'}`}
                                            onClick={() => {
                                                const eventDate = new Date(day);
                                                eventDate.setHours(9, 0, 0, 0); // Default to 09:00 AM
                                                setEditingEvent({ start_date: eventDate.toISOString() });
                                                setIsEventModalOpen(true);
                                            }}
                                        >
                                            <div className="flex justify-between items-center px-1">
                                                <span className={`text-sm font-black ${isToday ? 'text-indigo-600 dark:text-indigo-400 scale-110 origin-left' : 'text-slate-400 dark:text-slate-500'}`}>
                                                    {day.getDate()}
                                                </span>
                                                {dayEvents.length > 0 && <span className="w-2 h-2 rounded-full bg-indigo-500" />}
                                            </div>
                                            <div className="flex-1 flex flex-col gap-1.5 overflow-y-auto no-scrollbar">
                                                {dayEvents.sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()).map(ev => {
                                                    const isPastEvent = new Date(ev.start_date) < new Date();
                                                    return (
                                                        <div
                                                            key={ev.id}
                                                            onClick={(e) => { e.stopPropagation(); setEditingEvent(ev); setIsEventModalOpen(true); }}
                                                            className={`rounded-xl p-2 text-[10px] font-bold cursor-pointer hover:scale-[1.02] transition-all group ${isPastEvent
                                                                    ? 'bg-slate-50 dark:bg-slate-800/50 text-slate-400 border border-slate-200 dark:border-slate-800 opacity-70 hover:opacity-100'
                                                                    : 'bg-indigo-600 text-white shadow-md hover:bg-indigo-700'
                                                                }`}
                                                        >
                                                            <div className={`truncate ${isPastEvent ? 'line-through decoration-slate-300 dark:decoration-slate-600' : ''}`}>{ev.title}</div>
                                                            <div className={`${isPastEvent ? 'text-slate-400 dark:text-slate-500' : 'text-indigo-200'} font-medium mt-0.5 transition-opacity`}>
                                                                {new Date(ev.start_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} â€¢ {ev.event_type}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
