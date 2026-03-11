import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, Plus, Map, Clock, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useYieldOverview } from '@/hooks/useViewData';

const FALLBACK_ESTIMACIONES = [
  { parcela: 'Lote El Cedro', productor: 'María Solano', estado: 'Completada', resultado: '28.5 qq/ha', fecha: '2026-03-06' },
  { parcela: 'Parcela Norte', productor: 'Carlos Méndez', estado: 'Pendiente', resultado: '—', fecha: '2026-03-10' },
  { parcela: 'Lote La Cumbre', productor: 'Ana Jiménez', estado: 'En proceso', resultado: '—', fecha: '2026-03-09' },
];

const estadoColor: Record<string, string> = { Completada: 'default', Pendiente: 'secondary', 'En proceso': 'outline' };

export default function YieldIndex() {
  const navigate = useNavigate();
  const { data, isLoading } = useYieldOverview();
  const overview = data?.[0] ?? null;

  const kpis = [
    { label: 'Estimaciones activas', value: overview?.estimaciones_activas ?? '15', icon: TrendingUp },
    { label: 'Pendientes de validar', value: overview?.pendientes_validar ?? '8', icon: Clock },
    { label: 'Completadas (campaña)', value: overview?.completadas ?? '42', icon: CheckCircle },
    { label: 'Parcelas sin estimación', value: overview?.parcelas_sin_estimacion ?? '23', icon: Map },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader title="Nova Yield" description="Estimaciones de cosecha, muestreo y proyecciones productivas" />
        <Button onClick={() => navigate('/agronomia/yield/nueva')} className="gap-2">
          <Plus className="h-4 w-4" /> Nueva estimación
        </Button>
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

      <Tabs defaultValue="activas">
        <TabsList>
          <TabsTrigger value="activas">Estimaciones activas</TabsTrigger>
          <TabsTrigger value="pendientes">Pendientes</TabsTrigger>
          <TabsTrigger value="completadas">Completadas</TabsTrigger>
          <TabsTrigger value="parcelas">Por parcela</TabsTrigger>
        </TabsList>
        <TabsContent value="activas" className="mt-4 space-y-3">
          {FALLBACK_ESTIMACIONES.map((e, i) => (
            <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{e.parcela}</p>
                    <p className="text-xs text-muted-foreground">{e.productor} · {e.fecha}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{e.resultado}</span>
                    <Badge variant={estadoColor[e.estado] as any}>{e.estado}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="pendientes" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Estimaciones pendientes de validación</CardContent></Card></TabsContent>
        <TabsContent value="completadas" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Estimaciones completadas esta campaña</CardContent></Card></TabsContent>
        <TabsContent value="parcelas" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Vista agrupada por parcela</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
