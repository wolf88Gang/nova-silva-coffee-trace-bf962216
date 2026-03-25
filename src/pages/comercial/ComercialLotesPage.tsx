/**
 * Comercial > Lotes — Demo-aware commercial lots and exports page.
 */
import { DemoBadge } from '@/components/common/DemoBadge';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { getDemoLotesComerciales, getDemoExportaciones } from '@/lib/demoSeedData';
import { Package, Ship, Globe, FileText } from 'lucide-react';

export default function ComercialLotesPage() {
  const lotes = getDemoLotesComerciales();
  const exportaciones = getDemoExportaciones();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Lotes y exportaciones" description="Gestión de lotes comerciales y embarques" />
        <DemoBadge />
      </div>

      {/* KPIs */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Package className="h-5 w-5 text-primary" /><div><p className="text-2xl font-bold">{lotes.length}</p><p className="text-xs text-muted-foreground">Lotes comerciales</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Ship className="h-5 w-5 text-accent" /><div><p className="text-2xl font-bold">{exportaciones.length}</p><p className="text-xs text-muted-foreground">Embarques</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><Globe className="h-5 w-5 text-warning" /><div><p className="text-2xl font-bold">{new Set(exportaciones.map(e => e.destino)).size}</p><p className="text-xs text-muted-foreground">Destinos</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-5"><div className="flex items-center gap-3"><FileText className="h-5 w-5 text-muted-foreground" /><div><p className="text-2xl font-bold">{exportaciones.filter(e => e.documentacion === 'Completa').length}</p><p className="text-xs text-muted-foreground">Docs completa</p></div></div></CardContent></Card>
      </div>

      <Tabs defaultValue="lotes">
        <TabsList>
          <TabsTrigger value="lotes">Lotes ({lotes.length})</TabsTrigger>
          <TabsTrigger value="exportaciones">Exportaciones ({exportaciones.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="lotes" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Origen</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Volumen</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">Calidad</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                      <th className="text-center py-3 px-4 text-muted-foreground font-medium">EUDR</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotes.map(l => (
                      <tr key={l.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{l.codigo}</td>
                        <td className="py-3 px-4 text-muted-foreground">{l.origen}</td>
                        <td className="py-3 px-4">{l.volumen}</td>
                        <td className="py-3 px-4 text-center">{l.calidad}</td>
                        <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{l.estado}</Badge></td>
                        <td className="py-3 px-4 text-center"><Badge variant={l.eudr === 'Verde' ? 'default' : l.eudr === 'Rojo' ? 'destructive' : 'secondary'} className="text-xs">{l.eudr}</Badge></td>
                        <td className="py-3 px-4 text-muted-foreground">{l.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="exportaciones" className="mt-4">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Código</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Destino</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Volumen</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Lote</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Estado</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Documentación</th>
                      <th className="text-left py-3 px-4 text-muted-foreground font-medium">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportaciones.map(e => (
                      <tr key={e.id} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-3 px-4 font-medium">{e.codigo}</td>
                        <td className="py-3 px-4">{e.destino}</td>
                        <td className="py-3 px-4">{e.volumen}</td>
                        <td className="py-3 px-4 text-muted-foreground">{e.lote}</td>
                        <td className="py-3 px-4"><Badge variant="outline" className="text-xs">{e.estado}</Badge></td>
                        <td className="py-3 px-4"><Badge variant={e.documentacion === 'Completa' ? 'default' : 'secondary'} className="text-xs">{e.documentacion}</Badge></td>
                        <td className="py-3 px-4 text-muted-foreground">{e.fecha}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
