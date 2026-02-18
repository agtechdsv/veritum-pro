'use client'

import { useState } from 'react'
import {
    DndContext,
    DragOverlay,
    useSensor,
    useSensors,
    PointerSensor,
    DragStartEvent,
    DragEndEvent,
    defaultDropAnimationSideEffects,
    DropAnimation
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'

import { KanbanColumn } from './kanban-column'
import { KanbanCard } from './kanban-card'
import { Lawsuit, KANBAN_COLUMNS, LawsuitStatus } from '@/types/nexus'
import { updateLawsuitStatus } from '@/app/(dashboard)/nexus/actions'

interface KanbanBoardProps {
    initialData: Lawsuit[]
}

const dropAnimation: DropAnimation = {
    sideEffects: defaultDropAnimationSideEffects({
        styles: {
            active: {
                opacity: '0.5',
            },
        },
    }),
}

export function KanbanBoard({ initialData }: KanbanBoardProps) {
    const [items, setItems] = useState<Lawsuit[]>(initialData)
    const [activeId, setActiveId] = useState<string | null>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        })
    )

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string)
    }

    async function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveId(null)

        if (!over) return

        const activeId = active.id as string
        const overId = over.id as string // This will be column ID or card ID

        // Find the item
        const activeItem = items.find(i => i.id === activeId)
        if (!activeItem) return

        // Check if dropped on a column
        let newStatus: LawsuitStatus | null = null

        // If dropped on a column (the overId matches a column ID)
        if (KANBAN_COLUMNS.some(col => col.id === overId)) {
            newStatus = overId as LawsuitStatus
        } else {
            // Dropped on another card? Find that card's status
            const overItem = items.find(i => i.id === overId)
            if (overItem) {
                newStatus = overItem.status
            }
        }

        if (newStatus && newStatus !== activeItem.status) {
            // Optimistic update
            setItems(prev => prev.map(item =>
                item.id === activeId ? { ...item, status: newStatus as LawsuitStatus } : item
            ))

            // Sever action
            await updateLawsuitStatus(activeId, newStatus)
        }
    }

    const activeItem = activeId ? items.find(i => i.id === activeId) : null

    return (
        <DndContext
            sensors={sensors}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="flex h-full gap-4 overflow-x-auto pb-4">
                {KANBAN_COLUMNS.map((col) => (
                    <KanbanColumn
                        key={col.id}
                        id={col.id}
                        title={col.title}
                        cards={items.filter((item) => item.status === col.id)}
                    />
                ))}
            </div>

            <DragOverlay dropAnimation={dropAnimation}>
                {activeItem ? <KanbanCard lawsuit={activeItem} /> : null}
            </DragOverlay>
        </DndContext>
    )
}
