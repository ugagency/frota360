import { CheckCircle2, Route, DollarSign, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { KpiCard } from '@/components/dashboard/kpi-card'
import { formatCurrency, formatKm } from '@/lib/utils'

type ViagemPerf = {
  km_saida: number | null
  km_chegada: number | null
  valor_frete: number | null
  data_saida: string | null
  data_chegada_real: string | null
  status: string
}

export async function DesempenhoMotoristaTab({ motoristaId }: { motoristaId: string }) {
  const supabase = createClient()
  const { data } = await supabase
    .from('viagens')
    .select('km_saida, km_chegada, valor_frete, data_saida, data_chegada_real, status')
    .eq('motorista_id', motoristaId)
    .eq('status', 'concluida')
    .returns<ViagemPerf[]>()

  const viagens = data ?? []
  const total = viagens.length

  let kmTotal = 0, receita = 0, somaDias = 0, countDias = 0
  for (const v of viagens) {
    if (v.km_saida != null && v.km_chegada != null) {
      kmTotal += Number(v.km_chegada) - Number(v.km_saida)
    }
    if (v.valor_frete != null) receita += Number(v.valor_frete)
    if (v.data_saida && v.data_chegada_real) {
      const dias = (new Date(v.data_chegada_real).getTime() - new Date(v.data_saida).getTime()) / 86_400_000
      if (dias > 0) { somaDias += dias; countDias++ }
    }
  }
  const mediaDias = countDias > 0 ? somaDias / countDias : 0

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <KpiCard titulo="Viagens concluídas" valor={total}                       icone={CheckCircle2} variante="accent" />
      <KpiCard titulo="KM total rodado"    valor={formatKm(kmTotal)}           icone={Route}        variante="brand" />
      <KpiCard titulo="Receita gerada"     valor={formatCurrency(receita)}     icone={DollarSign}   variante="accent" />
      <KpiCard
        titulo="Tempo médio"
        valor={countDias > 0 ? `${mediaDias.toFixed(1)} d` : '—'}
        icone={Clock}
        variante="info"
        subtitulo={countDias > 0 ? `Base: ${countDias} viagens` : 'Sem dados'}
      />
    </div>
  )
}
