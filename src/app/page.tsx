'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
    ShieldCheck,
    Scale,
    FileText,
    BadgeDollarSign,
    BrainCircuit,
    Users,
    CheckCircle2,
    ArrowRight
} from 'lucide-react'
import { motion } from 'framer-motion'
import { LoginModal } from '@/components/login-modal'
import { ModeToggle } from '@/components/mode-toggle'

const suites = [
    {
        title: 'Sentinel Pro',
        description: 'Vigilância e Monitoramento',
        icon: ShieldCheck,
        color: 'text-red-500',
        details: 'Clipping inteligente e captura antecipada de processos.',
        gradient: 'from-red-500/20 to-orange-500/5'
    },
    {
        title: 'Nexus Pro',
        description: 'Gestão de Workflow',
        icon: Scale,
        color: 'text-blue-500',
        details: 'Kanban jurídico e automação de tarefas recorrentes.',
        gradient: 'from-blue-500/20 to-cyan-500/5'
    },
    {
        title: 'Scriptor Pro',
        description: 'Inteligência Documental',
        icon: FileText,
        color: 'text-amber-500',
        details: 'Redação assistida por IA e gestão de contratos (CLM).',
        gradient: 'from-amber-500/20 to-yellow-500/5'
    },
    {
        title: 'Valorem Pro',
        description: 'Controladoria Financeira',
        icon: BadgeDollarSign,
        color: 'text-emerald-500',
        details: 'Gestão de honorários e cálculos judiciais precisos.',
        gradient: 'from-emerald-500/20 to-green-500/5'
    },
    {
        title: 'Cognitio Pro',
        description: 'Jurimetria Avançada',
        icon: BrainCircuit,
        color: 'text-purple-500',
        details: 'Análise preditiva e dashboards para tomada de decisão.',
        gradient: 'from-purple-500/20 to-pink-500/5'
    },
    {
        title: 'Vox Clientis',
        description: 'CRM e Portal do Cliente',
        icon: Users,
        color: 'text-indigo-500',
        details: 'Comunicação transparente e tradução de "juridiquês".',
        gradient: 'from-indigo-500/20 to-violet-500/5'
    }
]

const plans = [
    {
        name: 'Starter',
        price: 'R$ 0',
        features: ['Nexus Pro (Básico)', 'Até 50 Processos', 'Suporte por Email'],
        cta: 'Começar Grátis',
        variant: 'outline' as const
    },
    {
        name: 'Professional',
        price: 'R$ 299',
        features: ['Todas as 6 Suítes', 'Processos Ilimitados', 'IA Generativa (Gemini)', 'Suporte Prioritário'],
        cta: 'Assinar Agora',
        variant: 'default' as const,
        popular: true
    },
    {
        name: 'Enterprise',
        price: 'Sob Consulta',
        features: ['API Personalizada', 'Gestor de Conta', 'Treinamento In-Company', 'SLA Garantido'],
        cta: 'Falar com Vendas',
        variant: 'outline' as const
    }
]

