import { useState } from 'react';
import { VitalGate } from '@/components/auth/VitalGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Play, Eye, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';
import ClimaFichaResumen from '@/components/clima/ClimaFichaResumen';
import { type ResultadoFicha, type AlertaFicha } from '@/lib/climaFichaScoring';

const evaluaciones = [
  { id: '1', productor: 'Juan Pérez López', fecha: '2026-02-20', estado: 'pendiente' as const, puntaje: null },
  { id: '2', productor: 'Carlos Hernández', fecha: '2026-02-18', estado: 'pendiente' as const, puntaje: null },
  { id: '3', productor: 'María Santos García', fecha: '2026-02-15', estado: 'completada' as const, puntaje: 85 },
  { id: '4', productor: 'Ana López Martínez', fecha: '2026-02-14', estado: 'completada' as const, puntaje: 91 },
  { id: '5', productor: 'Pedro Ramírez Cruz', fecha: '2026-02-10', estado: 'completada' as const, puntaje: 52 },
];

const MOCK_FICHAS: Record<string, { resultado: ResultadoFicha; alertas: AlertaFicha[]; tecnico: string }> = {
  '3': {
    resultado: {
      indice_global: 0.82, nivel_riesgo_global: 'bajo',
      riesgo_produccion: 0.6, riesgo_clima_agua: 0.9, riesgo_suelo_manejo: 0.7,
      riesgo_plagas: 1.0, riesgo_diversificacion: 0.8, riesgo_capacidades: 0.9,
      exposicion_score: 0.7, sensibilidad_score: 0.8, capacidad_adaptativa_score: 0.9,
    },
    alertas: [],
    tecnico: 'Ing. Roberto Morales',
  },
  '4': {
    resultado: {
      indice_global: 0.65, nivel_riesgo_global: 'bajo',
      riesgo_produccion: 0.5, riesgo_clima_agua: 0.7, riesgo_suelo_manejo: 0.6,
      riesgo_plagas: 0.7, riesgo_diversificacion: 0.6, riesgo_capacidades: 0.8,
      exposicion_score: 0.6, sensibilidad_score: 0.7, capacidad_adaptativa_score: 0.7,
    },
    alertas: [],
    tecnico: 'Ing. Roberto Morales',
  },
  '5': {
    resultado: {
      indice_global: 1.85, nivel_riesgo_global: 'alto',
      riesgo_produccion: 2.1, riesgo_clima_agua: 1.9, riesgo_suelo_manejo: 2.3,
      riesgo_plagas: 1.5, riesgo_diversificacion: 1.8, riesgo_capacidades: 1.5,
      exposicion_score: 2.0, sensibilidad_score: 1.8, capacidad_adaptativa_score: 1.7,
    },
    alertas: [
      { bloque: 'suelo_manejo', label: 'Suelo y Manejo — erosión activa sin control', valor: 2.3, nivel: 'alto' },
      { bloque: 'produccion', label: 'Producción — rendimiento en declive 3 años', valor: 2.1, nivel: 'alto' },
    ],
    tecnico: 'Ing. Roberto Morales',
  },
};

import { getVitalLevel } from '@/lib/vitalLevels';

const getNivel = (p: number) => {
  const l = getVitalLevel(p);
  return { label: l.label, color: l.badgeColor };
};

const promedio = Math.round(DEMO_PRODUCTORES.reduce((s, p) => s + p.puntajeVITAL, 0) / DEMO_PRODUCTORES.length);

export default function TecnicoVital() {
  const [fichaAbierta, setFichaAbierta] = useState<string | null>(null);

  return (
    <VitalGate mode="banner">
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
          <Card><CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2 mb-1"><Leaf className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Promedio VITAL</span></div>
            <p className="text-2xl font-bold text-foreground">{promedio}/100</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4">
            <span className="text-xs text-muted-foreground">Pendientes</span>
            <p className="text-2xl font-bold text-foreground">{evaluaciones.filter(e => e.estado === 'pendiente').length}</p>
          </CardContent></Card>
          <Card><CardContent className="pt-4 pb-3 px-4">
            <span className="text-xs text-muted-foreground">Completadas</span>
            <p className="text-2xl font-bold text-foreground">{evaluaciones.filter(e => e.estado === 'completada').length}</p>
          </CardContent></Card>
        </div>

        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-primary" /> Evaluaciones</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {evaluaciones.map((e) => (
              <div key={e.id}>
                <div className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div>
                    <p className="font-medium text-foreground">{e.productor}</p>
                    <p className="text-xs text-muted-foreground">{e.fecha}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {e.estado === 'completada' && e.puntaje !== null ? (
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-lg font-bold text-foreground">{e.puntaje}/100</p>
                          <Badge className={getNivel(e.puntaje).color} variant="outline">{getNivel(e.puntaje).label}</Badge>
                        </div>
                        {MOCK_FICHAS[e.id] && (
                          <Button
                            size="sm"
                            variant={fichaAbierta === e.id ? 'default' : 'outline'}
                            onClick={() => setFichaAbierta(fichaAbierta === e.id ? null : e.id)}
                            title="Ver Ficha de Campo"
                          >
                            {fichaAbierta === e.id ? <X className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                      </div>
                    ) : (
                      <Button size="sm" disabled><Play className="h-3 w-3 mr-1" /> Próximamente</Button>
                    )}
                  </div>
                </div>
                {fichaAbierta === e.id && MOCK_FICHAS[e.id] && (
                  <div className="mt-2 mb-4 ml-4 mr-2 animate-fade-in">
                    <ClimaFichaResumen
                      resultado={MOCK_FICHAS[e.id].resultado}
                      alertas={MOCK_FICHAS[e.id].alertas}
                      tecnicoNombre={MOCK_FICHAS[e.id].tecnico}
                      fecha={e.fecha}
                    />
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </VitalGate>
  );
}
