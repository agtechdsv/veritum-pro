'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProfileModal from './profile-modal';
import { useTranslation } from '@/contexts/language-context';

interface UserMenuProps {
    user: any;
    supabase: any;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, supabase }) => {
    const { t } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
            router.push('/');
        } catch (error) {
            console.error('Erro ao sair:', error);
        }
    };

    // Normalize user data (landing page user structure vs dashboard user structure might differ)
    const displayName = user.full_name || user.profile?.name || user.user_metadata?.full_name || user.name || t('common.user');
    const displayRole = user.role || user.profile?.role || t('common.user');
    const avatarUrl = user.avatar_url || user.profile?.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;

    return (
        <>
            <div className="relative" id="user-menu-root">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="flex items-center gap-3 p-1.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 group"
                >
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-indigo-200 dark:shadow-indigo-900/20 group-hover:rotate-3 transition-transform">
                        {displayName?.charAt(0) || 'U'}
                    </div>
                    <div className="hidden md:block text-left mr-2">
                        <p className="text-sm font-black text-slate-800 dark:text-white leading-none mb-1">
                            {displayName?.split(' ')[0]}
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                            {displayRole}
                        </p>
                    </div>
                </button>

                <AnimatePresence>
                    {isOpen && (
                        <>
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 z-40"
                            />
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute right-0 mt-3 w-64 bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl shadow-indigo-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden z-50 p-2"
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
                        </>
                    )}
                </AnimatePresence>
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
