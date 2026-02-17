import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Leaf, Eye } from 'lucide-react';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';

const getNivel = (p: number) => {
  if (p >= 81) return { label: 'Ejemplar', color: 'bg-green-700/10 text-green-700' };
  if (p >= 61) return { label: 'Sostenible', color: 'bg-green-500/10 text-green-600' };
  if (p >= 41) return { label: 'En desarrollo', color: 'bg-yellow-500/10 text-yellow-600' };
  return { label: 'Crítico', color: 'bg-red-500/10 text-red-600' };
};

export default function TecnicoProductores() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Productores Asignados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {DEMO_PRODUCTORES.map((p) => {
              const nivel = getNivel(p.puntajeVITAL);
              return (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-foreground">{p.nombre}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                      <span>{p.comunidad}</span>
                      <span>{p.parcelas} parcelas</span>
                      <span>{p.hectareas} ha</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="flex items-center gap-1"><Leaf className="h-3 w-3 text-primary" /><span className="text-sm font-bold text-foreground">{p.puntajeVITAL}</span></div>
                      <Badge className={nivel.color} variant="outline">{nivel.label}</Badge>
                    </div>
                    <Button variant="outline" size="sm"><Eye className="h-3 w-3 mr-1" /> Ver</Button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
