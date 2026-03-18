/**
 * DemoWelcomeModal — Shown once after demo login.
 * Explains what the user can explore and what's limited.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoEligibleUser, getDemoConfig } from '@/hooks/useDemoConfig';
import { cn } from '@/lib/utils';
import {
  X, MapPin, Shield, BarChart3, Leaf,
  ArrowRight, AlertTriangle, Lock,
} from 'lucide-react';
import { DemoConversionCTA } from './DemoConversionCTA';

const WELCOME_SHOWN_KEY = 'novasilva_demo_welcome_shown';

interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    icon: BarChart3,
    title: 'Panel de control',
    description: 'Indicadores clave, estado de la operacion y accesos rapidos.',
  },
  {
    icon: MapPin,
    title: 'Produccion y trazabilidad',
    description: 'Parcelas, entregas, productores y documentacion de origen.',
  },
  {
    icon: Shield,
    title: 'Cumplimiento y EUDR',
    description: 'Dossiers, polígonos, evidencia y alertas de deforestacion.',
  },
  {
    icon: Leaf,
    title: 'Agronomia',
    description: 'Nutricion, Nova Guard, estimaciones de rendimiento.',
  },
];

const LIMITATIONS = [
  'Los datos son ficticios y se reinician periodicamente',
  'Las acciones de escritura no persisten entre sesiones',
  'Algunas integraciones externas no estan disponibles',
];

export function DemoWelcomeModal() {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const demoConfig = getDemoConfig();

  useEffect(() => {
    if (!isDemoEligibleUser(user)) return;

    // Show only once per session
    const alreadyShown = sessionStorage.getItem(WELCOME_SHOWN_KEY);
    if (!alreadyShown) {
      // Small delay so the dashboard renders first
      const timer = setTimeout(() => setOpen(true), 800);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setOpen(false);
    sessionStorage.setItem(WELCOME_SHOWN_KEY, '1');
  };

  if (!open) return null;

  const profileLabel = demoConfig?.profileLabel || 'Demo';
  const orgName = demoConfig?.orgName || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center animate-fade-in">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 bg-background border border-border rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden">
        {/* Header gradient */}
        <div className="relative px-6 pt-6 pb-5 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
              </span>
              Modo demo activo
            </div>
            <h2 className="text-xl font-bold text-foreground">
              Bienvenido al demo de Nova Silva
            </h2>
            {orgName && (
              <p className="text-sm text-muted-foreground">
                {profileLabel} en <span className="font-medium text-foreground">{orgName}</span>
              </p>
            )}
          </div>
        </div>

        {/* Tour steps */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Que puedes explorar</p>
          <div className="grid grid-cols-2 gap-2.5">
            {TOUR_STEPS.map((step) => (
              <div
                key={step.title}
                className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/40 border border-border/50"
              >
                <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
                  <step.icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-tight">{step.title}</p>
                  <p className="text-[11px] text-muted-foreground leading-snug mt-0.5">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Limitations */}
        <div className="px-6 pb-4">
          <div className="p-3 rounded-xl bg-warning/5 border border-warning/20 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
              <p className="text-xs font-medium text-foreground">Limitaciones del demo</p>
            </div>
            <ul className="space-y-1">
              {LIMITATIONS.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-muted-foreground">
                  <Lock className="h-3 w-3 text-warning/60 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* CTA */}
        <div className="px-6 pb-6 space-y-3">
          <button
            onClick={handleClose}
            className="w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            Comenzar recorrido
            <ArrowRight className="h-4 w-4" />
          </button>
          <DemoConversionCTA variant="modal" onClose={handleClose} />
        </div>
      </div>
    </div>
  );
}
