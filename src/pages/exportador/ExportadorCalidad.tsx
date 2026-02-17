import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award } from 'lucide-react';

const muestras = [
  { id: '1', lote: 'ICO-GT-2026-001', tipo: 'Offer', puntajeSCA: 84, descriptores: 'Chocolate, cítrico, miel', defectos: 0, fecha: '2026-02-12' },
  { id: '2', lote: 'ICO-GT-2026-002', tipo: 'PSS', puntajeSCA: 81, descriptores: 'Nuez, caramelo, floral', defectos: 1, fecha: '2026-02-08' },
  { id: '3', lote: 'ICO-CR-2026-003', tipo: 'Offer', puntajeSCA: 87, descriptores: 'Frutal, vino tinto, chocolate oscuro', defectos: 0, fecha: '2026-02-05' },
];

export default function ExportadorCalidad() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Cataciones y Calidad</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {muestras.map((m) => (
            <div key={m.id} className="p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <p className="font-semibold text-foreground">{m.lote}</p>
                  <Badge variant="outline" className="mt-1">{m.tipo}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-foreground">{m.puntajeSCA}</p>
                  <p className="text-xs text-muted-foreground">SCA Score</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">Descriptores: {m.descriptores}</p>
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                <span>Defectos: {m.defectos}</span>
                <span>{m.fecha}</span>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
