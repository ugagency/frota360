-- =====================================================================
-- Frota 360 — Schema completo (Sprint 1)
-- Multi-tenant SaaS de gestão de frotas
-- Executar no Supabase SQL Editor (role: postgres, bypassa RLS no seed)
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSÕES
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto";

-- =====================================================================
-- 1. TABELAS
-- =====================================================================

-- 1.1 transportadoras --------------------------------------------------
create table if not exists public.transportadoras (
  id            uuid primary key default gen_random_uuid(),
  nome          text not null,
  cnpj          text unique,
  telefone      text,
  cidade        text,
  estado        text check (estado ~ '^[A-Z]{2}$'),
  plano         text not null default 'starter'
                check (plano in ('starter','pro')),
  plano_status  text not null default 'trial'
                check (plano_status in ('trial','ativo','cancelado','inadimplente')),
  trial_ends_at timestamptz,
  config        jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- 1.2 usuarios_transportadoras ----------------------------------------
create table if not exists public.usuarios_transportadoras (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  transportadora_id uuid not null references public.transportadoras(id) on delete cascade,
  role              text not null default 'gestor'
                    check (role in ('admin','gestor','operador')),
  created_at        timestamptz not null default now(),
  unique (user_id, transportadora_id)
);

-- 1.3 veiculos --------------------------------------------------------
create table if not exists public.veiculos (
  id                   uuid primary key default gen_random_uuid(),
  transportadora_id    uuid not null references public.transportadoras(id) on delete cascade,
  placa                text not null,
  tipo                 text not null
                       check (tipo in ('truck','bitruck','carreta','vanderleia','outros')),
  marca                text,
  modelo               text,
  ano                  integer,
  cor                  text,
  renavam              text,
  chassi               text,
  km_atual             numeric not null default 0,
  km_proxima_revisao   numeric,
  data_proxima_revisao date,
  data_licenciamento   date,
  status               text not null default 'ativo'
                       check (status in ('ativo','em_viagem','em_manutencao','inativo')),
  proprietario         text not null default 'proprio'
                       check (proprietario in ('proprio','agregado')),
  foto_url             text,
  observacoes          text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  unique (transportadora_id, placa)
);

-- 1.4 motoristas ------------------------------------------------------
create table if not exists public.motoristas (
  id                uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras(id) on delete cascade,
  nome              text not null,
  cpf               text not null,
  telefone          text,
  cnh_numero        text,
  cnh_categoria     text check (cnh_categoria in ('C','D','E')),
  cnh_validade      date,
  mopp_validade     date,
  nr_validade       date,
  tipo              text not null default 'proprio'
                    check (tipo in ('proprio','agregado')),
  status            text not null default 'ativo'
                    check (status in ('ativo','afastado','inativo')),
  foto_url          text,
  documentos        jsonb not null default '[]'::jsonb,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (transportadora_id, cpf)
);

-- 1.5 viagens ---------------------------------------------------------
create table if not exists public.viagens (
  id                 uuid primary key default gen_random_uuid(),
  transportadora_id  uuid not null references public.transportadoras(id) on delete cascade,
  veiculo_id         uuid not null references public.veiculos(id),
  motorista_id       uuid not null references public.motoristas(id),
  numero             text not null,
  origem             text not null,
  destino            text not null,
  cliente            text,
  tipo_carga         text,
  peso_ton           numeric,
  valor_frete        numeric(12,2),
  valor_adiantamento numeric(12,2) not null default 0,
  km_saida           numeric,
  km_chegada         numeric,
  data_saida         timestamptz,
  data_chegada       timestamptz,
  data_chegada_real  timestamptz,
  status             text not null default 'planejada'
                     check (status in ('planejada','em_andamento','concluida','cancelada')),
  cte_numero         text,
  observacoes        text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  unique (transportadora_id, numero)
);

-- 1.6 manutencoes -----------------------------------------------------
create table if not exists public.manutencoes (
  id                uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras(id) on delete cascade,
  veiculo_id        uuid not null references public.veiculos(id),
  tipo              text not null check (tipo in ('preventiva','corretiva')),
  descricao         text not null,
  oficina           text,
  mecanico          text,
  km_na_manutencao  numeric,
  km_proxima        numeric,
  data_entrada      date not null,
  data_saida        date,
  data_proxima      date,
  status            text not null default 'agendada'
                    check (status in ('agendada','em_andamento','concluida')),
  itens             jsonb not null default '[]'::jsonb,
  valor_total       numeric(12,2) not null default 0,
  laudo_url         text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 1.7 lancamentos_financeiros -----------------------------------------
create table if not exists public.lancamentos_financeiros (
  id                uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras(id) on delete cascade,
  veiculo_id        uuid references public.veiculos(id),
  viagem_id         uuid references public.viagens(id),
  manutencao_id     uuid references public.manutencoes(id),
  motorista_id      uuid references public.motoristas(id),
  tipo              text not null check (tipo in ('receita','despesa')),
  categoria         text not null
                    check (categoria in ('combustivel','manutencao','pedagio','multa','frete','adiantamento','outros')),
  descricao         text not null,
  valor             numeric(12,2) not null,
  data              date not null,
  comprovante_url   text,
  created_at        timestamptz not null default now()
);

-- 1.8 alertas ---------------------------------------------------------
create table if not exists public.alertas (
  id                uuid primary key default gen_random_uuid(),
  transportadora_id uuid not null references public.transportadoras(id) on delete cascade,
  tipo              text not null
                    check (tipo in ('manutencao_km','manutencao_data','cnh_vencimento','mopp_vencimento','licenciamento')),
  referencia_id     uuid not null,
  referencia_tipo   text not null check (referencia_tipo in ('veiculo','motorista')),
  titulo            text not null,
  descricao         text,
  data_alerta       date not null,
  status            text not null default 'pendente'
                    check (status in ('pendente','visualizado','resolvido')),
  prioridade        text not null default 'medio'
                    check (prioridade in ('critico','alto','medio','baixo')),
  created_at        timestamptz not null default now()
);

-- =====================================================================
-- 2. ÍNDICES
-- =====================================================================
create index if not exists idx_veiculos_transp_status         on public.veiculos(transportadora_id, status);
create index if not exists idx_viagens_transp_status          on public.viagens(transportadora_id, status);
create index if not exists idx_viagens_transp_data_saida      on public.viagens(transportadora_id, data_saida);
create index if not exists idx_viagens_veiculo_data_saida     on public.viagens(veiculo_id, data_saida);
create index if not exists idx_manutencoes_transp_status      on public.manutencoes(transportadora_id, status);
create index if not exists idx_manutencoes_veiculo            on public.manutencoes(veiculo_id);
create index if not exists idx_lancamentos_transp_data        on public.lancamentos_financeiros(transportadora_id, data);
create index if not exists idx_lancamentos_veiculo_data       on public.lancamentos_financeiros(veiculo_id, data);
create index if not exists idx_alertas_transp_status_prio     on public.alertas(transportadora_id, status, prioridade);
create index if not exists idx_motoristas_transp_status       on public.motoristas(transportadora_id, status);

-- =====================================================================
-- 3. TRIGGERS — updated_at automático
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_transportadoras_updated_at on public.transportadoras;
create trigger trg_transportadoras_updated_at
  before update on public.transportadoras
  for each row execute function public.set_updated_at();

drop trigger if exists trg_veiculos_updated_at on public.veiculos;
create trigger trg_veiculos_updated_at
  before update on public.veiculos
  for each row execute function public.set_updated_at();

drop trigger if exists trg_motoristas_updated_at on public.motoristas;
create trigger trg_motoristas_updated_at
  before update on public.motoristas
  for each row execute function public.set_updated_at();

drop trigger if exists trg_viagens_updated_at on public.viagens;
create trigger trg_viagens_updated_at
  before update on public.viagens
  for each row execute function public.set_updated_at();

drop trigger if exists trg_manutencoes_updated_at on public.manutencoes;
create trigger trg_manutencoes_updated_at
  before update on public.manutencoes
  for each row execute function public.set_updated_at();

-- =====================================================================
-- 4. HELPER RLS — transportadora do usuário logado
-- =====================================================================
create or replace function public.get_transportadora_id_do_usuario()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select transportadora_id
    from public.usuarios_transportadoras
   where user_id = auth.uid()
   limit 1;
$$;

revoke all on function public.get_transportadora_id_do_usuario() from public;
grant execute on function public.get_transportadora_id_do_usuario() to authenticated;

-- =====================================================================
-- 5. ROW LEVEL SECURITY
-- =====================================================================
alter table public.transportadoras            enable row level security;
alter table public.usuarios_transportadoras   enable row level security;
alter table public.veiculos                   enable row level security;
alter table public.motoristas                 enable row level security;
alter table public.viagens                    enable row level security;
alter table public.manutencoes                enable row level security;
alter table public.lancamentos_financeiros    enable row level security;
alter table public.alertas                    enable row level security;

-- 5.1 transportadoras: usuário vê apenas a sua
drop policy if exists transportadoras_select on public.transportadoras;
create policy transportadoras_select on public.transportadoras
  for select to authenticated
  using (id = public.get_transportadora_id_do_usuario());

drop policy if exists transportadoras_update on public.transportadoras;
create policy transportadoras_update on public.transportadoras
  for update to authenticated
  using (id = public.get_transportadora_id_do_usuario())
  with check (id = public.get_transportadora_id_do_usuario());

-- 5.2 usuarios_transportadoras: usuário vê apenas o próprio vínculo
drop policy if exists usuarios_transp_select on public.usuarios_transportadoras;
create policy usuarios_transp_select on public.usuarios_transportadoras
  for select to authenticated
  using (user_id = auth.uid());

-- 5.3 Helper inline: gera 4 policies (S/I/U/D) por tabela operacional ---
-- veiculos -----------------------------------------------------------
drop policy if exists veiculos_select on public.veiculos;
create policy veiculos_select on public.veiculos
  for select to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists veiculos_insert on public.veiculos;
create policy veiculos_insert on public.veiculos
  for insert to authenticated
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists veiculos_update on public.veiculos;
create policy veiculos_update on public.veiculos
  for update to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario())
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists veiculos_delete on public.veiculos;
create policy veiculos_delete on public.veiculos
  for delete to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

-- motoristas ---------------------------------------------------------
drop policy if exists motoristas_select on public.motoristas;
create policy motoristas_select on public.motoristas
  for select to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists motoristas_insert on public.motoristas;
create policy motoristas_insert on public.motoristas
  for insert to authenticated
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists motoristas_update on public.motoristas;
create policy motoristas_update on public.motoristas
  for update to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario())
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists motoristas_delete on public.motoristas;
create policy motoristas_delete on public.motoristas
  for delete to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

