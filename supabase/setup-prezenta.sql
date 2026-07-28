-- Prezență ateliere · registru comun pentru traineri
-- (formulare de prezență de pe programul formatori:
--  https://ideoideis.github.io/program-intern-formatori/)
--
-- Un rând per (zi, atelier, participant). prezent = true/false.
-- Deschis, fără cod/parolă, ca restul site-ului (model de încredere).
-- Rulează o singură dată în Supabase → SQL Editor.

create table if not exists prezenta_ateliere (
  zi          text        not null,   -- ziua festivalului: mi29, j30, v31, s1, d2, l3, ma4
  atelier     text        not null,   -- cheia atelierului: 'tt:leira', 'arte:dans 1', ...
  participant text        not null,   -- numele participantului
  prezent     boolean     not null default true,
  updated_at  timestamptz not null default now(),
  primary key (zi, atelier, participant)
);

alter table prezenta_ateliere enable row level security;

-- acces deschis (select/insert/update/delete) pentru cheia publică anon
drop policy if exists prez_all on prezenta_ateliere;
create policy prez_all on prezenta_ateliere
  for all using (true) with check (true);
