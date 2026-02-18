'use client'

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { User, UserPreferences, ModuleId } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';

export default function VeritumPage() {
    const [user, setUser] = useState<User | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.NEXUS);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const supabase = createMasterClient();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                router.push('/?login=true');
                return;
            }

            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('*')
                .eq('id', authUser.id)
                .single();

            if (profileError) {
                console.error("Erro ao buscar perfil na tabela public.users:", profileError);
            }

            setUser({
                id: authUser.id,
                name: profile?.name || authUser.user_metadata.full_name || 'Usuário',
                username: profile?.username || authUser.email?.split('@')[0] || 'user',
                role: (profile?.role || authUser.user_metadata.role || 'Operador') as any,
                active: profile?.active ?? true,
                avatar_url: profile?.avatar_url || authUser.user_metadata.avatar_url || authUser.user_metadata.picture,
                parent_user_id: profile?.parent_user_id || authUser.user_metadata.parent_user_id
            });

            const { data: prefs } = await supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', authUser.id)
                .single();

            setPreferences({
                user_id: authUser.id,
                language: prefs?.language || 'pt',
                theme: prefs?.theme || 'dark',
                custom_supabase_url: prefs?.custom_supabase_url,
                custom_supabase_key: prefs?.custom_supabase_key,
                custom_gemini_key: prefs?.custom_gemini_key,
            });

            setLoading(false);
        };

        checkUser();
    }, [router, supabase]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleModuleChange = (newModule: ModuleId) => {
        // Instantaneous switch via state
        setActiveModule(newModule);
    };

    if (loading) {
        return (
            <div className="h-screen w-full flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white font-medium animate-pulse">Carregando Ecossistema...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            user={user!}
            preferences={preferences!}
            activeModule={activeModule}
            onModuleChange={handleModuleChange}
            onLogout={handleLogout}
            onUpdateUser={(u) => setUser(u)}
            onUpdatePrefs={(p) => setPreferences(p)}
        />
    );
}
