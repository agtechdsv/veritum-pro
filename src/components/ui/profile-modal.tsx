'use client'

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { User, UserPreferences } from '@/types';
import { User as UserIcon, Camera, Save, X, Phone, FileText, Check } from 'lucide-react';
import { createMasterClient } from '@/lib/supabase/master';
import { toast } from './toast';

interface ProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    onUpdateUser: (u: User) => void;
}

const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, user, onUpdateUser }) => {
    const [formUser, setFormUser] = useState<User>(user);
    const [saving, setSaving] = useState(false);
    const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
    const [mounted, setMounted] = useState(false);
    const supabase = createMasterClient();

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (isOpen) {
            setFormUser({
                ...user,
                cpf_cnpj: user.cpf_cnpj ? maskCPFCNPJ(user.cpf_cnpj) : '',
                phone: user.phone ? maskPhone(user.phone) : ''
            });
            setPendingAvatar(null);
        }
    }, [isOpen, user]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                setPendingAvatar(base64);
                setFormUser({ ...formUser, avatar_url: base64 });
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({
                    name: formUser.name,
                    cpf_cnpj: formUser.cpf_cnpj,
                    phone: formUser.phone,
                    avatar_url: formUser.avatar_url
                })
                .eq('id', user.id);

            if (error) throw error;

            onUpdateUser(formUser);
            toast.success('Perfil atualizado com sucesso!');
            onClose();
        } catch (err: any) {
            console.error('Failed to update profile:', err);
            toast.error('Erro ao atualizar perfil.');
        } finally {
            setSaving(false);
        }
    };

    const maskCPFCNPJ = (value: string) => {
        const raw = value.replace(/\D/g, '');
        if (raw.length <= 11) {
            return raw
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        } else {
            return raw
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .replace(/(-\d{2})\d+?$/, '$1');
        }
    };

    const maskPhone = (value: string) => {
        const raw = value.replace(/\D/g, '');
        if (raw.length <= 10) {
            return raw
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        } else {
            return raw
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2')
                .replace(/(-\d{4})\d+?$/, '$1');
        }
    };

    if (!isOpen || !mounted) return null;

    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
                <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/30 flex-shrink-0">
                    <div>
                        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Meu Perfil</h2>
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest">Gerencie seus dados pessoais</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-all text-slate-400">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 space-y-6 overflow-y-auto">
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <div className="w-24 h-24 rounded-3xl overflow-hidden border-4 border-indigo-100 dark:border-indigo-900/30 shadow-xl transition-all group-hover:scale-105 group-hover:border-indigo-500">
                                <img
                                    src={formUser.avatar_url || `https://ui-avatars.com/api/?name=${formUser.name}&background=6366f1&color=fff&bold=true`}
                                    className="w-full h-full object-cover"
                                    alt="Avatar"
                                />
                            </div>
                            <label className="absolute -bottom-2 -right-2 p-2 bg-indigo-600 text-white rounded-xl shadow-lg cursor-pointer hover:bg-indigo-700 transition-all">
                                <Camera size={16} />
                                <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                            </label>
                        </div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clique na câmera para alterar</p>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Nome Completo</label>
                            <div className="relative">
                                <UserIcon className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                <input
                                    value={formUser.name}
                                    onChange={e => setFormUser({ ...formUser, name: e.target.value })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">E-mail (Login)</label>
                            <div className="relative">
                                <Check className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                <input
                                    value={formUser.email || formUser.username || ''}
                                    disabled
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-2xl text-slate-400 dark:text-slate-500 font-bold cursor-not-allowed"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">CPF / CNPJ</label>
                            <div className="relative">
                                <FileText className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                <input
                                    value={formUser.cpf_cnpj || ''}
                                    onChange={e => setFormUser({ ...formUser, cpf_cnpj: maskCPFCNPJ(e.target.value) })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">Telefone</label>
                            <div className="relative">
                                <Phone className="absolute left-4 top-3.5 text-slate-300" size={18} />
                                <input
                                    value={formUser.phone || ''}
                                    onChange={e => setFormUser({ ...formUser, phone: maskPhone(e.target.value) })}
                                    className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-slate-100 font-bold transition-all"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
                    <button
                        onClick={handleSaveProfile}
                        disabled={saving}
                        className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 disabled:opacity-50 active:scale-95"
                    >
                        {saving ? (
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <>
                                <Save size={20} /> Salvar Alterações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ProfileModal;
