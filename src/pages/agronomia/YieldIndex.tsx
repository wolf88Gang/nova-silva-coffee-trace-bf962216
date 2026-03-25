import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Plus, Map, Clock, CheckCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useYieldOverview } from '@/hooks/useViewData';
import { getYieldKPIs, getDemoEstimacionesYield, getYieldHistorico } from '@/lib/demoSeedData';

const estadoColor: Record<string, string> = { Completada: 'default', Pendiente: 'secondary', 'En proceso': 'outline', Borrador: 'outline' };

export default function YieldIndex() {
  const navigate = useNavigate();
  const { data, isLoading } = useYieldOverview();
  const overview = data?.[0] ?? null;
  const demoKPIs = getYieldKPIs();
  const estimaciones = getDemoEstimacionesYield();
  const historico = getYieldHistorico();

  const completadas = estimaciones.filter(e => e.estado === 'Completada');
  const pendientes = estimaciones.filter(e => e.estado !== 'Completada');

  const kpis = [
    { label: 'Estimaciones activas', value: overview?.estimaciones_activas ?? demoKPIs.estimaciones_activas, icon: TrendingUp },
    { label: 'Pendientes de validar', value: overview?.pendientes_validar ?? demoKPIs.pendientes_validar, icon: Clock },
    { label: 'Completadas (campaña)', value: overview?.completadas ?? demoKPIs.completadas, icon: CheckCircle },
    { label: 'Parcelas sin estimación', value: overview?.parcelas_sin_estimacion ?? demoKPIs.parcelas_sin_estimacion, icon: Map },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <PageHeader title="Nova Yield" description="Estimaciones de cosecha, muestreo y proyecciones productivas" />
        <div className="flex items-center gap-3">
          <DemoBadge />
          <Button onClick={() => navigate('/agronomia/yield/nueva')} className="gap-2"><Plus className="h-4 w-4" /> Nueva estimación</Button>
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <k.icon className="h-5 w-5 text-primary" />
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{String(k.value)}</p>}
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Historical chart */}
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm font-medium mb-3">Rendimiento por campaña (qq/ha)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={historico}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="campana" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="estimado" fill="hsl(var(--primary))" name="Estimado" radius={[4, 4, 0, 0]} />
                <Bar dataKey="real" fill="hsl(var(--accent))" name="Real" radius={[4, 4, 0, 0]} />
                <Legend />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="completadas">
        <TabsList>
          <TabsTrigger value="completadas">Completadas ({completadas.length})</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes ({pendientes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="completadas" className="mt-4 space-y-3">
          {completadas.map((e, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.parcela}</p>
                    <p className="text-xs text-muted-foreground">{e.productor} · {e.variedad} · {e.fecha}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-primary">{e.resultado}</span>
                    <Badge variant="default">Completada</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="pendientes" className="mt-4 space-y-3">
          {pendientes.map((e, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.parcela}</p>
                    <p className="text-xs text-muted-foreground">{e.productor} · {e.variedad} · {e.fecha}</p>
                  </div>
                  <Badge variant={(estadoColor[e.estado] as any) || 'secondary'}>{e.estado}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}