-- viagens ------------------------------------------------------------
drop policy if exists viagens_select on public.viagens;
create policy viagens_select on public.viagens
  for select to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists viagens_insert on public.viagens;
create policy viagens_insert on public.viagens
  for insert to authenticated
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists viagens_update on public.viagens;
create policy viagens_update on public.viagens
  for update to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario())
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists viagens_delete on public.viagens;
create policy viagens_delete on public.viagens
  for delete to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

-- manutencoes --------------------------------------------------------
drop policy if exists manutencoes_select on public.manutencoes;
create policy manutencoes_select on public.manutencoes
  for select to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists manutencoes_insert on public.manutencoes;
create policy manutencoes_insert on public.manutencoes
  for insert to authenticated
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists manutencoes_update on public.manutencoes;
create policy manutencoes_update on public.manutencoes
  for update to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario())
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists manutencoes_delete on public.manutencoes;
create policy manutencoes_delete on public.manutencoes
  for delete to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

-- lancamentos_financeiros --------------------------------------------
drop policy if exists lancamentos_select on public.lancamentos_financeiros;
create policy lancamentos_select on public.lancamentos_financeiros
  for select to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists lancamentos_insert on public.lancamentos_financeiros;
create policy lancamentos_insert on public.lancamentos_financeiros
  for insert to authenticated
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists lancamentos_update on public.lancamentos_financeiros;
create policy lancamentos_update on public.lancamentos_financeiros
  for update to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario())
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists lancamentos_delete on public.lancamentos_financeiros;
create policy lancamentos_delete on public.lancamentos_financeiros
  for delete to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

