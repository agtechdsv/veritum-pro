'use client'

import React from 'react';
import { ModuleId } from '@/types';
import { DashboardCard } from './shared-dashboard-ui';

interface Props {
    items: any[];
    onModuleChange: (id: ModuleId) => void;
}

const SuiteDashboard: React.FC<Props> = ({ items, onModuleChange }) => {
    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    Dashboard de <span className="text-indigo-600">Suítes</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-2">
                    Acesse as ferramentas do ecossistema Veritum Pro.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                    <DashboardCard
                        key={item.id}
                        title={item.label}
                        description={item.detailed_desc?.pt || item.short_desc?.pt || `Módulo e funções da suíte ${item.label}.`}
                        icon={item.icon}
                        color={item.color}
                        onClick={() => onModuleChange(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default SuiteDashboard;
