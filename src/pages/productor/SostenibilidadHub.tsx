import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import {
  Shield, FileCheck, CheckCircle, AlertTriangle, ExternalLink, MapPin, FileText,
  TrendingUp, Droplets, Sun, Leaf, ChevronRight, Globe, ChevronDown, ChevronUp, Upload,
} from 'lucide-react';
import { toast } from 'sonner';

// ── VITAL data ──
const vitalScore = {
  global: 75.1,
  exposicion: 72,
  sensibilidad: 68,
  adaptacion: 85,
  delta: '+16.8',
  nivel: 'Resiliente',
};

interface Recomendacion {
  area: string;
  prioridad: 'alta' | 'media' | 'baja';
  accion: string;
  icon: typeof Droplets;
  detalle: string;
  impacto: string;
  plazo: string;
  recursos: string[];
}

const recomendaciones: Recomendacion[] = [
  {
    area: 'Recurso Hídrico', prioridad: 'alta', icon: Droplets,
    accion: 'Implementar sistema de cosecha de agua lluvia con tanque de almacenamiento de al menos 5,000 litros.',
    detalle: 'La finca presenta déficit hídrico en los meses de enero a abril. Un sistema de cosecha de agua lluvia con capacidad de 5,000 litros permitiría cubrir las necesidades de riego complementario durante la época seca, reduciendo la dependencia de fuentes externas.',
    impacto: '+8 puntos en componente de Adaptación',
    plazo: '3-6 meses para implementación completa',
    recursos: ['Tanque de almacenamiento (5,000L)', 'Canaletas y filtros', 'Sistema de distribución por gravedad'],
  },
  {
    area: 'Sombra', prioridad: 'media', icon: Sun,
    accion: 'Incrementar cobertura de sombra al 50% usando especies de servicio como Inga edulis.',
    detalle: 'La cobertura de sombra actual (35%) expone el cafetal a estrés térmico y lumínico. Establecer Inga edulis (guaba) como sombra temporal y Erythrina poeppigiana como sombra permanente equilibrará la temperatura del suelo y reducirá la evapotranspiración.',
    impacto: '+5 puntos en componente de Exposición',
    plazo: '6-12 meses (crecimiento inicial de árboles)',
    recursos: ['Plántulas de Inga edulis (100/ha)', 'Plántulas de Erythrina (25/ha)', 'Tutores y protección'],
  },
  {
    area: 'Diversificación', prioridad: 'media', icon: Leaf,
    accion: 'Establecer parcelas de cultivos alternativos para reducir la dependencia del café.',
    detalle: 'Diversificar con cacao, frutales y hortalizas en los espacios disponibles mejora la resiliencia económica ante fluctuaciones de precio del café y proporciona seguridad alimentaria para la familia.',
    impacto: '+6 puntos en componente de Sensibilidad',
    plazo: '3-6 meses (preparación e instalación)',
    recursos: ['Semillas de hortalizas', 'Plántulas de cacao o frutales', 'Herramientas de siembra'],
  },
];

const historialVital = [
  { fecha: '2026-01-20', puntaje: 75.1, nivel: 'Resiliente', componentes: { exp: 72, sen: 68, ada: 85 } },
  { fecha: '2025-07-15', puntaje: 58.3, nivel: 'En Transición', componentes: { exp: 55, sen: 52, ada: 68 } },
  { fecha: '2025-01-10', puntaje: 45.0, nivel: 'Vulnerable', componentes: { exp: 40, sen: 45, ada: 50 } },
];

// ── EUDR data ──
const eudrCompliance = 87;

interface EUDRParcela {
  nombre: string; area: number; gps: boolean; docs: boolean; riesgo: 'bajo' | 'medio' | 'alto';
  coordenadas?: string; altitud?: string; documentos: { nombre: string; estado: 'vigente' | 'pendiente' | 'vencido' }[];
  deforestacion: boolean; legalidad: boolean;
}

const parcelasEUDR: EUDRParcela[] = [
  {
    nombre: 'Finca El Mirador', area: 3.5, gps: true, docs: true, riesgo: 'bajo',
    coordenadas: '9.9337° N, 84.0840° W', altitud: '1,450 msnm',
    documentos: [
      { nombre: 'Título de propiedad', estado: 'vigente' },
      { nombre: 'Permiso uso de suelo', estado: 'vigente' },
      { nombre: 'Estudio de impacto ambiental', estado: 'vigente' },
    ],
    deforestacion: true, legalidad: true,
  },
  {
    nombre: 'Lote Norte', area: 1.2, gps: true, docs: false, riesgo: 'medio',
    coordenadas: '9.9350° N, 84.0855° W', altitud: '1,380 msnm',
    documentos: [
      { nombre: 'Contrato de arrendamiento', estado: 'vigente' },
      { nombre: 'Permiso ambiental', estado: 'pendiente' },
    ],
    deforestacion: true, legalidad: false,
  },
];

