'use client'

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
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
import AccessManagement from '@/components/modules/access-management';
import IntelligenceHub from '@/components/modules/intelligence-hub';
import PersonManagement from '@/components/modules/person-management';
import { EmailSettingsManager } from '@/components/modules/email-config';
import { CloudSettingsManager } from '@/components/modules/cloud-manager';
import InfraManagement from '@/components/modules/infra-management';
import { ModuleId } from '@/types';
import { BASE_SUITE_ITEMS } from '@/utils/module-meta';
import { GitBranch, FileEdit, DollarSign, BarChart3, MessageSquare, ShieldAlert, Users, Settings, Crown, Calendar as CalendarIcon, Mail, Shield, Zap, User as UserIcon, CreditCard, Server, Cloud } from 'lucide-react';
import { useTranslation } from '@/contexts/language-context';

export default function DynamicModulePage() {
    const { module } = useParams();
    const searchParams = useSearchParams();
    const tabParam = searchParams.get('tab') as 'org' | 'plan' | 'cancel' | null;
    const { user, preferences, planPermissions, credentials, onUpdateUser, onUpdatePrefs, onModuleChange, activeSuites, groupPermissions, allFeatures } = useModule();
    const { t, locale } = useTranslation();

    if (!user || !preferences) return null;

    const normalize = (k: string) => k?.toLowerCase().replace('_key', '') || '';
    const moduleToRender = normalize(module as string);

    // Sidebar items for dashboards (need to match DashboardLayout logic)

    // Sync order and texts with activeSuites from DB
    const syncedSuites = activeSuites.length > 0
        ? activeSuites
            .map(as => {
                const normalizedDbKey = normalize(as.suite_key);
                const baseItem = BASE_SUITE_ITEMS.find(bs => normalize(bs.id) === normalizedDbKey);
                if (baseItem) {
                    const nameObj = typeof as.name === 'object' ? as.name : {};
                    const localizedLabel = nameObj[locale as keyof typeof nameObj] || nameObj.pt || baseItem.label;

                    return {
                        ...baseItem,
                        label: typeof localizedLabel === 'string' ? localizedLabel : baseItem.label,
                        short_desc: as.short_desc,
                        detailed_desc: as.detailed_desc
                    };
                }
                return null;
            })
            .filter(Boolean) as any[]
        : BASE_SUITE_ITEMS;

    const superAdminRoles = ['Sócio-Administrador', 'Sócio Administrador', 'Administrador', 'Sócio-Administrativo'];
    const isSocioAdminRole = superAdminRoles.some(r => user.role?.includes(r));
    const superAdminGroups = ['Sócio-Administrativo', 'Sócio-Administrador', 'Sócio Administrador'];
    const isSocioAdminGroup = user.access_group_name && superAdminGroups.some(g => user.access_group_name?.includes(g));
    const isSuperAdmin = user.role === 'Master' || isSocioAdminRole || isSocioAdminGroup;
    const isAdmin = isSuperAdmin || user.role === 'Administrador';

    const suiteItems = isSuperAdmin
        ? syncedSuites.map(bs => {
            const normalizedKey = normalize(bs.id);

            const isTrialPlan = (typeof user.plan_name === 'string' ? user.plan_name : String(user.plan_name || '')).toLowerCase().includes('trial');

            // 1. Plan Check (Robust comparison)
            const hasPlanAccess = isTrialPlan || (planPermissions.length > 0 && planPermissions.some(pp => {
                const pKey = typeof pp === 'string' ? pp : pp.suite_key;
                return normalize(pKey) === normalizedKey;
            }));

            // 2. Permission Check (RBAC)
            let hasGroupAccess = false; // Default to locked
            if (user.role === 'Master' || user.role === 'Sócio-Administrador' || user.role === 'Sócio Administrador') {
                hasGroupAccess = true;
            } else if (user.access_group_id) {
                const suiteData = activeSuites.find(as => normalize(as.suite_key) === normalizedKey);
                if (suiteData) {
                    const suiteFeatureIds = allFeatures.filter(f => f.suite_id === suiteData.id).map(f => f.id);
                    hasGroupAccess = groupPermissions.some(p => suiteFeatureIds.includes(p.feature_id) && p.can_access);
                } else {
                    hasGroupAccess = true;
                }
            } else {
                hasGroupAccess = true;
            }

            return {
                ...bs,
                isLocked: (!hasPlanAccess || !hasGroupAccess) && user.role !== 'Master'
            };
        })
        : syncedSuites.filter(bs => {
            const normalizedKey = normalize(bs.id);
            // Block Valorem for Estagiários (Legacy Core Rule)
            if (normalizedKey === 'valorem' && user.role === 'Estagiário / Paralegal') return false;

            const isTrialPlan = (typeof user.plan_name === 'string' ? user.plan_name : String(user.plan_name || '')).toLowerCase().includes('trial');

            // 1. Plan Check (Robust comparison)
            const hasPlanAccess = isTrialPlan || (planPermissions.length > 0 && planPermissions.some(pp => {
                const pKey = typeof pp === 'string' ? pp : pp.suite_key;
                return normalize(pKey) === normalizedKey;
            }));
            if (!hasPlanAccess) return false;

            // 2. DYNAMIC RBAC: Check if user has an access group
            if (user.role === 'Master' || user.role === 'Sócio-Administrador' || user.role === 'Sócio Administrador') {
                return true;
            } else if (user.access_group_id) {
                // Find Suite UUID to match with features
                const suiteData = activeSuites.find(as => normalize(as.suite_key) === normalizedKey);
                if (!suiteData) return false;

                // User must have at least one feature enabled in this suite
                const suiteFeatureIds = allFeatures.filter(f => f.suite_id === suiteData.id).map(f => f.id);
                return groupPermissions.some(p => suiteFeatureIds.includes(p.feature_id) && p.can_access);
            }

            return true;
        }).map(bs => ({ ...bs, isLocked: false }));

    const adminItems = [
        { id: ModuleId.USERS, label: t('management.users.title'), icon: Users, color: 'text-slate-500' },
        { id: ModuleId.PERSONS, label: t('management.master.persons.title'), icon: UserIcon, color: 'text-emerald-600' },
        { id: ModuleId.ACCESS_GROUPS, label: t('management.accessGroups.title'), icon: Shield, color: 'text-indigo-600' },
        { id: ModuleId.SETTINGS, label: t('management.settings.title'), icon: Settings, color: 'text-slate-500' },
        { id: ModuleId.INFRA, label: 'Infraestrutura', icon: Server, color: 'text-slate-500' },
    ];

    const filteredAdminItems = adminItems.filter(item => {
        if (item.id === ModuleId.USERS || item.id === ModuleId.PERSONS) {
            return isAdmin || (user.role && user.role.includes('Advogado'));
        }
        return isSuperAdmin;
    });

    const masterItems = [
        { id: ModuleId.SUITES, label: t('management.master.suites.title'), icon: Crown, color: 'text-amber-500' },
        { id: ModuleId.PLANS, label: t('management.master.plans.title'), icon: DollarSign, color: 'text-indigo-500' },
        { id: ModuleId.SCHEDULING, label: t('management.master.scheduling.title'), icon: CalendarIcon, color: 'text-rose-500' },
        { id: ModuleId.EMAIL_CONFIG, label: t('management.master.email.title'), icon: Mail, color: 'text-cyan-500' },
        { id: ModuleId.FINTECH, label: 'Gestão Fintech', icon: CreditCard, color: 'text-emerald-500' },
        { id: ModuleId.CLOUD_CONFIG, label: 'Gestão de Cloud / Add-Ons', icon: Cloud, color: 'text-cyan-400' },
    ];

    switch (moduleToRender) {
        case 'sentinel': return <Sentinel credentials={credentials} user={user} permissions={planPermissions.find(p => normalize(p.suite_key) === 'sentinel')} />;
        case 'nexus': return <Nexus credentials={credentials} user={user} permissions={planPermissions.find(p => normalize(p.suite_key) === 'nexus')} />;
        case 'scriptor': return <Scriptor credentials={credentials} user={user} permissions={planPermissions.find(p => normalize(p.suite_key) === 'scriptor')} />;
        case 'valorem': return <Valorem credentials={credentials} user={user} permissions={planPermissions.find(p => normalize(p.suite_key) === 'valorem')} />;
        case 'cognitio': return <Cognitio credentials={credentials} user={user} permissions={planPermissions.find(p => normalize(p.suite_key) === 'cognitio')} />;
        case 'vox': return <Vox credentials={credentials} user={user} permissions={planPermissions.find(p => normalize(p.suite_key) === 'vox')} />;
        case 'intelligence': return <IntelligenceHub credentials={credentials} user={user} permissions={planPermissions.find(p => normalize(p.suite_key) === 'intelligence')} />;
        case 'settings': return <UserSettings user={user} preferences={preferences} onUpdateUser={onUpdateUser} onUpdatePrefs={onUpdatePrefs} initialTab={tabParam || undefined} />;
        case 'users': return <UserManagement currentUser={user} />;
        case 'suites': return <SuiteManagement credentials={credentials} />;
        case 'plans': return <PlanManagement credentials={credentials} />;
        case 'scheduling': return <SchedulingManagement />;
        case 'email_config': return <EmailSettingsManager />;
        case 'cloud_config': return <CloudSettingsManager credentials={credentials} />;
        case 'access_groups': return <AccessManagement currentUser={user} />;
        case 'infra': return <InfraManagement currentUser={user} />;
        case 'persons': return <PersonManagement credentials={credentials} preferences={preferences} currentUser={user} />;
        case 'dashboard_suites': return <SuiteDashboard items={suiteItems} onModuleChange={onModuleChange} currentUser={user} />;
        case 'dashboard_admin': return <AdminDashboard items={filteredAdminItems} onModuleChange={onModuleChange} />;
        case 'dashboard_master': return <MasterDashboard items={masterItems} onModuleChange={onModuleChange} />;
        default:
            return (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                    <div className="p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl text-center">
                        <h3 className="text-2xl font-bold mb-2 text-slate-800 dark:text-white">{t('modules.notInPlan')}</h3>
                        <p>{t('common.error')}: {moduleToRender}</p>
                    </div>
                </div>
            );
    }
}
