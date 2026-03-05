import { useState } from 'react';
import { Bell, CheckCircle, AlertTriangle, Calendar, MessageSquare, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

interface Notificacion {
  id: string;
  titulo: string;
  descripcion: string;
  tipo: 'alerta' | 'recordatorio' | 'mensaje' | 'vital';
  fecha: string;
  leida: boolean;
  ruta?: string;
}

const notificacionesDemo: Notificacion[] = [
  { id: '1', titulo: 'Broca detectada en El Mirador', descripcion: 'Nivel de infestación 3.2%. Acción requerida.', tipo: 'alerta', fecha: 'Hace 2h', leida: false, ruta: '/productor/sanidad' },
  { id: '2', titulo: 'Evaluación VITAL próxima', descripcion: 'Su evaluación bianual vence en 30 días.', tipo: 'recordatorio', fecha: 'Hace 5h', leida: false, ruta: '/productor/sostenibilidad' },
  { id: '3', titulo: 'Mensaje de Ing. Castañeda', descripcion: 'Confirmo visita técnica para el jueves.', tipo: 'mensaje', fecha: 'Ayer', leida: false, ruta: '/productor/avisos' },
  { id: '4', titulo: 'Pago de entregas disponible', descripcion: 'Pagos de enero listos para retiro.', tipo: 'recordatorio', fecha: 'Hace 2d', leida: true, ruta: '/productor/finanzas' },
  { id: '5', titulo: 'Score VITAL actualizado', descripcion: 'Su puntaje subió a 75.1/100.', tipo: 'vital', fecha: 'Hace 3d', leida: true, ruta: '/productor/sostenibilidad' },
];

const iconMap = {
  alerta: AlertTriangle,
  recordatorio: Calendar,
  mensaje: MessageSquare,
  vital: Shield,
};

const colorMap = {
  alerta: 'text-destructive',
  recordatorio: 'text-accent',
  mensaje: 'text-primary',
  vital: 'text-emerald-600',
};

export function NotificacionesBell() {
  const [open, setOpen] = useState(false);
  const [notificaciones, setNotificaciones] = useState(notificacionesDemo);
  const navigate = useNavigate();

  const noLeidas = notificaciones.filter(n => !n.leida).length;

  const marcarLeida = (id: string) => {
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const marcarTodasLeidas = () => {
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    toast.success('Todas las notificaciones marcadas como leídas');
  };

  const handleClick = (n: Notificacion) => {
    marcarLeida(n.id);
    setOpen(false);
    if (n.ruta) navigate(n.ruta);
  };

  return (
    <div className="relative">
      <Button variant="ghost" size="icon" className="relative" onClick={() => setOpen(!open)}>
        <Bell className="h-4 w-4" />
        {noLeidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center">
            {noLeidas}
          </span>
        )}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 z-50 rounded-lg border border-border bg-popover shadow-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <p className="text-sm font-semibold text-foreground">Notificaciones</p>
              <div className="flex items-center gap-1">
                {noLeidas > 0 && (
                  <Button variant="ghost" size="sm" className="text-xs h-7" onClick={marcarTodasLeidas}>
                    <CheckCircle className="h-3 w-3 mr-1" /> Leer todas
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto">
              {notificaciones.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">Sin notificaciones</p>
              ) : (
                notificaciones.map(n => {
                  const Icon = iconMap[n.tipo];
                  return (
                    <button key={n.id} onClick={() => handleClick(n)}
                      className={`w-full text-left flex items-start gap-3 px-4 py-3 border-b border-border/50 last:border-0 transition-colors hover:bg-muted/50 ${!n.leida ? 'bg-primary/5' : ''}`}>
                      <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${colorMap[n.tipo]}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm truncate ${!n.leida ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{n.titulo}</p>
                          {!n.leida && <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{n.descripcion}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{n.fecha}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            <div className="border-t border-border px-4 py-2">
              <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => { setOpen(false); navigate('/alerts'); }}>
                Ver todas las alertas
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificacionesBell;
