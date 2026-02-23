-- ============================================================================
-- MIGRATION: NOTEBOOKLM - GOLDEN ALERTS
-- ============================================================================

-- 1. Create the golden_alerts table
create table if not exists public.golden_alerts (
    id uuid primary key default gen_random_uuid(),
    clipping_id uuid not null references public.clippings(id) on delete cascade,
    matched_knowledge_id uuid references public.knowledge_articles(id) on delete set null,
    matched_lawsuit_id uuid references public.lawsuits(id) on delete set null,
    match_score float not null,
    intelligence_type text check (intelligence_type in ('Opportunity', 'Risk', 'Similar Success')),
    reasoning text,
    status text default 'unread' check (status in ('unread', 'dismissed', 'actioned')),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- 2. Add Automation Trigger
create trigger tr_golden_alerts_updated 
before update on public.golden_alerts 
for each row execute function handle_updated_at();

-- 3. Enable Security
alter table public.golden_alerts enable row level security;

create policy "Allow auth on golden_alerts" 
on public.golden_alerts 
for all using (auth.role() = 'authenticated');

-- 4. Semantic Matching Engine (RPC)
create or replace function match_knowledge (
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
returns table (
  id uuid,
  title text,
  content text,
  category text,
  similarity float
)
language plpgsql
as $$
begin
  return query
  select
    ka.id,
    ka.title,
    ka.content,
    ka.category,
    1 - (ka.embedding <=> query_embedding) as similarity
  from public.knowledge_articles ka
  where 1 - (ka.embedding <=> query_embedding) > match_threshold
  order by ka.embedding <=> query_embedding
  limit match_count;
end;
$$;

-- 5. Vector Performance (HNSW Index for Semantic Search)
create index if not exists idx_clippings_embedding on public.clippings using hnsw (embedding vector_cosine_ops);
create index if not exists idx_knowledge_embedding on public.knowledge_articles using hnsw (embedding vector_cosine_ops);
