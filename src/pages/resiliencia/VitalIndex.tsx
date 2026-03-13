import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useVitalOverview } from '@/hooks/useViewData';
import { getVitalKPIs, getDemoVitalFincas, getVitalDistribucion, getVitalBrechas, getVitalAcciones } from '@/lib/demoSeedData';
import { useOperatingModel } from '@/lib/operatingModel';
import SostenibilidadHub from '@/pages/productor/SostenibilidadHub';

function scoreColor(score: number) {
  if (score >= 75) return 'text-primary';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export default function VitalIndex() {
  const model = useOperatingModel();

  // For single farm / estate producers, show the producer VITAL hub directly
  if (model === 'single_farm' || model === 'estate') {
    return <SostenibilidadHub />;
  }

  const { data, isLoading } = useVitalOverview();
  const overview = data?.[0] ?? null;
  const demoKPIs = getVitalKPIs();
  const fincas = getDemoVitalFincas();
  const distribucion = getVitalDistribucion();
  const brechas = getVitalBrechas();
  const acciones = getVitalAcciones();

  const kpis = [
    { label: 'Score promedio', value: overview?.score_promedio ?? demoKPIs.score_promedio, icon: Shield },
    { label: 'Fincas evaluadas', value: overview?.fincas_evaluadas ?? demoKPIs.fincas_evaluadas, icon: Users },
    { label: 'Brechas prioritarias', value: overview?.brechas_prioritarias ?? demoKPIs.brechas_prioritarias, icon: AlertTriangle },
    { label: 'Tendencia', value: overview?.tendencia ?? demoKPIs.tendencia, icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Protocolo VITAL" description="Evaluación estructural de resiliencia por finca y organización" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
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

      <Tabs defaultValue="fincas">
        <TabsList>
          <TabsTrigger value="fincas">Resultado por finca</TabsTrigger>
          <TabsTrigger value="organizacion">Distribución</TabsTrigger>
          <TabsTrigger value="brechas">Brechas</TabsTrigger>
          <TabsTrigger value="acciones">Acciones sugeridas</TabsTrigger>
        </TabsList>

        <TabsContent value="fincas" className="mt-4 space-y-3">
          {fincas.map((f, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{f.nombre}</p>
                    <p className="text-xs text-muted-foreground">{f.productor}</p>
                  </div>
                  <div className="flex items-center gap-4 text-xs">
                    <div className="text-center"><p className={`text-lg font-bold ${scoreColor(f.score)}`}>{f.score}</p><p className="text-muted-foreground">Score</p></div>
                    <div className="text-center"><p className="font-medium">{f.exposicion}</p><p className="text-muted-foreground">Exposición</p></div>
                    <div className="text-center"><p className="font-medium">{f.sensibilidad}</p><p className="text-muted-foreground">Sensibilidad</p></div>
                    <div className="text-center"><p className="font-medium">{f.capacidad}</p><p className="text-muted-foreground">Cap. adaptativa</p></div>
                    <Badge variant={f.nivel === 'Alto' ? 'default' : f.nivel === 'Medio' ? 'secondary' : 'destructive'} className="text-xs">{f.nivel}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="organizacion" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader><CardTitle className="text-sm">Distribución por nivel</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={distribucion} dataKey="count" nameKey="nivel" cx="50%" cy="50%" outerRadius={80} label={({ nivel, count }) => `${nivel}: ${count}`}>
                        {distribucion.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-sm">Estadísticas organizacionales</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between p-2 rounded bg-muted/50"><span className="text-sm text-muted-foreground">Score promedio</span><span className="font-bold">{demoKPIs.score_promedio}</span></div>
                <div className="flex justify-between p-2 rounded bg-muted/50"><span className="text-sm text-muted-foreground">Fincas evaluadas</span><span className="font-bold">{demoKPIs.fincas_evaluadas}</span></div>
                <div className="flex justify-between p-2 rounded bg-muted/50"><span className="text-sm text-muted-foreground">Tendencia</span><span className="font-bold text-primary">{demoKPIs.tendencia}</span></div>
                <div className="flex justify-between p-2 rounded bg-muted/50"><span className="text-sm text-muted-foreground">Brechas prioritarias</span><span className="font-bold text-destructive">{demoKPIs.brechas_prioritarias}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="brechas" className="mt-4 space-y-3">
          {brechas.map((b, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{b.brecha}</p>
                    <p className="text-xs text-muted-foreground">{b.afectados} fincas afectadas</p>
                  </div>
                  <Badge variant={b.prioridad === 'Alta' ? 'destructive' : b.prioridad === 'Media' ? 'secondary' : 'outline'}>{b.prioridad}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="acciones" className="mt-4 space-y-3">
          {acciones.map((a, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{a.accion}</p>
                    <p className="text-xs text-muted-foreground">{a.beneficiarios} beneficiarios · Impacto: {a.impacto}</p>
                  </div>
                  <Badge variant={a.estado === 'Completado' ? 'default' : a.estado === 'En ejecución' ? 'secondary' : 'outline'}>{a.estado}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}