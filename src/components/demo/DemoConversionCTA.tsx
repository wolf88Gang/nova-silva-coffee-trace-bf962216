/**
 * DemoConversionCTA — Reusable commercial conversion block for demo flow.
 * Shows role-adapted microcopy and CTA buttons that open the lead capture modal.
 */
import { useState } from 'react';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { ArrowRight, Calendar, MessageCircle, X, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoLeadCaptureModal } from './DemoLeadCaptureModal';

const ROLE_COPY: Record<string, string> = {
  cooperativa: 'Podemos mostrarte cómo centralizar productores, parcelas y cumplimiento.',
  exportador: 'Podemos mostrarte cómo reducir riesgo regulatorio y mejorar trazabilidad.',
  certificadora: 'Podemos mostrarte cómo acelerar revisión y evidencia digital.',
  finca_empresarial: 'Podemos mostrarte cómo controlar operación, riesgo y cumplimiento desde un solo lugar.',
  productor_privado: 'Podemos mostrarte cómo controlar operación, riesgo y cumplimiento desde un solo lugar.',
};

interface DemoConversionCTAProps {
  variant?: 'landing' | 'modal' | 'inline' | 'endOfTour';
  onClose?: () => void;
  className?: string;
}

export function DemoConversionCTA({ variant = 'inline', onClose, className }: DemoConversionCTAProps) {
  const [leadModalOpen, setLeadModalOpen] = useState(false);
  const [ctaSource, setCtaSource] = useState('');
  const config = getDemoConfig();
  const orgType = config?.orgType || '';
  const roleCopy = ROLE_COPY[orgType] || 'Nova Silva puede adaptarse a cooperativas, exportadores, certificadoras y fincas empresariales.';

  const openLead = (source: string) => {
    setCtaSource(source);
    setLeadModalOpen(true);
  };

  const modal = <DemoLeadCaptureModal open={leadModalOpen} onOpenChange={setLeadModalOpen} ctaSource={ctaSource} />;

  if (variant === 'landing') {
    return (
      <div className={cn('mt-10 pt-8 border-t border-white/10', className)}>
        <div className="text-center space-y-4 max-w-md mx-auto">
          <p className="text-white/60 text-sm font-medium">
            ¿Quieres ver cómo aplicaría en tu operación real?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => openLead('landing-demo-real')}
              className="inline-flex items-center gap-2 text-sm font-semibold py-2.5 px-6 rounded-xl bg-white/[0.1] hover:bg-white/[0.18] text-white border border-white/15 hover:border-white/30 transition-all active:scale-[0.97]"
            >
              <Calendar className="h-3.5 w-3.5" />
              Solicitar demo real
            </button>
            <button
              onClick={() => openLead('landing-hablar')}
              className="inline-flex items-center gap-2 text-sm py-2.5 px-6 rounded-xl text-white/50 hover:text-white hover:bg-white/[0.06] transition-all"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Hablar con el equipo
            </button>
          </div>
        </div>
        {modal}
      </div>
    );
  }

  if (variant === 'modal') {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-xs text-muted-foreground text-center">
          Cuando termines, podemos mostrarte una versión adaptada a tu operación.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => openLead('welcome-modal')}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-muted/60 hover:bg-muted text-foreground font-medium text-xs transition-colors"
          >
            <Calendar className="h-3.5 w-3.5 text-primary" />
            Solicitar demo real
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-muted-foreground hover:text-foreground text-xs transition-colors"
            >
              Cerrar
            </button>
          )}
        </div>
        {modal}
      </div>
    );
  }

  if (variant === 'endOfTour') {
    return (
      <div className={cn(
        'relative rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent p-5 space-y-3 animate-fade-in',
        className
      )}>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
            aria-label="Cerrar"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary/10 shrink-0">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              ¿Listo para verlo con tus datos y flujo real?
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {roleCopy}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 pt-1">
          <button
            onClick={() => openLead('end-of-tour-demo')}
            className="inline-flex items-center gap-2 text-xs font-semibold py-2 px-4 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Calendar className="h-3.5 w-3.5" />
            Solicitar demo real
          </button>
          <button
            onClick={() => openLead('end-of-tour-implementacion')}
            className="inline-flex items-center gap-2 text-xs py-2 px-4 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
          >
            <ArrowRight className="h-3.5 w-3.5" />
            Conocer implementación
          </button>
        </div>
        {modal}
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={cn(
      'flex items-center gap-3 p-3 rounded-xl bg-muted/40 border border-border/50',
      className
    )}>
      <div className="p-1.5 rounded-lg bg-primary/10 shrink-0">
        <Sparkles className="h-3.5 w-3.5 text-primary" />
      </div>
      <p className="text-xs text-muted-foreground flex-1 min-w-0">
        {roleCopy}
      </p>
      <button
        onClick={() => openLead('inline')}
        className="shrink-0 text-xs font-medium text-primary hover:underline"
      >
        Solicitar demo
      </button>
      {modal}
    </div>
  );
}
