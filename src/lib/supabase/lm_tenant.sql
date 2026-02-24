-- ============================================================================
-- 2. SCRIPT TENANT (DO CLIENTE) - OPERAÇÃO, PROCESSOS E USUÁRIOS
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "vector";

-- 1. FUNÇÕES GLOBAIS
create or replace function handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

create or replace function match_knowledge (
    query_embedding vector(768),
    match_threshold float,
    match_count int
)
returns table (
    id uuid, title text, content text, category text, similarity float
)
language plpgsql as $$
begin
    return query
    select ka.id, ka.title, ka.content, ka.category, 1 - (ka.embedding <=> query_embedding) as similarity
    from public.knowledge_articles ka
    where 1 - (ka.embedding <=> query_embedding) > match_threshold
    order by ka.embedding <=> query_embedding
    limit match_count;
end;
$$;

-- 2. CONFIGURAÇÕES DO APLICATIVO LOCAL
create table if not exists public.app_settings (
    id uuid primary key default gen_random_uuid(),
    office_name text,
    whatsapp_api_url text,
    theme_color text,
    created_at timestamptz default now()
);

-- 3. PERMISSÕES E RBAC (Segurança Interna)
create table if not exists public.access_groups (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    admin_id uuid not null,
    created_at timestamptz default now(),
    unique(admin_id, name)
);

create table if not exists public.roles (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    access_group_id uuid references public.access_groups(id) on delete set null,
    admin_id uuid not null,
    created_at timestamptz default now(),
    unique(admin_id, name)
);

create table if not exists public.group_templates (
    id uuid primary key default gen_random_uuid(),
    name text not null unique,
    description text,
    default_features uuid[], -- Lista de UUIDs das features (em formato texto agora sem FK)
    created_at timestamptz default now()
);

create table if not exists public.group_permissions (
    id uuid primary key default gen_random_uuid(),
    group_id uuid references public.access_groups(id) on delete cascade,
    feature_id uuid, -- REMOVIDA A FK (Feature_id vem do banco Master)
    can_access boolean default true,
    created_at timestamptz default now(),
    unique(group_id, feature_id)
);

-- 4. USUÁRIOS E ASSINATURAS DO ESCRITÓRIO
create table if not exists public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    name text not null,
    username text unique not null,
    role text default 'Administrador',
    active boolean default true,
    avatar_url text,
    cpf_cnpj text,
    phone text,
    access_group_id uuid references public.access_groups(id) on delete set null,
    plan_id uuid, -- REMOVIDA A FK (O ID do Plano vem do banco Master via Front-end)
    parent_user_id uuid references public.users(id) on delete cascade,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.user_preferences (
    user_id uuid primary key references auth.users(id) on delete cascade,
    language text default 'pt' check (language in ('pt', 'en', 'es')),
    theme text default 'dark' check (theme in ('light', 'dark')),
    custom_supabase_url text,
    custom_supabase_key text,
    custom_gemini_key text,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.user_subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    plan_id uuid not null, -- REMOVIDA A FK
    start_date timestamptz default now(),
    end_date timestamptz,
    status text default 'active' check (status in ('active', 'expired', 'canceled')),
    is_trial boolean default false,
    created_at timestamptz default now()
);

