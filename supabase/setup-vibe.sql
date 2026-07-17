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

-- retragerea propriei inimi: fiecare dispozitiv are un token privat;
-- funcția șterge doar inima dată de acel dispozitiv
alter table public.vibe_likes add column if not exists token text;
create or replace function public.vibe_unlike(p_photo bigint, p_token text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_token is null or char_length(p_token) < 8 then
    raise exception 'token invalid';
  end if;
  delete from vibe_likes where photo_id = p_photo and token = p_token;
end $$;
revoke all on function public.vibe_unlike(bigint, text) from public;
grant execute on function public.vibe_unlike(bigint, text) to anon, authenticated;
