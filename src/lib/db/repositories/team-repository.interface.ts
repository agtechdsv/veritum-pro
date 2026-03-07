import { TeamMember } from '@/types';

export interface ITeamRepository {
    list(workspaceId?: string): Promise<TeamMember[]>;
    getById(id: string): Promise<TeamMember | null>;
    create(data: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember>;
    update(id: string, data: Partial<TeamMember>): Promise<TeamMember>;
    delete(id: string): Promise<boolean>;
}
