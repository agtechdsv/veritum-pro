'use client'

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, User as UserIcon, Lock, FileEdit, Radio, ShieldAlert, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Package, Shield, Briefcase, ChevronDown } from 'lucide-react';
import { User, AccessGroup, ModuleId, Role } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { createUserDirectly, updateUserDirectly, deleteUserDirectly } from '@/app/actions/user-actions';
import { toast } from '../ui/toast';

interface Props {
    currentUser: User;
}

const UserManagement: React.FC<Props> = ({ currentUser }) => {
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

    useEffect(() => {
        fetchUsers();
        fetchPlans();
        fetchAccessGroups();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        let query = supabase.from('roles').select('*');

        const isAdmin = ['Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(currentUser.role);

        if (isAdmin) {
            const adminIds = [currentUser.id];
            if (currentUser.parent_user_id) adminIds.push(currentUser.parent_user_id);
            query = query.in('admin_id', adminIds);
        } else if (currentUser.role !== 'Master') {
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

        // Scope optimization: Master sees all, Admins see their own + parent (who created them)
        if (isAdmin) {
            const adminIds = [currentUser.id];
            if (currentUser.parent_user_id) adminIds.push(currentUser.parent_user_id);
            query = query.in('admin_id', adminIds);
        } else if (currentUser.role !== 'Master') {
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
        if (isAdmin) {
            query = query.or(`id.eq.${currentUser.id},parent_user_id.eq.${currentUser.id}`);
        } else if (currentUser.role !== 'Master') {
            if (currentUser.parent_user_id) {
                // Anyone below Admin sees themselves, their peers (same parent), and the Admin (parent)
                query = query.or(`id.eq.${currentUser.id},parent_user_id.eq.${currentUser.parent_user_id},id.eq.${currentUser.parent_user_id}`);
            } else {
                query = query.eq('id', currentUser.id);
            }
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
            toast.success(`${selectedUserIds.length} usuários ${active ? 'ativados' : 'desativados'} com sucesso.`);
            setSelectedUserIds([]);
            fetchUsers();
        } catch (err: any) {
            toast.error('Erro ao processar ação em massa.');
        } finally {
            setBulkLoading(false);
        }
    };

    const handleBulkDelete = async () => {
        if (selectedUserIds.length === 0) return;
        if (!confirm(`Tem certeza que deseja excluir ${selectedUserIds.length} usuários? Esta ação é irreversível.`)) return;

        setBulkLoading(true);
        try {
            const deletePromises = selectedUserIds.map(id => deleteUserDirectly(id));
            await Promise.all(deletePromises);

            toast.success(`${selectedUserIds.length} usuários removidos com sucesso.`);
            setSelectedUserIds([]);
            fetchUsers();
        } catch (err: any) {
            toast.error('Erro ao excluir usuários.');
        } finally {
            setBulkLoading(false);
        }
    };

    const admins = users.filter(u => u.role === 'Administrador');

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (currentUser.role === 'Operador' && formData.role === 'Administrador') {
            toast.error('Operadores não podem atribuir nível Admin.');
            return;
        }

        try {
            if (editingUser) {
                const result = await updateUserDirectly(editingUser.id, formData);
                if (!result.success) throw new Error(result.error);
                toast.success('Usuário atualizado com sucesso!');
            } else {
                const parentUserId = currentUser.parent_user_id || currentUser.id;
                const result = await createUserDirectly(formData, parentUserId);
                if (!result.success) throw new Error(result.error);
                toast.success('Usuário cadastrado com sucesso!');
            }

            setShowAddModal(false);
            setEditingUser(null);
            fetchUsers();
            setFormData({ name: '', email: '', username: '', password: '', role: 'Operador', plan_id: '', access_group_id: '' });
        } catch (err: any) {
            toast.error(err.message || 'Erro ao processar usuário');
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ active: !user.active })
                .eq('id', user.id);

            if (error) throw error;
            toast.success(`Usuário ${user.active ? 'desativado' : 'ativado'} com sucesso!`);
            fetchUsers();
        } catch (err: any) {
            toast.error('Erro ao alterar status');
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            const result = await deleteUserDirectly(userToDelete.id);
            if (!result.success) throw new Error(result.error);

            fetchUsers();
            toast.success('Usuário removido com sucesso.');
            setUserToDelete(null);
        } catch (err: any) {
            toast.error(err.message || 'Erro ao excluir usuário.');
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
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Gestão de Usuários</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight uppercase text-xs">Administre quem acessa seu ecossistema.</p>
                </div>
                {currentUser.role !== 'Operador' && (
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({ name: '', email: '', username: '', password: '', role: 'Operador', plan_id: '', access_group_id: '' });
                            setShowAddModal(true);
                        }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <UserPlus size={20} /> Novo Usuário
                    </button>
                )}
            </div>

            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-6 items-end">
                <div className="flex-1 min-w-[300px] space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Buscar Integrante</label>
                    <div className="relative">
                        <Mail className="absolute left-5 top-4.5 text-slate-300" size={18} />
                        <input
                            placeholder="Nome ou e-mail..."
                            className="w-full pl-14 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                </div>

                <div className="w-44 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Role/Nível</label>
                    <select
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer capitalize"
                        value={filters.role}
                        onChange={e => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="all">Todos</option>
                        <option value="Master">Master</option>
                        <option value="Administrador">Administrador</option>
                        <option value="Operador">Operador</option>
                        <option value="Estagiário">Estagiário</option>
                    </select>
                </div>

                <div className="w-44 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Status</label>
                    <select
                        className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all">Filtro Status</option>
                        <option value="active">Ativos</option>
                        <option value="inactive">Inativos</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions */}
            {selectedUserIds.length > 0 && (
                <div className="bg-indigo-600 text-white p-6 rounded-3xl flex items-center justify-between shadow-2xl animate-in slide-in-from-bottom-6 group">
                    <div className="flex items-center gap-4 ml-4">
                        <CheckSquare className="text-indigo-200" size={24} />
                        <span className="font-black text-lg uppercase tracking-tight">{selectedUserIds.length} selecionados</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => handleBulkStatus(true)} className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all">Ativar</button>
                        <button onClick={() => handleBulkStatus(false)} className="px-5 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-[10px] font-black uppercase transition-all">Desativar</button>
                        <button onClick={handleBulkDelete} className="px-5 py-3 bg-rose-500 hover:bg-rose-600 rounded-xl text-[10px] font-black uppercase transition-all flex items-center gap-2">
                            <Trash2 size={16} /> Excluir
                        </button>
                    </div>
                </div>
            )}

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
                                    Integrante {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </th>
                            <th className="px-4 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Grupo de Acesso</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center" onClick={() => handleSort('role')}>Role</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Controles</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                        {loading ? (
                            <tr><td colSpan={6} className="py-20 text-center text-slate-300 font-bold uppercase tracking-widest opacity-50">Sincronizando Ecossistema...</td></tr>
                        ) : paginatedUsers.length === 0 ? (
                            <tr><td colSpan={6} className="py-20 text-center text-slate-400 font-bold italic opacity-30">Nenhum integrante encontrado.</td></tr>
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
                                                {accessGroups.find(g => g.id === u.access_group_id)?.name || (loading ? 'Carregando...' : 'Não Encontrado')}
                                            </span>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-300 font-bold uppercase tracking-widest italic opacity-50">Sem Grupo</span>
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
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-8 py-6 text-center">
                                    <div className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${u.active ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-100 text-slate-400 dark:bg-slate-800'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {u.active ? 'Ativo' : 'Inativo'}
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        {currentUser.role !== 'Operador' || currentUser.id === u.id ? (
                                            <>
                                                {currentUser.role !== 'Operador' && (
                                                    <button onClick={() => handleToggleStatus(u)} className={`p-2 rounded-xl transition-all ${u.active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`} title="Alternar Status"><Radio size={20} /></button>
                                                )}
                                                <button onClick={() => openEditModal(u)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-xl transition-all" title="Editar"><FileEdit size={20} /></button>
                                                {currentUser.id !== u.id && currentUser.role !== 'Operador' && (
                                                    <button onClick={() => setUserToDelete(u)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all" title="Excluir"><Trash2 size={20} /></button>
                                                )}
                                            </>
                                        ) : (
                                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest italic flex items-center justify-end px-2">Apenas Leitura</div>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination */}
                <div className="bg-slate-50/50 dark:bg-slate-800/20 px-10 py-6 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Página {currentPage} de {totalPages || 1}</p>
                    <div className="flex gap-2">
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(1)} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ChevronsLeft size={20} /></button>
                        <button disabled={currentPage === 1} onClick={() => setCurrentPage(prev => prev - 1)} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ChevronLeft size={20} /></button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(prev => prev + 1)} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ChevronRight size={20} /></button>
                        <button disabled={currentPage === totalPages || totalPages === 0} onClick={() => setCurrentPage(totalPages)} className="p-2 text-slate-400 hover:text-indigo-600 disabled:opacity-20 transition-all"><ChevronsRight size={20} /></button>
                    </div>
                </div>
            </div>

            {/* Modal: Add/Edit User */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-12 relative overflow-hidden">
                        <div className="mb-10 text-center">
                            <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/40 rounded-[1.5rem] flex items-center justify-center text-indigo-600 dark:text-indigo-400 mx-auto mb-4">
                                <UserPlus size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{editingUser ? 'Atualizar Dados' : 'Novo Integrante'}</h2>
                            <p className="text-sm text-slate-500 font-medium uppercase tracking-tight">Configure as credenciais e o nível de acesso.</p>
                        </div>

                        <form onSubmit={handleSaveUser} className="space-y-5">
                            <div className="relative">
                                <UserIcon className="absolute left-5 top-5 text-slate-400" size={20} />
                                <input ref={nameRef} required placeholder="Nome Completo" className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white shadow-sm" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-5 top-5 text-slate-400" size={20} />
                                <input required type="email" placeholder="E-mail / Login" disabled={!!editingUser} className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white shadow-sm disabled:opacity-50" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value, username: e.target.value })} />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-5 top-5 text-slate-400" size={20} />
                                <input required={!editingUser} type="password" placeholder={editingUser ? "Trocar Senha (Opcional)" : "Senha Inicial"} className="w-full pl-14 pr-6 py-5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl font-bold focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white shadow-sm" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
                            </div>

                            <div className="space-y-1.5 pb-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Cargo / Função Corporativa</label>
                                <div className="relative">
                                    <Briefcase className="absolute left-5 top-5 text-slate-400" size={20} />
                                    <select
                                        disabled={currentUser.role === 'Operador'}
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
                                        <option value="" disabled>Selecione um Cargo...</option>
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
                                            <optgroup label="Sistema Global">
                                                <option value="Master">Super Master (Deus)</option>
                                            </optgroup>
                                        )}
                                    </select>
                                    <ChevronDown className="absolute right-5 top-6 text-slate-400 pointer-events-none" size={16} />
                                </div>
                                {formData.access_group_id && formData.role !== 'Master' && (
                                    <div className="flex items-center gap-2 mt-3 ml-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 rounded-xl w-fit animate-in fade-in slide-in-from-top-2">
                                        <Shield size={14} className="text-indigo-600 dark:text-indigo-400" />
                                        <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                            Permissões herdadas do Grupo: {accessGroups.find(g => g.id === formData.access_group_id)?.name}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-8 py-5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">Fechar</button>
                                <button type="submit" className="flex-[2] px-8 py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-600/30 transition-all text-xs">{editingUser ? 'Salvar Edição' : 'Finalizar Cadastro'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal: Delete Confirmation */}
            {userToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-12 text-center relative overflow-hidden">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-6">
                            <ShieldAlert size={40} />
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tighter">Excluir?</h2>
                        <p className="text-sm text-slate-500 font-medium mb-10 leading-relaxed uppercase tracking-tight">Remover acesso de <span className="font-black text-slate-800 dark:text-white underline">{userToDelete.name}</span>?</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleDeleteUser} className="w-full bg-rose-600 text-white py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all text-xs">Sim, Remover Acesso</button>
                            <button onClick={() => setUserToDelete(null)} className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-5 rounded-2xl font-black uppercase tracking-widest hover:bg-slate-200 transition-all text-xs">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
