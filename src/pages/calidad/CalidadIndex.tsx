import { PageHeader } from '@/components/common/PageHeader';
import { DemoBadge } from '@/components/common/DemoBadge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Award, TrendingUp, Star, Coffee } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNovaCupOverview } from '@/hooks/useViewData';
import { getCupKPIs, getDemoMuestrasCup, getCupTendencia } from '@/lib/demoSeedData';

function scoreColor(score: number) {
  if (score >= 88) return 'text-primary';
  if (score >= 85) return 'text-accent';
  return 'text-muted-foreground';
}

export default function CalidadIndex() {
  const { data, isLoading } = useNovaCupOverview();
  const overview = data?.[0] ?? null;
  const demoKPIs = getCupKPIs();
  const muestras = getDemoMuestrasCup();
  const tendencia = getCupTendencia();

  const kpis = [
    { label: 'Evaluaciones (campaña)', value: overview?.evaluaciones ?? demoKPIs.evaluaciones, icon: Award },
    { label: 'Score promedio', value: overview?.score_promedio ?? demoKPIs.score_promedio, icon: Star },
    { label: 'Lotes >86 pts', value: overview?.lotes_destacados ?? demoKPIs.lotes_destacados, icon: Coffee },
    { label: 'Tendencia', value: overview?.tendencia ?? demoKPIs.tendencia, icon: TrendingUp },
  ];

  const specialty = muestras.filter(m => m.score >= 85);
  const topLotes = [...muestras].sort((a, b) => b.score - a.score).slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Calidad · Nova Cup" description="Evaluaciones de taza, tendencias de calidad y oferta destacada" />
        <DemoBadge />
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {kpis.map(k => (
          <Card key={k.label}>
            <CardContent className="pt-5">
              <div className="flex items-center gap-3">
                <k.icon className="h-5 w-5 text-accent" />
                <div>
                  {isLoading ? <Skeleton className="h-7 w-12" /> : <p className="text-2xl font-bold">{String(k.value)}</p>}
                  <p className="text-xs text-muted-foreground">{k.label}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Trend chart */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Tendencia de score promedio (12 meses)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <YAxis domain={[80, 92]} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: 'hsl(var(--accent))' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="evaluaciones">
        <TabsList>
          <TabsTrigger value="evaluaciones">Todas las evaluaciones</TabsTrigger>
          <TabsTrigger value="top">Top lotes</TabsTrigger>
          <TabsTrigger value="specialty">Specialty ({specialty.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="evaluaciones" className="mt-4 space-y-3">
          {muestras.map((e, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.lote}</p>
                    <p className="text-xs text-muted-foreground">{e.productor} · {e.origen} · {e.variedad} · {e.fecha}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">{e.notas}</p>
                  </div>
                  <div className="text-center shrink-0 ml-4">
                    <p className={`text-2xl font-bold ${scoreColor(e.score)}`}>{e.score}</p>
                    <p className="text-xs text-muted-foreground">{e.categoria}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="top" className="mt-4 space-y-3">
          {topLotes.map((e, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">#{i + 1} – {e.lote}</p>
                    <p className="text-xs text-muted-foreground">{e.productor} · {e.origen}</p>
                  </div>
                  <span className={`text-xl font-bold ${scoreColor(e.score)}`}>{e.score}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="specialty" className="mt-4 space-y-3">
          {specialty.map((e, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.lote}</p>
                    <p className="text-xs text-muted-foreground">{e.productor} · {e.notas}</p>
                  </div>
                  <Badge variant="default">{e.score} SCA</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}