'use client'

import React, { useState, useEffect } from 'react';
import { ShieldCheck, UserPlus, Trash2, Mail, User as UserIcon, Lock, FileEdit, Radio, ShieldAlert } from 'lucide-react';
import { User } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';

interface Props {
    currentUser: User;
}

const UserManagement: React.FC<Props> = ({ currentUser }) => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        username: '',
        password: '',
        role: 'Operador' as 'Admin' | 'Operador'
    });
    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const supabase = createMasterClient();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (!error && data) setUsers(data);
        setLoading(false);
    };

    const handleSaveUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setMsg(null);

        // Security Check (Frontend)
        if (currentUser.role === 'Operador' && formData.role === 'Admin') {
            setMsg({ type: 'error', text: 'Operadores não podem atribuir nível Admin.' });
            return;
        }

        try {
            if (editingUser) {
                // UPDATE USER
                const { error: updateError } = await supabase
                    .from('users')
                    .update({
                        name: formData.name,
                        role: formData.role,
                        username: formData.username
                    })
                    .eq('id', editingUser.id);

                if (updateError) throw updateError;
                setMsg({ type: 'success', text: 'Usuário atualizado com sucesso!' });
            } else {
                // CREATE NEW USER
                const { data: authData, error: authError } = await supabase.auth.signUp({
                    email: formData.email,
                    password: formData.password,
                    options: {
                        data: {
                            full_name: formData.name,
                        }
                    }
                });

                if (authError) throw authError;

                if (authData.user) {
                    const { error: updateError } = await supabase
                        .from('users')
                        .update({
                            role: formData.role,
                            username: formData.email // Use full email as username to match trigger
                        })
                        .eq('id', authData.user.id);

                    if (updateError) throw updateError;
                }
                setMsg({ type: 'success', text: 'Usuário convidado com sucesso! (Email enviado)' });
            }

            setShowAddModal(false);
            setEditingUser(null);
            fetchUsers();
            setFormData({ name: '', email: '', username: '', password: '', role: 'Operador' });
        } catch (err: any) {
            setMsg({ type: 'error', text: err.message || 'Erro ao processar usuário' });
        }
    };

    const handleToggleStatus = async (user: User) => {
        try {
            const { error } = await supabase
                .from('users')
                .update({ active: !user.active })
                .eq('id', user.id);

            if (error) throw error;
            fetchUsers();
        } catch (err: any) {
            setMsg({ type: 'error', text: 'Erro ao alterar status' });
        }
    };

    const handleDeleteUser = async () => {
        if (!userToDelete) return;
        try {
            const { error } = await supabase.from('users').delete().eq('id', userToDelete.id);
            if (error) throw error;
            fetchUsers();
            setMsg({ type: 'success', text: 'Usuário removido com sucesso.' });
            setUserToDelete(null);
        } catch (err) {
            setMsg({ type: 'error', text: 'Erro ao excluir usuário.' });
        }
    };

    const openEditModal = (user: User) => {
        setEditingUser(user);
        setFormData({
            name: user.name,
            email: user.username, // Use real username (which is the email)
            username: user.username,
            password: '',
            role: user.role as 'Admin' | 'Operador'
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
                <button
                    onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', email: '', username: '', password: '', role: 'Operador' });
                        setShowAddModal(true);
                    }}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all flex items-center gap-2 cursor-pointer"
                >
                    <UserPlus size={20} /> Novo Usuário
                </button>
            </div>

            {msg && (
                <div className={`p-4 rounded-2xl border font-bold text-sm ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-600 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-400'
                    : 'bg-rose-50 border-rose-100 text-rose-600 dark:bg-rose-900/20 dark:border-rose-900/30 dark:text-rose-400'
                    }`}>
                    {msg.text}
                </div>
            )}

            <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                        <tr>
                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Usuário</th>
                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Nível</th>
                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Status</th>
                            <th className="px-8 py-5 text-xs font-black text-slate-400 uppercase tracking-widest">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors group">
                                <td className="px-8 py-5">
                                    <div className="flex items-center gap-4">
                                        <img src={u.avatar_url || `https://ui-avatars.com/api/?name=${u.name}&background=6366f1&color=fff`} className="w-10 h-10 rounded-xl" />
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white">{u.name}</p>
                                            <p className="text-xs text-slate-400">{u.username}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-5">
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${u.role === 'Admin' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                                        }`}>
                                        {u.role}
                                    </span>
                                </td>
                                <td className="px-8 py-5">
                                    <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase inline-flex items-center gap-1.5 ${u.active ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                        <div className={`w-1.5 h-1.5 rounded-full ${u.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                                        {u.active ? 'Ativo' : 'Inativo'}
                                    </div>
                                </td>
                                <td className="px-8 py-5 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => handleToggleStatus(u)}
                                            className={`p-2 transition-all duration-200 rounded-lg cursor-pointer ${u.active ? 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30' : 'text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/50'}`}
                                            title={u.active ? 'Desativar usuário' : 'Ativar usuário'}
                                        >
                                            <Radio size={20} />
                                        </button>
                                        <button
                                            onClick={() => openEditModal(u)}
                                            className="text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-all p-2 rounded-lg cursor-pointer"
                                            title="Editar dados"
                                        >
                                            <FileEdit size={20} />
                                        </button>
                                        <button
                                            onClick={() => setUserToDelete(u)}
                                            className="text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-all p-2 rounded-lg cursor-pointer"
                                            title="Remover acesso"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Add User Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl p-10 relative overflow-hidden">
                        <button onClick={() => setShowAddModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-600 cursor-pointer">
                            <Lock size={20} />
                        </button>

                        <div className="mb-8">
                            <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-4">
                                <ShieldCheck size={28} />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
                                {editingUser ? 'Editar Integrante' : 'Convidar Integrante'}
                            </h2>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {editingUser ? 'Atualize os dados de acesso deste usuário.' : 'Preencha os dados do novo acesso.'}
                            </p>
                        </div>

                        <form onSubmit={handleSaveUser} className="space-y-4">
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-4 text-slate-400" size={18} />
                                <input
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
                                    <p className="text-[10px] text-slate-400 mt-1 ml-4 italic">O e-mail não pode ser alterado após o convite.</p>
                                )}
                            </div>
                            {!editingUser && (
                                <div className="relative">
                                    <Lock className="absolute left-4 top-4 text-slate-400" size={18} />
                                    <input
                                        required={!editingUser}
                                        type="password"
                                        placeholder="Senha Provisória"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-white"
                                        value={formData.password}
                                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, role: 'Operador' })}
                                    className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${formData.role === 'Operador' ? 'bg-slate-100 border-slate-300 dark:bg-slate-800 dark:border-slate-700 text-slate-600' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
                                        }`}
                                >
                                    Operador
                                </button>
                                <button
                                    type="button"
                                    disabled={currentUser.role === 'Operador'}
                                    onClick={() => setFormData({ ...formData, role: 'Admin' })}
                                    className={`py-3 rounded-xl font-bold text-xs uppercase tracking-widest border transition-all cursor-pointer ${formData.role === 'Admin' ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-transparent border-slate-200 dark:border-slate-800 text-slate-400'
                                        } disabled:opacity-30 disabled:cursor-not-allowed disabled:cursor-default`}
                                >
                                    Admin
                                </button>
                            </div>

                            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-2xl shadow-indigo-600/40 hover:-translate-y-1 transition-all mt-6 cursor-pointer">
                                {editingUser ? 'Salvar Alterações' : 'Confirmar Convite'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Delete Confirmation Modal */}
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
