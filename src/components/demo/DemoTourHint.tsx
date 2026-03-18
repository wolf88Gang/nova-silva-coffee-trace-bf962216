/**
 * DemoTourHints — Lightweight contextual hints for demo users.
 * Shows dismissable tooltip-like hints on key dashboard areas.
 * After visiting 3+ sections, shows a conversion CTA.
 */
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { isDemoEligibleUser } from '@/hooks/useDemoConfig';
import { useLocation } from 'react-router-dom';
import { X, Lightbulb } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoConversionCTA } from './DemoConversionCTA';

const HINTS_DISMISSED_KEY = 'novasilva_demo_hints_dismissed';
const VISITED_KEY = 'novasilva_demo_visited_sections';
const CTA_DISMISSED_KEY = 'novasilva_demo_cta_dismissed';
const SECTIONS_THRESHOLD = 3;

interface RouteHint {
  path: string;
  matchPrefix?: boolean;
  message: string;
  section: string;
}

const ROUTE_HINTS: RouteHint[] = [
  {
    path: '/produccion',
    message: 'Aqui puedes ver parcelas, productores y el estado de la produccion. Explora las tarjetas para ver detalles.',
    section: 'produccion',
  },
  {
    path: '/cumplimiento',
    matchPrefix: true,
    message: 'Revisa el estado de cumplimiento, dossiers EUDR y alertas de trazabilidad.',
    section: 'cumplimiento',
  },
  {
    path: '/agronomia',
    matchPrefix: true,
    message: 'Explora los modulos de nutricion, Nova Guard y estimaciones de rendimiento.',
    section: 'agronomia',
  },
  {
    path: '/origenes',
    message: 'Gestiona proveedores, riesgos de origen y analítica de supply chain.',
    section: 'origenes',
  },
  {
    path: '/cooperativa/vital',
    message: 'El índice VITAL mide la resiliencia de tu operacion. Revisa los ejes y las acciones sugeridas.',
    section: 'vital',
  },
];

function getVisitedSections(): Set<string> {
  try {
    const raw = sessionStorage.getItem(VISITED_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

function saveVisitedSections(set: Set<string>) {
  sessionStorage.setItem(VISITED_KEY, JSON.stringify([...set]));
}

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
  const [visitedCount, setVisitedCount] = useState(() => getVisitedSections().size);
  const [ctaDismissed, setCtaDismissed] = useState(() => sessionStorage.getItem(CTA_DISMISSED_KEY) === '1');

  // Track visited sections
  useEffect(() => {
    if (!isDemoEligibleUser(user)) return;
    const hint = ROUTE_HINTS.find(h =>
      h.matchPrefix ? location.pathname.startsWith(h.path) : location.pathname === h.path
    );
    if (hint) {
      const visited = getVisitedSections();
      if (!visited.has(hint.section)) {
        visited.add(hint.section);
        saveVisitedSections(visited);
        setVisitedCount(visited.size);
      }
    }
  }, [location.pathname, user]);

  if (!isDemoEligibleUser(user)) return null;

  const currentHint = ROUTE_HINTS.find(h =>
    h.matchPrefix ? location.pathname.startsWith(h.path) : location.pathname === h.path
  );

  const showConversionCTA = visitedCount >= SECTIONS_THRESHOLD && !ctaDismissed;
  const showHint = currentHint && !dismissed.has(currentHint.path);

  if (!showHint && !showConversionCTA) return null;

  const handleDismissHint = () => {
    if (!currentHint) return;
    const next = new Set(dismissed);
    next.add(currentHint.path);
    setDismissed(next);
    sessionStorage.setItem(HINTS_DISMISSED_KEY, JSON.stringify([...next]));
  };

  const handleDismissCTA = () => {
    setCtaDismissed(true);
    sessionStorage.setItem(CTA_DISMISSED_KEY, '1');
  };

  return (
    <div className="space-y-3 mb-4">
      {showHint && currentHint && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 animate-fade-in">
          <div className="p-1.5 rounded-lg bg-primary/10 shrink-0 mt-0.5">
            <Lightbulb className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground mb-0.5">Sugerencia</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{currentHint.message}</p>
          </div>
          <button
            onClick={handleDismissHint}
            className="p-1 rounded-lg hover:bg-muted/50 text-muted-foreground transition-colors shrink-0"
            aria-label="Cerrar sugerencia"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {showConversionCTA && (
        <DemoConversionCTA variant="endOfTour" onClose={handleDismissCTA} />
      )}
    </div>
  );
}
