/**
 * Commercial deal-desk strip for the Sales Copilot.
 * Always visible, shows key commercial context at a glance.
 */
import { ArrowLeft, Loader2, Send, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  getSuggestedRoute,
  label,
  ORG_TYPE_LABELS,
  SCALE_LABELS,
} from '@/lib/diagnosticLabels';
import type { LeadProfile } from '@/lib/diagnosticEngine';

interface Props {
  profile: LeadProfile;
  sessionId: string | null;
  sessionCreating: boolean;
  canFinalize: boolean;
  finalizing: boolean;
  onFinalize: () => void;
}

export function CopilotTopBar({ profile, sessionId, sessionCreating, canFinalize, finalizing, onFinalize }: Props) {
  const navigate = useNavigate();
  const route = getSuggestedRoute(profile);
  const orgLabel = label(ORG_TYPE_LABELS, profile.organization_type);
  const scaleLabel = label(SCALE_LABELS, profile.scale);

  return (
    <div className="shrink-0 border-b border-border bg-card px-4 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => navigate('/admin/sales')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>

        {/* Deal identity */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-bold text-foreground truncate">
              {profile.organization_name ?? 'Nuevo diagnóstico'}
            </h1>
            {profile.organization_type && (
              <Badge variant="outline" className="text-[10px] shrink-0">{orgLabel}</Badge>
            )}
            {profile.scale && (
              <Badge variant="secondary" className="text-[10px] shrink-0">{scaleLabel}</Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-0.5">
            {route.route !== 'Piloto acotado' && (
              <span className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-primary" />
                <span className="font-medium text-foreground">{route.route}</span>
              </span>
            )}
            {sessionCreating && <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Creando sesión…</span>}
          </div>
        </div>

        {/* Session + actions */}
        <div className="flex items-center gap-2 shrink-0">
          {sessionId && (
            <span className="text-[10px] font-mono text-muted-foreground hidden sm:inline">
              {sessionId.substring(0, 8)}
            </span>
          )}
          {canFinalize && (
            <Button size="sm" onClick={onFinalize} disabled={finalizing} className="gap-1.5">
              {finalizing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
              Finalizar
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
