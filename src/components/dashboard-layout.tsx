'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
import PlanManagement from './modules/plan-management';
import { createMasterClient } from '@/lib/supabase/master';
import { Tooltip } from './ui/tooltip';

import {
    ShieldAlert, GitBranch, FileEdit, DollarSign, BarChart3,
    MessageSquare, LogOut, Settings, Menu, X, Bell, Search,
    Camera, Scale, Check, Users, Crown, ChevronRight,
    PanelLeftClose, PanelLeft, PanelLeftOpen, Sun, Moon
} from 'lucide-react';
import SuiteManagement from './modules/suite-management';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { ToastContainer } from './ui/toast';
import SuiteDashboard from './modules/dashboards/suite-dashboard';
import AdminDashboard from './modules/dashboards/admin-dashboard';
import MasterDashboard from './modules/dashboards/master-dashboard';
import RootDashboard from './modules/dashboards/root-dashboard';

interface Props {
    user: User;
    preferences: UserPreferences;
    activeModule: ModuleId;
    activeSuites?: any[];
    planPermissions?: any[];
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

export const DashboardLayout: React.FC<Props> = ({ user, preferences, activeModule, activeSuites = [], planPermissions = [], onModuleChange, onLogout, onUpdateUser, onUpdatePrefs }) => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [pendingAvatar, setPendingAvatar] = useState<string | null>(null);
    const { theme, setTheme } = useTheme();
    const hasSyncedTheme = React.useRef(false);

