import { KanbanBoard } from '@/components/nexus/kanban-board'
import { getLawsuits } from './actions'
import { CreateLawsuitSheet } from '@/components/nexus/create-lawsuit-sheet'

export default async function NexusPage() {
    const lawsuits = await getLawsuits()

    return (
        <div className="flex flex-col h-full p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-pink-700">Nexus Pro</h1>
                    <p className="text-muted-foreground">Gestão de Processos e Workflow</p>
                </div>
                <CreateLawsuitSheet />
            </div>

            <div className="flex-1 overflow-hidden">
                <KanbanBoard initialData={lawsuits} />
            </div>
        </div>
    )
}
