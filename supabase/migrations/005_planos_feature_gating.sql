-- ============================================================
-- Sprint 13 · Planos revisados + Feature Gating
-- Demo 7d · Básico R$197,90 (c/ Manutenção) · Pro R$447
-- ============================================================

-- 1. Atualizar enum de plano
-- Remove tanto o constraint nomeado quanto o gerado automaticamente pelo Postgres
ALTER TABLE transportadoras DROP CONSTRAINT IF EXISTS chk_plano;
ALTER TABLE transportadoras DROP CONSTRAINT IF EXISTS transportadoras_plano_check;

-- Migrar valores antigos antes de adicionar o novo constraint
UPDATE transportadoras SET plano = 'profissional' WHERE plano = 'pro';
UPDATE transportadoras SET plano = 'basico'       WHERE plano = 'starter';
-- Qualquer valor inesperado vira demo
UPDATE transportadoras SET plano = 'demo'
  WHERE plano NOT IN ('demo', 'basico', 'profissional');

ALTER TABLE transportadoras ALTER COLUMN plano SET DEFAULT 'demo';
ALTER TABLE transportadoras ADD CONSTRAINT chk_plano
  CHECK (plano IN ('demo', 'basico', 'profissional'));

-- 2. Campos de controle de período
ALTER TABLE transportadoras
  ADD COLUMN IF NOT EXISTS plano_inicio    date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS plano_validade  date;

-- 3. Trigger: define validade do demo automaticamente
CREATE OR REPLACE FUNCTION set_demo_validade()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.plano = 'demo' AND NEW.plano_validade IS NULL THEN
    NEW.plano_validade := NEW.plano_inicio + INTERVAL '7 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_demo_validade ON transportadoras;
CREATE TRIGGER trg_set_demo_validade
  BEFORE INSERT OR UPDATE ON transportadoras
  FOR EACH ROW EXECUTE FUNCTION set_demo_validade();

-- Inicializar contas existentes como demo com 7 dias a partir de hoje
UPDATE transportadoras
  SET plano_inicio   = CURRENT_DATE,
      plano_validade = CURRENT_DATE + INTERVAL '7 days'
  WHERE plano = 'demo' AND plano_validade IS NULL;

-- 4. Seguro obrigatório — Feature 1 (Pro)
ALTER TABLE veiculos
  ADD COLUMN IF NOT EXISTS seguro_apolice    text,
  ADD COLUMN IF NOT EXISTS seguro_seguradora text,
  ADD COLUMN IF NOT EXISTS seguro_validade   date;

-- 5. Categoria de veículo para benchmark de custo/KM — Feature 4 (Pro)
ALTER TABLE veiculos
  ADD COLUMN IF NOT EXISTS categoria_veiculo text DEFAULT 'pesado';

ALTER TABLE veiculos
  DROP CONSTRAINT IF EXISTS chk_categoria_veiculo;
ALTER TABLE veiculos
  ADD CONSTRAINT chk_categoria_veiculo
  CHECK (categoria_veiculo IN ('leve', 'medio', 'pesado', 'extra_pesado'));

-- 6. Campos fiscais nas viagens — Feature 5 (Pro)
ALTER TABLE viagens
  ADD COLUMN IF NOT EXISTS cte_chave   text,
  ADD COLUMN IF NOT EXISTS cte_status  text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS mdfe_numero text,
  ADD COLUMN IF NOT EXISTS mdfe_chave  text,
  ADD COLUMN IF NOT EXISTS mdfe_status text DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS ciot_codigo text;

ALTER TABLE viagens
  DROP CONSTRAINT IF EXISTS chk_cte_status,
  DROP CONSTRAINT IF EXISTS chk_mdfe_status;
ALTER TABLE viagens
  ADD CONSTRAINT chk_cte_status  CHECK (cte_status  IN ('pendente', 'emitido', 'cancelado')),
  ADD CONSTRAINT chk_mdfe_status CHECK (mdfe_status IN ('pendente', 'emitido', 'encerrado', 'cancelado'));

-- 7. Tipos de alerta adicionais
ALTER TABLE alertas DROP CONSTRAINT IF EXISTS chk_tipo_alerta;
ALTER TABLE alertas ADD CONSTRAINT chk_tipo_alerta
  CHECK (tipo IN (
    'manutencao_km', 'manutencao_data', 'cnh_vencimento', 'mopp_vencimento', 'licenciamento',
    'seguro_vencimento', 'mdfe_nao_encerrado', 'checklist'
  ));

-- 8. Tabela de checklists — Feature 3 (Pro)
CREATE TABLE IF NOT EXISTS checklists (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transportadora_id uuid NOT NULL REFERENCES transportadoras(id) ON DELETE CASCADE,
  veiculo_id        uuid NOT NULL REFERENCES veiculos(id)        ON DELETE CASCADE,
  motorista_id      uuid             REFERENCES motoristas(id)   ON DELETE SET NULL,
  tipo              text NOT NULL DEFAULT 'saida',
  data_realizacao   timestamptz NOT NULL DEFAULT now(),
  itens             jsonb NOT NULL DEFAULT '[]',
  observacao_geral  text,
  status_geral      text NOT NULL DEFAULT 'aprovado',
  criado_por        uuid REFERENCES auth.users(id),
  created_at        timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT chk_tipo_checklist   CHECK (tipo IN ('saida', 'chegada')),
  CONSTRAINT chk_status_checklist CHECK (status_geral IN ('aprovado', 'reprovado', 'com_ressalvas'))
);

ALTER TABLE checklists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "checklists_tenant" ON checklists
  FOR ALL USING (transportadora_id = get_transportadora_id_do_usuario())
  WITH CHECK (transportadora_id = get_transportadora_id_do_usuario());

CREATE INDEX IF NOT EXISTS idx_checklists_tid    ON checklists(transportadora_id);
CREATE INDEX IF NOT EXISTS idx_checklists_veiculo ON checklists(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_checklists_data    ON checklists(data_realizacao DESC);