    // Sync theme with user preferences on mount (ONLY ONCE)
    React.useEffect(() => {
        if (preferences?.theme && !hasSyncedTheme.current) {
            if (theme !== preferences.theme) {
                setTheme(preferences.theme);
            }
            hasSyncedTheme.current = true;
        }
    }, [preferences?.theme, theme, setTheme]);

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
                const baseItem = baseSuiteItems.find(bs => normalize(bs.id) === normalizedDbKey);
                if (baseItem) {
                    return { ...baseItem, label: as.name || baseItem.label, short_desc: as.short_desc, detailed_desc: as.detailed_desc };
                }
                return null;
            })
            .filter(Boolean) as any[]
        : [];

    // DEFENSIVE FALLBACK: If syncedSuites is empty but we have activeSuites or general failure,
    // fallback to baseSuiteItems so the menu never disappears.
    const fallbackSuites = syncedSuites.length > 0 ? syncedSuites : baseSuiteItems;

    // PLAN PERMISSIONS FILTER: Only for non-Master users
    const suiteItems = user.role === 'Master'
        ? fallbackSuites
        : fallbackSuites.filter(bs => {
            const normalizedKey = normalize(bs.id);
            return planPermissions.some(pp => normalize(pp.suite_key) === normalizedKey);
        });

    const adminItems = [
        { id: ModuleId.USERS, label: 'Gestão de Usuários', icon: Users, color: 'text-slate-500' },
        { id: ModuleId.SETTINGS, label: 'Configurações', icon: Settings, color: 'text-slate-500' },
    ];

    const masterItems = [
        { id: ModuleId.SUITES, label: 'Gestão de Suítes', icon: Crown, color: 'text-amber-500' },
        { id: ModuleId.PLANS, label: 'Gestão de Planos', icon: DollarSign, color: 'text-indigo-500' },
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
            case 'sentinel': return <Sentinel credentials={creds} permissions={planPermissions.find(p => normalize(p.suite_key) === 'sentinel')} />;
            case 'nexus': return <Nexus credentials={creds} permissions={planPermissions.find(p => normalize(p.suite_key) === 'nexus')} />;
            case 'scriptor': return <Scriptor credentials={creds} permissions={planPermissions.find(p => normalize(p.suite_key) === 'scriptor')} />;
            case 'valorem': return <Valorem credentials={creds} permissions={planPermissions.find(p => normalize(p.suite_key) === 'valorem')} />;
            case 'cognitio': return <Cognitio credentials={creds} permissions={planPermissions.find(p => normalize(p.suite_key) === 'cognitio')} />;
            case 'vox': return <Vox credentials={creds} permissions={planPermissions.find(p => normalize(p.suite_key) === 'vox')} />;
            case 'settings': return <UserSettings user={user} preferences={preferences} onUpdateUser={onUpdateUser} onUpdatePrefs={onUpdatePrefs} />;
            case 'users': return <UserManagement currentUser={user} />;
            case 'suites': return <SuiteManagement credentials={creds} />;
            case 'plans': return <PlanManagement credentials={creds} />;
            case 'dashboard_suites': return <SuiteDashboard items={suiteItems} onModuleChange={onModuleChange} />;
            case 'dashboard_admin': return <AdminDashboard items={adminItems} onModuleChange={onModuleChange} />;
            case 'dashboard_master': return <MasterDashboard items={masterItems} onModuleChange={onModuleChange} />;
            case 'dashboard_root': return <RootDashboard onModuleChange={onModuleChange} userRole={user.role} />;
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
            <ToastContainer />
            {/* Sidebar */}
            <aside className={`bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col z-50 ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
                <Tooltip content="Voltar ao Início" enabled={true}>
                    <Link href="/" className="p-6 flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer">
                        <Logo />
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.span
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: -10 }}
                                    transition={{ duration: 0.2, delay: 0.1 }}
                                    className="font-black text-lg tracking-tighter text-slate-900 dark:text-white uppercase whitespace-nowrap"
                                >
                                    Veritum <span className="text-branding-gradient">Pro</span>
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </Link>
                </Tooltip>

                <nav className="flex-1 p-4 space-y-8 overflow-y-auto">
                    {/* Suítes Group */}
                    <div className="space-y-2">
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => onModuleChange(ModuleId.DASHBOARD_SUITES)}
                                    className="group flex items-center gap-2 px-3 mb-4 w-full text-left cursor-pointer overflow-hidden"
                                >
                                    <div className={`w-1 h-3 rounded-full transition-all ${normalize(activeModule).includes('dashboard_suites') || suiteItems.some(i => normalize(i.id) === normalize(activeModule)) ? 'bg-indigo-600 h-5' : 'bg-slate-300 group-hover:bg-indigo-400'}`} />
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${normalize(activeModule).includes('dashboard_suites') || suiteItems.some(i => normalize(i.id) === normalize(activeModule)) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Suítes</h3>
                                </motion.button>
                            )}
                        </AnimatePresence>
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
                                    <AnimatePresence>
                                        {isSidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-sm whitespace-nowrap overflow-hidden"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
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
                        <AnimatePresence>
                            {isSidebarOpen && (
                                <motion.button
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    onClick={() => onModuleChange(ModuleId.DASHBOARD_ADMIN)}
                                    className="group flex items-center gap-2 px-3 mb-4 w-full text-left cursor-pointer overflow-hidden"
                                >
                                    <div className={`w-1 h-3 rounded-full transition-all ${normalize(activeModule).includes('dashboard_admin') || adminItems.some(i => i.id === activeModule) ? 'bg-indigo-600 h-5' : 'bg-slate-300 group-hover:bg-indigo-400'}`} />
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${normalize(activeModule).includes('dashboard_admin') || adminItems.some(i => i.id === activeModule) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Administração</h3>
                                </motion.button>
                            )}
                        </AnimatePresence>
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
                                    <AnimatePresence>
                                        {isSidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-sm whitespace-nowrap overflow-hidden"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
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
                                <AnimatePresence>
                                    {isSidebarOpen && (
                                        <motion.button
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            onClick={() => onModuleChange(ModuleId.DASHBOARD_MASTER)}
                                            className="group flex items-center gap-2 px-3 mb-4 w-full text-left cursor-pointer overflow-hidden"
                                        >
                                            <div className={`w-1 h-3 rounded-full transition-all ${normalize(activeModule).includes('dashboard_master') || masterItems.some(i => i.id === activeModule) ? 'bg-amber-500 h-5' : 'bg-slate-300 group-hover:bg-amber-400'}`} />
                                            <h3 className={`text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${normalize(activeModule).includes('dashboard_master') || masterItems.some(i => i.id === activeModule) ? 'text-amber-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Master</h3>
                                        </motion.button>
                                    )}
                                </AnimatePresence>
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
                                            <AnimatePresence>
                                                {isSidebarOpen && (
                                                    <motion.span
                                                        initial={{ opacity: 0, width: 0 }}
                                                        animate={{ opacity: 1, width: 'auto' }}
                                                        exit={{ opacity: 0, width: 0 }}
                                                        transition={{ duration: 0.2 }}
                                                        className="text-sm whitespace-nowrap overflow-hidden"
                                                    >
                                                        {item.label}
                                                    </motion.span>
                                                )}
                                            </AnimatePresence>
                                        </button>
                                    </Tooltip>
                                ))}
                            </div>
                        </>
                    )}
                </nav>

            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col overflow-hidden relative transition-colors duration-300">
                <header className="h-20 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 z-40 transition-colors">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-all text-slate-500 dark:text-slate-400 cursor-pointer">
                            {isSidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
                        </button>

                        {/* Breadcrumbs */}
                        <div className="flex items-center gap-2 text-sm font-medium">
                            <button
                                onClick={() => onModuleChange(ModuleId.DASHBOARD_ROOT)}
                                className="text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                            >
                                Veritum Pro
                            </button>

                            {normalize(activeModule) !== 'dashboard_root' && (
                                <>
                                    <ChevronRight size={14} className="text-slate-300" />
                                    {suiteItems.some(i => normalize(i.id) === normalize(activeModule)) || normalize(activeModule) === 'dashboard_suites' ? (
                                        <button
                                            onClick={() => onModuleChange(ModuleId.DASHBOARD_SUITES)}
                                            className={`${normalize(activeModule) === 'dashboard_suites' ? 'text-slate-800 dark:text-white font-black' : 'text-slate-400 hover:text-indigo-600'} transition-colors cursor-pointer`}
                                        >
                                            Suítes
                                        </button>
                                    ) : adminItems.some(i => i.id === activeModule) || normalize(activeModule) === 'dashboard_admin' ? (
                                        <button
                                            onClick={() => onModuleChange(ModuleId.DASHBOARD_ADMIN)}
                                            className={`${normalize(activeModule) === 'dashboard_admin' ? 'text-slate-800 dark:text-white font-black' : 'text-slate-400 hover:text-indigo-600'} transition-colors cursor-pointer`}
                                        >
                                            Administração
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => onModuleChange(ModuleId.DASHBOARD_MASTER)}
                                            className={`${normalize(activeModule) === 'dashboard_master' ? 'text-slate-800 dark:text-white font-black' : 'text-slate-400 hover:text-indigo-600'} transition-colors cursor-pointer`}
                                        >
                                            Master
                                        </button>
                                    )}
                                </>
                            )}

                            {!normalize(activeModule).startsWith('dashboard_') && (
                                <>
                                    <ChevronRight size={14} className="text-slate-300" />
                                    <span className="text-slate-800 dark:text-white font-black tracking-tight cursor-default">
                                        {(() => {
                                            const label = [...suiteItems, ...adminItems, ...masterItems].find(m => normalize(m.id) === normalize(activeModule))?.label || activeModule;
                                            // Enforce Title Case (First letter upper, rest lower)
                                            return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
                                        })()}
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => {
                                const newTheme = theme === 'dark' ? 'light' : 'dark';
                                setTheme(newTheme);
                                onUpdatePrefs({ ...preferences, theme: newTheme });
                            }}
                            className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all cursor-pointer"
                            title={theme === 'dark' ? 'Mudar para tema claro' : 'Mudar para tema escuro'}
                        >
                            {theme === 'dark' ? <Sun size={22} /> : <Moon size={22} />}
                        </button>

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

                            <Tooltip content="Sair do Ecossistema">
                                <button
                                    onClick={onLogout}
                                    className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-full transition-all cursor-pointer"
                                    title="Sair do Ecossistema"
                                >
                                    <LogOut size={20} />
                                </button>
                            </Tooltip>
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
