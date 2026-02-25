import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Plus, Send, Eye } from 'lucide-react';

const avisos = [
  { id: '1', titulo: 'Inicio de temporada de cosecha 2026', tipo: 'informativo', fecha: '2026-02-15', leidos: 6, total: 8, publicado: true },
  { id: '2', titulo: 'Alerta: Roya detectada en zona El Progreso', tipo: 'urgente', fecha: '2026-02-14', leidos: 7, total: 8, publicado: true },
  { id: '3', titulo: 'Capacitación en buenas prácticas agrícolas', tipo: 'evento', fecha: '2026-02-20', leidos: 3, total: 8, publicado: true },
  { id: '4', titulo: 'Nuevo programa de créditos para insumos', tipo: 'informativo', fecha: '2026-02-10', leidos: 5, total: 8, publicado: true },
  { id: '5', titulo: 'Recordatorio: cierre de recepción de café', tipo: 'informativo', fecha: '2026-02-25', leidos: 0, total: 8, publicado: false },
];

const tipoBadge = (tipo: string) => {
  if (tipo === 'urgente') return <Badge variant="destructive">Urgente</Badge>;
  if (tipo === 'evento') return <Badge variant="secondary">Evento</Badge>;
  return <Badge variant="default">Info</Badge>;
};

export default function AvisosCooperativa() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Avisos a productores</h1>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo aviso</Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Total avisos</p><p className="text-xl font-bold">{avisos.length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Publicados</p><p className="text-xl font-bold">{avisos.filter(a => a.publicado).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Borradores</p><p className="text-xl font-bold">{avisos.filter(a => !a.publicado).length}</p></CardContent></Card>
        <Card><CardContent className="pt-4 pb-3"><p className="text-xs text-muted-foreground">Urgentes</p><p className="text-xl font-bold text-destructive">{avisos.filter(a => a.tipo === 'urgente').length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          {avisos.map(a => (
            <div key={a.id} className="flex items-center gap-4 px-4 py-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{a.titulo}</p>
                <p className="text-xs text-muted-foreground">{a.fecha}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Eye className="h-3 w-3" /> {a.leidos}/{a.total}</span>
                {tipoBadge(a.tipo)}
                <Badge variant={a.publicado ? 'default' : 'outline'}>{a.publicado ? 'Publicado' : 'Borrador'}</Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
