import { VitalGate } from '@/components/auth/VitalGate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Leaf, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';

const evaluaciones = [
  { id: '1', productor: 'Juan Pérez López', fecha: '2026-02-20', estado: 'pendiente' as const, puntaje: null },
  { id: '2', productor: 'Carlos Hernández', fecha: '2026-02-18', estado: 'pendiente' as const, puntaje: null },
  { id: '3', productor: 'María Santos García', fecha: '2026-02-15', estado: 'completada' as const, puntaje: 85 },
  { id: '4', productor: 'Ana López Martínez', fecha: '2026-02-14', estado: 'completada' as const, puntaje: 91 },
  { id: '5', productor: 'Pedro Ramírez Cruz', fecha: '2026-02-10', estado: 'completada' as const, puntaje: 52 },
];

const getNivel = (p: number) => {
  if (p >= 81) return { label: 'Ejemplar', color: 'bg-green-700/10 text-green-700' };
  if (p >= 61) return { label: 'Sostenible', color: 'bg-green-500/10 text-green-600' };
  if (p >= 41) return { label: 'En desarrollo', color: 'bg-yellow-500/10 text-yellow-600' };
  return { label: 'Crítico', color: 'bg-red-500/10 text-red-600' };
};

const promedio = Math.round(DEMO_PRODUCTORES.reduce((s, p) => s + p.puntajeVITAL, 0) / DEMO_PRODUCTORES.length);

export default function TecnicoVital() {
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
              <div key={e.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{e.productor}</p>
                  <p className="text-xs text-muted-foreground">{e.fecha}</p>
                </div>
                <div className="flex items-center gap-3">
                  {e.estado === 'completada' && e.puntaje !== null ? (
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">{e.puntaje}/100</p>
                      <Badge className={getNivel(e.puntaje).color} variant="outline">{getNivel(e.puntaje).label}</Badge>
                    </div>
                  ) : (
                    <Button size="sm" disabled><Play className="h-3 w-3 mr-1" /> Próximamente</Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </VitalGate>
  );
}
