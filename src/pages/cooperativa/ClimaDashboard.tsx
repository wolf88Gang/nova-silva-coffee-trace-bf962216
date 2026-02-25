import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Stethoscope, AlertTriangle, Users } from 'lucide-react';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';

const riesgoData = [
  { nivel: 'Bajo', count: 3, color: 'bg-green-500' },
  { nivel: 'Medio', count: 3, color: 'bg-yellow-500' },
  { nivel: 'Alto', count: 2, color: 'bg-red-500' },
];

export default function ClimaDashboard() {
  const cobertura = 75;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Stethoscope className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Cobertura VITAL</span></div>
          <p className="text-2xl font-bold text-foreground">{cobertura}%</p>
          <Progress value={cobertura} className="h-2 mt-2" />
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Evaluados</span></div>
          <p className="text-2xl font-bold text-foreground">6 / {DEMO_PRODUCTORES.length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><AlertTriangle className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Alto riesgo</span></div>
          <p className="text-2xl font-bold text-foreground">2</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-primary" /> Distribución de Riesgo VITAL</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {riesgoData.map((r) => (
              <div key={r.nivel} className="flex items-center gap-3">
                <div className={`h-3 w-3 rounded-full ${r.color}`} />
                <span className="text-sm text-foreground w-16">{r.nivel}</span>
                <Progress value={(r.count / DEMO_PRODUCTORES.length) * 100} className="h-2 flex-1" />
                <span className="text-sm font-medium text-foreground">{r.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Productores por Nivel de Riesgo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {DEMO_PRODUCTORES.map((p) => {
            const riesgo = p.puntajeVITAL >= 70 ? 'Bajo' : p.puntajeVITAL >= 50 ? 'Medio' : 'Alto';
            const variant = riesgo === 'Bajo' ? 'default' : riesgo === 'Medio' ? 'secondary' : 'destructive';
            return (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.comunidad} — {p.hectareas} ha</p>
                </div>
                <Badge variant={variant}>{riesgo}</Badge>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
