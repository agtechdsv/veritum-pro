import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, LogOut, Laptop } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProfileModal from './profile-modal';
import { useTranslation } from '@/contexts/language-context';
import { Tooltip } from './tooltip';
import { toast } from './toast';

interface UserMenuProps {
    user: any;
    supabase: any;
    onPlanClick?: () => void;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, supabase, onPlanClick }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            // Force a full page reload so middleware and all state are cleared
            window.location.href = '/';
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    // Normalize data
    const profile = user.profile || user;
    const rawDisplayName = profile.name || user.user_metadata?.full_name || user.user_metadata?.name || t('common.user');
    const { locale } = useTranslation();
    const displayName = typeof rawDisplayName === 'object'
        ? (rawDisplayName[locale as keyof typeof rawDisplayName] || rawDisplayName.pt || rawDisplayName.en || t('common.user'))
        : String(rawDisplayName);
    const getDisplayRole = () => {
        if (profile.translated_group_name) return profile.translated_group_name;

        const groupName = (typeof profile.access_group_name === 'object'
            ? (profile.access_group_name[locale] || profile.access_group_name.pt || '')
            : (profile.access_group_name || '')).toLowerCase();

        const roleName = (typeof profile.role === 'object'
            ? (profile.role[locale] || profile.role.pt || '')
            : (profile.role || '')).toLowerCase();

        // Match against known role keys for translation
        if (groupName.includes('master') || roleName.includes('master')) return t('management.users.roles.master');
        if (groupName.includes('sócio-administrador') || roleName.includes('sócio-administrador') ||
            groupName.includes('sócio administrador') || roleName.includes('sócio administrador')) return t('management.users.roles.partnerAdmin');
        if (groupName.includes('administrador') || roleName.includes('administrador')) return t('management.users.roles.admin');
        if (groupName.includes('operador') || roleName.includes('operador')) return t('management.users.roles.operator');
        if (groupName.includes('estagiário') || roleName.includes('estagiário')) return t('management.users.roles.intern');
        if (groupName.includes('paralegal') || roleName.includes('paralegal')) return t('management.users.roles.paralegal');
        if (groupName.includes('financeiro') || roleName.includes('financeiro')) return t('management.users.roles.financial');
        if (groupName.includes('sênior') || roleName.includes('sênior')) return t('management.users.roles.senior');
        if (groupName.includes('coordenador') || roleName.includes('coordenador')) return t('management.users.roles.coordinator');

        const safeRole = typeof profile.role === 'object'
            ? (profile.role[locale] || profile.role.pt || '')
            : (profile.role || '');

        const finalDisplay = typeof profile.access_group_name === 'object'
            ? (profile.access_group_name[locale] || profile.access_group_name.pt || '')
            : (profile.access_group_name || safeRole || t('common.user'));

        return finalDisplay;
    };

    const displayRole = getDisplayRole();
    const rawPlanName = profile.plan_name;
    const planName = typeof rawPlanName === 'object'
        ? (rawPlanName[locale] || rawPlanName.pt || rawPlanName.en || '')
        : rawPlanName;
    const avatarUrl = profile.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;

    const superAdminGroupsNames = ['Sócio-Administrativo', 'Sócio-Administrador', 'Sócio Administrador'];
    const superAdminRoles = ['Sócio-Administrador', 'Sócio Administrador', 'Administrador', 'Sócio-Administrativo'];

    const profileRoleStr = typeof profile.role === 'object'
        ? (profile.role.pt || profile.role.en || '')
        : (profile.role || '');

    const profileGroupNameStr = typeof profile.access_group_name === 'object'
        ? (profile.access_group_name.pt || profile.access_group_name.en || '')
        : (profile.access_group_name || '');

    const isSocioAdminRole = superAdminRoles.some(r => profileRoleStr.includes(r));
    const isSocioAdminGroup = profileGroupNameStr && superAdminGroupsNames.some(g => profileGroupNameStr.includes(g));
    const isRootAdmin = profile.role === 'Master' || profileRoleStr === 'Master' || isSocioAdminRole || isSocioAdminGroup;

    const handlePlanClick = (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        console.log("UserMenu: Plan clicked. onPlanClick exists?", !!onPlanClick);

        if (onPlanClick) {
            onPlanClick();
            return;
        }

        if (isRootAdmin) {
            router.push('/veritum/settings?tab=plan');
        } else {
            toast.error('Acesso restrito. Apenas administradores podem gerenciar o plano.');
        }
    };

    return (
        <>
            <div className="flex items-center gap-3 pl-0 sm:pl-4 sm:border-l border-slate-200 dark:border-slate-800 whitespace-nowrap" id="user-menu-root">
                <div className="text-right hidden sm:block">
                    <div className="text-sm font-bold text-slate-800 dark:text-white flex items-center justify-end gap-1.5 whitespace-nowrap">
                        {displayName}
                        {planName && (
                            <Tooltip content="Clique para fazer upgrade ou gerenciar seu plano" enabled={true} side="bottom">
                                <button
                                    onClick={handlePlanClick}
                                    className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-[9px] uppercase tracking-widest rounded-md border border-amber-200 dark:border-amber-800 shadow-sm hover:scale-105 transition-all outline-none cursor-pointer"
                                >
                                    {planName}
                                </button>
                            </Tooltip>
                        )}
                    </div>
                    <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest mt-0.5 whitespace-nowrap">{displayRole}</p>
                </div>

                <div
                    className="relative group"
                    onMouseEnter={() => setIsOpen(true)}
                    onMouseLeave={() => setIsOpen(false)}
                >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden border-2 border-indigo-100 dark:border-indigo-900/30 shadow-sm transition-all group-hover:scale-105 group-hover:border-indigo-500 cursor-pointer bg-white dark:bg-slate-800">
                        <img src={avatarUrl || `https://ui-avatars.com/api/?name=${displayName}&background=6366f1&color=fff`} alt="Avatar" className="w-full h-full object-cover" />
                    </div>

                    <AnimatePresence>
                        {isOpen && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-[100] overflow-hidden"
                            >
                                <div className="px-4 py-4 border-b border-slate-50 dark:border-slate-800 mb-2">
                                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">{t('management.users.menu')}</p>
                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate">{user.email}</p>
                                </div>

                                <button
                                    onClick={() => {
                                        setIsProfileModalOpen(true);
                                        setIsOpen(false);
                                    }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left cursor-pointer rounded-xl"
                                >
                                    <UserIcon size={18} className="text-indigo-600" />
                                    {t('userMenu.profile')}
                                </button>
                                <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-1" />
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left cursor-pointer rounded-xl"
                                >
                                    <LogOut size={18} />
                                    {t('userMenu.logout')}
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            <ProfileModal
                isOpen={isProfileModalOpen}
                onClose={() => setIsProfileModalOpen(false)}
                user={{
                    ...user,
                    name: displayName,
                    role: displayRole,
                    avatar_url: avatarUrl
                } as any}
                onUpdateUser={() => {
                    router.refresh();
                }}
            />
        </>
    );
};

