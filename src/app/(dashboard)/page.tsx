import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import { ShieldAlert, KanbanSquare, FileText, DollarSign, BarChart3, MessageSquareText } from "lucide-react"

const tools = [
    {
        label: 'Sentinel Pro',
        icon: ShieldAlert,
        href: '/sentinel',
        color: 'text-violet-500',
        bgColor: 'bg-violet-500/10',
        desc: 'Monitoramento de distribuição de processos e clipping de mídia.'
    },
    {
        label: 'Nexus Pro',
        icon: KanbanSquare,
        href: '/nexus',
        color: 'text-pink-700',
        bgColor: 'bg-pink-700/10',
        desc: 'Gestão de workflow, kanban de processos e agenda.'
    },
    {
        label: 'Scriptor Pro',
        icon: FileText,
        href: '/scriptor',
        color: 'text-orange-700',
        bgColor: 'bg-orange-700/10',
        desc: 'Editor com Inteligência Artificial e geração de documentos.'
    },
    {
        label: 'Valorem Pro',
        icon: DollarSign,
        href: '/valorem',
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/10',
        desc: 'Gestão financeira, honorários e cálculos judiciais.'
    },
    {
        label: 'Cognitio Pro',
        icon: BarChart3,
        href: '/cognitio',
        color: 'text-green-700',
        bgColor: 'bg-green-700/10',
        desc: 'Jurimetria avançada e análise preditiva de sentenças.'
    },
    {
        label: 'Vox Clientis',
        icon: MessageSquareText,
        href: '/vox',
        color: 'text-blue-700',
        bgColor: 'bg-blue-700/10',
        desc: 'Portal do cliente e tradução de juridiquês automatizada.'
    },
]

export default function DashboardPage() {
    return (
        <div className="p-8">
            <div className="mb-8 space-y-4">
                <h2 className="text-2xl md:text-4xl font-bold text-center">
                    Ecossistema Veritum Pro
                </h2>
                <p className="text-muted-foreground font-light text-sm md:text-lg text-center">
                    Selecione uma suíte para começar a trabalhar.
                </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {tools.map((tool) => (
                    <Card key={tool.href} className="p-4 border-black/5 flex flex-col items-center justify-between hover:shadow-md transition cursor-pointer">
                        <div className="flex items-center gap-x-4 mb-4">
                            <div className={`p-2 w-fit rounded-md ${tool.bgColor}`}>
                                <tool.icon className={`w-8 h-8 ${tool.color}`} />
                            </div>
                            <div className="font-semibold text-lg">
                                {tool.label}
                            </div>
                        </div>
                        <p className="text-zinc-500 text-sm text-center">
                            {tool.desc}
                        </p>
                    </Card>
                ))}
            </div>
        </div>
    )
}
