'use client'

import React, { useState } from 'react';
import { ModuleId, User, UserPreferences, Credentials } from '@/types';
// Modules ported
import Sentinel from './modules/sentinel';
import Nexus from './modules/nexus';
import Scriptor from './modules/scriptor';
import Valorem from './modules/valorem';
import Cognitio from './modules/cognitio';
import Vox from './modules/vox';
import UserSettings from './modules/user-settings';
import UserManagement from './modules/user-management';
import { createMasterClient } from '@/lib/supabase/master';
import { Tooltip } from './ui/tooltip';

import {
    ShieldAlert, GitBranch, FileEdit, DollarSign, BarChart3,
    MessageSquare, LogOut, Settings, Menu, X, Bell, Search,
    Camera, Scale, Check, Users, Crown
} from 'lucide-react';
import SuiteManagement from './modules/suite-management';
import { useTheme } from 'next-themes';
import Link from 'next/link';

interface Props {
    user: User;
    preferences: UserPreferences;
    activeModule: ModuleId;
    activeSuites?: any[];
    onModuleChange: (m: ModuleId) => void;
    onLogout: () => void;
    onUpdateUser: (u: User) => void;
    onUpdatePrefs: (p: UserPreferences) => void;
}

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <Scale className="h-5 w-5" />
    </div>
);

