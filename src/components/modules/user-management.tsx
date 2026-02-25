'use client'

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, User as UserIcon, Lock, FileEdit, Radio, ShieldAlert, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Package, Shield, Briefcase, ChevronDown, Filter } from 'lucide-react';
import { User, AccessGroup, ModuleId, Role } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { createUserDirectly, updateUserDirectly, deleteUserDirectly } from '@/app/actions/user-actions';
import { toast } from '../ui/toast';
import { useTranslation } from '@/contexts/language-context';

interface Props {
    currentUser: User;
}

const UserManagement: React.FC<Props> = ({ currentUser }) => {
    const { t, locale } = useTranslation();

    const getRoleTranslation = (roleName: string) => {
        if (!roleName) return '';
        const lowerRole = roleName.toLowerCase();
        if (lowerRole.includes('master')) return t('management.users.roles.master');
        if (lowerRole.includes('administrador') || lowerRole.includes('admin')) {
            if (lowerRole.includes('sócio')) return t('management.users.roles.partnerAdmin');
            return t('management.users.roles.admin');
        }
        if (lowerRole.includes('operador')) return t('management.users.roles.operator');
        if (lowerRole.includes('estagiário')) return t('management.users.roles.intern');
        if (lowerRole.includes('paralegal')) return t('management.users.roles.paralegal');
        if (lowerRole.includes('sênior')) return t('management.users.roles.senior');
        if (lowerRole.includes('coordenador')) return t('management.users.roles.coordinator');
        if (lowerRole.includes('financeiro')) return t('management.users.roles.financial');
        return roleName;
    };
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [plans, setPlans] = useState<any[]>([]);
    const [accessGroups, setAccessGroups] = useState<AccessGroup[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: '',
        plan_id: '',
        access_group_id: ''
    });

    const [filters, setFilters] = useState({
        search: '',
        role: 'all',
        admin: 'all',
        status: 'all'
    });
    const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>({ key: 'created_at', direction: 'desc' });

    // Pagination & Bulk Actions State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [bulkLoading, setBulkLoading] = useState(false);

    const nameRef = React.useRef<HTMLInputElement>(null);
    const supabase = createMasterClient();

    // Master Client Filter State
    const [clients, setClients] = useState<User[]>([]);
    const [selectedClientId, setSelectedClientId] = useState<string>(currentUser.id);

    useEffect(() => {
        if (currentUser.role === 'Master') {
            fetchClients();
        }
    }, [currentUser]);

    useEffect(() => {
        fetchUsers();
        fetchAccessGroups();
        fetchRoles();
    }, [selectedClientId, currentUser]);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchClients = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, name, username, role, active')
            .in('role', ['Sócio-Administrador', 'Sócio Administrador'])
            .order('name');
        if (data) setClients(data);
    };

    const fetchRoles = async () => {
        let query = supabase.from('roles').select('*');

        const isAdmin = ['Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(currentUser.role);

        if (currentUser.role === 'Master') {
            query = query.eq('admin_id', selectedClientId);
        } else if (isAdmin) {
            const adminIds = [currentUser.id];
            if (currentUser.parent_user_id) adminIds.push(currentUser.parent_user_id);
            query = query.in('admin_id', adminIds);
        } else {
            if (currentUser.parent_user_id) {
                query = query.eq('admin_id', currentUser.parent_user_id);
            } else {
                query = query.eq('admin_id', currentUser.id);
            }
        }

        const { data } = await query;
        if (data) setRoles(data);
    };

    const fetchAccessGroups = async () => {
        let query = supabase.from('access_groups').select('*');

        const isAdmin = ['Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(currentUser.role);

        // Scope optimization: Master sees selected client, Admins see their own + parent (who created them)
        if (currentUser.role === 'Master') {
            query = query.eq('admin_id', selectedClientId);
        } else if (isAdmin) {
            const adminIds = [currentUser.id];
            if (currentUser.parent_user_id) adminIds.push(currentUser.parent_user_id);
            query = query.in('admin_id', adminIds);
        } else {
            // For other roles, just their own admin's groups
            if (currentUser.parent_user_id) {
                query = query.eq('admin_id', currentUser.parent_user_id);
            } else {
                query = query.eq('admin_id', currentUser.id);
            }
        }

        const { data } = await query;
        if (data) setAccessGroups(data);
    };

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('plans')
            .select('*')
            .eq('active', true)
            .order('order_index', { ascending: true });
        if (data) setPlans(data);
    };

    useEffect(() => {
        if (showAddModal) {
            setTimeout(() => {
                nameRef.current?.focus();
            }, 100);
        }
    }, [showAddModal]);

    const fetchUsers = async () => {
        setLoading(true);
        let query = supabase
            .from('users')
            .select('*');

        // Hierarchy Filtering
        const isAdmin = ['Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(currentUser.role);

        if (currentUser.role === 'Master') {
            query = query.or(`id.eq.${selectedClientId},parent_user_id.eq.${selectedClientId}`);
        } else {
            // Universal hierarchy logic: see self, subordinates, boss, and peers
            const conditions = [`id.eq.${currentUser.id}`, `parent_user_id.eq.${currentUser.id}`];

            if (currentUser.parent_user_id) {
                conditions.push(`id.eq.${currentUser.parent_user_id}`);
                conditions.push(`parent_user_id.eq.${currentUser.parent_user_id}`);
            }

            query = query.or(conditions.join(','));
        }

        const { data, error } = await query;
        if (!error && data) setUsers(data);
        setLoading(false);
    };

    const handleSort = (key: string) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedUsers = [...users].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aVal = a[key as keyof User] as any;
        let bVal = b[key as keyof User] as any;

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredUsers = sortedUsers.filter(u => {
        const matchesSearch = u.name.toLowerCase().includes(filters.search.toLowerCase()) ||
            u.username.toLowerCase().includes(filters.search.toLowerCase());
        const matchesRole = filters.role === 'all' || u.role === filters.role;
        const matchesStatus = filters.status === 'all' ||
            (filters.status === 'active' ? u.active : !u.active);
        const matchesAdmin = filters.admin === 'all' || u.parent_user_id === filters.admin;

        return matchesSearch && matchesRole && matchesStatus && matchesAdmin;
    });

    // Pagination Logic
    const totalItems = filteredUsers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

    useEffect(() => {
        setCurrentPage(1); // Reset to first page when filters change
    }, [filters]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedUserIds(paginatedUsers.map(u => u.id));
        } else {
            setSelectedUserIds([]);
        }
    };

    const handleSelectUser = (userId: string) => {
        setSelectedUserIds(prev =>
            prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
        );
    };

    const handleBulkStatus = async (active: boolean) => {
        if (selectedUserIds.length === 0) return;
        setBulkLoading(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ active })
                .in('id', selectedUserIds);

            if (error) throw error;
            toast.success(t('management.users.toast.bulkStatusSuccess', { count: selectedUserIds.length, status: active ? t('management.users.active').toLowerCase() : t('management.users.inactive').toLowerCase() }));
            setSelectedUserIds([]);
            fetchUsers();
        } catch (err: any) {
            toast.error(t('management.users.toast.bulkError'));
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUserIds.length === 0) return;
        if (!confirm(t('management.users.bulk.confirmDelete', { count: selectedUserIds.length }))) return;

        setBulkLoading(true);
        try {
            const deletePromises = selectedUserIds.map(id => deleteUserDirectly(id));
            await Promise.all(deletePromises);

            toast.success(t('management.users.toast.bulkDeleteSuccess', { count: selectedUserIds.length }));
            setSelectedUserIds([]);
            fetchUsers();
        } catch (err: any) {
            toast.error(t('management.users.toast.bulkError'));
        } finally {
            setBulkLoading(false);
        }
    };

    const admins = users.filter(u => u.role === 'Administrador');

    const superAdminGroups = ['Sócio-Administrativo', 'Sócio-Administrador', 'Sócio Administrador'];
    const isSuperAdmin = currentUser.role === 'Master' || (currentUser.access_group_name && superAdminGroups.some(g => currentUser.access_group_name?.includes(g)));

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isSuperAdmin) {
            toast.error(t('management.users.toast.superAdminOnly'));
            return;
        }

        if (currentUser.role === 'Operador' && formData.role === 'Administrador') {
            toast.error(t('management.users.toast.operatorRestriction'));
            return;
        }

        try {
            if (editingUser) {
                // Check if user is allowed to edit this specific user
                if (!isSuperAdmin && editingUser.id !== currentUser.id) {
                    toast.error(t('management.users.toast.selfEditOnly'));
                    return;
                }
                const result = await updateUserDirectly(editingUser.id, formData);
                if (!result.success) throw new Error(result.error);
                toast.success(t('management.users.toast.successEdit'));
            } else {
                const parentUserId = currentUser.role === 'Master' ? selectedClientId : (currentUser.parent_user_id || currentUser.id);
                // When Master assigns to another Master account, make sure we aren't creating a cyclic loop
                const finalParentUserId = parentUserId === currentUser.id && formData.role === 'Master' ? null : parentUserId;
                const result = await createUserDirectly(formData, finalParentUserId as string);
                if (!result.success) throw new Error(result.error);
                toast.success(t('management.users.toast.successAdd'));
            }

            setShowAddModal(false);
            setEditingUser(null);
            fetchUsers();
            setFormData({ name: '', email: '', username: '', password: '', role: 'Operador', plan_id: '', access_group_id: '' });
        } catch (err: any) {
            toast.error(err.message || t('management.users.toast.errorProcess'));
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ active: !user.active })
                .eq('id', user.id);

            if (error) throw error;
            toast.success(t('management.users.toast.statusSuccess', { status: user.active ? t('management.users.inactive').toLowerCase() : t('management.users.active').toLowerCase() }));
            fetchUsers();
        } catch (err: any) {
            toast.error(t('management.users.toast.errorProcess'));
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        if (!isSuperAdmin) {
            toast.error(t('management.users.toast.unauthorized'));
            return;
        }
        try {
            const result = await deleteUserDirectly(userToDelete.id);
            if (!result.success) throw new Error(result.error);

            fetchUsers();
            toast.success(t('management.users.toast.successDelete'));
            setUserToDelete(null);
        } catch (err: any) {
            toast.error(err.message || t('management.users.toast.deleteError'));
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.username,
            username: user.username,
            password: '',
            role: user.role as any,
            plan_id: user.plan_id || '',
            access_group_id: user.access_group_id || ''
        });
        setShowAddModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('management.users.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight uppercase text-xs">{t('management.users.subtitle')}</p>
                </div>
                <div className="flex items-center gap-4">
                    {currentUser.role === 'Master' && (
                        <div className="relative group/filter z-50">
                            <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm text-sm font-bold text-slate-700 dark:text-slate-300">
                                <Filter size={16} className="text-amber-500" />
                                <select
                                    className="bg-transparent outline-none appearance-none pr-6 cursor-pointer"
                                    value={selectedClientId}
                                    onChange={e => setSelectedClientId(e.target.value)}
                                >
                                    <option value={currentUser.id}>{t('management.users.masterFilter.self')}</option>
                                    <optgroup label={t('management.users.masterFilter.clients')}>
                                        {clients.map(c => (
                                            <option key={c.id} value={c.id}>🏢 {c.name} ({c.username})</option>
                                        ))}
                                    </optgroup>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>
                    )}
                    {isSuperAdmin && (
                        <button
                            onClick={() => {
                                setEditingUser(null);
                                setFormData({ name: '', email: '', username: '', password: '', role: 'Operador', plan_id: '', access_group_id: '' });
                                setShowAddModal(true);
                            }}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                        >
                            <UserPlus size={20} /> {t('management.users.newUser')}
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[300px] space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{t('management.users.searchLabel')}</label>
                    <div className="relative">
                        <Mail className="absolute left-5 top-4.5 text-slate-300" size={18} />
                        <input
                            placeholder={t('management.users.searchPlaceholder')}
                            className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                </div>

                <div className="w-44 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{t('management.users.roleLabel')}</label>
                    <select
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer capitalize"
                        value={filters.role}
                        onChange={e => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="all">{t('management.users.allRoles')}</option>
                        <option value="Master">{t('management.users.roles.master')}</option>
                        <option value="Administrador">{t('management.users.roles.admin')}</option>
                        <option value="Operador">{t('management.users.roles.operator')}</option>
                        <option value="Estagiário">{t('management.users.roles.intern')}</option>
                    </select>
                </div>

                <div className="w-44 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{t('management.users.statusLabel')}</label>
                    <select
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all">{t('management.users.statusLabel')}</option>
                        <option value="active">{t('management.users.active')}</option>
                        <option value="inactive">{t('management.users.inactive')}</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {
                selectedUserIds.length > 0 && (
                    <div className="bg-indigo-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-6 group">
                        <div className="flex items-center gap-4 ml-4">
                            <CheckSquare className="text-indigo-200" size={24} />
                            <span className="font-black text-lg uppercase tracking-tight">{t('management.users.bulk.selected', { count: selectedUserIds.length })}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => handleBulkStatus(true)} className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all">{t('management.users.bulk.activate')}</button>
                            <button onClick={() => handleBulkStatus(false)} className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all">{t('management.users.bulk.deactivate')}</button>
                            <button onClick={handleBulkDelete} className="px-5 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
                                <Trash2 size={16} /> {t('management.users.bulk.delete')}
                            </button>
                        </div>
                    </div>
                )
            }

            <div className="bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                        <tr>
                            <th className="px-8 py-6 w-10 text-center">
                                <input
                                    type="checkbox"
                                    className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                    checked={selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors uppercase">
                                    {t('management.users.table.member')} {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </th>
                            <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('management.users.table.accessGroup')}</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center" onClick={() => handleSort('role')}>{t('management.users.table.role')}</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('management.users.table.status')}</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('management.users.table.controls')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {loading ? (
                            <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest opacity-50">{t('management.users.table.syncing')}</td></tr>
                        ) : paginatedUsers.length === 0 ? (
                            <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold italic opacity-30">{t('management.users.table.noUser')}</td></tr>
                        ) : paginatedUsers.map(u => (
                            <tr key={u.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all ${selectedUserIds.includes(u.id) ? 'bg-indigo-50/30 dark:bg-indigo-950/10' : ''}`}>
                                <td className="px-8 py-6 text-center">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                        checked={selectedUserIds.includes(u.id)}
                                        onChange={() => handleSelectUser(u.id)}
                                    />
                                </td>
                                <td className="px-4 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className="relative group/avatar">
                                            <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=6366f1&color=fff&bold=true`} className="w-12 h-12 rounded-2xl shadow-sm group-hover/avatar:scale-105 transition-transform" />
                                            {u.active && <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full" />}
                                        </div>
                                        <div>
                                            <p className="font-black text-slate-800 dark:text-white leading-tight uppercase tracking-tight">{u.name}</p>
                                            <p className="text-xs text-slate-400 font-medium">{u.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-6">
                                    {u.access_group_id ? (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl w-fit">
                                            <Shield size={12} className="text-indigo-600 dark:text-indigo-400" />
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase">
                                                {(() => {
                                                    const group = accessGroups.find(g => g.id === u.access_group_id);
                                                    if (!group) return loading ? t('common.loading') : 'Não Encontrado';
                                                    // @ts-ignore - name_loc might be typed based on other updates, we safely fallback
                                                    return group.name_loc?.[locale as any] || group.name_loc?.['pt'] || group.name;
                                                })()}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic opacity-50">{t('management.users.table.noGroup')}</span>
                                    )}
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-tight ${u.role === 'Master' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40' :
                                        u.role?.includes('Sócio') || u.role?.includes('Administrador') ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40' :
                                            u.role?.includes('Coordenador') || u.role?.includes('Sênior') ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/40' :
                                                u.role?.includes('Estagiário') || u.role?.includes('Paralegal') ? 'bg-violet-100 text-violet-600 dark:bg-violet-900/40' :
                                                    u.role?.includes('Financeiro') ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40' :
                                                        'bg-slate-100 text-slate-500 dark:bg-slate-800'
                                        }`}>
                                        {getRoleTranslation(u.role)}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${u.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {u.active ? t('management.users.active') : t('management.users.inactive')}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {isSuperAdmin || currentUser.id === u.id ? (
                                            <>
                                                {isSuperAdmin && (
                                                    <button onClick={() => handleToggleStatus(u)} className={`p-2 rounded-xl transition-all ${u.active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title={t('management.users.table.tooltips.toggleStatus')}><Radio size={20} /></button>
                                                )}
                                                <button onClick={() => openEditModal(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all" title={t('management.users.table.tooltips.edit')}><FileEdit size={20} /></button>
                                                {currentUser.id !== u.id && isSuperAdmin && (
                                                    <button onClick={() => setUserToDelete(u)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title={t('management.users.table.tooltips.delete')}><Trash2 size={20} /></button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic flex items-center justify-end px-2">{t('management.users.table.readOnly')}</div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 px-10 py-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{t('management.users.table.page', { current: currentPage, total: totalPages || 1 })}</p>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ChevronsLeft size={20} /></button>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ChevronLeft size={20} /></button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ChevronRight size={20} /></button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ChevronsRight size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Modal: Add/Edit User */}
            {
                showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-12 relative overflow-hidden">
                            <div className="mb-10 text-center">
                                <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-[1.5rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                                    <UserPlus size={32} />
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingUser ? t('management.users.modal.editTitle') : t('management.users.modal.addTitle')}</h2>
                                <p className="text-sm text-slate-500 font-medium uppercase tracking-tight">{t('management.users.modal.subtitle')}</p>
                            </div>

                            <form onSubmit={handleSaveUser} className="space-y-5">
                                <div className="relative">
                                    <UserIcon className="absolute left-5 top-5 text-slate-400" size={20} />
                                    <input ref={nameRef} required placeholder={t('management.users.modal.name')} className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white shadow-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-5 text-slate-400" size={20} />
                                    <input required type="email" placeholder={t('management.users.modal.email')} disabled={!!editingUser} className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white shadow-sm disabled:opacity-50" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value, username: e.target.value })} />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-5 top-5 text-slate-400" size={20} />
                                    <input required={!editingUser} type="password" placeholder={editingUser ? t('management.users.modal.passwordEdit') : t('management.users.modal.password')} className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white shadow-sm" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                                </div>

                                <div className="space-y-1.5 pb-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">{t('management.users.modal.role')}</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-5 top-5 text-slate-400" size={20} />
                                        <select
                                            disabled={!isSuperAdmin}
                                            className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white appearance-none cursor-pointer shadow-sm disabled:opacity-50"
                                            value={formData.role}
                                            onChange={e => {
                                                const selectedRoleName = e.target.value;
                                                const roleObj = roles.find(r => r.name === selectedRoleName);
                                                setFormData({
                                                    ...formData,
                                                    role: selectedRoleName as any,
                                                    access_group_id: roleObj ? roleObj.access_group_id : ''
                                                });
                                            }}
                                        >
                                            <option value="" disabled>{t('management.users.modal.selectRole')}</option>
                                            {/* Dynamic groupings based on Access Groups */}
                                            {accessGroups.map(group => {
                                                const groupRoles = roles.filter(r => r.access_group_id === group.id);
                                                if (groupRoles.length === 0) return null;
                                                return (
                                                    <optgroup key={group.id} label={group.name}>
                                                        {groupRoles.map(role => (
                                                            <option key={role.id} value={role.name}>{role.name}</option>
                                                        ))}
                                                    </optgroup>
                                                );
                                            })}
                                            {currentUser?.role === 'Master' && (
                                                <optgroup label={t('management.users.modal.globalSystem')}>
                                                    <option value="Master">{t('management.users.modal.godMode')}</option>
                                                </optgroup>
                                            )}
                                        </select>
                                        <ChevronDown className="absolute right-5 top-6 text-slate-400 pointer-events-none" size={16} />
                                    </div>
                                    {!isSuperAdmin && editingUser && (
                                        <p className="text-[9px] font-black uppercase tracking-widest text-amber-500 mt-2 ml-2 italic">
                                            {t('management.users.modal.roleRestriction')}
                                        </p>
                                    )}
                                    {formData.access_group_id && formData.role !== 'Master' && (
                                        <div className="flex items-center gap-2 mt-3 ml-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl w-fit animate-in fade-in slide-in-from-top-2">
                                            <Shield size={14} className="text-indigo-600 dark:text-indigo-400" />
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                                {t('management.users.modal.inherited', { name: accessGroups.find(g => g.id === formData.access_group_id)?.name })}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-4 pt-6">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">{t('management.users.modal.close')}</button>
                                    <button type="submit" className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all text-xs">{editingUser ? t('management.users.modal.submitEdit') : t('management.users.modal.submitAdd')}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Modal: Delete Confirmation */}
            {
                userToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
                        <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-12 text-center relative overflow-hidden">
                            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-6">
                                <ShieldAlert size={40} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">{t('management.users.delete.title')}</h2>
                            <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed uppercase tracking-tight">{t('management.users.delete.message', { name: userToDelete.name })}</p>
                            <div className="flex flex-col gap-3">
                                <button onClick={handleDeleteUser} className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all text-xs">{t('management.users.delete.confirm')}</button>
                                <button onClick={() => setUserToDelete(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">{t('management.users.delete.cancel')}</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserManagement;
