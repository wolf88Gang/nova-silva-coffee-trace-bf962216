import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ClipboardList, Users, AlertTriangle, Calendar, TrendingUp } from 'lucide-react';

const campanas = [
  { id: '1', nombre: 'Cosecha 2025/26', tipo: 'Café', region: 'Huehuetenango', fechaInicio: '2025-11-01', fechaFin: '2026-03-31', estado: 'activa' },
];

const bloquesTrabajo = [
  { id: '1', parcela: 'El Mirador', fechaInicio: '2026-02-17', fechaFin: '2026-02-21', prioridad: 'alta', demandaPersonas: 6, asignados: 4 },
  { id: '2', parcela: 'La Esperanza', fechaInicio: '2026-02-20', fechaFin: '2026-02-25', prioridad: 'media', demandaPersonas: 4, asignados: 4 },
  { id: '3', parcela: 'Cerro Verde', fechaInicio: '2026-02-24', fechaFin: '2026-02-28', prioridad: 'alta', demandaPersonas: 5, asignados: 0 },
];

const cuadrillas = [
  { id: '1', nombre: 'Cuadrilla A', lider: 'Manuel Cruz', miembros: 4, disponible: true },
  { id: '2', nombre: 'Cuadrilla B', lider: 'Rosa Hernández', miembros: 3, disponible: true },
  { id: '3', nombre: 'Cuadrilla C', lider: 'Jorge Paz', miembros: 5, disponible: false },
];

const alertas = [
  { tipo: 'Brecha de mano de obra', detalle: 'Bloque Cerro Verde necesita 5 personas, 0 asignadas', nivel: 'rojo' as const },
  { tipo: 'Registro pendiente', detalle: 'Cuadrilla A no ha reportado cosecha de ayer', nivel: 'ambar' as const },
];

const kpis = [
  { label: 'Bloques activos', value: bloquesTrabajo.length, icon: Calendar },
  { label: 'Cuadrillas', value: cuadrillas.length, icon: Users },
  { label: 'Brecha 14 días', value: '2 personas', icon: AlertTriangle },
  { label: 'Productividad prom.', value: '42 kg/día', icon: TrendingUp },
];

export default function JornalesDashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 stagger-children">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-4 pb-3 px-4">
              <div className="flex items-center gap-2 mb-2">
                <kpi.icon className="h-4 w-4 text-primary" />
                <span className="text-xs text-muted-foreground">{kpi.label}</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {alertas.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-accent" /> Alertas</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {alertas.map((a, i) => (
              <div key={i} className={`p-3 rounded-md border ${a.nivel === 'rojo' ? 'bg-destructive/5 border-destructive/20' : 'bg-accent/5 border-accent/20'}`}>
                <p className="text-sm font-medium text-foreground">{a.tipo}</p>
                <p className="text-xs text-muted-foreground">{a.detalle}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Bloques de Trabajo</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {bloquesTrabajo.map((b) => (
              <div key={b.id} className="p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-medium text-foreground">{b.parcela}</p>
                  <Badge variant={b.prioridad === 'alta' ? 'destructive' : 'secondary'}>{b.prioridad}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{b.fechaInicio} → {b.fechaFin}</p>
                <div className="flex justify-between text-xs mt-2">
                  <span className="text-muted-foreground">Personal: {b.asignados}/{b.demandaPersonas}</span>
                  <Progress value={(b.asignados / b.demandaPersonas) * 100} className="h-1.5 w-20" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Cuadrillas</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {cuadrillas.map((c) => (
              <div key={c.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <div>
                  <p className="text-sm font-medium text-foreground">{c.nombre}</p>
                  <p className="text-xs text-muted-foreground">Líder: {c.lider} — {c.miembros} miembros</p>
                </div>
                <Badge variant={c.disponible ? 'default' : 'secondary'}>{c.disponible ? 'Disponible' : 'Ocupada'}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
