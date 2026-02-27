'use client'

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { DashboardLayout } from '@/components/dashboard-layout';
import { User, UserPreferences, ModuleId, Credentials } from '@/types';
import { createMasterClient } from '@/lib/supabase/master';
import { useTranslation, Locale } from '@/contexts/language-context';
import { useTheme } from 'next-themes';

interface ModuleContextType {
    user: User | null;
    preferences: UserPreferences | null;
    planPermissions: any[];
    credentials: Credentials;
    onUpdateUser: (u: User) => void;
    onUpdatePrefs: (p: UserPreferences) => void;
    onModuleChange: (m: ModuleId) => void;
    activeSuites: any[];
    groupPermissions: any[];
    allFeatures: any[];
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
    const [groupPermissions, setGroupPermissions] = useState<any[]>([]);
    const [allFeatures, setAllFeatures] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createMasterClient();
    const { t, locale, setLocale } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchData = React.useCallback(async () => {
        if (isInitialLoad) setLoading(true);
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            router.push('/?login=true');
            return;
        }

        // 1. Parallelize initial critical data fetching
        const [profileRes, prefsRes] = await Promise.all([
            supabase
                .from('users')
                .select('*, access_groups(name, name_loc), plans:plan_id(name)')
                .eq('id', authUser.id)
                .single(),
            supabase
                .from('user_preferences')
                .select('*')
                .eq('user_id', authUser.id)
                .maybeSingle()
        ]);

        const profile = profileRes.data;
        const profileError = profileRes.error;
        const prefs = prefsRes.data;

        // 2. IMMEDIATE Preference Hydration (Priority: LocalStorage is MASTER)
        const localLanguage = localStorage.getItem('veritum-locale') as Locale;
        const localTheme = localStorage.getItem('veritum-theme');

        const currentLang = (localLanguage || 'pt') as Locale;
        const currentTheme = (localTheme || 'dark') as 'light' | 'dark' | 'system';

        setPreferences({
            user_id: authUser.id,
            language: currentLang,
            theme: currentTheme,
            custom_supabase_url: prefs?.custom_supabase_url,
            custom_supabase_key: prefs?.custom_supabase_key,
            custom_gemini_key: prefs?.custom_gemini_key,
        });

        // 3. Process Profile Data
        if (profile) {
            const profileData = profile as any;
            const accessGroupNameRaw = Array.isArray(profileData?.access_groups)
                ? profileData.access_groups[0]?.name
                : profileData?.access_groups?.name;

            const accessGroupNameTranslated = Array.isArray(profileData?.access_groups)
                ? (profileData.access_groups[0]?.name_loc?.[locale] || profileData.access_groups[0]?.name)
                : (profileData?.access_groups?.name_loc?.[locale] || profileData?.access_groups?.name);

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
                access_group_name: accessGroupNameRaw,
                translated_group_name: accessGroupNameTranslated,
                plan_name: profileData?.plans?.name || (Array.isArray(profileData?.plans) ? profileData?.plans[0]?.name : undefined)
            });
        }

        if (profileError && profileError.code !== 'PGRST116') {
            console.error("Erro ao buscar perfil:", profileError);
        }

        // 4. Fetch Permissions and Suites (Dependent on profile)
        const planId = profile?.plan_id || authUser.user_metadata.plan_id;
        const parentId = profile?.parent_user_id || authUser.user_metadata.parent_user_id;

        const queries: any[] = [
            supabase
                .from('suites')
                .select('*')
                .eq('active', true)
                .order('order_index', { ascending: true }),
            supabase.from('features').select('id, suite_id')
        ];

        if (planId) {
            queries.push(
                supabase
                    .from('plan_permissions')
                    .select('feature_id, features(feature_key, suite_id, suites(suite_key))')
                    .eq('plan_id', planId)
            );
        }

        if (parentId) {
            queries.push(
                supabase
                    .from('user_preferences')
                    .select('custom_supabase_url, custom_supabase_key, custom_gemini_key')
                    .eq('user_id', parentId)
                    .maybeSingle()
            );
        }

        const results = await Promise.all(queries);
        const suitesRes = results[0];
        const featuresRes = results[1];
        const planPermsRes = planId ? results[2] : null;
        const parentPrefsRes = parentId ? (planId ? results[3] : results[2]) : null;

        if (suitesRes.data) setActiveSuites(suitesRes.data);
        if (featuresRes.data) setAllFeatures(featuresRes.data);

        if (planPermsRes?.data) {
            const suiteMap = new Map<string, any>();
            planPermsRes.data.forEach((p: any) => {
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

        if (parentPrefsRes?.data) {
            setPreferences(prev => prev ? ({
                ...prev,
                custom_supabase_url: parentPrefsRes.data.custom_supabase_url || prev.custom_supabase_url,
                custom_supabase_key: parentPrefsRes.data.custom_supabase_key || prev.custom_supabase_key,
                custom_gemini_key: parentPrefsRes.data.custom_gemini_key || prev.custom_gemini_key,
            }) : prev);
        }

        if (profile?.access_group_id && profile?.role !== 'Master') {
            const { data: permData } = await supabase
                .from('group_permissions')
                .select('*')
                .eq('group_id', profile.access_group_id);
            if (permData) setGroupPermissions(permData);
        }

        setLoading(false);
        setIsInitialLoad(false);
    }, [router, supabase, locale, isInitialLoad]);

    useEffect(() => {
        fetchData();

        // Refresh when user returns to this tab (e.g. from Asaas checkout)
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                console.log("Usuário voltou para a aba. Atualizando dados...");
                fetchData();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        const setupRealtime = async () => {
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (!authUser) return;

            // Real-time synchronization for user profile (Plan changes, etc)
            const userChannel = supabase
                .channel(`user-profile-${authUser.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${authUser.id}`
                    },
                    (payload) => {
                        console.log("Perfil atualizado em tempo real:", payload.new);
                        // Force a fresh fetch to ensure all relates (plans, etc) are correct
                        fetchData();
                    }
                )
                .subscribe();

            // Real-time synchronization for suites table
            const suitesChannel = supabase
                .channel('suites-sidebar-sync')
                .on(
                    'postgres_changes',
                    { event: '*', schema: 'public', table: 'suites' },
                    async () => {
                        fetchData();
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(userChannel);
                supabase.removeChannel(suitesChannel);
            };
        };

        const cleanupPromise = setupRealtime();
        return () => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [fetchData, supabase]);

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

        // UI state updates (LocalStorage via providers)
        if (newPrefs.language !== locale) setLocale(newPrefs.language as Locale);
        if (newPrefs.theme !== theme) setTheme(newPrefs.theme);

        // Persistent DB update for cloud-only preferences (Keys, Google tokens, etc)
        await supabase
            .from('user_preferences')
            .update({
                custom_supabase_url: newPrefs.custom_supabase_url,
                custom_supabase_key: newPrefs.custom_supabase_key,
                custom_gemini_key: newPrefs.custom_gemini_key
            })
            .eq('user_id', user?.id);
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
            <div className="h-screen w-full flex items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-500">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-500 dark:text-white font-medium animate-pulse">{t('common.loadingEcosystem') || 'Carregando Ecossistema...'}</p>
                </div>
            </div>
        );
    }

    const creds: Credentials = {
        supabaseUrl: preferences?.custom_supabase_url || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: preferences?.custom_supabase_key || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        geminiKey: preferences?.custom_gemini_key || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
    };

    return (
        <ModuleContext.Provider value={{
            user,
            preferences,
            planPermissions,
            credentials: creds,
            onUpdateUser: setUser,
            onUpdatePrefs: (p) => setPreferences(p),
            onModuleChange: handleModuleChange,
            activeSuites,
            groupPermissions,
            allFeatures
        }}>
            <DashboardLayout
                user={user!}
                preferences={preferences!}
                activeModule={activeModule}
                activeSuites={activeSuites}
                planPermissions={planPermissions}
                groupPermissions={groupPermissions}
                allFeatures={allFeatures}
                onModuleChange={handleModuleChange}
                onLogout={handleLogout}
                onUpdateUser={(u) => setUser(u)}
                onUpdatePrefs={handleUpdatePrefs}
            >
                {children}
            </DashboardLayout>
        </ModuleContext.Provider >
    );
}
