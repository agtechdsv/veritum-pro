-- Migration: Add Asset Documents Table
CREATE TABLE IF NOT EXISTS public.asset_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    document_type TEXT CHECK (document_type IN ('Matrícula', 'Escritura', 'CRLV', 'Contrato Compra e Venda', 'Laudo de Avaliação', 'Fotos', 'Outros')),
    event_date DATE,
    file_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Triggers for updated_at
CREATE TRIGGER tr_asset_doc_upd BEFORE UPDATE ON public.asset_documents FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Enable RLS
ALTER TABLE public.asset_documents ENABLE ROW LEVEL SECURITY;

-- Policy (Full Access for Tenant)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'asset_documents' 
        AND policyname = 'Tenant Session: Full Access'
    ) THEN
        CREATE POLICY "Tenant Session: Full Access" ON public.asset_documents FOR ALL USING (TRUE);
    END IF;
END $$;

-- Realtime
-- Note: Check if the table is already in the publication to avoid errors
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.asset_documents;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;