-- alertas ------------------------------------------------------------
drop policy if exists alertas_select on public.alertas;
create policy alertas_select on public.alertas
  for select to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists alertas_insert on public.alertas;
create policy alertas_insert on public.alertas
  for insert to authenticated
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists alertas_update on public.alertas;
create policy alertas_update on public.alertas
  for update to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario())
  with check (transportadora_id = public.get_transportadora_id_do_usuario());

drop policy if exists alertas_delete on public.alertas;
create policy alertas_delete on public.alertas
  for delete to authenticated
  using (transportadora_id = public.get_transportadora_id_do_usuario());

-- =====================================================================
-- 6. SEED DE DESENVOLVIMENTO
-- "Transportadora Demo Ltda"
-- Roda no SQL Editor com role postgres → bypassa RLS. Para vincular
-- um usuário criado via Auth, INSERT em usuarios_transportadoras com
-- o user_id retornado por auth.users e o transportadora_id da demo.
-- =====================================================================

do $$
declare
  v_transp_id      uuid;
  v_veiculo1_id    uuid; -- Scania carreta (em viagem)
  v_veiculo2_id    uuid; -- Volvo bitruck (ativo)
  v_veiculo3_id    uuid; -- Mercedes truck (em manutenção)
  v_veiculo4_id    uuid; -- Iveco vanderleia (ativo)
  v_veiculo5_id    uuid; -- DAF carreta (inativo)
  v_motorista1_id  uuid; -- CNH ok
  v_motorista2_id  uuid; -- CNH vencendo em 20 dias
  v_motorista3_id  uuid; -- CNH vencida
  v_motorista4_id  uuid; -- agregado
  v_viagem1_id     uuid; -- concluída
  v_viagem2_id     uuid; -- em andamento
  v_viagem3_id     uuid; -- planejada
  v_manut1_id      uuid; -- preventiva concluída
  v_manut2_id      uuid; -- corretiva em andamento
  v_hoje           date := current_date;
