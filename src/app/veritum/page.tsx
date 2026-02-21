'use client'

import React from 'react';
import { useModule } from './layout';
import RootDashboard from '@/components/modules/dashboards/root-dashboard';
import { useRouter } from 'next/navigation';
import { ModuleId } from '@/types';

export default function VeritumPage() {
    const { user } = useModule();
    const router = useRouter();

    if (!user) return null;

    const handleModuleChange = (newModule: ModuleId) => {
        // Redirect to the dynamic route for the module
        router.push(`/veritum/${newModule.toLowerCase().replace('_key', '')}`);
    };

    return (
        <RootDashboard
            userRole={user.role}
            onModuleChange={handleModuleChange}
        />
    );
}
