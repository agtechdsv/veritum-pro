'use client'

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Chrome, ArrowRight, Scale } from 'lucide-react';
import { useTheme } from 'next-themes'
import { createMasterClient } from '@/lib/supabase/master'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { registerPublicUser } from '@/app/actions/user-actions';

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
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);

    const emailRef = React.useRef<HTMLInputElement>(null);
    const nameRef = React.useRef<HTMLInputElement>(null);

    // Ensure the modal resets to the requested mode whenever it's opened or changed
    useEffect(() => {
        if (isOpen) {
            setCurrentMode(mode);
            setError(null);
            setEmail('');
            setPassword('');
            setName('');

            // Focus logic
            setTimeout(() => {
                if (mode === 'login') emailRef.current?.focus();
                else nameRef.current?.focus();
            }, 100);
        }
    }, [isOpen, mode]);

    // Handle focus when toggling mode manually inside modal
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (currentMode === 'login') emailRef.current?.focus();
                else nameRef.current?.focus();
            }, 50);
        }
    }, [currentMode, isOpen]);

    const handleEmailAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const supabase = createMasterClient();

            if (currentMode === 'login') {
                const { data: { user }, error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (loginError) throw loginError;

                if (user) {
                    // Check if user is active in public.users
                    const { data: profile, error: profileError } = await supabase
                        .from('users')
                        .select('active')
                        .eq('id', user.id)
                        .single();

                    if (profileError || !profile?.active) {
                        await supabase.auth.signOut();
                        throw new Error('Esta conta está inativa. Entre em contato com o suporte.');
                    }
                }

                window.location.href = '/veritum';
            } else {
                const result = await registerPublicUser({
                    email,
                    password,
                    name
                });

                if (!result.success) {
                    throw new Error(result.error);
                }

                // Auto-login after successful registration
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (loginError) throw loginError;

                window.location.href = '/veritum';
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || 'Erro ao processar autenticação');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createMasterClient();
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
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
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || 'Erro no login Google');
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

                        {error && (
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900/30">
                                {error}
                            </div>
                        )}

                        <form className="space-y-4" onSubmit={handleEmailAuth}>
                            {currentMode === 'register' && (
                                <div className="relative">
                                    <User className="absolute left-4 top-4 text-slate-400" size={20} />
                                    <input
                                        ref={nameRef}
                                        required
                                        placeholder="Nome Completo"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            )}
                            <div className="relative">
                                <Mail className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input
                                    ref={emailRef}
                                    required
                                    type="email"
                                    placeholder="E-mail profissional"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                                <input
                                    required
                                    type="password"
                                    placeholder="Sua senha"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-2xl shadow-indigo-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {loading ? 'Aguarde...' : (currentMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro')} <ArrowRight size={20} />
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
