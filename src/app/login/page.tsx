'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Scale, Lock, CheckCircle2, Circle } from 'lucide-react'
import { loginWithGoogle, requestPasswordReset } from './actions'
import { createMasterClient } from '@/lib/supabase/master'

export default function LoginPage() {
    const router = useRouter()
    const supabase = createMasterClient()

    type Mode = 'login' | 'forgot_password' | 'change_password'
    const [mode, setMode] = useState<Mode>('login')
    const [loading, setLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    // Form states
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const passwordRef = React.useRef<HTMLInputElement>(null)
    const loginPasswordRef = React.useRef<HTMLInputElement>(null)

    // Handle forced reset redirect from Layout
    React.useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('reset') === 'true') {
            setMode('change_password');
            setSuccessMsg('Sua senha expirou ou foi resetada. Por favor, crie uma nova senha.');
            setTimeout(() => passwordRef.current?.focus(), 100);
        }
    }, []);

    const handleGoogleLogin = async () => {
        setLoading(true)
        await loginWithGoogle()
        setLoading(false)
    }

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email || !password) {
            setErrorMsg('Preencha email e senha.')
            return
        }

        setLoading(true)
        setErrorMsg('')

        const { data, error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setLoading(false)
            setErrorMsg('Credenciais inválidas.')
            return
        }

        if (data?.user) {
            console.log('Login successful, checking for forced reset...', data.user.user_metadata);

            // 1. Metadata check (Fast)
            const meta = data.user.user_metadata;
            if (meta?.need_to_change_password || meta?.force_password_reset) {
                console.log('Forced reset detected in metadata');
                setMode('change_password')
                setSuccessMsg('')
                setLoading(false)
                return
            }

            // 2. Database check (Reliable)
            const { data: profile, error: profileError } = await supabase
                .from('users')
                .select('active, force_password_reset')
                .eq('id', data.user.id)
                .single();

            if (profileError) {
                console.error('Error fetching profile for reset check:', profileError);
            }

            if (profile) {
                console.log('Profile found:', profile);
                if (!profile.active) {
                    await supabase.auth.signOut();
                    setErrorMsg('Sua conta está inativa. Entre em contato com o administrador.')
                    setLoading(false);
                    return
                }

                if (profile.force_password_reset) {
                    console.log('Forced reset detected in database');
                    setMode('change_password')
                    setSuccessMsg('')
                    setLoading(false)
                    return
                }
            } else {
                console.warn('Profile not found for user:', data.user.id);
            }
        }

        console.log('Proceeding to dashboard...');
        setLoading(false)
        router.push('/veritumpro') // Redirect to dashboard
    }

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            setErrorMsg('Preencha seu email para recuperar a senha.')
            return
        }

        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')

        const result = await requestPasswordReset(email)

        if (result.error) {
            setErrorMsg(result.error)
            setLoading(false)
            return
        }

        setSuccessMsg('Sua senha provisória foi enviada! Verifique seu e-mail (e a pasta de spam, marcando como "não é spam" se necessário).')
        setMode('login')
        setPassword('')
        setLoading(false)
        setTimeout(() => loginPasswordRef.current?.focus(), 150)
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()
        setErrorMsg('')

        if (newPassword !== confirmPassword) {
            setErrorMsg('As senhas não coincidem.')
            return
        }

        if (!isPasswordStrong(newPassword)) {
            setErrorMsg('A senha não atende aos requisitos de segurança.')
            return
        }

        setLoading(true)

        const { error } = await supabase.auth.updateUser({
            password: newPassword,
            data: {
                need_to_change_password: false,
                force_password_reset: false
            }
        })

        if (error) {
            setErrorMsg('Erro ao atualizar senha no sistema de autenticação.')
            setLoading(false)
            return
        }

        // Also update the flag in the database table
        const { error: dbError } = await supabase
            .from('users')
            .update({ force_password_reset: false })
            .eq('id', (await supabase.auth.getUser()).data.user?.id);

        if (dbError) {
            console.error('Error updating DB reset flag:', dbError);
        }

        setLoading(false)
        window.location.href = '/veritumpro';
    }

    const isPasswordStrong = (pass: string) => {
        const hasLength = pass.length >= 8
        const hasUpper = /[A-Z]/.test(pass)
        const hasLower = /[a-z]/.test(pass)
        const hasNumber = /[0-9]/.test(pass)
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pass)
        return hasLength && hasUpper && hasLower && hasNumber && hasSpecial
    }

    const requirements = [
        { label: 'Pelo menos 8 caracteres', met: newPassword.length >= 8 },
        { label: 'Uma letra maiúscula', met: /[A-Z]/.test(newPassword) },
        { label: 'Uma letra minúscula', met: /[a-z]/.test(newPassword) },
        { label: 'Um número', met: /[0-9]/.test(newPassword) },
        { label: 'Um caractere especial', met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword) },
    ]

    return (
        <div className="min-h-screen flex items-center justify-center bg-muted/40 p-2">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center py-4">
                    <div className="flex justify-center mb-2">
                        <div className="bg-primary/10 p-2 rounded-full">
                            {mode === 'change_password' ? <Lock className="h-8 w-8 text-primary" /> : <Scale className="h-8 w-8 text-primary" />}
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">
                        {mode === 'login' && 'Acesse o Veritum Pro'}
                        {mode === 'forgot_password' && 'Recuperar Senha'}
                        {mode === 'change_password' && 'Nova Senha'}
                    </CardTitle>
                    <CardDescription>
                        {mode === 'login' && 'Entre na plataforma de inteligência jurídica.'}
                        {mode === 'forgot_password' && 'Enviaremos uma senha provisória para o seu e-mail.'}
                        {mode === 'change_password' && 'Crie uma senha forte e definitiva para sua conta.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 py-2">

                    {errorMsg && (
                        <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                            {errorMsg}
                            {errorMsg.includes('não foi localizado') && (
                                <Link href="/setup" className="ml-2 font-bold underline">Criar conta</Link>
                            )}
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 text-sm text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                            {successMsg}
                        </div>
                    )}

                    {mode === 'login' && (
                        <>
                            <Button variant="outline" className="w-full py-5" onClick={handleGoogleLogin} disabled={loading}>
                                <svg className="mr-2 h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Continuar com Google
                            </Button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        Ou continue com e-mail
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Senha</Label>
                                    <Input ref={loginPasswordRef} id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required />
                                </div>
                                <div className="text-right">
                                    <button
                                        type="button"
                                        onClick={() => { setErrorMsg(''); setSuccessMsg(''); setMode('forgot_password') }}
                                        className="text-sm font-medium underline underline-offset-4 text-primary hover:text-primary/80 transition-colors"
                                    >
                                        Esqueci minha senha
                                    </button>
                                </div>
                                <Button type="submit" className="w-full mt-2" disabled={loading}>
                                    {loading ? 'Acessando...' : 'Entrar no ecossistema'}
                                </Button>
                            </form>
                        </>
                    )}

                    {mode === 'forgot_password' && (
                        <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email">Email da sua conta</Label>
                                <Input id="reset-email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required autoFocus />
                            </div>
                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar Senha Provisória'}
                            </Button>
                            <Button type="button" variant="ghost" className="w-full" onClick={() => { setErrorMsg(''); setMode('login') }} disabled={loading}>
                                Voltar para o Login
                            </Button>
                        </form>
                    )}

                    {mode === 'change_password' && (
                        <form onSubmit={handleChangePassword} className="space-y-5 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="new-password">Nova Senha</Label>
                                <Input ref={passwordRef} id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} required autoFocus />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirmar Nova Senha</Label>
                                <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} required />
                            </div>

                            <div className="bg-muted/50 p-3 rounded-lg border border-border">
                                <p className="text-xs font-semibold mb-2">Requisitos de segurança:</p>
                                <div className="space-y-1">
                                    {requirements.map((req, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            {req.met ? (
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                                <Circle className="w-3 h-3 text-muted-foreground" />
                                            )}
                                            <span className={req.met ? 'text-foreground' : 'text-muted-foreground'}>{req.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" className="w-full" disabled={loading || !isPasswordStrong(newPassword)}>
                                {loading ? 'Atualizando...' : 'Alterar Senha e Entrar'}
                            </Button>
                        </form>
                    )}
                </CardContent>

                {mode === 'login' && (
                    <CardFooter className="flex flex-col space-y-1 text-center text-sm text-muted-foreground pt-1 pb-4">
                        <p>
                            Novo por aqui?{' '}
                            <Link href="/pricing" className="underline hover:text-primary underline-offset-4">
                                Crie sua conta
                            </Link>
                        </p>
                        <p className="mt-4 text-xs font-medium text-slate-500">
                            🌟 <Link href="/clube-vip" className="underline hover:text-amber-500 transition-colors">Membro do Clube VIP?</Link> Faça login e confira seus Pontos para a próxima renovação.
                        </p>
                    </CardFooter>
                )}
            </Card>
        </div>
    )
}

