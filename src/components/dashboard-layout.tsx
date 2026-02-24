'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ModuleId, User, UserPreferences, Credentials, GroupPermission, Feature } from '@/types';
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
import TeamManagement from './modules/team-management';
import PersonManagement from './modules/person-management';
import IntelligenceHub from './modules/intelligence-hub';
import { createMasterClient } from '@/lib/supabase/master';
import { createDynamicClient } from '@/utils/supabase/client';
import { Tooltip } from './ui/tooltip';
import { EmailSettingsManager } from './modules/email-config';
import AccessManagement from './modules/access-management';
import TrialCountdown from './shared/trial-countdown';
import ProfileModal from './ui/profile-modal';

import {
    LayoutDashboard, Scale, FileEdit, DollarSign, BarChart3,
    MessageSquare, ShieldAlert, Users, Settings, LogOut,
    PanelLeftClose, PanelLeftOpen, Sun, Moon, Bell, Search,
    ChevronRight, Crown, Camera, Check, User as UserIcon,
    Calendar as CalendarIcon, Mail, Shield, GitBranch, Key, Zap, Lock
} from 'lucide-react';
import SuiteManagement from './modules/suite-management';
import { useTheme } from 'next-themes';
import Link from 'next/link';
import { ToastContainer, toast } from './ui/toast';
import SuiteDashboard from './modules/dashboards/suite-dashboard';
import AdminDashboard from './modules/dashboards/admin-dashboard';
import MasterDashboard from './modules/dashboards/master-dashboard';
import RootDashboard from './modules/dashboards/root-dashboard';
import { BASE_SUITE_ITEMS } from '@/utils/module-meta';
import SchedulingManagement from './modules/scheduling-management';

interface Props {
    user: User;
    preferences: UserPreferences;
    activeModule: ModuleId;
    activeSuites?: any[];
    planPermissions?: any[];
    groupPermissions?: any[];
    allFeatures?: any[];
    onModuleChange: (m: ModuleId) => void;
    onLogout: () => void;
    onUpdateUser: (u: User) => void;
    onUpdatePrefs: (p: UserPreferences) => void;
    children?: React.ReactNode;
}

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <Scale className="h-5 w-5" />
    </div>
);

