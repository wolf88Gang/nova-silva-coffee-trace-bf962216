import { useState, useMemo } from 'react';
import { VitalGate } from '@/components/auth/VitalGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  ShieldCheck, Users, TrendingUp, Play, CheckCircle, AlertTriangle,
  ArrowRight, ArrowLeft, BarChart3, Building2,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie,
} from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle } from '@/lib/chartStyles';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';
import { VITAL_ORG_BLOCKS, calculateIGRNOrg, type VitalOrgBlock } from '@/config/vitalOrgQuestions';
import { toast } from 'sonner';

const nivelVITAL = (p: number) => {
  if (p >= 75) return { label: 'Avanzado', color: 'text-emerald-600', bg: 'bg-emerald-500/10', emoji: '🟢' };
  if (p >= 50) return { label: 'Operativo', color: 'text-primary', bg: 'bg-primary/10', emoji: '🟡' };
  if (p >= 25) return { label: 'Básico', color: 'text-amber-500', bg: 'bg-amber-500/10', emoji: '🟠' };
  return { label: 'Inicial', color: 'text-destructive', bg: 'bg-destructive/10', emoji: '🔴' };
};

const nivelProductor = (p: number) => {
  if (p >= 81) return { label: 'Resiliente', color: 'text-emerald-600' };
  if (p >= 61) return { label: 'En Construcción', color: 'text-primary' };
  if (p >= 41) return { label: 'Fragilidad', color: 'text-amber-500' };
  return { label: 'Crítica', color: 'text-destructive' };
};

