import { useParams, useNavigate } from 'react-router-dom';
import { useParcelaHub } from '@/hooks/useViewData';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Map, Sprout, Bug, TrendingUp, Shield, FolderOpen, ArrowRight, ChevronLeft } from 'lucide-react';

// Fallback data when view is not available
const FALLBACK = {
  parcela_nombre: 'Lote El Cedro',
  productor_nombre: 'María Solano',
  organizacion: 'Cooperativa Regional',
  variedad: 'Caturra',
  area_ha: 4.2,
  altitud: 1450,
  estado: 'Activa',
  edad: '8 años',
  ultimo_plan_nutricion_estado: 'Vigente',
  ejecucion_plan: '65%',
  rendimiento_objetivo: '32 qq/ha',
  costo_estimado: '₡ 2,450,000',
  ultimo_diagnostico_guard_riesgo: 'Medio',
  ultima_estimacion_yield: '28.5 qq/ha',
  ultima_estimacion_yield_fecha: '2026-03-06',
  ultimo_score_vital: 72,
  ultimo_analisis: '2026-01-15',
  tiene_evidencias: true,
  tiene_jornales: false,
  tiene_eudr: true,
  tiene_novacup: true,
};

export default function ParcelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useParcelaHub(id || null);

  const hub = data?.[0] ?? null;
  // Merge hub data with fallback
  const p = {
    parcela_nombre: hub?.parcela_nombre ?? FALLBACK.parcela_nombre,
    productor_nombre: hub?.productor_nombre ?? FALLBACK.productor_nombre,
    variedad: hub?.variedad ?? FALLBACK.variedad,
    area_ha: hub?.area_ha ?? FALLBACK.area_ha,
    altitud: hub?.altitud ?? FALLBACK.altitud,
    plan_estado: hub?.ultimo_plan_nutricion_estado ?? FALLBACK.ultimo_plan_nutricion_estado,
    guard_riesgo: hub?.ultimo_diagnostico_guard_riesgo ?? FALLBACK.ultimo_diagnostico_guard_riesgo,
    yield_fecha: hub?.ultima_estimacion_yield_fecha ?? FALLBACK.ultima_estimacion_yield_fecha,
    score_vital: hub?.ultimo_score_vital ?? FALLBACK.ultimo_score_vital,
    tiene_evidencias: hub?.tiene_evidencias ?? FALLBACK.tiene_evidencias,
    tiene_eudr: hub?.tiene_eudr ?? FALLBACK.tiene_eudr,
    tiene_novacup: hub?.tiene_novacup ?? FALLBACK.tiene_novacup,
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Button variant="ghost" size="sm" className="mb-2 gap-1" onClick={() => navigate('/produccion/parcelas')}>
          <ChevronLeft className="h-4 w-4" /> Parcelas
        </Button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{p.parcela_nombre}</h1>
            <p className="text-sm text-muted-foreground">{p.productor_nombre}</p>
          </div>
          <Badge variant="default">Activa</Badge>
        </div>
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4 lg:grid-cols-6">
        {[
          { label: 'Variedad', value: p.variedad },
          { label: 'Área', value: p.area_ha ? `${p.area_ha} ha` : '—' },
          { label: 'Altitud', value: p.altitud ? `${p.altitud} msnm` : '—' },
          { label: 'Plan nutrición', value: p.plan_estado || '—' },
          { label: 'Riesgo Guard', value: p.guard_riesgo || '—' },
          { label: 'Score VITAL', value: p.score_vital != null ? String(p.score_vital) : '—' },
        ].map(f => (
          <div key={f.label} className="p-3 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">{f.label}</p>
            <p className="font-medium text-sm mt-0.5">{f.value}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="flex-wrap">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="produccion">Producción</TabsTrigger>
          <TabsTrigger value="nutricion">Nutrición</TabsTrigger>
          <TabsTrigger value="guard">Nova Guard</TabsTrigger>
          <TabsTrigger value="yield">Nova Yield</TabsTrigger>
          <TabsTrigger value="vital">Protocolo VITAL</TabsTrigger>
          <TabsTrigger value="evidencias">Evidencias</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Estado general</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan nutricional</span><Badge variant="default" className="text-xs">{p.plan_estado}</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Última estimación Yield</span><span>{p.yield_fecha || '—'}</span></div>
                {p.tiene_eudr && <div className="flex justify-between text-sm"><span className="text-muted-foreground">EUDR</span><Badge variant="secondary" className="text-xs">Registrada</Badge></div>}
                {p.tiene_novacup && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Nova Cup</span><Badge variant="secondary" className="text-xs">Evaluada</Badge></div>}
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Señales activas</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-2 p-2 rounded bg-warning/10 border border-warning/20"><Bug className="h-4 w-4 text-warning" /><span className="text-sm">Riesgo fitosanitario: {p.guard_riesgo}</span></div>
                <div className="flex items-center gap-2 p-2 rounded bg-accent/10 border border-accent/20"><Shield className="h-4 w-4 text-accent" /><span className="text-sm">Score VITAL: {p.score_vital ?? '—'}</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="produccion" className="mt-4">
          <Card><CardContent className="pt-5"><p className="text-sm text-muted-foreground">Historial de entregas, rendimientos y actividad productiva de esta parcela.</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="nutricion" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Estado nutricional</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/nutricion')}>
                  Abrir módulo Nutrición <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><Badge variant="default" className="text-xs">{p.plan_estado}</Badge></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guard" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Diagnóstico fitosanitario</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/guard')}>
                  Abrir Nova Guard <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                <Bug className="h-4 w-4 text-warning" />
                <div>
                  <p className="text-sm font-medium">Riesgo: {p.guard_riesgo}</p>
                  <p className="text-xs text-muted-foreground">Último diagnóstico registrado</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yield" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Estimación de cosecha</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/yield')}>
                  Abrir Nova Yield <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Última estimación: {p.yield_fecha || 'Sin registro'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vital" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Protocolo VITAL</CardTitle>
                <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/resiliencia/vital')}>
                  Abrir VITAL <ArrowRight className="h-3 w-3" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <p className={`text-3xl font-bold ${(p.score_vital ?? 0) >= 70 ? 'text-primary' : (p.score_vital ?? 0) >= 50 ? 'text-warning' : 'text-destructive'}`}>
                  {p.score_vital ?? '—'}
                </p>
                <p className="text-xs text-muted-foreground">Score VITAL</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evidencias" className="mt-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-sm text-muted-foreground">
                {p.tiene_evidencias ? 'Evidencias registradas para esta parcela.' : 'Sin evidencias registradas aún.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