create table if not exists public.team_members (
    id uuid primary key default gen_random_uuid(),
    full_name text not null,
    email text unique not null,
    phone text,
    role text,
    oab_number text,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 5. MÓDULOS OPERACIONAIS (NEXUS, SENTINEL, VALOREM, SCRIPTOR, COGNITIO)
create table if not exists public.persons (
    id uuid primary key default gen_random_uuid(),
    person_type text check (person_type in ('Cliente', 'Reclamado', 'Testemunha', 'Preposto', 'Advogado Adverso')),
    full_name text not null,
    document text unique not null,
    email text,
    phone text,
    rg text,
    legal_data jsonb,
    address jsonb,
    workspace_id uuid,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.lawsuits (
    id uuid primary key default gen_random_uuid(),
    cnj_number text unique not null,
    case_title text,
    author_id uuid references public.persons(id),
    defendant_id uuid references public.persons(id),
    responsible_lawyer_id uuid references public.users(id),
    status text check (status in ('Ativo', 'Suspenso', 'Arquivado', 'Encerrado')),
    sphere text,
    court text,
    chamber text,
    city text,
    state text,
    value numeric(15, 2),
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.tasks (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    description text,
    lawsuit_id uuid references public.lawsuits(id) on delete cascade,
    responsible_id uuid references public.users(id),
    status text check (status in ('A Fazer', 'Em Andamento', 'Concluído', 'Atrasado')) default 'A Fazer',
    priority text check (priority in ('Baixa', 'Média', 'Alta', 'Urgente')) default 'Média',
    due_date timestamptz not null,
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.monitoring_alerts (
    id uuid primary key default gen_random_uuid(),
    user_id uuid default auth.uid(),
    title text not null,
    term text not null,
    alert_type text check (alert_type in ('OAB', 'CNJ', 'Keyword', 'Company', 'Person')),
    is_active boolean default true,
    created_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.clippings (
    id uuid primary key default gen_random_uuid(),
    alert_id uuid references public.monitoring_alerts(id) on delete cascade,
    source text,
    content text not null,
    sentiment text check (sentiment in ('Positivo', 'Negativo', 'Neutro')),
    score float,
    url text,
    lawsuit_id uuid references public.lawsuits(id) on delete set null,
    captured_at timestamptz default now(),
    embedding vector(768)
);

create table if not exists public.chats (
    id uuid primary key default gen_random_uuid(),
    person_id uuid references public.persons(id) on delete cascade,
    lawsuit_id uuid references public.lawsuits(id) on delete set null,
    status text default 'Ativo',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.chat_messages (
    id uuid primary key default gen_random_uuid(),
    chat_id uuid references public.chats(id) on delete cascade,
    sender_id uuid default auth.uid(),
    sender_type text check (sender_type in ('Lawyer', 'Client', 'AI')) default 'Lawyer',
    content text not null,
    is_read boolean default false,
    created_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.knowledge_articles (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text not null,
    category text,
    tags text[],
    embedding vector(768),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);
create index if not exists idx_knowledge_embedding on public.knowledge_articles using hnsw (embedding vector_cosine_ops);

create table if not exists public.historical_outcomes (
    id uuid primary key default gen_random_uuid(),
    judge_name text,
    court text,
    case_type text,
    outcome text,
    created_at timestamptz default now()
);

create table if not exists public.golden_alerts (
    id uuid primary key default gen_random_uuid(),
    clipping_id uuid not null references public.clippings(id) on delete cascade,
    matched_knowledge_id uuid references public.knowledge_articles(id) on delete set null,
    matched_lawsuit_id uuid references public.lawsuits(id) on delete set null,
    match_score float not null,
    intelligence_type text check (intelligence_type in ('Opportunity', 'Risk', 'Similar Success')),
    priority text check (priority in ('High', 'Medium', 'Low')) default 'Medium',
    reasoning text,
    status text default 'unread' check (status in ('unread', 'dismissed', 'actioned')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.movements (
    id uuid primary key default gen_random_uuid(),
    lawsuit_id uuid references public.lawsuits(id) on delete cascade,
    original_text text,
    translated_text text,
    sentiment_score float,
    source text default 'Manual',
    is_notified boolean default false,
    created_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.document_templates (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    category text,
    base_prompt text not null,
    created_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.legal_documents (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    content text,
    lawsuit_id uuid references public.lawsuits(id) on delete set null,
    author_id uuid references public.users(id) on delete set null,
    template_id uuid references public.document_templates(id) on delete set null,
    version integer default 1,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

create table if not exists public.document_embeddings (
    id uuid primary key default gen_random_uuid(),
    lawsuit_id uuid references public.lawsuits(id) on delete cascade,
    filename text,
    content text,
    embedding vector(768),
    created_at timestamptz default now()
);
create index if not exists idx_doc_embeddings_vector on public.document_embeddings using hnsw (embedding vector_cosine_ops);

create table if not exists public.financial_records (
    id uuid primary key default gen_random_uuid(),
    lawsuit_id uuid references public.lawsuits(id) on delete set null,
    description text,
    type text check (type in ('fee', 'cost', 'settlement', 'honorarium')),
    amount numeric,
    due_date date,
    is_paid boolean default false,
    created_at timestamptz default now()
);

create table if not exists public.financial_transactions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid default auth.uid(),
    title text not null,
    amount numeric(12,2) not null,
    entry_type text check (entry_type in ('Credit', 'Debit')),
    category text,
    transaction_date timestamptz default now(),
    lawsuit_id uuid references public.lawsuits(id) on delete set null,
    person_id uuid references public.persons(id) on delete set null,
    status text check (status in ('Pago', 'Pendente', 'Cancelado')) default 'Pendente',
    created_at timestamptz default now(),
    updated_at timestamptz default now(),
    deleted_at timestamptz
);

create table if not exists public.audit_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid,
    action text, 
    table_name text,
    record_id uuid,
    old_data jsonb,
    new_data jsonb,
    created_at timestamptz default now()
);

-- 6. TRIGGERS ADAPTADOS PARA O TENANT (Sem consultar o DB Master)
create or replace function public.handle_new_user()
returns trigger as $$
declare
    default_role text := 'Administrador';
    user_role text;
    user_name text;
    user_plan_id uuid;
begin
    user_role := coalesce(new.raw_user_meta_data->>'role', default_role);
    user_name := coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', 'Usuário');
    user_plan_id := (new.raw_user_meta_data->>'plan_id')::uuid;

    insert into public.users (id, name, username, role, active, avatar_url, parent_user_id, plan_id, access_group_id)
    values (
        new.id, user_name, new.email, user_role, true,
        coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture'),
        (new.raw_user_meta_data->>'parent_user_id')::uuid,
        user_plan_id,
        (new.raw_user_meta_data->>'access_group_id')::uuid
    )
    on conflict (id) do update set
        role = excluded.role,
        name = excluded.name,
        plan_id = excluded.plan_id,
        access_group_id = excluded.access_group_id;

    if user_plan_id is not null then
        insert into public.user_subscriptions (user_id, plan_id, start_date, end_date, status, is_trial)
        values (
            new.id, user_plan_id, now(),
            case when (new.raw_user_meta_data->>'parent_user_id') is not null then null else now() + interval '14 days' end,
            'active',
            case when (new.raw_user_meta_data->>'parent_user_id') is not null then false else true end
        )
        on conflict do nothing;
    end if;

    insert into public.user_preferences (user_id, language, theme)
    values (new.id, 'pt', 'dark')
    on conflict (user_id) do nothing;

    return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create or replace function public.handle_updated_user()
returns trigger as $$
begin
    update auth.users
    set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
        'role', new.role, 'full_name', new.name, 'name', new.name,
        'parent_user_id', new.parent_user_id, 'active', new.active,
        'plan_id', new.plan_id, 'access_group_id', new.access_group_id
    )
    where id = new.id;

    if (old.active is distinct from new.active) then
        update public.users set active = new.active where parent_user_id = new.id;
    end if;

    return new;
end;
$$ language plpgsql security definer;

create trigger on_public_user_updated after update on public.users
for each row when (
    old.role is distinct from new.role or old.name is distinct from new.name or
    old.parent_user_id is distinct from new.parent_user_id or old.active is distinct from new.active
) execute function public.handle_updated_user();

-- Updated_at triggers genéricos
create trigger tr_users_updated before update on public.users for each row execute function handle_updated_at();
create trigger tr_user_prefs_updated before update on public.user_preferences for each row execute function handle_updated_at();
create trigger tr_persons_updated before update on public.persons for each row execute function handle_updated_at();
create trigger tr_lawsuits_updated before update on public.lawsuits for each row execute function handle_updated_at();
create trigger tr_tasks_updated before update on public.tasks for each row execute function handle_updated_at();
create trigger tr_legal_docs_updated before update on public.legal_documents for each row execute function handle_updated_at();
create trigger tr_financial_updated before update on public.financial_transactions for each row execute function handle_updated_at();
create trigger tr_golden_alerts_updated before update on public.golden_alerts for each row execute function handle_updated_at();
create trigger tr_knowledge_updated before update on public.knowledge_articles for each row execute function handle_updated_at();
create trigger tr_team_updated before update on public.team_members for each row execute function handle_updated_at();
create trigger tr_chats_updated before update on public.chats for each row execute function handle_updated_at();

-- 7. REALTIME PARA FRONT-END
alter publication supabase_realtime add table public.tasks;
alter publication supabase_realtime add table public.financial_transactions;
alter publication supabase_realtime add table public.movements;
alter publication supabase_realtime add table public.golden_alerts;
alter publication supabase_realtime add table public.clippings;

-- 8. CARGA INICIAL (SEED DATA) NO BANCO DO CLIENTE: GRUPOS E CARGOS
INSERT INTO "public"."group_templates" ("name", "description") VALUES
('Sócio-Administrador', 'Acesso total e irrestrito, incluindo configurações de workspace e faturamento.'),
('Advogado Sênior / Coordenador', 'Gestores operacionais, aprovação de peças e análise de risco, sem acesso ao financeiro/configurações.'),
('Advogado Associado / Júnior', 'A base operacional: cadastro, IA, processos e prazos, sem visão estratégica global.'),
('Estagiário / Paralegal', 'Foco em alimentar o sistema, cadastrar pessoas e anexar documentos, sem redigir com IA ou assinar.'),
('Departamento Financeiro / Faturamento', 'Foco total no Valorem PRO, caixa e emissão de boletos, isolado dos documentos jurídicos.'),
('Controladoria Jurídica (Legal Ops)', 'O cérebro das automações, prazos e relatórios de jurimetria.'),
('Secretariado / Recepção', 'A linha de frente: cadastro básico de clientes e atendimento via WhatsApp.'),
('Cliente (Acesso Externo B2B2C)', 'Acesso exclusivo ao Portal do Cliente para consulta de seus processos.');

DO $$
DECLARE
    master_id uuid;
BEGIN
    SELECT id INTO master_id FROM auth.users LIMIT 1;
    IF master_id IS NOT NULL THEN
        -- Cria Grupos de Acesso
        INSERT INTO "public"."access_groups" ("id", "name", "admin_id")
        SELECT gen_random_uuid(), name, master_id FROM "public"."group_templates";

        -- Vincula Cargos aos Grupos (Relação 1:N)
        INSERT INTO "public"."roles" (name, access_group_id, admin_id)
        SELECT unnest(ARRAY['Sócio Administrador', 'Sócio Fundador', 'Diretor Jurídico', 'Gestor Geral']), id, master_id
        FROM "public"."access_groups" WHERE name = 'Sócio-Administrador';

        INSERT INTO "public"."roles" (name, access_group_id, admin_id)
        SELECT unnest(ARRAY['Advogado Sênior', 'Coordenador Jurídico', 'Head de Área', 'Gestor Contencioso']), id, master_id
        FROM "public"."access_groups" WHERE name = 'Advogado Sênior / Coordenador';

        INSERT INTO "public"."roles" (name, access_group_id, admin_id)
        SELECT unnest(ARRAY['Advogado Associado', 'Advogado Júnior', 'Advogado Pleno', 'Advogado Trabalhista']), id, master_id
        FROM "public"."access_groups" WHERE name = 'Advogado Associado / Júnior';

        INSERT INTO "public"."roles" (name, access_group_id, admin_id)
        SELECT unnest(ARRAY['Estagiário', 'Paralegal', 'Assistente Jurídico', 'Auxiliar Administrativo']), id, master_id
        FROM "public"."access_groups" WHERE name = 'Estagiário / Paralegal';

        INSERT INTO "public"."roles" (name, access_group_id, admin_id)
        SELECT unnest(ARRAY['Gerente Financeiro', 'Analista Financeiro', 'Assistente de Faturamento', 'Auxiliar de Cobrança']), id, master_id
        FROM "public"."access_groups" WHERE name = 'Departamento Financeiro / Faturamento';

        INSERT INTO "public"."roles" (name, access_group_id, admin_id)
        SELECT unnest(ARRAY['Controller Jurídico', 'Analista de Legal Ops', 'Analista de Dados Jurídicos', 'Engenheiro Jurídico']), id, master_id
        FROM "public"."access_groups" WHERE name = 'Controladoria Jurídica (Legal Ops)';

        INSERT INTO "public"."roles" (name, access_group_id, admin_id)
        SELECT unnest(ARRAY['Secretária Executiva', 'Recepcionista', 'Assistente de Atendimento', 'Telefonista']), id, master_id
        FROM "public"."access_groups" WHERE name = 'Secretariado / Recepção';

        INSERT INTO "public"."roles" (name, access_group_id, admin_id)
        SELECT unnest(ARRAY['Cliente (Pessoa Física)', 'Representante Legal (Empresa)']), id, master_id
        FROM "public"."access_groups" WHERE name = 'Cliente (Acesso Externo B2B2C)';
    END IF;
END $$;

-- ============================================================================
-- Caso tenha script de carga inicial de dados, insira aqui
-- ============================================================================

