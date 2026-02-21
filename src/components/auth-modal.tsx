'use client'

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Chrome, ArrowRight, Scale, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { createMasterClient } from '@/lib/supabase/master'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { registerPublicUser, resetTemporaryPassword } from '@/app/actions/user-actions';

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

const PasswordStrength = ({ password }: { password: string }) => {
    const checks = {
        length: password.length >= 6,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const strength = Object.values(checks).filter(Boolean).length;

    const getStrengthLabel = () => {
        if (!password) return { label: 'AUSENTE', color: 'text-slate-500' };
        if (strength <= 2) return { label: 'MUITO FRACA', color: 'text-rose-500' };
        if (strength <= 3) return { label: 'FRACA', color: 'text-amber-500' };
        if (strength <= 4) return { label: 'MODERADA', color: 'text-indigo-500' };
        return { label: 'FORTE', color: 'text-emerald-500' };
    };

    const { label, color } = getStrengthLabel();

    return (
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mt-4">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Força da Senha</span>
                <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${color}`}>{label}</span>
            </div>

            <div className="flex gap-2 mb-6">
                {[1, 2, 3, 4].map((step) => (
                    <div
                        key={step}
                        className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step <= Math.floor((strength / 5) * 4)
                            ? color.replace('text-', 'bg-')
                            : 'bg-slate-200 dark:bg-slate-700'
                            }`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-y-3 gap-x-4">
                {[
                    { key: 'length', label: '6+ Caracteres' },
                    { key: 'upper', label: 'Letra Maiúscula' },
                    { key: 'lower', label: 'Letra Minúscula' },
                    { key: 'number', label: 'Número' },
                    { key: 'symbol', label: 'Símbolo (!@#$)' }
                ].map((crit) => (
                    <div key={crit.key} className="flex items-center gap-2">
                        {checks[crit.key as keyof typeof checks] ? (
                            <CheckCircle2 size={14} className="text-emerald-500" />
                        ) : (
                            <Circle size={14} className="text-slate-300 dark:text-slate-600" />
                        )}
                        <span className={`text-[10px] font-bold uppercase tracking-wider transition-colors ${checks[crit.key as keyof typeof checks]
                            ? 'text-slate-700 dark:text-slate-200'
                            : 'text-slate-400 dark:text-slate-500'
                            }`}>
                            {crit.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export function AuthModal({ isOpen, onClose, mode }: Props) {
    const { theme } = useTheme()
    const [currentMode, setCurrentMode] = useState<'login' | 'register' | 'force-reset'>(mode);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
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
            setConfirmPassword('');
            setName('');
            setUserId(null);

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
                else if (currentMode === 'register') nameRef.current?.focus();
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
                    // Check profile for status and mandatory reset
                    const { data: profile, error: profileError } = await supabase
                        .from('users')
                        .select('active, force_password_reset')
                        .eq('id', user.id)
                        .single();

                    if (profileError) {
                        console.error('Error fetching profile:', profileError);
                    }

                    if (profile && !profile.active) {
                        await supabase.auth.signOut();
                        throw new Error('Esta conta está inativa. Entre em contato com o suporte.');
                    }

                    if (profile?.force_password_reset) {
                        setUserId(user.id);
                        setCurrentMode('force-reset');
                        setPassword('');
                        setConfirmPassword('');
                        setLoading(false);
                        return; // Stop here, show reset UI
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

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        if (password !== confirmPassword) {
            setError('As senhas não conferem');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = await resetTemporaryPassword(userId, password);
            if (!result.success) throw new Error(result.error);

            // Success! Proceed to dashboard
            window.location.href = '/veritum';
        } catch (err: any) {
            setError(err.message || 'Erro ao redefinir senha');
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
                <div className={`relative w-full p-6 pt-10 rounded-[2.5rem] shadow-2xl border transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <DialogTitle className="sr-only">{currentMode === 'login' ? 'Login' : 'Cadastro'}</DialogTitle>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <X size={20} />
                    </button>

                    <div className="text-center mb-6">
                        <div className="inline-flex mb-4">
                            <Logo />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2 dark:text-white text-slate-900">
                            {currentMode === 'login' ? 'Bem-vindo de volta' :
                                currentMode === 'register' ? 'Crie sua conta' :
                                    'Redefinir Senha'}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            {currentMode === 'login' ? <>Acesse seu ecossistema jurídico <span className="text-branding-gradient">PRO</span>.</> :
                                currentMode === 'register' ? 'Junte-se a centenas de escritórios modernos.' :
                                    'Sua senha provisória expirou. Crie uma nova agora.'}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {currentMode !== 'force-reset' && (
                            <>
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 dark:text-white bg-transparent"
                                >
                                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                                        <path
                                            fill="#4285F4"
                                            d="M23.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.3h6.5c-.3 1.5-1.1 2.7-2.3 3.5v2.8h3.8c2.2-2 3.5-5 3.5-8.4z"
                                        />
                                        <path
                                            fill="#34A853"
                                            d="M12 24c3.2 0 6-1.1 8-2.9l-3.8-2.8c-1.1.8-2.5 1.2-4.2 1.2-3.2 0-5.9-2.2-6.9-5.1H1.3v3.3C3.3 21.6 7.4 24 12 24z"
                                        />
                                        <path
                                            fill="#FBBC05"
                                            d="M5.1 14.4c-.3-.8-.4-1.6-.4-2.4s.1-1.6.4-2.4V6.3H1.3C.5 8 .1 9.9.1 12s.4 4 1.2 5.7l3.8-3.3z"
                                        />
                                        <path
                                            fill="#EA4335"
                                            d="M12 4.8c1.7 0 3.3.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.3 2.4 1.3 6.3l3.8 3.3c1-2.9 3.7-4.8 6.9-4.8z"
                                        />
                                    </svg>
                                    {loading ? 'Processando...' : 'Continuar com Google'}
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className={`px-4 font-bold tracking-widest ${theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>Ou com e-mail</span></div>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900/30">
                                {error}
                            </div>
                        )}

                        {currentMode === 'force-reset' ? (
                            <form className="space-y-4" onSubmit={handleResetPassword}>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Sua nova senha"
                                        className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Confirmar nova senha"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <PasswordStrength password={password} />

                                <button
                                    type="submit"
                                    disabled={loading || password !== confirmPassword || password.length < 6}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-2xl shadow-indigo-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Redefinindo...' : 'Redefinir Senha e Entrar'} <ArrowRight size={20} />
                                </button>

                                {password && confirmPassword && password !== confirmPassword && (
                                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider text-center">Senhas não conferem</p>
                                )}
                            </form>
                        ) : (
                            <form className="space-y-4" onSubmit={handleEmailAuth}>
                                {currentMode === 'register' && (
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                        <input
                                            ref={nameRef}
                                            required
                                            placeholder="Nome Completo"
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                            value={name}
                                            onChange={e => setName(e.target.value)}
                                        />
                                    </div>
                                )}
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        ref={emailRef}
                                        required
                                        type="email"
                                        placeholder="E-mail profissional"
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder={currentMode === 'register' ? "Criar senha" : "Sua senha"}
                                        className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {currentMode === 'register' && (
                                    <>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                placeholder="Confirmar senha"
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                                value={confirmPassword}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                            />
                                        </div>

                                        <PasswordStrength password={password} />
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading || (currentMode === 'register' && (password !== confirmPassword || password.length < 6))}
                                    className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-2xl shadow-indigo-600/40 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? 'Aguarde...' : (currentMode === 'login' ? 'Entrar Agora' : 'Finalizar Cadastro')} <ArrowRight size={20} />
                                </button>

                                {currentMode === 'register' && password && confirmPassword && password !== confirmPassword && (
                                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider text-center">Senhas não conferem</p>
                                )}
                            </form>
                        )}

                        {currentMode !== 'force-reset' && (
                            <p className="text-center text-sm text-slate-500">
                                {currentMode === 'login' ? 'Ainda não tem conta?' : 'Já possui uma conta?'}
                                <button
                                    onClick={() => setCurrentMode(currentMode === 'login' ? 'register' : 'login')}
                                    className="ml-2 text-indigo-600 font-bold hover:underline"
                                >
                                    {currentMode === 'login' ? 'Cadastre-se' : 'Entrar'}
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