export const DashboardLayout: React.FC<Props> = ({ user, preferences, activeModule, activeSuites = [], planPermissions = [], groupPermissions = [], allFeatures = [], onModuleChange, onLogout, onUpdateUser, onUpdatePrefs, children }) => {
    // BYODB Shadow Provisioning: Ensure user exists in Tenant DB
    React.useEffect(() => {
        const provisionShadowUser = async () => {
            if (!preferences?.custom_supabase_url || !preferences?.custom_supabase_key) return;
            try {
                const tenantClient = createDynamicClient(preferences.custom_supabase_url, preferences.custom_supabase_key);
                await tenantClient.from('users').upsert({
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    avatar_url: user.avatar_url,
                    active: true
                });
            } catch (err) {
                console.error('Failed to provision shadow user on Tenant DB:', err);
            }
        };
        provisionShadowUser();
    }, [user, preferences?.custom_supabase_url, preferences?.custom_supabase_key]);


    // Key Normalization for matching DB keys (e.g. SCRIPTOR_KEY) with internal IDs
    const normalize = (k: string) => k?.toLowerCase().replace('_key', '') || '';

    // Sync order with activeSuites from DB
    const syncedSuites = activeSuites.length > 0
        ? activeSuites
            .map(as => {
                const normalizedDbKey = normalize(as.suite_key);
                const baseItem = BASE_SUITE_ITEMS.find(bs => normalize(bs.id) === normalizedDbKey);
                if (baseItem) {
                    return { ...baseItem, label: as.name || baseItem.label, short_desc: as.short_desc, detailed_desc: as.detailed_desc };
                }
                return null;
            })
            .filter(Boolean) as any[]
        : []; // Added semicolon and empty array for when activeSuites is empty

    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
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

    // DEFENSIVE FALLBACK: If syncedSuites is empty but we have activeSuites or general failure,
    // fallback to baseSuiteItems so the menu never disappears.
    const fallbackSuites = syncedSuites.length > 0 ? syncedSuites : BASE_SUITE_ITEMS;

    const superAdminGroupsNames = ['Sócio-Administrativo', 'Sócio-Administrador', 'Sócio Administrador'];
    const superAdminRoles = ['Sócio-Administrador', 'Sócio Administrador', 'Administrador', 'Sócio-Administrativo'];
    const isSocioAdminRole = superAdminRoles.some(r => user.role?.includes(r));
    const isSocioAdminGroup = user.access_group_name && superAdminGroupsNames.some(g => user.access_group_name?.includes(g));
    const isSuperAdmin = user.role === 'Master' || isSocioAdminRole || isSocioAdminGroup;

    const adminItems = [
        { id: ModuleId.USERS, label: 'Gestão de Usuários', icon: Users, color: 'text-slate-500' },
        { id: ModuleId.ACCESS_GROUPS, label: 'Grupos de Acesso', icon: Shield, color: 'text-indigo-600' },
        { id: ModuleId.SETTINGS, label: 'Configurações', icon: Settings, color: 'text-slate-500' },
    ];

    const masterItems = [
        { id: ModuleId.SUITES, label: 'Gestão de Módulos', icon: Crown, color: 'text-amber-500' },
        { id: ModuleId.PLANS, label: 'Gestão de Planos', icon: DollarSign, color: 'text-indigo-500' },
        { id: ModuleId.SCHEDULING, label: 'Agendamentos', icon: CalendarIcon, color: 'text-rose-500' },
        { id: ModuleId.EMAIL_CONFIG, label: 'Gestão de E-mails', icon: Mail, color: 'text-cyan-500' },
        { id: ModuleId.TEAM, label: 'Gestão de Equipe', icon: Users, color: 'text-indigo-600' },
        { id: ModuleId.PERSONS, label: 'CRM de Clientes', icon: UserIcon, color: 'text-emerald-600' },
    ];

    const isAdmin = user.role === 'Master' || ['Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(user.role);

    // PLAN PERMISSIONS FILTER: Only for non-Master users + Intern Safety (RBAC)
    const suiteItems = isSuperAdmin
        ? fallbackSuites.map(bs => {
            const normalizedKey = normalize(bs.id);

            // 1. Plan Check (Robust comparison)
            const hasPlanAccess = planPermissions.length > 0 && planPermissions.some(pp => {
                const pKey = typeof pp === 'string' ? pp : pp.suite_key;
                return normalize(pKey) === normalizedKey;
            });

            // 2. Permission Check (RBAC)
            let hasGroupAccess = false; // Default to locked for safety
            if (user.role === 'Master') {
                hasGroupAccess = true;
            } else if (user.access_group_id) {
                const suiteData = activeSuites.find(as => normalize(as.suite_key) === normalizedKey);
                if (suiteData) {
                    const suiteFeatureIds = allFeatures.filter(f => f.suite_id === suiteData.id).map(f => f.id);
                    hasGroupAccess = groupPermissions.some(p => suiteFeatureIds.includes(p.feature_id) && p.can_access);
                } else {
                    // If suite not found in DB but is in baseSuiteItems (fallback case)
                    hasGroupAccess = true;
                }
            } else {
                hasGroupAccess = true; // Fallback for legacy users without groups
            }

            return {
                ...bs,
                isLocked: (!hasPlanAccess || !hasGroupAccess) && user.role !== 'Master'
            };
        })
        : fallbackSuites.filter(bs => {
            const normalizedKey = normalize(bs.id);
            // Block Valorem for Estagiários (Legacy Core Rule)
            if (normalizedKey === 'valorem' && user.role === 'Estagiário / Paralegal') return false;

            // 1. Plan Check (Robust comparison)
            const hasPlanAccess = planPermissions.length > 0 && planPermissions.some(pp => {
                const pKey = typeof pp === 'string' ? pp : pp.suite_key;
                return normalize(pKey) === normalizedKey;
            });
            if (!hasPlanAccess) return false;

            // 2. DYNAMIC RBAC: Check if user has an access group
            if (user.access_group_id) {
                // Find Suite UUID to match with features
                const suiteData = activeSuites.find(as => normalize(as.suite_key) === normalizedKey);
                if (!suiteData) return false;

                // User must have at least one feature enabled in this suite
                const suiteFeatureIds = allFeatures.filter(f => f.suite_id === suiteData.id).map(f => f.id);
                const hasGroupAccess = groupPermissions.some(p => suiteFeatureIds.includes(p.feature_id) && p.can_access);
                return hasGroupAccess;
            }

            return true;
        }).map(bs => ({ ...bs, isLocked: false }));

    const filteredAdminItems = adminItems.filter(item => {
        if (item.id === ModuleId.USERS) {
            // USERS: Visible for Master, Admins, and potentially Advogados (as they are in the 'user level' but should see management if allowed)
            // The user said "Menu Gestão de Usuários foi oculto, mas o user tem acesso" for Advogado.
            return isAdmin || user.role.includes('Advogado');
        }
        // ACCESS_GROUPS and SETTINGS: Restricted to SuperAdmin (Sócio-Administrativo group)
        return isSuperAdmin;
    });

    // PROTEÇÃO DE ROTAS - URL ACCESS CONTROL (Regra 3)
    React.useEffect(() => {
        if (user.role === 'Master') return; // Master tem acesso iminente a tudo

        const currentNormalized = normalize(activeModule);

        // 1. Checa se é um módulo core (Suite)
        const isCoreModule = BASE_SUITE_ITEMS.some(bs => normalize(bs.id) === currentNormalized);
        if (isCoreModule) {
            const isAllowedCore = suiteItems.some(si => normalize(si.id) === currentNormalized);
            if (!isAllowedCore) {
                toast.error('Seu plano ou nível de acesso não permite visualizar este módulo.');
                onModuleChange(ModuleId.DASHBOARD_ROOT);
                return;
            }
        }

        // 2. Checa se é módulo Admin
        const isAdminModule = adminItems.some(ai => normalize(ai.id) === currentNormalized);
        if (isAdminModule) {
            if (currentNormalized === 'access_groups' || currentNormalized === 'settings') {
                if (!isSuperAdmin) {
                    toast.error('Acesso restrito ao Grupo Sócio-Administrativo.');
                    onModuleChange(ModuleId.DASHBOARD_ROOT);
                    return;
                }
            } else if (currentNormalized === 'users') {
                const canSeeUsers = isAdmin || user.role.includes('Advogado');
                if (!canSeeUsers) {
                    toast.error('Acesso restrito.');
                    onModuleChange(ModuleId.DASHBOARD_ROOT);
                    return;
                }
            }
        }

        // 3. Checa se é módulo Master
        const isMasterModule = masterItems.some(mi => normalize(mi.id) === currentNormalized);
        if (isMasterModule) {
            toast.error('Acesso negado. Restrito ao Master.');
            onModuleChange(ModuleId.DASHBOARD_ROOT);
            return;
        }

    }, [activeModule, suiteItems, user.role, onModuleChange]);

    const renderModule = () => {
        const creds: Credentials = {
            supabaseUrl: preferences.custom_supabase_url || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
            supabaseAnonKey: preferences.custom_supabase_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
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
            case 'intelligence': return <IntelligenceHub credentials={creds} permissions={planPermissions.find(p => normalize(p.suite_key) === 'intelligence')} />;
            case 'settings': return <UserSettings user={user} preferences={preferences} onUpdateUser={onUpdateUser} onUpdatePrefs={onUpdatePrefs} />;
            case 'users': return <UserManagement currentUser={user} />;
            case 'suites': return <SuiteManagement credentials={creds} />;
            case 'plans': return <PlanManagement credentials={creds} />;
            case 'scheduling': return <SchedulingManagement />;
            case ModuleId.EMAIL_CONFIG:
                return <EmailSettingsManager />;
            case ModuleId.ACCESS_GROUPS:
                return <AccessManagement currentUser={user} />;
            case ModuleId.TEAM:
                return <TeamManagement credentials={creds} />;
            case ModuleId.PERSONS:
                return <PersonManagement credentials={creds} />;
            case 'dashboard_suites': return <SuiteDashboard items={suiteItems} onModuleChange={onModuleChange} />;
            case 'dashboard_admin': return <AdminDashboard items={filteredAdminItems} onModuleChange={onModuleChange} />;
            case 'dashboard_master': return <MasterDashboard items={masterItems} onModuleChange={onModuleChange} />;
            case 'dashboard_root': return <RootDashboard onModuleChange={onModuleChange} userRole={user.role} userGroupName={user.access_group_name} />;
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
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${normalize(activeModule).includes('dashboard_suites') || suiteItems.some(i => normalize(i.id) === normalize(activeModule)) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Módulos</h3>
                                </motion.button>
                            )}
                        </AnimatePresence>
                        {suiteItems.map((item: any) => (
                            <Tooltip key={item.id} content={item.label} enabled={!isSidebarOpen}>
                                <Link
                                    href={item.isLocked ? '#' : `/veritum/${normalize(item.id)}`}
                                    onClick={(e) => {
                                        if (item.isLocked) {
                                            e.preventDefault();
                                            toast.error('Este módulo não faz parte do seu plano atual.');
                                        }
                                    }}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${item.isLocked ? 'opacity-50 grayscale' : ''} ${normalize(activeModule) === normalize(item.id)
                                        ? 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-400 font-bold shadow-sm'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-white'
                                        }`}
                                >
                                    <div className="relative">
                                        <item.icon size={20} className={normalize(activeModule) === normalize(item.id) ? item.color : 'text-slate-400 dark:text-slate-500'} />
                                        {item.isLocked && (
                                            <div className="absolute -top-1.5 -right-1.5 bg-amber-500 text-white rounded-full p-0.5 border-2 border-white dark:border-slate-900">
                                                <Lock size={8} />
                                            </div>
                                        )}
                                    </div>
                                    <AnimatePresence>
                                        {isSidebarOpen && (
                                            <motion.span
                                                initial={{ opacity: 0, width: 0 }}
                                                animate={{ opacity: 1, width: 'auto' }}
                                                exit={{ opacity: 0, width: 0 }}
                                                transition={{ duration: 0.2 }}
                                                className="text-sm whitespace-nowrap overflow-hidden flex-1"
                                            >
                                                {item.label}
                                            </motion.span>
                                        )}
                                    </AnimatePresence>
                                </Link>
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
                                    <div className={`w-1 h-3 rounded-full transition-all ${normalize(activeModule).includes('dashboard_admin') || filteredAdminItems.some(i => i.id === activeModule) ? 'bg-indigo-600 h-5' : 'bg-slate-300 group-hover:bg-indigo-400'}`} />
                                    <h3 className={`text-[10px] font-black uppercase tracking-widest transition-colors whitespace-nowrap ${normalize(activeModule).includes('dashboard_admin') || filteredAdminItems.some(i => i.id === activeModule) ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}`}>Administração</h3>
                                </motion.button>
                            )}
                        </AnimatePresence>
                        {filteredAdminItems.map((item) => (
                            <Tooltip key={item.id} content={item.label} enabled={!isSidebarOpen}>
                                <Link
                                    key={item.id}
                                    href={`/veritum/${normalize(item.id)}`}
                                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${normalize(activeModule) === normalize(item.id)
                                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-bold'
                                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
                                        }`}
                                >
                                    <item.icon size={20} className={normalize(activeModule) === normalize(item.id) ? 'text-indigo-600' : 'text-slate-400 dark:text-slate-500'} />
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
                                </Link>
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
                                        <Link
                                            href={`/veritum/${normalize(item.id)}`}
                                            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 cursor-pointer ${normalize(activeModule) === normalize(item.id)
                                                ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold shadow-sm'
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
                                        </Link>
                                    </Tooltip>
                                ))}
                            </div>
                        </>
                    )}
                </nav>

                {/* 💎 TRIAL COUNTDOWN */}
                <TrialCountdown
                    userId={user.id}
                    isSidebarOpen={isSidebarOpen}
                />

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
                                            Módulos
                                        </button>
                                    ) : filteredAdminItems.some(i => i.id === activeModule) || normalize(activeModule) === 'dashboard_admin' ? (
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
                                            const label = [...suiteItems, ...filteredAdminItems, ...masterItems].find(m => normalize(m.id) === normalize(activeModule))?.label || activeModule;
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

                            <div
                                className="relative group"
                                onMouseEnter={() => setIsUserMenuOpen(true)}
                                onMouseLeave={() => setIsUserMenuOpen(false)}
                            >
                                <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-all group-hover:scale-105 group-hover:border-indigo-500 cursor-pointer">
                                    <img src={user.avatar_url || `https://ui-avatars.com/api/?name=${user.name}&background=6366f1&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                                </div>

                                <AnimatePresence>
                                    {isUserMenuOpen && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                            className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-[100] overflow-hidden"
                                        >
                                            <button
                                                onClick={() => {
                                                    setIsProfileModalOpen(true);
                                                    setIsUserMenuOpen(false);
                                                }}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                                            >
                                                <UserIcon size={18} className="text-indigo-600" />
                                                Meu Perfil
                                            </button>
                                            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-1" />
                                            <button
                                                onClick={onLogout}
                                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left cursor-pointer"
                                            >
                                                <LogOut size={18} />
                                                Sair do Ecossistema
                                            </button>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="flex-1 overflow-y-auto p-8 bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
                    <div className="max-w-[1600px] mx-auto h-full text-slate-400">
                        {children}
                    </div>
                </div>

                <ProfileModal
                    isOpen={isProfileModalOpen}
                    onClose={() => setIsProfileModalOpen(false)}
                    user={user}
                    onUpdateUser={onUpdateUser}
                />
            </main>
        </div >
    );
};
