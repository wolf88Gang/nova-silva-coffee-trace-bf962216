import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Calendar } from 'lucide-react';

const auditorias = [
  { id: '1', organizacion: 'Cooperativa Café de la Selva', tipo: 'Rainforest Alliance', fechaProgramada: '2026-03-10', auditor: 'Dr. Carlos Ruiz', estado: 'programada' },
  { id: '2', organizacion: 'Cooperativa Los Altos', tipo: 'Fairtrade', fechaProgramada: '2026-02-25', auditor: 'Ing. María Pérez', estado: 'en_proceso' },
  { id: '3', organizacion: 'Exportadora Sol de América', tipo: 'EUDR Compliance', fechaProgramada: '2026-02-15', auditor: 'Dr. Carlos Ruiz', estado: 'completada' },
  { id: '4', organizacion: 'Cooperativa Montaña Verde', tipo: 'Rainforest Alliance', fechaProgramada: '2026-01-20', auditor: 'Ing. María Pérez', estado: 'completada' },
];

const estadoBadge = (estado: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    programada: { label: 'Programada', variant: 'secondary' },
    en_proceso: { label: 'En proceso', variant: 'outline' },
    completada: { label: 'Completada', variant: 'default' },
  };
  const { label, variant } = map[estado] ?? map.programada;
  return <Badge variant={variant}>{label}</Badge>;
};

export default function CertificadoraAuditorias() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 stagger-children">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <span className="text-xs text-muted-foreground">Programadas</span>
          <p className="text-2xl font-bold text-foreground">{auditorias.filter(a => a.estado === 'programada').length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <span className="text-xs text-muted-foreground">En proceso</span>
          <p className="text-2xl font-bold text-foreground">{auditorias.filter(a => a.estado === 'en_proceso').length}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <span className="text-xs text-muted-foreground">Completadas</span>
          <p className="text-2xl font-bold text-foreground">{auditorias.filter(a => a.estado === 'completada').length}</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /> Auditorías</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {auditorias.map((a) => (
            <div key={a.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors">
              <div>
                <p className="font-medium text-foreground">{a.organizacion}</p>
                <p className="text-sm text-muted-foreground">{a.tipo}</p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1"><Calendar className="h-3 w-3" />{a.fechaProgramada} — {a.auditor}</div>
              </div>
              {estadoBadge(a.estado)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
