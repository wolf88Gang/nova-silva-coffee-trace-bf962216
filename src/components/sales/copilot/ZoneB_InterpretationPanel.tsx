/**
 * Zone B — profile gaps, signals, objections, commercial route.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { CopilotInterpretation } from '@/modules/sales/InterpretationEngine.types';
import { PROFILE_FIELD_LABELS, OBJECTION_LABELS } from '@/modules/sales/commercialLabels';
import type { FlowState } from '@/modules/sales/FlowEngine.types';
import type { InterpretationBlock } from '@/types/salesDiagnostic';

interface ZoneB_InterpretationPanelProps {
  interpretation: CopilotInterpretation | null;
  flowState: FlowState | null;
  noteInterpretations: InterpretationBlock[];
}

export function ZoneB_InterpretationPanel({
  interpretation,
  flowState,
  noteInterpretations,
}: ZoneB_InterpretationPanelProps) {
  if (!interpretation || !flowState) {
    return (
      <Card className="h-full min-h-[200px]">
        <CardContent className="pt-4 text-sm text-muted-foreground">
          La interpretación aparece al avanzar en el diagnóstico.
        </CardContent>
      </Card>
    );
  }

  const { gaps, signals, priorityProfile } = interpretation;
  const allSignals = [
    ...signals.pain_signals.map((s) => `Dolor: ${s}`),
    ...signals.maturity_signals.map((s) => `Madurez: ${s}`),
    ...signals.urgency_signals.map((s) => `Urgencia: ${s}`),
  ];

  return (
    <div className="space-y-3 text-sm">
      <Card>
        <CardContent className="pt-3 pb-3 space-y-2">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Perfil (desde respuestas)</p>
          <div className="grid gap-1 text-xs">
            <div>
              <span className="text-muted-foreground">Org: </span>
              {priorityProfile.organization_type ?? '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Escala: </span>
              {priorityProfile.scale ?? '—'}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-3 pb-3 space-y-2">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Info crítica faltante</p>
          {gaps.length === 0 ? (
            <p className="text-xs text-muted-foreground">Ningún gap crítico detectado por motor.</p>
          ) : (
            <ul className="text-xs space-y-1 list-disc list-inside">
              {gaps.slice(0, 8).map((g) => (
                <li key={g}>{PROFILE_FIELD_LABELS[g] ?? g}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-3 pb-3 space-y-2">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Señales</p>
          <div className="flex flex-wrap gap-1">
            {allSignals.length === 0 ? (
              <span className="text-xs text-muted-foreground">—</span>
            ) : (
              allSignals.map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px] font-normal">
                  {s}
                </Badge>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-3 pb-3 space-y-2">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Objeciones (sesión)</p>
          <ul className="text-xs space-y-1">
            {flowState.detected_objections.length === 0 ? (
              <li className="text-muted-foreground">—</li>
            ) : (
              flowState.detected_objections.map((o, i) => (
                <li key={i}>
                  {OBJECTION_LABELS[o.objection_type] ?? o.objection_type}{' '}
                  <span className="text-muted-foreground tabular-nums">
                    ({Math.round(o.confidence * 100)}%)
                  </span>
                </li>
              ))
            )}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-3 pb-3 space-y-2">
          <p className="text-[10px] font-medium uppercase text-muted-foreground">Ruta comercial sugerida</p>
          <ul className="text-xs space-y-1 list-disc list-inside">
            {interpretation.routeRationale.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {noteInterpretations.length > 0 && (
        <Card>
          <CardContent className="pt-3 pb-3 space-y-2">
            <p className="text-[10px] font-medium uppercase text-muted-foreground">Desde notas</p>
            <ul className="text-xs space-y-2">
              {noteInterpretations.slice(-5).map((b) => (
                <li key={b.id} className="border-l-2 pl-2 border-primary/30">
                  {b.suggested_positioning ?? b.potential_objection ?? b.detected_pain_signals.join(', ')}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
