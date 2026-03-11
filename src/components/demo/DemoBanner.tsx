/**
 * DemoBanner — Contextual banner shown inside the app during demo sessions.
 * Shows demo config summary + CTA to create a real account.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { getSetupConfig } from '@/lib/pricingEngine';
import { X, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoBanner() {
  const [dismissed, setDismissed] = useState(false);
  const navigate = useNavigate();
  const demoConfig = getDemoConfig();
  const setupConfig = getSetupConfig();

  // Only show if in demo mode and setup was done
  if (!demoConfig || !setupConfig || dismissed) return null;

  const orgTypeLabels: Record<string, string> = {
    productor_privado: 'Finca privada',
    finca_empresarial: 'Finca empresarial',
    cooperativa: 'Cooperativa',
    beneficio: 'Beneficio',
    exportador: 'Exportador',
    certificadora: 'Certificadora',
  };

  const modelLabels: Record<string, string> = {
    single_farm: 'producción propia',
    estate: 'finca empresarial',
    estate_hybrid: 'producción + compra a terceros',
    aggregator: 'agrupación de productores',
    trader: 'comercialización y exportación',
    auditor: 'auditoría y verificación',
  };

  const orgLabel = orgTypeLabels[demoConfig.orgType] || demoConfig.orgType;
  const modelLabel = modelLabels[demoConfig.operatingModel] || demoConfig.operatingModel;

  return (
    <div className="relative bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 border border-primary/20 rounded-xl px-4 py-3 mb-4 animate-fade-in">
      <button
        onClick={() => setDismissed(true)}
        className="absolute top-2 right-2 p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
        aria-label="Cerrar"
      >
        <X className="h-3.5 w-3.5" />
      </button>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="min-w-0">
            <p className="text-sm font-medium text-foreground">
              Este demo refleja tu operación
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {orgLabel} · {modelLabel} · {demoConfig.modules.length} módulos activos
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate('/crear-cuenta')}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-colors shrink-0',
            'bg-primary text-primary-foreground hover:bg-primary/90'
          )}
        >
          Crear cuenta con esta configuración
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
