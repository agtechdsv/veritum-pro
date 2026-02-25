
import React, { useState, useEffect } from 'react';
import { TeamMember, Credentials } from '@/types';
import { Plus, Search, User, Mail, Phone, Shield, Pencil, Trash2, CheckCircle, XCircle, MoreVertical, MoreHorizontal } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import { useTranslation } from '@/contexts/language-context';
import { toast } from '@/components/ui/toast';

interface Props {
    credentials: Credentials;
}

const TeamManagement: React.FC<Props> = ({ credentials }) => {
    const { t } = useTranslation();
    const [members, setMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMember, setEditingMember] = useState<Partial<TeamMember> | null>(null);

    const supabase = createClient(credentials.supabaseUrl, credentials.supabaseAnonKey);

    useEffect(() => {
        fetchMembers();
    }, []);

    const fetchMembers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .order('full_name', { ascending: true });

            if (error) throw error;
            setMembers(data || []);
        } catch (error) {
            console.error('Error fetching members:', error);
            toast.error(t('management.master.team.toasts.fetchError'));
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingMember?.id) {
                const { error } = await supabase
                    .from('team_members')
                    .update(editingMember)
                    .eq('id', editingMember.id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('team_members')
                    .insert([editingMember]);
                if (error) throw error;
            }
            toast.success(t('management.master.team.toasts.saveSuccess'));
            setIsModalOpen(false);
            setEditingMember(null);
            fetchMembers();
        } catch (error) {
            console.error('Error saving member:', error);
            toast.error(t('management.master.team.toasts.saveError'));
        }
    };

    const toggleActive = async (member: TeamMember) => {
        try {
            const { error } = await supabase
                .from('team_members')
                .update({ is_active: !member.is_active })
                .eq('id', member.id);
            if (error) throw error;
            toast.success(t('management.master.team.toasts.statusSuccess'));
            fetchMembers();
        } catch (error) {
            console.error('Error toggling active status:', error);
            toast.error(t('management.master.team.toasts.statusError'));
        }
    };

    const filteredMembers = members.filter(m =>
        m.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.oab_number?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">{t('management.master.team.title')}</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{t('management.master.team.subtitle')}</p>
                </div>
                <button
                    onClick={() => { setEditingMember({ is_active: true }); setIsModalOpen(true); }}
                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-2xl font-black uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-slate-800 dark:border-slate-100"
                >
                    <Plus size={18} /> {t('management.master.team.addMember')}
                </button>
            </div>

            {/* Filters and Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2 relative">
                    <Search className="absolute left-3 top-3 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={t('management.master.team.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium shadow-sm"
                    />
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('management.master.team.stats.total')}</span>
                    <span className="text-2xl font-black text-indigo-600">{members.length}</span>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm">
                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">{t('management.master.team.stats.active')}</span>
                    <span className="text-2xl font-black text-emerald-600">{members.filter(m => m.is_active).length}</span>
                </div>
            </div>

            {/* Members Table */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-4">{t('management.master.team.table.member')}</th>
                                <th className="px-6 py-4">{t('management.master.team.table.role')}</th>
                                <th className="px-6 py-4">{t('management.master.team.table.contact')}</th>
                                <th className="px-6 py-4">{t('management.master.team.table.status')}</th>
                                <th className="px-6 py-4 text-center">{t('management.master.team.table.actions')}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">{t('management.master.team.table.loading')}</td>
                                </tr>
                            ) : filteredMembers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">{t('management.master.team.table.empty')}</td>
                                </tr>
                            ) : filteredMembers.map(member => (
                                <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-100 dark:border-indigo-800">
                                                {member.full_name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 dark:text-white">{member.full_name}</p>
                                                <p className="text-xs text-slate-400 font-medium">{member.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                                                {member.role}
                                            </span>
                                            {member.oab_number && (
                                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
                                                    <Shield size={10} /> OAB {member.oab_number}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                                                <Phone size={12} className="text-slate-400" />
                                                <span className="text-xs font-medium">{member.phone || t('common.notApplicable')}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <button
                                            onClick={() => toggleActive(member)}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase transition-all ${member.is_active
                                                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800'
                                                : 'bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800'
                                                }`}
                                        >
                                            {member.is_active ? <CheckCircle size={12} /> : <XCircle size={12} />}
                                            {member.is_active ? t('management.master.team.status.active') : t('management.master.team.status.inactive')}
                                        </button>
                                    </td>
                                    <td className="px-6 py-6 text-center">
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() => { setEditingMember(member); setIsModalOpen(true); }}
                                                className="p-3 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all"
                                                title={t('management.master.team.tooltips.edit')}
                                            >
                                                <Pencil size={18} />
                                            </button>
                                            <button
                                                className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                                                title={t('management.master.team.tooltips.access')}
                                            >
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Member Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-300">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                                {editingMember?.id ? t('management.master.team.modal.titles.edit') : t('management.master.team.modal.titles.new')}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <XCircle size={24} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.team.modal.fields.name')}</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                    <input
                                        required
                                        value={editingMember?.full_name || ''}
                                        onChange={e => setEditingMember({ ...editingMember, full_name: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                                        placeholder={t('management.master.team.modal.fields.namePlaceholder')}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.team.modal.fields.email')}</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                    <input
                                        required
                                        type="email"
                                        value={editingMember?.email || ''}
                                        onChange={e => setEditingMember({ ...editingMember, email: e.target.value })}
                                        className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                                        placeholder={t('management.master.team.modal.fields.emailPlaceholder')}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.team.modal.fields.phone')}</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                        <input
                                            value={editingMember?.phone || ''}
                                            onChange={e => setEditingMember({ ...editingMember, phone: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                                            placeholder={t('management.master.team.modal.fields.phonePlaceholder')}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.team.modal.fields.oab')}</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3.5 top-3.5 text-slate-400" size={18} />
                                        <input
                                            value={editingMember?.oab_number || ''}
                                            onChange={e => setEditingMember({ ...editingMember, oab_number: e.target.value })}
                                            className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-medium"
                                            placeholder={t('management.master.team.modal.fields.oabPlaceholder')}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">{t('management.master.team.modal.fields.role')}</label>
                                <select
                                    required
                                    value={editingMember?.role || ''}
                                    onChange={e => setEditingMember({ ...editingMember, role: e.target.value as any })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none transition-all dark:text-white font-bold"
                                >
                                    <option value="">{t('management.master.team.modal.fields.rolePlaceholder')}</option>
                                    <option value="Sócio">{t('management.master.team.modal.roles.socio')}</option>
                                    <option value="Advogado Associado">{t('management.master.team.modal.roles.advogado')}</option>
                                    <option value="Estagiário">{t('management.master.team.modal.roles.estagiario')}</option>
                                    <option value="Paralegal">{t('management.master.team.modal.roles.paralegal')}</option>
                                    <option value="Financeiro">{t('management.master.team.modal.roles.financeiro')}</option>
                                </select>
                            </div>
                            <div className="pt-4 flex gap-3">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-bold hover:bg-slate-200 transition-all transition-all">{t('management.master.team.modal.actions.cancel')}</button>
                                <button type="submit" className="flex-[2] px-4 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all flex items-center justify-center gap-2">
                                    <Plus size={18} /> {editingMember?.id ? t('management.master.team.modal.actions.update') : t('management.master.team.modal.actions.create')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamManagement;
