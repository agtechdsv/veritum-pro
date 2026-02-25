'use client'

import React from 'react';
import { ModuleId } from '@/types';
import { DashboardCard } from './shared-dashboard-ui';
import { Boxes, Settings2, Crown } from 'lucide-react';

import { useTranslation } from '@/contexts/language-context';

interface Props {
    onModuleChange: (id: ModuleId) => void;
    userRole: string;
    userGroupName?: string;
}

const RootDashboard: React.FC<Props> = ({ onModuleChange, userRole, userGroupName }) => {
    const { t } = useTranslation();
    const isAdmin = userRole === 'Master' || ['Administrador', 'Sócio-Administrador', 'Sócio Administrador'].includes(userRole);
    const superAdminGroups = ['Sócio-Administrativo', 'Sócio-Administrador', 'Sócio Administrador'];
    const isSuperAdmin = userRole === 'Master' || (userGroupName && superAdminGroups.some(g => userGroupName.includes(g)));

    // Administration area is visible if they are an Admin OR if they have access to specific admin modules (like Advogados seeing Users)
    const canSeeAdminArea = isAdmin || (userRole && userRole.includes('Advogado')) || isSuperAdmin;

    const groups = [
        {
            id: ModuleId.DASHBOARD_SUITES,
            title: t('dashboard.groups.modules.title'),
            description: t('dashboard.groups.modules.desc'),
            icon: Boxes,
            color: 'text-indigo-600'
        },
        ...(canSeeAdminArea ? [{
            id: ModuleId.DASHBOARD_ADMIN,
            title: t('dashboard.groups.admin.title'),
            description: t('dashboard.groups.admin.desc'),
            icon: Settings2,
            color: 'text-slate-600'
        }] : []),
        ...(userRole === 'Master' ? [{
            id: ModuleId.DASHBOARD_MASTER,
            title: t('dashboard.groups.master.title'),
            description: t('dashboard.groups.master.desc'),
            icon: Crown,
            color: 'text-amber-600'
        }] : [])
    ];

    return (
        <div className="space-y-12 animate-in fade-in zoom-in duration-700">
            <div>
                <h1 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    {t('dashboard.welcome')} <span className="text-branding-gradient">{t('dashboard.veritumPro')}</span>
                </h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium italic mt-4 max-w-2xl">
                    {t('dashboard.intro')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {groups.map((group) => (
                    <DashboardCard
                        key={group.id}
                        title={group.title}
                        description={group.description}
                        icon={group.icon}
                        color={group.color}
                        onClick={() => onModuleChange(group.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default RootDashboard;
