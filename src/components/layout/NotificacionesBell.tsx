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
  { id: '1', titulo: 'Broca detectada en El Mirador', descripcion: 'Nivel de infestación 3.2%. Contacte a su técnico.', tipo: 'alerta', fecha: 'Hace 2h', leida: false, ruta: '/productor/sanidad' },
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
          <div className="fixed inset-0 z-[60] bg-black/40" onClick={() => setOpen(false)} />
          <div className="fixed inset-4 sm:inset-auto sm:right-4 sm:top-16 sm:w-[420px] sm:max-h-[80vh] z-[70] rounded-xl border border-border bg-popover text-popover-foreground shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground tracking-tight">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {noLeidas > 0 && (
                  <button
                    onClick={marcarTodasLeidas}
                    className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                  >
                    Marcar todas como leídas
                  </button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
                </div>
              ) : (
                notificaciones.map(n => {
                  const Icon = iconMap[n.tipo];
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40 border-b border-border/30 last:border-0 ${!n.leida ? 'bg-primary/[0.06]' : ''}`}
                    >
                      <div className={`mt-0.5 h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${
                        n.tipo === 'alerta' ? 'bg-destructive/10' :
                        n.tipo === 'recordatorio' ? 'bg-accent/10' :
                        n.tipo === 'mensaje' ? 'bg-primary/10' :
                        'bg-emerald-500/10'
                      }`}>
                        <Icon className={`h-4 w-4 ${colorMap[n.tipo]}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm leading-snug truncate ${!n.leida ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {n.titulo}
                          </p>
                          {!n.leida && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{n.descripcion}</p>
                        <p className="text-[11px] text-muted-foreground/60">{n.fecha}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-5 py-3 shrink-0">
              <button
                onClick={() => { setOpen(false); navigate('/alerts'); }}
                className="w-full text-center text-sm font-medium text-primary hover:text-primary/80 transition-colors py-1"
              >
                Ver todas las alertas
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default NotificacionesBell;
