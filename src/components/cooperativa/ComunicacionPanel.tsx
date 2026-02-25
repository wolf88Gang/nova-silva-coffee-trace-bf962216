import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MessageSquare, Plus } from 'lucide-react';

const avisos = [
  {
    id: 1, titulo: 'Inicio de temporada de cosecha 2026', fecha: '2026-02-20',
    destinatarios: 'Todos los productores', preview: 'Estimados productores, les informamos que la temporada de cosecha 2026 inicia oficialmente el 1 de marzo. Recuerden preparar sus beneficiaderos y coordinar con su cuadrilla asignada.',
    estado: 'Enviado', leidos: 58, total: 67,
  },
  {
    id: 2, titulo: 'Alerta fitosanitaria: Broca en Zona Norte', fecha: '2026-02-18',
    destinatarios: 'Zona Norte', preview: 'Se ha detectado un incremento significativo en la incidencia de broca del café (Hypothenemus hampei) en las veredas El Progreso y La Unión. Se recomienda revisión inmediata de trampas.',
    estado: 'Enviado', leidos: 23, total: 24,
  },
  {
    id: 3, titulo: 'Convocatoria: Taller de catación básica', fecha: '2026-02-15',
    destinatarios: 'Todos los productores', preview: 'Los invitamos al taller de catación básica SCA que se realizará el próximo sábado 22 de febrero en las instalaciones de la cooperativa. Cupos limitados a 20 participantes.',
    estado: 'Enviado', leidos: 45, total: 67,
  },
  {
    id: 4, titulo: 'Recordatorio: Entrega documentos Protocolo VITAL', fecha: '2026-02-12',
    destinatarios: 'Productores certificados', preview: 'Recordamos a los productores que participan en el Protocolo VITAL que deben entregar la documentación de sus registros de finca antes del 28 de febrero.',
    estado: 'Enviado', leidos: 30, total: 42,
  },
  {
    id: 5, titulo: 'Borrador: Nuevo programa de incentivos', fecha: '2026-02-25',
    destinatarios: 'Junta directiva', preview: 'Propuesta para implementar un programa de incentivos económicos vinculado al puntaje del Protocolo VITAL. Productores con puntaje >80 recibirán un bono por quintal.',
    estado: 'Borrador', leidos: 0, total: 5,
  },
];

export default function ComunicacionPanel() {
  const sinLeer = avisos.filter(a => a.estado === 'Enviado' && a.leidos < a.total).length;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-foreground">Centro de Comunicación</h1>
          <Badge variant="secondary">{sinLeer} pendientes</Badge>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" /> Nuevo Aviso</Button>
      </div>

      <div className="space-y-4">
        {avisos.map((a) => (
          <Card key={a.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="pt-4 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="h-4 w-4 text-primary shrink-0" />
                    <p className="font-semibold text-foreground truncate">{a.titulo}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground mb-2">
                    <span>{a.fecha}</span>
                    <span>·</span>
                    <span>{a.destinatarios}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{a.preview}</p>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={a.estado === 'Enviado' ? 'bg-emerald-500 text-white border-0' : 'bg-muted text-muted-foreground border-0'}>
                    {a.estado}
                  </Badge>
                  {a.estado === 'Enviado' && (
                    <span className="text-xs text-muted-foreground">Leído por {a.leidos}/{a.total}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
