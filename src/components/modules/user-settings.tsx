
import React, { useState, useEffect } from 'react';
import { User, UserPreferences } from '@/types';
import { Database, Key, Globe, Save, ShieldCheck, AlertCircle, Building2, Crown, Zap, CheckCircle2, ArrowRight, FileText, Scale, DollarSign, Calendar, Search, Mic } from 'lucide-react';
import { createMasterClient } from '@/lib/supabase/master';
import { toast } from '../ui/toast';
import OrganizationForm from '../ui/organization-form';
import { useTranslation } from '@/contexts/language-context';

interface Props {
    user: User;
    preferences: UserPreferences;
    onUpdateUser: (u: User) => void;
    onUpdatePrefs: (p: UserPreferences) => void;
    initialTab?: 'infra' | 'org' | 'plan';
}

const UserSettings: React.FC<Props> = ({ user, preferences, onUpdatePrefs, initialTab }) => {
    const { t } = useTranslation();
    const isRootAdmin = ['Master', 'Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(user.role);
    const [activeTab, setActiveTab] = useState<'infra' | 'org' | 'plan'>(initialTab || (isRootAdmin ? 'infra' : 'plan'));
    const [formPrefs, setFormPrefs] = useState(preferences);
    const [saving, setSaving] = useState(false);
    const supabase = createMasterClient();

    useEffect(() => {
        if (initialTab) {
            setActiveTab(initialTab);
        }
    }, [initialTab]);

    const handleSavePrefs = async () => {
        setSaving(true);
        try {
            // Update Preferences in public.user_preferences
            const { error: prefsError } = await supabase
                .from('user_preferences')
                .upsert({
                    user_id: user.id,
                    custom_supabase_url: formPrefs.custom_supabase_url,
                    custom_supabase_key: formPrefs.custom_supabase_key,
                    custom_gemini_key: formPrefs.custom_gemini_key
                });

            if (prefsError) throw prefsError;

            onUpdatePrefs(formPrefs);
            toast.success(t('management.settings.toast.saveSuccess'));
        } catch (err) {
            console.error('Error saving settings:', err);
            toast.error(t('management.settings.toast.saveError'));
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-10 pb-12 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">{t('management.settings.title')}</h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium tracking-tight uppercase text-xs">{t('management.settings.subtitle')}</p>
                </div>

                {isRootAdmin && (
                    <div className="flex bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <button
                            onClick={() => setActiveTab('infra')}
                            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'infra'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <ShieldCheck size={14} /> {t('management.settings.tabs.infra')}
                        </button>
                        <button
                            onClick={() => setActiveTab('org')}
                            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'org'
                                ? 'bg-white dark:bg-slate-800 text-indigo-600 shadow-sm border border-slate-200 dark:border-slate-700'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                                }`}
                        >
                            <Building2 size={14} /> {t('management.settings.tabs.org')}
                        </button>
                        <button
                            onClick={() => setActiveTab('plan')}
                            className={`px-6 py-2.5 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all flex items-center gap-2 ${activeTab === 'plan'
                                ? 'bg-white dark:bg-slate-800 text-amber-600 shadow-sm border border-slate-200 dark:border-slate-700'
                                : 'text-slate-400 hover:text-slate-600 dark:hover:text-amber-500'
                                }`}
                        >
                            <Crown size={14} /> Minha Assinatura
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-white dark:bg-slate-900/50 p-8 md:p-12 rounded-[3.5rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none">
                {activeTab === 'infra' && (
                    <div className="space-y-10">
                        {isRootAdmin ? (
                            <section className="bg-indigo-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all hover:shadow-indigo-500/30">
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <ShieldCheck size={28} className="text-indigo-300" />
                                            <h3 className="text-2xl font-black uppercase tracking-tighter">{t('management.settings.infra.title')}</h3>
                                        </div>
                                        <button
                                            onClick={handleSavePrefs}
                                            disabled={saving}
                                            className="bg-white text-indigo-900 px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs shadow-xl hover:bg-indigo-50 transition-all flex items-center gap-2 disabled:opacity-50 active:scale-95"
                                        >
                                            {saving ? <div className="w-4 h-4 border-2 border-indigo-900 border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
                                            {saving ? '...' : t('management.settings.infra.save')}
                                        </button>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">{t('management.settings.infra.urlLabel')}</label>
                                                <div className="relative">
                                                    <Globe className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                                    <input
                                                        type="url"
                                                        placeholder={t('management.settings.infra.urlPlaceholder')}
                                                        value={formPrefs.custom_supabase_url || ''}
                                                        onChange={e => setFormPrefs({ ...formPrefs, custom_supabase_url: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">{t('management.settings.infra.keyLabel')}</label>
                                                <div className="relative">
                                                    <Database className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                                    <input
                                                        type="password"
                                                        placeholder={t('management.settings.infra.keyPlaceholder')}
                                                        value={formPrefs.custom_supabase_key || ''}
                                                        onChange={e => setFormPrefs({ ...formPrefs, custom_supabase_key: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-2">{t('management.settings.infra.geminiLabel')}</label>
                                                <div className="relative">
                                                    <Key className="absolute left-4 top-4 text-indigo-400/50" size={18} />
                                                    <input
                                                        type="password"
                                                        placeholder={t('management.settings.infra.geminiPlaceholder')}
                                                        value={formPrefs.custom_gemini_key || ''}
                                                        onChange={e => setFormPrefs({ ...formPrefs, custom_gemini_key: e.target.value })}
                                                        className="w-full pl-12 pr-4 py-4 bg-white/10 border border-white/20 rounded-2xl focus:ring-2 focus:ring-white/50 outline-none placeholder:text-indigo-300/40 text-white transition-all font-medium"
                                                    />
                                                </div>
                                            </div>
                                            <div className="p-6 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
                                                <p className="text-sm text-indigo-100 leading-relaxed font-bold">
                                                    <span className="font-black text-indigo-300 block mb-1 uppercase tracking-tighter">{t('management.settings.infra.privacyTitle')}</span>
                                                    {t('management.settings.infra.privacyDesc')}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
                            </section>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 dark:bg-slate-900 border border-dashed border-slate-200 dark:border-slate-800 rounded-[3rem]">
                                <AlertCircle size={48} className="text-slate-300 mb-4" />
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">Acesso restrito a Sócio-Administradores.</p>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'org' && isRootAdmin && (
                    <OrganizationForm adminId={user.id} />
                )}

                {activeTab === 'plan' && (
                    <div className="space-y-10 animate-in slide-in-from-right-8 duration-500">
                        {!isRootAdmin ? (
                            <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[2.5rem] shadow-xl text-center max-w-2xl mx-auto mt-12">
                                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full mb-6">
                                    <ShieldCheck size={48} className="text-indigo-500" />
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4 text-slate-800 dark:text-white">Acesso Restrito</h3>
                                <p className="text-slate-500 text-lg mb-8 leading-relaxed font-medium">
                                    Apenas os administradores responsáveis pela organização podem visualizar detalhes ou gerenciar a assinatura do ecossistema.
                                </p>
                            </div>
                        ) : (
                            <>
                                <section className="bg-amber-500 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden transition-all hover:shadow-amber-500/30">
                                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 rounded-full mb-6">
                                                <Crown size={14} className="text-amber-100" />
                                                <span className="text-[10px] font-black uppercase tracking-widest text-amber-50">Plano Atual</span>
                                            </div>
                                            <h3 className="text-5xl font-black uppercase tracking-tighter mb-2">{user.plan_name || 'Free Trial'}</h3>
                                            <p className="text-amber-100 font-medium">Acesso total ao ecossistema habilitado no seu plano.</p>
                                        </div>
                                        <button
                                            onClick={() => window.open('https://api.whatsapp.com/send?phone=YOUR_SALES_NUMBER', '_blank')}
                                            className="bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-8 py-5 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 w-full md:w-auto"
                                        >
                                            <Zap size={18} className="text-amber-500" />
                                            Fazer Upgrade
                                        </button>
                                    </div>
                                    <div className="absolute -right-20 -bottom-20 opacity-10 pointer-events-none">
                                        <Crown size={300} />
                                    </div>
                                </section>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {[
                                        { title: 'Veritum Sentinel', desc: 'Monitoramento Push de Diários e Tribunais.', icon: <ShieldCheck size={24} />, active: true },
                                        { title: 'Veritum Nexus', desc: 'Gestão Inteligente de Processos e Prazos.', icon: <Scale size={24} />, active: true },
                                        { title: 'Veritum Scriptor', desc: 'Gerador de Documentos e Petições IA.', icon: <FileText size={24} />, active: true },
                                        { title: 'Veritum Valorem', desc: 'Financeiro, Fluxo de Caixa e Honorários.', icon: <DollarSign size={24} />, active: true },
                                        { title: 'Voice Legal IA (Vox)', desc: 'Comandos de Voz e Transcrição Jurídica.', icon: <Mic size={24} />, active: false },
                                        { title: 'Veritum Cognitio', desc: 'Busca Jurisprudencial e Doutrinária IA.', icon: <Search size={24} />, active: false },
                                        { title: 'Intelligence Hub', desc: 'Dashboards de BI e Predição de Resultados.', icon: <Zap size={24} />, active: false },
                                    ].map((mod, idx) => (
                                        <div key={idx} className={`p-6 rounded-[2rem] border transition-all ${mod.active ? 'bg-white dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/50 shadow-sm' : 'bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-80'}`}>
                                            <div className="flex items-center justify-between mb-4">
                                                <div className={`p-3 rounded-xl ${mod.active ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600' : 'bg-slate-200 dark:bg-slate-800 text-slate-400'}`}>
                                                    {mod.icon}
                                                </div>
                                                {mod.active ? (
                                                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[9px] font-black uppercase tracking-widest rounded-full">
                                                        <CheckCircle2 size={12} /> Liberado
                                                    </span>
                                                ) : (
                                                    <button onClick={() => toast.success(`Redirecionando para assinar o módulo ${mod.title}...`)} className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-900/20 hover:bg-amber-100 dark:hover:bg-amber-900/40 hover:scale-105 transition-all cursor-pointer text-amber-600 text-[9px] font-black uppercase tracking-widest rounded-full border border-amber-200 dark:border-amber-800/50">
                                                        <ArrowRight size={12} /> Adquirir
                                                    </button>
                                                )}
                                            </div>
                                            <h4 className={`text-sm font-black mb-1 ${mod.active ? 'text-slate-800 dark:text-white' : 'text-slate-500'}`}>{mod.title}</h4>
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold leading-relaxed">{mod.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSettings;
