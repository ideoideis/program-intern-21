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
