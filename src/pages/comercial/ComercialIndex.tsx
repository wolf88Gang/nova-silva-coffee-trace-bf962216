import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Package, FileText, Coffee, ArrowRight, Ship } from 'lucide-react';
import { getDemoLotesComerciales, getDemoExportaciones } from '@/lib/demoSeedData';

const estadoColor: Record<string, string> = { Disponible: 'default', Comprometido: 'secondary', 'En tránsito': 'outline', Entregado: 'outline' };
const eudrColor: Record<string, string> = { Verde: 'default', Ámbar: 'secondary', Rojo: 'destructive' };

export default function ComercialIndex() {
  const navigate = useNavigate();
  const lotes = getDemoLotesComerciales();
  const exportaciones = getDemoExportaciones();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Comercial" description="Lotes, contratos, exportaciones y trazabilidad comercial" />
        <DemoBadge />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold">{lotes.length}</p><p className="text-xs text-muted-foreground">Lotes comerciales</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold">{exportaciones.length}</p><p className="text-xs text-muted-foreground">Exportaciones</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold">{lotes.filter(l => l.estado === 'Disponible').length}</p><p className="text-xs text-muted-foreground">Lotes disponibles</p></CardContent></Card>
        <Card><CardContent className="pt-5 text-center"><p className="text-2xl font-bold">{lotes.filter(l => l.eudr === 'Verde').length}</p><p className="text-xs text-muted-foreground">EUDR verde</p></CardContent></Card>
      </div>

      <Tabs defaultValue="lotes">
        <TabsList>
          <TabsTrigger value="lotes">Lotes comerciales</TabsTrigger>
          <TabsTrigger value="exportaciones">Exportaciones</TabsTrigger>
        </TabsList>

        <TabsContent value="lotes" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Código</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Origen</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Composición</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Volumen</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Calidad</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">EUDR</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lotes.map((l, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30 cursor-pointer">
                        <td className="py-2 px-3 font-medium">{l.codigo}</td>
                        <td className="py-2 px-3 text-muted-foreground">{l.origen}</td>
                        <td className="py-2 px-3 text-muted-foreground text-xs">{l.composicion}</td>
                        <td className="py-2 px-3 text-center">{l.volumen}</td>
                        <td className="py-2 px-3 text-center font-medium">{l.calidad}</td>
                        <td className="py-2 px-3 text-center"><Badge variant={(eudrColor[l.eudr] as any) || 'secondary'} className="text-xs">{l.eudr}</Badge></td>
                        <td className="py-2 px-3"><Badge variant={(estadoColor[l.estado] as any) || 'secondary'} className="text-xs">{l.estado}</Badge></td>
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
            <CardContent className="pt-5">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Código</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Destino</th>
                      <th className="text-center py-2 px-3 text-muted-foreground font-medium">Volumen</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Lote</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Fecha</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Documentación</th>
                      <th className="text-left py-2 px-3 text-muted-foreground font-medium">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {exportaciones.map((e, i) => (
                      <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                        <td className="py-2 px-3 font-medium">{e.codigo}</td>
                        <td className="py-2 px-3">{e.destino}</td>
                        <td className="py-2 px-3 text-center">{e.volumen}</td>
                        <td className="py-2 px-3 text-muted-foreground">{e.lote}</td>
                        <td className="py-2 px-3 text-muted-foreground">{e.fecha}</td>
                        <td className="py-2 px-3"><Badge variant={e.documentacion === 'Completa' ? 'default' : 'secondary'} className="text-xs">{e.documentacion}</Badge></td>
                        <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{e.estado}</Badge></td>
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