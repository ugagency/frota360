-- Migration 012: CRM de Clientes
-- Adiciona campos CRM à tabela clientes e cria crm_interacoes + crm_contratos

ALTER TABLE clientes
  ADD COLUMN IF NOT EXISTS status           text DEFAULT 'ativo'
    CHECK (status IN ('prospect','ativo','inativo','suspenso')),
  ADD COLUMN IF NOT EXISTS segmento         text,
  ADD COLUMN IF NOT EXISTS proxima_acao     date,
  ADD COLUMN IF NOT EXISTS valor_mensal_est numeric(12,2),
  ADD COLUMN IF NOT EXISTS prazo_pagamento  integer DEFAULT 30,
  ADD COLUMN IF NOT EXISTS notas_internas   text;

-- ─── Interações com clientes ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_interacoes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transportadora_id uuid NOT NULL REFERENCES transportadoras(id) ON DELETE CASCADE,
  cliente_id        uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  criado_por        uuid REFERENCES auth.users(id),
  tipo              text NOT NULL CHECK (tipo IN ('ligacao','email','visita','proposta','outro')),
  titulo            text NOT NULL,
  descricao         text,
  data_interacao    date NOT NULL DEFAULT CURRENT_DATE,
  proximo_contato   date,
  created_at        timestamptz DEFAULT now()
);

-- ─── Contratos comerciais ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS crm_contratos (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transportadora_id   uuid NOT NULL REFERENCES transportadoras(id) ON DELETE CASCADE,
  cliente_id          uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  titulo              text NOT NULL,
  status              text DEFAULT 'vigente' CHECK (status IN ('vigente','encerrado','em_negociacao')),
  data_inicio         date,
  data_fim            date,
  prazo_pagamento     integer DEFAULT 30,
  valor_por_km        numeric(8,2),
  valor_minimo_frete  numeric(10,2),
  rotas_cobertas      text,
  observacoes         text,
  arquivo_url         text,
  created_at          timestamptz DEFAULT now(),
  updated_at          timestamptz DEFAULT now()
);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE crm_interacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_contratos  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_interacoes_tenant" ON crm_interacoes
  FOR ALL USING (transportadora_id = get_transportadora_id_do_usuario())
  WITH CHECK (transportadora_id = get_transportadora_id_do_usuario());

CREATE POLICY "crm_contratos_tenant" ON crm_contratos
  FOR ALL USING (transportadora_id = get_transportadora_id_do_usuario())
  WITH CHECK (transportadora_id = get_transportadora_id_do_usuario());

-- ─── Índices ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS crm_interacoes_tid_cid ON crm_interacoes(transportadora_id, cliente_id, data_interacao DESC);
CREATE INDEX IF NOT EXISTS crm_contratos_tid_cid  ON crm_contratos(transportadora_id, cliente_id);
CREATE INDEX IF NOT EXISTS clientes_tid_status     ON clientes(transportadora_id, status);
CREATE INDEX IF NOT EXISTS clientes_tid_proxima    ON clientes(transportadora_id, proxima_acao) WHERE proxima_acao IS NOT NULL;
