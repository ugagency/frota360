import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { ViagemForm } from '@/components/viagens/viagem-form'
import type { VeiculoOption, MotoristaOption } from '@/components/viagens/viagem-preview-panel'

export const dynamic = 'force-dynamic'

export default async function NovaViagemPage() {
  const supabase = createClient()

  const [veiculos, motoristas] = await Promise.all([
    supabase
      .from('veiculos')
      .select('id, placa, modelo, km_atual')
      .eq('status', 'ativo')
      .order('placa')
      .returns<VeiculoOption[]>(),
    supabase
      .from('motoristas')
      .select('id, nome, cnh_categoria, cnh_validade')
      .eq('status', 'ativo')
      .order('nome')
      .returns<MotoristaOption[]>(),
  ])

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-xs text-ink-muted">
        <Link href="/viagens" className="hover:text-ink">Viagens</Link>
        <ChevronRight size={12} />
        <span className="text-ink">Nova viagem</span>
      </nav>

      <header>
        <h1 className="font-display text-3xl font-semibold text-ink leading-none">Nova viagem</h1>
        <p className="mt-1.5 text-sm text-ink-muted">
          Ao abrir, o veículo entra em <strong>Em viagem</strong> e os lançamentos de frete + adiantamento são criados automaticamente.
        </p>
      </header>

      <ViagemForm veiculos={veiculos.data ?? []} motoristas={motoristas.data ?? []} />
    </div>
  )
}
