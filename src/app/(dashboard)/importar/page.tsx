import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ImportacaoWizard } from '@/components/importacao/importacao-wizard'

export default function ImportarPage() {
  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      <h1 className="font-display text-2xl font-bold text-ink mb-1">Importar dados</h1>
      <p className="text-ink-secondary text-sm mb-6">
        Importe sua frota, motoristas e clientes de uma planilha ou foto de lista.
      </p>

      <Tabs defaultValue="veiculos">
        <TabsList className="mb-6">
          <TabsTrigger value="veiculos">Veículos</TabsTrigger>
          <TabsTrigger value="motoristas">Motoristas</TabsTrigger>
          <TabsTrigger value="clientes">Clientes</TabsTrigger>
        </TabsList>

        <TabsContent value="veiculos">
          <ImportacaoWizard entidade="veiculos" />
        </TabsContent>
        <TabsContent value="motoristas">
          <ImportacaoWizard entidade="motoristas" />
        </TabsContent>
        <TabsContent value="clientes">
          <ImportacaoWizard entidade="clientes" />
        </TabsContent>
      </Tabs>
    </div>
  )
}
