-- ============================================================
-- VIBE CHECK PENTRU TRUPE · spațiu SEPARAT de programul mare
-- Se rulează O SINGURĂ DATĂ în Supabase -> SQL Editor, pe proiectul
-- comun (waqyaewaldphstmiobjj). Idempotent.
--
-- De ce: trupele (vederea ?t= din programul mare) au propriul feed de
-- vibe. Ele NU văd pozele din programul mare, iar programul mare NU
-- vede pozele trupelor. Un singur feed comun tuturor trupelor.
-- Model de încredere identic cu cel mare: oricine cu linkul poate
-- adăuga; nimic nu se șterge din pagină (curățenie doar din dashboard).
-- ============================================================

-- 1) metadatele pozelor de trupă (fișierele stau în bucketul jurnal-trupe-21)
create table if not exists public.jurnal_photos_trupe (
  id bigint generated always as identity primary key,
  event_id text not null check (char_length(event_id) <= 100),
  day text not null check (char_length(day) <= 8),
  title text not null default '' check (char_length(title) <= 200),
  path text not null check (char_length(path) <= 300),
  caption text check (char_length(caption) <= 80),
  created_at timestamptz not null default now()
);
alter table public.jurnal_photos_trupe enable row level security;
drop policy if exists "jurnal trupe citire" on public.jurnal_photos_trupe;
create policy "jurnal trupe citire" on public.jurnal_photos_trupe for select using (true);
drop policy if exists "jurnal trupe adaugare" on public.jurnal_photos_trupe;
create policy "jurnal trupe adaugare" on public.jurnal_photos_trupe for insert with check (true);

-- 2) inimioare pe pozele de trupă (una per dispozitiv, pe încredere)
create table if not exists public.vibe_likes_trupe (
  id bigint generated always as identity primary key,
  photo_id bigint not null references public.jurnal_photos_trupe(id) on delete cascade,
  token text,
  created_at timestamptz not null default now()
);
alter table public.vibe_likes_trupe enable row level security;
drop policy if exists "likes trupe citire" on public.vibe_likes_trupe;
create policy "likes trupe citire" on public.vibe_likes_trupe for select using (true);
drop policy if exists "likes trupe adaugare" on public.vibe_likes_trupe;
create policy "likes trupe adaugare" on public.vibe_likes_trupe for insert with check (true);

-- 3) retragerea propriei inimi (doar dispozitivul care a dat-o)
create or replace function public.vibe_unlike_trupe(p_photo bigint, p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_token is null or char_length(p_token) < 8 then
    raise exception 'token invalid';
  end if;
  delete from vibe_likes_trupe where photo_id = p_photo and token = p_token;
end $$;
revoke all on function public.vibe_unlike_trupe(bigint, text) from public;
grant execute on function public.vibe_unlike_trupe(bigint, text) to anon, authenticated;

-- 4) bucketul de poze al trupelor (separat de jurnal-21)
insert into storage.buckets (id, name, public)
  values ('jurnal-trupe-21', 'jurnal-trupe-21', true)
  on conflict (id) do nothing;

-- 5) politici storage: upload + citire DOAR în jurnal-trupe-21
drop policy if exists "jurnaltrupe upload" on storage.objects;
create policy "jurnaltrupe upload" on storage.objects
  for insert with check (bucket_id = 'jurnal-trupe-21');
drop policy if exists "jurnaltrupe citire" on storage.objects;
create policy "jurnaltrupe citire" on storage.objects
  for select using (bucket_id = 'jurnal-trupe-21');
