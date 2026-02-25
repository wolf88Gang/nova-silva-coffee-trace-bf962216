import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FlaskConical, Award, TrendingUp } from 'lucide-react';

const cataciones = [
  { id: '1', lote: 'LOT-2026-001', fecha: '2026-02-15', puntaje: 84.5, perfil: 'Chocolate, cítricos, cuerpo medio', catador: 'Ana Morales' },
  { id: '2', lote: 'LOT-2026-003', fecha: '2026-01-30', puntaje: 87.2, perfil: 'Frutas rojas, floral, acidez brillante', catador: 'Ana Morales' },
  { id: '3', lote: 'LOT-2026-002', fecha: '2026-02-10', puntaje: 81.0, perfil: 'Nueces, caramelo, cuerpo completo', catador: 'Carlos Vega' },
];

export default function CalidadHub() {
  const promedio = Math.round((cataciones.reduce((s, c) => s + c.puntaje, 0) / cataciones.length) * 10) / 10;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Nova Cup</h1>
      <p className="text-sm text-muted-foreground">Evaluación de calidad y perfiles de taza</p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><FlaskConical className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Cataciones realizadas</span></div>
            <p className="text-2xl font-bold text-foreground">{cataciones.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><TrendingUp className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Puntaje promedio SCA</span></div>
            <p className="text-2xl font-bold text-foreground">{promedio}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><Award className="h-4 w-4 text-accent" /><span className="text-xs text-muted-foreground">Lotes specialty (+84)</span></div>
            <p className="text-2xl font-bold text-foreground">{cataciones.filter(c => c.puntaje >= 84).length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><FlaskConical className="h-4 w-4 text-primary" /> Cataciones recientes</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {cataciones.map(c => (
            <div key={c.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">{c.lote}</p>
                <p className="text-xs text-muted-foreground">{c.fecha} · Catador: {c.catador}</p>
                <p className="text-sm text-muted-foreground mt-1">{c.perfil}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-foreground">{c.puntaje}</p>
                <Badge variant={c.puntaje >= 84 ? 'default' : 'secondary'}>
                  {c.puntaje >= 84 ? 'Specialty' : 'Commercial'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
