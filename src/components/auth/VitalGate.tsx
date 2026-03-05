/**
 * VitalGate: wraps VITAL-related pages that depend on vital_actions or vital_scores_dimensions.
 * Since those tables have 0 RLS policies, this gate blocks real queries and shows a
 * "Coming soon" / mock-data UI instead.
 *
 * Tables affected:
 * - vital_actions (0 policies — fully blocked)
 * - vital_scores_dimensions (0 policies — fully blocked)
 *
 * Tables safe to read:
 * - vital_dimension_playbooks (SELECT with USING(true) — read-only catalog)
 */
import { ReactNode } from 'react';
import { Shield, Lock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

/** If true, VITAL pages show mock data only (no real queries to blocked tables) */
export const VITAL_ACTIONS_BLOCKED = true;
export const VITAL_SCORES_BLOCKED = true;

interface VitalGateProps {
  children: ReactNode;
  /** Show children with mock banner, or fully block */
  mode?: 'banner' | 'block';
}

export function VitalGate({ children, mode = 'banner' }: VitalGateProps) {
  if (!VITAL_ACTIONS_BLOCKED && !VITAL_SCORES_BLOCKED) {
    return <>{children}</>;
  }

  if (mode === 'block') {
    return (
      <div className="min-h-[50vh] flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-6 text-center space-y-4">
            <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
              <Lock className="h-7 w-7 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Protocolo VITAL — Próximamente
            </h2>
            <p className="text-sm text-muted-foreground">
              Los módulos de acciones y puntajes dimensionales estarán disponibles en la próxima fase del piloto.
            </p>
            <p className="text-xs text-muted-foreground">
              El catálogo de dimensiones y playbooks ya está disponible como referencia.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Banner mode: render children directly with demo data
  return <>{children}</>;
}
