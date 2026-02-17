import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus, Bell, Calendar } from 'lucide-react';

const avisos = [
  { id: '1', titulo: 'Inicio de temporada de cosecha 2026', tipo: 'informativo', fecha: '2026-02-15', leido: true },
  { id: '2', titulo: 'Alerta: Roya detectada en zona El Progreso', tipo: 'urgente', fecha: '2026-02-14', leido: false },
  { id: '3', titulo: 'Capacitación en buenas prácticas agrícolas', tipo: 'evento', fecha: '2026-02-20', leido: false },
  { id: '4', titulo: 'Nuevo programa de créditos para insumos', tipo: 'informativo', fecha: '2026-02-10', leido: true },
  { id: '5', titulo: 'Mantenimiento programado del sistema', tipo: 'informativo', fecha: '2026-02-08', leido: true },
];

const tipoBadge = (tipo: string) => {
  if (tipo === 'urgente') return <Badge variant="destructive">Urgente</Badge>;
  if (tipo === 'evento') return <Badge variant="secondary">Evento</Badge>;
  return <Badge variant="default">Info</Badge>;
};

export default function ComunicacionHub() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Comunicación</h1>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo aviso</Button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total avisos</p><p className="text-xl font-bold">{avisos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">No leídos</p><p className="text-xl font-bold text-accent">{avisos.filter(a => !a.leido).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Urgentes</p><p className="text-xl font-bold text-destructive">{avisos.filter(a => a.tipo === 'urgente').length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {avisos.map(a => (
            <div key={a.id} className={`flex items-center gap-4 px-4 py-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors ${!a.leido ? 'bg-primary/5' : ''}`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${!a.leido ? 'bg-accent' : 'bg-transparent'}`} />
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${!a.leido ? 'font-semibold text-foreground' : 'text-foreground'}`}>{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.fecha}</p>
              </div>
              {tipoBadge(a.tipo)}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
