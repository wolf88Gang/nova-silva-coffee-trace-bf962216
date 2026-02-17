import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Leaf } from 'lucide-react';

const puntaje = 78;
const dimensiones = [
  { nombre: 'Ambiental', valor: 82 },
  { nombre: 'Social', valor: 75 },
  { nombre: 'Económico', valor: 68 },
  { nombre: 'Gobernanza', valor: 85 },
];

const evaluaciones = [
  { id: '1', fecha: '2026-01-20', evaluador: 'Pedro Técnico', puntaje: 78, nivel: 'Sostenible' },
  { id: '2', fecha: '2025-07-15', evaluador: 'Pedro Técnico', puntaje: 72, nivel: 'Sostenible' },
  { id: '3', fecha: '2025-01-10', evaluador: 'Ana Técnico', puntaje: 65, nivel: 'Sostenible' },
];

const getNivel = (p: number) => {
  if (p >= 81) return { label: 'Ejemplar', color: 'bg-green-700/10 text-green-700' };
  if (p >= 61) return { label: 'Sostenible', color: 'bg-green-500/10 text-green-600' };
  if (p >= 41) return { label: 'En desarrollo', color: 'bg-yellow-500/10 text-yellow-600' };
  return { label: 'Crítico', color: 'bg-red-500/10 text-red-600' };
};

export default function VitalProductor() {
  const nivel = getNivel(puntaje);

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Leaf className="h-5 w-5 text-primary" /> Puntaje VITAL Actual</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge className={nivel.color}>{nivel.label}</Badge>
            <span className="text-3xl font-bold text-foreground">{puntaje}/100</span>
          </div>
          <Progress value={puntaje} className="h-3" />
          <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
            <p className="text-sm font-semibold text-primary">Su finca muestra buenas prácticas de sostenibilidad. Considere mejorar la dimensión económica para alcanzar nivel Ejemplar.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Desglose por Dimensiones</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {dimensiones.map((d) => (
            <div key={d.nombre} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{d.nombre}</span>
                <span className="font-medium text-foreground">{d.valor}/100</span>
              </div>
              <Progress value={d.valor} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Historial de Evaluaciones</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {evaluaciones.map((e) => (
              <div key={e.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{e.fecha}</p>
                  <p className="text-xs text-muted-foreground">Evaluador: {e.evaluador}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{e.puntaje}/100</p>
                  <Badge className={getNivel(e.puntaje).color} variant="outline">{e.nivel}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
