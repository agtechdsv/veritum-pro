
export enum ModuleId {
    ONBOARDING = 'onboarding',
    SENTINEL = 'sentinel',
    NEXUS = 'nexus',
    SCRIPTOR = 'scriptor',
    VALOREM = 'valorem',
    COGNITIO = 'cognitio',
    VOX = 'vox',
    INTELLIGENCE = 'intelligence',
    SETTINGS = 'settings',
    USERS = 'users',
    SUITES = 'suites',
    PLANS = 'plans',
    DASHBOARD_SUITES = 'dashboard_suites',
    DASHBOARD_ADMIN = 'dashboard_admin',
    DASHBOARD_MASTER = 'dashboard_master',
    DASHBOARD_ROOT = 'dashboard_root',
    SCHEDULING = 'scheduling',
    EMAIL_CONFIG = 'email_config',
    INFRA = 'infra',
    ACCESS_GROUPS = 'access_groups',
    PERSONS = 'persons',
    FINTECH = 'fintech'
}

export interface AsaasSubAccount {
    id: string;
    admin_id: string;
    asaas_id: string;
    api_key: string;
    wallet_id?: string;
    account_type: 'product' | 'user';
    branding_name: string;
    status: string;
    created_at?: string;
    updated_at?: string;
}

export interface AccessGroup {
    id: string;
    name: {
        pt: string;
        en: string;
        es: string;
    };
    admin_id: string;
    created_at?: string;
}

export interface GroupPermission {
    id: string;
    group_id: string;
    feature_id: string;
    can_access: boolean;
    created_at?: string;
}

export interface GroupTemplate {
    id: string;
    name: {
        pt: string;
        en: string;
        es: string;
    };
    description: {
        pt: string;
        en: string;
        es: string;
    };
    default_features: string[]; // Array of feature IDs
    created_at?: string;
}

export interface Plan {
    id: string;
    name: {
        en: string;
        es: string;
        pt: string;
    };
    short_desc: {
        en: string;
        es: string;
        pt: string;
    };
    monthly_price: number;
    monthly_discount: number;
    quarterly_discount: number;
    semiannual_discount: number;
    yearly_discount: number;
    yearly_price: number;
    installments: number;
    yearly_cash_discount: number;
    features: {
        en: string[];
        es: string[];
        pt: string[];
    };
    recommended: boolean;
    active: boolean;
    order_index: number;
    created_at?: string;
    is_combo: boolean;
    permissions?: PlanPermission[];
}

export interface Feature {
    id: string;
    feature_key: string;
    suite_id: string;
    display_name: {
        pt: string;
        en: string;
        es: string;
    };
    description: {
        pt: string;
        en: string;
        es: string;
    } | null;
    created_at?: string;
}

export interface PlanPermission {
    id: string;
    plan_id: string;
    feature_id: string;
    created_at?: string;
}

export interface Credentials {
    supabaseUrl: string;
    supabaseAnonKey: string;
    geminiKey: string;
}

export type UserRole = 'Master' | 'Administrador' | 'Sócio-Administrador' | 'Sócio Administrador' | 'Operador' |
    'Advogado Sênior / Coordenador' | 'Advogado Associado / Júnior' | 'Estagiário / Paralegal' |
    'Departamento Financeiro / Faturamento' | 'Cliente (Acesso Externo B2B2C)' |
    'Controladoria Jurídica (Legal Ops)' | 'Secretariado / Recepção';

export interface User {
    id: string;
    name: string;
    role: UserRole;
    active: boolean;
    avatar_url?: string;
    email?: string;
    cpf_cnpj?: string;
    phone?: string;
    parent_user_id?: string;
    plan_id?: string;
    access_group_id?: string;
    access_group_name?: string;
    translated_group_name?: string;
    plan_name?: string;
    oab_number?: string;
}

export interface Role {
    id: string;
    name: {
        pt: string;
        en: string;
        es: string;
    };
    access_group_id: string;
    admin_id: string;
}

export interface UserPreferences {
    user_id: string;
    language: 'pt' | 'en' | 'es';
    theme: 'light' | 'dark' | 'system';
    custom_supabase_url?: string;
    custom_supabase_key?: string;
    custom_gemini_key?: string;
}

export type DbProvider = 'postgres' | 'oracle' | 'mssql' | 'mysql' | 'supabase';

export interface TenantConfig {
    id: string;
    owner_id: string;
    db_provider: DbProvider;
    db_connection_encrypted?: string;
    custom_supabase_url?: string;
    custom_supabase_key_encrypted?: string;
    custom_gemini_key_encrypted?: string;
    migration_mode: 'auto' | 'manual';
    is_active: boolean;
    health_status?: 'up' | 'down' | 'maintenance';
    last_health_check?: string;
    created_at?: string;
}

