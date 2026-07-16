-- ============================================================
-- program intern #21 · partea "live" (jurnal foto, anunțuri, feedback)
-- Se rulează O SINGURĂ DATĂ în Supabase -> SQL Editor, pe proiectul
-- comun (waqyaewaldphstmiobjj). E idempotent: poate fi rulat din nou
-- fără probleme.
--
-- Modelul de încredere (decis): oricine are linkul paginii poate
-- adăuga poze/anunțuri/feedback. Nimeni nu poate modifica sau șterge
-- din pagină (insert-only); curățenia se face doar din dashboard.
-- ============================================================

-- 1) jurnal foto: metadatele pozelor (fișierele stau în bucketul jurnal-21)
create table if not exists public.jurnal_photos (
  id bigint generated always as identity primary key,
  event_id text not null check (char_length(event_id) <= 100),
  day text not null check (char_length(day) <= 8),
  title text not null default '' check (char_length(title) <= 200),
  path text not null check (char_length(path) <= 300),
  created_at timestamptz not null default now()
);
alter table public.jurnal_photos enable row level security;
drop policy if exists "jurnal citire" on public.jurnal_photos;
create policy "jurnal citire" on public.jurnal_photos for select using (true);
drop policy if exists "jurnal adaugare" on public.jurnal_photos;
create policy "jurnal adaugare" on public.jurnal_photos for insert with check (true);

-- 2) anunțuri live (bannerul din pagină)
create table if not exists public.anunturi_21 (
  id bigint generated always as identity primary key,
  text text not null check (char_length(text) between 1 and 300),
  created_at timestamptz not null default now()
);
alter table public.anunturi_21 enable row level security;
drop policy if exists "anunturi citire" on public.anunturi_21;
create policy "anunturi citire" on public.anunturi_21 for select using (true);
drop policy if exists "anunturi adaugare" on public.anunturi_21;
create policy "anunturi adaugare" on public.anunturi_21 for insert with check (true);

-- 3) feedback în timp real (idee / problemă)
create table if not exists public.feedback_21 (
  id bigint generated always as identity primary key,
  tip text not null check (tip in ('idee','problemă')),
  text text not null check (char_length(text) between 1 and 2000),
  created_at timestamptz not null default now()
);
alter table public.feedback_21 enable row level security;
drop policy if exists "feedback citire" on public.feedback_21;
create policy "feedback citire" on public.feedback_21 for select using (true);
drop policy if exists "feedback adaugare" on public.feedback_21;
create policy "feedback adaugare" on public.feedback_21 for insert with check (true);

-- 4) bucketul de poze (există deja, dar păstrăm pentru idempotență)
insert into storage.buckets (id, name, public)
  values ('jurnal-21', 'jurnal-21', true)
  on conflict (id) do nothing;

-- 5) politici storage: upload + citire în jurnal-21, atât
drop policy if exists "jurnal21 upload" on storage.objects;
create policy "jurnal21 upload" on storage.objects
  for insert with check (bucket_id = 'jurnal-21');
drop policy if exists "jurnal21 citire" on storage.objects;
create policy "jurnal21 citire" on storage.objects
  for select using (bucket_id = 'jurnal-21');
