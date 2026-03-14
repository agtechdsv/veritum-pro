-- Migration: Update Legal Documents table to support file uploads
ALTER TABLE public.legal_documents 
ADD COLUMN IF NOT EXISTS document_type TEXT,
ADD COLUMN IF NOT EXISTS file_url TEXT,
ADD COLUMN IF NOT EXISTS event_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Note: We keep the 'content' column for Scriptor-generated text.
-- 'file_url' will be used for uploaded attachments.
