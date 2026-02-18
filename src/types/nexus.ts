export type LawsuitStatus = 'prospect' | 'active' | 'waiting' | 'done' | 'archived'

export interface Lawsuit {
    id: string
    cnj_number: string
    client_name: string
    case_title: string
    status: LawsuitStatus
    value: number
    court?: string
    priority?: 'low' | 'medium' | 'high'
    next_deadline?: string
}

export type KanbanColumn = {
    id: LawsuitStatus
    title: string
    cards: Lawsuit[]
}

export const KANBAN_COLUMNS: { id: LawsuitStatus; title: string }[] = [
    { id: 'prospect', title: 'Prospecção / Entrada' },
    { id: 'active', title: 'Em Andamento' },
    { id: 'waiting', title: 'Aguardando Prazos' },
    { id: 'done', title: 'Finalizado / Arquivado' },
]
