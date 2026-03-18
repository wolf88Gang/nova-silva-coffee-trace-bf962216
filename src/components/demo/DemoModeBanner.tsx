/**
 * DemoModeBanner — Persistent banner for demo sessions without organization.
 * Shown inside the dashboard when a demo user has no org associated.
 */
import { useState } from 'react';
import { getDemoConfig, isDemoEligibleUser } from '@/hooks/useDemoConfig';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/hooks/useOrgContext';
import { AlertTriangle, X, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

export function DemoModeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();
  const { organizationId } = useOrgContext();
  const demoConfig = getDemoConfig();

  // Only show for demo users
  if (!isDemoEligibleUser(user)) return null;
  if (dismissed) return null;

  // Case: Demo with org → show subtle info banner
  if (organizationId && demoConfig) {
    return (
      <div className="relative flex items-center gap-2.5 px-4 py-2.5 mb-4 rounded-xl border border-primary/20 bg-primary/5 animate-fade-in">
        <Info className="h-4 w-4 text-primary shrink-0" />
        <p className="text-xs text-muted-foreground flex-1">
          <span className="font-medium text-foreground">Modo demo</span>
          {demoConfig.profileLabel ? ` · ${demoConfig.profileLabel}` : ''}
          {demoConfig.orgName ? ` · ${demoConfig.orgName}` : ''}
        </p>
        <button
          onClick={() => setDismissed(true)}
          className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  // Case: Demo WITHOUT org → show warning banner (not dismissible)
  if (!organizationId) {
    return (
      <div className="flex items-center gap-3 px-4 py-3 mb-4 rounded-xl border border-warning/30 bg-warning/10 animate-fade-in">
        <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">Modo demo limitado</p>
          <p className="text-xs text-muted-foreground">
            No tienes una organización asociada. Algunas funciones que dependen de datos del tenant estarán limitadas o no disponibles.
          </p>
        </div>
      </div>
    );
  }

  return null;
}
