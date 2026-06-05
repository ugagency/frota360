-- Sprint 14: múltiplos destinos + distância estimada nas viagens

ALTER TABLE viagens
  ADD COLUMN IF NOT EXISTS destinos jsonb DEFAULT '[]'::jsonb;
-- Array ordenado de paradas:
-- [{ "ordem": 1, "cidade": "São Paulo/SP", "cidade_label": "São Paulo - SP", "observacao": "" }, ...]

ALTER TABLE viagens
  ADD COLUMN IF NOT EXISTS distancia_km integer;

CREATE INDEX IF NOT EXISTS idx_viagens_origem
  ON viagens(transportadora_id, origem);

CREATE INDEX IF NOT EXISTS idx_viagens_distancia
  ON viagens(transportadora_id, distancia_km)
  WHERE distancia_km IS NOT NULL;
