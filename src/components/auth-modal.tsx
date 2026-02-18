'use client'

import React, { useState } from 'react';
import { X, Mail, Lock, User, Chrome, ArrowRight, Scale } from 'lucide-react';
import { useTheme } from 'next-themes'
import { createMasterClient } from '@/lib/supabase/master'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button' // Keeping shadcn button for consistency if needed, but using custom styles from source for fidelity

interface Props {
    isOpen: boolean;
    onClose: () => void;
    mode: 'login' | 'register';
}

const Logo = () => (
    <div className="bg-indigo-600/10 p-3 rounded-2xl flex items-center justify-center text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 shadow-xl shadow-indigo-600/10">
        <Scale className="h-8 w-8" />
    </div>
);

export function AuthModal({ isOpen, onClose, mode }: Props) {
    const { theme } = useTheme()
    const [currentMode, setCurrentMode] = useState(mode);
    const [loading, setLoading] = useState(false);

    // Sync internal mode with prop change if needed, but usually controlled by internal state once open
    // React.useEffect(() => { setCurrentMode(mode) }, [mode])

    const handleGoogleLogin = async () => {
        setLoading(true);
        try {
            const supabase = createMasterClient();
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    skipBrowserRedirect: true
                },
            });

            if (error) throw error;
            if (data?.url) {
                // Use a popup window for the Google login
                const width = 600;
                const height = 700;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;

                const popup = window.open(
                    data.url,
                    'google-login',
                    `width=${width},height=${height},left=${left},top=${top},toolbar=0,scrollbars=1,status=0,resizable=1,location=1,menuBar=0`
                );

                // Listen for the popup being closed to reset loading state
                const timer = setInterval(() => {
                    if (popup?.closed) {
                        clearInterval(timer);
                        setLoading(false);
                    }
                }, 1000);
            }
        } catch (error) {
            console.error('Login error:', error);
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none">
                <div className={`relative w-full p-10 rounded-[2.5rem] shadow-2xl border transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <DialogTitle className="sr-only">{currentMode === 'login' ? 'Login' : 'Cadastro'}</DialogTitle>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>

                    <div className="text-center mb-10">
                        <div className="inline-flex mb-6">
                            <Logo />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2 dark:text-white text-slate-900">
                            {currentMode === 'login' ? 'Bem-vindo de volta' : 'Crie sua conta'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            {currentMode === 'login' ? 'Acesse seu ecossistema jurídico PRO.' : 'Junte-se a centenas de escritórios modernos.'}
                        </p>
                    </div>

                    <div className="space-y-6">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-3 py-3.5 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 dark:text-white bg-transparent"
                        >
                            <Chrome className="text-indigo-600" size={20} />
                            {loading ? 'Processando...' : 'Continuar com Google'}
                        </button>

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                            <div className="relative flex justify-center text-xs uppercase"><span className={`px-4 font-bold tracking-widest ${theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>Ou com e-mail</span></div>
                        </div>

                        <form className="space-y-4" onSubmit={e => { e.preventDefault(); /* Handle email login */ }}>
                            {currentMode === 'register' && (
                                <div className="relative">
                                    <User className="absolute left-4 top-4 text-slate-400" size={20} />
                                    <input required placeholder="Nome Completo" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" />
                                </div>
                            )}
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input required type="email" placeholder="E-mail profissional" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input required type="password" placeholder="Sua senha" className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white" />
                            </div>
                            <button className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-2xl shadow-indigo-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2">
                                {currentMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro'} <ArrowRight size={20} />
                            </button>
                        </form>

                        <p className="text-center text-sm text-slate-500">
                            {currentMode === 'login' ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
                            <button
                                onClick={() => setCurrentMode(currentMode === 'login' ? 'register' : 'login')}
                                className="ml-2 text-indigo-600 font-bold hover:underline"
                            >
                                {currentMode === 'login' ? 'Cadastre-se' : 'Entrar'}
                            </button>
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
