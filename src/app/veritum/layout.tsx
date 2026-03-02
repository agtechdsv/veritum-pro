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
    // 5. Memoize Supabase Client to prevent unnecessary re-renders/re-fetches
    const supabaseClient = React.useMemo(() => createMasterClient(), []);

    const { t, locale, setLocale } = useTranslation();
    const { theme, setTheme } = useTheme();
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const fetchData = React.useCallback(async () => {
        if (isInitialLoad) setLoading(true);
        const { data: auth } = await supabaseClient.auth.getUser();
        const authUser = auth.user;

        if (!authUser) {
            router.push('/?login=true');
            return;
        }

        // 1. Parallelize initial critical data fetching
        const [profileRes] = await Promise.all([
            supabaseClient
                .from('users')
                .select('*, access_groups(name, name_loc), plans:plan_id(name)')
                .eq('id', authUser.id)
                .single()
        ]);


        const profile = profileRes.data;
        const profileError = profileRes.error;
        const prefs = null;

        // 2. IMMEDIATE Preference Hydration (Priority: LocalStorage is MASTER)
        const localLanguage = localStorage.getItem('veritum-locale') as Locale;
        const localTheme = localStorage.getItem('veritum-theme');

        const currentLang = (localLanguage || 'pt') as Locale;
        const currentTheme = (localTheme || 'dark') as 'light' | 'dark' | 'system';

        setPreferences({
            user_id: authUser.id,
            language: currentLang,
            theme: currentTheme,
        });

        // 3. Process Profile Data
        const profileData = (profile || {}) as any;
        const firstGroup = Array.isArray(profileData?.access_groups) ? profileData.access_groups[0] : profileData?.access_groups;
        const accessGroupNameRaw = typeof firstGroup?.name === 'object' ? (firstGroup.name.pt || firstGroup.name.en || '') : (firstGroup?.name || '');
        const accessGroupNameTranslated = typeof firstGroup?.name === 'object' ? (firstGroup.name[locale] || accessGroupNameRaw) : accessGroupNameRaw;

        const userName = typeof profileData?.name === 'object'
            ? (profileData.name[locale] || profileData.name.pt || profileData.name.en || 'Usuário')
            : (profileData?.name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || 'Usuário');

        const planName = profileData?.plans
            ? (typeof (profileData.plans as any).name === 'object'
                ? ((profileData.plans as any).name[locale] || (profileData.plans as any).name.pt || (profileData.plans as any).name.en || 'Pro')
                : ((profileData.plans as any).name || 'Pro'))
            : (Array.isArray(profileData?.plans) && profileData.plans[0]
                ? (typeof (profileData.plans[0] as any).name === 'object'
                    ? ((profileData.plans[0] as any).name[locale] || (profileData.plans[0] as any).name.pt || (profileData.plans[0] as any).name.en || 'Pro')
                    : ((profileData.plans[0] as any).name || 'Pro'))
                : 'Pro');

        setUser({
            id: authUser.id,
            name: userName,
            email: profileData?.email || authUser.email || '',
            role: (profileData?.role || authUser.user_metadata?.role || 'Administrador') as any,
            active: profileData?.active ?? true,
            avatar_url: profileData?.avatar_url || authUser.user_metadata?.avatar_url || authUser.user_metadata?.picture,
            parent_user_id: profileData?.parent_user_id || authUser.user_metadata?.parent_user_id,
            plan_id: profileData?.plan_id || authUser.user_metadata?.plan_id,
            access_group_id: profileData?.access_group_id || authUser.user_metadata?.access_group_id,
            access_group_name: accessGroupNameRaw,
            translated_group_name: accessGroupNameTranslated,
            plan_name: planName
        });

        if (profileError && !['PGRST116', 'PGRST111'].includes(profileError.code)) {
            console.warn("Aviso: Perfil não sincronizado na public.users. Usando metadados do Auth.", profileError.message || profileError);
        }

        // 4. Fetch Permissions and Suites (Dependent on profile)
        const planId = profile?.plan_id || authUser.user_metadata.plan_id;
        const queries: any[] = [
            supabaseClient
                .from('suites')
                .select('*')
                .eq('active', true)
                .order('order_index', { ascending: true }),
            supabaseClient.from('features').select('id, suite_id')
        ];

        if (planId) {
            queries.push(
                supabaseClient
                    .from('plan_permissions')
                    .select('feature_id, features(feature_key, suite_id, suites(suite_key))')
                    .eq('plan_id', planId)
            );
        }

        const results = await Promise.all(queries);
        const suitesRes = results[0];
        const featuresRes = results[1];
        const planPermsRes = planId ? results[2] : null;

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

        if (profile?.access_group_id && profile?.role !== 'Master') {
            const { data: permData } = await supabaseClient
                .from('group_permissions')
                .select('*')
                .eq('group_id', profile.access_group_id);
            if (permData) setGroupPermissions(permData);
        }

        setLoading(false);
        setIsInitialLoad(false);
    }, [supabaseClient, router]); // Removed locale to prevent refetching on language change

    // EFFECT 1: Initial Data Fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // EFFECT 2: Reactive Translation Update (No refetching)
    useEffect(() => {
        if (!user || isInitialLoad) return;

        // When locale changes, we only need to update the translated strings in the user object
        // without triggering a full "Sincronizando Ecossistema" (loading state)
        setUser(prev => {
            if (!prev) return prev;
            // Note: We need the raw data here, or we trust that the profile was already fetched.
            // Since we don't want to refetch, we can only update if we have the necessary info.
            // Fortunately, most components handle translation themselves using the locale context.
            return { ...prev }; // Trigger re-render so components using user.plan_name (if it were an object) or t() can update.
        });
    }, [locale]);

    useEffect(() => {
        const setupRealtime = async () => {
            const { data: auth } = await supabaseClient.auth.getUser();
            const authUser = auth.user;
            if (!authUser) return;

            // Real-time synchronization for user profile (Plan changes, etc)
            const userChannel = supabaseClient
                .channel(`user-profile-${authUser.id}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'users',
                        filter: `id=eq.${authUser.id}`
                    },
                    (payload: any) => {
                        console.log("Perfil atualizado em tempo real:", payload.new);
                        fetchData();
                    }
                )
                .subscribe();

            // Real-time synchronization for suites table
            const suitesChannel = supabaseClient
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
                supabaseClient.removeChannel(userChannel);
                supabaseClient.removeChannel(suitesChannel);
            };
        };

        const cleanupPromise = setupRealtime();
        return () => {
            cleanupPromise.then(cleanup => cleanup && cleanup());
        };
    }, [fetchData, supabaseClient]);

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
    };

    const handleLogout = async () => {
        await supabaseClient.auth.signOut();
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
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
        supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        geminiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '',
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
