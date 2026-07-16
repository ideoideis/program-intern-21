-- ============================================================
-- vibe check · descriere opțională pe postări + ștergerea propriei postări
-- Rulează O DATĂ în Supabase -> SQL Editor (idempotent).
-- Fără acest script, vibe-ul merge oricum, doar că pozele nu au
-- nume de autor și nu pot fi șterse din pagină.
-- ============================================================

alter table public.jurnal_photos
  add column if not exists caption text check (char_length(caption) <= 80);
alter table public.jurnal_photos
  add column if not exists token text;

-- ștergere doar de către cine a postat (dovada = tokenul primit la post)
create or replace function public.vibe_delete(p_id bigint, p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_path text;
begin
  if p_token is null or char_length(p_token) < 8 then
    raise exception 'token invalid';
  end if;
  select path into v_path from jurnal_photos
    where id = p_id and token is not null and token = p_token;
  if v_path is null then
    raise exception 'nu ai voie';
  end if;
  delete from jurnal_photos where id = p_id;
  delete from storage.objects where bucket_id = 'jurnal-21' and name = v_path;
end
$$;

revoke all on function public.vibe_delete(bigint, text) from public;
grant execute on function public.vibe_delete(bigint, text) to anon, authenticated;
