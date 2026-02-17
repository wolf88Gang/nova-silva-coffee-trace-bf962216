import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ShieldCheck, Users, TrendingUp } from 'lucide-react';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';

const nivelVITAL = (p: number) => {
  if (p >= 81) return { label: 'Ejemplar', color: 'text-emerald-600', bg: 'bg-emerald-500/10' };
  if (p >= 61) return { label: 'Sostenible', color: 'text-primary', bg: 'bg-primary/10' };
  if (p >= 41) return { label: 'En desarrollo', color: 'text-yellow-600', bg: 'bg-yellow-500/10' };
  return { label: 'Crítico', color: 'text-destructive', bg: 'bg-destructive/10' };
};

export default function VitalCooperativa() {
  const promedio = Math.round(DEMO_PRODUCTORES.reduce((s, p) => s + p.puntajeVITAL, 0) / DEMO_PRODUCTORES.length);
  const distribucion = {
    critico: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL < 41).length,
    desarrollo: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 41 && p.puntajeVITAL < 61).length,
    sostenible: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 61 && p.puntajeVITAL < 81).length,
    ejemplar: DEMO_PRODUCTORES.filter(p => p.puntajeVITAL >= 81).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Protocolo VITAL</h1>

      <div className="grid md:grid-cols-3 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><Users className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Evaluados</span></div><p className="text-xl font-bold">{DEMO_PRODUCTORES.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Promedio</span></div><p className="text-xl font-bold">{promedio}/100</p><Progress value={promedio} className="h-1.5 mt-1" /></CardContent></Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <p className="text-xs text-muted-foreground mb-2">Distribución</p>
            <div className="grid grid-cols-4 gap-1 text-xs text-center">
              <div className="rounded bg-destructive/10 text-destructive p-1"><p className="font-bold">{distribucion.critico}</p><p>Crít.</p></div>
              <div className="rounded bg-yellow-500/10 text-yellow-600 p-1"><p className="font-bold">{distribucion.desarrollo}</p><p>Des.</p></div>
              <div className="rounded bg-primary/10 text-primary p-1"><p className="font-bold">{distribucion.sostenible}</p><p>Sost.</p></div>
              <div className="rounded bg-emerald-500/10 text-emerald-600 p-1"><p className="font-bold">{distribucion.ejemplar}</p><p>Ej.</p></div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Evaluaciones por productor</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b text-muted-foreground text-left">
                <th className="px-4 py-3 font-medium">Productor</th>
                <th className="px-4 py-3 font-medium">Comunidad</th>
                <th className="px-4 py-3 font-medium">Puntaje</th>
                <th className="px-4 py-3 font-medium">Nivel</th>
                <th className="px-4 py-3 font-medium">Progreso</th>
              </tr></thead>
              <tbody>
                {DEMO_PRODUCTORES.map(p => {
                  const nivel = nivelVITAL(p.puntajeVITAL);
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{p.nombre}</td>
                      <td className="px-4 py-3 text-muted-foreground">{p.comunidad}</td>
                      <td className={`px-4 py-3 font-bold ${nivel.color}`}>{p.puntajeVITAL}</td>
                      <td className="px-4 py-3"><Badge variant="outline" className={nivel.bg}>{nivel.label}</Badge></td>
                      <td className="px-4 py-3 w-32"><Progress value={p.puntajeVITAL} className="h-1.5" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
