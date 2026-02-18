'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useState, useEffect } from 'react'

export default function DatabaseSetupPage() {
    const [sql, setSql] = useState('')
    const [copied, setCopied] = useState(false)

    useEffect(() => {
        fetch('/api/schema')
            .then(res => res.text())
            .then(setSql)
    }, [])

    const copyToClipboard = () => {
        navigator.clipboard.writeText(sql)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Configuração do Banco de Dados</CardTitle>
                    <CardDescription>
                        Como estamos usando uma arquitetura BYODB, você precisa inicializar as tabelas no seu projeto Supabase.
                        Copie o SQL abaixo e execute no <strong>SQL Editor</strong> do seu dashboard Supabase.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="bg-muted p-4 rounded-md overflow-x-auto max-h-96 text-sm font-mono whitespace-pre">
                        {sql || 'Carregando schema...'}
                    </div>
                    <Button onClick={copyToClipboard} disabled={!sql}>
                        {copied ? 'Copiado!' : 'Copiar SQL'}
                    </Button>
                </CardContent>
            </Card>
        </div>
    )
}
