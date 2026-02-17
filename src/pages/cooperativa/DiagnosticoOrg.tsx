import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ClipboardList } from 'lucide-react';

const dimensiones = [
  { nombre: 'Gobernanza', puntaje: 72, peso: 0.2 },
  { nombre: 'Capacidad Técnica', puntaje: 68, peso: 0.2 },
  { nombre: 'Gestión Financiera', puntaje: 55, peso: 0.2 },
  { nombre: 'Capital Social', puntaje: 80, peso: 0.2 },
  { nombre: 'Comercialización', puntaje: 62, peso: 0.2 },
];

const puntajeGlobal = Math.round(dimensiones.reduce((s, d) => s + d.puntaje * d.peso, 0));
const nivelGlobal = puntajeGlobal >= 70 ? 'verde' : puntajeGlobal >= 50 ? 'ambar' : 'rojo';

export default function DiagnosticoOrg() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Diagnóstico Organizacional</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Badge variant={nivelGlobal === 'verde' ? 'default' : nivelGlobal === 'ambar' ? 'secondary' : 'destructive'} className="text-sm px-3 py-1">
              {nivelGlobal === 'verde' ? '🟢 Saludable' : nivelGlobal === 'ambar' ? '🟡 En desarrollo' : '🔴 Crítico'}
            </Badge>
            <span className="text-3xl font-bold text-foreground">{puntajeGlobal}/100</span>
          </div>
          <Progress value={puntajeGlobal} className="h-3" />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Desglose por Dimensiones</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {dimensiones.map((d) => (
            <div key={d.nombre} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{d.nombre}</span>
                <span className="font-medium text-foreground">{d.puntaje}/100</span>
              </div>
              <Progress value={d.puntaje} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Recomendaciones</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[
            'Fortalecer la gestión financiera con capacitación en contabilidad cooperativa.',
            'Mejorar procesos de comercialización directa con compradores internacionales.',
            'Documentar procesos de gobernanza y toma de decisiones.',
          ].map((r, i) => (
            <div key={i} className="p-3 rounded-md bg-primary/5 border border-primary/20">
              <p className="text-sm text-foreground">{r}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
