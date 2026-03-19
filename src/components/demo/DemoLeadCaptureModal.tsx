/**
 * Modal de captura de leads para flujo demo.
 * Persistencia real en Supabase (demo_leads).
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { submitLead } from '@/services/demoLeadsService';
import type { DemoLeadPayload } from '@/types/demoLeads';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export interface DemoLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Origen del CTA: banner, contacto, wizard, etc. */
  ctaSource?: string;
  /** Tipo de org demo si viene del wizard */
  demoOrgType?: string;
  /** Label del perfil demo si aplica */
  demoProfileLabel?: string;
  /** Ruta actual al enviar */
  demoRoute?: string;
  /** Callback tras éxito */
  onSuccess?: () => void;
}

export function DemoLeadCaptureModal({
  open,
  onOpenChange,
  ctaSource,
  demoOrgType,
  demoProfileLabel,
  demoRoute,
  onSuccess,
}: DemoLeadCaptureModalProps) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    organizacion: '',
    tipo_organizacion: '',
    mensaje: '',
  });
  const [status, setStatus] = useState<SubmitStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMessage(null);

    const payload: DemoLeadPayload = {
      nombre: form.nombre.trim(),
      email: form.email.trim(),
      organizacion: form.organizacion.trim() || null,
      tipo_organizacion: form.tipo_organizacion.trim() || null,
      mensaje: form.mensaje.trim() || null,
      demo_org_type: demoOrgType ?? null,
      demo_profile_label: demoProfileLabel ?? null,
      demo_route: demoRoute ?? (typeof window !== 'undefined' ? window.location.pathname : null),
      cta_source: ctaSource ?? null,
    };

    const result = await submitLead(payload);

    if (result.ok) {
      setStatus('success');
      setForm({ nombre: '', email: '', organizacion: '', tipo_organizacion: '', mensaje: '' });
      onSuccess?.();
    } else {
      setStatus('error');
      setErrorMessage(result.error ?? 'Error desconocido');
    }
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setStatus('idle');
      setErrorMessage(null);
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Dejanos tus datos</DialogTitle>
          <DialogDescription>
            Te contactaremos para coordinar una demo personalizada o resolver tu consulta.
          </DialogDescription>
        </DialogHeader>

        {status === 'success' ? (
          <div className="py-6 flex flex-col items-center gap-3 text-center">
            <div className="rounded-full bg-success/10 p-3">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <p className="font-medium text-foreground">¡Gracias!</p>
            <p className="text-sm text-muted-foreground">
              Recibimos tu información. Nos pondremos en contacto pronto.
            </p>
            <Button variant="outline" onClick={() => handleClose(false)}>
              Cerrar
            </Button>
          </div>
        ) : status === 'error' ? (
          <div className="py-6 space-y-4">
            <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive">No se pudo enviar</p>
                <p className="text-sm text-muted-foreground mt-1">{errorMessage}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { setStatus('idle'); setErrorMessage(null); }}>
                Reintentar
              </Button>
              <Button variant="ghost" onClick={() => handleClose(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="lead-nombre">Nombre *</Label>
              <Input
                id="lead-nombre"
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                placeholder="Tu nombre"
                required
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <Label htmlFor="lead-email">Correo electrónico *</Label>
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="correo@ejemplo.com"
                required
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <Label htmlFor="lead-organizacion">Organización</Label>
              <Input
                id="lead-organizacion"
                value={form.organizacion}
                onChange={(e) => setForm((f) => ({ ...f, organizacion: e.target.value }))}
                placeholder="Cooperativa, finca, empresa..."
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <Label htmlFor="lead-tipo">Tipo de organización</Label>
              <Input
                id="lead-tipo"
                value={form.tipo_organizacion}
                onChange={(e) => setForm((f) => ({ ...f, tipo_organizacion: e.target.value }))}
                placeholder="Productor, cooperativa, exportador..."
                disabled={status === 'loading'}
              />
            </div>
            <div>
              <Label htmlFor="lead-mensaje">Mensaje</Label>
              <Textarea
                id="lead-mensaje"
                value={form.mensaje}
                onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                placeholder="¿En qué podemos ayudarte?"
                rows={3}
                disabled={status === 'loading'}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={() => handleClose(false)} disabled={status === 'loading'}>
                Cancelar
              </Button>
              <Button type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Enviando...
                  </>
                ) : (
                  'Enviar'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
