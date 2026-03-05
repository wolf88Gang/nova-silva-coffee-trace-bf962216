import { useState, useMemo } from 'react';
import { VitalGate } from '@/components/auth/VitalGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  ShieldCheck, Users, TrendingUp, Play, CheckCircle, AlertTriangle,
  ArrowRight, ArrowLeft, BarChart3, Building2, Eye, UserCheck, Calendar, MapPin,
  MessageSquare, ClipboardCheck,
} from 'lucide-react';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell,
  PieChart, Pie,
} from 'recharts';
import { tooltipStyle, tooltipItemStyle, tooltipLabelStyle, chartCursorStyle } from '@/lib/chartStyles';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';
import { VITAL_ORG_BLOCKS, calculateIGRNOrg, type VitalOrgBlock } from '@/config/vitalOrgQuestions';
import { toast } from 'sonner';
import { generateVitalReport, exportVitalReportToClipboard } from '@/lib/advancedReportsExport';
import { RECOMENDACION_TEXTOS } from '@/hooks/useRadixPreguntasOrg';
import { Download } from 'lucide-react';

// Use canonical VITAL levels from shared utility
import { getVitalLevel, getVitalChartColor } from '@/lib/vitalLevels';

const nivelVITAL = (p: number) => {
  const l = getVitalLevel(p);
  return { label: l.label, color: l.textColor, bg: l.bgColor, emoji: l.emoji };
};

const nivelProductor = (p: number) => {
  const l = getVitalLevel(p);
  return { label: l.label, color: l.textColor };
};

// Demo VITAL dimensions per producer
const DEMO_VITAL_DIMENSIONES: Record<string, { eje: string; score: number }[]> = {
  '1': [{ eje: 'Suelo', score: 82 }, { eje: 'Agua', score: 75 }, { eje: 'Biodiversidad', score: 70 }, { eje: 'Clima', score: 80 }, { eje: 'Social', score: 78 }, { eje: 'Económico', score: 76 }],
  '2': [{ eje: 'Suelo', score: 90 }, { eje: 'Agua', score: 85 }, { eje: 'Biodiversidad', score: 80 }, { eje: 'Clima', score: 88 }, { eje: 'Social', score: 82 }, { eje: 'Económico', score: 85 }],
  '3': [{ eje: 'Suelo', score: 55 }, { eje: 'Agua', score: 48 }, { eje: 'Biodiversidad', score: 45 }, { eje: 'Clima', score: 58 }, { eje: 'Social', score: 52 }, { eje: 'Económico', score: 54 }],
  '4': [{ eje: 'Suelo', score: 95 }, { eje: 'Agua', score: 90 }, { eje: 'Biodiversidad', score: 88 }, { eje: 'Clima', score: 92 }, { eje: 'Social', score: 89 }, { eje: 'Económico', score: 92 }],
  '5': [{ eje: 'Suelo', score: 35 }, { eje: 'Agua', score: 30 }, { eje: 'Biodiversidad', score: 28 }, { eje: 'Clima', score: 42 }, { eje: 'Social', score: 45 }, { eje: 'Económico', score: 48 }],
  '6': [{ eje: 'Suelo', score: 78 }, { eje: 'Agua', score: 70 }, { eje: 'Biodiversidad', score: 65 }, { eje: 'Clima', score: 75 }, { eje: 'Social', score: 72 }, { eje: 'Económico', score: 72 }],
  '7': [{ eje: 'Suelo', score: 68 }, { eje: 'Agua', score: 62 }, { eje: 'Biodiversidad', score: 58 }, { eje: 'Clima', score: 70 }, { eje: 'Social', score: 65 }, { eje: 'Económico', score: 67 }],
  '8': [{ eje: 'Suelo', score: 85 }, { eje: 'Agua', score: 78 }, { eje: 'Biodiversidad', score: 75 }, { eje: 'Clima', score: 82 }, { eje: 'Social', score: 80 }, { eje: 'Económico', score: 80 }],
};

