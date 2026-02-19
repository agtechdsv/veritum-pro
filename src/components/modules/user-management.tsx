'use client'

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, User as UserIcon, Lock, FileEdit, Radio, ShieldAlert, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, CheckSquare, Package } from 'lucide-react';
import { User } from '@/types';
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
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'Operador' as 'Master' | 'Administrador' | 'Operador',
        plan_id: ''
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
    }, []);

    const fetchPlans = async () => {
        const { data } = await supabase
            .from('plans')
            .select('*')
            .eq('active', true)
            .order('sort_order', { ascending: true });
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
        if (currentUser.role === 'Administrador') {
            query = query.or(`id.eq.${currentUser.id},parent_user_id.eq.${currentUser.id}`);
        } else if (currentUser.role === 'Operador') {
            if (currentUser.parent_user_id) {
                query = query.or(`id.eq.${currentUser.id},parent_user_id.eq.${currentUser.parent_user_id}`);
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

    // Selection Logic
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
                const parentUserId = currentUser.role === 'Administrador' ? currentUser.id : null;
                const result = await createUserDirectly(formData, parentUserId);
                if (!result.success) throw new Error(result.error);
                toast.success('Usuário cadastrado com sucesso!');
            }

            setShowAddModal(false);
            setEditingUser(null);
            fetchUsers();
            setFormData({ name: '', email: '', username: '', password: '', role: 'Operador', plan_id: '' });
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
            role: user.role as 'Administrador' | 'Operador',
            plan_id: user.plan_id || ''
        });
        setShowAddModal(true);
    };

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">Gestão de Usuários</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight">
                        Administre quem acessa seu ecossistema.
                        <span className="ml-2 px-2 py-0.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded text-xs font-bold uppercase">
                            Sua Role: {currentUser.role}
                        </span>
                    </p>
                </div>
                {currentUser.role !== 'Operador' && (
                    <button
                        onClick={() => {
                            setEditingUser(null);
                            setFormData({ name: '', email: '', username: '', password: '', role: 'Operador', plan_id: '' });
                            setShowAddModal(true);
                        }}
                        className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                    >
                        <UserPlus size={20} /> Novo Usuário
                    </button>
                )}
            </div>


            {/* Filters */}
            <div className="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap gap-4 items-end animate-in slide-in-from-top-4 duration-500">
                <div className="flex-1 min-w-[200px] space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Buscar Usuário</label>
                    <div className="relative">
                        <Mail className="absolute left-4 top-3.5 text-slate-300" size={16} />
                        <input
                            placeholder="Nome ou e-mail..."
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
                            value={filters.search}
                            onChange={e => setFilters({ ...filters, search: e.target.value })}
                        />
                    </div>
                </div>

                <div className="w-40 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Nível</label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer capitalize"
                        value={filters.role}
                        onChange={e => setFilters({ ...filters, role: e.target.value })}
                    >
                        <option value="all">Todos</option>
                        <option value="Master">Master</option>
                        <option value="Administrador">Administrador</option>
                        <option value="Operador">Operador</option>
                    </select>
                </div>

                {currentUser.role === 'Master' && (
                    <div className="w-52 space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Admin Responsável</label>
                        <select
                            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer"
                            value={filters.admin}
                            onChange={e => setFilters({ ...filters, admin: e.target.value })}
                        >
                            <option value="all">Todos os Admins</option>
                            {admins.map(a => (
                                <option key={a.id} value={a.id}>{a.name}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="w-40 space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-2">Status</label>
                    <select
                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-indigo-600 outline-none appearance-none cursor-pointer"
                        value={filters.status}
                        onChange={e => setFilters({ ...filters, status: e.target.value })}
                    >
                        <option value="all">Status (Todos)</option>
                        <option value="active">Ativo</option>
                        <option value="inactive">Inativo</option>
                    </select>
                </div>
            </div>

            {/* Bulk Actions Bar */}
            {selectedUserIds.length > 0 && (
                <div className="bg-indigo-600 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg animate-in slide-in-from-bottom-4 duration-300">
                    <div className="flex items-center gap-4 ml-4">
                        <CheckSquare className="text-indigo-200" size={20} />
                        <span className="font-bold">{selectedUserIds.length} usuários selecionados</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={bulkLoading}
                            onClick={() => handleBulkStatus(true)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase transition-all disabled:opacity-50"
                        >
                            Ativar Todos
                        </button>
                        <button
                            disabled={bulkLoading}
                            onClick={() => handleBulkStatus(false)}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase transition-all disabled:opacity-50"
                        >
                            Desativar Todos
                        </button>
                        <button
                            disabled={bulkLoading}
                            onClick={handleBulkDelete}
                            className="px-4 py-2 bg-rose-500 hover:bg-rose-600 rounded-xl text-xs font-black uppercase transition-all flex items-center gap-2 disabled:opacity-50"
                        >
                            <Trash2 size={14} /> Excluir Selecionados
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden animate-in fade-in duration-700">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-8 py-5 w-10">
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                    checked={selectedUserIds.length === paginatedUsers.length && paginatedUsers.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th
                                className="px-4 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                                onClick={() => handleSort('name')}
                            >
                                <div className="flex items-center gap-1">
                                    Usuário {sortConfig?.key === 'name' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </th>
                            <th
                                className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                                onClick={() => handleSort('role')}
                            >
                                <div className="flex items-center gap-1">
                                    Nível {sortConfig?.key === 'role' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </th>
                            {currentUser.role === 'Master' && (
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Admin Responsável</th>
                            )}
                            {currentUser.role === 'Master' && (
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-center">Plano</th>
                            )}
                            <th
                                className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-indigo-600 transition-colors"
                                onClick={() => handleSort('active')}
                            >
                                <div className="flex items-center gap-1">
                                    Status {sortConfig?.key === 'active' && (sortConfig.direction === 'asc' ? '↑' : '↓')}
                                </div>
                            </th>
                            {(currentUser.role !== 'Operador' || users.some(u => u.id === currentUser.id)) && (
                                <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {paginatedUsers.length === 0 ? (
                            <tr>
                                <td colSpan={currentUser.role === 'Master' ? 7 : 5} className="px-8 py-20 text-center">
                                    <div className="flex flex-col items-center gap-2 opacity-20">
                                        <ShieldAlert size={48} />
                                        <p className="font-bold">Nenhum usuário encontrado com estes filtros.</p>
                                    </div>
                                </td>
                            </tr>
                        ) : paginatedUsers.map(u => (
                            <tr key={u.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group ${selectedUserIds.includes(u.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''}`}>
                                <td className="px-8 py-5 w-10">
                                    <input
                                        type="checkbox"
                                        className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                        checked={selectedUserIds.includes(u.id)}
                                        onChange={() => handleSelectUser(u.id)}
                                    />
                                </td>
                                <td className="px-4 py-5">
                                    <div className="flex items-center gap-4">
                                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=6366f1&color=fff`} className="w-10 h-10 rounded-xl" />
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{u.name}</p>
                                            <p className="text-xs text-slate-400">{u.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'Master' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-400' :
                                            u.role === 'Administrador' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' :
                                                'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                            }`}>
                                            {u.role}
                                        </span>
                                    </div>
                                </td>
                                {currentUser.role === 'Master' && (
                                    <td className="px-8 py-5">
                                        <div className="flex justify-center">
                                            {u.role === 'Administrador' && u.plan_id ? (
                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl">
                                                    <Package size={14} className="text-emerald-500" />
                                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tight">
                                                        {plans.find(p => p.id === u.plan_id)?.name || 'Plano Personalizado'}
                                                    </span>
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-slate-400 italic">N/A</span>
                                            )}
                                        </div>
                                    </td>
                                )}
                                {currentUser.role === 'Master' && (
                                    <td className="px-8 py-5">
                                        {u.parent_user_id ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-[10px] font-bold text-indigo-600">
                                                    {users.find(p => p.id === u.parent_user_id)?.name.charAt(0) || 'A'}
                                                </div>
                                                <span className="text-sm text-slate-600 dark:text-slate-400 font-medium">
                                                    {users.find(p => p.id === u.parent_user_id)?.name || 'Administrador'}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-slate-400 italic">Sistema (Master)</span>
                                        )}
                                    </td>
                                )}
                                <td className="px-8 py-5">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${u.active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {u.active ? 'Ativo' : 'Inativo'}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {currentUser.role !== 'Operador' && (
                                            <button
                                                onClick={() => handleToggleStatus(u)}
                                                className={`p-2 transition-all duration-200 rounded-lg cursor-pointer ${u.active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                                title={u.active ? 'Desativar usuário' : 'Ativar usuário'}
                                            >
                                                <Radio size={20} />
                                            </button>
                                        )}

                                        {(currentUser.role !== 'Operador' || u.id === currentUser.id) && (
                                            <button
                                                onClick={() => openEditModal(u)}
                                                className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all p-2 rounded-lg cursor-pointer"
                                                title="Editar dados"
                                            >
                                                <FileEdit size={20} />
                                            </button>
                                        )}

                                        {currentUser.role !== 'Operador' && (
                                            <button
                                                onClick={() => setUserToDelete(u)}
                                                className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all p-2 rounded-lg cursor-pointer"
                                                title="Remover acesso"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* Pagination Footer */}
                <div className="bg-slate-50 dark:bg-slate-800/30 px-8 py-5 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="text-xs font-bold text-slate-500">
                            Mostrando <span className="text-slate-800 dark:text-white">{Math.min(startIndex + 1, totalItems)}</span> a <span className="text-slate-800 dark:text-white">{Math.min(startIndex + itemsPerPage, totalItems)}</span> de <span className="text-slate-800 dark:text-white">{totalItems}</span> registros
                        </div>
                        <div className="h-4 w-px bg-slate-200 dark:bg-slate-700" />
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-black text-slate-400">Por página:</span>
                            <select
                                className="bg-transparent text-xs font-bold text-slate-600 dark:text-slate-400 outline-none cursor-pointer hover:text-indigo-600 transition-colors"
                                value={itemsPerPage}
                                onChange={e => {
                                    setItemsPerPage(Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value={5} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">5</option>
                                <option value={10} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">10</option>
                                <option value={20} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">20</option>
                                <option value={50} className="bg-white dark:bg-slate-900 text-slate-800 dark:text-white">50</option>
                            </select>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(1)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Primeira Página"
                        >
                            <ChevronsLeft size={18} />
                        </button>
                        <button
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Anterior"
                        >
                            <ChevronLeft size={18} />
                        </button>

                        <div className="flex items-center gap-1 mx-2">
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                let pageNum = currentPage;
                                if (totalPages <= 5) pageNum = i + 1;
                                else if (currentPage <= 3) pageNum = i + 1;
                                else if (currentPage >= totalPages - 2) pageNum = totalPages - 4 + i;
                                else pageNum = currentPage - 2 + i;

                                if (pageNum > totalPages || pageNum < 1) return null;

                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-xs font-black transition-all ${currentPage === pageNum ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800'}`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>

                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Próxima"
                        >
                            <ChevronRight size={18} />
                        </button>
                        <button
                            disabled={currentPage === totalPages || totalPages === 0}
                            onClick={() => setCurrentPage(totalPages)}
                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                            title="Última Página"
                        >
                            <ChevronsRight size={18} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal Components */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 relative overflow-hidden">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 cursor-pointer">
                            <Trash2 className="rotate-45" size={20} />
                        </button>

                        <div className="mb-8">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                                <ShieldCheck size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                {editingUser ? 'Editar Integrante' : 'Cadastrar Integrante'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {editingUser ? 'Atualize os dados de acesso deste usuário.' : 'Preencha os dados do novo acesso.'}
                            </p>
                        </div>

                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-4 text-slate-400" size={18} />
                                <input
                                    ref={nameRef}
                                    required
                                    placeholder="Nome Completo"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white"
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-slate-400" size={18} />
                                <input
                                    required
                                    type="email"
                                    placeholder="E-mail"
                                    disabled={!!editingUser}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white disabled:opacity-60 disabled:cursor-not-allowed"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value, username: e.target.value })}
                                />
                                {editingUser && (
                                    <p className="text-[10px] text-slate-400 mt-1 ml-4 italic">O e-mail não pode ser alterado após o cadastro.</p>
                                )}
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
                                <input
                                    required={!editingUser}
                                    type="password"
                                    placeholder={editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha Provisória"}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>

                            <div className={`grid gap-4 ${currentUser.role === 'Master' ? 'grid-cols-3' : 'grid-cols-2'}`}>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'Operador', plan_id: '' })}
                                    className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all cursor-pointer ${formData.role === 'Operador' ? 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-600' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
                                        }`}
                                >
                                    Operador
                                </button>
                                <button
                                    type="button"
                                    disabled={currentUser.role === 'Operador'}
                                    onClick={() => setFormData({ ...formData, role: 'Administrador' })}
                                    className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all cursor-pointer ${formData.role === 'Administrador' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
                                        } disabled:opacity-30 disabled:cursor-not-allowed`}
                                >
                                    Administrador
                                </button>
                                {currentUser.role === 'Master' && (
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: 'Master', plan_id: '' })}
                                        className={`py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest border transition-all cursor-pointer ${formData.role === 'Master' ? 'bg-amber-500 border-amber-500 text-white shadow-lg' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
                                            }`}
                                    >
                                        Master
                                    </button>
                                )}
                            </div>

                            {currentUser.role === 'Master' && formData.role === 'Administrador' && (
                                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-300">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vincular a um Plano</label>
                                    <div className="relative">
                                        <Package className="absolute left-4 top-4 text-slate-400" size={18} />
                                        <select
                                            required
                                            className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white appearance-none cursor-pointer"
                                            value={formData.plan_id}
                                            onChange={e => setFormData({ ...formData, plan_id: e.target.value })}
                                        >
                                            <option value="">Selecione um plano...</option>
                                            {plans.map(p => (
                                                <option key={p.id} value={p.id}>{p.name} (R$ {p.monthly_price})</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            )}

                            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-2xl shadow-indigo-600/40 hover:-translate-y-1 transition-all mt-6 cursor-pointer">
                                {editingUser ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {userToDelete && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 text-center relative overflow-hidden">
                        <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-3xl flex items-center justify-center text-rose-600 dark:text-rose-400 mx-auto mb-6">
                            <ShieldAlert size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Excluir Usuário?</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 leading-relaxed">
                            Esta ação é irreversível. O acesso de <span className="font-bold text-slate-800 dark:text-white">{userToDelete.name}</span> será removido permanentemente do ecossistema.
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={handleDeleteUser}
                                className="w-full bg-rose-600 text-white py-4 rounded-2xl font-bold shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all cursor-pointer"
                            >
                                Sim, Confirmar Exclusão
                            </button>
                            <button
                                onClick={() => setUserToDelete(null)}
                                className="w-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 py-4 rounded-2xl font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-all cursor-pointer"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