export interface Suite {
    id: string;
    suite_key: string;
    name: {
        pt: string;
        en: string;
        es: string;
    };
    short_desc: {
        en: string;
        es: string;
        pt: string;
    };
    detailed_desc: {
        en: string;
        es: string;
        pt: string;
    };
    features: {
        en: string[];
        es: string[];
        pt: string[];
    };
    icon_svg: string;
    active: boolean;
    order_index: number;
    created_at?: string;
}

export interface Lawsuit {
    id: string;
    cnj_number: string;
    case_title?: string;
    author_id?: string;
    defendant_id?: string;
    responsible_lawyer_id?: string;
    status: 'Ativo' | 'Suspenso' | 'Arquivado' | 'Encerrado';
    sphere?: string;
    court?: string;
    chamber?: string;
    city?: string;
    state?: string;
    value: number;
}


export interface Person {
    id: string;
    person_type: 'Cliente' | 'Reclamado' | 'Testemunha' | 'Preposto' | 'Advogado Adverso';
    full_name: string;
    document: string;
    email?: string;
    phone?: string;
    rg?: string;
    legal_data?: {
        marital_status?: string;
        profession?: string;
        ctps?: string;
        pis?: string;
        history?: string;
    };
    address?: {
        cep?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
    };
    workspace_id?: string;
}

export interface Task {
    id: string;
    title: string;
    description?: string;
    lawsuit_id?: string;
    responsible_id?: string;
    status: 'A Fazer' | 'Em Andamento' | 'Concluído' | 'Atrasado';
    priority: 'Baixa' | 'Média' | 'Alta' | 'Urgente';
    due_date: string;
}

export interface MonitoringAlert {
    id: string;
    user_id?: string;
    title: string;
    term: string;
    alert_type: 'OAB' | 'CNJ' | 'Keyword' | 'Company' | 'Person';
    is_active: boolean;
    created_at?: string;
}

export interface Clipping {
    id: string;
    alert_id: string;
    source?: string;
    content: string;
    sentiment: 'Positivo' | 'Negativo' | 'Neutro';
    score?: number;
    url?: string;
    lawsuit_id?: string;
    captured_at?: string;
}

export interface DocumentTemplate {
    id: string;
    title: string;
    category?: string;
    base_prompt: string;
    created_at?: string;
}

export interface LegalDocument {
    id: string;
    title: string;
    content?: string;
    lawsuit_id?: string;
    author_id?: string;
    template_id?: string;
    version: number;
    created_at?: string;
    updated_at?: string;
}

export interface FinancialTransaction {
    id: string;
    user_id?: string;
    title: string;
    amount: number;
    entry_type: 'Credit' | 'Debit';
    category?: string;
    transaction_date: string;
    lawsuit_id?: string;
    person_id?: string;
    status: 'Pago' | 'Pendente' | 'Cancelado';
    created_at?: string;
}

export interface KnowledgeArticle {
    id: string;
    title: string;
    content: string;
    category?: string;
    tags?: string[];
    author_id?: string;
    created_at?: string;
}

export interface HistoricalOutcome {
    id: string;
    judge_name?: string;
    court?: string;
    case_type?: string;
    outcome: 'Procedente' | 'Parcialmente Procedente' | 'Improcedente';
    decision_date?: string;
}

export interface Chat {
    id: string;
    person_id: string;
    lawsuit_id?: string;
    status: 'Aberto' | 'Encerrado' | 'Arquivado';
    created_at?: string;
    updated_at?: string;
}

export interface ChatMessage {
    id: string;
    chat_id: string;
    sender_id?: string;
    sender_type: 'Lawyer' | 'Client' | 'AI';
    content: string;
    is_read: boolean;
    created_at?: string;
}
export interface GoldenAlert {
    id: string;
    clipping_id: string;
    matched_knowledge_id?: string;
    matched_lawsuit_id?: string;
    match_score: number;
    intelligence_type: 'Opportunity' | 'Risk' | 'Similar Success';
    priority?: 'High' | 'Medium' | 'Low';
    reasoning?: string;
    status: 'unread' | 'dismissed' | 'actioned';
    created_at?: string;
    updated_at?: string;
}

export interface Organization {
    id: string;
    admin_id: string;
    company_name: string;
    trading_name?: string;
    cnpj?: string;
    email?: string;
    phone?: string;
    website?: string;
    address_zip?: string;
    address_street?: string;
    address_number?: string;
    address_complement?: string;
    address_neighborhood?: string;
    address_city?: string;
    address_state?: string;
    logo_url?: string;
    created_at?: string;
    updated_at?: string;
}
