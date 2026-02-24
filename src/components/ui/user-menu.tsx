'use client'

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import ProfileModal from './profile-modal';

interface UserMenuProps {
    user: any;
    supabase: any;
}

export const UserMenu: React.FC<UserMenuProps> = ({ user, supabase }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const router = useRouter();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.reload();
    };

    // Normalize user data (landing page user structure vs dashboard user structure might differ)
    const displayName = user.profile?.name || user.user_metadata?.full_name || user.name || 'Usuário';
    const displayRole = user.profile?.role || user.role || 'Usuário';
    const avatarUrl = user.profile?.avatar_url || user.avatar_url || user.user_metadata?.avatar_url || user.user_metadata?.picture;

    return (
        <div className="flex items-center gap-4 pl-6 border-l border-slate-100 dark:border-slate-800">
            <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-800 dark:text-white leading-tight">{displayName}</p>
                <p className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">{displayRole}</p>
            </div>

            <div
                className="relative"
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
            >
                <div className="w-11 h-11 rounded-2xl overflow-hidden border-2 border-indigo-600/20 shadow-lg transition-all hover:scale-105 hover:border-indigo-500 cursor-pointer bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                    {avatarUrl ? (
                        <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                        <UserIcon size={20} className="text-slate-400" />
                    )}
                </div>

                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl py-2 z-[100] overflow-hidden"
                        >
                            <button
                                onClick={() => {
                                    setIsProfileModalOpen(true);
                                    setIsOpen(false);
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all text-left cursor-pointer"
                            >
                                <UserIcon size={18} className="text-indigo-600" />
                                Meu Perfil
                            </button>
                            <div className="h-px bg-slate-100 dark:bg-slate-800 mx-2 my-1" />
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-all text-left cursor-pointer"
                            >
                                <LogOut size={18} />
                                Sair do Ecossistema
                            </button>
                        </motion.div>
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
        </div>
    );
};
