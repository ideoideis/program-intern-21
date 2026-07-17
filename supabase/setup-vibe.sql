-- ============================================================
-- vibe check · descriere opțională pe postări
-- Rulează O DATĂ în Supabase -> SQL Editor (idempotent).
-- Fără acest script, vibe-ul merge oricum, doar că descrierile
-- scrise la postare nu se salvează.
-- Pozele NU se pot șterge din pagină (alegere de echipă);
-- curățenia se face doar din dashboard.
-- ============================================================

alter table public.jurnal_photos
  add column if not exists caption text check (char_length(caption) <= 80);

-- inimioare pe postări: oricine poate aprecia (una per dispozitiv,
-- ținută pe încredere în telefonul fiecăruia); insert-only
create table if not exists public.vibe_likes (
  id bigint generated always as identity primary key,
  photo_id bigint not null references public.jurnal_photos(id) on delete cascade,
  created_at timestamptz not null default now()
);
alter table public.vibe_likes enable row level security;
drop policy if exists "likes citire" on public.vibe_likes;
create policy "likes citire" on public.vibe_likes for select using (true);
drop policy if exists "likes adaugare" on public.vibe_likes;
create policy "likes adaugare" on public.vibe_likes for insert with check (true);
