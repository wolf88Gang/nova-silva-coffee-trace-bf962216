import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import {
  Shield, FileCheck, CheckCircle, AlertTriangle, ExternalLink, MapPin, FileText,
  TrendingUp, Droplets, Sun, Leaf, ChevronRight, Globe, ChevronDown, ChevronUp, Upload,
  ArrowRight, ArrowLeft, Calendar, RotateCcw, ClipboardCheck, Thermometer, Sprout,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  VITAL_BLOCKS, TOTAL_QUESTIONS, calculateIGRN, IGRN_RANGES,
  type VitalBlock, type IGRNResult,
} from '@/config/vitalProductorQuestions';
import { generarInterpretacion, type ClimaProductorData } from '@/lib/climaInterpretacion';

// ── Block icons ──
const blockIcons = [Droplets, Sprout, Shield, Thermometer, Globe];

// ── Demo VITAL data ──
const vitalScore = {
  global: 75.1,
  exposicion: 0.72,
  sensibilidad: 0.68,
  adaptacion: 0.85,
  delta: '+16.8',
  nivel: 'En Construcción' as const,
  ultimaEval: '2026-01-20',
  frecuencia: 'bianual' as 'bianual' | 'trianual',
  proximaEval: '2027-07-20',
};

interface Recomendacion {
  area: string; prioridad: 'alta' | 'media' | 'baja'; accion: string;
  icon: typeof Droplets; detalle: string; impacto: string; plazo: string; recursos: string[];
}

const recomendaciones: Recomendacion[] = [
  { area: 'Recurso Hídrico', prioridad: 'alta', icon: Droplets,
    accion: 'Implementar sistema de cosecha de agua lluvia con tanque de al menos 5,000 litros.',
    detalle: 'La finca presenta déficit hídrico en los meses de enero a abril. Un sistema de cosecha de agua lluvia permitiría cubrir las necesidades de riego complementario durante la época seca.',
    impacto: '+8 puntos en Capacidad Adaptativa', plazo: '3-6 meses',
    recursos: ['Tanque de almacenamiento (5,000L)', 'Canaletas y filtros', 'Sistema de distribución por gravedad'] },
  { area: 'Sombra', prioridad: 'media', icon: Sun,
    accion: 'Incrementar cobertura de sombra al 50% usando Inga edulis.',
    detalle: 'La cobertura actual (35%) expone el cafetal a estrés térmico. Establecer Inga edulis como sombra temporal equilibrará la temperatura del suelo.',
    impacto: '+5 puntos en Exposición', plazo: '6-12 meses',
    recursos: ['Plántulas de Inga edulis (100/ha)', 'Plántulas de Erythrina (25/ha)', 'Tutores y protección'] },
  { area: 'Diversificación', prioridad: 'media', icon: Leaf,
    accion: 'Establecer cultivos alternativos para reducir dependencia del café.',
    detalle: 'Diversificar con cacao, frutales y hortalizas mejora la resiliencia económica ante fluctuaciones de precio.',
    impacto: '+6 puntos en Sensibilidad', plazo: '3-6 meses',
    recursos: ['Semillas de hortalizas', 'Plántulas de cacao o frutales', 'Herramientas de siembra'] },
];

const historialVital = [
  { fecha: '2026-01-20', puntaje: 75.1, nivel: 'Moderada', componentes: { exp: 72, sen: 68, ada: 85 } },
  { fecha: '2025-07-15', puntaje: 58.3, nivel: 'Alta Fragilidad', componentes: { exp: 55, sen: 52, ada: 68 } },
  { fecha: '2025-01-10', puntaje: 45.0, nivel: 'Alta Fragilidad', componentes: { exp: 40, sen: 45, ada: 50 } },
];

