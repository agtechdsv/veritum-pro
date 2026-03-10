'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserPlus, Users, Trash2, Mail, User as UserIcon, Lock, FileEdit, Radio, ShieldAlert, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Package, Shield, Briefcase, ChevronDown, Filter, XCircle, X, Zap } from 'lucide-react';
import { User, AccessGroup, ModuleId, Role, TeamMember } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { createUserDirectly, updateUserDirectly, deleteUserDirectly, listUsersAction } from '@/app/actions/user-actions';
import { listTeamMembers, saveTeamMember, deleteTeamMember } from '@/app/actions/team-actions';
import { toast } from '../ui/toast';
import { useTranslation } from '@/contexts/language-context';

interface Props {
    currentUser: User;
}

const UserManagement: React.FC<Props> = ({ currentUser }) => {
    const { t, locale } = useTranslation();

    const maskCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .slice(0, 14);
    };

    const maskPhone = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{5})(\d)/, '$1-$2')
            .slice(0, 15);
    };

    const [roles, setRoles] = useState<Role[]>([]);

    const getRoleTranslation = (roleName: any) => {
        if (!roleName) return '';

        let normalizedSearchName = '';
        if (typeof roleName === 'object') {
            normalizedSearchName = (roleName[locale as keyof typeof roleName] || roleName.pt || '').toLowerCase();
        } else {
            normalizedSearchName = String(roleName).toLowerCase();
        }

        if (normalizedSearchName.includes('master')) return t('management.users.roles.master');
        if (normalizedSearchName.includes('administrador') || normalizedSearchName.includes('admin')) {
            if (normalizedSearchName.includes('sócio')) return t('management.users.roles.partnerAdmin');
            return t('management.users.roles.admin');
        }
        if (normalizedSearchName.includes('operador')) return t('management.users.roles.operator');
        if (normalizedSearchName.includes('estagiário')) return t('management.users.roles.intern');
        if (normalizedSearchName.includes('paralegal')) return t('management.users.roles.paralegal');
        if (normalizedSearchName.includes('sênior')) return t('management.users.roles.senior');
        if (normalizedSearchName.includes('coordenador')) return t('management.users.roles.coordinator');
        if (normalizedSearchName.includes('financeiro')) return t('management.users.roles.financial');

        // Dynamic search in roles state
        const dynamicRole = roles.find(r => {
            const rName = typeof r.name === 'object' ? (r.name.pt || '') : (r.name || '');
            const targetName = typeof roleName === 'object' ? (roleName.pt || '') : String(roleName);
            return rName.toLowerCase() === targetName.toLowerCase();
        });

        if (dynamicRole) {
            return (dynamicRole.name && typeof dynamicRole.name === 'object')
                ? ((dynamicRole.name as any)[locale] || (dynamicRole.name as any).pt || '')
                : (dynamicRole.name || String(roleName));
        }

        return typeof roleName === 'object' ? (roleName[locale] || roleName.pt || '') : String(roleName);
    };

    const [selectedClientId, setSelectedClientId] = useState<string>(currentUser.id);
    const [activeMainTab, setActiveMainTab] = useState<'users' | 'members'>('members');

    // Shared UI State
    const [loading, setLoading] = useState(true);
    const [plans, setPlans] = useState<any[]>([]);
    const [accessGroups, setAccessGroups] = useState<AccessGroup[]>([]);

    // Users State
    const [users, setUsers] = useState<User[]>([]);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);

    // Team Members State
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);

    const [showUnifiedModal, setShowUnifiedModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
    const [activeTab, setActiveTab] = useState<'basic' | 'professional'>('basic');

    const initialUnifiedData = {
        name: '',
        email: '',
        password: '',
        role: '',
        plan_id: '',
        access_group_id: '',
        cpf_cnpj: '',
        phone: '',
        specialty: '',
        oab_number: '',
        oab_uf: '',
        city: '',
        state: '',
        pix_key: '',
        notes: '',
        isSystemUser: false,
        is_active: true
    };

    const [unifiedFormData, setUnifiedFormData] = useState(initialUnifiedData);
    const [memberToDelete, setMemberToDelete] = useState<TeamMember | null>(null);

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

    useEffect(() => {
        if (currentUser.role === 'Master') {
            fetchClients();
        }
    }, [currentUser]);

    useEffect(() => {
        fetchUsers();
        fetchTeamMembers();
        fetchAccessGroups();
        fetchRoles();
    }, [selectedClientId, currentUser]);

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchClients = async () => {
        const { data } = await supabase
            .from('users')
            .select('id, name, email, role, active, plan_id')
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

    const fetchTeamMembers = async () => {
        setLoading(true);
        setTeamMembers([]); // Limpa a lista antes de buscar para evitar a "piscada" com dados anteriores
        const result = await listTeamMembers(currentUser.role === 'Master' ? selectedClientId : undefined);
        if (result.success && result.data) setTeamMembers(result.data);
        else setTeamMembers([]); // Garante que fique vazio em caso de erro ou sem BYODB
        setLoading(false);
    };

    useEffect(() => {
        if (showUnifiedModal) {
            // Aumentei o delay para focar apenas quando a gaveta já estiver quase parando
            setTimeout(() => {
                nameRef.current?.focus();
            }, 500);
        }
    }, [showUnifiedModal]);

    const fetchUsers = async () => {
        setLoading(true);
        const result = await listUsersAction(currentUser, selectedClientId);
        if (result.success && result.data) setUsers(result.data as User[]);
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

    const sortedMembers = [...teamMembers].sort((a, b) => {
        if (!sortConfig) return 0;
        const { key, direction } = sortConfig;

        let aVal = a[key as keyof TeamMember] as any;
        let bVal = b[key as keyof TeamMember] as any;

        if (key === 'name') {
            aVal = a.full_name;
            bVal = b.full_name;
        }

        if (aVal < bVal) return direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return direction === 'asc' ? 1 : -1;
        return 0;
    });

    const filteredUsers = sortedUsers.filter(u => {
        const uName = typeof u.name === 'object' ? ((u.name as any).pt || (u.name as any).en || (u.name as any).es || '') : (u.name || '');
        const matchesSearch = uName.toLowerCase().includes(filters.search.toLowerCase()) ||
            (u.email || '').toLowerCase().includes(filters.search.toLowerCase());
        const matchesRole = filters.role === 'all' || u.role === filters.role;
        const matchesStatus = filters.status === 'all' ||
            (filters.status === 'active' ? u.active : !u.active);
        const matchesAdmin = filters.admin === 'all' || u.parent_user_id === filters.admin;

        return matchesSearch && matchesRole && matchesStatus && matchesAdmin;
    });

    const filteredMembers = sortedMembers.filter(m => {
        const matchesSearch = (m.full_name || '').toLowerCase().includes(filters.search.toLowerCase()) ||
            (m.email || '').toLowerCase().includes(filters.search.toLowerCase());
        const matchesStatus = filters.status === 'all' ||
            (filters.status === 'active' ? m.is_active : !m.is_active);

        return matchesSearch && matchesStatus;
    });

    // Pagination Logic
    const totalItems = activeMainTab === 'users' ? filteredUsers.length : filteredMembers.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);
    const paginatedMembers = filteredMembers.slice(startIndex, startIndex + itemsPerPage);

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

    const handleSaveUnified = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            // Determinar o ID do "Pai" (Dono/Empresa) para o Banco Master
            const parentId = currentUser.role === 'Master' ? selectedClientId : (currentUser.parent_user_id || currentUser.id);

            // Campos comuns entre os dois modelos para garantir consistência
            const commonData = {
                name: unifiedFormData.name,
                email: unifiedFormData.email,
                role: unifiedFormData.role,
                phone: unifiedFormData.phone,
                cpf_cnpj: unifiedFormData.cpf_cnpj,
                is_active: unifiedFormData.is_active
            };

            // 1. Payload para Equipe (Banco do Cliente - CRM)
            // Buscar ID do integrante se ele já existir (evita duplicidade ao salvar vindo da lista de Usuários)
            let finalMemberId = editingMember?.id;
            if (!finalMemberId) {
                const foundMember = teamMembers.find(m => m.email?.toLowerCase() === commonData.email.toLowerCase());
                if (foundMember) finalMemberId = foundMember.id;
            }

            const teamPayload = {
                id: finalMemberId,
                full_name: commonData.name,
                email: commonData.email,
                role: commonData.role,
                phone: commonData.phone,
                cpf: commonData.cpf_cnpj,
                is_active: commonData.is_active,
                specialty: unifiedFormData.specialty,
                oab_number: unifiedFormData.oab_number,
                oab_uf: unifiedFormData.oab_uf,
                city: unifiedFormData.city,
                state: unifiedFormData.state,
                pix_key: unifiedFormData.pix_key,
                notes: unifiedFormData.notes
            };

            const memberResult = await saveTeamMember(
                teamPayload,
                currentUser.role === 'Master' ? selectedClientId : undefined
            );

            if (!memberResult.success) throw new Error('Erro ao salvar integrante na equipe');

            // 2. Orquestração com o Banco Master (Usuário do Sistema)
            const existingUser = users.find(u => u.email && u.email.toLowerCase() === commonData.email.toLowerCase());

            if (unifiedFormData.isSystemUser) {
                // Determinar o plan_id do "Pai" (Sócio Administrativo)
                // Se for Master, pega do cliente selecionado. Se for Admin, pega do próprio currentUser.
                // Fallback robusto: se não achar no currentUser, tenta achar na lista de usuários o registro do pai
                const parentPlanId = currentUser.role === 'Master'
                    ? clients.find(c => c.id === selectedClientId)?.plan_id
                    : (currentUser.plan_id || users.find(u => u.id === currentUser.id)?.plan_id || users.find(u => u.id === currentUser.parent_user_id)?.plan_id);

                const userPayload = {
                    name: commonData.name,
                    email: commonData.email,
                    password: unifiedFormData.password,
                    role: commonData.role,
                    phone: commonData.phone,
                    cpf_cnpj: commonData.cpf_cnpj,
                    parent_user_id: parentId,
                    active: commonData.is_active,
                    plan_id: parentPlanId || unifiedFormData.plan_id,
                    access_group_id: unifiedFormData.access_group_id
                };

                if (existingUser) {
                    await updateUserDirectly(existingUser.id, userPayload);
                } else {
                    if (!unifiedFormData.password) throw new Error('Senha é obrigatória para novos usuários');
                    await createUserDirectly(userPayload, parentId);
                }
            } else if (existingUser && existingUser.active) {
                // Se o acesso foi removido mas o usuário existe e está ativo, desativamos no Master
                await updateUserDirectly(existingUser.id, {
                    ...existingUser,
                    active: false
                });
            }

            toast.success('Integrante salvo com sucesso!');
            setShowUnifiedModal(false);
            setUnifiedFormData(initialUnifiedData);
            setEditingMember(null);
            fetchUsers();
            fetchTeamMembers();
        } catch (err: any) {
            toast.error(err.message || 'Erro ao processar salvamento');
        } finally {
            setIsSaving(false);
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

    const handleDeleteMember = async () => {
        if (!memberToDelete) return;
        try {
            const result = await deleteTeamMember(memberToDelete.id, currentUser.role === 'Master' ? selectedClientId : undefined);
            if (result.success) {
                toast.success('Membro excluído!');
                fetchTeamMembers();
                setMemberToDelete(null);
            } else {
                throw new Error(result.error);
            }
        } catch (err: any) {
            toast.error(err.message || 'Erro ao excluir membro');
        }
    };

    const openEditMemberModal = (member: TeamMember) => {
        const correspondingUser = users.find(u => u.email && u.email.toLowerCase() === member.email?.toLowerCase());

        setEditingMember(member);
        setUnifiedFormData({
            ...initialUnifiedData,
            name: member.full_name || '',
            email: member.email || '',
            phone: member.phone || '',
            role: member.role || '',
            cpf_cnpj: member.cpf || '',
            specialty: member.specialty || '',
            oab_number: member.oab_number || '',
            oab_uf: member.oab_uf || '',
            city: member.city || '',
            state: member.state || '',
            pix_key: member.pix_key || '',
            notes: member.notes || '',
            is_active: member.is_active,
            isSystemUser: !!correspondingUser,
            plan_id: correspondingUser?.plan_id || '',
            access_group_id: correspondingUser?.access_group_id || ''
        });
        setActiveTab('basic');
        setShowUnifiedModal(true);
    };

    const openEditModal = (user: User) => {
        setEditingMember(null); // Not editing a team member directly
        setUnifiedFormData({
            ...initialUnifiedData,
            name: typeof user.name === 'object' ? ((user.name as any).pt || (user.name as any).en || '') : (user.name || ''),
            email: user.email || '',
            password: '', // Password should not be pre-filled for security
            role: user.role as any,
            plan_id: user.plan_id || '',
            access_group_id: user.access_group_id || '',
            cpf_cnpj: user.cpf_cnpj || '',
            phone: user.phone || '',
            isSystemUser: true, // This is definitely a system user
            is_active: user.active
        });
        setActiveTab('basic');
        setShowUnifiedModal(true);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('management.users.title')}</h1>
                        <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight uppercase text-xs">{t('management.users.subtitle')}</p>
                    </div>

                    {isSuperAdmin && (
                        <button
                            onClick={() => {
                                setEditingMember(null);
                                setUnifiedFormData(initialUnifiedData);
                                setActiveTab('basic');
                                setShowUnifiedModal(true);
                            }}
                            className="bg-indigo-600 text-white px-6 py-2.5 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer text-sm"
                        >
                            <UserPlus size={18} /> Novo Integrante
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    {currentUser.role === 'Master' && (
                        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pl-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                            <div className="flex flex-col items-end">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">Contexto Master</span>
                                <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">Selecione o Cliente</span>
                            </div>
                            <div className="relative">
                                <select
                                    className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-xs font-black tracking-widest text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer min-w-[260px] appearance-none pr-10"
                                    value={selectedClientId}
                                    onChange={e => setSelectedClientId(e.target.value)}
                                >
                                    <option value="">--- Selecione um Cliente ---</option>
                                    <option value={currentUser.id}>Meu Contexto Mestre</option>
                                    <optgroup label={t('management.users.masterFilter.clients')?.toUpperCase() || 'CLIENTES (SÓCIOS ADM)'}>
                                        {clients.map(c => {
                                            const rawName = typeof c.name === 'object' ? ((c.name as any).pt || (c.name as any).en || '') : (c.name || '');
                                            const formattedName = rawName.toLowerCase().split(' ').map((word: string) => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
                                            const formattedEmail = (c.email || '').toLowerCase();
                                            return (
                                                <option key={c.id} value={c.id}>
                                                    🏢 {formattedName} ({formattedEmail})
                                                </option>
                                            );
                                        })}
                                    </optgroup>
                                </select>
                                <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Removed Tab Switcher for unified view */}

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
                                />
                            </th>
                            <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer group" onClick={() => handleSort('name')}>
                                <div className="flex items-center gap-1 group-hover:text-indigo-600 transition-colors uppercase">
                                    {t('management.users.table.member')} {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </th>
                            <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargo / Especialidade</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Contato</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">{t('management.users.table.status')}</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">{t('management.users.table.controls')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {loading ? (
                            <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest opacity-50">{t('management.users.table.syncing')}</td></tr>
                        ) : (
                            paginatedMembers.length === 0 ? (
                                <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold italic opacity-30">Nenhum membro da equipe cadastrado.</td></tr>
                            ) : paginatedMembers.map(m => (
                                <tr key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-all border-b border-slate-100 dark:border-slate-800/50">
                                    <td className="px-8 py-6 text-center">
                                        <input type="checkbox" className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 cursor-pointer" />
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex items-center gap-4">
                                            {(() => {
                                                const linkedUser = users.find(u => u.email?.toLowerCase() === m.email?.toLowerCase());
                                                return (
                                                    <>
                                                        <div className="relative group/avatar">
                                                            <img
                                                                src={linkedUser?.avatar_url || `https://ui-avatars.com/api/?name=${m.full_name}&background=6366f1&color=fff&bold=true`}
                                                                className="w-12 h-12 rounded-2xl shadow-sm group-hover/avatar:scale-105 transition-transform"
                                                                alt={m.full_name}
                                                            />
                                                            {linkedUser && (
                                                                <div
                                                                    className={`absolute -top-1 -right-1 w-3.5 h-3.5 ${linkedUser.active ? 'bg-emerald-500' : 'bg-slate-400'} border-2 border-white dark:border-slate-900 rounded-full shadow-sm`}
                                                                    title={linkedUser.active ? "Usuário do Sistema ativo" : "Acesso ao Sistema suspenso"}
                                                                />
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-800 dark:text-white uppercase leading-tight tracking-tight">{m.full_name}</p>
                                                            <p className="text-xs text-slate-400 font-medium">{m.email}</p>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </td>
                                    <td className="px-4 py-6">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest leading-none">
                                                {getRoleTranslation(m.role) || 'Geral'}
                                            </span>
                                            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-tighter italic">
                                                {m.specialty} {m.oab_number ? `| OAB: ${m.oab_number}/${m.oab_uf}` : ''}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <p className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase tracking-tighter">{m.phone || '-'}</p>
                                    </td>
                                    <td className="px-8 py-6 text-center">
                                        <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${m.is_active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                            <div className={`w-1.5 h-1.5 rounded-full ${m.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                            {m.is_active ? 'Ativo' : 'Inativo'}
                                        </div>
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <button onClick={() => openEditMemberModal(m)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all" title="Editar"><FileEdit size={20} /></button>
                                            <button onClick={() => setMemberToDelete(m)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Excluir"><Trash2 size={20} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
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

            {/* Unified Drawer: Integration Management */}
            <AnimatePresence>
                {showUnifiedModal && (
                    <div className="fixed inset-0 z-[100] flex justify-end overflow-hidden">
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-slate-950/40 backdrop-blur-sm"
                            onClick={() => { if (!isSaving) setShowUnifiedModal(false); }}
                        />

                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 38, stiffness: 220, mass: 1 }}
                            className="relative w-full max-w-2xl bg-white dark:bg-slate-900 shadow-[-30px_0_70px_-15px_rgba(0,0,0,0.3)] h-full flex flex-col border-l border-slate-200 dark:border-slate-800 overflow-hidden p-0"
                        >
                            {/* Header */}
                            <div className="p-8 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/50 dark:bg-slate-800/50">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                                            {editingMember ? 'Editar Integrante' : 'Novo Integrante'}
                                        </h2>
                                        <p className="text-slate-500 dark:text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Gestão Unificada de Equipe e Acesso</p>
                                    </div>
                                    <button
                                        onClick={() => setShowUnifiedModal(false)}
                                        className="p-3 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all"
                                    >
                                        <XCircle size={28} />
                                    </button>
                                </div>
                            </div>

                            {/* Navigation Tabs */}
                            <div className="px-8 pt-6 shrink-0">
                                <div className="flex bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-[2rem] w-80">
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('basic')}
                                        className={`flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'basic' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Básico
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('professional')}
                                        className={`flex-1 px-4 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'professional' ? 'bg-white dark:bg-slate-900 text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-slate-500 hover:text-slate-700'}`}
                                    >
                                        Profissional
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSaveUnified} className="flex-1 flex flex-col overflow-hidden">
                                <div className="flex-1 overflow-y-auto p-10 no-scrollbar space-y-8">
                                    {activeTab === 'basic' && (
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nome Completo</label>
                                                <div className="relative">
                                                    <UserIcon className="absolute left-5 top-5 text-slate-300" size={20} />
                                                    <input ref={nameRef} required className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white transition-all" value={unifiedFormData.name} onChange={e => setUnifiedFormData({ ...unifiedFormData, name: e.target.value })} placeholder="Ex: João da Silva" />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">E-mail Principal</label>
                                                <div className="relative">
                                                    <Mail className="absolute left-5 top-5 text-slate-300" size={20} />
                                                    <input required type="email" className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white transition-all" value={unifiedFormData.email} onChange={e => setUnifiedFormData({ ...unifiedFormData, email: e.target.value })} placeholder="exemplo@veritum.com" />
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">CPF / CNPJ</label>
                                                    <div className="relative">
                                                        <ShieldCheck className="absolute left-5 top-5 text-slate-300" size={20} />
                                                        <input className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white transition-all" value={unifiedFormData.cpf_cnpj} onChange={e => setUnifiedFormData({ ...unifiedFormData, cpf_cnpj: maskCPF(e.target.value) })} placeholder="000.000.000-00" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Telefone</label>
                                                    <input className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white transition-all" value={unifiedFormData.phone} onChange={e => setUnifiedFormData({ ...unifiedFormData, phone: maskPhone(e.target.value) })} placeholder="(00) 00000-0000" />
                                                </div>
                                            </div>

                                            <div className="pt-4 space-y-6">
                                                <div className="p-6 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/50 rounded-3xl flex items-center justify-between group">
                                                    <div className="flex items-center gap-4">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${unifiedFormData.isSystemUser ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}>
                                                            <Lock size={18} />
                                                        </div>
                                                        <div>
                                                            <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight text-xs">Liberar Acesso ao Sistema</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Transformar integrante em usuário</p>
                                                        </div>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => setUnifiedFormData({ ...unifiedFormData, isSystemUser: !unifiedFormData.isSystemUser })}
                                                        className={`w-12 h-7 rounded-full relative transition-all ${unifiedFormData.isSystemUser ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                                    >
                                                        <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-md transition-all ${unifiedFormData.isSystemUser ? 'left-6' : 'left-1'}`} />
                                                    </button>
                                                </div>

                                                {unifiedFormData.isSystemUser && (
                                                    <div className="space-y-2 animate-in zoom-in-95 duration-300">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Senha Temporária</label>
                                                        <div className="relative">
                                                            <Lock className="absolute left-5 top-5 text-slate-300" size={20} />
                                                            <input type="password" required={!editingMember} className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white transition-all" value={unifiedFormData.password} onChange={e => setUnifiedFormData({ ...unifiedFormData, password: e.target.value })} placeholder="••••••••" />
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {activeTab === 'professional' && (
                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cargo / Função do Sistema</label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-5 top-5 text-slate-300" size={20} />
                                                    <select
                                                        className="w-full pl-14 pr-12 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white appearance-none cursor-pointer transition-all"
                                                        value={unifiedFormData.role}
                                                        onChange={e => {
                                                            const roleValue = e.target.value;
                                                            const selectedRole = roles.find(r => {
                                                                const rValue = r.name && typeof r.name === 'object' ? r.name.pt : r.name;
                                                                return rValue === roleValue;
                                                            });
                                                            setUnifiedFormData({
                                                                ...unifiedFormData,
                                                                role: roleValue,
                                                                access_group_id: selectedRole?.access_group_id || unifiedFormData.access_group_id
                                                            });
                                                        }}
                                                    >
                                                        <option value="" disabled>Selecione o Cargo</option>
                                                        {accessGroups.map(group => {
                                                            const groupRoles = roles.filter(r => r.access_group_id === group.id);
                                                            if (groupRoles.length === 0) return null;
                                                            const gName = group.name && typeof group.name === 'object' ? (group.name[locale as keyof typeof group.name] || group.name.pt || '') : (group.name || '');
                                                            return (
                                                                <optgroup key={group.id} label={gName}>
                                                                    {groupRoles.map(role => {
                                                                        const rName = role.name && typeof role.name === 'object' ? (role.name[locale as keyof typeof role.name] || role.name.pt || '') : (role.name || '');
                                                                        const rValue = role.name && typeof role.name === 'object' ? role.name.pt : role.name;
                                                                        return <option key={role.id} value={rValue}>{rName}</option>;
                                                                    })}
                                                                </optgroup>
                                                            );
                                                        })}
                                                    </select>
                                                    <ChevronDown className="absolute right-5 top-6 text-slate-400 pointer-events-none" size={16} />
                                                </div>
                                            </div>

                                            {unifiedFormData.isSystemUser && (
                                                <div className="space-y-2 animate-in fade-in duration-500">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Grupo de Acesso (Automático)</label>
                                                    <div className="relative">
                                                        <Shield className="absolute left-5 top-5 text-indigo-400" size={20} />
                                                        <div className="w-full pl-14 pr-6 py-5 bg-indigo-50/30 dark:bg-indigo-900/10 border border-indigo-100/50 dark:border-indigo-800/30 rounded-3xl font-bold text-slate-600 dark:text-slate-300">
                                                            {(() => {
                                                                const group = accessGroups.find(g => g.id === unifiedFormData.access_group_id);
                                                                if (!group) return "Nenhum grupo vinculado ao cargo";
                                                                return typeof group.name === 'object' ? (group.name[locale as keyof typeof group.name] || group.name.pt || '') : (group.name || '');
                                                            })()}
                                                        </div>
                                                    </div>
                                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest ml-2 italic">
                                                        As permissões são definidas com base no Grupo de Acesso vinculado ao cargo selecionado.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Especialidade</label>
                                                    <div className="relative">
                                                        <Package className="absolute left-5 top-5 text-slate-300" size={20} />
                                                        <select className="w-full pl-14 pr-12 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white appearance-none cursor-pointer transition-all" value={unifiedFormData.specialty} onChange={e => setUnifiedFormData({ ...unifiedFormData, specialty: e.target.value })}>
                                                            <option value="" disabled>Selecione a Especialidade</option>
                                                            {['Cível', 'Trabalhista', 'Tributário', 'Penal', 'Previdenciário', 'Administrativo', 'Família e Sucessões', 'Empresarial', 'Imobiliário', 'Propriedade Intelectual', 'Ambiental', 'Digital / LGPD', 'Outros'].map(area => (<option key={area} value={area}>{area}</option>))}
                                                        </select>
                                                        <ChevronDown className="absolute right-5 top-6 text-slate-400 pointer-events-none" size={16} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nº OAB</label>
                                                    <div className="relative">
                                                        <Shield className="absolute left-5 top-5 text-slate-300" size={20} />
                                                        <input className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white transition-all" value={unifiedFormData.oab_number} onChange={e => setUnifiedFormData({ ...unifiedFormData, oab_number: e.target.value })} placeholder="Nº da Inscrição" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">UF OAB</label>
                                                    <div className="relative">
                                                        <select className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white appearance-none cursor-pointer transition-all" value={unifiedFormData.oab_uf} onChange={e => setUnifiedFormData({ ...unifiedFormData, oab_uf: e.target.value })}>
                                                            <option value="" disabled>UF</option>
                                                            {['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'].map(uf => (<option key={uf} value={uf}>{uf}</option>))}
                                                        </select>
                                                        <ChevronDown className="absolute right-5 top-6 text-slate-400 pointer-events-none" size={16} />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Chave PIX</label>
                                                    <input className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white transition-all" value={unifiedFormData.pix_key} onChange={e => setUnifiedFormData({ ...unifiedFormData, pix_key: e.target.value })} placeholder="Email, CPF ou Chave" />
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Observações Internas</label>
                                        <textarea className="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600/20 outline-none text-slate-800 dark:text-white transition-all min-h-[100px]" value={unifiedFormData.notes} onChange={e => setUnifiedFormData({ ...unifiedFormData, notes: e.target.value })} placeholder="Qualificações, notas, etc." />
                                    </div>
                                </div>

                                <div className="p-8 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex items-center justify-end gap-4 shrink-0">
                                    <button type="button" onClick={() => setShowUnifiedModal(false)} className="px-8 py-4 text-slate-500 font-bold uppercase text-[10px] tracking-[0.2em] hover:text-slate-700 transition-all">Cancelar</button>
                                    <button type="submit" disabled={isSaving} className="bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50">
                                        {isSaving ? <><Radio className="animate-pulse" size={16} /> Salvando...</> : <><Zap size={16} /> Salvar Integrante</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal: Delete Member Confirmation */}
            {
                memberToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setMemberToDelete(null)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mb-8 mx-auto">
                                <Trash2 size={40} className="text-rose-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white text-center uppercase tracking-tighter mb-4">Excluir Membro?</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center font-medium mb-10">Você está prestes a excluir <span className="text-slate-800 dark:text-white font-bold">{memberToDelete.full_name}</span>. Esta ação não pode ser desfeita.</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setMemberToDelete(null)} className="py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">Cancelar</button>
                                <button onClick={handleDeleteMember} className="bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 transition-all">Excluir</button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Modal: Delete Confirmation User */}
            {
                userToDelete && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-500" onClick={() => setUserToDelete(null)} />
                        <div className="relative bg-white dark:bg-slate-900 w-full max-w-md p-10 rounded-[3rem] shadow-2xl animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-rose-50 dark:bg-rose-900/20 rounded-[2rem] flex items-center justify-center mb-8 mx-auto">
                                <Trash2 size={40} className="text-rose-500" />
                            </div>
                            <h3 className="text-2xl font-black text-slate-800 dark:text-white text-center uppercase tracking-tighter mb-4">{t('management.users.modals.delete.title')}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-center font-medium mb-10">{t('management.users.modals.delete.description', { name: typeof userToDelete.name === 'object' ? ((userToDelete.name as any).pt || '') : (userToDelete.name || '') })}</p>
                            <div className="grid grid-cols-2 gap-4">
                                <button onClick={() => setUserToDelete(null)} className="py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">{t('common.cancel')}</button>
                                <button onClick={handleDeleteUser} className="bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-rose-500/20 hover:scale-105 transition-all">{t('common.delete')}</button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};

export default UserManagement;
