
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
    CLOUD_PLANS = 'cloud_plans',
    DASHBOARD_SUITES = 'dashboard_suites',
    DASHBOARD_ADMIN = 'dashboard_admin',
    DASHBOARD_MASTER = 'dashboard_master',
    DASHBOARD_ROOT = 'dashboard_root',
    SCHEDULING = 'scheduling',
    EMAIL_CONFIG = 'email_config',
    INFRA = 'infra',
    ACCESS_GROUPS = 'access_groups',
    PERSONS = 'persons',
    FINTECH = 'fintech',
    CLOUD_CONFIG = 'cloud_config',
    VIP_MANAGEMENT = 'vip_management'
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

export interface CloudPlan {
    id: string;
    code_name: string;
    name: { pt: string; en: string; es: string };
    badge: { pt: string; en: string; es: string };
    subtitle: { pt: string; en: string; es: string };
    price_monthly: number;
    discounts: { monthly?: number; quarterly: number; semiannual: number; yearly: number };
    credits: { pt: string; en: string; es: string };
    need_more: { pt: string; en: string; es: string };
    features_title: { pt: string; en: string; es: string };
    features: { category: string; text: string; isSub: boolean }[];
    is_active: boolean;
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
    dbConnectionString?: string; // For Drizzle/Postgres/Oracle/etc
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
    cloud_plan_id?: string;
    cloud_start_date?: string;
    cloud_end_date?: string;
    cloud_status?: 'active' | 'expired' | 'canceled';
    access_group_id?: string;
    access_group_name?: string;
    translated_group_name?: string;
    plan_name?: string;
    oab_number?: string;
    vip_active?: boolean;
    vip_points?: number;
    vip_code?: string;
    billing_cycle?: string;
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
    rito?: string;
    value: number;
}

export interface LawsuitDocument {
    id: string;
    lawsuit_id: string;
    title: string;
    document_type: string;
    file_url?: string;
    event_date?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface AssetDocument {
    id: string;
    asset_id: string;
    title: string;
    document_type: string;
    file_url?: string;
    event_date?: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Person {
    id: string;
    person_type: 'Cliente' | 'Reclamado' | 'Testemunha' | 'Preposto' | 'Advogado Adverso';
    full_name: string;
    document: string;
    email?: string;
    phone?: string;
    rg?: string;
    ctps?: string;
    pis?: string;
    legal_data?: {
        marital_status?: string;
        profession?: string;
        nationality?: string;
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

export interface CalendarEvent {
    id: string;
    title: string;
    description?: string;
    event_type: 'Audiência' | 'Reunião' | 'Despacho' | 'Diligência' | 'Outro';
    start_date: string;
    end_date?: string;
    location?: string;
    meeting_url?: string;
    lawsuit_id?: string;
    responsible_id?: string;
    created_at?: string;
    updated_at?: string;
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
    document_type?: string;
    file_url?: string;
    event_date?: string;
    notes?: string;
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

export interface TeamMember {
    id: string;
    full_name: string;
    cpf?: string;
    email: string;
    phone?: string;
    role?: string;
    specialty?: string;
    oab_number?: string;
    oab_uf?: string;
    city?: string;
    state?: string;
    pix_key?: string;
    notes?: string;
    is_active: boolean;
    workspace_id?: string;
    master_user_id?: string;
    created_at?: string;
    updated_at?: string;
}

export type AssetType = 'Imóvel' | 'Veículo' | 'Conta Bancária' | 'Ação Judicial' | 'Empresa / Quotas' | 'Outros';

export interface Asset {
    id: string;
    title: string;
    description?: string;
    asset_type: AssetType;
    value?: number;
    registration_number?: string; // Matrícula, Renavam, CNPJ, etc.
    person_id?: string;
    lawsuit_id?: string;
    status: 'Ativo' | 'Bloqueado' | 'Vendido' | 'Em Garantia' | 'Alienado';
    created_at?: string;
    updated_at?: string;
}

// 🏢 Corporate / Societário Module Types
export type EntityType = 'LTDA' | 'SA' | 'EIRELI' | 'MEI' | 'Holding' | 'Associação' | 'Outros';
export type EntityStatus = 'Ativa' | 'Baixada' | 'Inativa' | 'Em Liquidação';
export type TaxRegime = 'Simples Nacional' | 'Lucro Presumido' | 'Lucro Real' | 'Isenta';
export type ShareType = 'Ordinária' | 'Preferencial' | 'Quotas';
export type CorpDocType = 'Ata' | 'Estatuto' | 'Contrato Social' | 'Alteração Contratual' | 'Procuração' | 'Outros';

export interface CorporateEntity {
    id: string;
    legal_name: string;
    trading_name?: string;
    cnpj?: string;
    state_registration?: string;
    municipal_registration?: string;
    foundation_date?: string;
    entity_type: EntityType;
    status: EntityStatus;
    tax_regime?: TaxRegime;
    address?: {
        cep?: string;
        street?: string;
        number?: string;
        complement?: string;
        neighborhood?: string;
        city?: string;
        state?: string;
    };
    total_capital?: number;
    total_shares?: number;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Shareholder {
    id: string;
    entity_id: string;
    person_shareholder_id?: string;
    corporate_shareholder_id?: string;
    share_type: ShareType;
    shares_count: number;
    ownership_percentage?: number;
    capital_contribution?: number;
    position?: string;
    start_date?: string;
    end_date?: string;
    is_admin: boolean;
    created_at?: string;
    updated_at?: string;
    // Helper fields for UI
    shareholder_name?: string; 
    shareholder_type?: 'Person' | 'Entity';
}

export interface CorporateDocument {
    id: string;
    entity_id: string;
    title: string;
    document_type: CorpDocType;
    event_date?: string;
    expiry_date?: string;
    file_url?: string;
    status: string;
    notes?: string;
    created_at?: string;
    updated_at?: string;
}