const DEMO_TECNICO_ASIGNADO: Record<string, { nombre: string; telefono: string }> = {
  '1': { nombre: 'Ing. Roberto Castañeda', telefono: '+502 5555-1234' },
  '2': { nombre: 'Ing. Roberto Castañeda', telefono: '+502 5555-1234' },
  '3': { nombre: 'Ing. Sofía Villagrán', telefono: '+502 5555-5678' },
  '4': { nombre: 'Ing. Roberto Castañeda', telefono: '+502 5555-1234' },
  '5': { nombre: 'Ing. Sofía Villagrán', telefono: '+502 5555-5678' },
  '6': { nombre: 'Ing. Sofía Villagrán', telefono: '+502 5555-5678' },
  '7': { nombre: 'Ing. Roberto Castañeda', telefono: '+502 5555-1234' },
  '8': { nombre: 'Ing. Sofía Villagrán', telefono: '+502 5555-5678' },
};

// Demo technician comments per producer
const DEMO_COMENTARIOS_TECNICO: Record<string, { fecha: string; tecnico: string; texto: string }[]> = {
  '1': [
    { fecha: '2026-02-01', tecnico: 'Ing. Roberto Castañeda', texto: 'Suelo con buena cobertura vegetal. Recomendé ampliar barreras vivas en zona norte de parcela 2.' },
    { fecha: '2025-08-15', tecnico: 'Ing. Roberto Castañeda', texto: 'Avance significativo en manejo de sombra. Falta mejorar registros de agua.' },
  ],
  '2': [
    { fecha: '2026-01-20', tecnico: 'Ing. Roberto Castañeda', texto: 'Productora modelo. Excelentes prácticas de conservación de suelo y diversificación.' },
  ],
  '3': [
    { fecha: '2026-01-28', tecnico: 'Ing. Sofía Villagrán', texto: 'Productor con dificultades en manejo de plagas. Se entregó plan de acción correctiva urgente.' },
    { fecha: '2025-08-05', tecnico: 'Ing. Sofía Villagrán', texto: 'Sin avance en recomendaciones anteriores. Necesita acompañamiento más frecuente.' },
  ],
  '4': [
    { fecha: '2026-02-12', tecnico: 'Ing. Roberto Castañeda', texto: 'Puntuación más alta del grupo. Candidata a promotora comunitaria.' },
  ],
  '5': [
    { fecha: '2025-12-20', tecnico: 'Ing. Sofía Villagrán', texto: 'Situación crítica: deforestación reciente en lindero este. Se requiere intervención inmediata.' },
  ],
  '6': [
    { fecha: '2026-01-15', tecnico: 'Ing. Sofía Villagrán', texto: 'Buen progreso en biodiversidad. Pendiente implementar sistema de riego eficiente.' },
  ],
  '7': [
    { fecha: '2026-01-10', tecnico: 'Ing. Roberto Castañeda', texto: 'Primera evaluación. Productor receptivo, se definió plan de mejora a 6 meses.' },
  ],
  '8': [
    { fecha: '2026-02-05', tecnico: 'Ing. Sofía Villagrán', texto: 'Mejora constante. Implementó compostaje y reducción de agroquímicos.' },
  ],
};

