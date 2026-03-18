/**
 * DemoTourHints — Lightweight contextual hints for demo users.
 * Shows dismissable tooltip-like hints on key dashboard areas.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoEligibleUser } from '@/hooks/useDemoConfig';
import { useLocation } from 'react-router-dom';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';

const HINTS_DISMISSED_KEY = 'novasilva_demo_hints_dismissed';

interface RouteHint {
  path: string;
  matchPrefix?: boolean;
  message: string;
}

const ROUTE_HINTS: RouteHint[] = [
  {
    path: '/produccion',
    message: 'Aqui puedes ver parcelas, productores y el estado de la produccion. Explora las tarjetas para ver detalles.',
  },
  {
    path: '/cumplimiento',
    matchPrefix: true,
    message: 'Revisa el estado de cumplimiento, dossiers EUDR y alertas de trazabilidad.',
  },
  {
    path: '/agronomia',
    matchPrefix: true,
    message: 'Explora los modulos de nutricion, Nova Guard y estimaciones de rendimiento.',
  },
  {
    path: '/origenes',
    message: 'Gestiona proveedores, riesgos de origen y analítica de supply chain.',
  },
  {
    path: '/cooperativa/vital',
    message: 'El índice VITAL mide la resiliencia de tu operacion. Revisa los ejes y las acciones sugeridas.',
  },
];

export function DemoTourHint() {
  const { user } = useAuth();
  const location = useLocation();
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const raw = sessionStorage.getItem(HINTS_DISMISSED_KEY);
      return raw ? new Set(JSON.parse(raw)) : new Set();
    } catch {
      return new Set();
    }
  });

  if (!isDemoEligibleUser(user)) return null;

  const currentHint = ROUTE_HINTS.find(h =>
    h.matchPrefix ? location.pathname.startsWith(h.path) : location.pathname === h.path
  );

  if (!currentHint || dismissed.has(currentHint.path)) return null;

  const handleDismiss = () => {
    const next = new Set(dismissed);
    next.add(currentHint.path);
    setDismissed(next);
    sessionStorage.setItem(HINTS_DISMISSED_KEY, JSON.stringify([...next]));
  };

  return (
    <div className="mb-4 flex items-start gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 animate-fade-in">
      <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 mt-0.5">
        <Lightbulb className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-foreground mb-0.5">Sugerencia</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{currentHint.message}</p>
      </div>
      <button
        onClick={handleDismiss}
        className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors shrink-0"
        aria-label="Cerrar sugerencia"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
