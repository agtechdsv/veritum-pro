'use client'

import React from 'react';
import { useParams } from 'next/navigation';
import { useModule } from '../layout';
import Sentinel from '@/components/modules/sentinel';
import Nexus from '@/components/modules/nexus';
import Scriptor from '@/components/modules/scriptor';
import Valorem from '@/components/modules/valorem';
import Cognitio from '@/components/modules/cognitio';
import Vox from '@/components/modules/vox';
import UserSettings from '@/components/modules/user-settings';
import UserManagement from '@/components/modules/user-management';
import PlanManagement from '@/components/modules/plan-management';
import SuiteManagement from '@/components/modules/suite-management';
import SchedulingManagement from '@/components/modules/scheduling-management';
import SuiteDashboard from '@/components/modules/dashboards/suite-dashboard';
import AdminDashboard from '@/components/modules/dashboards/admin-dashboard';
import MasterDashboard from '@/components/modules/dashboards/master-dashboard';
import { EmailSettingsManager } from '@/components/modules/email-config';
import { ModuleId } from '@/types';
import { GitBranch, FileEdit, DollarSign, BarChart3, MessageSquare, ShieldAlert, Users, Settings, Crown, Calendar as CalendarIcon, Mail } from 'lucide-react';

export default function DynamicModulePage() {
    const { module } = useParams();
    const { user, preferences, planPermissions, credentials, onUpdateUser, onUpdatePrefs, onModuleChange, activeSuites } = useModule();

    if (!user || !preferences) return null;

    const normalize = (k: string) => k?.toLowerCase().replace('_key', '') || '';
    const moduleToRender = normalize(module as string);

    // Sidebar items for dashboards (need to match DashboardLayout logic)
    const baseSuiteItems = [
        { id: ModuleId.NEXUS, label: 'Nexus', icon: GitBranch, color: 'text-indigo-500' },
        { id: ModuleId.SCRIPTOR, label: 'Scriptor', icon: FileEdit, color: 'text-amber-500' },
        { id: ModuleId.VALOREM, label: 'Valorem', icon: DollarSign, color: 'text-emerald-500' },
        { id: ModuleId.COGNITIO, label: 'Cognitio', icon: BarChart3, color: 'text-cyan-500' },
        { id: ModuleId.VOX, label: 'Vox Clientis', icon: MessageSquare, color: 'text-violet-500' },
        { id: ModuleId.SENTINEL, label: 'Sentinel', icon: ShieldAlert, color: 'text-rose-500' },
    ];

    // Sync order and texts with activeSuites from DB
    const syncedSuites = activeSuites.length > 0
        ? activeSuites
            .map(as => {
                const normalizedDbKey = normalize(as.suite_key);
                const baseItem = baseSuiteItems.find(bs => normalize(bs.id) === normalizedDbKey);
                if (baseItem) {
                    return {
                        ...baseItem,
                        label: as.name || baseItem.label,
                        short_desc: as.short_desc,
                        detailed_desc: as.detailed_desc
                    };
                }
                return null;
            })
            .filter(Boolean) as any[]
        : baseSuiteItems;

    const suiteItems = user.role === 'Master'
        ? syncedSuites
        : syncedSuites.filter(bs => planPermissions.some(pp => normalize(pp.suite_key) === normalize(bs.id)));

    const adminItems = [
        { id: ModuleId.USERS, label: 'Gestão de Usuários', icon: Users, color: 'text-slate-500' },
        { id: ModuleId.SETTINGS, label: 'Configurações', icon: Settings, color: 'text-slate-500' },
    ];

    const masterItems = [
        { id: ModuleId.SUITES, label: 'Gestão de Módulos', icon: Crown, color: 'text-amber-500' },
        { id: ModuleId.PLANS, label: 'Gestão de Planos', icon: DollarSign, color: 'text-indigo-500' },
        { id: ModuleId.SCHEDULING, label: 'Agendamentos', icon: CalendarIcon, color: 'text-rose-500' },
        { id: ModuleId.EMAIL_CONFIG, label: 'Gestão de E-mails', icon: Mail, color: 'text-cyan-500' },
    ];

    switch (moduleToRender) {
        case 'sentinel': return <Sentinel credentials={credentials} permissions={planPermissions.find(p => normalize(p.suite_key) === 'sentinel')} />;
        case 'nexus': return <Nexus credentials={credentials} permissions={planPermissions.find(p => normalize(p.suite_key) === 'nexus')} />;
        case 'scriptor': return <Scriptor credentials={credentials} permissions={planPermissions.find(p => normalize(p.suite_key) === 'scriptor')} />;
        case 'valorem': return <Valorem credentials={credentials} permissions={planPermissions.find(p => normalize(p.suite_key) === 'valorem')} />;
        case 'cognitio': return <Cognitio credentials={credentials} permissions={planPermissions.find(p => normalize(p.suite_key) === 'cognitio')} />;
        case 'vox': return <Vox credentials={credentials} permissions={planPermissions.find(p => normalize(p.suite_key) === 'vox')} />;
        case 'settings': return <UserSettings user={user} preferences={preferences} onUpdateUser={onUpdateUser} onUpdatePrefs={onUpdatePrefs} />;
        case 'users': return <UserManagement currentUser={user} />;
        case 'suites': return <SuiteManagement credentials={credentials} />;
        case 'plans': return <PlanManagement credentials={credentials} />;
        case 'scheduling': return <SchedulingManagement />;
        case 'email_config': return <EmailSettingsManager />;
        case 'dashboard_suites': return <SuiteDashboard items={suiteItems} onModuleChange={onModuleChange} />;
        case 'dashboard_admin': return <AdminDashboard items={adminItems} onModuleChange={onModuleChange} />;
        case 'dashboard_master': return <MasterDashboard items={masterItems} onModuleChange={onModuleChange} />;
        default:
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center">
                        <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">Módulo {moduleToRender}</h3>
                        <p>Este módulo não foi encontrado ou está em manutenção.</p>
                    </div>
                </div>
            );
    }
}
