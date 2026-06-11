export function mensagemAmigavel(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error)

  if (msg.includes('duplicate') || msg.includes('already exists') || msg.includes('unique'))
    return 'Este registro já existe no sistema.'

  if (msg.includes('foreign key') || msg.includes('violates') || msg.includes('referenced'))
    return 'Este registro não pode ser excluído pois está vinculado a outros dados.'

  if (msg.includes('timeout') || msg.includes('Connection closed') || msg.includes('ETIMEDOUT'))
    return 'Serviço indisponível. Tente novamente em instantes.'

  if (msg.includes('not found') || msg.includes('Not Found'))
    return 'Registro não encontrado.'

  if (msg.includes('permission') || msg.includes('RLS') || msg.includes('policy'))
    return 'Você não tem permissão para realizar esta ação.'

  if (msg.includes('Expected') || msg.includes('ZodError') || msg.includes('received'))
    return 'Verifique os campos obrigatórios e tente novamente.'

  if (msg.includes('JWT') || msg.includes('token') || msg.includes('session'))
    return 'Sessão expirada. Faça login novamente.'

  return 'Ocorreu um erro. Verifique os campos e tente novamente.'
}
