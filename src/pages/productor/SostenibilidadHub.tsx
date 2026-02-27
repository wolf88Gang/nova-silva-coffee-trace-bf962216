import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Shield, FileCheck, CheckCircle, AlertTriangle, ExternalLink, MapPin, FileText, TrendingUp, Droplets, Sun, Leaf, ChevronRight, Globe } from 'lucide-react';

// ── VITAL data ──
const vitalScore = {
  global: 75.1,
  exposicion: 72,
  sensibilidad: 68,
  adaptacion: 85,
  delta: '+16.8',
  nivel: 'Riesgo bajo',
};

const recomendaciones = [
  { area: 'Recurso Hídrico', prioridad: 'alta' as const, accion: 'Implementar sistema de cosecha de agua lluvia con tanque de almacenamiento de al menos 5,000 litros.', icon: Droplets },
  { area: 'Sombra', prioridad: 'media' as const, accion: 'Incrementar cobertura de sombra al 50% usando especies de servicio como Inga edulis.', icon: Sun },
  { area: 'Diversificación', prioridad: 'media' as const, accion: 'Establecer parcelas de cultivos alternativos para reducir la dependencia del café.', icon: Leaf },
];

const historialVital = [
  { fecha: '2026-01-20', puntaje: 75.1, nivel: 'Resiliente' },
  { fecha: '2025-07-15', puntaje: 58.3, nivel: 'En Transición' },
  { fecha: '2025-01-10', puntaje: 45.0, nivel: 'Vulnerable' },
];

// ── EUDR data ──
const eudrCompliance = 87;
const parcelas = [
  { nombre: 'Finca El Mirador', area: 3.5, gps: true, docs: true, riesgo: 'bajo' as const },
  { nombre: 'Lote Norte', area: 1.2, gps: true, docs: false, riesgo: 'bajo' as const },
];

const docVencimiento = { nombre: 'Permiso uso de suelo', diasRestantes: 45 };

const prioridadStyles: Record<string, string> = {
  alta: 'bg-accent text-accent-foreground',
  media: 'bg-primary/80 text-primary-foreground',
};

export default function SostenibilidadHub() {
  const navigate = useNavigate();

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
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" /> Protocolo VITAL
                </CardTitle>
                <Badge variant="outline" className="border-primary text-primary">{vitalScore.nivel}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">Evaluación de vulnerabilidad climática de su finca</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <Card className="border border-border">
                  <CardContent className="pt-4 pb-3 text-center">
                    <p className="text-xs text-muted-foreground mb-1">Puntaje Global</p>
                    <p className="text-4xl font-bold text-foreground">{vitalScore.global}<span className="text-lg text-muted-foreground">/100</span></p>
                    <Progress value={vitalScore.global} className="h-1.5 mt-2" />
                    <p className="text-xs text-primary mt-2 flex items-center justify-center gap-1">
                      <TrendingUp className="h-3 w-3" /> {vitalScore.delta} pts
                    </p>
                    <p className="text-[10px] text-muted-foreground">vs evaluación anterior</p>
                  </CardContent>
                </Card>

                {[
                  { label: 'Exposición', value: vitalScore.exposicion, sub: 'Impacto de eventos climáticos', icon: Sun },
                  { label: 'Sensibilidad', value: vitalScore.sensibilidad, sub: 'Vulnerabilidad del sistema', icon: Droplets },
                  { label: 'Adaptación', value: vitalScore.adaptacion, sub: 'Capacidad de respuesta', icon: Leaf },
                ].map((d) => (
                  <Card key={d.label} className="border border-border">
                    <CardContent className="pt-4 pb-3 text-center">
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <d.icon className="h-3.5 w-3.5 text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">{d.label}</p>
                      </div>
                      <p className="text-3xl font-bold text-foreground">{d.value}</p>
                      <Progress value={d.value} className="h-1.5 mt-2" />
                      <p className="text-[10px] text-muted-foreground mt-1">{d.sub}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue="recomendaciones">
            <TabsList>
              <TabsTrigger value="recomendaciones" className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5" /> Recomendaciones</TabsTrigger>
              <TabsTrigger value="historial-vital" className="flex items-center gap-1.5"><TrendingUp className="h-3.5 w-3.5" /> Historial</TabsTrigger>
            </TabsList>

            <TabsContent value="recomendaciones" className="space-y-4 mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Plan de Mejora</CardTitle>
                  <p className="text-xs text-muted-foreground">Acciones recomendadas para mejorar su puntuación VITAL</p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recomendaciones.map((r, i) => (
                    <div key={i} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-2 mb-1">
                        <r.icon className="h-4 w-4 text-accent" />
                        <span className="font-semibold text-foreground">{r.area}</span>
                        <Badge className={prioridadStyles[r.prioridad]} variant="default">{r.prioridad}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{r.accion}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historial-vital" className="space-y-4 mt-4">
              <Card>
                <CardContent className="pt-4 space-y-2">
                  {historialVital.map((h, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                      <span className="text-sm text-muted-foreground">{h.fecha}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{h.puntaje}/100</span>
                        <Badge variant="outline">{h.nivel}</Badge>
                      </div>
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
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Globe className="h-5 w-5 text-primary" /> Pasaporte EUDR
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">Estado de cumplimiento para exportación a la Unión Europea</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Última verificación: 15 Dic 2024</Badge>
                  <Badge variant="outline">Reglamento (UE) 2023/1115</Badge>
                </div>
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> Estado de Parcelas</CardTitle>
                <p className="text-xs text-muted-foreground">Haz clic en una parcela para ver detalles</p>
              </CardHeader>
              <CardContent className="space-y-3">
                {parcelas.map((p) => (
                  <div key={p.nombre} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="h-2.5 w-2.5 rounded-full bg-primary" />
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
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="py-3 px-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-accent" />
                  <p className="text-sm text-foreground">
                    Documento "{docVencimiento.nombre}" vence en {docVencimiento.diasRestantes} días
                  </p>
                </div>
                <Button variant="outline" size="sm">Renovar documento</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
