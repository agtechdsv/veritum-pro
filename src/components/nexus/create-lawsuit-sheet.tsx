'use client'

import { useState } from 'react'
import { createLawsuit } from '@/app/(dashboard)/nexus/actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus } from 'lucide-react'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
    SheetFooter,
    SheetClose
} from "@/components/ui/sheet"

export function CreateLawsuitSheet() {
    const [open, setOpen] = useState(false)
    const [pending, setPending] = useState(false)

    async function handleSubmit(formData: FormData) {
        setPending(true)
        const result = await createLawsuit(formData)
        setPending(false)

        if (result.success) {
            setOpen(false)
        } else {
            // Handle error (could use toast)
            console.error(result.error)
        }
    }

    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Processo
                </Button>
            </SheetTrigger>
            <SheetContent>
                <SheetHeader>
                    <SheetTitle>Adicionar Novo Processo</SheetTitle>
                    <SheetDescription>
                        Insira os dados do novo processo para iniciar o fluxo.
                    </SheetDescription>
                </SheetHeader>
                <form action={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="cnj_number">Número CNJ</Label>
                        <Input id="cnj_number" name="cnj_number" placeholder="0000000-00.0000.0.00.0000" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="client_name">Cliente</Label>
                        <Input id="client_name" name="client_name" placeholder="Nome do Cliente" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="case_title">Título do Caso</Label>
                        <Input id="case_title" name="case_title" placeholder="Ex: Ação de Cobrança" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="value">Valor da Causa (R$)</Label>
                        <Input id="value" name="value" type="number" step="0.01" placeholder="0.00" />
                    </div>

                    <SheetFooter>
                        <SheetClose asChild>
                            <Button type="button" variant="outline" disabled={pending}>Cancelar</Button>
                        </SheetClose>
                        <Button type="submit" disabled={pending}>
                            {pending ? 'Salvando...' : 'Adicionar Processo'}
                        </Button>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}
