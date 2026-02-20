'use client'

import React, { useState, useEffect } from 'react';
import {
    format, addMonths, subMonths, startOfMonth, endOfMonth,
    startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays,
    isBefore, isAfter, startOfDay, endOfDay, addHours, startOfHour, parseISO,
    eachHourOfInterval, isWithinInterval, setHours, setMinutes, addMinutes
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
    Calendar as CalendarIcon, ChevronLeft, ChevronRight,
    Clock, Users, CheckCircle2, AlertCircle, X, Search,
    Filter, MoreVertical, LayoutGrid, List, Sparkles, Send,
    Trash2, Pencil, Mail, Link as LinkIcon
} from 'lucide-react';
import { createMasterClient } from '@/lib/supabase/master';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/toast';

interface DemoRequest {
    id: string;
    full_name: string;
    email: string;
    whatsapp: string;
    team_size: string;
    preferred_start: string;
    preferred_end: string;
    scheduled_at: string | null;
    attended_at: string | null;
    meeting_link: string | null;
    status: 'pending' | 'scheduled' | 'attended' | 'canceled';
    created_at: string;
}

export default function SchedulingManagement() {
    const [view, setView] = useState<'month' | 'day'>('month');
    const [currentDate, setCurrentDate] = useState(new Date());
    const [requests, setRequests] = useState<DemoRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState<DemoRequest | null>(null);
    const [filterRange, setFilterRange] = useState<{ start: string, end: string }>({ start: '', end: '' });
    const [leadsStatusFilter, setLeadsStatusFilter] = useState<DemoRequest['status'] | 'all'>('pending');
    const [calendarStatusFilter, setCalendarStatusFilter] = useState<DemoRequest['status'] | 'all'>('all');
    const [editingRequest, setEditingRequest] = useState<DemoRequest | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [requestToDelete, setRequestToDelete] = useState<DemoRequest | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [schedulingConfirmData, setSchedulingConfirmData] = useState<{ request: DemoRequest, slot: Date } | null>(null);
    const [isSchedulingConfirmOpen, setIsSchedulingConfirmOpen] = useState(false);
    const [sendingInvite, setSendingInvite] = useState(false);
    const supabase = createMasterClient();

    useEffect(() => {
        fetchRequests();

        const channel = supabase
            .channel('demo-requests-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'demo_requests' }, () => {
                fetchRequests();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchRequests = async () => {
        const { data, error } = await supabase
            .from('demo_requests')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) setRequests(data);
        setLoading(false);
    };

    const handleSchedule = async (requestId: string, date: Date) => {
        const { error } = await supabase
            .from('demo_requests')
            .update({
                scheduled_at: date.toISOString(),
                status: 'scheduled'
            })
            .eq('id', requestId);

        if (!error) {
            setSelectedRequest(null);
            setIsSchedulingConfirmOpen(false);
            setSchedulingConfirmData(null);
            fetchRequests();
            toast.success('Agendamento confirmado com sucesso!');
        } else {
            toast.error('Erro ao confirmar agendamento.');
        }
    };

    const confirmSchedule = (request: DemoRequest, slot: Date) => {
        setSchedulingConfirmData({ request, slot });
        setIsSchedulingConfirmOpen(true);
    };

    const handleUpdateStatus = async (requestId: string, status: DemoRequest['status'] | 'reschedule') => {
        let updates: any = {};

        if (status === 'reschedule') {
            updates = { status: 'pending', scheduled_at: null, attended_at: null };
        } else {
            updates.status = status;
            if (status === 'attended') updates.attended_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('demo_requests')
            .update(updates)
            .eq('id', requestId);

        if (!error) fetchRequests();
    };

    const handleDeleteRequest = async (id: string) => {
        const { error } = await supabase
            .from('demo_requests')
            .delete()
            .eq('id', id);

        if (!error) {
            fetchRequests();
            if (selectedRequest?.id === id) setSelectedRequest(null);
            setIsDeleteModalOpen(false);
            setRequestToDelete(null);
            toast.success('Agendamento excluído permanentemente.');
        } else {
            toast.error('Erro ao excluir agendamento.');
        }
    };

    const confirmDelete = (req: DemoRequest) => {
        setRequestToDelete(req);
        setIsDeleteModalOpen(true);
    };

    const handleSaveEdit = async (updated: Partial<DemoRequest>) => {
        if (!editingRequest) return;

        const { error } = await supabase
            .from('demo_requests')
            .update(updated)
            .eq('id', editingRequest.id);

        if (!error) {
            fetchRequests();
            setIsEditModalOpen(false);
            setEditingRequest(null);
            toast.success('Agendamento atualizado com sucesso!');
        } else {
            console.error('Error updating request:', error);
            toast.error('Erro ao salvar alterações.');
        }
    };

    const handleSendInvite = async (request: DemoRequest, overrides?: Partial<DemoRequest>) => {
        const meetingLink = overrides?.meeting_link || request.meeting_link;
        const email = overrides?.email || request.email;
        const fullName = overrides?.full_name || request.full_name;

        if (!meetingLink) {
            toast.error('Informe o link da reunião antes de enviar o convite.');
            return false;
        }

        if (!request.scheduled_at) {
            toast.error('Esta solicitação não possui data agendada.');
            return false;
        }

        setSendingInvite(true);

        try {
            const dateObj = parseISO(request.scheduled_at);
            const formattedDate = dateObj.toLocaleString('pt-BR', {
                day: '2-digit', month: 'long', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
            });

            const startTime = dateObj;
            const endTime = addMinutes(startTime, 30);
            const formatDateGoogle = (d: Date) => format(d, "yyyyMMdd'T'HHmmss'Z'");
            const formatDateOutlook = (d: Date) => format(d, "yyyy-MM-dd'T'HH:mm:ss'Z'");
            const eventTitle = encodeURIComponent("Demonstração Veritum PRO");
            const eventDetails = encodeURIComponent(`Olá ${fullName}, seu agendamento do Veritum PRO foi confirmado.\n\nLink da Reunião: ${meetingLink}`);
            const eventLocation = encodeURIComponent(meetingLink || "");
            const googleUrl = `https://www.google.com/calendar/render?action=TEMPLATE&text=${eventTitle}&dates=${formatDateGoogle(startTime)}/${formatDateGoogle(endTime)}&details=${eventDetails}&location=${eventLocation}`;
            const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${eventTitle}&startdt=${formatDateOutlook(startTime)}&enddt=${formatDateOutlook(endTime)}&body=${eventDetails}&location=${eventLocation}`;

            const emailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                    <!--[if mso]>
                    <style type="text/css">
                        table {border-collapse: collapse; mso-table-lspace: 0pt; mso-table-rspace: 0pt;}
                    </style>
                    <![endif]-->
                </head>
                <body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: 'Segoe UI', Arial, sans-serif; -webkit-font-smoothing: antialiased;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8fafc;">
                        <tr>
                            <td align="center" style="padding: 40px 10px;">
                                <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0;">
                                    <tr>
                                        <td align="center" style="padding: 48px 20px; background: linear-gradient(135deg, #10b981 0%, #3b82f6 100%);">
                                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 800; letter-spacing: -0.03em; text-transform: uppercase;">VERITUM PRO</h1>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 48px 40px;">
                                            <h2 style="margin: 0 0 24px 0; color: #0f172a; font-size: 26px; font-weight: 700; text-align: center; letter-spacing: -0.01em;">Sua reunião está confirmada!</h2>
                                            <p style="margin: 0 0 32px 0; color: #475569; font-size: 17px; line-height: 1.6; text-align: center;">
                                                Olá, <strong>${fullName}</strong>. Preparamos tudo para a sua demonstração exclusiva.
                                            </p>
                                            
                                            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="margin: 32px 0;">
                                                <tr>
                                                    <td style="padding: 32px; background-color: #f1f5f9; border-radius: 16px; text-align: center; border: 1px solid #e2e8f0;">
                                                        <span style="display: block; margin-bottom: 12px; color: #64748b; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">AGENDADO PARA</span>
                                                        <span style="color: #0f172a; font-size: 22px; font-weight: 800;">${formattedDate}h</span>
                                                    </td>
                                                </tr>
                                            </table>

                                            <div style="margin: 40px 0 32px 0; text-align: center;">
                                                <a href="${meetingLink}" style="display: inline-block; padding: 20px 48px; background-color: #10b981; color: #ffffff; text-decoration: none; font-size: 16px; font-weight: 700; border-radius: 14px; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 4px 10px rgba(16, 185, 129, 0.2);">
                                                    ACESSAR SALA VIRTUAL
                                                </a>
                                            </div>

                                            <div style="text-align: center; margin-top: 40px; padding-top: 32px; border-top: 1px solid #f1f5f9;">
                                                <p style="color: #64748b; font-size: 13px; margin-bottom: 20px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em;">Lembrete na sua agenda:</p>
                                                <table border="0" cellpadding="0" cellspacing="0" align="center">
                                                    <tr>
                                                        <td style="padding: 0 10px;">
                                                            <a href="${googleUrl}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 700; padding: 10px 20px; background-color: #eff6ff; border-radius: 10px; border: 1px solid #dbeafe;">+ Google</a>
                                                        </td>
                                                        <td style="padding: 0 10px;">
                                                            <a href="${outlookUrl}" target="_blank" style="color: #3b82f6; text-decoration: none; font-size: 14px; font-weight: 700; padding: 10px 20px; background-color: #eff6ff; border-radius: 10px; border: 1px solid #dbeafe;">+ Outlook</a>
                                                        </td>
                                                    </tr>
                                                </table>
                                            </div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 32px; background-color: #f8fafc; border-top: 1px solid #e2e8f0; text-align: center;">
                                            <p style="margin: 0 0 8px 0; color: #64748b; font-size: 13px; font-weight: 600;">© 2026 Veritum PRO</p>
                                            <p style="margin: 0; color: #94a3b8; font-size: 12px; line-height: 1.5;">
                                                Você recebeu este e-mail devido ao seu interesse no Veritum PRO.<br>
                                                Performance Jurídica Elevada.
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>
            `;

            const { data, error } = await supabase.functions.invoke('send-email', {
                body: { to: email, subject: 'Confirmação de Reunião - Veritum PRO', html: emailHtml, fullName }
            });

            if (!error && data?.success) {
                toast.success(`Convite enviado para ${email}!`);
                if (overrides?.meeting_link) handleSaveEdit(overrides);
                return true;
            } else {
                toast.error(`Falha no envio: ${error?.message || data?.error}`);
                return false;
            }
        } catch (err) {
            toast.error('Erro inesperado ao enviar e-mail.');
            return false;
        } finally {
            setSendingInvite(false);
        }
    };

    const isSameSlot = (d1: Date, d2: Date) => {
        return isSameDay(d1, d2) &&
            d1.getHours() === d2.getHours() &&
            (Math.floor(d1.getMinutes() / 30) === Math.floor(d2.getMinutes() / 30));
    };

    const filteredLeads = requests.filter(r => {
        if (leadsStatusFilter !== 'all' && r.status !== leadsStatusFilter) return false;
        if (filterRange.start && isBefore(parseISO(r.preferred_start), startOfDay(parseISO(filterRange.start)))) return false;
        if (filterRange.end && isAfter(parseISO(r.preferred_end), endOfDay(parseISO(filterRange.end)))) return false;
        return true;
    });

    const displayScheduled = requests.filter(r => {
        if (r.status === 'pending') return false;
        if (calendarStatusFilter !== 'all' && r.status !== calendarStatusFilter) return false;
        return true;
    });

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                        Gestão de <span className="text-branding-gradient">Agendamentos</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-2">
                        Visualize e organize as demonstrações estratégicas solicitadas.
                    </p>
                </div>

                <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800">
                    <button
                        onClick={() => setView('month')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'month' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <LayoutGrid size={18} /> Mensal
                    </button>
                    <button
                        onClick={() => setView('day')}
                        className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${view === 'day' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                    >
                        <Clock size={18} /> Diário
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                {/* Sidebar: Pending Requests */}
                <div className="xl:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] p-6 shadow-xl border border-slate-100 dark:border-slate-800">
                        <div className="flex items-center justify-between mb-4 px-2">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Solicitações</h3>
                            <span className="bg-rose-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{filteredLeads.length}</span>
                        </div>

                        {/* Status Type Filter */}
                        <div className="flex flex-wrap gap-2 mb-6">
                            {(['pending', 'scheduled', 'attended', 'canceled', 'all'] as const).map((s) => (
                                <button
                                    key={s}
                                    onClick={() => setLeadsStatusFilter(s)}
                                    className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${leadsStatusFilter === s ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-500'}`}
                                >
                                    {s === 'all' ? 'Tudo' : s === 'pending' ? 'Pend' : s === 'scheduled' ? 'Agend' : s === 'attended' ? 'Atend' : 'Canc'}
                                </button>
                            ))}
                        </div>

                        {/* Filter UI */}
                        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50 space-y-3">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                                <Filter size={12} /> Filtrar Período
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    type="date"
                                    className="bg-white dark:bg-slate-900 p-2 rounded-lg text-[10px] font-bold border-none outline-none dark:text-white"
                                    value={filterRange.start}
                                    onChange={(e) => setFilterRange({ ...filterRange, start: e.target.value })}
                                />
                                <input
                                    type="date"
                                    className="bg-white dark:bg-slate-900 p-2 rounded-lg text-[10px] font-bold border-none outline-none dark:text-white"
                                    value={filterRange.end}
                                    onChange={(e) => setFilterRange({ ...filterRange, end: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {filteredLeads.length === 0 ? (
                                <div className="text-center py-10">
                                    <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                        <CheckCircle2 size={24} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nada encontrado</p>
                                </div>
                            ) : (
                                filteredLeads.map((req: DemoRequest) => (
                                    <button
                                        key={req.id}
                                        onClick={() => {
                                            setSelectedRequest(req);
                                            // Inteligência de navegação: se já agendado/atendido, vai para a data exata.
                                            // Caso contrário, vai para o início da faixa de preferência.
                                            const targetDate = (req.status === 'scheduled' || req.status === 'attended') && req.scheduled_at
                                                ? parseISO(req.scheduled_at)
                                                : parseISO(req.preferred_start);

                                            setCurrentDate(targetDate);
                                            if (view === 'month') setView('day');
                                        }}
                                        className={`w-full text-left p-3 rounded-xl border transition-all group ${selectedRequest?.id === req.id ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/30' : 'bg-slate-50 dark:bg-slate-800/50 border-transparent hover:border-slate-200 dark:hover:border-slate-700'}`}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <h4 className="text-[12px] font-black text-slate-800 dark:text-white group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate flex-1 pr-2">{req.full_name}</h4>
                                            <span className="text-[9px] font-black text-indigo-500 shrink-0">{req.team_size}</span>
                                        </div>

                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400">
                                                <CalendarIcon size={10} className="text-indigo-500" />
                                                {format(parseISO(req.preferred_start), 'dd/MM')} - {format(parseISO(req.preferred_end), 'dd/MM')}
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]"></div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Main Calendar View */}
                <div className="xl:col-span-3">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden min-h-[700px] flex flex-col">
                        {/* Calendar Controls */}
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                                    <button
                                        onClick={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : addDays(currentDate, -1))}
                                        className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-all text-slate-400"
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(new Date())}
                                        className="px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-indigo-600 transition-colors"
                                    >
                                        Hoje
                                    </button>
                                    <button
                                        onClick={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addDays(currentDate, 1))}
                                        className="p-2 hover:bg-white dark:hover:bg-slate-900 rounded-lg transition-all text-slate-400"
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>

                                <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                                    {format(currentDate, view === 'month' ? 'MMMM yyyy' : 'EEEE, dd MMMM', { locale: ptBR })}
                                </h2>
                            </div>

                            {/* Calendar Status Filter */}
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 p-1 rounded-xl">
                                {(['all', 'scheduled', 'attended', 'canceled'] as const).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setCalendarStatusFilter(s)}
                                        className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${calendarStatusFilter === s ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'}`}
                                    >
                                        {s === 'all' ? 'Ver Todos' : s === 'scheduled' ? 'Agendados' : s === 'attended' ? 'Atendidos' : 'Cancelados'}
                                    </button>
                                ))}
                            </div>

                            {selectedRequest && view === 'day' && (
                                <div className="flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                                    <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Selecione o horário para {selectedRequest.full_name.split(' ')[0]}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedRequest(null)}
                                        className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                            )}
                        </div>

                        <div className="flex-1 overflow-auto custom-scrollbar">
                            {view === 'month' ? (
                                <MonthView
                                    currentDate={currentDate}
                                    scheduledRequests={displayScheduled}
                                    onSelectDate={(d) => { setCurrentDate(d); setView('day'); }}
                                    onDelete={confirmDelete}
                                    onEdit={(req: DemoRequest) => { setEditingRequest(req); setIsEditModalOpen(true); }}
                                />
                            ) : (
                                <DayView
                                    currentDate={currentDate}
                                    scheduledRequests={displayScheduled}
                                    selectedRequest={selectedRequest}
                                    onSchedule={(id, slot) => selectedRequest && confirmSchedule(selectedRequest, slot)}
                                    onUpdateStatus={handleUpdateStatus}
                                    onEdit={(req: DemoRequest) => { setEditingRequest(req); setIsEditModalOpen(true); }}
                                    onDelete={confirmDelete}
                                    onSendEmail={(req) => handleSendInvite(req)}
                                />
                            )}
                        </div>
                    </div>
                </div>

                <EditModal
                    isOpen={isEditModalOpen}
                    request={editingRequest}
                    onClose={() => setIsEditModalOpen(false)}
                    onSave={handleSaveEdit}
                    onSendInvite={handleSendInvite}
                    sendingInvite={sendingInvite}
                    supabase={supabase}
                />

                <DeleteConfirmationModal
                    isOpen={isDeleteModalOpen}
                    request={requestToDelete}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onConfirm={() => requestToDelete && handleDeleteRequest(requestToDelete.id)}
                />

                <ScheduleConfirmationModal
                    isOpen={isSchedulingConfirmOpen}
                    data={schedulingConfirmData}
                    onClose={() => setIsSchedulingConfirmOpen(false)}
                    onConfirm={() => schedulingConfirmData && handleSchedule(schedulingConfirmData.request.id, schedulingConfirmData.slot)}
                />
            </div>
        </div>
    );
}

function MonthView({ currentDate, scheduledRequests, onSelectDate, onDelete, onEdit }: {
    currentDate: Date,
    scheduledRequests: DemoRequest[],
    onSelectDate: (d: Date) => void,
    onDelete: (req: DemoRequest) => void,
    onEdit: (req: DemoRequest) => void
}) {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);

    const rows = [];
    let days = [];
    let day = startDate;

    const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    while (day <= endDate) {
        for (let i = 0; i < 7; i++) {
            const cloneDay = day;
            const isSelected = isSameDay(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const isCurrentMonth = isSameMonth(day, monthStart);
            const dayRequests = scheduledRequests.filter(r => r.scheduled_at && isSameDay(parseISO(r.scheduled_at), cloneDay));

            days.push(
                <div
                    key={day.toString()}
                    onClick={() => onSelectDate(cloneDay)}
                    className={`min-h-[120px] p-3 border-r border-b border-slate-50 dark:border-slate-800/50 transition-all cursor-pointer hover:bg-slate-50/50 dark:hover:bg-slate-800/30 ${!isCurrentMonth ? 'bg-slate-50/30 dark:bg-slate-900/50' : ''}`}
                >
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-xs font-black w-6 h-6 flex items-center justify-center rounded-lg transition-colors ${isToday ? 'bg-indigo-600 text-white shadow-lg' : isCurrentMonth ? 'text-slate-800 dark:text-white' : 'text-slate-300 dark:text-slate-700'}`}>
                            {format(day, 'd')}
                        </span>
                    </div>
                    <div className="space-y-1">
                        {dayRequests.map(req => (
                            <div
                                key={req.id}
                                onClick={(e) => { e.stopPropagation(); onEdit(req); }}
                                className={`group/monthcard relative text-[9px] font-black uppercase px-2 py-1 rounded-md truncate border cursor-pointer hover:shadow-sm transition-all ${req.status === 'attended' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 border-emerald-100 dark:border-emerald-500/20' : 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 border-indigo-100 dark:border-indigo-500/20'}`}
                            >
                                {format(parseISO(req.scheduled_at!), 'HH:mm')} {req.full_name.split(' ')[0]}
                                <button
                                    onClick={(e) => { e.stopPropagation(); onDelete(req); }}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover/monthcard:opacity-100 text-rose-500 hover:text-rose-600 transition-all p-0.5"
                                >
                                    <Trash2 size={8} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            );
            day = addDays(day, 1);
        }
        rows.push(
            <div key={day.toString()} className="grid grid-cols-7">
                {days}
            </div>
        );
        days = [];
    }

    return (
        <div className="min-w-[800px]">
            <div className="grid grid-cols-7 border-b border-slate-100 dark:border-slate-800">
                {daysOfWeek.map(d => (
                    <div key={d} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                        {d}
                    </div>
                ))}
            </div>
            {rows}
        </div>
    );
}

function DayView({ currentDate, scheduledRequests, selectedRequest, onSchedule, onUpdateStatus, onEdit, onDelete, onSendEmail }: {
    currentDate: Date,
    scheduledRequests: DemoRequest[],
    selectedRequest: DemoRequest | null,
    onSchedule: (id: string, d: Date) => void,
    onUpdateStatus: (id: string, s: DemoRequest['status'] | 'reschedule') => void,
    onEdit: (req: DemoRequest) => void,
    onDelete: (req: DemoRequest) => void,
    onSendEmail: (req: DemoRequest) => Promise<boolean>
}) {
    // 30 minute intervals from 08:00 to 20:00
    const timeSlots: Date[] = [];
    const startHour = 8;
    const endHour = 20;

    for (let h = startHour; h <= endHour; h++) {
        timeSlots.push(setMinutes(setHours(currentDate, h), 0));
        if (h < endHour) {
            timeSlots.push(setMinutes(setHours(currentDate, h), 30));
        }
    }

    return (
        <div className="p-8">
            <div className="relative border-l border-slate-100 dark:border-slate-800 ml-20">
                {timeSlots.map((slot) => {
                    const slotRequests = scheduledRequests.filter(r => r.scheduled_at && isSameSlot(parseISO(r.scheduled_at), slot));

                    return (
                        <div key={slot.toString()} className="relative h-16 border-b border-slate-50 dark:border-slate-800/50 group">
                            {/* Time Label */}
                            <div className="absolute -left-20 top-0 h-full flex flex-col items-center">
                                <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">{format(slot, 'HH:mm')}</span>
                                <div className="flex-1 w-px bg-slate-100 dark:bg-slate-800 my-1"></div>
                            </div>

                            {/* Drop Zone / Action Button */}
                            <button
                                disabled={!selectedRequest}
                                onClick={() => selectedRequest && onSchedule(selectedRequest.id, slot)}
                                className={`absolute inset-0 transition-all z-10 ${selectedRequest ? 'hover:bg-indigo-600/5 cursor-pointer flex items-center justify-center group' : 'cursor-default'}`}
                            >
                                {selectedRequest && (
                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-indigo-600 text-white px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl">
                                        Agendar às {format(slot, 'HH:mm')}
                                    </div>
                                )}
                            </button>

                            {/* Scheduled Items */}
                            <div className="absolute inset-0 flex flex-col gap-2 p-0.5 pl-4">
                                {slotRequests.map(req => (
                                    <div
                                        key={req.id}
                                        onClick={(e) => { e.stopPropagation(); onEdit(req); }}
                                        className={`relative z-20 h-full rounded-xl px-4 py-2 border shadow-lg flex items-center justify-between group/card cursor-pointer hover:shadow-indigo-500/10 transition-all ${req.status === 'attended' ? 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-100 dark:border-emerald-500/20' : 'bg-white dark:bg-slate-900 border-indigo-100 dark:border-indigo-500/20'}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${req.status === 'attended' ? 'bg-emerald-500 text-white' : 'bg-indigo-600 text-white'}`}>
                                                <Users size={16} />
                                            </div>
                                            <div>
                                                <h5 className="text-[11px] font-black text-slate-800 dark:text-white uppercase tracking-tight leading-none">{req.full_name}</h5>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter flex items-center gap-1">
                                                        {req.team_size}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                            {req.status === 'scheduled' && (
                                                <>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onSendEmail(req); }}
                                                        className="p-1.5 text-indigo-500 hover:text-indigo-600 transition-colors bg-indigo-50 dark:bg-indigo-500/10 rounded-lg"
                                                        title="Enviar E-mail de Convite"
                                                    >
                                                        <Send size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onEdit(req); }}
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                                        title="Editar Agendamento"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(req.id, 'attended'); }}
                                                        className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-sm"
                                                        title="Marcar como Atendido"
                                                    >
                                                        Atendido
                                                    </button>
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(req.id, 'reschedule'); }}
                                                        className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-amber-600 transition-colors shadow-sm"
                                                        title="Voltar para Pendentes"
                                                    >
                                                        Remarcar
                                                    </button>
                                                </>
                                            )}
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onUpdateStatus(req.id, 'canceled'); }}
                                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                title="Cancelar"
                                            >
                                                <AlertCircle size={10} />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); onDelete(req); }}
                                                className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={10} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function DeleteConfirmationModal({ isOpen, request, onClose, onConfirm }: {
    isOpen: boolean,
    request: DemoRequest | null,
    onClose: () => void,
    onConfirm: () => void
}) {
    if (!request) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-center p-8"
                    >
                        <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <Trash2 size={32} className="text-rose-500" />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-2">Confirmar Exclusão</h3>
                        <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed mb-8">
                            Você tem certeza que deseja excluir o agendamento de <span className="text-indigo-600 font-black">{request.full_name}</span>? Esta ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-rose-500 hover:bg-rose-600 transition-all shadow-xl shadow-rose-500/20"
                            >
                                Excluir Lead
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function ScheduleConfirmationModal({ isOpen, data, onClose, onConfirm }: {
    isOpen: boolean,
    data: { request: DemoRequest, slot: Date } | null,
    onClose: () => void,
    onConfirm: () => void
}) {
    if (!data) return null;

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden text-center p-10"
                    >
                        <div className="w-20 h-20 bg-indigo-50 dark:bg-indigo-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-8 animate-bounce">
                            <CalendarIcon size={40} className="text-indigo-600" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight mb-4">Confirmar Agendamento?</h3>
                        <div className="space-y-4 mb-10">
                            <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                                Você está confirmando a demonstração para:
                            </p>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                                <h4 className="text-lg font-black text-indigo-600 uppercase tracking-tight mb-1">{data.request.full_name}</h4>
                                <div className="flex items-center justify-center gap-2 text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                                    <Clock size={12} />
                                    <span>{format(data.slot, "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all border border-slate-100 dark:border-slate-700"
                            >
                                Não, Voltar
                            </button>
                            <button
                                onClick={onConfirm}
                                className="flex-1 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white bg-indigo-600 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/30"
                            >
                                Sim, Confirmar
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

// Check for same 30min slot
function isSameSlot(d1: Date, d2: Date) {
    return isSameDay(d1, d2) &&
        d1.getHours() === d2.getHours() &&
        (Math.floor(d1.getMinutes() / 30) === Math.floor(d2.getMinutes() / 30));
}

function EditModal({ isOpen, request, onClose, onSave, onSendInvite, sendingInvite, supabase }: {
    isOpen: boolean,
    request: DemoRequest | null,
    onClose: () => void,
    onSave: (updated: Partial<DemoRequest>) => void,
    onSendInvite: (req: DemoRequest, overrides?: Partial<DemoRequest>) => Promise<boolean>,
    sendingInvite: boolean,
    supabase: any
}) {
    const [formData, setFormData] = useState<Partial<DemoRequest>>({});

    useEffect(() => {
        if (request) {
            setFormData({
                full_name: request.full_name,
                email: request.email,
                whatsapp: request.whatsapp,
                team_size: request.team_size,
                meeting_link: request.meeting_link || ''
            });
        }
    }, [request]);

    if (!request) return null;

    const handleInvite = async () => {
        await onSendInvite(request, formData);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                    >
                        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30">
                            <div>
                                <h3 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Editar Agendamento</h3>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Lead: {request.full_name}</p>
                            </div>
                            <button onClick={onClose} className="p-2 text-slate-400 hover:text-rose-500 transition-colors bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-1.5 col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={formData.full_name || ''}
                                        onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email</label>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                                        <Mail size={16} className="text-indigo-500" />
                                        <input
                                            type="email"
                                            value={formData.email || ''}
                                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">WhatsApp</label>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 flex items-center gap-3">
                                        <Sparkles size={16} className="text-emerald-500" />
                                        <input
                                            type="text"
                                            value={formData.whatsapp || ''}
                                            onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                                            className="bg-transparent border-none outline-none text-xs font-bold text-slate-600 dark:text-slate-300 w-full"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Tamanho da Equipe</label>
                                    <input
                                        type="text"
                                        value={formData.team_size || ''}
                                        onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                                        className="w-full bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700/50 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Link da Reunião (Zoom, Teams, etc)</label>
                                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl focus-within:border-indigo-500 transition-all shadow-inner">
                                    <div className="flex items-center p-4 gap-3">
                                        <LinkIcon size={20} className="text-slate-400 focus-within:text-indigo-500" />
                                        <input
                                            type="text"
                                            value={formData.meeting_link || ''}
                                            onChange={(e) => setFormData({ ...formData, meeting_link: e.target.value })}
                                            placeholder="https://zoom.us/j/..."
                                            className="bg-transparent border-none outline-none text-sm font-bold w-full dark:text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-end gap-4 border-t border-slate-100 dark:border-slate-800">
                            <button
                                onClick={onClose}
                                className="px-6 py-3 text-xs font-black uppercase tracking-widest text-slate-500 hover:text-slate-700"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleInvite}
                                disabled={sendingInvite || !formData.meeting_link}
                                className="px-6 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-indigo-600 rounded-2xl text-xs font-black uppercase tracking-widest shadow-sm hover:shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
                            >
                                {sendingInvite ? 'Enviando...' : <><Send size={14} /> Enviar Convite</>}
                            </button>
                            <button
                                onClick={() => onSave(formData)}
                                className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-500/20 hover:bg-indigo-700 transition-all"
                            >
                                Salvar Alterações
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
