-- Expõe nome e email dos membros de uma transportadora sem acesso direto a auth.users
CREATE OR REPLACE FUNCTION get_membros_transportadora(p_transportadora_id uuid)
RETURNS TABLE (
  user_id   uuid,
  role      text,
  email     text,
  nome      text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM usuarios_transportadoras
    WHERE transportadora_id = p_transportadora_id
    AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  RETURN QUERY
  SELECT
    ut.user_id,
    ut.role,
    au.email,
    COALESCE(au.raw_user_meta_data->>'nome', SPLIT_PART(au.email, '@', 1)) AS nome,
    ut.created_at
  FROM usuarios_transportadoras ut
  JOIN auth.users au ON au.id = ut.user_id
  WHERE ut.transportadora_id = p_transportadora_id
  ORDER BY ut.created_at;
END;
$$;
