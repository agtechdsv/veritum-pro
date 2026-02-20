'use client'

import React from 'react';
import { ModuleId } from '@/types';
import { DashboardCard } from './shared-dashboard-ui';
import { Boxes, Settings2, Crown } from 'lucide-react';

interface Props {
    onModuleChange: (id: ModuleId) => void;
    userRole: string;
}

const RootDashboard: React.FC<Props> = ({ onModuleChange, userRole }) => {
    const groups = [
        {
            id: ModuleId.DASHBOARD_SUITES,
            title: 'Suítes',
            description: 'Acesse as ferramentas inteligentes do ecossistema Veritum Pro.',
            icon: Boxes,
            color: 'text-indigo-600'
        },
        {
            id: ModuleId.DASHBOARD_ADMIN,
            title: 'Administração',
            description: 'Gerencie usuários, permissões e configurações do sistema.',
            icon: Settings2,
            color: 'text-slate-600'
        },
        ...(userRole === 'Master' ? [{
            id: ModuleId.DASHBOARD_MASTER,
            title: 'Master',
            description: 'Configurações de infraestrutura, suítes e planos comerciais.',
            icon: Crown,
            color: 'text-amber-600'
        }] : [])
    ];

    return (
        <div className="space-y-12 animate-in fade-in zoom-in duration-700">
            <div>
                <h1 className="text-5xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">
                    Bem-vindo ao <span className="text-branding-gradient">Veritum Pro</span>
                </h1>
                <p className="text-xl text-slate-500 dark:text-slate-400 font-medium italic mt-4 max-w-2xl">
                    Selecione uma área para começar a explorar o ecossistema jurídico modular.
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