// Demo validated actions per producer
const DEMO_ACCIONES_VALIDADAS: Record<string, { id: string; accion: string; validada: boolean; fechaValidacion?: string; tecnico: string }[]> = {
  '1': [
    { id: 'a1', accion: 'Instalar barreras vivas en parcela norte', validada: true, fechaValidacion: '2026-02-01', tecnico: 'Roberto Castañeda' },
    { id: 'a2', accion: 'Implementar registro diario de consumo de agua', validada: false, tecnico: 'Roberto Castañeda' },
    { id: 'a3', accion: 'Ampliar cobertura de sombra al 40%', validada: true, fechaValidacion: '2025-08-15', tecnico: 'Roberto Castañeda' },
  ],
  '2': [
    { id: 'a4', accion: 'Mantener diversificación de cultivos asociados', validada: true, fechaValidacion: '2026-01-20', tecnico: 'Roberto Castañeda' },
    { id: 'a5', accion: 'Documentar prácticas para replicar en comunidad', validada: true, fechaValidacion: '2026-01-20', tecnico: 'Roberto Castañeda' },
  ],
  '3': [
    { id: 'a6', accion: 'Aplicar plan de control integrado de plagas', validada: false, tecnico: 'Sofía Villagrán' },
    { id: 'a7', accion: 'Asistir a capacitación de manejo fitosanitario', validada: false, tecnico: 'Sofía Villagrán' },
    { id: 'a8', accion: 'Eliminar uso de herbicidas no autorizados', validada: false, tecnico: 'Sofía Villagrán' },
  ],
  '4': [
    { id: 'a9', accion: 'Certificar como promotora comunitaria VITAL', validada: true, fechaValidacion: '2026-02-12', tecnico: 'Roberto Castañeda' },
    { id: 'a10', accion: 'Capacitar a 3 productores vecinos', validada: false, tecnico: 'Roberto Castañeda' },
  ],
  '5': [
    { id: 'a11', accion: 'Detener deforestación en lindero este', validada: false, tecnico: 'Sofía Villagrán' },
    { id: 'a12', accion: 'Iniciar reforestación con especies nativas', validada: false, tecnico: 'Sofía Villagrán' },
    { id: 'a13', accion: 'Presentar plan de remediación ambiental', validada: false, tecnico: 'Sofía Villagrán' },
  ],
  '6': [
    { id: 'a14', accion: 'Instalar sistema de micro-riego', validada: false, tecnico: 'Sofía Villagrán' },
    { id: 'a15', accion: 'Mantener corredores biológicos', validada: true, fechaValidacion: '2026-01-15', tecnico: 'Sofía Villagrán' },
  ],
  '7': [
    { id: 'a16', accion: 'Completar análisis de suelo en parcelas', validada: false, tecnico: 'Roberto Castañeda' },
    { id: 'a17', accion: 'Establecer calendario de fertilización orgánica', validada: false, tecnico: 'Roberto Castañeda' },
  ],
  '8': [
    { id: 'a18', accion: 'Mantener programa de compostaje', validada: true, fechaValidacion: '2026-02-05', tecnico: 'Sofía Villagrán' },
    { id: 'a19', accion: 'Reducir uso de agroquímicos en 50%', validada: true, fechaValidacion: '2026-02-05', tecnico: 'Sofía Villagrán' },
    { id: 'a20', accion: 'Obtener certificación orgánica', validada: false, tecnico: 'Sofía Villagrán' },
  ],
};

const DEMO_EVAL_HISTORIAL: Record<string, { fecha: string; score: number; evaluador: string }[]> = {
  '1': [{ fecha: '2026-02-01', score: 78, evaluador: 'Roberto Castañeda' }, { fecha: '2025-08-15', score: 72, evaluador: 'Roberto Castañeda' }, { fecha: '2025-02-10', score: 65, evaluador: 'Ana Morales' }],
  '2': [{ fecha: '2026-01-20', score: 85, evaluador: 'Roberto Castañeda' }, { fecha: '2025-07-10', score: 80, evaluador: 'Roberto Castañeda' }],
  '3': [{ fecha: '2026-01-28', score: 52, evaluador: 'Sofía Villagrán' }, { fecha: '2025-08-05', score: 48, evaluador: 'Sofía Villagrán' }],
  '4': [{ fecha: '2026-02-12', score: 91, evaluador: 'Roberto Castañeda' }, { fecha: '2025-09-01', score: 87, evaluador: 'Roberto Castañeda' }, { fecha: '2025-03-15', score: 82, evaluador: 'Ana Morales' }],
  '5': [{ fecha: '2025-12-20', score: 38, evaluador: 'Sofía Villagrán' }],
  '6': [{ fecha: '2026-01-15', score: 72, evaluador: 'Sofía Villagrán' }, { fecha: '2025-07-20', score: 68, evaluador: 'Sofía Villagrán' }],
  '7': [{ fecha: '2026-01-10', score: 65, evaluador: 'Roberto Castañeda' }],
  '8': [{ fecha: '2026-02-05', score: 80, evaluador: 'Sofía Villagrán' }, { fecha: '2025-08-25', score: 76, evaluador: 'Sofía Villagrán' }],
};

