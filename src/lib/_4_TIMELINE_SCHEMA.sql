-- ============================================================================
-- 11. MÓDULO DE TIMELINE / AUDITORIA (HISTÓRICO DE ALTERAÇÕES)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.timeline_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type TEXT NOT NULL,          -- 'lawsuit', 'asset', 'task', etc.
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,               -- 'CREATE', 'UPDATE', 'STATUS_CHANGE', 'DELETE', 'DOC_UPLOAD'
    description TEXT,                   -- "Moveu de X para Y"
    old_values JSONB,                   -- Estado anterior
    new_values JSONB,                   -- Novo estado
    user_id UUID,                       -- ID do usuário (Auth ID ou Master ID)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index para busca rápida por entidade
CREATE INDEX IF NOT EXISTS idx_timeline_entity ON public.timeline_entries(entity_type, entity_id);

-- RLS
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'timeline_entries' 
        AND policyname = 'Tenant Session: Full Access'
    ) THEN
        CREATE POLICY "Tenant Session: Full Access" ON public.timeline_entries FOR ALL USING (TRUE);
    END IF;
END $$;

-- Realtime
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add table to publication if not already there
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables 
            WHERE pubname = 'supabase_realtime' 
            AND tablename = 'timeline_entries'
        ) THEN
            ALTER PUBLICATION supabase_realtime ADD TABLE public.timeline_entries;
        END IF;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