export default function VitalCooperativa() {
  const [showWizard, setShowWizard] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});

  const promedio = Math.round(DEMO_PRODUCTORES.reduce((s, p) => s + p.puntajeVITAL, 0) / DEMO_PRODUCTORES.length);
  const distribucion = {
    critico: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 41).length,
    desarrollo: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 41 && p.puntajeVITAL < 61).length,
    sostenible: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 61 && p.puntajeVITAL < 81).length,
    ejemplar: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 81).length,
  };

  const distPie = [
    { name: 'Crítica', value: distribucion.critico, color: 'hsl(0, 65%, 50%)' },
    { name: 'Fragilidad', value: distribucion.desarrollo, color: 'hsl(45, 90%, 50%)' },
    { name: 'En Construcción', value: distribucion.sostenible, color: 'hsl(var(--primary))' },
    { name: 'Resiliente', value: distribucion.ejemplar, color: 'hsl(142, 60%, 40%)' },
  ].filter(d => d.value > 0);

  const scoreByCommunity = useMemo(() => {
    const map = new Map<string, number[]>();
    DEMO_PRODUCTORES.forEach(p => {
      const arr = map.get(p.comunidad) || [];
      arr.push(p.puntajeVITAL);
      map.set(p.comunidad, arr);
    });
    return Array.from(map.entries()).map(([com, scores]) => ({
      comunidad: com,
      promedio: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
    }));
  }, []);

  // ── Org wizard state ──
  const block = VITAL_ORG_BLOCKS[currentBlock];
  const totalAnswered = Object.keys(answers).length;
  const blockAnswered = block ? block.questions.filter(q => answers[q.id] !== undefined).length : 0;
  const result = useMemo(() => totalAnswered >= 25 ? calculateIGRNOrg(answers) : null, [answers, totalAnswered]);

  const [showResult, setShowResult] = useState(false);

  const handleAnswer = (qId: number, score: number) => {
    setAnswers(prev => ({ ...prev, [qId]: score }));
  };

  const finishWizard = () => {
    const r = calculateIGRNOrg(answers);
    setShowResult(true);
    toast.success(`Diagnóstico Organizacional completado: ${Math.round(r.global * 100)}/100`);
  };

  const resetWizard = () => {
    setAnswers({});
    setCurrentBlock(0);
    setShowResult(false);
    setShowWizard(false);
  };

  // Demo org result
  const demoOrgResult = {
    global: 0.64,
    byBlock: { gobernanza: 0.72, finanzas: 0.58, cumplimiento: 0.78, servicios: 0.52, digital: 0.48 },
    falsaResiliencia: true,
    maxDiff: 0.30,
  };
  const orgRadar = VITAL_ORG_BLOCKS.map(b => ({
    eje: b.label.split(' ')[0],
    score: Math.round((demoOrgResult.byBlock[b.id] || 0) * 100),
    fullMark: 100,
  }));

  return (
    <VitalGate mode="banner">
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-foreground">Protocolo VITAL</h1>
          <Button onClick={() => setShowWizard(true)}>
            <Play className="h-4 w-4 mr-1" /> Diagnóstico Organizacional
          </Button>
        </div>

        <Tabs defaultValue="productores">
          <TabsList>
            <TabsTrigger value="productores"><Users className="h-4 w-4 mr-1" /> Productores</TabsTrigger>
            <TabsTrigger value="organizacional"><Building2 className="h-4 w-4 mr-1" /> Organizacional</TabsTrigger>
          </TabsList>

          {/* ═══ PRODUCTORES TAB ═══ */}
          <TabsContent value="productores" className="space-y-6 mt-4">
            <div className="grid md:grid-cols-4 gap-4">
              <Card><CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Evaluados</span></div>
                <p className="text-xl font-bold text-foreground">{DEMO_PRODUCTORES.length}</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Promedio IGRN</span></div>
                <p className="text-xl font-bold text-foreground">{promedio}/100</p>
                <Progress value={promedio} className="h-1.5 mt-1" />
              </CardContent></Card>
              <Card><CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-2">Distribución</p>
                <div className="grid grid-cols-4 gap-1 text-xs text-center">
                  <div className="rounded bg-destructive/10 text-destructive p-1"><p className="font-bold">{distribucion.critico}</p><p>Crít.</p></div>
                  <div className="rounded bg-amber-500/10 text-amber-500 p-1"><p className="font-bold">{distribucion.desarrollo}</p><p>Frag.</p></div>
                  <div className="rounded bg-primary/10 text-primary p-1"><p className="font-bold">{distribucion.sostenible}</p><p>Cons.</p></div>
                  <div className="rounded bg-emerald-500/10 text-emerald-600 p-1"><p className="font-bold">{distribucion.ejemplar}</p><p>Res.</p></div>
                </div>
              </CardContent></Card>
              <Card><CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Falsa Resiliencia</p>
                <p className="text-xl font-bold text-amber-500">{DEMO_PRODUCTORES.filter(p => p.puntajeVITAL > 60 && p.puntajeVITAL < 75).length}</p>
                <p className="text-xs text-muted-foreground">Productores en riesgo</p>
              </CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Distribución por Nivel</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={distPie} cx="50%" cy="50%" innerRadius={50} outerRadius={85} dataKey="value"
                        label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                        {distPie.map((d, i) => <Cell key={i} fill={d.color} />)}
                      </Pie>
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Promedio por Comunidad</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={scoreByCommunity}>
                      <XAxis dataKey="comunidad" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} />
                      <Bar dataKey="promedio" radius={[4, 4, 0, 0]}>
                        {scoreByCommunity.map((d, i) => (
                          <Cell key={i} fill={d.promedio >= 75 ? 'hsl(142, 60%, 40%)' : d.promedio >= 50 ? 'hsl(var(--primary))' : 'hsl(0, 65%, 50%)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base">Evaluaciones por Productor</CardTitle></CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="border-b text-muted-foreground text-left">
                      <th className="px-4 py-3 font-medium">Productor</th>
                      <th className="px-4 py-3 font-medium">Comunidad</th>
                      <th className="px-4 py-3 font-medium">IGRN</th>
                      <th className="px-4 py-3 font-medium">Nivel</th>
                      <th className="px-4 py-3 font-medium">Progreso</th>
                    </tr></thead>
                    <tbody>
                      {DEMO_PRODUCTORES.map(p => {
                        const nivel = nivelProductor(p.puntajeVITAL);
                        return (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                            <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                            <td className="px-4 py-3 text-muted-foreground">{p.comunidad}</td>
                            <td className={`px-4 py-3 font-bold ${nivel.color}`}>{p.puntajeVITAL}</td>
                            <td className="px-4 py-3"><Badge variant="outline">{nivel.label}</Badge></td>
                            <td className="px-4 py-3 w-32"><Progress value={p.puntajeVITAL} className="h-1.5" /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ═══ ORGANIZACIONAL TAB ═══ */}
          <TabsContent value="organizacional" className="space-y-6 mt-4">
            <div className="grid md:grid-cols-3 gap-4">
              <Card><CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">IGRN Organizacional</p>
                <p className={`text-3xl font-bold ${nivelVITAL(demoOrgResult.global * 100).color}`}>
                  {Math.round(demoOrgResult.global * 100)}/100
                </p>
                <Badge variant="outline" className={`mt-1 ${nivelVITAL(demoOrgResult.global * 100).bg}`}>
                  {nivelVITAL(demoOrgResult.global * 100).emoji} {nivelVITAL(demoOrgResult.global * 100).label}
                </Badge>
              </CardContent></Card>
              <Card><CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Última evaluación</p>
                <p className="text-lg font-bold text-foreground">15 ene 2026</p>
                <p className="text-xs text-muted-foreground">Próxima: jul 2026</p>
              </CardContent></Card>
              <Card><CardContent className="pt-4 pb-3">
                <p className="text-xs text-muted-foreground mb-1">Balance de ejes</p>
                {demoOrgResult.falsaResiliencia ? (
                  <div className="flex items-center gap-2 text-amber-500">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Falsa Resiliencia detectada</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Ejes balanceados</span>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-1">Diferencia máx: {Math.round(demoOrgResult.maxDiff * 100)} pts</p>
              </CardContent></Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Radar por Eje</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={orgRadar}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis dataKey="eje" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                      <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                      <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2"><CardTitle className="text-base">Puntaje por Eje</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {VITAL_ORG_BLOCKS.map(b => {
                    const score = Math.round((demoOrgResult.byBlock[b.id] || 0) * 100);
                    const nivel = nivelVITAL(score);
                    return (
                      <div key={b.id} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="text-foreground">{b.label}</span>
                          <span className={`font-bold ${nivel.color}`}>{score}/100</span>
                        </div>
                        <Progress value={score} className="h-2" />
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> Acciones Prioritarias</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {[
                  { eje: 'Digital', accion: 'Implementar sistema de alertas tempranas para socios', impacto: 'Alto', plazo: '90 días' },
                  { eje: 'Servicios', accion: 'Ampliar cobertura de asistencia técnica a comunidades lejanas', impacto: 'Alto', plazo: '180 días' },
                  { eje: 'Finanzas', accion: 'Crear fondo de reserva para emergencias climáticas', impacto: 'Medio', plazo: '120 días' },
                  { eje: 'Gobernanza', accion: 'Actualizar mapa de riesgos climáticos con datos 2026', impacto: 'Medio', plazo: '60 días' },
                ].map((a, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{a.accion}</p>
                      <p className="text-xs text-muted-foreground">Eje: {a.eje} · Plazo: {a.plazo}</p>
                    </div>
                    <Badge variant={a.impacto === 'Alto' ? 'destructive' : 'secondary'}>{a.impacto}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* ═══ WIZARD DIALOG ═══ */}
      <Dialog open={showWizard} onOpenChange={v => { if (!v) resetWizard(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              {showResult ? 'Resultado del Diagnóstico' : `Diagnóstico Organizacional — ${block?.label || ''}`}
            </DialogTitle>
            {!showResult && (
              <div className="flex items-center gap-2 mt-2">
                {VITAL_ORG_BLOCKS.map((b, i) => (
                  <button key={b.id} onClick={() => setCurrentBlock(i)}
                    className={`h-2 flex-1 rounded-full transition-colors ${
                      i === currentBlock ? 'bg-primary' : i < currentBlock ? 'bg-primary/50' : 'bg-muted'
                    }`} />
                ))}
              </div>
            )}
          </DialogHeader>

          {showResult ? (
            <div className="space-y-6">
              {(() => {
                const r = calculateIGRNOrg(answers);
                const score100 = Math.round(r.global * 100);
                const nivel = nivelVITAL(score100);
                return (
                  <>
                    <div className="text-center p-6 rounded-lg bg-muted/50">
                      <p className="text-5xl font-bold mb-2" style={{ color: score100 >= 75 ? 'hsl(142, 60%, 40%)' : score100 >= 50 ? 'hsl(var(--primary))' : score100 >= 25 ? 'hsl(45, 90%, 50%)' : 'hsl(0, 65%, 50%)' }}>
                        {score100}/100
                      </p>
                      <Badge className={`text-base px-4 py-1 ${nivel.bg}`}>{nivel.emoji} {nivel.label}</Badge>
                      {r.falsaResiliencia && (
                        <div className="mt-4 p-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/20">
                          <div className="flex items-center gap-2 text-amber-600">
                            <AlertTriangle className="h-4 w-4" />
                            <span className="text-sm font-medium">Falsa Resiliencia Detectada</span>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Diferencia de {Math.round(r.maxDiff * 100)} pts entre ejes. El puntaje global puede enmascarar vulnerabilidades.
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      {VITAL_ORG_BLOCKS.map(b => {
                        const s = Math.round((r.byBlock[b.id] || 0) * 100);
                        const n = nivelVITAL(s);
                        return (
                          <div key={b.id} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span className="text-foreground">{b.label}</span>
                              <span className={`font-bold ${n.color}`}>{s}/100</span>
                            </div>
                            <Progress value={s} className="h-2" />
                          </div>
                        );
                      })}
                    </div>
                    <Button className="w-full" onClick={resetWizard}>Cerrar</Button>
                  </>
                );
              })()}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Bloque {currentBlock + 1} de {VITAL_ORG_BLOCKS.length}</span>
                <span>{blockAnswered}/{block.questions.length} respondidas</span>
              </div>

              <div className="space-y-4">
                {block.questions.map((q, qi) => (
                  <div key={q.id} className="space-y-2">
                    <p className="text-sm font-medium text-foreground">
                      <span className="text-muted-foreground mr-1">P{q.id}.</span>
                      {q.text}
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {q.options.map((opt, oi) => (
                        <button key={oi} onClick={() => handleAnswer(q.id, opt.score)}
                          className={`text-left p-2.5 rounded-lg border text-sm transition-all ${
                            answers[q.id] === opt.score
                              ? 'border-primary bg-primary/10 text-primary font-medium'
                              : 'border-border hover:border-primary/30 text-foreground'
                          }`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" disabled={currentBlock === 0} onClick={() => setCurrentBlock(c => c - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                {currentBlock < VITAL_ORG_BLOCKS.length - 1 ? (
                  <Button className="flex-1" onClick={() => setCurrentBlock(c => c + 1)}>
                    Siguiente <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button className="flex-1" onClick={finishWizard} disabled={totalAnswered < 25}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Finalizar Diagnóstico
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </VitalGate>
  );
}