// ── EUDR data ──
const eudrCompliance = 87;
interface EUDRParcela {
  nombre: string; area: number; gps: boolean; docs: boolean; riesgo: 'bajo' | 'medio' | 'alto';
  coordenadas?: string; altitud?: string; documentos: { nombre: string; estado: 'vigente' | 'pendiente' | 'vencido' }[];
  deforestacion: boolean; legalidad: boolean;
}
const parcelasEUDR: EUDRParcela[] = [
  { nombre: 'Finca El Mirador', area: 3.5, gps: true, docs: true, riesgo: 'bajo',
    coordenadas: '9.9337° N, 84.0840° W', altitud: '1,450 msnm',
    documentos: [
      { nombre: 'Título de propiedad', estado: 'vigente' },
      { nombre: 'Permiso uso de suelo', estado: 'vigente' },
      { nombre: 'Estudio de impacto ambiental', estado: 'vigente' },
    ], deforestacion: true, legalidad: true },
  { nombre: 'Lote Norte', area: 1.2, gps: true, docs: false, riesgo: 'medio',
    coordenadas: '9.9350° N, 84.0855° W', altitud: '1,380 msnm',
    documentos: [
      { nombre: 'Contrato de arrendamiento', estado: 'vigente' },
      { nombre: 'Permiso ambiental', estado: 'pendiente' },
    ], deforestacion: true, legalidad: false },
];
const docVencimiento = { nombre: 'Permiso uso de suelo', diasRestantes: 45 };

const prioridadStyles: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-accent/10 text-accent border-accent/20',
  baja: 'bg-primary/10 text-primary border-primary/20',
};

const nivelColors: Record<string, string> = {
  'Crítica': 'text-destructive',
  'Alta Fragilidad': 'text-accent',
  'Moderada': 'text-foreground',
  'Resiliente': 'text-primary',
};

