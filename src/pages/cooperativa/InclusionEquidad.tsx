import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { HeartHandshake, Users, TrendingUp } from 'lucide-react';

const indicadores = [
  { label: 'Participación femenina', valor: 38, meta: 50, unidad: '%' },
  { label: 'Jóvenes productores (<30)', valor: 12, meta: 20, unidad: '%' },
  { label: 'Productores con discapacidad', valor: 2, meta: null, unidad: 'personas' },
  { label: 'Comunidades indígenas', valor: 1, meta: null, unidad: 'comunidad' },
];

const acciones = [
  { id: '1', titulo: 'Taller de liderazgo para mujeres productoras', fecha: '2026-03-05', estado: 'programada' },
  { id: '2', titulo: 'Programa de mentoría para jóvenes caficultores', fecha: '2026-02-20', estado: 'en_curso' },
  { id: '3', titulo: 'Capacitación en derechos laborales', fecha: '2026-01-15', estado: 'completada' },
];

export default function InclusionEquidad() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground">Inclusión y Equidad</h1>
      <p className="text-sm text-muted-foreground">Indicadores y acciones de inclusión social en la cooperativa</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {indicadores.map((ind) => (
          <Card key={ind.label}>
            <CardContent className="pt-4 pb-3">
              <p className="text-xs text-muted-foreground mb-1">{ind.label}</p>
              <p className="text-2xl font-bold text-foreground">{ind.valor}{ind.unidad === '%' ? '%' : ''} <span className="text-sm font-normal text-muted-foreground">{ind.unidad !== '%' ? ind.unidad : ''}</span></p>
              {ind.meta && (
                <div className="mt-2">
                  <Progress value={(ind.valor / ind.meta) * 100} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">Meta: {ind.meta}{ind.unidad === '%' ? '%' : ''}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-primary" /> Acciones de inclusión</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {acciones.map(a => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.fecha}</p>
              </div>
              <Badge variant={a.estado === 'completada' ? 'default' : a.estado === 'en_curso' ? 'secondary' : 'outline'}>
                {a.estado === 'completada' ? 'Completada' : a.estado === 'en_curso' ? 'En curso' : 'Programada'}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
