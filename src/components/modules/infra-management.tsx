'use client'

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Key, Globe, Save, ShieldCheck, Zap, Activity, Cpu, Server, Lock, Users, ChevronDown, Eye, EyeOff, Filter, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from '../ui/toast';
import { useTranslation } from '@/contexts/language-context';
import { getTenantConfigByUserId, saveTenantConfig, deleteTenantConfig } from '@/app/actions/infra-actions';
import { TenantConfig, DbProvider, User } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';

interface Props {
    currentUser: User;
}

export default function InfraManagement({ currentUser }: Props) {
    const { t } = useTranslation();
    const isMaster = currentUser.role === 'Master';

    const [config, setConfig] = useState<Partial<TenantConfig>>({
        db_provider: 'supabase',
        migration_mode: 'auto'
    });

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Master Selection States
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>(currentUser.id);

    // Field Visibility States
    const [showUrl, setShowUrl] = useState(false);
    const [showKey, setShowKey] = useState(false);
    const [showGemini, setShowGemini] = useState(false);
    const [showConn, setShowConn] = useState(false);

    const supabase = createMasterClient();

    useEffect(() => {
        if (isMaster) {
            fetchAllUsers();
        }
        fetchConfig(selectedUserId);
    }, [selectedUserId]);

    const fetchAllUsers = async () => {
        const { data, error } = await supabase
            .from('users')
            .select('*')
            .in('role', ['Sócio-Administrador', 'Sócio Administrador'])
            .order('name', { ascending: true });

        if (!error && data) {
            setAllUsers(data as User[]);
        }
    };

    const fetchConfig = async (userId: string) => {
        setLoading(true);
        // Reset visibility on user change
        setShowUrl(false);
        setShowKey(false);
        setShowGemini(false);
        setShowConn(false);

        try {
            // Usamos a Server Action que já lida com a descriptografia
            const data = await getTenantConfigByUserId(userId);

            if (data) {
                // Mapeamos os campos descriptografados para o estado do form
                setConfig({
                    ...data,
                    // Se o campo descriptografado veio da action, o form usa os nomes com _encrypted no final
                    // para manter a consistência com o que o usuário digita
                    custom_supabase_key_encrypted: data.custom_supabase_key_encrypted,
                    db_connection_encrypted: data.db_connection_encrypted,
                    custom_gemini_key_encrypted: data.custom_gemini_key_encrypted
                });
            } else {
                // Reset form se não houver config
                setConfig({
                    owner_id: userId,
                    db_provider: 'supabase',
                    migration_mode: 'auto'
                });
            }
        } catch (error) {
            console.error('Error fetching infra config:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            // Garantimos que estamos salvando para o usuário correto (contexto do Master)
            const payload = { ...config, owner_id: selectedUserId };
            const result = await saveTenantConfig(payload);
            if (result.success) {
                toast.success(t('management.settings.infra.saveSuccess'));
            }
        } catch (error: any) {
            toast.error(error.message || t('management.settings.infra.saveError'));
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const result = await deleteTenantConfig(selectedUserId);
            if (result.success) {
                toast.success(t('management.settings.infra.deleteSuccess'));
                fetchConfig(selectedUserId); // re-fetch to reset
                setShowDeleteConfirm(false);
            }
        } catch (error: any) {
            toast.error(error.message || t('management.settings.infra.saveError'));
        } finally {
            setDeleting(false);
        }
    };

    if (loading && !allUsers.length) {
        return (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
                <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">{t('management.settings.infra.loading')}</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-12 animate-in fade-in duration-700">
            {/* Master Context Selector */}
            {isMaster && (
                <div className="flex justify-end mb-8">
                    <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 pl-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl">
                        <div className="flex flex-col items-end">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1">{t('nav.master')}</span>
                            <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 leading-none">{t('management.users.masterFilter.selectClient')}</span>
                        </div>
                        <div className="relative">
                            <select
                                className="bg-slate-50 dark:bg-slate-800 border-none rounded-2xl px-6 py-3 text-xs font-black tracking-widest text-slate-700 dark:text-white focus:ring-2 focus:ring-indigo-600 outline-none transition-all cursor-pointer min-w-[260px] appearance-none pr-10"
                                value={selectedUserId}
                                onChange={e => setSelectedUserId(e.target.value)}
                            >
                                <option value="">--- {t('management.users.masterFilter.selectClient')} ---</option>
                                <option value={currentUser.id}>{t('management.users.masterFilter.self')}</option>
                                <optgroup label={t('management.users.masterFilter.clients')?.toUpperCase()}>
                                    {allUsers.filter(u => u.id !== currentUser.id).map(c => {
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
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col items-center mb-12">
                <div className="flex items-center gap-3 mb-2">
                    <Server size={32} className="text-indigo-600" />
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">{t('management.settings.infra.title')}</h1>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">{t('management.settings.infra.subtitle')}</p>
            </div>

            {/* Main Config Card */}
            <section className="bg-indigo-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/10">
                <div className="relative z-10">
                    <div className="flex items-center justify-between mb-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md">
                                <ShieldCheck size={32} className="text-indigo-300" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter">Bring Your Own Database (BYODB)</h3>
                                <p className="text-indigo-300 text-[10px] font-black uppercase tracking-widest mt-1">{t('management.settings.infra.syncData')}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {config.id && (
                                <button
                                    onClick={() => setShowDeleteConfirm(true)}
                                    disabled={saving || deleting}
                                    className="bg-white/10 text-white px-4 py-4 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-xl disabled:opacity-50"
                                    title={t('management.settings.infra.deleteConfig')}
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                            <button
                                onClick={handleSave}
                                disabled={saving || deleting}
                                className="bg-white text-indigo-900 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                            >
                                {saving ? <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                                {saving ? t('management.settings.infra.saving')?.toUpperCase() : t('management.settings.infra.save')?.toUpperCase()}
                            </button>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            {/* Column 1: DB Config */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 ml-2">{t('management.settings.infra.providerLabel')}</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['supabase', 'postgres', 'oracle'].map((provider) => (
                                            <button
                                                key={provider}
                                                onClick={() => setConfig({ ...config, db_provider: provider as DbProvider })}
                                                className={`py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${config.db_provider === provider
                                                    ? 'bg-white text-indigo-900 border-white shadow-lg'
                                                    : 'bg-white/5 border-white/10 text-indigo-300 hover:bg-white/10'}`}
                                            >
                                                {provider}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {config.db_provider === 'supabase' ? (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-2">{t('management.settings.infra.urlLabel')}</label>
                                            <div className="relative">
                                                <Globe className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                                <input
                                                    type={showUrl ? "text" : "password"}
                                                    value={config.custom_supabase_url || ''}
                                                    onChange={e => setConfig({ ...config, custom_supabase_url: e.target.value })}
                                                    placeholder={t('management.settings.infra.urlPlaceholder')}
                                                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/30 text-white transition-all font-bold text-sm"
                                                />
                                                <button onClick={() => setShowUrl(!showUrl)} className="absolute right-4 top-4 text-indigo-400 hover:text-white transition-colors">
                                                    {showUrl ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-2">{t('management.settings.infra.keyLabel')}</label>
                                            <div className="relative">
                                                <Lock className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                                <input
                                                    type={showKey ? "text" : "password"}
                                                    value={config.custom_supabase_key_encrypted || ''}
                                                    onChange={e => setConfig({ ...config, custom_supabase_key_encrypted: e.target.value })}
                                                    placeholder="••••••••••••••••••••••••••••"
                                                    className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/30 text-white transition-all font-bold text-sm"
                                                />
                                                <button onClick={() => setShowKey(!showKey)} className="absolute right-4 top-4 text-indigo-400 hover:text-white transition-colors">
                                                    {showKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div>
                                        <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-2">{t('management.settings.infra.connectionLabel')}</label>
                                        <div className="relative">
                                            <Database className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                            <textarea
                                                value={config.db_connection_encrypted || ''}
                                                onChange={e => setConfig({ ...config, db_connection_encrypted: e.target.value })}
                                                placeholder="postgresql://user:pass@host:port/dbname"
                                                rows={4}
                                                className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/30 text-white transition-all font-bold text-xs"
                                                style={!showConn ? { WebkitTextSecurity: 'disc' } as any : {}}
                                            />
                                            <button onClick={() => setShowConn(!showConn)} className="absolute right-4 top-4 text-indigo-400 hover:text-white transition-colors">
                                                {showConn ? <EyeOff size={18} /> : <Eye size={18} />}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Column 2: IA & Meta */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2 ml-2">{t('management.settings.infra.geminiLabel')}</label>
                                    <div className="relative">
                                        <Zap className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                        <input
                                            type={showGemini ? "text" : "password"}
                                            value={config.custom_gemini_key_encrypted || ''}
                                            onChange={e => setConfig({ ...config, custom_gemini_key_encrypted: e.target.value })}
                                            placeholder={t('management.settings.infra.geminiPlaceholder')}
                                            className="w-full pl-12 pr-12 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/30 text-white transition-all font-bold text-sm"
                                        />
                                        <button onClick={() => setShowGemini(!showGemini)} className="absolute right-4 top-4 text-indigo-400 hover:text-white transition-colors">
                                            {showGemini ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="p-8 bg-white/5 border border-white/10 rounded-[2rem] backdrop-blur-sm space-y-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">{t('management.settings.infra.privacyTitle')}</h4>
                                    </div>
                                    <p className="text-[11px] text-indigo-100/80 leading-relaxed font-bold italic">
                                        {t('management.settings.infra.privacyDesc')}
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-3 ml-2">{t('management.settings.infra.migrationLabel')}</label>
                                    <div className="flex gap-4">
                                        <button
                                            onClick={() => setConfig({ ...config, migration_mode: 'auto' })}
                                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${config.migration_mode === 'auto' ? 'bg-indigo-600 border-white text-white' : 'bg-white/5 border-white/10 text-indigo-300'}`}
                                        >
                                            {t('management.settings.infra.migrationAuto')}
                                        </button>
                                        <button
                                            onClick={() => setConfig({ ...config, migration_mode: 'manual' })}
                                            className={`flex-1 py-3 rounded-xl border-2 transition-all font-black text-[10px] uppercase ${config.migration_mode === 'manual' ? 'bg-indigo-600 border-white text-white' : 'bg-white/5 border-white/10 text-indigo-300'}`}
                                        >
                                            {t('management.settings.infra.migrationManual')}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Decorative gradients */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500 rounded-full blur-[120px] opacity-20 pointer-events-none -translate-y-1/2 translate-x-1/2 group-hover:opacity-30 transition-all"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-purple-500 rounded-full blur-[100px] opacity-20 pointer-events-none translate-y-1/2 -translate-x-1/2"></div>
            </section>

            {/* Health Monitor Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('management.settings.infra.dbStatus')}</p>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase">{t('management.settings.infra.synced')}</h4>
                    </div>
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-2xl group-hover:scale-110 transition-all">
                        <Activity size={20} />
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('management.settings.infra.aiEngine')}</p>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase">Gemini 1.5 Pro</h4>
                    </div>
                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded-2xl group-hover:scale-110 transition-all">
                        <Cpu size={20} />
                    </div>
                </div>
                <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm flex items-center justify-between group">
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{t('management.settings.infra.security')}</p>
                        <h4 className="text-sm font-black text-slate-800 dark:text-white uppercase">AES-256 GCM Active</h4>
                    </div>
                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 rounded-2xl group-hover:scale-110 transition-all">
                        <Lock size={20} />
                    </div>
                </div>
            </div>

            {/* Delete Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white dark:bg-slate-950 w-full max-w-md rounded-[2.5rem] border-2 border-slate-200 dark:border-slate-800 shadow-2xl p-8 text-center space-y-6"
                        >
                            <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-rose-600/10 scale-110">
                                <AlertTriangle size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">{t('management.settings.infra.deleteConfirmTitle')?.toUpperCase()}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                                    {t('management.settings.infra.deleteConfirmMessage')}
                                </p>
                            </div>
                            <div className="flex gap-4 pt-4">
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={deleting}
                                    className="flex-1 px-6 py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-200 transition-all disabled:opacity-50"
                                >
                                    {t('common.cancel')?.toUpperCase()}
                                </button>
                                <button
                                    onClick={handleDelete}
                                    disabled={deleting}
                                    className="flex-1 px-6 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-rose-600/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {deleting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                                    {deleting ? (t('common.deleting')?.toUpperCase()) : (t('common.confirm')?.toUpperCase())}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
