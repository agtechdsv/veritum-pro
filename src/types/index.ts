
export enum ModuleId {
    ONBOARDING = 'onboarding',
    SENTINEL = 'sentinel',
    NEXUS = 'nexus',
    SCRIPTOR = 'scriptor',
    VALOREM = 'valorem',
    COGNITIO = 'cognitio',
    VOX = 'vox',
    SETTINGS = 'settings',
    USERS = 'users'
}

export interface Credentials {
    supabaseUrl: string;
    supabaseAnonKey: string;
    geminiKey: string;
}

export interface User {
    id: string;
    name: string;
    username: string;
    role: 'Master' | 'Administrador' | 'Operador';
    active: boolean;
    avatar_url?: string;
    cpf_cnpj?: string;
    phone?: string;
    parent_user_id?: string;
}

export interface UserPreferences {
    user_id: string;
    language: 'pt' | 'en' | 'es';
    theme: 'light' | 'dark';
    custom_supabase_url?: string;
    custom_supabase_key?: string;
    custom_gemini_key?: string;
}

export interface Lawsuit {
    id: string;
    cnj_number: string;
    client_name: string;
    status: 'Draft' | 'Active' | 'Closed' | 'Archived';
    value: number;
}
