'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginWithGoogle, requestPasswordReset } from '@/app/login/actions'
import { Scale, Lock, CheckCircle2, Circle } from 'lucide-react'
import { createMasterClient } from '@/lib/supabase/master'
import Link from 'next/link'

export function LoginModal() {
    const router = useRouter()
    const supabase = createMasterClient()

    const [isOpen, setIsOpen] = useState(false)

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

    const resetStates = () => {
        setMode('login')
        setErrorMsg('')
        setSuccessMsg('')
        setEmail('')
        setPassword('')
        setNewPassword('')
        setConfirmPassword('')
    }

    const handleOpenChange = (open: boolean) => {
        setIsOpen(open)
        if (!open) resetStates()
    }

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

        if (data?.user?.user_metadata?.need_to_change_password) {
            setMode('change_password')
            setSuccessMsg('Primeiro acesso com senha provisória detectado. Por favor, crie sua senha definitiva.')
            setLoading(false)
            return
        }

        setLoading(false)
        setIsOpen(false)
        router.push('/veritum')
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

        setSuccessMsg('Sua senha provisória foi gerada! Verifique seu e-mail.')
        setMode('login')
        setPassword('')
        setLoading(false)
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
            data: { need_to_change_password: false }
        })

        if (error) {
            setErrorMsg('Erro ao atualizar senha.')
            setLoading(false)
            return
        }

        setLoading(false)
        setIsOpen(false)
        router.push('/veritum')
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
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
                    Entrar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-neutral-950 border-neutral-800 text-neutral-100 p-0 overflow-hidden gap-0">
                <div className="p-6 pt-12 pb-8 flex flex-col items-center text-center bg-gradient-to-b from-neutral-900 to-neutral-950/50 border-b border-neutral-800">
                    <div className="bg-primary/10 p-3 rounded-xl mb-6 shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]">
                        {mode === 'change_password' ? <Lock className="h-8 w-8 text-primary" /> : <Scale className="h-8 w-8 text-primary" />}
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-white">
                        {mode === 'login' && 'Bem-vindo de volta'}
                        {mode === 'forgot_password' && 'Recuperar Senha'}
                        {mode === 'change_password' && 'Nova Senha'}
                    </DialogTitle>
                    <DialogDescription className="text-neutral-400 mt-2 text-base">
                        {mode === 'login' && 'Acesse sua conta para continuar'}
                        {mode === 'forgot_password' && 'Enviaremos uma senha provisória'}
                        {mode === 'change_password' && 'Crie uma senha forte e definitiva'}
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-4 bg-neutral-950">

                    {errorMsg && (
                        <div className="p-3 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-md">
                            {errorMsg}
                            {errorMsg.includes('não foi localizado') && (
                                <Link href="/setup" className="ml-2 font-bold underline" onClick={() => setIsOpen(false)}>Criar conta</Link>
                            )}
                        </div>
                    )}

                    {successMsg && (
                        <div className="p-3 text-sm text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-md">
                            {successMsg}
                        </div>
                    )}

                    {mode === 'login' && (
                        <>
                            <Button
                                variant="outline"
                                className="w-full h-11 bg-white text-black hover:bg-neutral-200 border-none font-medium flex items-center justify-center gap-2 group transition-all"
                                onClick={handleGoogleLogin} disabled={loading}
                            >
                                <svg className="h-5 w-5" aria-hidden="true" focusable="false" data-prefix="fab" data-icon="google" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 488 512">
                                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"></path>
                                </svg>
                                Continuar com Google
                            </Button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <span className="w-full border-t border-neutral-800" />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-neutral-950 px-2 text-neutral-500 font-medium">
                                        Ou email e senha
                                    </span>
                                </div>
                            </div>

                            <form onSubmit={handleLogin} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Email</Label>
                                    <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required className="bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-primary/50 focus:ring-primary/20 h-10" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Senha</Label>
                                    <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} required className="bg-neutral-900/50 border-neutral-800 text-white focus:border-primary/50 focus:ring-primary/20 h-10" />
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
                                <Button type="submit" className="w-full h-11 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700 mt-2" disabled={loading}>
                                    <Lock className="w-4 h-4 mr-2" />
                                    {loading ? 'Acessando...' : 'Entrar'}
                                </Button>
                            </form>
                        </>
                    )}

                    {mode === 'forgot_password' && (
                        <form onSubmit={handleForgotPassword} className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="reset-email" className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Email da sua conta</Label>
                                <Input id="reset-email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} required autoFocus className="bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-primary/50 focus:ring-primary/20 h-10" />
                            </div>
                            <Button type="submit" className="w-full h-11 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700" disabled={loading}>
                                {loading ? 'Enviando...' : 'Enviar Senha Provisória'}
                            </Button>
                            <Button type="button" variant="ghost" className="w-full text-neutral-400 hover:text-white" onClick={() => { setErrorMsg(''); setMode('login') }} disabled={loading}>
                                Voltar para o Login
                            </Button>
                        </form>
                    )}

                    {mode === 'change_password' && (
                        <form onSubmit={handleChangePassword} className="space-y-5 pt-2">
                            <div className="space-y-2">
                                <Label htmlFor="new-password" className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Nova Senha</Label>
                                <Input id="new-password" type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} disabled={loading} required autoFocus className="bg-neutral-900/50 border-neutral-800 text-white focus:border-primary/50 focus:ring-primary/20 h-10" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password" className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Confirmar Nova Senha</Label>
                                <Input id="confirm-password" type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} disabled={loading} required className="bg-neutral-900/50 border-neutral-800 text-white focus:border-primary/50 focus:ring-primary/20 h-10" />
                            </div>

                            <div className="bg-neutral-900 p-3 rounded-lg border border-neutral-800">
                                <p className="text-xs font-semibold mb-2 text-neutral-300">Requisitos de segurança:</p>
                                <div className="space-y-1">
                                    {requirements.map((req, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs">
                                            {req.met ? (
                                                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                            ) : (
                                                <Circle className="w-3 h-3 text-neutral-600" />
                                            )}
                                            <span className={req.met ? 'text-neutral-200' : 'text-neutral-500'}>{req.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button type="submit" className="w-full h-11 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700" disabled={loading || !isPasswordStrong(newPassword)}>
                                {loading ? 'Atualizando...' : 'Alterar Senha e Entrar'}
                            </Button>
                        </form>
                    )}

                    {mode === 'login' && (
                        <p className="text-center text-sm text-neutral-500 mt-4">
                            Não tem conta?{' '}
                            <Link href="/setup" className="text-primary hover:text-primary/80 transition-colors font-medium" onClick={() => setIsOpen(false)}>Cadastre-se</Link>
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}

