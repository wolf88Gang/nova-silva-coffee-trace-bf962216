/**
 * SalesInsightPanel — live commercial signals during diagnostic.
 * Dense operator console style.
 */

import { cn } from '@/lib/utils';
import type { FlowState, FlowFlag, ScoreState } from '@/modules/sales/FlowEngine.types';
import { SCORE_LABELS, OBJECTION_LABELS } from '@/modules/sales/salesUiConstants';

const FLAG_LABELS: Record<FlowFlag, string> = {
  high_pain: 'Dolor alto',
  high_objection: 'Objeción',
  unclear_maturity: 'Madurez baja',
  deepening_active: 'Profundizando',
  low_fit: 'Fit bajo',
  budget_risk: 'Riesgo presup.',
};

interface SalesInsightPanelProps {
  flowState: FlowState | null;
  orgName?: string | null;
  leadName?: string | null;
  leadCompany?: string | null;
  sessionId?: string | null;
  className?: string;
}

export function SalesInsightPanel({
  flowState,
  orgName,
  leadName,
  leadCompany,
  sessionId,
  className,
}: SalesInsightPanelProps) {
  const hasContext = orgName || leadName || leadCompany || sessionId;
  const hasScores = flowState?.context && Object.keys(flowState.context).length > 0;
  const hasObjections = flowState?.detected_objections?.length;
  const hasFlags = flowState?.flags?.length;
  const progress = flowState?.progress;

  if (!hasContext && !hasScores && !hasObjections && !hasFlags && !progress) {
    return null;
  }

  return (
    <aside
      className={cn(
        'rounded-md border bg-muted/20 p-3 space-y-3 text-xs min-w-[200px] max-w-[220px]',
        className
      )}
    >
      {hasContext && (
        <div className="pb-2 border-b border-border/60">
          {orgName && <p className="font-medium truncate" title={orgName}>{orgName}</p>}
          {(leadName || leadCompany) && (
            <p className="text-muted-foreground truncate">
              {[leadName, leadCompany].filter(Boolean).join(' · ')}
            </p>
          )}
          {progress && (
            <p className="text-muted-foreground tabular-nums mt-0.5">
              {progress.answered}/{progress.total_visible}
            </p>
          )}
        </div>
      )}

      {hasScores && flowState?.context && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1.5" title="Suma de sub-scores (escala abierta)">
            Score
          </p>
          <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
            {(Object.entries(flowState.context) as [keyof ScoreState, number][]).map(([key, val]) => (
              <div key={key} className="flex justify-between">
                <span className="text-muted-foreground">{SCORE_LABELS[key] ?? key}</span>
                <span className="font-medium tabular-nums">{val ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {hasObjections && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Bloqueadores
          </p>
          <ul className="space-y-0.5">
            {flowState!.detected_objections.slice(0, 4).map((o, i) => (
              <li key={i} className="flex justify-between">
                <span>{OBJECTION_LABELS[o.objection_type] ?? o.objection_type}</span>
                <span className="text-muted-foreground tabular-nums">{(o.confidence * 100).toFixed(0)}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {hasFlags && (
        <div>
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Señales
          </p>
          <div className="flex flex-wrap gap-1">
            {flowState!.flags
              .filter((f) => f !== 'deepening_active')
              .map((f) => (
                <span
                  key={f}
                  className="inline-flex items-center rounded px-1.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px]"
                >
                  {FLAG_LABELS[f] ?? f}
                </span>
              ))}
            {flowState!.deepening_active && (
              <span className="inline-flex items-center rounded px-1.5 py-0.5 bg-primary/10 text-primary text-[10px]">
                Profundizando
              </span>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
