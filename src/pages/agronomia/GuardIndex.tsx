import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bug, MapPin, Clock, TrendingUp } from 'lucide-react';
import { useGuardOverview } from '@/hooks/useViewData';

const FALLBACK_BROTES = [
  { parcela: 'Lote El Cedro', productor: 'María Solano', enfermedad: 'Roya del café', severidad: 'Alta', fecha: '2026-03-08' },
  { parcela: 'Parcela Norte', productor: 'Carlos Méndez', enfermedad: 'Ojo de gallo', severidad: 'Media', fecha: '2026-03-05' },
  { parcela: 'Lote La Cumbre', productor: 'Ana Jiménez', enfermedad: 'Antracnosis', severidad: 'Baja', fecha: '2026-03-01' },
];

const severityColor: Record<string, string> = { Alta: 'destructive', Media: 'secondary', Baja: 'outline' };

export default function GuardIndex() {
  const { data, isLoading } = useGuardOverview();
  const overview = data?.[0] ?? null;

  const kpis = [
    { label: 'Brotes activos', value: overview?.brotes_activos ?? '3', icon: Bug, color: 'text-destructive' },
    { label: 'Parcelas en riesgo', value: overview?.parcelas_riesgo ?? '7', icon: MapPin, color: 'text-warning' },
    { label: 'Incidencias (30d)', value: overview?.incidencias_30d ?? '12', icon: Clock, color: 'text-muted-foreground' },
    { label: 'Tendencia', value: overview?.tendencia ?? '↓ 15%', icon: TrendingUp, color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Nova Guard" description="Diagnóstico fitosanitario, brotes activos y alertas regionales" />

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
          <TabsTrigger value="diagnosticos">Diagnósticos</TabsTrigger>
          <TabsTrigger value="mapa">Mapa de riesgo</TabsTrigger>
          <TabsTrigger value="historial">Historial</TabsTrigger>
          <TabsTrigger value="recomendaciones">Recomendaciones</TabsTrigger>
        </TabsList>
        <TabsContent value="brotes" className="mt-4">
          <div className="space-y-3">
            {FALLBACK_BROTES.map((b, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{b.parcela}</p>
                      <p className="text-xs text-muted-foreground">{b.productor} · {b.fecha}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{b.enfermedad}</span>
                      <Badge variant={severityColor[b.severidad] as any}>{b.severidad}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="diagnosticos" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Historial de diagnósticos fitosanitarios</CardContent></Card></TabsContent>
        <TabsContent value="mapa" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Mapa de riesgo fitosanitario por zona</CardContent></Card></TabsContent>
        <TabsContent value="historial" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Historial completo de incidencias</CardContent></Card></TabsContent>
        <TabsContent value="recomendaciones" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Recomendaciones de tratamiento activas</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
