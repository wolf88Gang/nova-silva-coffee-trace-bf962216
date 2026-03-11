import { useParams, useNavigate } from 'react-router-dom';
import { useParcelaHub } from '@/hooks/useViewData';
import { DemoBadge } from '@/components/common/DemoBadge';
import { getParcelDetailDemo } from '@/lib/demoSeedData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Sprout, Bug, TrendingUp, Shield, FolderOpen, ArrowRight, ChevronLeft, Beaker, FileText, Camera } from 'lucide-react';

const FALLBACK = {
  parcela_nombre: 'Lote El Cedro',
  productor_nombre: 'María Solano',
  variedad: 'Caturra',
  area_ha: 4.2,
  altitud: 1450,
  ultimo_plan_nutricion_estado: 'Vigente',
  ultimo_diagnostico_guard_riesgo: 'Medio',
  ultima_estimacion_yield_fecha: '2026-03-06',
  ultimo_score_vital: 72,
  tiene_evidencias: true,
  tiene_eudr: true,
  tiene_novacup: true,
};

const sevColor: Record<string, string> = { Alta: 'destructive', Media: 'secondary', Baja: 'outline' };
const estColor: Record<string, string> = { Activo: 'destructive', 'En tratamiento': 'secondary', Resuelto: 'outline', Aplicado: 'default', Programado: 'secondary', Atrasado: 'destructive' };

