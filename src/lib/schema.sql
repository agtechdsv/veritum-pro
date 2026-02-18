-- Enable Vector Extension for AI Embeddings
create extension if not exists vector;

-- App Configuration (Non-sensitive settings)
create table if not exists app_settings (
  id uuid primary key default gen_random_uuid(),
  office_name text,
  whatsapp_api_url text, -- User's WhatsApp API URL
  theme_color text,
  created_at timestamptz default now()
);

-- Nexus Pro (Lawsuits/Processos)
create table if not exists lawsuits (
  id uuid primary key default gen_random_uuid(),
  cnj_number text unique,
  client_name text,
  case_title text, -- Added for better identification
  status text, -- e.g., 'active', 'archived', 'pending'
  phase text, -- Pipeline phase
  value numeric,
  court text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Sentinel Pro & Vox Clientis (Movements/Andamentos)
create table if not exists movements (
  id uuid primary key default gen_random_uuid(),
  lawsuit_id uuid references lawsuits(id) on delete cascade,
  original_text text,
  translated_text text, -- Filled by AI (Vox)
  sentiment_score float, -- Filled by AI (Sentinel)
  source text, -- e.g. 'Push', 'Manual', 'Scraper'
  is_notified boolean default false,
  created_at timestamptz default now()
);

-- Scriptor Pro (Embeddings/RAG)
create table if not exists document_embeddings (
  id uuid primary key default gen_random_uuid(),
  lawsuit_id uuid references lawsuits(id) on delete cascade,
  filename text,
  content text,
  embedding vector(1536), -- Compatible with Gemini/OpenAI
  created_at timestamptz default now()
);

-- Valorem Pro (Financials)
create table if not exists financial_records (
  id uuid primary key default gen_random_uuid(),
  lawsuit_id uuid references lawsuits(id) on delete set null,
  description text,
  type text check (type in ('fee', 'cost', 'settlement', 'honorarium')),
  amount numeric,
  due_date date,
  is_paid boolean default false,
  created_at timestamptz default now()
);

-- Enable Row Level Security (RLS) - Basic Setup for now
alter table app_settings enable row level security;
alter table lawsuits enable row level security;
alter table movements enable row level security;
alter table document_embeddings enable row level security;
alter table financial_records enable row level security;

-- Create Policies (Allow all for authenticated users for BYODB simplicity initially)
-- In a real SaaS, this would be tenant-based. But BYODB means the user OWNS the DB.
-- So we can just allow authenticated role.

create policy "Enable all access for authenticated users" on app_settings for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on lawsuits for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on movements for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on document_embeddings for all using (auth.role() = 'authenticated');
create policy "Enable all access for authenticated users" on financial_records for all using (auth.role() = 'authenticated');

-- Create storage bucket for documents if not exists
insert into storage.buckets (id, name, public) 
values ('documents', 'documents', false)
on conflict (id) do nothing;

create policy "Enable access to documents for auth users" on storage.objects for all using (bucket_id = 'documents' and auth.role() = 'authenticated');