export default function SostenibilidadHub() {
  const [selectedRec, setSelectedRec] = useState<Recomendacion | null>(null);
  const [completedRecs, setCompletedRecs] = useState<Set<string>>(new Set());
  const [selectedParcela, setSelectedParcela] = useState<EUDRParcela | null>(null);
  const [expandedHistorial, setExpandedHistorial] = useState<string | null>(null);

  // VITAL Wizard
  const [showWizard, setShowWizard] = useState(false);
  const [wizardBlock, setWizardBlock] = useState(0);
  const [wizardAnswers, setWizardAnswers] = useState<Record<number, number>>({});
  const [wizardFrequency, setWizardFrequency] = useState<'bianual' | 'trianual'>('bianual');
  const [wizardComplete, setWizardComplete] = useState(false);

  const handleCompleteRec = (area: string) => {
    setCompletedRecs(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else { next.add(area); toast.success(`Acción "${area}" marcada como completada`); }
      return next;
    });
  };

  // False resilience from demo data
  const components = [vitalScore.exposicion, vitalScore.sensibilidad, vitalScore.adaptacion];
  const maxC = Math.max(...components);
  const minC = Math.min(...components);
  const hasFalseResilience = (maxC - minC) >= 0.4;

  // Wizard computed
  const currentBlock = VITAL_BLOCKS[wizardBlock];
  const answeredCount = Object.keys(wizardAnswers).length;
  const currentBlockAnswered = currentBlock?.preguntas.filter(q => wizardAnswers[q.id] !== undefined).length ?? 0;
  const isBlockComplete = currentBlockAnswered === (currentBlock?.preguntas.length ?? 0);

  const wizardResult = useMemo<IGRNResult | null>(() => {
    if (!wizardComplete) return null;
    return calculateIGRN(wizardAnswers);
  }, [wizardComplete, wizardAnswers]);

  const finishWizard = () => {
    setWizardComplete(true);
    toast.success('Evaluación VITAL completada exitosamente');
  };
  const resetWizard = () => {
    setShowWizard(false); setWizardBlock(0); setWizardAnswers({}); setWizardComplete(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sostenibilidad</h1>
        <p className="text-sm text-muted-foreground">Protocolo VITAL y cumplimiento EUDR</p>
      </div>

      <Tabs defaultValue="vital">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="vital" className="flex items-center gap-1.5"><Shield className="h-3.5 w-3.5" /> Protocolo VITAL</TabsTrigger>
          <TabsTrigger value="eudr" className="flex items-center gap-1.5"><Globe className="h-3.5 w-3.5" /> Pasaporte EUDR</TabsTrigger>
        </TabsList>

        {/* ── PROTOCOLO VITAL ── */}
        <TabsContent value="vital" className="space-y-6 mt-4">
          {/* Score Card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Protocolo VITAL</CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="border-amber-500 text-amber-500">{vitalScore.nivel}</Badge>
                  <Button size="sm" onClick={() => setShowWizard(true)}>
                    <ClipboardCheck className="h-4 w-4 mr-1" /> Actualizar evaluación
                  </Button>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Índice de Gestión de Riesgo Natural (IGRN) — 100 preguntas en 5 bloques • Fórmula: IGRN = 0.35×C + 0.30×E + 0.35×R
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="border border-border">
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Puntaje IGRN</p>
                    <p className="text-4xl font-bold text-foreground">{vitalScore.global}<span className="text-lg text-muted-foreground">/100</span></p>
                    <Progress value={vitalScore.global} className="h-1.5 mt-2" />
                    <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {vitalScore.delta} pts
                    </p>
                  </CardContent>
                </Card>
                {[
                  { label: 'Exposición (C)', value: Math.round(vitalScore.exposicion * 100), peso: 'α=0.35', sub: 'Impacto eventos climáticos', icon: Sun },
                  { label: 'Sensibilidad (E)', value: Math.round(vitalScore.sensibilidad * 100), peso: 'β=0.30', sub: 'Vulnerabilidad del sistema', icon: Droplets },
                  { label: 'Adaptación (R)', value: Math.round(vitalScore.adaptacion * 100), peso: 'γ=0.35', sub: 'Capacidad de respuesta', icon: Leaf },
                ].map((d) => (
                  <Card key={d.label} className="border border-border">
                    <CardContent className="pt-4 pb-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <d.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{d.label} <span className="text-[9px]">({d.peso})</span></p>
                      </div>
                      <p className="text-3xl font-bold text-foreground">{d.value}</p>
                      <Progress value={d.value} className="h-1.5 mt-2" />
                      <p className="text-[10px] text-muted-foreground mt-1">{d.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Schedule */}
              <div className="mt-4 flex items-center justify-between p-3 rounded-lg bg-muted border border-border">
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-foreground">Última evaluación: <span className="font-semibold">{vitalScore.ultimaEval}</span></p>
                    <p className="text-xs text-muted-foreground">Frecuencia: {vitalScore.frecuencia === 'bianual' ? 'Cada 2 años' : 'Cada 3 años'} • Próxima: <span className="font-semibold text-primary">{vitalScore.proximaEval}</span></p>
                  </div>
                </div>
              </div>

              {hasFalseResilience && (
                <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Alerta de Falsa Resiliencia</p>
                      <p className="text-xs text-muted-foreground">
                        Diferencia de {Math.round((maxC - minC) * 100)} puntos entre componentes. El puntaje global puede enmascarar vulnerabilidades críticas.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interpretación */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-primary mb-2">Interpretación Nova Silva</p>
              <p className="text-sm text-muted-foreground">
                Su finca se clasifica como <span className="font-bold text-foreground">{vitalScore.nivel}</span> con un puntaje IGRN de {vitalScore.global}/100.
                Ha mejorado {vitalScore.delta} puntos desde la última evaluación.
                {vitalScore.sensibilidad < 0.7 && ' El componente de Sensibilidad requiere atención prioritaria.'}
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                {IGRN_RANGES.map(r => {
                  const bgMap: Record<string, string> = {
                    destructive: 'bg-destructive/10 text-destructive',
                    orange: 'bg-orange-500/10 text-orange-600',
                    amber: 'bg-amber-500/10 text-amber-600',
                    emerald: 'bg-emerald-500/10 text-emerald-600',
                  };
                  return (
                    <div key={r.label} className={`p-2 rounded text-center ${bgMap[r.color] || ''}`}>
                      <p className="font-bold">{r.min}-{r.max}</p>
                      <p className="text-muted-foreground">{r.label}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Plan + Historial */}
          <Tabs defaultValue="recomendaciones">
            <TabsList>
              <TabsTrigger value="recomendaciones" className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Plan de Mejora</TabsTrigger>
              <TabsTrigger value="historial-vital" className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="recomendaciones" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plan de Mejora</CardTitle>
                  <p className="text-xs text-muted-foreground">Haz clic en cada recomendación para ver el detalle completo</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recomendaciones.map((r) => (
                    <button key={r.area} onClick={() => setSelectedRec(r)}
                      className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                        completedRecs.has(r.area) ? 'border-primary/30 bg-primary/5 opacity-75' : 'border-border hover:border-primary/50'
                      }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 mb-1">
                          {completedRecs.has(r.area) ? <CheckCircle className="h-4 w-4 text-primary" /> : <r.icon className="h-4 w-4 text-accent" />}
                          <span className="font-semibold text-foreground">{r.area}</span>
                          <Badge className={prioridadStyles[r.prioridad]} variant="default">{r.prioridad}</Badge>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <p className="text-sm text-muted-foreground ml-6">{r.accion}</p>
                    </button>
                  ))}
                </CardContent>
              </Card>

              <Dialog open={!!selectedRec} onOpenChange={() => setSelectedRec(null)}>
                <DialogContent className="max-w-lg">
                  {selectedRec && (
                    <>
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <selectedRec.icon className="h-5 w-5 text-primary" />
                          {selectedRec.area}
                          <Badge className={prioridadStyles[selectedRec.prioridad]}>{selectedRec.prioridad}</Badge>
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <p className="text-sm text-muted-foreground">{selectedRec.detalle}</p>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs text-muted-foreground">Impacto estimado</p>
                            <p className="text-sm font-bold text-primary">{selectedRec.impacto}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted border border-border">
                            <p className="text-xs text-muted-foreground">Plazo</p>
                            <p className="text-sm font-bold text-foreground">{selectedRec.plazo}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-2">Recursos necesarios</p>
                          <ul className="space-y-1">
                            {selectedRec.recursos.map((r, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-3 w-3 text-primary shrink-0" />{r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex gap-2">
                          <Button variant={completedRecs.has(selectedRec.area) ? 'outline' : 'default'} className="flex-1"
                            onClick={() => { handleCompleteRec(selectedRec.area); setSelectedRec(null); }}>
                            {completedRecs.has(selectedRec.area) ? 'Desmarcar completada' : 'Marcar como completada'}
                          </Button>
                          <DialogClose asChild><Button variant="outline">Cerrar</Button></DialogClose>
                        </div>
                      </div>
                    </>
                  )}
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="historial-vital" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-4 space-y-2">
                  {historialVital.map((h) => (
                    <div key={h.fecha}>
                      <button onClick={() => setExpandedHistorial(expandedHistorial === h.fecha ? null : h.fecha)}
                        className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{h.fecha}</span>
                          <span className={`font-bold ${nivelColors[h.nivel] || 'text-foreground'}`}>{h.puntaje}/100</span>
                          <Badge variant="outline">{h.nivel}</Badge>
                        </div>
                        {expandedHistorial === h.fecha ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      {expandedHistorial === h.fecha && (
                        <div className="ml-4 mt-2 p-3 rounded-lg bg-muted/50 border border-border">
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div><p className="text-xs text-muted-foreground">Exposición (C)</p><p className="font-bold text-foreground">{h.componentes.exp}</p></div>
                            <div><p className="text-xs text-muted-foreground">Sensibilidad (E)</p><p className="font-bold text-foreground">{h.componentes.sen}</p></div>
                            <div><p className="text-xs text-muted-foreground">Adaptación (R)</p><p className="font-bold text-foreground">{h.componentes.ada}</p></div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* ── PASAPORTE EUDR ── */}
        <TabsContent value="eudr" className="space-y-6 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /> Pasaporte EUDR</CardTitle>
                  <p className="text-sm text-muted-foreground">Estado de cumplimiento para exportación a la Unión Europea</p>
                </div>
                <Badge variant="outline">Reglamento (UE) 2023/1115</Badge>
              </div>
            </CardHeader>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="pt-6 text-center space-y-3">
                <p className="text-sm text-muted-foreground">Cumplimiento General</p>
                <p className="text-5xl font-bold text-primary">{eudrCompliance}%</p>
                <Progress value={eudrCompliance} className="h-2" />
                <div className="flex items-center justify-center gap-2 text-sm text-primary">
                  <CheckCircle className="h-4 w-4" /><span>Apto para exportación UE</span>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: 'Geolocalización', pct: 100, ok: true },
                    { label: 'Documentación', pct: 75, ok: false },
                    { label: 'No deforestación', pct: 100, ok: true },
                    { label: 'Legalidad', pct: 75, ok: false },
                  ].map(cat => (
                    <button key={cat.label} onClick={() => toast.info(`${cat.label}: ${cat.ok ? 'Cumple con todos los requisitos' : 'Parcela "Lote Norte" necesita documentación'}`)}
                      className="p-2 rounded-lg border border-border text-center hover:bg-muted/50 transition-colors cursor-pointer">
                      <p className="text-xs text-muted-foreground">{cat.label}</p>
                      <p className={`text-lg font-bold ${cat.ok ? 'text-primary' : 'text-accent'}`}>{cat.pct}%</p>
                      <Progress value={cat.pct} className="h-1 mt-1" />
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Estado de Parcelas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {parcelasEUDR.map((p) => (
                  <button key={p.nombre} onClick={() => setSelectedParcela(p)}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3">
                      <div className={`h-2.5 w-2.5 rounded-full ${p.riesgo === 'bajo' ? 'bg-primary' : p.riesgo === 'medio' ? 'bg-accent' : 'bg-destructive'}`} />
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                        <p className="text-xs text-muted-foreground">{p.area} ha</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs"><MapPin className="h-3 w-3 mr-1" /> GPS</Badge>
                      <Badge variant={p.docs ? 'outline' : 'destructive'} className="text-xs">
                        <FileText className="h-3 w-3 mr-1" /> {p.docs ? 'Docs' : 'Pendiente'}
                      </Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground" />
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Parcela detail dialog */}
          <Dialog open={!!selectedParcela} onOpenChange={() => setSelectedParcela(null)}>
            <DialogContent className="max-w-lg">
              {selectedParcela && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2"><MapPin className="h-5 w-5 text-primary" /> {selectedParcela.nombre}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Área</p><p className="font-bold text-foreground">{selectedParcela.area} ha</p></div>
                      <div className="p-3 rounded-lg border border-border"><p className="text-xs text-muted-foreground">Altitud</p><p className="font-bold text-foreground">{selectedParcela.altitud}</p></div>
                      <div className="p-3 rounded-lg border border-border col-span-2"><p className="text-xs text-muted-foreground">Coordenadas</p><p className="font-bold text-foreground">{selectedParcela.coordenadas}</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {[
                        { label: 'Geolocalización', ok: selectedParcela.gps },
                        { label: 'Documentación', ok: selectedParcela.docs },
                        { label: 'No deforestación post 2020', ok: selectedParcela.deforestacion },
                        { label: 'Legalidad nacional', ok: selectedParcela.legalidad },
                      ].map(c => (
                        <div key={c.label} className={`p-2 rounded-lg border ${c.ok ? 'border-primary/20 bg-primary/5' : 'border-destructive/20 bg-destructive/5'}`}>
                          <div className="flex items-center gap-1.5">
                            {c.ok ? <CheckCircle className="h-3.5 w-3.5 text-primary" /> : <AlertTriangle className="h-3.5 w-3.5 text-destructive" />}
                            <span className="text-xs">{c.label}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-2">Documentación</p>
                      {selectedParcela.documentos.map((d, i) => (
                        <div key={i} className="flex items-center justify-between p-2 border-b border-border last:border-0">
                          <span className="text-sm text-muted-foreground">{d.nombre}</span>
                          <Badge variant={d.estado === 'vigente' ? 'default' : d.estado === 'pendiente' ? 'secondary' : 'destructive'}>{d.estado}</Badge>
                        </div>
                      ))}
                    </div>
                    {!selectedParcela.docs && (
                      <Button className="w-full" onClick={() => { toast.info('Función de subir documentos próximamente'); setSelectedParcela(null); }}>
                        <Upload className="h-4 w-4 mr-1" /> Subir documentos faltantes
                      </Button>
                    )}
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-primary mb-2">Interpretación Nova Silva</p>
              <p className="text-sm text-muted-foreground">
                Su nivel de cumplimiento EUDR es del <span className="font-bold text-foreground">{eudrCompliance}%</span>.
                {eudrCompliance < 100 && ' Para alcanzar el 100%, complete la documentación pendiente de "Lote Norte".'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <p className="text-sm text-foreground">Documento "{docVencimiento.nombre}" vence en {docVencimiento.diasRestantes} días</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Recordatorio configurado')}>Renovar</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ══════════ VITAL WIZARD DIALOG — 100 PREGUNTAS ══════════ */}
      <Dialog open={showWizard} onOpenChange={(open) => { if (!open) resetWizard(); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {!wizardComplete ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Evaluación Protocolo VITAL
                </DialogTitle>
                <p className="text-xs text-muted-foreground">
                  {answeredCount} de {TOTAL_QUESTIONS} preguntas • Bloque {wizardBlock + 1}/5: {currentBlock.nombre} ({currentBlock.rango})
                </p>
              </DialogHeader>

              {/* Block stepper */}
              <div className="flex items-center gap-1">
                {VITAL_BLOCKS.map((b, i) => {
                  const Icon = blockIcons[i];
                  const blockAnswered = b.preguntas.filter(q => wizardAnswers[q.id] !== undefined).length;
                  const blockTotal = b.preguntas.length;
                  const pct = blockTotal > 0 ? (blockAnswered / blockTotal) * 100 : 0;
                  return (
                    <button key={b.id} onClick={() => setWizardBlock(i)}
                      className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg transition-colors ${i === wizardBlock ? 'bg-primary/10' : 'hover:bg-muted'}`}>
                      <div className="relative w-full">
                        <div className="h-2 w-full rounded-full bg-muted">
                          <div className="h-2 rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <Icon className={`h-3.5 w-3.5 ${i === wizardBlock ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`text-[9px] leading-tight text-center ${i === wizardBlock ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                        {b.nombre}
                      </span>
                      <span className="text-[8px] text-muted-foreground">{blockAnswered}/{blockTotal}</span>
                    </button>
                  );
                })}
              </div>

              {/* Questions */}
              <div className="space-y-3 mt-2">
                {currentBlock.preguntas.map((q) => (
                  <div key={q.id} className="p-3 rounded-lg border border-border space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">{q.componente}</Badge>
                      <p className="text-sm font-medium text-foreground">P{q.id}. {q.texto}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      {q.opciones.map((opt, oi) => {
                        const isSelected = wizardAnswers[q.id] === opt.score;
                        return (
                          <button key={oi} onClick={() => setWizardAnswers(prev => ({ ...prev, [q.id]: opt.score }))}
                            className={`p-2 rounded-lg border text-xs transition-all text-left ${
                              isSelected ? 'ring-2 ring-primary border-primary bg-primary/10 font-semibold text-foreground' : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/50'
                            }`}>
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" disabled={wizardBlock === 0} onClick={() => setWizardBlock(prev => prev - 1)}>
                  <ArrowLeft className="h-4 w-4 mr-1" /> Anterior
                </Button>
                <div className="text-center">
                  <Progress value={(answeredCount / TOTAL_QUESTIONS) * 100} className="h-2 w-32" />
                  <p className="text-[10px] text-muted-foreground mt-1">{Math.round((answeredCount / TOTAL_QUESTIONS) * 100)}%</p>
                </div>
                {wizardBlock < VITAL_BLOCKS.length - 1 ? (
                  <Button onClick={() => setWizardBlock(prev => prev + 1)}>
                    Siguiente <ArrowRight className="h-4 w-4 ml-1" />
                  </Button>
                ) : (
                  <Button disabled={answeredCount < TOTAL_QUESTIONS} onClick={finishWizard}>
                    Finalizar <CheckCircle className="h-4 w-4 ml-1" />
                  </Button>
                )}
              </div>

              {/* Frequency */}
              <div className="mt-4 p-3 rounded-lg bg-muted border border-border">
                <p className="text-xs text-muted-foreground mb-2">Frecuencia de evaluación</p>
                <div className="flex gap-2">
                  {(['bianual', 'trianual'] as const).map(f => (
                    <button key={f} onClick={() => setWizardFrequency(f)}
                      className={`flex-1 p-2 rounded-lg border text-sm transition-all ${wizardFrequency === f ? 'border-primary bg-primary/10 text-primary font-semibold' : 'border-border text-muted-foreground hover:bg-muted/50'}`}>
                      {f === 'bianual' ? 'Cada 2 años' : 'Cada 3 años'}
                    </button>
                  ))}
                </div>
              </div>
            </>
          ) : wizardResult && (() => {
            const nivelRiesgo = wizardResult.igrn <= 40 ? 'critico' as const : wizardResult.igrn <= 60 ? 'alto' as const : wizardResult.igrn <= 80 ? 'medio' as const : 'bajo' as const;
            const interpData: ClimaProductorData = {
              indice_clima: wizardResult.igrn,
              nivel_riesgo_global: nivelRiesgo,
              puntaje_exposicion: Math.round(wizardResult.muClima * 100),
              puntaje_sensibilidad: Math.round(wizardResult.muEstructura * 100),
              puntaje_capacidad_adaptativa: Math.round(wizardResult.muRespuesta * 100),
              riesgo_exposicion: wizardResult.muClima <= 0.4 ? 'critico' : wizardResult.muClima <= 0.6 ? 'alto' : wizardResult.muClima <= 0.8 ? 'medio' : 'bajo',
              riesgo_sensibilidad: wizardResult.muEstructura <= 0.4 ? 'critico' : wizardResult.muEstructura <= 0.6 ? 'alto' : wizardResult.muEstructura <= 0.8 ? 'medio' : 'bajo',
              riesgo_capacidad_adaptativa: wizardResult.muRespuesta <= 0.4 ? 'critico' : wizardResult.muRespuesta <= 0.6 ? 'alto' : wizardResult.muRespuesta <= 0.8 ? 'medio' : 'bajo',
              factores_riesgo: [],
            };
            const interp = generarInterpretacion(interpData);

            return (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2"><CheckCircle className="h-5 w-5 text-primary" /> Evaluación Completada</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-center p-6">
                  <p className="text-6xl font-bold text-foreground">{wizardResult.igrn}<span className="text-2xl text-muted-foreground">/100</span></p>
                  <p className="text-sm text-muted-foreground mt-2">Índice de Gestión de Riesgo Natural (IGRN)</p>
                  {(() => {
                    const colorMap: Record<string, string> = {
                      destructive: 'border-destructive text-destructive',
                      orange: 'border-orange-500 text-orange-500',
                      amber: 'border-amber-500 text-amber-500',
                      emerald: 'border-emerald-500 text-emerald-600',
                    };
                    return (
                      <Badge variant="outline" className={`mt-2 ${colorMap[wizardResult.color] || ''}`}>
                        {wizardResult.nivel}
                      </Badge>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Exposición (C)', value: Math.round(wizardResult.muClima * 100), peso: '×0.35', icon: Sun },
                    { label: 'Sensibilidad (E)', value: Math.round(wizardResult.muEstructura * 100), peso: '×0.30', icon: Droplets },
                    { label: 'Adaptación (R)', value: Math.round(wizardResult.muRespuesta * 100), peso: '×0.35', icon: Leaf },
                  ].map((d) => (
                    <div key={d.label} className="p-3 rounded-lg border border-border text-center">
                      <d.icon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                      <p className="text-lg font-bold text-foreground">{d.value}</p>
                      <p className="text-[10px] text-muted-foreground">{d.label}</p>
                      <p className="text-[9px] text-muted-foreground">{d.peso}</p>
                    </div>
                  ))}
                </div>

                {wizardResult.falsaResiliencia && (
                  <div className="p-3 rounded-lg bg-accent/10 border border-accent/20">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">⚠️ Falsa Resiliencia Detectada</p>
                        <p className="text-xs text-muted-foreground">
                          Diferencia ≥40 puntos entre componentes. El IGRN puede enmascarar vulnerabilidades críticas en uno o más ejes.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* ── Interpretación Nova Silva completa (6 secciones) ── */}
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="pt-4 pb-4 space-y-4">
                    <p className="text-xs font-semibold text-primary">Interpretación Nova Silva</p>

                    {/* S1: Qué es */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">¿Qué es el Protocolo VITAL?</p>
                      <p className="text-xs text-muted-foreground">{interp.queEsDiagnostico}</p>
                    </div>

                    {/* S2: Resumen */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">Resumen de su situación</p>
                      <p className="text-xs text-muted-foreground">{interp.resumenSituacion}</p>
                    </div>

                    {/* S3: Dimensiones */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-2">Análisis por Dimensión</p>
                      {(['exposicion', 'sensibilidad', 'capacidad_adaptativa'] as const).map(dim => {
                        const d = interp.analisisDimensiones[dim];
                        return (
                          <div key={dim} className="mb-2 p-2 rounded-lg border border-border">
                            <p className="text-xs font-medium text-foreground">{d.titulo} — <span className="capitalize">{d.nivel}</span> ({d.puntaje}/100)</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{d.texto}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* S5: Pasos */}
                    {interp.pasosCorto.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Pasos a corto plazo (6-12 meses)</p>
                        <ul className="space-y-1">
                          {interp.pasosCorto.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <CheckCircle className="h-3 w-3 text-primary mt-0.5 shrink-0" />{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {interp.pasosMediano.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-foreground mb-1">Pasos a mediano plazo (1-3 años)</p>
                        <ul className="space-y-1">
                          {interp.pasosMediano.map((p, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <ArrowRight className="h-3 w-3 text-primary mt-0.5 shrink-0" />{p}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* S6: Apoyo */}
                    <div>
                      <p className="text-xs font-semibold text-foreground mb-1">¿Cómo le apoya su organización?</p>
                      <ul className="space-y-1">
                        {interp.apoyoCooperativa.map((a, i) => (
                          <li key={i} className="text-xs text-muted-foreground">• {a}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>

                <p className="text-xs text-muted-foreground text-center">
                  Próxima evaluación: {wizardFrequency === 'bianual' ? '2028' : '2029'}
                </p>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => {
                    const text = `VITAL IGRN: ${wizardResult.igrn}/100 — ${wizardResult.nivel}\nExposición: ${Math.round(wizardResult.muClima*100)}\nSensibilidad: ${Math.round(wizardResult.muEstructura*100)}\nAdaptación: ${Math.round(wizardResult.muRespuesta*100)}\n\n${interp.resumenSituacion}`;
                    navigator.clipboard.writeText(text);
                    toast.success('Resultado copiado al portapapeles');
                  }}>
                    Exportar resultado
                  </Button>
                  <Button className="flex-1" onClick={resetWizard}>Cerrar</Button>
                </div>
              </div>
            </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
