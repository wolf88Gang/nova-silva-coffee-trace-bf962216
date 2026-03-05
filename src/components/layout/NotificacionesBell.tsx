import { useState } from 'react';
import { Bell, AlertTriangle, Calendar, MessageSquare, Shield, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useNotifications, useMarkNotificationRead, useMarkAllNotificationsRead, Notification } from '@/hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const iconMap: Record<string, typeof AlertTriangle> = {
  alerta: AlertTriangle,
  recordatorio: Calendar,
  mensaje: MessageSquare,
  vital: Shield,
};

const colorMap: Record<string, string> = {
  alerta: 'text-destructive',
  recordatorio: 'text-accent',
  mensaje: 'text-primary',
  vital: 'text-emerald-600',
};

const bgMap: Record<string, string> = {
  alerta: 'bg-destructive/10',
  recordatorio: 'bg-accent/10',
  mensaje: 'bg-primary/10',
  vital: 'bg-emerald-500/10',
};

export function NotificacionesBell() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const { data: notificaciones = [], isLoading } = useNotifications(20);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const noLeidas = notificaciones.filter(n => !n.read_at).length;

  const handleClick = (n: Notification) => {
    if (!n.read_at) markRead.mutate(n.id);
    setOpen(false);
    if (n.link_url) navigate(n.link_url);
  };

  const marcarTodasLeidas = () => {
    markAllRead.mutate(undefined, {
      onSuccess: () => toast.success('Todas las notificaciones marcadas como leídas'),
    });
  };

  const formatFecha = (iso: string) => {
    try {
      return formatDistanceToNow(new Date(iso), { addSuffix: true, locale: es });
    } catch {
      return iso;
    }
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
          <div className="fixed right-4 top-14 w-[min(400px,calc(100vw-2rem))] z-[60] rounded-xl border border-border/60 bg-popover shadow-2xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
              <h3 className="text-base font-semibold text-foreground tracking-tight">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {noLeidas > 0 && (
                  <button onClick={marcarTodasLeidas} className="text-xs font-medium text-primary hover:text-primary/80 transition-colors">
                    Marcar todas como leídas
                  </button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full" onClick={() => setOpen(false)}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Notification list */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notificaciones.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 px-6">
                  <Bell className="h-8 w-8 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground">No tienes notificaciones</p>
                </div>
              ) : (
                notificaciones.map(n => {
                  const tipo = n.tipo || 'mensaje';
                  const Icon = iconMap[tipo] || MessageSquare;
                  const isUnread = !n.read_at;
                  return (
                    <button
                      key={n.id}
                      onClick={() => handleClick(n)}
                      className={`w-full text-left flex items-start gap-4 px-5 py-4 transition-colors hover:bg-muted/40 ${isUnread ? 'bg-primary/[0.04]' : ''}`}
                    >
                      <div className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${bgMap[tipo] || 'bg-primary/10'}`}>
                        <Icon className={`h-4 w-4 ${colorMap[tipo] || 'text-primary'}`} />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>
                            {n.titulo}
                          </p>
                          {isUnread && <div className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{n.cuerpo}</p>
                        <p className="text-[11px] text-muted-foreground/60 pt-0.5">{formatFecha(n.created_at)}</p>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-border/40 px-5 py-3">
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
