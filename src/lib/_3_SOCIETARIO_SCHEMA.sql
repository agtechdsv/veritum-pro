
-- ============================================================================
-- 10. MÓDULO CORPORATE / SOCIETÁRIO (GOVERNANÇA & ESTRUTURAS)
-- ============================================================================

-- Entidades Jurídicas (Empresas do Grupo Econômico do Cliente)
CREATE TABLE public.corporate_entities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    legal_name TEXT NOT NULL,          -- Razão Social
    trading_name TEXT,                 -- Nome Fantasia
    cnpj TEXT UNIQUE,                  -- CNPJ
    state_registration TEXT,           -- Inscrição Estadual
    municipal_registration TEXT,        -- Inscrição Municipal
    foundation_date DATE,
    entity_type TEXT CHECK (entity_type IN ('LTDA', 'SA', 'EIRELI', 'MEI', 'Holding', 'Associação', 'Outros')) DEFAULT 'LTDA',
    status TEXT CHECK (status IN ('Ativa', 'Baixada', 'Inativa', 'Em Liquidação')) DEFAULT 'Ativa',
    tax_regime TEXT CHECK (tax_regime IN ('Simples Nacional', 'Lucro Presumido', 'Lucro Real', 'Isenta')),
    
    -- Dados de Sede
    address JSONB, -- {cep, street, number, complement, neighborhood, city, state}
    
    -- Controle de Capital
    total_capital NUMERIC(15, 2) DEFAULT 0,
    total_shares NUMERIC(15, 2) DEFAULT 0, -- Total de quotas ou ações
    
    -- Metadados
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    deleted_at TIMESTAMPTZ
);

-- Quadro Societário (QSA) - Faz a ponte entre Entidades, Pessoas e outras Entidades
CREATE TABLE public.corporate_shareholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.corporate_entities(id) ON DELETE CASCADE,
    
    -- O sócio pode ser uma Pessoa (da tabela persons) ou outra Empresa (da corporate_entities)
    person_shareholder_id UUID REFERENCES public.persons(id),
    corporate_shareholder_id UUID REFERENCES public.corporate_entities(id),
    
    share_type TEXT CHECK (share_type IN ('Ordinária', 'Preferencial', 'Quotas')) DEFAULT 'Quotas',
    shares_count NUMERIC(15, 2) DEFAULT 0,
    ownership_percentage NUMERIC(5, 2), -- Ex: 50.00
    capital_contribution NUMERIC(15, 2) DEFAULT 0,
    
    position TEXT,                     -- Cargo (ex: Diretor, Sócio-Administrador, Conselheiro)
    start_date DATE,
    end_date DATE,
    is_admin BOOLEAN DEFAULT FALSE,    -- Se tem poderes de administração
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Garante que um sócio (pessoa ou empresa) não seja duplicado na mesma entidade
    CONSTRAINT ck_shareholder_type CHECK (
        (person_shareholder_id IS NOT NULL AND corporate_shareholder_id IS NULL) OR
        (person_shareholder_id IS NULL AND corporate_shareholder_id IS NOT NULL)
    )
);

-- Livros e Atas (Gestão de Documentos Societários)
CREATE TABLE public.corporate_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_id UUID NOT NULL REFERENCES public.corporate_entities(id) ON DELETE CASCADE,
    title TEXT NOT NULL,               -- Ex: Ata de Assembléia Geral Ordinária
    document_type TEXT CHECK (document_type IN ('Ata', 'Estatuto', 'Contrato Social', 'Alteração Contratual', 'Procuração', 'Outros')),
    event_date DATE,                   -- Data da reunião/evento
    expiry_date DATE,                  -- Data de vencimento (ex: validade do mandato)
    file_url TEXT,                     -- Link para o storage
    status TEXT DEFAULT 'Vigente',
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9.2 Triggers e Segurança para o novo módulo
CREATE TRIGGER tr_corp_ent_upd BEFORE UPDATE ON public.corporate_entities FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_corp_sha_upd BEFORE UPDATE ON public.corporate_shareholders FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER tr_corp_doc_upd BEFORE UPDATE ON public.corporate_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

ALTER TABLE public.corporate_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_shareholders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Session: Full Access" ON public.corporate_entities FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.corporate_shareholders FOR ALL USING (TRUE);
CREATE POLICY "Tenant Session: Full Access" ON public.corporate_documents FOR ALL USING (TRUE);

-- Adicionar à publicação realtime
ALTER PUBLICATION supabase_realtime ADD TABLE 
    public.corporate_entities, 
    public.corporate_shareholders, 
    public.corporate_documents;