export const DashboardLayout: React.FC<Props> = ({ user, preferences, activeModule, activeSuites = [], onModuleChange, onLogout, onUpdateUser, onUpdatePrefs }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
    const { theme, setTheme } = useTheme();

    const baseSuiteItems = [
        { id: ModuleId.NEXUS, label: 'Nexus', icon: GitBranch, color: 'text-indigo-500' },
        { id: ModuleId.SCRIPTOR, label: 'Scriptor', icon: FileEdit, color: 'text-amber-500' },
        { id: ModuleId.VALOREM, label: 'Valorem', icon: DollarSign, color: 'text-emerald-500' },
        { id: ModuleId.COGNITIO, label: 'Cognitio', icon: BarChart3, color: 'text-cyan-500' },
        { id: ModuleId.VOX, label: 'Vox Clientis', icon: MessageSquare, color: 'text-violet-500' },
        { id: ModuleId.SENTINEL, label: 'Sentinel', icon: ShieldAlert, color: 'text-rose-500' },
    ];

    // Key Normalization for matching DB keys (e.g. SCRIPTOR_KEY) with internal IDs
    const normalize = (k: string) => k?.toLowerCase().replace('_key', '') || '';

    // Sync order with activeSuites from DB
    const syncedSuites = activeSuites.length > 0
        ? activeSuites
            .map(as => {
                const normalizedDbKey = normalize(as.suite_key);
                return baseSuiteItems.find(bs => normalize(bs.id) === normalizedDbKey);
            })
            .filter(Boolean) as typeof baseSuiteItems
        : [];

    // DEFENSIVE FALLBACK: If syncedSuites is empty but we have activeSuites or general failure,
    // fallback to baseSuiteItems so the menu never disappears.
    const suiteItems = syncedSuites.length > 0 ? syncedSuites : baseSuiteItems;

    const adminItems = [
        { id: ModuleId.USERS, label: 'Gestão de Usuários', icon: Users, color: 'text-slate-500' },
        { id: ModuleId.SETTINGS, label: 'Configurações', icon: Settings, color: 'text-slate-500' },
    ];

    const masterItems = [
        { id: ModuleId.SUITES, label: 'Gestão de Suítes', icon: Crown, color: 'text-amber-500' },
    ];

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result as string;
                // Update preview immediately, but set pending for DB
                onUpdateUser({ ...user, avatar_url: base64 });
                setPendingAvatar(base64);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAvatar = async () => {
        if (!pendingAvatar) return;

        try {
            const supabase = createMasterClient();
            const { error } = await supabase
                .from('users')
                .update({ avatar_url: pendingAvatar })
                .eq('id', user.id);

            if (error) throw error;
            setPendingAvatar(null);
            // Optionally show a small toast/feedback
        } catch (err) {
            console.error('Failed to persist avatar:', err);
        }
    };

    const renderModule = () => {
        const creds: Credentials = {
            supabaseUrl: preferences.custom_supabase_url || '',
            supabaseAnonKey: preferences.custom_supabase_key || '',
            geminiKey: preferences.custom_gemini_key || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
        };

        const moduleToRender = normalize(activeModule);

        switch (moduleToRender) {
            case 'sentinel': return <Sentinel credentials={creds} />;
            case 'nexus': return <Nexus credentials={creds} />;
            case 'scriptor': return <Scriptor credentials={creds} />;
            case 'valorem': return <Valorem credentials={creds} />;
            case 'cognitio': return <Cognitio credentials={creds} />;
            case 'vox': return <Vox credentials={creds} />;
            case 'settings': return <UserSettings user={user} preferences={preferences} onUpdateUser={onUpdateUser} onUpdatePrefs={onUpdatePrefs} />;
            case 'users': return <UserManagement currentUser={user} />;
            case 'suites': return <SuiteManagement credentials={creds} />;
            default:
                return (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400">
                        <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center">
                            <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Módulo {activeModule}</h3>
                            <p>Este módulo está sendo migrado do ecossistema original.</p>
                        </div>
                    </div>
                );
        }
    };

    return (
        <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 overflow-hidden transition-colors duration-300">
            {/* Sidebar */}
            <aside className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <Tooltip content="Voltar ao Início" enabled={true}>
                    <Link href="/" className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                        <Logo />
                        {isSidebarOpen && (
                            <span className="font-black text-lg tracking-tighter text-slate-900 dark:text-white uppercase">
                                Veritum <span className="text-indigo-600">Pro</span>
                            </span>
                        )}
                    </Link>
                </Tooltip>

                <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
                    {/* Suítes Group */}
                    <div className="space-y-2">
                        {isSidebarOpen && (
                            <div className="flex items-center gap-2 px-3 mb-4">
                                <div className="w-1 h-3 bg-indigo-600 rounded-full" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Suítes</h3>
                            </div>
                        )}
                        {suiteItems.map((item) => (
                            <Tooltip key={item.id} content={item.label} enabled={!isSidebarOpen}>
                                <button
                                    onClick={() => onModuleChange(item.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${normalize(activeModule) === normalize(item.id)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                >
                                    <item.icon size={20} className={normalize(activeModule) === normalize(item.id) ? item.color : 'text-slate-400 dark:text-slate-500'} />
                                    {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                                </button>
                            </Tooltip>
                        ))}
                    </div>

                    {/* Debossed Separator Line */}
                    <div className="mx-2 my-2 transition-all">
                        <div className="h-px bg-slate-200 dark:bg-slate-800 shadow-[0_1px_0_0_rgba(255,255,255,1)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.02)]" />
                    </div>

                    {/* Administração Group */}
                    <div className="space-y-2">
                        {isSidebarOpen && (
                            <div className="flex items-center gap-2 px-3 mb-4">
                                <div className="w-1 h-3 bg-slate-400 rounded-full" />
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Administração</h3>
                            </div>
                        )}
                        {adminItems.map((item) => (
                            <Tooltip key={item.id} content={item.label} enabled={!isSidebarOpen}>
                                <button
                                    key={item.id}
                                    onClick={() => onModuleChange(item.id)}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${activeModule === item.id
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <item.icon size={20} className={activeModule === item.id ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'} />
                                    {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                                </button>
                            </Tooltip>
                        ))}
                    </div>

                    {/* Master Group */}
                    {user.role === 'Master' && (
                        <>
                            <div className="mx-2 my-2 transition-all">
                                <div className="h-px bg-slate-200 dark:bg-slate-800 shadow-[0_1px_0_0_rgba(255,255,255,1)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.02)]" />
                            </div>
                            <div className="space-y-2">
                                {isSidebarOpen && (
                                    <div className="flex items-center gap-2 px-3 mb-4">
                                        <div className="w-1 h-3 bg-amber-500 rounded-full" />
                                        <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Master</h3>
                                    </div>
                                )}
                                {masterItems.map((item) => (
                                    <Tooltip key={item.id} content={item.label} enabled={!isSidebarOpen}>
                                        <button
                                            onClick={() => onModuleChange(item.id)}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${activeModule === item.id
                                                ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold shadow-sm'
                                                : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                                                }`}
                                        >
                                            <item.icon size={20} className={activeModule === item.id ? item.color : 'text-slate-400 dark:text-slate-500'} />
                                            {isSidebarOpen && <span className="text-sm">{item.label}</span>}
                                        </button>
                                    </Tooltip>
                                ))}
                            </div>
                        </>
                    )}
                </nav>

                <div className="p-4 border-t border-slate-100 dark:border-slate-800">
                    <Tooltip content="Sair do Ecossistema" enabled={!isSidebarOpen}>
                        <button
                            onClick={onLogout}
                            className="w-full flex items-center gap-3 p-3 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all cursor-pointer"
                        >
                            <LogOut size={20} />
                            {isSidebarOpen && <span className="text-sm font-semibold">Sair do Ecossistema</span>}
                        </button>
                    </Tooltip>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative transition-colors duration-300">
                <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-40 transition-colors">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500 dark:text-slate-400 cursor-pointer">
                            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white capitalize">
                            {[...suiteItems, ...adminItems].find(m => m.id === activeModule)?.label || 'Início'}
                        </h2>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="hidden lg:flex relative items-center">
                            <Search className="absolute left-3 text-slate-400 dark:text-slate-500" size={16} />
                            <input
                                placeholder="Busca global..."
                                className="pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm w-64 focus:ring-2 focus:ring-indigo-600 outline-none dark:text-white text-slate-800 transition-colors"
                            />
                        </div>

                        <button className="relative p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer">
                            <Bell size={22} />
                            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full"></span>
                        </button>

                        <div className="flex items-center gap-4 pl-6 border-l border-slate-100 dark:border-slate-800">
                            <div className="text-right hidden sm:block">
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{user.name}</p>
                                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{user.role}</p>
                            </div>

                            <div className="relative group cursor-pointer">
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-all group-hover:scale-105 group-hover:border-indigo-500">
                                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                                </div>

                                {pendingAvatar && (
                                    <button
                                        onClick={handleSaveAvatar}
                                        title="Salvar novo avatar"
                                        className="absolute -top-2 -right-2 p-1.5 bg-emerald-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-emerald-700 transition-all z-50 animate-bounce border-2 border-white dark:border-slate-900"
                                    >
                                        <Check size={12} />
                                    </button>
                                )}

                                <label className="absolute bottom-[-4px] right-[-4px] p-1.5 bg-indigo-600 text-white rounded-lg shadow-lg cursor-pointer hover:bg-indigo-700 transition-all scale-0 group-hover:scale-100 opacity-0 group-hover:opacity-100">
                                    <Camera size={12} />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarChange} />
                                </label>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                    <div className="max-w-[1600px] mx-auto h-full text-slate-400">
                        {renderModule()}
                    </div>
                </div>
            </main>
        </div>
    );
};