begin
  -- Limpa em caso de re-execução
  delete from public.transportadoras where nome = 'Transportadora Demo Ltda';

  -- Transportadora
  insert into public.transportadoras (nome, cnpj, telefone, cidade, estado, plano, plano_status, trial_ends_at)
  values ('Transportadora Demo Ltda', '12.345.678/0001-90', '(11) 3344-5566', 'São Paulo', 'SP',
          'pro', 'ativo', v_hoje + interval '30 days')
  returning id into v_transp_id;

  -- Veículos
  insert into public.veiculos (transportadora_id, placa, tipo, marca, modelo, ano, cor, renavam, chassi,
                               km_atual, km_proxima_revisao, data_proxima_revisao, data_licenciamento,
                               status, proprietario)
  values
    (v_transp_id, 'ABC1D23', 'carreta',    'Scania',    'R450',         2021, 'Branco', '01234567890', '9BSR4X2A0L3678901', 285430, 295000, v_hoje + 25,  v_hoje + 90,  'em_viagem',      'proprio')
  returning id into v_veiculo1_id;

  insert into public.veiculos (transportadora_id, placa, tipo, marca, modelo, ano, cor, renavam, chassi,
                               km_atual, km_proxima_revisao, data_proxima_revisao, data_licenciamento,
                               status, proprietario)
  values
    (v_transp_id, 'DEF2E45', 'bitruck',    'Volvo',     'FH 540',       2022, 'Azul',   '11234567890', '9BVT5X2A0M3678902', 142800, 150000, v_hoje + 60,  v_hoje + 120, 'ativo',          'proprio')
  returning id into v_veiculo2_id;

  insert into public.veiculos (transportadora_id, placa, tipo, marca, modelo, ano, cor, renavam, chassi,
                               km_atual, km_proxima_revisao, data_proxima_revisao, data_licenciamento,
                               status, proprietario)
  values
    (v_transp_id, 'GHI3F67', 'truck',      'Mercedes',  'Actros 2546',  2020, 'Prata',  '21234567890', '9BM6X2A0N3678903',  398120, 400000, v_hoje + 5,   v_hoje + 45,  'em_manutencao',  'proprio')
  returning id into v_veiculo3_id;

  insert into public.veiculos (transportadora_id, placa, tipo, marca, modelo, ano, cor, renavam, chassi,
                               km_atual, km_proxima_revisao, data_proxima_revisao, data_licenciamento,
                               status, proprietario)
  values
    (v_transp_id, 'JKL4G89', 'vanderleia', 'Iveco',     'Hi-Way 600',   2023, 'Vermelho', '31234567890', '9BIVX2A0P3678904', 78250, 90000, v_hoje + 180, v_hoje + 200, 'ativo',          'agregado')
  returning id into v_veiculo4_id;

  insert into public.veiculos (transportadora_id, placa, tipo, marca, modelo, ano, cor, renavam, chassi,
                               km_atual, km_proxima_revisao, data_proxima_revisao, data_licenciamento,
                               status, proprietario)
  values
    (v_transp_id, 'MNO5H01', 'carreta',    'DAF',       'XF 530',       2019, 'Preto',  '41234567890', '9BDFX2A0Q3678905', 521030, 525000, v_hoje - 30,  v_hoje - 10,  'inativo',        'proprio')
  returning id into v_veiculo5_id;

  -- Motoristas
  insert into public.motoristas (transportadora_id, nome, cpf, telefone, cnh_numero, cnh_categoria,
                                 cnh_validade, mopp_validade, nr_validade, tipo, status)
  values (v_transp_id, 'João Silva Oliveira', '123.456.789-00', '(11) 98765-4321',
          '12345678900', 'E', v_hoje + 400, v_hoje + 300, v_hoje + 200, 'proprio', 'ativo')
  returning id into v_motorista1_id;

  insert into public.motoristas (transportadora_id, nome, cpf, telefone, cnh_numero, cnh_categoria,
                                 cnh_validade, mopp_validade, nr_validade, tipo, status)
  values (v_transp_id, 'Carlos Eduardo Souza', '234.567.890-11', '(11) 98765-4322',
          '23456789011', 'E', v_hoje + 20, v_hoje + 100, v_hoje + 50, 'proprio', 'ativo')
  returning id into v_motorista2_id;

  insert into public.motoristas (transportadora_id, nome, cpf, telefone, cnh_numero, cnh_categoria,
                                 cnh_validade, mopp_validade, nr_validade, tipo, status)
  values (v_transp_id, 'Roberto Almeida Costa', '345.678.901-22', '(11) 98765-4323',
          '34567890122', 'E', v_hoje - 15, v_hoje + 60, v_hoje + 30, 'proprio', 'afastado')
  returning id into v_motorista3_id;

  insert into public.motoristas (transportadora_id, nome, cpf, telefone, cnh_numero, cnh_categoria,
                                 cnh_validade, mopp_validade, nr_validade, tipo, status)
  values (v_transp_id, 'Pedro Henrique Ramos', '456.789.012-33', '(11) 98765-4324',
          '45678901233', 'D', v_hoje + 600, v_hoje + 450, v_hoje + 350, 'agregado', 'ativo')
  returning id into v_motorista4_id;

  -- Viagens
  insert into public.viagens (transportadora_id, veiculo_id, motorista_id, numero, origem, destino, cliente,
                              tipo_carga, peso_ton, valor_frete, valor_adiantamento, km_saida, km_chegada,
                              data_saida, data_chegada, data_chegada_real, status, cte_numero)
  values (v_transp_id, v_veiculo5_id, v_motorista1_id, 'V-2026-0001',
          'São Paulo - SP', 'Belo Horizonte - MG', 'Indústrias Reunidas S.A.',
          'Eletrônicos', 24.5, 8500.00, 2000.00, 520200, 520830,
          v_hoje - 12, v_hoje - 10, v_hoje - 10, 'concluida', '35260512345678901234567890123456789012345678')
  returning id into v_viagem1_id;

  insert into public.viagens (transportadora_id, veiculo_id, motorista_id, numero, origem, destino, cliente,
                              tipo_carga, peso_ton, valor_frete, valor_adiantamento, km_saida, km_chegada,
                              data_saida, data_chegada, status, cte_numero)
  values (v_transp_id, v_veiculo1_id, v_motorista2_id, 'V-2026-0002',
          'Belo Horizonte - MG', 'Porto Alegre - RS', 'Distribuidora Sul Ltda',
          'Bebidas', 32.0, 12400.00, 3500.00, 285430, null,
          v_hoje - 2, v_hoje + 1, 'em_andamento', '31260512345678901234567890123456789012345679')
  returning id into v_viagem2_id;

  insert into public.viagens (transportadora_id, veiculo_id, motorista_id, numero, origem, destino, cliente,
                              tipo_carga, peso_ton, valor_frete, valor_adiantamento, data_saida, data_chegada,
                              status)
  values (v_transp_id, v_veiculo2_id, v_motorista4_id, 'V-2026-0003',
          'São Paulo - SP', 'Rio de Janeiro - RJ', 'Comercial Litorânea',
          'Alimentos', 18.0, 4800.00, 0, v_hoje + 3, v_hoje + 4, 'planejada')
  returning id into v_viagem3_id;

  -- Manutenções
  insert into public.manutencoes (transportadora_id, veiculo_id, tipo, descricao, oficina, mecanico,
                                  km_na_manutencao, km_proxima, data_entrada, data_saida, data_proxima,
                                  status, itens, valor_total)
  values (v_transp_id, v_veiculo2_id, 'preventiva',
          'Revisão completa 140.000 km — troca de óleo, filtros e correias',
          'Volvo Service SP', 'José Aparecido',
          140100, 150000, v_hoje - 20, v_hoje - 19, v_hoje + 60,
          'concluida',
          '[{"item":"Óleo motor 15W40","qtd":40,"valor":1280.00},
            {"item":"Filtro de óleo","qtd":2,"valor":340.00},
            {"item":"Filtro de ar","qtd":1,"valor":420.00},
            {"item":"Correia poly-v","qtd":1,"valor":890.00},
            {"item":"Mão de obra","qtd":1,"valor":1800.00}]'::jsonb,
          4730.00)
  returning id into v_manut1_id;

  insert into public.manutencoes (transportadora_id, veiculo_id, tipo, descricao, oficina, mecanico,
                                  km_na_manutencao, data_entrada, status, itens, valor_total)
  values (v_transp_id, v_veiculo3_id, 'corretiva',
          'Vazamento no sistema hidráulico do basculante + troca da bomba',
          'Mecânica Diesel Forte', 'Marcos Vinícius',
          398120, v_hoje - 3, 'em_andamento',
          '[{"item":"Bomba hidráulica","qtd":1,"valor":4200.00},
            {"item":"Mangueiras alta pressão","qtd":3,"valor":680.00},
            {"item":"Óleo hidráulico","qtd":20,"valor":520.00}]'::jsonb,
          5400.00)
  returning id into v_manut2_id;

  -- Lançamentos financeiros do mês atual (mix receita/despesa)
  insert into public.lancamentos_financeiros
    (transportadora_id, veiculo_id, viagem_id, manutencao_id, motorista_id, tipo, categoria, descricao, valor, data)
  values
    (v_transp_id, v_veiculo5_id, v_viagem1_id, null, v_motorista1_id, 'receita', 'frete',         'Frete V-2026-0001 SP→BH',            8500.00, v_hoje - 10),
    (v_transp_id, v_veiculo5_id, v_viagem1_id, null, v_motorista1_id, 'despesa', 'adiantamento',  'Adiantamento motorista V-2026-0001', 2000.00, v_hoje - 12),
    (v_transp_id, v_veiculo5_id, v_viagem1_id, null, null,            'despesa', 'combustivel',   'Abastecimento Posto BR — V-0001',    3800.00, v_hoje - 11),
    (v_transp_id, v_veiculo5_id, v_viagem1_id, null, null,            'despesa', 'pedagio',       'Pedágios SP→BH',                      420.50,  v_hoje - 11),
    (v_transp_id, v_veiculo1_id, v_viagem2_id, null, v_motorista2_id, 'despesa', 'adiantamento',  'Adiantamento motorista V-2026-0002', 3500.00, v_hoje - 2),
    (v_transp_id, v_veiculo1_id, v_viagem2_id, null, null,            'despesa', 'combustivel',   'Abastecimento V-0002 saída',         4200.00, v_hoje - 2),
    (v_transp_id, v_veiculo2_id, null,         v_manut1_id, null,     'despesa', 'manutencao',    'Revisão preventiva 140k km',         4730.00, v_hoje - 19),
    (v_transp_id, v_veiculo3_id, null,         null,        null,     'despesa', 'multa',         'Multa excesso velocidade BR-381',     293.47, v_hoje - 6),
    (v_transp_id, null,          null,         null,        null,     'receita', 'outros',        'Reembolso seguradora — sinistro',   2800.00, v_hoje - 5),
    (v_transp_id, v_veiculo4_id, null,         null,        null,     'despesa', 'combustivel',   'Abastecimento Iveco',                1950.00, v_hoje - 1);

  -- Alertas
  insert into public.alertas (transportadora_id, tipo, referencia_id, referencia_tipo,
                              titulo, descricao, data_alerta, status, prioridade)
  values
    (v_transp_id, 'cnh_vencimento',  v_motorista3_id, 'motorista',
     'CNH vencida — Roberto Almeida Costa',
     'CNH categoria E venceu há 15 dias. Motorista afastado até regularização.',
     v_hoje - 15, 'pendente', 'critico'),
    (v_transp_id, 'manutencao_data', v_veiculo3_id,   'veiculo',
     'Revisão Mercedes Actros GHI3F67 em 5 dias',
     'Próxima revisão programada para ' || to_char(v_hoje + 5, 'DD/MM/YYYY') || '.',
     v_hoje + 5,  'pendente', 'alto'),
    (v_transp_id, 'cnh_vencimento',  v_motorista2_id, 'motorista',
     'CNH a vencer — Carlos Eduardo Souza',
     'CNH vence em 20 dias. Providenciar renovação.',
     v_hoje + 20, 'pendente', 'medio'),
    (v_transp_id, 'licenciamento',   v_veiculo2_id,   'veiculo',
     'Licenciamento Volvo FH DEF2E45',
     'Licenciamento anual vence em 120 dias.',
     v_hoje + 120, 'pendente', 'baixo');

end $$;

-- =====================================================================
-- FIM
-- =====================================================================