export default function VitalCooperativa() {
  const [showWizard, setShowWizard] = useState(false);
  const [currentBlock, setCurrentBlock] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [selectedProductor, setSelectedProductor] = useState<typeof DEMO_PRODUCTORES[0] | null>(null);

  const promedio = Math.round(DEMO_PRODUCTORES.reduce((s, p) => s + p.puntajeVITAL, 0) / DEMO_PRODUCTORES.length);
  const distribucion = {
    critico: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 41).length,
    desarrollo: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 41 && p.puntajeVITAL < 61).length,
    sostenible: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 61 && p.puntajeVITAL < 81).length,
    ejemplar: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 81).length,
  };

  const distPie = [
    { name: 'Crítica', value: distribucion.critico, color: 'hsl(0, 65%, 50%)' },
    { name: 'Fragilidad', value: distribucion.desarrollo, color: 'hsl(30, 90%, 50%)' },
    { name: 'En Construcción', value: distribucion.sostenible, color: 'hsl(45, 90%, 50%)' },
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => {
              const report = generateVitalReport('Mi Cooperativa', '2025-2026', {
                evaluated: DEMO_PRODUCTORES.length,
                avgIGRN: promedio,
                critical: distribucion.critico,
                fragile: distribucion.desarrollo,
                building: distribucion.sostenible,
                resilient: distribucion.ejemplar,
              });
              const text = exportVitalReportToClipboard(report);
              navigator.clipboard.writeText(text);
              toast.success('Reporte VITAL copiado al portapapeles');
            }}>
              <Download className="h-4 w-4 mr-1" /> Exportar Reporte
            </Button>
            <Button onClick={() => setShowWizard(true)}>
              <Play className="h-4 w-4 mr-1" /> Diagnóstico Organizacional
            </Button>
          </div>
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
                  <div className="rounded bg-yellow-500/10 text-yellow-600 p-1"><p className="font-bold">{distribucion.sostenible}</p><p>Cons.</p></div>
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
                      <Tooltip contentStyle={tooltipStyle} itemStyle={tooltipItemStyle} labelStyle={tooltipLabelStyle} cursor={chartCursorStyle} />
                      <Bar dataKey="promedio" radius={[4, 4, 0, 0]}>
                        {scoreByCommunity.map((d, i) => (
                          <Cell key={i} fill={d.promedio >= 81 ? 'hsl(142, 60%, 40%)' : d.promedio >= 61 ? 'hsl(45, 90%, 50%)' : d.promedio >= 41 ? 'hsl(30, 90%, 50%)' : 'hsl(0, 65%, 50%)'} />
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
                          <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors cursor-pointer"
                            onClick={() => setSelectedProductor(p)}>
                            <td className="px-4 py-3 font-medium text-foreground flex items-center gap-2">
                              {p.nombre}
                              <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                            </td>
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

      {/* ═══ PRODUCER DETAIL DIALOG ═══ */}
      <Dialog open={!!selectedProductor} onOpenChange={v => { if (!v) setSelectedProductor(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedProductor && (() => {
            const p = selectedProductor;
            const nivel = nivelProductor(p.puntajeVITAL);
            const dims = DEMO_VITAL_DIMENSIONES[p.id] || [];
            const tecnico = DEMO_TECNICO_ASIGNADO[p.id];
            const historial = DEMO_EVAL_HISTORIAL[p.id] || [];
            const radarData = dims.map(d => ({ ...d, fullMark: 100 }));

            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Protocolo VITAL — {p.nombre}
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5">
                  {/* Header info */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-lg border border-border space-y-1">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" /> Comunidad</div>
                      <p className="text-sm font-medium text-foreground">{p.comunidad}</p>
                    </div>
                    <div className="p-3 rounded-lg border border-border space-y-1">
                      <p className="text-xs text-muted-foreground">Puntaje IGRN</p>
                      <p className={`text-2xl font-bold ${nivel.color}`}>{p.puntajeVITAL}/100</p>
                      <Badge variant="outline">{nivel.label}</Badge>
                    </div>
                  </div>

                  {/* Técnico asignado */}
                  {tecnico && (
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                      <UserCheck className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-foreground">Técnico asignado: {tecnico.nombre}</p>
                        <p className="text-xs text-muted-foreground">{tecnico.telefono}</p>
                      </div>
                    </div>
                  )}

                  {/* Radar de dimensiones */}
                  {radarData.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Puntaje por Dimensión</p>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={radarData}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="eje" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                          <Radar dataKey="score" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" strokeWidth={2} />
                        </RadarChart>
                      </ResponsiveContainer>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        {dims.map(d => {
                          const n = nivelVITAL(d.score);
                          return (
                            <div key={d.eje} className="flex items-center justify-between text-xs p-2 rounded border border-border">
                              <span className="text-muted-foreground">{d.eje}</span>
                              <span className={`font-bold ${n.color}`}>{d.score}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Historial de evaluaciones */}
                  {historial.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">Historial de Evaluaciones</p>
                      <div className="space-y-2">
                        {historial.map((h, i) => {
                          const hn = nivelProductor(h.score);
                          return (
                            <div key={i} className="flex items-center justify-between p-2.5 rounded-lg border border-border">
                              <div className="flex items-center gap-2">
                                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                <span className="text-sm text-foreground">{h.fecha}</span>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="text-xs text-muted-foreground">{h.evaluador}</span>
                                <span className={`text-sm font-bold ${hn.color}`}>{h.score}/100</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {historial.length >= 2 && (
                        <div className="mt-2 p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                          <p className="text-xs text-muted-foreground">
                            Tendencia: <span className={`font-bold ${historial[0].score > historial[historial.length - 1].score ? 'text-emerald-600' : 'text-destructive'}`}>
                              {historial[0].score > historial[historial.length - 1].score ? '↑' : '↓'} {Math.abs(historial[0].score - historial[historial.length - 1].score)} pts
                            </span> desde la primera evaluación
                          </p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Info adicional */}
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="p-2 rounded border border-border text-center">
                      <p className="text-muted-foreground">Parcelas</p>
                      <p className="font-bold text-foreground">{p.parcelas}</p>
                    </div>
                    <div className="p-2 rounded border border-border text-center">
                      <p className="text-muted-foreground">Hectáreas</p>
                      <p className="font-bold text-foreground">{p.hectareas}</p>
                    </div>
                    <div className="p-2 rounded border border-border text-center">
                      <p className="text-muted-foreground">EUDR</p>
                      <Badge variant={p.estadoEUDR === 'compliant' ? 'secondary' : 'destructive'} className="text-[10px]">
                        {p.estadoEUDR === 'compliant' ? 'Cumple' : p.estadoEUDR === 'pending' ? 'Pendiente' : 'No cumple'}
                      </Badge>
                    </div>
                  </div>

                  {/* Acciones validadas por técnico */}
                  {(DEMO_ACCIONES_VALIDADAS[p.id] || []).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <ClipboardCheck className="h-4 w-4 text-primary" /> Acciones — Validación Técnica
                      </p>
                      <div className="space-y-2">
                        {(DEMO_ACCIONES_VALIDADAS[p.id] || []).map(a => (
                          <div key={a.id} className={`flex items-start gap-3 p-2.5 rounded-lg border transition-colors ${
                            a.validada ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-border'
                          }`}>
                            <Checkbox checked={a.validada} disabled className="mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm ${a.validada ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                                {a.accion}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {a.validada
                                  ? `✓ Validada por ${a.tecnico} — ${a.fechaValidacion}`
                                  : `Pendiente · Asignada a ${a.tecnico}`
                                }
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-2 flex gap-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-emerald-600" />
                          {(DEMO_ACCIONES_VALIDADAS[p.id] || []).filter(a => a.validada).length} validadas
                        </span>
                        <span>
                          {(DEMO_ACCIONES_VALIDADAS[p.id] || []).filter(a => !a.validada).length} pendientes
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Comentarios del técnico */}
                  {(DEMO_COMENTARIOS_TECNICO[p.id] || []).length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-primary" /> Comentarios del Técnico
                      </p>
                      <div className="space-y-2">
                        {(DEMO_COMENTARIOS_TECNICO[p.id] || []).map((c, i) => (
                          <div key={i} className="p-3 rounded-lg bg-muted/50 border border-border">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-medium text-foreground">{c.tecnico}</span>
                              <span className="text-xs text-muted-foreground">{c.fecha}</span>
                            </div>
                            <p className="text-sm text-muted-foreground">{c.texto}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>

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
                      <p className="text-5xl font-bold mb-2" style={{ color: score100 >= 81 ? 'hsl(142, 60%, 40%)' : score100 >= 61 ? 'hsl(45, 90%, 50%)' : score100 >= 41 ? 'hsl(30, 90%, 50%)' : 'hsl(0, 65%, 50%)' }}>
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

                    {/* Recommendation */}
                    <Card className="bg-primary/5 border-primary/20">
                      <CardContent className="pt-4 pb-4">
                        <p className="text-xs font-semibold text-primary mb-1">Interpretación Nova Silva — Recomendación</p>
                        <p className="text-sm text-muted-foreground">
                          {score100 >= 81
                            ? RECOMENDACION_TEXTOS.implementacion_completa
                            : score100 >= 50
                            ? RECOMENDACION_TEXTOS.piloto_parcial
                            : RECOMENDACION_TEXTOS.fortalecimiento_previo}
                        </p>
                      </CardContent>
                    </Card>

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
