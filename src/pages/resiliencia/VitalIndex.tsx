import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, TrendingUp, AlertTriangle, Users } from 'lucide-react';
import { useVitalOverview } from '@/hooks/useViewData';

const FALLBACK_FINCAS = [
  { nombre: 'Lote El Cedro', productor: 'María Solano', score: 72, exposicion: 65, sensibilidad: 58, capacidad: 82 },
  { nombre: 'Parcela Norte', productor: 'Carlos Méndez', score: 45, exposicion: 78, sensibilidad: 72, capacidad: 38 },
  { nombre: 'Lote La Cumbre', productor: 'Ana Jiménez', score: 88, exposicion: 32, sensibilidad: 28, capacidad: 91 },
];

function scoreColor(score: number) {
  if (score >= 70) return 'text-primary';
  if (score >= 50) return 'text-warning';
  return 'text-destructive';
}

export default function VitalIndex() {
  const { data, isLoading } = useVitalOverview();
  const overview = data?.[0] ?? null;

  const kpis = [
    { label: 'Score promedio', value: overview?.score_promedio ?? '68', icon: Shield },
    { label: 'Fincas evaluadas', value: overview?.fincas_evaluadas ?? '156', icon: Users },
    { label: 'Brechas prioritarias', value: overview?.brechas_prioritarias ?? '12', icon: AlertTriangle },
    { label: 'Tendencia', value: overview?.tendencia ?? '+4 pts', icon: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Protocolo VITAL" description="Evaluación estructural de resiliencia por finca y organización" />

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
          <TabsTrigger value="organizacion">Resultado organizacional</TabsTrigger>
          <TabsTrigger value="componentes">Componentes</TabsTrigger>
          <TabsTrigger value="brechas">Brechas</TabsTrigger>
          <TabsTrigger value="acciones">Acciones sugeridas</TabsTrigger>
        </TabsList>
        <TabsContent value="fincas" className="mt-4 space-y-3">
          {FALLBACK_FINCAS.map((f, i) => (
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
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="organizacion" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Distribución de scores y mapa de vulnerabilidad</CardContent></Card></TabsContent>
        <TabsContent value="componentes" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Desglose por componentes VITAL</CardContent></Card></TabsContent>
        <TabsContent value="brechas" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Brechas prioritarias sistémicas</CardContent></Card></TabsContent>
        <TabsContent value="acciones" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Plan de acciones sugeridas</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