export default function LandingPage() {
    return (
        <div className="flex flex-col min-h-screen bg-neutral-950 text-neutral-100 selection:bg-primary/30">

            {/* Header */}
            <header className="fixed top-0 z-50 w-full border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl supports-[backdrop-filter]:bg-neutral-950/20">
                <div className="container flex h-16 items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <Scale className="h-5 w-5 text-primary" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">VERITUM PRO</span>
                    </div>
                    <nav className="hidden md:flex gap-8 text-sm font-medium">
                        <Link href="#features" className="text-neutral-400 hover:text-white transition-colors">Suítes</Link>
                        <Link href="#pricing" className="text-neutral-400 hover:text-white transition-colors">Planos</Link>
                    </nav>
                    <div className="flex gap-4 items-center">
                        <LoginModal />
                        <Button asChild className="rounded-full px-6 bg-white text-black hover:bg-neutral-200">
                            <Link href="/setup">Cadastro</Link>
                        </Button>
                        <ModeToggle />
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden">

                    {/* Spotlight Effect */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/20 blur-[120px] -z-10 opacity-50 pointer-events-none rounded-full" />

                    <div className="container px-4 md:px-6 relative z-10">
                        <div className="flex flex-col items-center text-center space-y-8">
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.7, ease: "easeOut" }}
                                className="space-y-4 max-w-4xl"
                            >
                                <div className="inline-flex items-center rounded-full border border-neutral-800 bg-neutral-900/50 px-3 py-1 text-sm text-neutral-400 backdrop-blur-xl mb-4">
                                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 mr-2 animate-pulse"></span>
                                    O Futuro da Advocacia chegou
                                </div>
                                <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white via-neutral-200 to-neutral-600 pb-2">
                                    Ecossistema Jurídico <br /> <span className="text-primary/90">Definitivo</span>
                                </h1>
                                <p className="text-xl text-neutral-400 md:text-2xl pt-4 max-w-2xl mx-auto leading-relaxed">
                                    Deixe a burocracia para os robôs. Foque na estratégia.
                                    Uma plataforma modular com 6 suítes integradas por IA.
                                </p>
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.3, duration: 0.5 }}
                                className="flex flex-col sm:flex-row gap-4 w-full justify-center pt-8"
                            >
                                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-white text-black hover:bg-neutral-200 shadow-2xl shadow-primary/20 transition-all hover:scale-105" asChild>
                                    <Link href="/setup">Começar Agora <ArrowRight className="ml-2 h-5 w-5" /></Link>
                                </Button>
                                <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full border-neutral-800 hover:bg-neutral-900 text-neutral-300 hover:text-white backdrop-blur-sm">
                                    Ver Demonstração
                                </Button>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 relative">
                    <div className="absolute inset-0 bg-neutral-950/50 -z-20" />
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-20 space-y-4">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-white">Suítes Especializadas</h2>
                            <p className="text-neutral-400 text-lg max-w-2xl mx-auto">
                                Módulos poderosos que conversam entre si para automatizar seu escritório.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {suites.map((suite, index) => (
                                <motion.div
                                    key={suite.title}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: index * 0.1 }}
                                    whileHover={{ y: -5 }}
                                >
                                    <div className={`group relative h-full rounded-2xl border border-white/5 bg-neutral-900/40 p-6 backdrop-blur-sm transition-all hover:border-white/10 hover:bg-neutral-900/60 overflow-hidden`}>
                                        <div className={`absolute inset-0 bg-gradient-to-br ${suite.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

                                        <div className="relative z-10">
                                            <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-neutral-800/50 p-3 ring-1 ring-white/10">
                                                <suite.icon className={`h-6 w-6 ${suite.color}`} />
                                            </div>
                                            <h3 className="text-xl font-semibold text-white mb-2">{suite.title}</h3>
                                            <p className="text-sm font-medium text-neutral-500 uppercase tracking-wider mb-4">{suite.description}</p>
                                            <p className="text-neutral-400 leading-relaxed">{suite.details}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section id="pricing" className="py-24 border-t border-white/5 bg-neutral-950">
                    <div className="container px-4 md:px-6">
                        <div className="text-center mb-20 space-y-4">
                            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Planos Flexíveis</h2>
                            <p className="text-neutral-400 text-lg">
                                Escalabilidade para escritórios de todos os tamanhos.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
                            {plans.map((plan, index) => (
                                <Card key={plan.name} className={`relative flex flex-col bg-neutral-900/20 border-white/5 backdrop-blur-sm ${plan.popular ? 'border-primary/50 shadow-2xl shadow-primary/10 scale-105 z-10 bg-neutral-900/40' : 'hover:border-white/10 transition-colors'}`}>
                                    {plan.popular && (
                                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg">
                                            Recomendado
                                        </div>
                                    )}
                                    <CardHeader>
                                        <CardTitle className="text-xl text-neutral-200">{plan.name}</CardTitle>
                                        <div className="text-4xl font-bold mt-2 text-white">{plan.price}</div>
                                        <CardDescription className="text-neutral-500">/mês por usuário</CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1">
                                        <ul className="space-y-4">
                                            {plan.features.map((feature) => (
                                                <li key={feature} className="flex items-center gap-3 text-sm text-neutral-300">
                                                    <div className="rounded-full bg-primary/20 p-1">
                                                        <CheckCircle2 className="h-3 w-3 text-primary shrink-0" />
                                                    </div>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <div className="p-6 pt-0">
                                        <Button className={`w-full rounded-full h-12 ${plan.popular ? 'bg-primary hover:bg-primary/90 text-white' : 'bg-white/5 hover:bg-white/10 text-white border-none'}`} variant={plan.variant} asChild>
                                            <Link href={plan.name === 'Enterprise' ? '#' : '/setup'}>{plan.cta}</Link>
                                        </Button>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    </div>
                </section>
            </main>

            <footer className="py-8 border-t border-white/5 bg-neutral-950">
                <div className="container flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-neutral-500">
                    <p>© 2026 Veritum PRO. Excellence in Legal Tech.</p>
                    <div className="flex gap-6">
                        <Link href="#" className="hover:text-white transition-colors">Termos</Link>
                        <Link href="#" className="hover:text-white transition-colors">Privacidade</Link>
                        <Link href="#" className="hover:text-white transition-colors">Contato</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}
