'use client'

import React, { useState, useEffect } from 'react';
import { X, Mail, Lock, User, Chrome, ArrowRight, Scale, CheckCircle2, Circle, Eye, EyeOff } from 'lucide-react';
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { createMasterClient } from '@/lib/supabase/master'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { registerPublicUser, resetTemporaryPassword } from '@/app/actions/user-actions';
import { requestPasswordReset } from '@/app/login/actions';
import { useTranslation } from '@/contexts/language-context';

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

const PasswordStrength = ({ password, t }: { password: string, t: any }) => {
    const checks = {
        length: password.length >= 6,
        upper: /[A-Z]/.test(password),
        lower: /[a-z]/.test(password),
        number: /[0-9]/.test(password),
        symbol: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const strength = Object.values(checks).filter(Boolean).length;

    const getStrengthLabel = () => {
        if (!password) return { label: t('auth.strength.empty'), color: 'text-slate-500' };
        if (strength <= 2) return { label: t('auth.strength.veryWeak'), color: 'text-rose-500' };
        if (strength <= 3) return { label: t('auth.strength.weak'), color: 'text-amber-500' };
        if (strength <= 4) return { label: t('auth.strength.moderate'), color: 'text-indigo-500' };
        return { label: t('auth.strength.strong'), color: 'text-emerald-500' };
    };

    const { label, color } = getStrengthLabel();

    return (
        <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mt-4">
            <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">{t('auth.strength.title')}</span>
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
                    { key: 'length', label: t('auth.strength.checks.length') },
                    { key: 'upper', label: t('auth.strength.checks.upper') },
                    { key: 'lower', label: t('auth.strength.checks.lower') },
                    { key: 'number', label: t('auth.strength.checks.number') },
                    { key: 'symbol', label: t('auth.strength.checks.symbol') }
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
    const { t } = useTranslation()
    const [currentMode, setCurrentMode] = useState<'login' | 'register' | 'force-reset' | 'forgot_password'>(mode);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [trialPlanId, setTrialPlanId] = useState<string | null>(null);

    useEffect(() => {
        const fetchTrialPlan = async () => {
            const supabase = createMasterClient();
            const { data } = await supabase
                .from('plans')
                .select('id')
                .ilike('name->>pt', '%Trial%')
                .limit(1)
                .single();
            if (data?.id) setTrialPlanId(data.id);
        };
        fetchTrialPlan();
    }, []);

    const emailRef = React.useRef<HTMLInputElement>(null);
    const nameRef = React.useRef<HTMLInputElement>(null);
    const passwordRef = React.useRef<HTMLInputElement>(null);
    const loginPasswordRef = React.useRef<HTMLInputElement>(null);

    // Ensure the modal resets to the requested mode whenever it's opened or changed
    useEffect(() => {
        if (isOpen) {
            setCurrentMode(mode);
            setError(null);
            setSuccessMsg(null);
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

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (currentMode === 'login' || currentMode === 'forgot_password') emailRef.current?.focus();
                else if (currentMode === 'register') nameRef.current?.focus();
                else if (currentMode === 'force-reset') passwordRef.current?.focus();
            }, 50);
        }

        const handleAuthMessage = async (event: MessageEvent) => {
            // Check origin for security
            if (event.origin !== window.location.origin) return;

            if (event.data?.type === 'AUTH_SUCCESS') {
                const supabase = createMasterClient();
                const { data: { user } } = await supabase.auth.getUser();

                if (user) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('force_password_reset')
                        .eq('id', user.id)
                        .single();

                    if (profile?.force_password_reset || user.user_metadata?.force_password_reset || user.user_metadata?.need_to_change_password) {
                        // Let onAuthStateChange handle the mode switch to force-reset
                        return;
                    }
                }

                setLoading(false);
                onClose();
                window.location.href = event.data.url;
            }
        };

        window.addEventListener('message', handleAuthMessage);
        return () => window.removeEventListener('message', handleAuthMessage);
    }, [currentMode, isOpen, onClose]);

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

                    // Metadata Check (Fast)
                    if (user.user_metadata?.need_to_change_password || user.user_metadata?.force_password_reset) {
                        setUserId(user.id);
                        setCurrentMode('force-reset');
                        setSuccessMsg(null);
                        setPassword('');
                        setConfirmPassword('');
                        setLoading(false);
                        return;
                    }

                    if (profile && !profile.active) {
                        await supabase.auth.signOut();
                        throw new Error(t('auth.errors.inactive'));
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

                window.location.href = '/veritumpro';
            } else {
                // Front-end validation for Register
                if (password !== confirmPassword) {
                    setLoading(false);
                    setError(t('auth.errors.passwordsDoNotMatch'));
                    return;
                }
                if (password.length < 6) {
                    setLoading(false);
                    setError(t('auth.errors.passwordTooShort'));
                    return;
                }

                const invite_code = new URLSearchParams(window.location.search).get('invite') || localStorage.getItem('veritum_ref_code');
                const result = await registerPublicUser({
                    email,
                    password,
                    name,
                    invite_code: invite_code
                });

                // Clear the persistence after successful registration attempt
                if (invite_code) localStorage.removeItem('veritum_ref_code');

                if (!result.success) {
                    throw new Error(result.error);
                }

                // Auto-login after successful registration
                const { error: loginError } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (loginError) throw loginError;

                window.location.href = '/veritumpro';
            }
        } catch (err: any) {
            console.error('Auth error:', err);
            setError(err.message || t('auth.errors.default'));
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) {
            setError(t('auth.errors.default') || 'Preencha o e-mail');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            const result = await requestPasswordReset(email);
            if (result.error) {
                if (result.notFound) {
                    setError(t('auth.errors.notFound'));
                } else {
                    setError(result.error);
                }
            } else {
                setSuccessMsg(t('auth.errors.genResetSuccess'));
                setCurrentMode('login');
                setPassword('');
                setTimeout(() => loginPasswordRef.current?.focus(), 150);
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao redefinir senha.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        if (password !== confirmPassword) {
            setError(t('auth.errors.passwordsDoNotMatch'));
            return;
        }

        if (password.length < 6) {
            setError(t('auth.errors.passwordTooShort'));
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const supabase = createMasterClient();

            // 1. Update password AND metadata via client-side (this refreshes the session/JWT automatically)
            const { error } = await supabase.auth.updateUser({
                password: password,
                data: {
                    need_to_change_password: false,
                    force_password_reset: false
                }
            })

            if (error) {
                setError('Erro ao atualizar senha no sistema de autenticação.')
                setLoading(false)
                return
            }

            // Also update the flag in the database table
            const { error: dbError } = await supabase
                .from('users')
                .update({ force_password_reset: false })
                .eq('id', userId);

            if (dbError) {
                console.error('Error updating DB reset flag:', dbError);
            }

            setLoading(false)
            // Full reload to ensure session is correctly picked up by layout
            window.location.href = '/veritumpro';
        }
        catch (err: any) {
            setError(err.message || t('auth.errors.resetError'));
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const supabase = createMasterClient();
            const invite_code = new URLSearchParams(window.location.search).get('invite') || localStorage.getItem('veritum_ref_code');

            // Clean storage if found to avoid pollution
            if (invite_code && invite_code === localStorage.getItem('veritum_ref_code')) {
                // We keep it in storage until actual login success to be safe, 
                // but we already have it in local variable
            }

            // 1. Listen for auth state change - reliable across windows on same origin
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if ((event === 'SIGNED_IN') && session) {
                    const { data: profile } = await supabase
                        .from('users')
                        .select('active, force_password_reset')
                        .eq('id', session.user.id)
                        .single();

                    if (profile && !profile.active) {
                        await supabase.auth.signOut();
                        setError(t('auth.errors.inactive'));
                        setLoading(false);
                        return;
                    }

                    // 1. Metadata check (Fast)
                    const meta = session.user.user_metadata;
                    if (meta?.need_to_change_password || meta?.force_password_reset) {
                        console.log('Forced reset detected in metadata');
                        setCurrentMode('force-reset') // Changed from setMode('change_password')
                        setSuccessMsg('')
                        setLoading(false)
                        return
                    }

                    if (profile?.force_password_reset) {
                        console.log('Forced reset detected in database');
                        setCurrentMode('force-reset') // Changed from setMode('change_password')
                        setSuccessMsg('')
                        setLoading(false)
                        return
                    }

                    subscription.unsubscribe();
                    setLoading(false);
                    onClose();

                    // Clear persistent referral code
                    localStorage.removeItem('veritum_ref_code');

                    window.location.href = '/veritumpro';
                }
            });

            // Fetch trial plan on the fly to avoid race conditions
            const { data: trialPlan } = await supabase
                .from('plans')
                .select('id')
                .ilike('name->>pt', '%Trial%')
                .limit(1)
                .single();

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback${invite_code ? `?invite=${invite_code}` : ''}`,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'select_account',
                    },
                    data: {
                        invited_by_code: invite_code,
                        plan_id: trialPlan?.id || trialPlanId,
                        role: 'Sócio Administrador'
                    },
                    skipBrowserRedirect: true
                } as any,
            });

            if (error) {
                subscription.unsubscribe();
                throw error;
            }

            if (data?.url) {
                const width = 600;
                const height = 700;
                const left = window.screenX + (window.outerWidth - width) / 2;
                const top = window.screenY + (window.outerHeight - height) / 2;

                const popup = window.open(
                    data.url,
                    'google-login',
                    `width=${width},height=${height},left=${left},top=${top},toolbar=0,scrollbars=1,status=0,resizable=1,location=1,menuBar=0`
                );

                // 2. We no longer poll for popup closure via popup.closed
                // because COOP prevents access to that property on localhost.
                // The onAuthStateChange above handles SUCCESS, and the popup
                // handles its own closure or shows a message if blocked.
                const timer = setInterval(() => {
                    // Just reset loading state if we somehow lose track, 
                    // but the redirect in onAuthStateChange is our primary success path.
                    // This timer is now just a safety net for the loading spinner.
                }, 1000);

                // Set a timeout to clear the loading state after 60s if nothing happens
                setTimeout(() => {
                    clearInterval(timer);
                    subscription.unsubscribe();
                    setLoading(false);
                }, 60000);
            }
        } catch (error: any) {
            console.error('Login error:', error);
            setError(error.message || t('auth.errors.googleError'));
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-lg p-0 bg-transparent border-none shadow-none">
                <div className={`relative w-full p-6 pt-10 rounded-[2.5rem] shadow-2xl border transition-colors ${theme === 'dark' ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <DialogTitle className="sr-only">{currentMode === 'login' ? t('auth.signIn') : t('auth.signUp')}</DialogTitle>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                        <X size={20} />
                    </button>

                    <div className="text-center mb-6">
                        <div className="inline-flex mb-4">
                            <Logo />
                        </div>
                        <h2 className="text-3xl font-black tracking-tight mb-2 dark:text-white text-slate-900">
                            {currentMode === 'login' ? t('auth.loginTitle') :
                                currentMode === 'register' ? t('auth.registerTitle') :
                                    t('auth.resetTitle')}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400">
                            {currentMode === 'login' ? t('auth.loginSubtitle') :
                                currentMode === 'register' ? t('auth.registerSubtitle') :
                                    t('auth.resetSubtitle')}
                        </p>
                    </div>

                    <div className="space-y-4">
                        {currentMode !== 'force-reset' && (
                            <>
                                <button
                                    onClick={handleGoogleLogin}
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-3 py-3 border border-slate-200 dark:border-slate-800 rounded-2xl font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 dark:text-white bg-transparent cursor-pointer"
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
                                    {loading ? t('common.loading') : t('auth.googleLogin')}
                                </button>

                                <div className="relative">
                                    <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200 dark:border-slate-800"></div></div>
                                    <div className="relative flex justify-center text-xs uppercase"><span className={`px-4 font-bold tracking-widest ${theme === 'dark' ? 'bg-slate-900 text-slate-500' : 'bg-white text-slate-400'}`}>{t('auth.hasAccount').split('?')[1].trim()}</span></div>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900/30">
                                {error}
                                {error === t('auth.errors.notFound') && (
                                    <button type="button" onClick={() => setCurrentMode('register')} className="ml-2 font-bold underline cursor-pointer">
                                        {t('auth.signUp')}
                                    </button>
                                )}
                            </div>
                        )}

                        {successMsg && (
                            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-100 dark:border-emerald-900/30">
                                {successMsg}
                            </div>
                        )}

                        {currentMode === 'forgot_password' ? (
                            <form className="space-y-4" onSubmit={handleForgotPassword}>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        ref={emailRef}
                                        required
                                        type="email"
                                        placeholder={t('auth.emailLabel')}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={email}
                                        onInvalid={e => e.currentTarget.setCustomValidity(t('auth.errors.fillField'))}
                                        onInput={e => e.currentTarget.setCustomValidity('')}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-branding-gradient animate-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-600/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? t('common.loading') : t('auth.resetConfirmButton')} <ArrowRight size={20} strokeWidth={3} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCurrentMode('login')}
                                    className="w-full py-3 text-slate-500 font-bold hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer"
                                >
                                    {t('auth.backToLogin') || 'Voltar ao Login'}
                                </button>
                            </form>
                        ) : currentMode === 'force-reset' ? (
                            <form className="space-y-4" onSubmit={handleResetPassword}>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        ref={passwordRef}
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder={t('auth.newPasswordPlaceholder')}
                                        className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={password}
                                        onInvalid={e => e.currentTarget.setCustomValidity(t('auth.errors.fillField'))}
                                        onInput={e => e.currentTarget.setCustomValidity('')}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder={t('auth.confirmNewPasswordPlaceholder')}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={confirmPassword}
                                        onInvalid={e => e.currentTarget.setCustomValidity(t('auth.errors.fillField'))}
                                        onInput={e => e.currentTarget.setCustomValidity('')}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>

                                <PasswordStrength password={password} t={t} />

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-branding-gradient animate-gradient text-white py-4 rounded-2xl font-bold shadow-2xl shadow-blue-600/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? t('common.loading') : t('auth.resetTitle')} <ArrowRight size={20} />
                                </button>

                                {password && confirmPassword && password !== confirmPassword && (
                                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider text-center">{t('auth.errors.passwordsDoNotMatch')}</p>
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
                                            placeholder={t('management.users.modal.name')}
                                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                            value={name}
                                            onInvalid={e => e.currentTarget.setCustomValidity(t('auth.errors.fillField'))}
                                            onInput={e => e.currentTarget.setCustomValidity('')}
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
                                        placeholder={t('auth.emailLabel')}
                                        className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={email}
                                        onInvalid={e => e.currentTarget.setCustomValidity(t('auth.errors.fillField'))}
                                        onInput={e => e.currentTarget.setCustomValidity('')}
                                        onChange={e => setEmail(e.target.value)}
                                    />
                                </div>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-3.5 text-slate-400" size={20} />
                                    <input
                                        ref={loginPasswordRef}
                                        required
                                        type={showPassword ? "text" : "password"}
                                        placeholder={t('auth.passwordLabel')}
                                        className="w-full pl-12 pr-12 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                        value={password}
                                        onInvalid={e => e.currentTarget.setCustomValidity(t('auth.errors.fillField'))}
                                        onInput={e => e.currentTarget.setCustomValidity('')}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                    >
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>

                                {currentMode === 'login' && (
                                    <div className="flex justify-end pt-1">
                                        <button
                                            type="button"
                                            onClick={() => { setError(null); setSuccessMsg(null); setCurrentMode('forgot_password') }}
                                            className="text-sm font-medium hover:underline text-indigo-600 dark:text-indigo-400 cursor-pointer"
                                        >
                                            {t('auth.forgotPassword') || 'Esqueci minha senha'}
                                        </button>
                                    </div>
                                )}

                                {currentMode === 'register' && (
                                    <>
                                        <div className="relative">
                                            <Lock className="absolute left-4 top-4 text-slate-400" size={20} />
                                            <input
                                                required
                                                type={showPassword ? "text" : "password"}
                                                placeholder={t('auth.confirmPasswordLabel')}
                                                className="w-full pl-12 pr-4 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-600 dark:text-white"
                                                value={confirmPassword}
                                                onInvalid={e => e.currentTarget.setCustomValidity(t('auth.errors.fillField'))}
                                                onInput={e => e.currentTarget.setCustomValidity('')}
                                                onChange={e => setConfirmPassword(e.target.value)}
                                            />
                                        </div>

                                        <PasswordStrength password={password} t={t} />
                                    </>
                                )}

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-branding-gradient animate-gradient text-white py-4 rounded-2xl font-black uppercase tracking-widest shadow-2xl shadow-blue-600/20 hover:scale-[1.01] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                                >
                                    {loading ? t('common.loading') : (currentMode === 'login' ? t('auth.loginButton') : t('auth.registerButton'))} <ArrowRight size={20} strokeWidth={3} />
                                </button>

                                {currentMode === 'register' && password && confirmPassword && password !== confirmPassword && (
                                    <p className="text-[10px] text-rose-500 font-bold uppercase tracking-wider text-center">{t('auth.errors.passwordsDoNotMatch')}</p>
                                )}
                            </form>
                        )}

                        {currentMode !== 'force-reset' && currentMode !== 'forgot_password' && (
                            <p className="text-center text-sm text-slate-500">
                                {currentMode === 'login' ? t('auth.noAccount').split('?')[0] + '?' : t('auth.hasAccount').split('?')[0] + '?'}
                                <button
                                    onClick={() => setCurrentMode(currentMode === 'login' ? 'register' : 'login')}
                                    className="ml-2 text-indigo-600 font-bold hover:underline cursor-pointer"
                                >
                                    {currentMode === 'login' ? t('auth.signUp') : t('auth.signIn')}
                                </button>
                            </p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
