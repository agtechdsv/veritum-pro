'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { User, UserPreferences, ModuleId } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';

export const normalizeModuleKey = (key: string): string => {
    if (!key) return '';
    return key.toLowerCase().replace('_key', '');
};

export default function VeritumPage() {
    return (
        <Suspense fallback={
            <div className="h-screen w-full flex items-center justify-center bg-slate-950">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-white font-medium animate-pulse">Iniciando Ecossistema...</p>
                </div>
            </div>
        }>
            <VeritumContent />
        </Suspense>
    );
}

function VeritumContent() {
    const [user, setUser] = useState<User | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.DASHBOARD_ROOT);
    const [activeSuites, setActiveSuites] = useState<any[]>([]);
    const [planPermissions, setPlanPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const searchParams = useSearchParams();
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
                parent_user_id: profile?.parent_user_id || authUser.user_metadata.parent_user_id,
                plan_id: profile?.plan_id || authUser.user_metadata.plan_id
            });

            // Fetch plan permissions if user has a plan_id
            if (profile?.plan_id) {
                const { data: perms } = await supabase
                    .from('plan_permissions')
                    .select('feature_id, features(feature_key, suite_id, suites(suite_key))')
                    .eq('plan_id', profile.plan_id);

                if (perms) {
                    // Transform to legacy format for DashboardLayout compatibility
                    const suiteMap = new Map<string, any>();
                    perms.forEach((p: any) => {
                        const sKey = p.features?.suites?.suite_key;
                        const fKey = p.features?.feature_key;
                        if (sKey && fKey) {
                            if (!suiteMap.has(sKey)) {
                                suiteMap.set(sKey, { suite_key: sKey, enabled_features: [] });
                            }
                            suiteMap.get(sKey).enabled_features.push(fKey);
                        }
                    });
                    setPlanPermissions(Array.from(suiteMap.values()));
                }
            } else if (profile?.parent_user_id) {
                // If it's an operator, inherit permissions from parent admin
                const { data: parentProfile } = await supabase
                    .from('users')
                    .select('plan_id')
                    .eq('id', profile.parent_user_id)
                    .single();

                if (parentProfile?.plan_id) {
                    const { data: perms } = await supabase
                        .from('plan_permissions')
                        .select('feature_id, features(feature_key, suite_id, suites(suite_key))')
                        .eq('plan_id', parentProfile.plan_id);

                    if (perms) {
                        const suiteMap = new Map<string, any>();
                        perms.forEach((p: any) => {
                            const sKey = p.features?.suites?.suite_key;
                            const fKey = p.features?.feature_key;
                            if (sKey && fKey) {
                                if (!suiteMap.has(sKey)) {
                                    suiteMap.set(sKey, { suite_key: sKey, enabled_features: [] });
                                }
                                suiteMap.get(sKey).enabled_features.push(fKey);
                            }
                        });
                        setPlanPermissions(Array.from(suiteMap.values()));
                    }
                }
            }

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

            // Fetch active suites for sidebar sync
            const { data: suites } = await supabase
                .from('suites')
                .select('*')
                .eq('active', true)
                .order('order_index', { ascending: true });

            if (suites) {
                console.log("Dashboard: Active Suites Sync:", suites.map(s => ({ key: s.suite_key, idx: s.order_index })));
                setActiveSuites(suites);
            }

            // Deep link handling (applied BEFORE setting loading to false)
            const moduleParam = searchParams.get('module');
            if (moduleParam) {
                const normalizedParam = normalizeModuleKey(moduleParam);

                // Check if it matches a suite after normalization
                const foundSuite = suites?.find(s => normalizeModuleKey(s.suite_key) === normalizedParam);

                if (foundSuite) {
                    // Use the canonical DB suite_key as the active module
                    setActiveModule(foundSuite.suite_key as ModuleId);
                } else {
                    // Fallback to direct match if it happens to be valid ModuleId
                    const isValidModuleId = Object.values(ModuleId).includes(normalizedParam as ModuleId);
                    if (isValidModuleId) {
                        setActiveModule(normalizedParam as ModuleId);
                    }
                }
            }

            setLoading(false);
        };

        checkUser();

        // Real-time synchronization for suites table
        const suitesChannel = supabase
            .channel('suites-sidebar-sync')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'suites' },
                async (payload) => {
                    console.log("Dashboard: Real-time Event Received:", payload.eventType, payload.new);

                    // Re-fetch all active suites on any change to maintain order and presence
                    const { data: updatedSuites } = await supabase
                        .from('suites')
                        .select('*')
                        .eq('active', true)
                        .order('order_index', { ascending: true });

                    if (updatedSuites) {
                        console.log("Dashboard: Sidebar Sincronizado:", updatedSuites.map(s => ({ key: s.suite_key, idx: s.order_index })));
                        setActiveSuites(updatedSuites);
                    }
                }
            )
            .subscribe((status, err) => {
                console.log("Dashboard: Real-time Status:", status);
                if (err) console.error("Dashboard: Real-time Error:", err);
            });

        return () => {
            supabase.removeChannel(suitesChannel);
        };
    }, [router, supabase, searchParams]);

    const handleUpdatePrefs = async (newPrefs: UserPreferences) => {
        setPreferences(newPrefs);

        // Save to localStorage for immediate consistency (especially between landing and dashboard)
        localStorage.setItem('veritum-theme', newPrefs.theme);

        // Save to DB
        const { error } = await supabase
            .from('user_preferences')
            .upsert({
                user_id: user?.id,
                theme: newPrefs.theme,
                language: newPrefs.language,
                custom_supabase_url: newPrefs.custom_supabase_url,
                custom_supabase_key: newPrefs.custom_supabase_key,
                custom_gemini_key: newPrefs.custom_gemini_key
            }, { onConflict: 'user_id' });

        if (error) {
            console.error("Erro ao salvar preferências:", error);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleModuleChange = (newModule: ModuleId) => {
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
            activeSuites={activeSuites}
            planPermissions={planPermissions}
            onModuleChange={handleModuleChange}
            onLogout={handleLogout}
            onUpdateUser={(u) => setUser(u)}
            onUpdatePrefs={handleUpdatePrefs}
        />
    );
}
