import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Award, TrendingUp, Star } from 'lucide-react';

const kpis = [
  { label: 'Promedio SCA', value: '83.5', badge: 'Premium', icon: FlaskConical },
  { label: 'Total Cataciones', value: '34 este periodo', badge: '', icon: TrendingUp },
  { label: 'Mejor Lote', value: 'Lote 023 — 87.2 pts', badge: '', icon: Award },
  { label: 'Specialty (>84)', value: '12 muestras (35%)', badge: '', icon: Star },
];

const cataciones = [
  { fecha: '2026-02-23', lote: 'LOT-2026-023', productor: 'Carlos A. Muñoz', protocolo: 'SCA v3', puntaje: 87.2, cat: 'Specialty' },
  { fecha: '2026-02-22', lote: 'LOT-2026-045', productor: 'María del C. Ortiz', protocolo: 'SCA v3', puntaje: 85.1, cat: 'Specialty' },
  { fecha: '2026-02-20', lote: 'LOT-2026-018', productor: 'Ana L. Betancourt', protocolo: 'SCA v3', puntaje: 84.5, cat: 'Specialty' },
  { fecha: '2026-02-18', lote: 'LOT-2026-032', productor: 'José Hernández', protocolo: 'SCA v3', puntaje: 82.3, cat: 'Premium' },
  { fecha: '2026-02-15', lote: 'LOT-2026-011', productor: 'Rosa E. Castillo', protocolo: 'SCA v3', puntaje: 81.0, cat: 'Premium' },
  { fecha: '2026-02-12', lote: 'LOT-2026-007', productor: 'Fernando Ruiz', protocolo: 'SCA v3', puntaje: 78.5, cat: 'Comercial' },
];

const catBadge = (cat: string) => {
  if (cat === 'Specialty') return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-0">Specialty</Badge>;
  if (cat === 'Premium') return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">Premium</Badge>;
  return <Badge variant="secondary">Comercial</Badge>;
};

export default function NovaCupDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Nova Cup</h1>
      <p className="text-sm text-muted-foreground">Evaluación de calidad y perfiles de taza</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-2 mb-1">
                <k.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{k.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-xl font-bold text-foreground">{k.value}</p>
                {k.badge && <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-0">{k.badge}</Badge>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <FlaskConical className="h-4 w-4 text-primary" />
            Cataciones Recientes
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-left">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Lote</th>
                  <th className="px-4 py-3 font-medium">Productor</th>
                  <th className="px-4 py-3 font-medium">Protocolo</th>
                  <th className="px-4 py-3 font-medium">Puntaje</th>
                  <th className="px-4 py-3 font-medium">Categoría</th>
                </tr>
              </thead>
              <tbody>
                {cataciones.map((c, i) => (
                  <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3 text-muted-foreground">{c.fecha}</td>
                    <td className="px-4 py-3 font-medium text-foreground">{c.lote}</td>
                    <td className="px-4 py-3">{c.productor}</td>
                    <td className="px-4 py-3 text-muted-foreground">{c.protocolo}</td>
                    <td className="px-4 py-3 font-bold">{c.puntaje}</td>
                    <td className="px-4 py-3">{catBadge(c.cat)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 pb-6">
          <div className="flex flex-col items-center justify-center gap-3 text-center">
            <Award className="h-16 w-16 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">Perfil sensorial promedio — Próximamente</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
