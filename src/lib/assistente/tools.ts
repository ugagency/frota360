// Function declarations para o Gemini.
// Os types usam strings UPPERCASE conforme exigido pela API Gemini.

export const functionDeclarations = [
  {
    name: 'resumo_operacao',
    description:
      'Retorna um resumo geral da operação de hoje: veículos por status, viagens em andamento, alertas críticos, financeiro do mês.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'listar_veiculos',
    description: 'Lista veículos da frota com filtros opcionais por status, tipo ou proprietário.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: {
          type: 'STRING',
          description: 'Filtro de status. Omitir = todos.',
          enum: ['ativo', 'em_viagem', 'em_manutencao', 'inativo'],
        },
        tipo: {
          type: 'STRING',
          description: 'Filtro de tipo do veículo.',
          enum: ['truck', 'bitruck', 'carreta', 'vanderleia', 'outros'],
        },
        proprietario: {
          type: 'STRING',
          description: 'Filtro: proprio ou agregado.',
          enum: ['proprio', 'agregado'],
        },
      },
    },
  },
  {
    name: 'detalhes_veiculo',
    description:
      'Retorna detalhes completos de um veículo específico incluindo KM, status, próxima manutenção e alertas ativos. Busca por placa.',
    parameters: {
      type: 'OBJECT',
      properties: {
        placa: { type: 'STRING', description: 'Placa do veículo (ex.: ABC-1234 ou ABC1D23).' },
      },
      required: ['placa'],
    },
  },
  {
    name: 'listar_motoristas',
    description: 'Lista motoristas com filtros opcionais. Inclui status de CNH e MOPP.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: ['ativo', 'afastado', 'inativo'] },
        documentos_vencendo: {
          type: 'BOOLEAN',
          description:
            'Se true, retorna apenas motoristas com CNH ou MOPP vencendo nos próximos 60 dias.',
        },
      },
    },
  },
  {
    name: 'listar_viagens',
    description: 'Lista viagens com filtros por status, período, motorista ou veículo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: ['planejada', 'em_andamento', 'concluida', 'cancelada'] },
        periodo_inicio: { type: 'STRING', description: 'Data início no formato YYYY-MM-DD.' },
        periodo_fim: { type: 'STRING', description: 'Data fim no formato YYYY-MM-DD.' },
        placa_veiculo: { type: 'STRING', description: 'Placa do veículo.' },
        nome_motorista: { type: 'STRING', description: 'Nome parcial do motorista.' },
        limite: { type: 'INTEGER', description: 'Máximo de resultados. Padrão 10, máximo 50.' },
      },
    },
  },
  {
    name: 'listar_manutencoes',
    description: 'Lista manutenções com filtros por status, tipo ou veículo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: ['agendada', 'em_andamento', 'concluida'] },
        tipo: { type: 'STRING', enum: ['preventiva', 'corretiva'] },
        placa_veiculo: { type: 'STRING', description: 'Placa do veículo.' },
        limite: { type: 'INTEGER', description: 'Máximo de resultados. Padrão 10.' },
      },
    },
  },
  {
    name: 'resumo_financeiro',
    description:
      'Retorna resumo financeiro: receita, despesa, resultado e breakdown por categoria. Filtrável por período e veículo.',
    parameters: {
      type: 'OBJECT',
      properties: {
        periodo_inicio: { type: 'STRING', description: 'YYYY-MM-DD' },
        periodo_fim: { type: 'STRING', description: 'YYYY-MM-DD' },
        placa_veiculo: { type: 'STRING', description: 'Se informada, filtra lançamentos desse veículo.' },
      },
    },
  },
  {
    name: 'custo_por_veiculo',
    description:
      'Retorna tabela de custos por veículo: combustível, manutenção, pedágio, multas, outros, total, KM rodados, custo/KM. Filtrável por período.',
    parameters: {
      type: 'OBJECT',
      properties: {
        periodo_inicio: { type: 'STRING', description: 'YYYY-MM-DD' },
        periodo_fim: { type: 'STRING', description: 'YYYY-MM-DD' },
      },
    },
  },
  {
    name: 'listar_alertas',
    description: 'Lista alertas pendentes ordenados por prioridade.',
    parameters: {
      type: 'OBJECT',
      properties: {
        status: { type: 'STRING', enum: ['pendente', 'visualizado', 'resolvido'] },
        prioridade: { type: 'STRING', enum: ['critico', 'alto', 'medio', 'baixo'] },
        tipo: {
          type: 'STRING',
          enum: [
            'manutencao_km',
            'manutencao_data',
            'cnh_vencimento',
            'mopp_vencimento',
            'licenciamento',
          ],
        },
      },
    },
  },
  {
    name: 'ranking_motoristas',
    description:
      'Ranking de motoristas por critério (viagens, km rodados ou frete gerado). Filtrável por período.',
    parameters: {
      type: 'OBJECT',
      properties: {
        criterio: { type: 'STRING', enum: ['viagens', 'km_rodados', 'frete_gerado'] },
        periodo_inicio: { type: 'STRING', description: 'YYYY-MM-DD' },
        periodo_fim: { type: 'STRING', description: 'YYYY-MM-DD' },
        limite: { type: 'INTEGER', description: 'Top N. Padrão 5.' },
      },
      required: ['criterio'],
    },
  },
] as const

export type FunctionName = (typeof functionDeclarations)[number]['name']
