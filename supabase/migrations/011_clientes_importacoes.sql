-- Tabela de clientes (embarcadores/tomadores de frete)
CREATE TABLE IF NOT EXISTS clientes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transportadora_id uuid NOT NULL REFERENCES transportadoras(id) ON DELETE CASCADE,
  razao_social      text NOT NULL,
  cnpj              text,
  telefone          text,
  email             text,
  cidade            text,
  estado            text,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "clientes_tenant" ON clientes
  FOR ALL USING (transportadora_id = get_transportadora_id_do_usuario())
  WITH CHECK (transportadora_id = get_transportadora_id_do_usuario());

-- Log de importações em massa (auditoria)
CREATE TABLE IF NOT EXISTS importacoes (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transportadora_id uuid NOT NULL REFERENCES transportadoras(id) ON DELETE CASCADE,
  criado_por        uuid REFERENCES auth.users(id),
  entidade          text NOT NULL CHECK (entidade IN ('veiculos', 'motoristas', 'clientes')),
  total_linhas      integer NOT NULL DEFAULT 0,
  importados        integer NOT NULL DEFAULT 0,
  erros             integer NOT NULL DEFAULT 0,
  created_at        timestamptz DEFAULT now()
);

ALTER TABLE importacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "importacoes_tenant" ON importacoes
  FOR ALL USING (transportadora_id = get_transportadora_id_do_usuario())
  WITH CHECK (transportadora_id = get_transportadora_id_do_usuario());
