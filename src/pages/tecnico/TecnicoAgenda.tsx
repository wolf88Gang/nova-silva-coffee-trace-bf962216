import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DEMO_VISITAS } from '@/lib/demo-data';

const estadoBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    programada: { label: 'Programada', variant: 'secondary' },
    completada: { label: 'Completada', variant: 'default' },
    cancelada: { label: 'Cancelada', variant: 'destructive' },
  };
  const { label, variant } = map[estado] ?? map.programada;
  return <Badge variant={variant}>{label}</Badge>;
};

export default function TecnicoAgenda() {
  const hoy = DEMO_VISITAS.filter(v => v.fecha === '2026-02-17');
  const proximas = DEMO_VISITAS.filter(v => v.estado === 'programada' && v.fecha > '2026-02-17');
  const completadas = DEMO_VISITAS.filter(v => v.estado === 'completada');

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Calendar className="h-5 w-5 text-primary" /> Visitas de Hoy — 17 Feb 2026</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {hoy.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay visitas programadas para hoy.</p>
          ) : hoy.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-4 rounded-lg border border-primary/20 bg-primary/5">
              <div>
                <p className="font-medium text-foreground">{v.productorNombre}</p>
                <p className="text-xs text-muted-foreground">{v.tipo} — {v.comunidad}</p>
              </div>
              <Button size="sm"><CheckCircle className="h-3 w-3 mr-1" /> Completar</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {proximas.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Próximas Visitas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {proximas.map((v) => (
              <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-medium text-foreground">{v.productorNombre}</p>
                  <p className="text-xs text-muted-foreground">{v.fecha} — {v.tipo} — {v.comunidad}</p>
                </div>
                {estadoBadge(v.estado)}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Visitas Completadas</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {completadas.map((v) => (
            <div key={v.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">{v.productorNombre}</p>
                <p className="text-xs text-muted-foreground">{v.fecha} — {v.tipo} — {v.comunidad}</p>
              </div>
              {estadoBadge(v.estado)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
