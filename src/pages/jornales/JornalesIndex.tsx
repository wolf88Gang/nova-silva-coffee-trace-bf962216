import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Briefcase, Users, DollarSign, Clock } from 'lucide-react';
import { useJornalesOverview } from '@/hooks/useViewData';

const FALLBACK_REGISTROS = [
  { cuadrilla: 'Cuadrilla Norte', actividad: 'Recolección', parcela: 'Lote El Cedro', jornales: 12, costo: '₡ 156,000', fecha: '2026-03-10' },
  { cuadrilla: 'Cuadrilla Sur', actividad: 'Fertilización', parcela: 'Parcela Norte', jornales: 4, costo: '₡ 52,000', fecha: '2026-03-09' },
  { cuadrilla: 'Equipo Mantenimiento', actividad: 'Podas', parcela: 'Lote La Cumbre', jornales: 8, costo: '₡ 104,000', fecha: '2026-03-08' },
];

export default function JornalesIndex() {
  const { data, isLoading } = useJornalesOverview();
  const overview = data?.[0] ?? null;

  const kpis = [
    { label: 'Cuadrillas activas', value: overview?.cuadrillas_activas ?? '6', icon: Users },
    { label: 'Jornales (semana)', value: overview?.jornales_semana ?? '84', icon: Briefcase },
    { label: 'Costo semanal', value: overview?.costo_semanal ?? '₡ 1.09M', icon: DollarSign },
    { label: 'Pagos pendientes', value: overview?.pagos_pendientes ?? '3', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Jornales" description="Registro laboral, cuadrillas, costos y pagos de campaña" />

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

      <Tabs defaultValue="registros">
        <TabsList>
          <TabsTrigger value="registros">Registros</TabsTrigger>
          <TabsTrigger value="cuadrillas">Cuadrillas</TabsTrigger>
          <TabsTrigger value="costos">Costos laborales</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
        </TabsList>
        <TabsContent value="registros" className="mt-4 space-y-3">
          {FALLBACK_REGISTROS.map((r, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{r.actividad} · {r.parcela}</p>
                    <p className="text-xs text-muted-foreground">{r.cuadrilla} · {r.fecha}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="secondary">{r.jornales} jornales</Badge>
                    <span className="text-sm font-medium">{r.costo}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
        <TabsContent value="cuadrillas" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Gestión de cuadrillas y asignación de personal</CardContent></Card></TabsContent>
        <TabsContent value="costos" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Análisis de costos laborales por actividad y parcela</CardContent></Card></TabsContent>
        <TabsContent value="pagos" className="mt-4"><Card><CardContent className="pt-5 text-center text-muted-foreground text-sm py-12">Registro de pagos y liquidaciones de cuadrillas</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
