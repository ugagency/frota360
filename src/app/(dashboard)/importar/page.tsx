'use client'

import { Download, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function ImportarPage() {
  function baixarModelo(tipo: 'veiculos' | 'motoristas') {
    const modelos = {
      veiculos: {
        nome: 'modelo-veiculos.csv',
        conteudo: 'Placa;Tipo;Marca;Modelo;Ano;KM Atual\nABC-1234;Carreta;Scania;R450;2022;125000\nDEF-5678;Truck;Volvo;FH;2021;89000',
      },
      motoristas: {
        nome: 'modelo-motoristas.csv',
        conteudo: 'Nome;CPF;Telefone;Categoria CNH;Validade CNH\nJoão da Silva;000.000.000-00;(31)99999-9999;E;31/12/2026\nMaria Santos;111.111.111-11;(31)88888-8888;D;15/06/2027',
      },
    }
    const { nome, conteudo } = modelos[tipo]
    const blob = new Blob(['﻿' + conteudo], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = nome
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">Importar dados</h1>
          <p className="text-ink-secondary mt-1">
            Traga sua lista de caminhões e motoristas para o Frota 360 de uma vez.
          </p>
        </div>

        <div className="bg-app-subtle rounded-xl p-6 space-y-4">
          <p className="font-medium text-ink">Como importar em 3 passos:</p>
          <ol className="space-y-3 text-sm text-ink-secondary">
            <li className="flex gap-3">
              <span className="font-mono font-bold text-brand shrink-0">1.</span>
              Baixe o modelo de planilha (botões abaixo)
            </li>
            <li className="flex gap-3">
              <span className="font-mono font-bold text-brand shrink-0">2.</span>
              Preencha com os dados da sua frota — cada linha é um veículo ou motorista
            </li>
            <li className="flex gap-3">
              <span className="font-mono font-bold text-brand shrink-0">3.</span>
              Envie a planilha pelo WhatsApp — fazemos a importação para você gratuitamente
            </li>
          </ol>
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => baixarModelo('veiculos')}
          >
            <Download className="h-5 w-5" />
            <span className="font-medium">Modelo de veículos</span>
            <span className="text-xs text-ink-muted font-normal">Placa, marca, modelo, ano, KM</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex-col gap-2"
            onClick={() => baixarModelo('motoristas')}
          >
            <Download className="h-5 w-5" />
            <span className="font-medium">Modelo de motoristas</span>
            <span className="text-xs text-ink-muted font-normal">Nome, CPF, CNH, categoria, validade</span>
          </Button>
        </div>

        <a
          href="https://wa.me/5531975142675?text=Ol%C3%A1!%20Quero%20importar%20minha%20planilha%20de%20frota%20para%20o%20Frota%20360."
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button className="w-full bg-brand hover:bg-brand-dark text-white" size="lg">
            <MessageCircle className="h-5 w-5 mr-2" />
            Enviar planilha pelo WhatsApp
          </Button>
        </a>

        <p className="text-xs text-center text-ink-muted">
          Também aceitamos Excel (.xlsx) e CSV. Respondemos em até 24 horas úteis.
        </p>
      </div>
    </div>
  )
}
