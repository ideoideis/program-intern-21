-- ============================================================
-- Anunțurile se publică doar cu codul echipei (verificat pe server).
-- 1. SCHIMBĂ 'schimba-ma' de mai jos cu codul vostru (o vorbă scurtă,
--    ușor de zis prin viu grai echipei).
-- 2. Rulează tot fișierul în Supabase -> SQL Editor.
-- Pozele și feedbackul rămân deschise; doar anunțurile se închid.
-- ============================================================

create or replace function public.post_anunt(p_text text, p_parola text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_parola is distinct from 'schimba-ma' then
    raise exception 'parola gresita';
  end if;
  if p_text is null or char_length(trim(p_text)) = 0 or char_length(p_text) > 300 then
    raise exception 'text invalid';
  end if;
  insert into anunturi_21(text) values (trim(p_text));
end
$$;

revoke all on function public.post_anunt(text, text) from public;
grant execute on function public.post_anunt(text, text) to anon, authenticated;

-- închidem publicarea directă (fără cod) în tabelă
drop policy if exists "anunturi adaugare" on public.anunturi_21;
