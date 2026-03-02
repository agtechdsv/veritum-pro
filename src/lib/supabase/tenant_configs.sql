
-- Tabela de Configurações de Inquilino (Tenant Registry)
-- Esta tabela armazena as chaves de conexão BYODB de forma centralizada.

CREATE TABLE IF NOT EXISTS public.tenant_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID REFERENCES auth.users(id) NOT NULL,
    db_provider TEXT DEFAULT 'postgres' CHECK (db_provider IN ('postgres', 'oracle', 'mssql', 'mysql', 'supabase')),
    db_connection_encrypted TEXT, -- String de conexão criptografada (AES-256)
    custom_supabase_url TEXT,
    custom_supabase_key_encrypted TEXT, -- Chave Supabase criptografada
    custom_gemini_key_encrypted TEXT,   -- Chave Gemini criptografada
    migration_mode TEXT DEFAULT 'auto' CHECK (migration_mode IN ('auto', 'manual')),
    is_active BOOLEAN DEFAULT true,
    health_status TEXT DEFAULT 'up',
    last_health_check TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT one_config_per_owner UNIQUE (owner_id)
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.tenant_configs ENABLE ROW LEVEL SECURITY;

-- Política: Usuários podem ver/editar apenas sua própria configuração
CREATE POLICY "Users can manage their own tenant config"
    ON public.tenant_configs
    FOR ALL
    USING (auth.uid() = owner_id);

-- Gatilho para atualizar o updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenant_configs_updated_at
    BEFORE UPDATE ON public.tenant_configs
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
