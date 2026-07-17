-- ============================================================
-- statistici de utilizare (anonime, la nivel de dispozitiv)
-- Rulează O DATĂ în Supabase -> SQL Editor.
-- ============================================================

create table if not exists public.analytics_21 (
  id bigint generated always as identity primary key,
  device text not null,
  kind text not null check (kind in ('open','view')),
  detail text check (char_length(detail) <= 60),
  ua text check (char_length(ua) <= 20),
  created_at timestamptz not null default now()
);
alter table public.analytics_21 enable row level security;
drop policy if exists "stats citire" on public.analytics_21;
create policy "stats citire" on public.analytics_21 for select using (true);
drop policy if exists "stats adaugare" on public.analytics_21;
create policy "stats adaugare" on public.analytics_21 for insert with check (true);

-- ── interogări utile (de rulat oricând în SQL Editor) ──
-- câte dispozitive unice au deschis pagina, pe zile:
--   select date_trunc('day', created_at) as zi, count(distinct device) as persoane
--   from analytics_21 where kind='open' group by 1 order by 1 desc;
--
-- câte deschideri în total pe zile:
--   select date_trunc('day', created_at) as zi, count(*) as deschideri
--   from analytics_21 where kind='open' group by 1 order by 1 desc;
--
-- pe ce se uită lumea (taburi/zile vizitate):
--   select detail, count(*) as vizite, count(distinct device) as persoane
--   from analytics_21 where kind='view' group by 1 order by 2 desc;
--
-- mobil vs desktop:
--   select ua, count(distinct device) from analytics_21 group by 1;
