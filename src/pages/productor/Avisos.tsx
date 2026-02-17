import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';

const avisos = [
  { id: '1', titulo: 'Inicio de temporada de cosecha 2026', tipo: 'informativo' as const, fecha: '2026-02-14', leido: false, contenido: 'Se informa a todos los productores que la temporada de cosecha 2026 inicia oficialmente el 1 de marzo.' },
  { id: '2', titulo: 'Alerta: Roya detectada en zona El Progreso', tipo: 'urgente' as const, fecha: '2026-02-13', leido: false, contenido: 'Se ha detectado presencia de roya en la zona El Progreso. Se recomienda inspeccionar sus parcelas y aplicar fungicida preventivo.' },
  { id: '3', titulo: 'Capacitación en buenas prácticas agrícolas', tipo: 'evento' as const, fecha: '2026-02-10', leido: true, contenido: 'Se invita a participar en la capacitación sobre buenas prácticas el 20 de febrero en la sede de la cooperativa.' },
  { id: '4', titulo: 'Nuevo precio de referencia para pergamino', tipo: 'informativo' as const, fecha: '2026-02-05', leido: true, contenido: 'El precio de referencia para café pergamino se ha actualizado a Q 3,200/kg.' },
  { id: '5', titulo: 'Pago de entregas de enero disponible', tipo: 'informativo' as const, fecha: '2026-02-01', leido: true, contenido: 'Los pagos correspondientes a las entregas del mes de enero ya se encuentran disponibles.' },
];

const tipoBadge = (tipo: string) => {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' }> = {
    informativo: { label: 'Informativo', variant: 'default' },
    urgente: { label: 'Urgente', variant: 'destructive' },
    evento: { label: 'Evento', variant: 'secondary' },
  };
  const { label, variant } = map[tipo] ?? map.informativo;
  return <Badge variant={variant} className="text-[10px]">{label}</Badge>;
};

export default function Avisos() {
  const noLeidos = avisos.filter(a => !a.leido).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 mb-1"><Bell className="h-4 w-4 text-primary" /><span className="text-xs text-muted-foreground">Avisos no leídos</span></div>
          <p className="text-2xl font-bold text-foreground">{noLeidos}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /> Avisos de la Cooperativa</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {avisos.map((a) => (
            <div key={a.id} className={`p-4 rounded-lg border transition-colors ${!a.leido ? 'bg-primary/5 border-primary/20' : 'border-border hover:bg-muted/50'}`}>
              <div className="flex items-start justify-between gap-2 mb-1">
                <p className={`text-sm ${!a.leido ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{a.titulo}</p>
                {tipoBadge(a.tipo)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">{a.contenido}</p>
              <p className="text-xs text-muted-foreground mt-2">{a.fecha}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
