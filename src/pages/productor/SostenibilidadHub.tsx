import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';
import { Leaf, Shield, FileCheck, CheckCircle, AlertTriangle, ExternalLink } from 'lucide-react';
import VitalResultadoCard from '@/components/clima/VitalResultadoCard';
import type { ResultadoClimaProductor } from '@/lib/climaScoring';

// Mock del último resultado VITAL
const mockResultado: ResultadoClimaProductor = {
  indiceGlobal: 72,
  nivel: 'Resiliente',
  nivelColor: 'text-emerald-600',
  exposicion: 0.35,
  sensibilidad: 0.30,
  capacidadAdaptativa: 0.65,
  bloques: [
    { bloque: 'produccion', puntaje: 75, exposicion: 0.30, sensibilidad: 0.25, capacidad_adaptativa: 0.70 },
    { bloque: 'agua', puntaje: 68, exposicion: 0.40, sensibilidad: 0.35, capacidad_adaptativa: 0.60 },
    { bloque: 'suelo', puntaje: 80, exposicion: 0.25, sensibilidad: 0.20, capacidad_adaptativa: 0.75 },
    { bloque: 'plagas', puntaje: 65, exposicion: 0.45, sensibilidad: 0.30, capacidad_adaptativa: 0.55 },
    { bloque: 'diversificacion', puntaje: 70, exposicion: 0.35, sensibilidad: 0.30, capacidad_adaptativa: 0.60 },
    { bloque: 'capacitacion', puntaje: 74, exposicion: 0.30, sensibilidad: 0.28, capacidad_adaptativa: 0.68 },
  ],
  factoresRiesgo: [
    { codigo: 'PL02', texto: 'Nivel de infestación de broca alto', bloque: 'plagas', impacto: 3 },
    { codigo: 'A01', texto: 'Escasez de agua recurrente', bloque: 'agua', impacto: 2 },
  ],
  falsaResiliencia: false,
};

const eudrChecklist = [
  { item: 'Parcelas georreferenciadas con polígonos', completo: true },
  { item: 'Declaración de no deforestación post-2020', completo: true },
  { item: 'Trazabilidad de lotes documentada', completo: true },
  { item: 'Due diligence statement enviado', completo: false },
  { item: 'Verificación satelital completada', completo: false },
];

export default function SostenibilidadHub() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <Tabs defaultValue="vital">
        <TabsList>
          <TabsTrigger value="vital">Protocolo VITAL</TabsTrigger>
          <TabsTrigger value="eudr">EUDR</TabsTrigger>
        </TabsList>

        <TabsContent value="vital" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Última Evaluación</h3>
              <p className="text-sm text-muted-foreground">Realizada el 20 de enero, 2026</p>
            </div>
            <Button onClick={() => navigate('/productor/vital')}>
              <Leaf className="h-4 w-4 mr-1" /> Nueva Evaluación
            </Button>
          </div>
          <VitalResultadoCard resultado={mockResultado} />

          <Card>
            <CardHeader><CardTitle className="text-base">Historial de Evaluaciones</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { fecha: '2026-01-20', puntaje: 72, nivel: 'Resiliente' },
                { fecha: '2025-07-15', puntaje: 65, nivel: 'Resiliente' },
                { fecha: '2025-01-10', puntaje: 58, nivel: 'En Transición' },
              ].map((e, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border">
                  <span className="text-sm text-muted-foreground">{e.fecha}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{e.puntaje}/100</span>
                    <Badge variant="outline">{e.nivel}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eudr" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileCheck className="h-5 w-5 text-primary" /> Estado de Cumplimiento EUDR
                </CardTitle>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">En progreso</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Progreso general</span>
                <span className="font-medium text-foreground">3/5 completados</span>
              </div>
              <Progress value={60} className="h-2" />

              <div className="space-y-2">
                {eudrChecklist.map((c, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-md">
                    {c.completo
                      ? <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                      : <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                    }
                    <span className={`text-sm ${c.completo ? 'text-muted-foreground line-through' : 'text-foreground'}`}>{c.item}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Documentos EUDR</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {['Mapa de polígonos - Parcela El Mirador', 'Mapa de polígonos - Parcela La Esperanza', 'Declaración de uso de suelo'].map((doc, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded-md border border-border">
                  <span className="text-sm text-foreground">{doc}</span>
                  <Button variant="ghost" size="sm"><ExternalLink className="h-3 w-3" /></Button>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
