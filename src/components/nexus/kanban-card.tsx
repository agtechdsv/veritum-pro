'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Lawsuit } from '@/types/nexus'
import { GripVertical } from 'lucide-react'

interface KanbanCardProps {
    lawsuit: Lawsuit
}

export function KanbanCard({ lawsuit }: KanbanCardProps) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: lawsuit.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    }

    return (
        <Card
            ref={setNodeRef}
            style={style}
            className="mb-2 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow bg-card"
        >
            <CardHeader className="p-3 pb-0 flex flex-row items-start justify-between space-y-0">
                <CardTitle className="text-sm font-semibold truncate leading-tight w-full pr-2">
                    {lawsuit.client_name}
                </CardTitle>
                <button {...attributes} {...listeners} className="text-muted-foreground hover:text-foreground cursor-grab">
                    <GripVertical className="h-4 w-4" />
                </button>
            </CardHeader>
            <CardContent className="p-3 pt-2">
                <p className="text-xs text-muted-foreground mb-1 font-mono">
                    {lawsuit.cnj_number}
                </p>
                <p className="text-xs line-clamp-2 mb-2 font-medium">
                    {lawsuit.case_title}
                </p>
                <div className="flex items-center justify-between text-xs mt-2">
                    <span className="bg-secondary px-2 py-0.5 rounded text-secondary-foreground font-semibold">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(lawsuit.value))}
                    </span>
                </div>
            </CardContent>
        </Card>
    )
}
