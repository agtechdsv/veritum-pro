'use client'

import { useActionState } from 'react'
import { saveConnectionSettings } from './actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

const initialState = {
    message: '',
    errors: {}
}

export default function SetupPage() {
    const [state, formAction, isPending] = useActionState(saveConnectionSettings, initialState)

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Conexão Veritum Pro</CardTitle>
                    <CardDescription>
                        Insira suas credenciais do Supabase para conectar ao Ecossistema.
                        Seus dados são salvos localmente no seu navegador.
                    </CardDescription>
                </CardHeader>
                <form action={formAction}>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="supabaseUrl">Project URL</Label>
                            <Input
                                id="supabaseUrl"
                                name="supabaseUrl"
                                placeholder="https://your-project.supabase.co"
                                required
                            />
                            {state?.errors?.supabaseUrl && (
                                <p className="text-sm text-destructive">{state.errors.supabaseUrl}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="supabaseKey">Anon Key</Label>
                            <Input
                                id="supabaseKey"
                                name="supabaseKey"
                                type="password"
                                placeholder="eyJh..."
                                required
                            />
                            {state?.errors?.supabaseKey && (
                                <p className="text-sm text-destructive">{state.errors.supabaseKey}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="geminiKey">Gemini API Key (Opcional)</Label>
                            <Input
                                id="geminiKey"
                                name="geminiKey"
                                type="password"
                                placeholder="AIza..."
                            />
                        </div>

                        {state?.message && (
                            <p className="text-sm text-destructive font-medium">{state.message}</p>
                        )}
                    </CardContent>
                    <CardFooter>
                        <Button type="submit" className="w-full">Conectar Ecossistema</Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
