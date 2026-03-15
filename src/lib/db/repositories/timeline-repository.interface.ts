import { TimelineEntry } from '@/types';

export interface ITimelineRepository {
    list(entityType: string, entityId: string): Promise<TimelineEntry[]>;
    save(entry: Partial<TimelineEntry>): Promise<TimelineEntry>;
}
