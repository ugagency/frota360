// =============================================================
// STUB temporário — formato compatível com postgrest-js inference.
// Substituir pelo arquivo real assim que o schema for aplicado:
//   npx supabase gen types typescript --project-id SEU_ID > src/types/database.types.ts
// =============================================================

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      transportadoras: {
        Row: {
          id: string
          nome: string
          cnpj: string | null
          telefone: string | null
          cidade: string | null
          estado: string | null
          plano: string
          plano_status: string
          trial_ends_at: string | null
          config: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          nome: string
          cnpj?: string | null
          telefone?: string | null
          cidade?: string | null
          estado?: string | null
          plano?: string
          plano_status?: string
          trial_ends_at?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nome?: string
          cnpj?: string | null
          telefone?: string | null
          cidade?: string | null
          estado?: string | null
          plano?: string
          plano_status?: string
          trial_ends_at?: string | null
          config?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      usuarios_transportadoras: {
        Row: {
          id: string
          user_id: string
          transportadora_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          transportadora_id: string
          role?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          transportadora_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'usuarios_transportadoras_transportadora_id_fkey'
            columns: ['transportadora_id']
            isOneToOne: false
            referencedRelation: 'transportadoras'
            referencedColumns: ['id']
          },
        ]
      }
      veiculos: {
        Row: {
          id: string
          transportadora_id: string
          placa: string
          tipo: string
          marca: string | null
          modelo: string | null
          ano: number | null
          cor: string | null
          renavam: string | null
          chassi: string | null
          km_atual: number
          km_proxima_revisao: number | null
          data_proxima_revisao: string | null
          data_licenciamento: string | null
          status: string
          proprietario: string
          foto_url: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          placa: string
          tipo: string
          marca?: string | null
          modelo?: string | null
          ano?: number | null
          cor?: string | null
          renavam?: string | null
          chassi?: string | null
          km_atual?: number
          km_proxima_revisao?: number | null
          data_proxima_revisao?: string | null
          data_licenciamento?: string | null
          status?: string
          proprietario?: string
          foto_url?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          placa?: string
          tipo?: string
          marca?: string | null
          modelo?: string | null
          ano?: number | null
          cor?: string | null
          renavam?: string | null
          chassi?: string | null
          km_atual?: number
          km_proxima_revisao?: number | null
          data_proxima_revisao?: string | null
          data_licenciamento?: string | null
          status?: string
          proprietario?: string
          foto_url?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'veiculos_transportadora_id_fkey'
            columns: ['transportadora_id']
            isOneToOne: false
            referencedRelation: 'transportadoras'
            referencedColumns: ['id']
          },
        ]
      }
      motoristas: {
        Row: {
          id: string
          transportadora_id: string
          nome: string
          cpf: string
          telefone: string | null
          cnh_numero: string | null
          cnh_categoria: string | null
          cnh_validade: string | null
          mopp_validade: string | null
          nr_validade: string | null
          tipo: string
          status: string
          foto_url: string | null
          documentos: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          nome: string
          cpf: string
          telefone?: string | null
          cnh_numero?: string | null
          cnh_categoria?: string | null
          cnh_validade?: string | null
          mopp_validade?: string | null
          nr_validade?: string | null
          tipo?: string
          status?: string
          foto_url?: string | null
          documentos?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          nome?: string
          cpf?: string
          telefone?: string | null
          cnh_numero?: string | null
          cnh_categoria?: string | null
          cnh_validade?: string | null
          mopp_validade?: string | null
          nr_validade?: string | null
          tipo?: string
          status?: string
          foto_url?: string | null
          documentos?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'motoristas_transportadora_id_fkey'
            columns: ['transportadora_id']
            isOneToOne: false
            referencedRelation: 'transportadoras'
            referencedColumns: ['id']
          },
        ]
      }
      viagens: {
        Row: {
          id: string
          transportadora_id: string
          veiculo_id: string
          motorista_id: string
          numero: string
          origem: string
          destino: string
          cliente: string | null
          tipo_carga: string | null
          peso_ton: number | null
          valor_frete: number | null
          valor_adiantamento: number
          km_saida: number | null
          km_chegada: number | null
          data_saida: string | null
          data_chegada: string | null
          data_chegada_real: string | null
          status: string
          cte_numero: string | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          veiculo_id: string
          motorista_id: string
          numero: string
          origem: string
          destino: string
          cliente?: string | null
          tipo_carga?: string | null
          peso_ton?: number | null
          valor_frete?: number | null
          valor_adiantamento?: number
          km_saida?: number | null
          km_chegada?: number | null
          data_saida?: string | null
          data_chegada?: string | null
          data_chegada_real?: string | null
          status?: string
          cte_numero?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          veiculo_id?: string
          motorista_id?: string
          numero?: string
          origem?: string
          destino?: string
          cliente?: string | null
          tipo_carga?: string | null
          peso_ton?: number | null
          valor_frete?: number | null
          valor_adiantamento?: number
          km_saida?: number | null
          km_chegada?: number | null
          data_saida?: string | null
          data_chegada?: string | null
          data_chegada_real?: string | null
          status?: string
          cte_numero?: string | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'viagens_transportadora_id_fkey'
            columns: ['transportadora_id']
            isOneToOne: false
            referencedRelation: 'transportadoras'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viagens_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'viagens_motorista_id_fkey'
            columns: ['motorista_id']
            isOneToOne: false
            referencedRelation: 'motoristas'
            referencedColumns: ['id']
          },
        ]
      }
      manutencoes: {
        Row: {
          id: string
          transportadora_id: string
          veiculo_id: string
          tipo: string
          descricao: string
          oficina: string | null
          mecanico: string | null
          km_na_manutencao: number | null
          km_proxima: number | null
          data_entrada: string
          data_saida: string | null
          data_proxima: string | null
          status: string
          itens: Json
          valor_total: number
          laudo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          veiculo_id: string
          tipo: string
          descricao: string
          oficina?: string | null
          mecanico?: string | null
          km_na_manutencao?: number | null
          km_proxima?: number | null
          data_entrada: string
          data_saida?: string | null
          data_proxima?: string | null
          status?: string
          itens?: Json
          valor_total?: number
          laudo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          veiculo_id?: string
          tipo?: string
          descricao?: string
          oficina?: string | null
          mecanico?: string | null
          km_na_manutencao?: number | null
          km_proxima?: number | null
          data_entrada?: string
          data_saida?: string | null
          data_proxima?: string | null
          status?: string
          itens?: Json
          valor_total?: number
          laudo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'manutencoes_transportadora_id_fkey'
            columns: ['transportadora_id']
            isOneToOne: false
            referencedRelation: 'transportadoras'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'manutencoes_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
        ]
      }
      lancamentos_financeiros: {
        Row: {
          id: string
          transportadora_id: string
          veiculo_id: string | null
          viagem_id: string | null
          manutencao_id: string | null
          motorista_id: string | null
          tipo: string
          categoria: string
          descricao: string
          valor: number
          data: string
          comprovante_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          veiculo_id?: string | null
          viagem_id?: string | null
          manutencao_id?: string | null
          motorista_id?: string | null
          tipo: string
          categoria: string
          descricao: string
          valor: number
          data: string
          comprovante_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          veiculo_id?: string | null
          viagem_id?: string | null
          manutencao_id?: string | null
          motorista_id?: string | null
          tipo?: string
          categoria?: string
          descricao?: string
          valor?: number
          data?: string
          comprovante_url?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lancamentos_financeiros_transportadora_id_fkey'
            columns: ['transportadora_id']
            isOneToOne: false
            referencedRelation: 'transportadoras'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lancamentos_financeiros_veiculo_id_fkey'
            columns: ['veiculo_id']
            isOneToOne: false
            referencedRelation: 'veiculos'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lancamentos_financeiros_viagem_id_fkey'
            columns: ['viagem_id']
            isOneToOne: false
            referencedRelation: 'viagens'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lancamentos_financeiros_manutencao_id_fkey'
            columns: ['manutencao_id']
            isOneToOne: false
            referencedRelation: 'manutencoes'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lancamentos_financeiros_motorista_id_fkey'
            columns: ['motorista_id']
            isOneToOne: false
            referencedRelation: 'motoristas'
            referencedColumns: ['id']
          },
        ]
      }
      alertas: {
        Row: {
          id: string
          transportadora_id: string
          tipo: string
          referencia_id: string
          referencia_tipo: string
          titulo: string
          descricao: string | null
          data_alerta: string
          status: string
          prioridade: string
          created_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          tipo: string
          referencia_id: string
          referencia_tipo: string
          titulo: string
          descricao?: string | null
          data_alerta: string
          status?: string
          prioridade?: string
          created_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          tipo?: string
          referencia_id?: string
          referencia_tipo?: string
          titulo?: string
          descricao?: string | null
          data_alerta?: string
          status?: string
          prioridade?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'alertas_transportadora_id_fkey'
            columns: ['transportadora_id']
            isOneToOne: false
            referencedRelation: 'transportadoras'
            referencedColumns: ['id']
          },
        ]
      }
      clientes: {
        Row: {
          id: string
          transportadora_id: string
          razao_social: string
          cnpj: string | null
          telefone: string | null
          email: string | null
          cidade: string | null
          estado: string | null
          status: string
          segmento: string | null
          proxima_acao: string | null
          valor_mensal_est: number | null
          prazo_pagamento: number
          notas_internas: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          razao_social: string
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          cidade?: string | null
          estado?: string | null
          status?: string
          segmento?: string | null
          proxima_acao?: string | null
          valor_mensal_est?: number | null
          prazo_pagamento?: number
          notas_internas?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          razao_social?: string
          cnpj?: string | null
          telefone?: string | null
          email?: string | null
          cidade?: string | null
          estado?: string | null
          status?: string
          segmento?: string | null
          proxima_acao?: string | null
          valor_mensal_est?: number | null
          prazo_pagamento?: number
          notas_internas?: string | null
          created_at?: string
        }
        Relationships: []
      }
      crm_interacoes: {
        Row: {
          id: string
          transportadora_id: string
          cliente_id: string
          criado_por: string | null
          tipo: string
          titulo: string
          descricao: string | null
          data_interacao: string
          proximo_contato: string | null
          created_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          cliente_id: string
          criado_por?: string | null
          tipo: string
          titulo: string
          descricao?: string | null
          data_interacao?: string
          proximo_contato?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          cliente_id?: string
          criado_por?: string | null
          tipo?: string
          titulo?: string
          descricao?: string | null
          data_interacao?: string
          proximo_contato?: string | null
          created_at?: string
        }
        Relationships: []
      }
      crm_contratos: {
        Row: {
          id: string
          transportadora_id: string
          cliente_id: string
          titulo: string
          status: string
          data_inicio: string | null
          data_fim: string | null
          prazo_pagamento: number
          valor_por_km: number | null
          valor_minimo_frete: number | null
          rotas_cobertas: string | null
          observacoes: string | null
          arquivo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          cliente_id: string
          titulo: string
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
          prazo_pagamento?: number
          valor_por_km?: number | null
          valor_minimo_frete?: number | null
          rotas_cobertas?: string | null
          observacoes?: string | null
          arquivo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          cliente_id?: string
          titulo?: string
          status?: string
          data_inicio?: string | null
          data_fim?: string | null
          prazo_pagamento?: number
          valor_por_km?: number | null
          valor_minimo_frete?: number | null
          rotas_cobertas?: string | null
          observacoes?: string | null
          arquivo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      importacoes: {
        Row: {
          id: string
          transportadora_id: string
          criado_por: string | null
          entidade: string
          total_linhas: number
          importados: number
          erros: number
          created_at: string
        }
        Insert: {
          id?: string
          transportadora_id: string
          criado_por?: string | null
          entidade: string
          total_linhas?: number
          importados?: number
          erros?: number
          created_at?: string
        }
        Update: {
          id?: string
          transportadora_id?: string
          criado_por?: string | null
          entidade?: string
          total_linhas?: number
          importados?: number
          erros?: number
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_transportadora_id_do_usuario: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_membros_transportadora: {
        Args: { p_transportadora_id: string }
        Returns: Array<{
          user_id: string
          role: string
          email: string
          nome: string
          created_at: string
        }>
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
