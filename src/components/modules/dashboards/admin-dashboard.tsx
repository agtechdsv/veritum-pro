'use client'

import React from 'react';
import { ModuleId } from '@/types';
import { DashboardCard } from './shared-dashboard-ui';
import { useTranslation } from '@/contexts/language-context';

interface Props {
    items: any[];
    onModuleChange: (id: ModuleId) => void;
}

const AdminDashboard: React.FC<Props> = ({ items, onModuleChange }) => {
    const { t } = useTranslation();
    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {t('dashboard.adminTitle').split(t('dashboard.groups.admin.title')).map((part: string, i: number) =>
                        i === 0 ? <React.Fragment key={i}>{part}</React.Fragment> : <span key={i} className="text-branding-gradient">{t('dashboard.groups.admin.title')}</span>
                    )}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-2">
                    {t('dashboard.adminSubtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                    <DashboardCard
                        key={item.id}
                        title={item.label}
                        description={item.id === ModuleId.USERS
                            ? t('dashboard.adminUserDesc')
                            : t('dashboard.adminSettingsDesc')}
                        icon={item.icon}
                        color={item.color}
                        onClick={() => onModuleChange(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default AdminDashboard;
