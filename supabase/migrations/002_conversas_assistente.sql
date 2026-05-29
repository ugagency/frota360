-- =====================================================================
-- Migration 002 — Assistente IA: conversas + log de uso
-- Rodar no Supabase SQL Editor. Idempotente.
-- =====================================================================

-- ---------------------------------------------------------------------
-- conversas_assistente
-- ---------------------------------------------------------------------
create table if not exists public.conversas_assistente (
  id                uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  titulo            text,
  mensagens         jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists idx_conversas_transp_updated
  on public.conversas_assistente(transportadora_id, updated_at desc);
create index if not exists idx_conversas_user_updated
  on public.conversas_assistente(user_id, updated_at desc);

alter table public.conversas_assistente enable row level security;

drop policy if exists conversas_select on public.conversas_assistente;
create policy conversas_select on public.conversas_assistente
  for select to authenticated
  using (
    transportadora_id = public.get_transportadora_id_do_usuario()
    and user_id = auth.uid()
  );

drop policy if exists conversas_insert on public.conversas_assistente;
create policy conversas_insert on public.conversas_assistente
  for insert to authenticated
  with check (
    transportadora_id = public.get_transportadora_id_do_usuario()
    and user_id = auth.uid()
  );

drop policy if exists conversas_update on public.conversas_assistente;
create policy conversas_update on public.conversas_assistente
  for update to authenticated
  using (
    transportadora_id = public.get_transportadora_id_do_usuario()
    and user_id = auth.uid()
  )
  with check (
    transportadora_id = public.get_transportadora_id_do_usuario()
    and user_id = auth.uid()
  );

drop policy if exists conversas_delete on public.conversas_assistente;
create policy conversas_delete on public.conversas_assistente
  for delete to authenticated
  using (
    transportadora_id = public.get_transportadora_id_do_usuario()
    and user_id = auth.uid()
  );

drop trigger if exists trg_conversas_updated_at on public.conversas_assistente;
create trigger trg_conversas_updated_at
  before update on public.conversas_assistente
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------
-- assistente_uso_log  (analytics + rate-limit por tenant)
-- ---------------------------------------------------------------------
create table if not exists public.assistente_uso_log (
  id                uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras(id) on delete cascade,
  user_id           uuid not null references auth.users(id) on delete cascade,
  tokens_prompt     integer,
  tokens_resposta   integer,
  funcoes_chamadas  text[],
  created_at        timestamptz not null default now()
);

create index if not exists idx_uso_log_transp_data
  on public.assistente_uso_log(transportadora_id, created_at desc);

alter table public.assistente_uso_log enable row level security;

drop policy if exists uso_log_select on public.assistente_uso_log;
create policy uso_log_select on public.assistente_uso_log
  for select to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists uso_log_insert on public.assistente_uso_log;
create policy uso_log_insert on public.assistente_uso_log
  for insert to authenticated
  with check (transportadora_id = public.get_transportadora_id_do_usuario());
