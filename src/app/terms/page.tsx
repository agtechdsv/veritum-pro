'use client'

import React from 'react';
import { ArrowLeft, FileText, Scale, Moon, Sun, LayoutDashboard } from 'lucide-react';
import Link from 'next/link';
import { useTranslation } from '@/contexts/language-context';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { LanguageSelector } from '@/components/ui/language-selector';
import { UserMenu } from '@/components/ui/user-menu';
import { createMasterClient } from '@/lib/supabase/master';

const Logo = () => (
    <div className="bg-indigo-600/10 p-2 rounded-lg flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M12 3v18"></path><path d="m19 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1"></path><path d="m5 8 3 8a5 5 0 0 1-6 0zV7"></path><path d="M7 21h10"></path></svg>
    </div>
);

export default function TermsPage() {
    const { t } = useTranslation();
    const { theme, setTheme, resolvedTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(undefined);

    useEffect(() => {
        setMounted(true);
        const supabase = createMasterClient();
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('users')
                    .select('name, avatar_url, role, plan_id, access_groups(name)')
                    .eq('id', user.id)
                    .single();
                setCurrentUser({ ...user, profile });
            } else {
                setCurrentUser(null);
            }
        };
        fetchUser();
    }, []);

    const toggleTheme = () => {
        setTheme(resolvedTheme === 'dark' ? 'light' : 'dark');
    };

    if (!mounted) return null;
    return (
        <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white transition-colors duration-500">
            <div className="fixed top-1/4 left-0 w-96 h-96 bg-indigo-400/10 blur-[120px] rounded-full pointer-events-none"></div>
            <div className="fixed bottom-0 right-0 w-[500px] h-[500px] bg-purple-400/5 blur-[150px] rounded-full pointer-events-none"></div>



            <main className="relative pt-32 pb-20 px-6 max-w-4xl mx-auto">
                <div className="mb-12">
                    <div className="w-16 h-16 bg-indigo-600/10 rounded-2xl flex items-center justify-center text-indigo-600 dark:text-indigo-400 mb-6 font-black tracking-tight">
                        <FileText size={32} />
                    </div>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4 text-slate-900 dark:text-white">
                        {t('staticPages.terms.title').split('Terms').length > 1 ?
                            <>Terms of <span className="text-branding-gradient">Service</span></> :
                            <>Termos de <span className="text-branding-gradient">Serviço</span></>}
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest text-sm">{t('staticPages.terms.updatedAt')}</p>
                </div>

                <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 leading-loose space-y-8">
                    <section>
                        <p className="text-lg">{t('staticPages.terms.intro')}</p>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('staticPages.terms.section1Title')}</h2>
                        <p>{t('staticPages.terms.section1Content')}</p>
                    </section>
                </div>
            </main>
        </div>
    );
}
