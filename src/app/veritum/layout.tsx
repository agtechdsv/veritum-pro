'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { User, UserPreferences, ModuleId, Credentials } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';

interface ModuleContextType {
    user: User | null;
    preferences: UserPreferences | null;
    planPermissions: any[];
    credentials: Credentials;
    onUpdateUser: (u: User) => void;
    onUpdatePrefs: (p: UserPreferences) => void;
    onModuleChange: (m: ModuleId) => void;
    activeSuites: any[];
}

const ModuleContext = React.createContext<ModuleContextType | undefined>(undefined);

export const useModule = () => {
    const context = React.useContext(ModuleContext);
    if (!context) throw new Error('useModule must be used within a VeritumLayout');
    return context;
};

const normalizeModuleKey = (key: string): string => {
    if (!key) return '';
    return key.toLowerCase().replace('_key', '');
};

export default function VeritumLayout({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [activeModule, setActiveModule] = useState<ModuleId>(ModuleId.DASHBOARD_ROOT);
    const [activeSuites, setActiveSuites] = useState<any[]>([]);
    const [planPermissions, setPlanPermissions] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
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
                .select('*, access_groups(name)')
                .eq('id', authUser.id)
                .single();

            const profileData = profile as any;
            const accessGroupName = Array.isArray(profileData?.access_groups)
                ? profileData.access_groups[0]?.name
                : profileData?.access_groups?.name;

            if (profileError) {
                // Ignore PGRST116 (No rows returned) if the trigger failed and the user is fresh
                if (profileError.code !== 'PGRST116') {
                    console.error("Erro ao buscar perfil na tabela public.users:", JSON.stringify(profileError, null, 2));
                } else {
                    console.warn("Perfil não encontrado na tabela public.users (PGRST116). O Trigger falhou ao registrar?");
                }
            }

            setUser({
                id: authUser.id,
                name: profile?.name || authUser.user_metadata.full_name || 'Usuário',
                username: profile?.username || authUser.email?.split('@')[0] || 'user',
                email: authUser.email,
                role: (profile?.role || authUser.user_metadata.role || 'Operador') as any,
                active: profile?.active ?? true,
                avatar_url: profile?.avatar_url || authUser.user_metadata.avatar_url || authUser.user_metadata.picture,
                parent_user_id: profile?.parent_user_id || authUser.user_metadata.parent_user_id,
                plan_id: profile?.plan_id || authUser.user_metadata.plan_id,
                access_group_id: profile?.access_group_id || authUser.user_metadata.access_group_id,
                access_group_name: accessGroupName
            });

            // Fetch plan permissions with robust metadata fallback
            const planId = profile?.plan_id || authUser.user_metadata.plan_id;
            const parentId = profile?.parent_user_id || authUser.user_metadata.parent_user_id;

            if (planId) {
                const { data: perms } = await supabase
                    .from('plan_permissions')
                    .select('feature_id, features(feature_key, suite_id, suites(suite_key))')
                    .eq('plan_id', planId);

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
            } else if (parentId) {
                const { data: parentProfile } = await supabase
                    .from('users')
                    .select('plan_id')
                    .eq('id', parentId)
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
                .maybeSingle();

            let custom_url = prefs?.custom_supabase_url;
            let custom_key = prefs?.custom_supabase_key;
            let gemini_key = prefs?.custom_gemini_key;

            if (parentId) {
                const { data: parentPrefs } = await supabase
                    .from('user_preferences')
                    .select('custom_supabase_url, custom_supabase_key, custom_gemini_key')
                    .eq('user_id', parentId)
                    .maybeSingle();

                if (parentPrefs) {
                    custom_url = parentPrefs.custom_supabase_url;
                    custom_key = parentPrefs.custom_supabase_key;
                    gemini_key = parentPrefs.custom_gemini_key;
                }
            }

            setPreferences({
                user_id: authUser.id,
                language: prefs?.language || 'pt',
                theme: prefs?.theme || 'dark',
                custom_supabase_url: custom_url,
                custom_supabase_key: custom_key,
                custom_gemini_key: gemini_key,
            });

            const { data: suites } = await supabase
                .from('suites')
                .select('*')
                .eq('active', true)
                .order('order_index', { ascending: true });

            if (suites) {
                setActiveSuites(suites);
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
    }, [router, supabase]);

    // Update active module based on current pathname
    useEffect(() => {
        const segments = pathname.split('/');
        const lastSegment = segments[segments.length - 1];
        if (lastSegment === 'veritum') {
            setActiveModule(ModuleId.DASHBOARD_ROOT);
        } else {
            // Check if it's a valid module ID or needs normalization
            const normalized = normalizeModuleKey(lastSegment);
            const isValid = Object.values(ModuleId).includes(normalized as ModuleId);
            if (isValid) {
                setActiveModule(normalized as ModuleId);
            } else {
                setActiveModule(lastSegment as ModuleId);
            }
        }
    }, [pathname]);

    const handleUpdatePrefs = async (newPrefs: UserPreferences) => {
        setPreferences(newPrefs);
        localStorage.setItem('veritum-theme', newPrefs.theme);
        await supabase
            .from('user_preferences')
            .upsert({
                user_id: user?.id,
                theme: newPrefs.theme,
                language: newPrefs.language,
                custom_supabase_url: newPrefs.custom_supabase_url,
                custom_supabase_key: newPrefs.custom_supabase_key,
                custom_gemini_key: newPrefs.custom_gemini_key
            }, { onConflict: 'user_id' });
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/');
    };

    const handleModuleChange = (newModule: ModuleId) => {
        setActiveModule(newModule);
        const target = newModule === ModuleId.DASHBOARD_ROOT ? '/veritum' : `/veritum/${normalizeModuleKey(newModule)}`;
        router.push(target);
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

    const creds: Credentials = {
        supabaseUrl: preferences?.custom_supabase_url || '',
        supabaseAnonKey: preferences?.custom_supabase_key || '',
        geminiKey: preferences?.custom_gemini_key || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    };

    return (
        <ModuleContext.Provider value={{
            user,
            preferences,
            planPermissions,
            credentials: creds,
            onUpdateUser: (u) => setUser(u),
            onUpdatePrefs: handleUpdatePrefs,
            onModuleChange: handleModuleChange,
            activeSuites
        }}>
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
            >
                {children}
            </DashboardLayout>
        </ModuleContext.Provider>
    );
}
