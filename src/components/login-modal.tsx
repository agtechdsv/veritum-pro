'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { loginWithGoogle } from '@/app/login/actions'
import { Scale, Lock } from 'lucide-react'

export function LoginModal() {
    const [isOpen, setIsOpen] = useState(false)

    const handleGoogleLogin = async () => {
        await loginWithGoogle()
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="text-sm font-medium text-neutral-400 hover:text-white hover:bg-white/5 transition-colors">
                    Entrar
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] bg-neutral-950 border-neutral-800 text-neutral-100 p-0 overflow-hidden gap-0">
                <div className="p-6 pt-12 pb-8 flex flex-col items-center text-center bg-gradient-to-b from-neutral-900 to-neutral-950/50 border-b border-neutral-800">
                    <div className="bg-primary/10 p-3 rounded-xl mb-6 shadow-[0_0_20px_-5px_rgba(255,255,255,0.1)]">
                        <Scale className="h-8 w-8 text-primary" />
                    </div>
                    <DialogTitle className="text-2xl font-bold tracking-tight text-white">Bem-vindo de volta</DialogTitle>
                    <DialogDescription className="text-neutral-400 mt-2 text-base">
                        Acesse sua conta para continuar
                    </DialogDescription>
                </div>

                <div className="p-6 space-y-4 bg-neutral-950">
                    <Button
                        variant="outline"
                        className="w-full h-11 bg-white text-black hover:bg-neutral-200 border-none font-medium flex items-center justify-center gap-2 group transition-all"
                        onClick={handleGoogleLogin}
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

                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Email</Label>
                            <Input id="email" type="email" placeholder="seu@email.com" className="bg-neutral-900/50 border-neutral-800 text-white placeholder:text-neutral-600 focus:border-primary/50 focus:ring-primary/20 h-10" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-neutral-400 text-xs uppercase tracking-wider font-semibold">Senha</Label>
                            <Input id="password" type="password" className="bg-neutral-900/50 border-neutral-800 text-white focus:border-primary/50 focus:ring-primary/20 h-10" />
                        </div>
                        <Button className="w-full h-11 bg-neutral-800 hover:bg-neutral-700 text-white border border-neutral-700">
                            <Lock className="w-4 h-4 mr-2" />
                            Entrar
                        </Button>
                    </form>

                    <p className="text-center text-sm text-neutral-500 mt-4">
                        Não tem conta?{' '}
                        <a href="/setup" className="text-primary hover:text-primary/80 transition-colors font-medium">Cadastre-se</a>
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    )
}
