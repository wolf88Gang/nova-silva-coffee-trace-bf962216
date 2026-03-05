import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Phone, Mail, MessageSquare, UserCheck, Send, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

export interface TecnicoInfo {
  nombre: string;
  rol: string;
  telefono: string;
  email: string;
  disponible: boolean;
}

// Default técnico asignado — in production this comes from DB
const DEFAULT_TECNICO: TecnicoInfo = {
  nombre: 'Ing. Roberto Castañeda',
  rol: 'Técnico Asignado',
  telefono: '+502 5555-1234',
  email: 'r.castaneda@cooperativa.org',
  disponible: true,
};

/**
 * Inline clickable link that opens a contact dialog for the técnico.
 * Use this anywhere text mentions "técnico asignado" or "contacte a su técnico".
 */
export function TecnicoContactLink({
  tecnico = DEFAULT_TECNICO,
  label,
  className = '',
  forwardMessage,
}: {
  tecnico?: TecnicoInfo;
  label?: string;
  className?: string;
  /** Pre-fill a message to forward/reference */
  forwardMessage?: string;
}) {
  const [open, setOpen] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const navigate = useNavigate();

  const initials = tecnico.nombre.split(' ').map(n => n[0]).filter(Boolean).slice(0, 2).join('');

  const handleSend = () => {
    const text = mensaje.trim() || forwardMessage;
    if (!text) { toast.error('Escribe un mensaje'); return; }
    toast.success(`Mensaje enviado a ${tecnico.nombre}`);
    setMensaje('');
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}
        className={`inline-flex items-center gap-1 text-primary hover:text-primary/80 underline underline-offset-2 decoration-primary/40 hover:decoration-primary transition-colors font-medium ${className}`}
      >
        <UserCheck className="h-3 w-3 shrink-0" />
        {label || tecnico.nombre}
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5 text-primary" /> Contactar técnico
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {/* Profile */}
            <div className="text-center">
              <div className="h-16 w-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-xl font-bold text-primary mb-2">
                {initials}
              </div>
              <p className="text-base font-semibold text-foreground">{tecnico.nombre}</p>
              <p className="text-sm text-muted-foreground">{tecnico.rol}</p>
              <div className="flex items-center justify-center gap-1 mt-1">
                <div className={`h-2 w-2 rounded-full ${tecnico.disponible ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">{tecnico.disponible ? 'Disponible ahora' : 'No disponible'}</span>
              </div>
            </div>

            {/* Quick actions */}
            <div className="space-y-2">
              <a href={`tel:${tecnico.telefono.replace(/\s/g, '')}`}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground flex-1">{tecnico.telefono}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
              <a href={`mailto:${tecnico.email}`}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground flex-1">{tecnico.email}</span>
                <ExternalLink className="h-3 w-3 text-muted-foreground" />
              </a>
            </div>

            {/* Forward context if provided */}
            {forwardMessage && (
              <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
                <p className="text-[11px] font-medium text-muted-foreground mb-1">Contexto adjunto:</p>
                <p className="text-xs text-foreground line-clamp-3">{forwardMessage}</p>
              </div>
            )}

            {/* Quick message */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Enviar mensaje rápido</p>
              <div className="flex gap-2">
                <Input
                  value={mensaje}
                  onChange={e => setMensaje(e.target.value)}
                  placeholder="Escribe un mensaje..."
                  onKeyDown={e => e.key === 'Enter' && handleSend()}
                  className="flex-1"
                />
                <Button size="icon" onClick={handleSend}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Go to full conversation */}
            <Button variant="outline" className="w-full" onClick={() => { setOpen(false); navigate('/productor/avisos'); }}>
              <MessageSquare className="h-4 w-4 mr-1" /> Ver conversación completa
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * Card version — shows técnico info inline with contact actions.
 * Use in detail panels where there's more space.
 */
export function TecnicoContactBanner({ tecnico = DEFAULT_TECNICO, context }: { tecnico?: TecnicoInfo; context?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
      <div className="flex items-center gap-3 min-w-0">
        <UserCheck className="h-5 w-5 text-primary shrink-0" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">Técnico: {tecnico.nombre}</p>
          <p className="text-xs text-muted-foreground">{tecnico.telefono}</p>
        </div>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <a href={`tel:${tecnico.telefono.replace(/\s/g, '')}`} className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
          <Phone className="h-3.5 w-3.5 text-primary" />
        </a>
        <a href={`mailto:${tecnico.email}`} className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors">
          <Mail className="h-3.5 w-3.5 text-primary" />
        </a>
        <TecnicoContactLink tecnico={tecnico} label="Mensaje" forwardMessage={context} className="text-xs no-underline bg-primary/10 rounded-full px-2 py-1 hover:bg-primary/20 decoration-transparent" />
      </div>
    </div>
  );
}

export default TecnicoContactLink;
