/**
 * DemoLeadCaptureModal — Captures commercial intent from demo users.
 * Fields: nombre, email, organización, tipo, mensaje.
 * Pre-fills orgType and profileLabel from demo config.
 * Adapter-ready: swap submitLead() for real backend when available.
 */
import { useState } from 'react';
import { z } from 'zod';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Loader2, Send, CheckCircle2, AlertCircle } from 'lucide-react';

// ── Types ──

interface LeadPayload {
  nombre: string;
  email: string;
  organizacion: string;
  tipoOrganizacion: string;
  mensaje: string;
  // Hidden / auto-filled
  demoOrgType: string;
  demoProfileLabel: string;
  demoRoute: string;
  ctaSource: string;
}

type SubmitState = 'idle' | 'loading' | 'success' | 'error';

// ── Validation ──

const leadSchema = z.object({
  nombre: z.string().trim().min(2, 'Mínimo 2 caracteres').max(100),
  email: z.string().trim().email('Email inválido').max(255),
  organizacion: z.string().trim().max(150).optional().default(''),
  tipoOrganizacion: z.string().max(50).optional().default(''),
  mensaje: z.string().trim().max(1000).optional().default(''),
});

// ── Adapter (swap for real backend) ──

async function submitLead(_payload: LeadPayload): Promise<{ ok: boolean; message?: string }> {
  // TODO: Replace with real endpoint when available.
  // Options: Supabase insert to demo_leads, webhook, or email API.
  return { ok: true, message: 'placeholder' };
}

// ── Org type options ──

const ORG_TYPE_OPTIONS = [
  { value: 'cooperativa', label: 'Cooperativa' },
  { value: 'exportador', label: 'Exportador' },
  { value: 'finca_empresarial', label: 'Finca empresarial' },
  { value: 'productor_privado', label: 'Productor privado' },
  { value: 'certificadora', label: 'Certificadora' },
  { value: 'otro', label: 'Otro' },
];

// ── Component ──

interface DemoLeadCaptureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ctaSource?: string;
}

export function DemoLeadCaptureModal({ open, onOpenChange, ctaSource = '' }: DemoLeadCaptureModalProps) {
  const config = getDemoConfig();
  const location = useLocation();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [organizacion, setOrganizacion] = useState('');
  const [tipoOrganizacion, setTipoOrganizacion] = useState(config?.orgType || '');
  const [mensaje, setMensaje] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const isValid = nombre.trim().length >= 2 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitState === 'loading') return;

    // Validate with Zod
    const parsed = leadSchema.safeParse({ nombre, email, organizacion, tipoOrganizacion, mensaje });
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach(issue => {
        const key = String(issue.path[0] || '');
        if (key && !errs[key]) errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});

    setSubmitState('loading');
    setErrorMsg('');

    try {
      const result = await submitLead({
        nombre: parsed.data.nombre,
        email: parsed.data.email.toLowerCase(),
        organizacion: parsed.data.organizacion || '',
        tipoOrganizacion: parsed.data.tipoOrganizacion || '',
        mensaje: parsed.data.mensaje || '',
        demoOrgType: config?.orgType || '',
        demoProfileLabel: config?.profileLabel || '',
        demoRoute: location.pathname,
        ctaSource,
      });

      if (result.ok) {
        setSubmitState('success');
      } else {
        setSubmitState('error');
        setErrorMsg(result.message || 'No se pudo enviar la solicitud');
      }
    } catch {
      setSubmitState('error');
      setErrorMsg('Error de conexión. Intenta de nuevo.');
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset after animation
    setTimeout(() => {
      setSubmitState('idle');
      setFieldErrors({});
      setNombre('');
      setEmail('');
      setOrganizacion('');
      setMensaje('');
      setErrorMsg('');
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Solicitar demo personalizado</DialogTitle>
          <DialogDescription>
            Te contactaremos para mostrarte Nova Silva con tu operación real.
          </DialogDescription>
        </DialogHeader>

        {submitState === 'success' ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Solicitud registrada</p>
              <p className="text-xs text-muted-foreground">
                Nuestro equipo te contactará pronto.
              </p>
            </div>
            <p className="text-[10px] text-muted-foreground/60 pt-2">
              Pendiente de conexión a backend.
            </p>
            <button
              onClick={handleClose}
              className="mt-2 text-xs font-medium text-primary hover:underline"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-1.5">
              <label htmlFor="lead-nombre" className="text-xs font-medium text-foreground">
                Nombre <span className="text-destructive">*</span>
              </label>
              <input
                id="lead-nombre"
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Tu nombre"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
                maxLength={100}
                disabled={submitState === 'loading'}
              />
              {fieldErrors.nombre && <p className="text-[11px] text-destructive">{fieldErrors.nombre}</p>}
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="lead-email" className="text-xs font-medium text-foreground">
                Email <span className="text-destructive">*</span>
              </label>
              <input
                id="lead-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                required
                maxLength={255}
                disabled={submitState === 'loading'}
              />
              {fieldErrors.email && <p className="text-[11px] text-destructive">{fieldErrors.email}</p>}
            </div>

            {/* Organización */}
            <div className="space-y-1.5">
              <label htmlFor="lead-org" className="text-xs font-medium text-foreground">
                Organización
              </label>
              <input
                id="lead-org"
                type="text"
                value={organizacion}
                onChange={(e) => setOrganizacion(e.target.value)}
                placeholder="Nombre de tu empresa u organización"
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={submitState === 'loading'}
              />
            </div>

            {/* Tipo de organización */}
            <div className="space-y-1.5">
              <label htmlFor="lead-tipo" className="text-xs font-medium text-foreground">
                Tipo de organización
              </label>
              <select
                id="lead-tipo"
                value={tipoOrganizacion}
                onChange={(e) => setTipoOrganizacion(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                disabled={submitState === 'loading'}
              >
                <option value="">Seleccionar</option>
                {ORG_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Mensaje */}
            <div className="space-y-1.5">
              <label htmlFor="lead-mensaje" className="text-xs font-medium text-foreground">
                Mensaje <span className="text-muted-foreground font-normal">(opcional)</span>
              </label>
              <textarea
                id="lead-mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="¿Qué te interesa ver?"
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                disabled={submitState === 'loading'}
              />
            </div>

            {/* Error */}
            {submitState === 'error' && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-destructive/5 border border-destructive/20 text-xs text-destructive animate-fade-in">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!isValid || submitState === 'loading'}
              className={cn(
                'w-full flex items-center justify-center gap-2 py-2.5 px-6 rounded-xl font-semibold text-sm transition-colors',
                isValid && submitState !== 'loading'
                  ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                  : 'bg-muted text-muted-foreground cursor-not-allowed'
              )}
            >
              {submitState === 'loading' ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Enviando…
                </>
              ) : (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Enviar solicitud
                </>
              )}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
