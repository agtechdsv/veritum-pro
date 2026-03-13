import { SupabaseClient } from '@supabase/supabase-js';
import { ITeamRepository } from './team-repository.interface';
import { TeamMember } from '@/types';

export class SupabaseTeamRepository implements ITeamRepository {
    constructor(private client: SupabaseClient) { }

    async list(workspaceId?: string): Promise<TeamMember[]> {
        const { data, error } = await this.client
            .from('team_members')
            .select('*')
            .is('deleted_at', null)
            .order('full_name');

        if (error) throw error;

        // Se o banco for novo e tiver a coluna, filtramos. 
        // Se for antigo ou dedicado (sem a coluna), retornamos tudo o que está nele.
        if (workspaceId && data && data.length > 0 && 'workspace_id' in (data[0] as any)) {
            const filtered = (data as any[]).filter(m => m.workspace_id === workspaceId);
            // Se o filtro resultou em nada mas temos dados, pode ser que os dados antigos não tenham workspace_id
            // Nesse caso, retornamos tudo para não "sumir" com os dados do cliente
            return filtered.length > 0 ? filtered : data;
        }

        return data as TeamMember[];
    }

    async getById(id: string): Promise<TeamMember | null> {
        const { data, error } = await this.client
            .from('team_members')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) return null;
        return data as TeamMember;
    }

    async create(data: Omit<TeamMember, 'id' | 'created_at' | 'updated_at'>): Promise<TeamMember> {
        // Remove undefined values to prevent Supabase errors
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        const { data: result, error } = await this.client
            .from('team_members')
            .insert(cleanData)
            .select()
            .maybeSingle();

        if (error) throw error;
        return result as TeamMember;
    }

    async update(id: string, data: Partial<TeamMember>): Promise<TeamMember> {
        // Remove undefined values to prevent Supabase errors
        const cleanData = Object.fromEntries(
            Object.entries(data).filter(([_, v]) => v !== undefined)
        );

        const { data: result, error } = await this.client
            .from('team_members')
            .update({ ...cleanData, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select()
            .maybeSingle();

        if (error) throw error;
        return result as TeamMember;
    }

    async delete(id: string): Promise<boolean> {
        const { error } = await this.client
            .from('team_members')
            .update({ deleted_at: new Date().toISOString(), is_active: false })
            .eq('id', id);

        if (error) throw error;
        return true;
    }
}
