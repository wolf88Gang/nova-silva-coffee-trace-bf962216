import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Sprout, FileText, ClipboardList, AlertTriangle } from 'lucide-react';
import { useNutricionOverview } from '@/hooks/useViewData';
import { getNutricionKPIs, getDemoPlanesNutricion, getDemoAnalisisSuelo, getEjecucionesNutricion } from '@/lib/demoSeedData';
import { useVisibilityPolicy } from '@/lib/operatingModel';

const planColor: Record<string, string> = { Vigente: 'default', Vencido: 'destructive', Borrador: 'outline', 'Sin plan': 'secondary' };
const ejColor: Record<string, string> = { Aplicado: 'default', Programado: 'secondary', Atrasado: 'destructive' };

export default function NutricionIndex() {
  const { data, isLoading } = useNutricionOverview();
  const overview = data?.[0] ?? null;
  const demoKPIs = getNutricionKPIs();
  const planes = getDemoPlanesNutricion();
  const analisis = getDemoAnalisisSuelo();
  const ejecuciones = getEjecucionesNutricion();
  const v = useVisibilityPolicy();

  const kpis = [
    { label: 'Planes activos', value: overview?.planes_activos ?? demoKPIs.planes_activos, icon: Sprout, color: 'text-primary' },
    { label: 'Análisis pendientes', value: overview?.analisis_pendientes ?? demoKPIs.analisis_pendientes, icon: FileText, color: 'text-warning' },
    { label: 'Planes por ejecutar', value: overview?.planes_por_ejecutar ?? demoKPIs.planes_por_ejecutar, icon: ClipboardList, color: 'text-accent' },
    { label: 'Alertas cruzadas', value: overview?.alertas_cruzadas ?? demoKPIs.alertas_cruzadas, icon: AlertTriangle, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Nutrición" description="Análisis de suelo, planes nutricionales y ejecución por parcela" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <k.icon className={`h-5 w-5 ${k.color}`} />
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{String(k.value)}</p>}
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="parcelas">
        <TabsList>
          <TabsTrigger value="parcelas">Parcelas con plan</TabsTrigger>
          <TabsTrigger value="analisis">Análisis de suelo</TabsTrigger>
          <TabsTrigger value="ejecucion">Ejecución</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
        </TabsList>

        <TabsContent value="parcelas" className="mt-4 space-y-3">
          {planes.slice(0, 15).map((p, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{p.parcela}</p>
                    {v.canSeeProducers && <p className="text-xs text-muted-foreground">{p.productor} · Creado: {p.fechaCreacion}</p>}
                    {!v.canSeeProducers && <p className="text-xs text-muted-foreground">Creado: {p.fechaCreacion}</p>}
                  </div>
                  <Badge variant={(planColor[p.estado] as any) || 'secondary'}>{p.estado}</Badge>
                </div>
                {p.estado !== 'Sin plan' && (
                  <div className="flex items-center gap-3">
                    <Progress value={p.ejecucion} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground w-10 text-right">{p.ejecucion}%</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analisis" className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Parcela</th>
                  {v.canSeeProducers && <th className="text-left py-2 px-3 text-muted-foreground font-medium">Productor</th>}
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Fecha</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">pH</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">MO%</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">P</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">K</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {analisis.slice(0, 15).map((a, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{a.parcela}</td>
                    {v.canSeeProducers && <td className="py-2 px-3 text-muted-foreground">{a.productor}</td>}
                    <td className="py-2 px-3 text-muted-foreground">{a.fecha}</td>
                    <td className="py-2 px-3 text-center">{a.ph}</td>
                    <td className="py-2 px-3 text-center">{a.mo}</td>
                    <td className="py-2 px-3 text-center">{a.p}</td>
                    <td className="py-2 px-3 text-center">{a.k}</td>
                    <td className="py-2 px-3"><Badge variant={a.estado === 'Completo' ? 'default' : 'secondary'} className="text-xs">{a.estado}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="ejecucion" className="mt-4 space-y-3">
          {ejecuciones.map((e, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.producto}</p>
                    <p className="text-xs text-muted-foreground">{e.parcela} · {e.dosis} · {e.fecha}</p>
                  </div>
                  <Badge variant={(ejColor[e.estado] as any) || 'secondary'}>{e.estado}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="historial" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="space-y-2">
                {planes.filter(p => p.estado === 'Vencido').slice(0, 8).map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                    <div>
                      <p className="text-sm font-medium">{p.parcela}</p>
                      {v.canSeeProducers && <p className="text-xs text-muted-foreground">{p.productor} · Venció: {p.fechaVencimiento}</p>}
                      {!v.canSeeProducers && <p className="text-xs text-muted-foreground">Venció: {p.fechaVencimiento}</p>}
                    </div>
                    <Badge variant="outline" className="text-xs">Archivado</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
