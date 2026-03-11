import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug, MapPin, Clock, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useGuardOverview } from '@/hooks/useViewData';
import { getGuardKPIs, getDemoDiagnosticosGuard, getGuardPorEnfermedad } from '@/lib/demoSeedData';

const severityColor: Record<string, string> = { Alta: 'destructive', Media: 'secondary', Baja: 'outline' };
const estadoColor: Record<string, string> = { Activo: 'destructive', 'En tratamiento': 'secondary', Resuelto: 'outline' };

export default function GuardIndex() {
  const { data, isLoading } = useGuardOverview();
  const overview = data?.[0] ?? null;
  const demoKPIs = getGuardKPIs();
  const diagnosticos = getDemoDiagnosticosGuard();
  const porEnfermedad = getGuardPorEnfermedad();

  const brotes = diagnosticos.filter(d => d.estado === 'Activo' || d.estado === 'En tratamiento');
  const resueltos = diagnosticos.filter(d => d.estado === 'Resuelto');

  const kpis = [
    { label: 'Brotes activos', value: overview?.brotes_activos ?? demoKPIs.brotes_activos, icon: Bug, color: 'text-destructive' },
    { label: 'Parcelas en riesgo', value: overview?.parcelas_riesgo ?? demoKPIs.parcelas_riesgo, icon: MapPin, color: 'text-warning' },
    { label: 'Incidencias (30d)', value: overview?.incidencias_30d ?? demoKPIs.incidencias_30d, icon: Clock, color: 'text-muted-foreground' },
    { label: 'Tendencia', value: overview?.tendencia ?? demoKPIs.tendencia, icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Nova Guard" description="Diagnóstico fitosanitario, brotes activos y alertas regionales" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
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

      <Tabs defaultValue="brotes">
        <TabsList>
          <TabsTrigger value="brotes">Brotes activos</TabsTrigger>
          <TabsTrigger value="diagnosticos">Todos los diagnósticos</TabsTrigger>
          <TabsTrigger value="enfermedad">Por enfermedad</TabsTrigger>
          <TabsTrigger value="historial">Historial resuelto</TabsTrigger>
        </TabsList>

        <TabsContent value="brotes" className="mt-4 space-y-3">
          {brotes.slice(0, 12).map((b, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.parcela}</p>
                    <p className="text-xs text-muted-foreground">{b.productor} · {b.fecha} · Incidencia: {b.incidencia}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{b.enfermedad}</span>
                    <Badge variant={(severityColor[b.severidad] as any) || 'secondary'}>{b.severidad}</Badge>
                    <Badge variant={(estadoColor[b.estado] as any) || 'secondary'} className="text-xs">{b.estado}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="diagnosticos" className="mt-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Parcela</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Enfermedad</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Severidad</th>
                  <th className="text-center py-2 px-3 text-muted-foreground font-medium">Incidencia</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Fecha</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {diagnosticos.slice(0, 20).map((d, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3 font-medium">{d.parcela}</td>
                    <td className="py-2 px-3">{d.enfermedad}</td>
                    <td className="py-2 px-3 text-center"><Badge variant={(severityColor[d.severidad] as any) || 'secondary'} className="text-xs">{d.severidad}</Badge></td>
                    <td className="py-2 px-3 text-center">{d.incidencia}%</td>
                    <td className="py-2 px-3 text-muted-foreground">{d.fecha}</td>
                    <td className="py-2 px-3"><Badge variant={(estadoColor[d.estado] as any) || 'secondary'} className="text-xs">{d.estado}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="enfermedad" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={porEnfermedad} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis dataKey="enfermedad" type="category" width={120} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="casos" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historial" className="mt-4 space-y-3">
          {resueltos.slice(0, 10).map((r, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.parcela} – {r.enfermedad}</p>
                    <p className="text-xs text-muted-foreground">{r.productor} · {r.fecha}</p>
                  </div>
                  <Badge variant="outline">Resuelto</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}