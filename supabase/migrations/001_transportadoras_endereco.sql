-- =====================================================================
-- Migration 001 — adiciona telefone/cidade/estado em transportadoras
-- Rodar no Supabase SQL Editor.
-- Idempotente: pode rodar várias vezes sem erro.
-- =====================================================================

alter table public.transportadoras
  add column if not exists telefone text,
  add column if not exists cidade   text,
  add column if not exists estado   text;

-- Garante a constraint de UF (2 letras maiúsculas)
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'transportadoras_estado_check'
  ) then
    alter table public.transportadoras
      add constraint transportadoras_estado_check
      check (estado is null or estado ~ '^[A-Z]{2}$');
  end if;
end $$;
