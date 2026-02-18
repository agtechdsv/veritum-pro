
import React, { useState } from 'react';
import { User, UserPreferences } from '@/types';
import { Database, Key, Globe, Layout, Save, User as UserIcon, ShieldCheck } from 'lucide-react';
import { createMasterClient } from '@/lib/supabase/master';

interface Props {
    user: User;
    preferences: UserPreferences;
    onUpdateUser: (u: User) => void;
    onUpdatePrefs: (p: UserPreferences) => void;
}

const UserSettings: React.FC<Props> = ({ user, preferences, onUpdateUser, onUpdatePrefs }) => {
    const [formPrefs, setFormPrefs] = useState(preferences);
    const [formUser, setFormUser] = useState(user);
    const [saving, setSaving] = useState(false);
    const supabase = createMasterClient();

    const handleSave = async () => {
        setSaving(true);
        try {
            // 1. Update Profile in public.users
            const { error: userError } = await supabase
                .from('users')
                .update({
                    name: formUser.name,
                    username: formUser.username,
                    cpf_cnpj: formUser.cpf_cnpj,
                    phone: formUser.phone,
                    avatar_url: formUser.avatar_url
                })
                .eq('id', user.id);

            if (userError) throw userError;

            // 2. Update Preferences in public.user_preferences
            const { error: prefsError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    language: formPrefs.language,
                    theme: formPrefs.theme,
                    custom_supabase_url: formPrefs.custom_supabase_url,
                    custom_supabase_key: formPrefs.custom_supabase_key,
                    custom_gemini_key: formPrefs.custom_gemini_key
                });

            if (prefsError) throw prefsError;

            onUpdateUser(formUser);
            onUpdatePrefs(formPrefs);
        } catch (err) {
            console.error('Error saving settings:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-12">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white">Configurações</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium">Gerencie seu perfil e infraestrutura BYODB.</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-bold shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                >
                    {saving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={18} />}
                    {saving ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Profile Section */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white text-slate-800">
                        <UserIcon size={20} className="text-indigo-600" /> Informações do Perfil
                    </h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Nome Completo</label>
                            <input
                                value={formUser.name}
                                onChange={e => setFormUser({ ...formUser, name: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-slate-100 transition-colors font-medium"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Username</label>
                            <input
                                value={formUser.username}
                                onChange={e => setFormUser({ ...formUser, username: e.target.value })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-slate-100 transition-colors font-medium"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">CPF / CNPJ</label>
                                <input
                                    value={formUser.cpf_cnpj || ''}
                                    onChange={e => setFormUser({ ...formUser, cpf_cnpj: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-slate-100 transition-colors font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Telefone</label>
                                <input
                                    value={formUser.phone || ''}
                                    onChange={e => setFormUser({ ...formUser, phone: e.target.value })}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-slate-100 transition-colors font-medium"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Interface Preferences */}
                <section className="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-2 dark:text-white text-slate-800">
                        <Layout size={20} className="text-indigo-600" /> Preferências do Sistema
                    </h3>
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 transition-colors hover:shadow-md">
                            <div>
                                <p className="font-bold text-slate-800 dark:text-white">Tema Escuro</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">Atualmente: {formPrefs.theme}</p>
                            </div>
                            <button
                                onClick={() => setFormPrefs({ ...formPrefs, theme: formPrefs.theme === 'light' ? 'dark' : 'light' })}
                                className={`w-12 h-6 rounded-full transition-all relative ${formPrefs.theme === 'dark' ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-sm ${formPrefs.theme === 'dark' ? 'right-1' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div>
                            <label className="block text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Idioma</label>
                            <select
                                value={formPrefs.language}
                                onChange={e => setFormPrefs({ ...formPrefs, language: e.target.value as any })}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-indigo-600 outline-none text-slate-800 dark:text-slate-100 transition-colors font-bold"
                            >
                                <option value="pt">Português (Brasil)</option>
                                <option value="en">English (US)</option>
                                <option value="es">Español</option>
                            </select>
                        </div>
                    </div>
                </section>

                {/* BYODB Config */}
                <section className="md:col-span-2 bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all hover:shadow-indigo-500/30">
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-8">
                            <ShieldCheck size={28} className="text-indigo-300" />
                            <h3 className="text-2xl font-black">Infraestrutura BYODB (Bring Your Own Database)</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">Custom Supabase URL</label>
                                    <div className="relative">
                                        <Globe className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                        <input
                                            type="url"
                                            placeholder="https://your-project.supabase.co"
                                            value={formPrefs.custom_supabase_url || ''}
                                            onChange={e => setFormPrefs({ ...formPrefs, custom_supabase_url: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">Custom Supabase Key</label>
                                    <div className="relative">
                                        <Database className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                        <input
                                            type="password"
                                            placeholder="Anon/Public Key..."
                                            value={formPrefs.custom_supabase_key || ''}
                                            onChange={e => setFormPrefs({ ...formPrefs, custom_supabase_key: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-black text-indigo-300 uppercase tracking-widest mb-2">Custom Gemini Key</label>
                                    <div className="relative">
                                        <Key className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                        <input
                                            type="password"
                                            placeholder="AIzaSyB..."
                                            value={formPrefs.custom_gemini_key || ''}
                                            onChange={e => setFormPrefs({ ...formPrefs, custom_gemini_key: e.target.value })}
                                            className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                                    <p className="text-sm text-indigo-100 leading-relaxed font-bold">
                                        <span className="font-black text-indigo-300 block mb-1 uppercase tracking-tighter">Privacidade Garantida</span>
                                        Ao utilizar BYODB, seus dados de clientes, processos e faturamento nunca tocam nossos servidores centrais após a autenticação.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                </section>
            </div>
        </div>
    );
};

export default UserSettings;
