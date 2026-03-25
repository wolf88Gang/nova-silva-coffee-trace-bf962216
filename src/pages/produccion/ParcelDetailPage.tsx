import { useState } from 'react';
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
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line,
} from 'recharts';
import {
  Sprout, Bug, TrendingUp, Shield, FolderOpen, ArrowRight,
  ChevronLeft, Beaker, FileText, Camera, Droplets, Thermometer,
  AlertTriangle, CheckCircle2, Clock, Leaf, Plus,
} from 'lucide-react';
import GuardDiagnosticWizard from '@/components/guard/GuardDiagnosticWizard';
import GuardTreatmentPlan from '@/components/guard/GuardTreatmentPlan';

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

const chartTooltipStyle = {
  backgroundColor: 'hsl(var(--card))',
  border: '1px solid hsl(var(--border))',
  borderRadius: '8px',
  color: 'hsl(var(--foreground))',
};

export default function ParcelDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useParcelaHub(id || null);
  const [showGuardWizard, setShowGuardWizard] = useState(false);

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
        <div className="grid gap-3 grid-cols-2 grid-cols-2 lg:grid-cols-4 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  // Derived: interconnected signals
  const nutricionPct = demo.nutricion.plan.ejecucion;
  const guardActivos = demo.guard.diagnosticos.filter(d => d.estado === 'Activo').length;
  const vitalLevel = demo.vital.score >= 75 ? 'Resiliente' : demo.vital.score >= 50 ? 'En Construcción' : 'Fragilidad';
  const yieldActual = demo.yield.estimaciones.find(e => e.real === null);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" className="gap-1" onClick={() => navigate('/produccion/parcelas')}>
          <ChevronLeft className="h-4 w-4" /> Parcelas
        </Button>
        <DemoBadge />
      </div>

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{p.parcela_nombre}</h1>
          <p className="text-sm text-muted-foreground">{p.variedad} · {p.area_ha} ha · {p.altitud} msnm</p>
        </div>
        <Badge variant="default">Activa</Badge>
      </div>

      {/* Quick stats strip */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        <StatChip icon={Sprout} label="Nutrición" value={`${nutricionPct}%`} sub={p.plan_estado} color="text-primary" />
        <StatChip icon={Bug} label="Guard" value={guardActivos > 0 ? `${guardActivos} activo${guardActivos > 1 ? 's' : ''}` : 'Sin alertas'} sub={p.guard_riesgo} color="text-warning" />
        <StatChip icon={TrendingUp} label="Yield" value={yieldActual ? `${yieldActual.estimado} qq/ha` : '—'} sub="Campaña actual" color="text-accent" />
        <StatChip icon={Shield} label="VITAL" value={String(demo.vital.score)} sub={vitalLevel} color={demo.vital.score >= 70 ? 'text-primary' : 'text-warning'} />
        <StatChip icon={Droplets} label="pH suelo" value={String(demo.nutricion.analisis.ph)} sub={demo.nutricion.analisis.ph < 5.2 ? 'Ácido' : 'Adecuado'} color="text-muted-foreground" />
        <StatChip icon={Thermometer} label="Altitud" value={`${p.altitud}`} sub="msnm" color="text-muted-foreground" />
      </div>

      {/* Tabs */}
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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Cross-module intelligence card */}
            <Card className="sm:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Interpretación Nova Silva</CardTitle></CardHeader>
              <CardContent className="space-y-3 text-sm">
                <SignalRow icon={Sprout} color="text-primary" text={`Plan nutricional ${p.plan_estado.toLowerCase()} al ${nutricionPct}% de ejecución. ${nutricionPct < 50 ? 'Requiere atención prioritaria.' : 'Avance adecuado.'}`} />
                <SignalRow icon={Bug} color="text-warning" text={`${guardActivos > 0 ? `${guardActivos} incidencia${guardActivos > 1 ? 's' : ''} fitosanitaria${guardActivos > 1 ? 's' : ''} activa${guardActivos > 1 ? 's' : ''}. Riesgo ${p.guard_riesgo.toLowerCase()}.` : 'Sin brotes activos. Parcela estable fitosanitariamente.'}`} />
                <SignalRow icon={TrendingUp} color="text-accent" text={`Estimación de cosecha: ${yieldActual?.estimado ?? '—'} qq/ha. ${nutricionPct < 60 ? 'El avance nutricional podría impactar el rendimiento.' : 'Nutrición alineada con la meta productiva.'}`} />
                <SignalRow icon={Shield} color={demo.vital.score >= 70 ? 'text-primary' : 'text-warning'} text={`Score VITAL ${demo.vital.score}/100 (${vitalLevel}). ${demo.vital.dimensiones.filter(d => d.score < 50).length > 0 ? `Brechas en: ${demo.vital.dimensiones.filter(d => d.score < 50).map(d => d.dimension).join(', ')}.` : 'Todas las dimensiones por encima del umbral.'}`} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Estado de módulos</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <ModuleRow label="Plan nutricional" status={p.plan_estado} pct={nutricionPct} />
                <ModuleRow label="Nova Guard" status={guardActivos > 0 ? 'Alerta activa' : 'Estable'} pct={guardActivos > 0 ? 40 : 100} />
                <ModuleRow label="Nova Yield" status={yieldActual ? 'En curso' : 'Completada'} pct={yieldActual ? 60 : 100} />
                <ModuleRow label="Protocolo VITAL" status={vitalLevel} pct={demo.vital.score} />
                {p.tiene_eudr && <ModuleRow label="EUDR" status="Registrada" pct={92} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Actividad reciente</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  { icon: Beaker, text: `Análisis suelo: pH ${demo.nutricion.analisis.ph}, K ${demo.nutricion.analisis.k}`, date: demo.nutricion.analisis.fecha },
                  { icon: Bug, text: `Diagnóstico: ${demo.guard.diagnosticos[0]?.enfermedad}`, date: demo.guard.diagnosticos[0]?.fecha },
                  { icon: Leaf, text: `Fertilización: ${demo.nutricion.plan.aplicaciones[0]?.producto}`, date: demo.nutricion.plan.aplicaciones[0]?.fecha },
                  { icon: Shield, text: `Evaluación VITAL: Score ${demo.vital.score}`, date: demo.evidencias[0]?.fecha },
                ].map((a, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <a.icon className="h-3.5 w-3.5 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-muted-foreground truncate">{a.text}</p>
                      <p className="text-xs text-muted-foreground/60">{a.date}</p>
                    </div>
                  </div>
                ))}
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
                    <Tooltip contentStyle={chartTooltipStyle} />
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
            <h3 className="text-sm font-semibold flex items-center gap-2"><Beaker className="h-4 w-4 text-primary" /> Análisis de suelo y plan nutricional</h3>
            <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/nutricion')}> Módulo Nutrición <ArrowRight className="h-3 w-3" /></Button>
          </div>

          {/* Soil analysis + interpretation */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Último análisis de suelo</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-7 gap-2 mb-3">
                {[
                  { label: 'pH', value: demo.nutricion.analisis.ph, alert: demo.nutricion.analisis.ph < 5.0 },
                  { label: 'MO %', value: demo.nutricion.analisis.mo },
                  { label: 'N', value: demo.nutricion.analisis.n },
                  { label: 'P (ppm)', value: demo.nutricion.analisis.p, alert: demo.nutricion.analisis.p < 8 },
                  { label: 'K (cmol/L)', value: demo.nutricion.analisis.k, alert: demo.nutricion.analisis.k < 0.3 },
                  { label: 'Ca', value: demo.nutricion.analisis.ca ?? '—' },
                  { label: 'Mg', value: demo.nutricion.analisis.mg ?? '—' },
                ].map(v => (
                  <div key={v.label} className={`p-2 rounded text-center ${v.alert ? 'bg-destructive/10 border border-destructive/20' : 'bg-muted/50'}`}>
                    <p className="text-xs text-muted-foreground">{v.label}</p>
                    <p className={`font-bold text-lg ${v.alert ? 'text-destructive' : ''}`}>{v.value}</p>
                  </div>
                ))}
              </div>
              <div className="p-3 rounded-lg bg-accent/5 border border-accent/10">
                <p className="text-sm font-medium text-accent mb-1">Interpretación Nova Silva</p>
                <p className="text-xs text-muted-foreground">{demo.nutricion.analisis.interpretacion}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Fecha de análisis: {demo.nutricion.analisis.fecha}</p>
            </CardContent>
          </Card>

          {/* Nutrition plan with progress */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Plan nutricional vigente</CardTitle>
                <Badge variant={nutricionPct >= 70 ? 'default' : 'secondary'} className="text-xs">{demo.nutricion.plan.estado}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Progress value={nutricionPct} className="flex-1 h-2.5" />
                <span className="text-sm font-bold w-12 text-right">{nutricionPct}%</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {nutricionPct < 50 ? 'Ejecución por debajo del umbral recomendado. Priorizar aplicaciones pendientes.' : nutricionPct < 80 ? 'Avance moderado. Verificar calendario de próximas aplicaciones.' : 'Ejecución avanzada. Mantener seguimiento de cierre.'}
              </p>
              <div className="space-y-2">
                {demo.nutricion.plan.aplicaciones.map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-2">
                      {a.estado === 'Aplicado' ? <CheckCircle2 className="h-4 w-4 text-primary" /> : a.estado === 'Atrasado' ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                      <div>
                        <p className="text-sm font-medium">{a.producto}</p>
                        <p className="text-xs text-muted-foreground">{a.dosis} · {a.fecha}</p>
                      </div>
                    </div>
                    <Badge variant={(estColor[a.estado] as any) || 'secondary'} className="text-xs">{a.estado}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ NOVA GUARD ═══ */}
        <TabsContent value="guard" className="mt-4 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-sm font-semibold flex items-center gap-2"><Bug className="h-4 w-4 text-warning" /> Diagnóstico y tratamiento fitosanitario</h3>
            <div className="flex gap-2">
              <Button size="sm" className="gap-1" onClick={() => setShowGuardWizard(true)}>
                <Plus className="h-3.5 w-3.5" /> Nuevo diagnóstico
              </Button>
              <Button variant="outline" size="sm" className="gap-1" onClick={() => navigate('/agronomia/guard')}> Nova Guard <ArrowRight className="h-3 w-3" /></Button>
            </div>
          </div>

          {showGuardWizard && (
            <GuardDiagnosticWizard
              parcelaName={p.parcela_nombre}
              onSaved={() => setShowGuardWizard(false)}
              onCancel={() => setShowGuardWizard(false)}
            />
          )}

          {/* Guard summary */}
          <div className="grid gap-3 sm:grid-cols-3">
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold text-warning">{guardActivos}</p><p className="text-xs text-muted-foreground">Incidencias activas</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{demo.guard.diagnosticos.filter(d => d.estado === 'Resuelto').length}</p><p className="text-xs text-muted-foreground">Resueltas</p></CardContent></Card>
            <Card><CardContent className="pt-4 text-center"><p className="text-2xl font-bold">{demo.guard.diagnosticos.length}</p><p className="text-xs text-muted-foreground">Total diagnósticos</p></CardContent></Card>
          </div>

          {/* Treatment plans for this parcel */}
          <GuardTreatmentPlan
            parcelaFilter={p.parcela_nombre}
            onGeneratePlan={() => setShowGuardWizard(true)}
          />

          {/* Diagnostics list */}
          <h4 className="text-sm font-medium mt-2">Historial de diagnósticos</h4>
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
                <div className="p-2 rounded bg-muted/30 mt-1">
                  <p className="text-xs text-muted-foreground"><span className="font-medium text-foreground">Recomendación:</span> {d.recomendacion}</p>
                </div>
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

          {/* Yield comparison chart */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Estimado vs. Real por campaña</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demo.yield.estimaciones}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="campaña" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                    <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={chartTooltipStyle} />
                    <Bar dataKey="estimado" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Estimado" />
                    <Bar dataKey="real" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} name="Real" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-3 sm:grid-cols-3">
            {demo.yield.estimaciones.map((e, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <p className="text-xs text-muted-foreground mb-1">Campaña {e.campaña}</p>
                  <p className="text-2xl font-bold text-primary">{e.estimado} <span className="text-xs font-normal text-muted-foreground">qq/ha est.</span></p>
                  {e.real !== null ? (
                    <div className="mt-1">
                      <p className="text-sm text-muted-foreground">Real: <span className="font-medium text-foreground">{e.real} qq/ha</span></p>
                      <p className="text-xs mt-0.5 text-muted-foreground">
                        Precisión: {Math.round(100 - Math.abs(e.estimado - e.real) / e.estimado * 100)}%
                      </p>
                    </div>
                  ) : (
                    <Badge variant="secondary" className="mt-1 text-xs">En curso</Badge>
                  )}
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
                <p className={`text-5xl font-bold ${demo.vital.score >= 70 ? 'text-primary' : demo.vital.score >= 50 ? 'text-warning' : 'text-destructive'}`}>
                  {demo.vital.score}
                </p>
                <p className="text-sm text-muted-foreground mt-1">Score VITAL global</p>
                <Badge variant={demo.vital.score >= 75 ? 'default' : 'secondary'} className="mt-2">{vitalLevel}</Badge>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">Dimensiones de resiliencia</CardTitle></CardHeader>
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

          {/* Dimension breakdown with contextual notes */}
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Detalle por dimensión</CardTitle></CardHeader>
            <CardContent className="space-y-2.5">
              {demo.vital.dimensiones.map((d, i) => {
                const level = d.score >= 75 ? 'Resiliente' : d.score >= 50 ? 'En Construcción' : d.score < 40 ? 'Crítica' : 'Fragilidad';
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-sm w-24 shrink-0">{d.dimension}</span>
                    <Progress value={d.score} className="flex-1 h-2" />
                    <span className="text-sm font-medium w-8 text-right">{d.score}</span>
                    <Badge variant={d.score >= 75 ? 'default' : d.score >= 50 ? 'secondary' : 'destructive'} className="text-[10px] w-24 justify-center">{level}</Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══ EVIDENCIAS ═══ */}
        <TabsContent value="evidencias" className="mt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold flex items-center gap-2"><FolderOpen className="h-4 w-4 text-primary" /> Repositorio de evidencias</h3>
            <p className="text-xs text-muted-foreground">{demo.evidencias.length} documentos registrados</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {demo.evidencias.map((e, i) => (
              <Card key={i} className="cursor-pointer hover:shadow-sm transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded ${e.tipo.includes('Foto') ? 'bg-primary/10' : 'bg-accent/10'}`}>
                      {e.tipo.includes('Foto') ? <Camera className="h-4 w-4 text-primary" /> : <FileText className="h-4 w-4 text-accent" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{e.tipo}</p>
                      <p className="text-xs text-muted-foreground">{e.descripcion}</p>
                      <p className="text-xs text-muted-foreground/60 mt-1">{e.fecha}</p>
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

// ── Small helper components ──

function StatChip({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon className={`h-3.5 w-3.5 ${color}`} />
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      <p className="font-semibold text-sm">{value}</p>
      <p className="text-xs text-muted-foreground/70">{sub}</p>
    </div>
  );
}

function SignalRow({ icon: Icon, color, text }: { icon: any; color: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className={`h-4 w-4 mt-0.5 ${color} shrink-0`} />
      <p className="text-muted-foreground">{text}</p>
    </div>
  );
}

function ModuleRow({ label, status, pct }: { label: string; status: string; pct: number }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <Progress value={pct} className="w-16 h-1.5" />
        <Badge variant={pct >= 80 ? 'default' : pct >= 50 ? 'secondary' : 'destructive'} className="text-[10px]">{status}</Badge>
      </div>
    </div>
  );
}