export default function ParcelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useParcelaHub(id || null);

  const hub = data?.[0] ?? null;
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

  const demo = getParcelDetailDemo();

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
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/produccion/parcelas')}>
          <ChevronLeft className="h-4 w-4" /> Parcelas
        </Button>
        <DemoBadge />
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.parcela_nombre}</h1>
          <p className="text-sm text-muted-foreground">{p.productor_nombre}</p>
        </div>
        <Badge variant="default">Activa</Badge>
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

        {/* ═══ RESUMEN ═══ */}
        <TabsContent value="resumen" className="mt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Estado general</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan nutricional</span><Badge variant="default" className="text-xs">{p.plan_estado}</Badge></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Ejecución plan</span><span>{demo.nutricion.plan.ejecucion}%</span></div>
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
                <div className="flex items-center gap-2 p-2 rounded bg-primary/10 border border-primary/20"><Sprout className="h-4 w-4 text-primary" /><span className="text-sm">Nutrición al {demo.nutricion.plan.ejecucion}%</span></div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* ═══ PRODUCCIÓN ═══ */}
        <TabsContent value="produccion" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Rendimiento mensual (qq/ha)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demo.produccion.rendimiento}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px', color: 'hsl(var(--foreground))' }} />
                    <Bar dataKey="qqha" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Últimas entregas</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 px-3 text-muted-foreground font-medium">Fecha</th><th className="text-left py-2 px-3 text-muted-foreground font-medium">Cantidad</th><th className="text-left py-2 px-3 text-muted-foreground font-medium">Tipo</th><th className="text-left py-2 px-3 text-muted-foreground font-medium">Calidad</th></tr></thead>
                  <tbody>
                    {demo.produccion.entregas.map((e, i) => (
                      <tr key={i} className="border-b border-border/50"><td className="py-2 px-3 text-muted-foreground">{e.fecha}</td><td className="py-2 px-3 font-medium">{e.cantidad}</td><td className="py-2 px-3">{e.tipo}</td><td className="py-2 px-3"><Badge variant="outline" className="text-xs">{e.calidad}</Badge></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ NUTRICIÓN ═══ */}
        <TabsContent value="nutricion" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Beaker className="h-4 w-4 text-primary" /> Análisis de suelo</h3>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/nutricion')}> Módulo Nutrición <ArrowRight className="h-3 w-3" /></Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                {[
                  { label: 'pH', value: demo.nutricion.analisis.ph },
                  { label: 'MO %', value: demo.nutricion.analisis.mo },
                  { label: 'N', value: demo.nutricion.analisis.n },
                  { label: 'P', value: demo.nutricion.analisis.p },
                  { label: 'K', value: demo.nutricion.analisis.k },
                ].map(v => (
                  <div key={v.label} className="p-2 rounded bg-muted/50 text-center">
                    <p className="text-xs text-muted-foreground">{v.label}</p>
                    <p className="font-bold text-lg">{v.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground italic">{demo.nutricion.analisis.interpretacion}</p>
              <p className="text-xs text-muted-foreground mt-1">Fecha: {demo.nutricion.analisis.fecha}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Plan nutricional — {demo.nutricion.plan.estado}</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Progress value={demo.nutricion.plan.ejecucion} className="flex-1 h-2" />
                <span className="text-sm font-medium">{demo.nutricion.plan.ejecucion}%</span>
              </div>
              {demo.nutricion.plan.aplicaciones.map((a, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{a.producto}</p>
                    <p className="text-xs text-muted-foreground">{a.dosis} · {a.fecha}</p>
                  </div>
                  <Badge variant={(estColor[a.estado] as any) || 'secondary'} className="text-xs">{a.estado}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ NOVA GUARD ═══ */}
        <TabsContent value="guard" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Bug className="h-4 w-4 text-warning" /> Historial fitosanitario</h3>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/guard')}> Nova Guard <ArrowRight className="h-3 w-3" /></Button>
          </div>
          {demo.guard.diagnosticos.map((d, i) => (
            <Card key={i}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-medium text-sm">{d.enfermedad}</p>
                    <p className="text-xs text-muted-foreground">{d.fecha} · Incidencia: {d.incidencia}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <Badge variant={(sevColor[d.severidad] as any) || 'secondary'} className="text-xs">{d.severidad}</Badge>
                    <Badge variant={(estColor[d.estado] as any) || 'secondary'} className="text-xs">{d.estado}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground italic">💡 {d.recomendacion}</p>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* ═══ NOVA YIELD ═══ */}
        <TabsContent value="yield" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><TrendingUp className="h-4 w-4 text-accent" /> Estimaciones de cosecha</h3>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/yield')}> Nova Yield <ArrowRight className="h-3 w-3" /></Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {demo.yield.estimaciones.map((e, i) => (
              <Card key={i}>
                <CardContent className="pt-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Campaña {e.campaña}</p>
                  <p className="text-2xl font-bold text-primary">{e.estimado} <span className="text-xs font-normal text-muted-foreground">qq/ha est.</span></p>
                  {e.real !== null ? (
                    <p className="text-sm text-muted-foreground mt-1">Real: <span className="font-medium text-foreground">{e.real} qq/ha</span></p>
                  ) : (
                    <Badge variant="secondary" className="mt-1 text-xs">En curso</Badge>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">{e.fecha}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ═══ PROTOCOLO VITAL ═══ */}
        <TabsContent value="vital" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Evaluación VITAL</h3>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/resiliencia/vital')}> Protocolo VITAL <ArrowRight className="h-3 w-3" /></Button>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className={`text-5xl font-bold ${(demo.vital.score) >= 70 ? 'text-primary' : (demo.vital.score) >= 50 ? 'text-warning' : 'text-destructive'}`}>
                  {demo.vital.score}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Score VITAL global</p>
                <p className="text-xs text-muted-foreground mt-1">{demo.vital.score >= 75 ? 'Resiliente' : demo.vital.score >= 50 ? 'En Construcción' : 'Fragilidad'}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Dimensiones</CardTitle></CardHeader>
              <CardContent>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={demo.vital.dimensiones}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="dimension" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-2">
                {demo.vital.dimensiones.map((d, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm">{d.dimension}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={d.score} className="w-24 h-2" />
                      <span className="text-sm font-medium w-8 text-right">{d.score}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ EVIDENCIAS ═══ */}
        <TabsContent value="evidencias" className="mt-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {demo.evidencias.map((e, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded bg-muted/50">
                      {e.tipo.includes('Foto') ? <Camera className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-accent" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{e.tipo}</p>
                      <p className="text-xs text-muted-foreground">{e.descripcion}</p>
                      <p className="text-xs text-muted-foreground mt-1">{e.fecha}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
