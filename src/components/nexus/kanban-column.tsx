'use client'

import { useDroppable } from '@dnd-kit/core'
import { KanbanCard } from './kanban-card'
import { Lawsuit } from '@/types/nexus'
import { cn } from '@/lib/utils'

interface KanbanColumnProps {
    id: string
    title: string
    cards: Lawsuit[]
}

export function KanbanColumn({ id, title, cards }: KanbanColumnProps) {
    const { setNodeRef } = useDroppable({
        id: id,
    })

    return (
        <div className="flex flex-col h-full w-80 shrink-0">
            <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                    {title}
                </h3>
                <span className="text-xs bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                    {cards.length}
                </span>
            </div>

            <div
                ref={setNodeRef}
                className={cn(
                    "flex-1 bg-muted/50 rounded-lg p-2 overflow-y-auto min-h-[500px]",
                )}
            >
                {cards.map((card) => (
                    <KanbanCard key={card.id} lawsuit={card} />
                ))}
                {cards.length === 0 && (
                    <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground italic opacity-50">
                        Arraste um item aqui
                    </div>
                )}
            </div>
        </div>
    )
}
