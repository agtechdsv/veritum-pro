'use client'

import React from 'react';
import { ModuleId } from '@/types';
import { DashboardCard } from './shared-dashboard-ui';
import { useTranslation } from '@/contexts/language-context';

interface Props {
    items: any[];
    onModuleChange: (id: ModuleId) => void;
}

const SuiteDashboard: React.FC<Props> = ({ items, onModuleChange }) => {
    const { locale, t } = useTranslation();
    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    {t('dashboard.suiteTitle').split(t('nav.modules')).map((part: string, i: number) =>
                        i === 0 ? <React.Fragment key={i}>{part}</React.Fragment> : <span key={i} className="text-branding-gradient">{t('nav.modules')}</span>
                    )}
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-2">
                    {t('dashboard.suiteSubtitle')}
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                    <DashboardCard
                        key={item.id}
                        title={t(`modules.${item.id.toLowerCase()}.label`) || item.label}
                        subtitle={item.short_desc?.[locale] || item.short_desc?.pt}
                        description={item.detailed_desc?.[locale] || item.detailed_desc?.pt || t('dashboard.accessFunc', { name: t(`modules.${item.id.toLowerCase()}.label`) || item.label })}
                        icon={item.icon}
                        color={item.color}
                        isLocked={item.isLocked}
                        onClick={() => onModuleChange(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default SuiteDashboard;
