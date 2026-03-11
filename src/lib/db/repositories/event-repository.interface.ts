import { CalendarEvent } from '@/types';

export interface IEventRepository {
    list(searchTerm?: string): Promise<CalendarEvent[]>;
    findById(id: string): Promise<CalendarEvent | null>;
    save(event: Partial<CalendarEvent>): Promise<CalendarEvent>;
    delete(id: string): Promise<void>;
}