const docVencimiento = { nombre: 'Permiso uso de suelo', diasRestantes: 45 };

const prioridadStyles: Record<string, string> = {
  alta: 'bg-destructive/10 text-destructive border-destructive/20',
  media: 'bg-accent/10 text-accent border-accent/20',
  baja: 'bg-primary/10 text-primary border-primary/20',
};

const nivelColors: Record<string, string> = {
  Vulnerable: 'text-destructive',
  'En Transición': 'text-accent',
  Resiliente: 'text-primary',
  Regenerativo: 'text-primary',
};

export default function SostenibilidadHub() {
  const [selectedRec, setSelectedRec] = useState<Recomendacion | null>(null);
  const [completedRecs, setCompletedRecs] = useState<Set<string>>(new Set());
  const [selectedParcela, setSelectedParcela] = useState<EUDRParcela | null>(null);
  const [expandedHistorial, setExpandedHistorial] = useState<string | null>(null);

  const handleCompleteRec = (area: string) => {
    setCompletedRecs(prev => {
      const next = new Set(prev);
      if (next.has(area)) next.delete(area);
      else { next.add(area); toast.success(`Acción "${area}" marcada como completada`); }
      return next;
    });
  };

  // False resilience detection
  const components = [vitalScore.exposicion, vitalScore.sensibilidad, vitalScore.adaptacion];
  const maxC = Math.max(...components);
  const minC = Math.min(...components);
  const hasFalseResilience = (maxC - minC) >= 40;

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
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-5 w-5 text-primary" /> Protocolo VITAL</CardTitle>
                <Badge variant="outline" className="border-primary text-primary">{vitalScore.nivel}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Evaluación de vulnerabilidad climática — Índice de Gestión de Riesgo Natural (IGRN)</p>
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
                    <p className="text-[10px] text-muted-foreground">vs evaluación anterior</p>
                  </CardContent>
                </Card>
                {[
                  { label: 'Exposición', value: vitalScore.exposicion, peso: 'α=0.35', sub: 'Impacto eventos climáticos', icon: Sun },
                  { label: 'Sensibilidad', value: vitalScore.sensibilidad, peso: 'β=0.30', sub: 'Vulnerabilidad del sistema', icon: Droplets },
                  { label: 'Adaptación', value: vitalScore.adaptacion, peso: 'γ=0.35', sub: 'Capacidad de respuesta', icon: Leaf },
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

              {hasFalseResilience && (
                <div className="mt-4 p-3 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-accent shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">Alerta de Falsa Resiliencia</p>
                      <p className="text-xs text-muted-foreground">
                        Se detecta una diferencia de {maxC - minC} puntos entre el componente más alto ({maxC}) y el más bajo ({minC}).
                        Cuando esta diferencia supera 40 puntos, indica que la resiliencia podría ser aparente. Fortalezca los componentes más débiles.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Interpretación Nova Silva */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-primary mb-2">Interpretación Nova Silva</p>
              <p className="text-sm text-muted-foreground">
                Su finca se clasifica como <span className="font-bold text-foreground">{vitalScore.nivel}</span> con un puntaje IGRN de {vitalScore.global}/100.
                Ha mejorado {vitalScore.delta} puntos desde la última evaluación, lo que refleja un progreso significativo en capacidad adaptativa ({vitalScore.adaptacion}/100).
                {vitalScore.sensibilidad < 70 && ' Sin embargo, el componente de Sensibilidad requiere atención prioritaria para consolidar la resiliencia.'}
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded bg-destructive/10 text-center"><p className="font-bold">0-39</p><p className="text-muted-foreground">Vulnerable</p></div>
                <div className="p-2 rounded bg-accent/10 text-center"><p className="font-bold">40-59</p><p className="text-muted-foreground">Transición</p></div>
                <div className="p-2 rounded bg-primary/10 text-center"><p className="font-bold">60-79</p><p className="text-muted-foreground">Resiliente</p></div>
                <div className="p-2 rounded bg-primary/20 text-center"><p className="font-bold">80-100</p><p className="text-muted-foreground">Regenerativo</p></div>
              </div>
            </CardContent>
          </Card>

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
                    <button
                      key={r.area}
                      onClick={() => setSelectedRec(r)}
                      className={`w-full text-left p-4 rounded-lg border transition-all hover:shadow-md ${
                        completedRecs.has(r.area)
                          ? 'border-primary/30 bg-primary/5 opacity-75'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 mb-1">
                          {completedRecs.has(r.area) ? (
                            <CheckCircle className="h-4 w-4 text-primary" />
                          ) : (
                            <r.icon className="h-4 w-4 text-accent" />
                          )}
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

              {/* Recommendation detail dialog */}
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
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-1">Descripción</p>
                          <p className="text-sm text-muted-foreground">{selectedRec.detalle}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-xs text-muted-foreground">Impacto estimado</p>
                            <p className="text-sm font-bold text-primary">{selectedRec.impacto}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted border border-border">
                            <p className="text-xs text-muted-foreground">Plazo de implementación</p>
                            <p className="text-sm font-bold text-foreground">{selectedRec.plazo}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground mb-2">Recursos necesarios</p>
                          <ul className="space-y-1">
                            {selectedRec.recursos.map((r, i) => (
                              <li key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="h-3 w-3 text-primary shrink-0" />
                                {r}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant={completedRecs.has(selectedRec.area) ? 'outline' : 'default'}
                            className="flex-1"
                            onClick={() => { handleCompleteRec(selectedRec.area); setSelectedRec(null); }}
                          >
                            {completedRecs.has(selectedRec.area) ? 'Desmarcar completada' : 'Marcar como completada'}
                          </Button>
                          <DialogClose asChild>
                            <Button variant="outline">Cerrar</Button>
                          </DialogClose>
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
                      <button
                        onClick={() => setExpandedHistorial(expandedHistorial === h.fecha ? null : h.fecha)}
                        className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-sm text-muted-foreground">{h.fecha}</span>
                          <span className={`font-bold ${nivelColors[h.nivel] || 'text-foreground'}`}>{h.puntaje}/100</span>
                          <Badge variant="outline">{h.nivel}</Badge>
                        </div>
                        {expandedHistorial === h.fecha ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      {expandedHistorial === h.fecha && (
                        <div className="ml-4 mt-2 p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                          <div className="grid grid-cols-3 gap-3 text-sm">
                            <div><p className="text-xs text-muted-foreground">Exposición</p><p className="font-bold text-foreground">{h.componentes.exp}</p></div>
                            <div><p className="text-xs text-muted-foreground">Sensibilidad</p><p className="font-bold text-foreground">{h.componentes.sen}</p></div>
                            <div><p className="text-xs text-muted-foreground">Adaptación</p><p className="font-bold text-foreground">{h.componentes.ada}</p></div>
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
                  <CheckCircle className="h-4 w-4" />
                  <span>Apto para exportación UE</span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  {[
                    { label: 'Geolocalización', pct: 100, ok: true },
                    { label: 'Documentación', pct: 75, ok: false },
                    { label: 'No deforestación', pct: 100, ok: true },
                    { label: 'Legalidad', pct: 75, ok: false },
                  ].map(cat => (
                    <div key={cat.label} className="p-2 rounded-lg border border-border text-center">
                      <p className="text-xs text-muted-foreground">{cat.label}</p>
                      <p className={`text-lg font-bold ${cat.ok ? 'text-primary' : 'text-accent'}`}>{cat.pct}%</p>
                      <Progress value={cat.pct} className="h-1 mt-1" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Estado de Parcelas</CardTitle>
                <p className="text-xs text-muted-foreground">Haz clic en una parcela para ver el detalle completo</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {parcelasEUDR.map((p) => (
                  <button
                    key={p.nombre}
                    onClick={() => setSelectedParcela(p)}
                    className="w-full text-left flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors group"
                  >
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
                      <Badge variant="outline" className="text-xs">Riesgo {p.riesgo}</Badge>
                      <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* EUDR Parcela detail dialog */}
          <Dialog open={!!selectedParcela} onOpenChange={() => setSelectedParcela(null)}>
            <DialogContent className="max-w-lg">
              {selectedParcela && (
                <>
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" /> {selectedParcela.nombre}
                    </DialogTitle>
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

          {/* Interpretación EUDR */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-4 pb-4">
              <p className="text-xs font-semibold text-primary mb-2">Interpretación Nova Silva</p>
              <p className="text-sm text-muted-foreground">
                Su nivel de cumplimiento EUDR es del <span className="font-bold text-foreground">{eudrCompliance}%</span>.
                Todas las parcelas cuentan con geolocalización GPS y verificación de no deforestación post-2020.
                {eudrCompliance < 100 && ' Para alcanzar el 100%, complete la documentación pendiente de "Lote Norte" (permiso ambiental) y regularice la situación legal.'}
              </p>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <p className="text-sm text-foreground">
                    Documento "{docVencimiento.nombre}" vence en {docVencimiento.diasRestantes} días
                  </p>
                </div>
                <Button variant="outline" size="sm" onClick={() => toast.info('Recordatorio configurado para renovación')}>Renovar documento</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
