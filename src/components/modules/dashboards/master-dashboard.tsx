'use client'

import React from 'react';
import { ModuleId } from '@/types';
import { DashboardCard } from './shared-dashboard-ui';

interface Props {
    items: any[];
    onModuleChange: (id: ModuleId) => void;
}

const MasterDashboard: React.FC<Props> = ({ items, onModuleChange }) => {
    return (
        <div className="space-y-12 animate-in fade-in duration-700">
            <div>
                <h1 className="text-4xl font-black text-slate-800 dark:text-white uppercase tracking-tight">
                    Painel <span className="text-branding-gradient">Master</span>
                </h1>
                <p className="text-slate-500 dark:text-slate-400 font-medium italic mt-2">
                    Configurações estruturais de suítes e planos comerciais.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {items.map((item) => (
                    <DashboardCard
                        key={item.id}
                        title={item.label}
                        description={`Ajustes de alto nível para ${item.label.toLowerCase()}.`}
                        icon={item.icon}
                        color={item.color}
                        onClick={() => onModuleChange(item.id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default MasterDashboard;
