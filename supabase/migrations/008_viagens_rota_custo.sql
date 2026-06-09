-- Sprint 14 Revisada: adicionar colunas de custo e duração estimados na viagem
ALTER TABLE viagens
  ADD COLUMN IF NOT EXISTS custo_estimado      numeric(10,2),
  ADD COLUMN IF NOT EXISTS duracao_estimada_min integer;

-- Índice para consultas de benchmark de custo/km por veículo
CREATE INDEX IF NOT EXISTS idx_viagens_custo
  ON viagens(veiculo_id, status)
  WHERE status = 'concluida' AND distancia_km IS NOT NULL;
