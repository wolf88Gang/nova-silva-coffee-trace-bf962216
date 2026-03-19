/**
 * CalibrationBlocks — reusable presentation for Calibration Review.
 * Compact, executive, technical.
 */

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OBJECTION_LABELS } from '@/modules/sales/salesUiConstants';
import type { RuleCandidate } from '@/modules/sales/calibrationAnalytics';
import type { ScoreBucketRow, ObjectionAnalysisRow } from '@/modules/sales/CalibrationService';

const DIM_LABELS: Record<string, string> = {
  pain: 'Dolor',
  maturity: 'Madurez',
  urgency: 'Urgencia',
  fit: 'Fit',
  budget_readiness: 'Presup.',
};

function SignalBadge({ signal }: { signal: string }) {
  const v = signal === 'strong_positive' ? 'positive' : signal === 'strong_negative' ? 'negative' : 'neutral';
  const color =
    v === 'positive'
      ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
      : v === 'negative'
        ? 'bg-red-500/10 text-red-700 dark:text-red-400'
        : 'bg-muted text-muted-foreground';
  return (
    <span className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium ${color}`}>{signal}</span>
  );
}

export function ScoreAnalysisBlock({
  results,
  dimensions,
}: {
  results: ScoreBucketRow[];
  dimensions: string[];
}) {
  const byDim = dimensions.map((d) => ({
    dim: d,
    label: DIM_LABELS[d] ?? d,
    buckets: results.filter((r) => r.dimension === d),
  }));

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Win rate por bucket
        </p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {byDim.map(({ dim, label, buckets }) => (
            <div key={dim} className="space-y-1.5">
              <p className="text-xs font-medium">{label}</p>
              <div className="space-y-1">
                {buckets.map((b) => (
                  <div key={`${dim}-${b.bucket}`} className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground tabular-nums">{b.bucket}</span>
                    <span className="tabular-nums">{(b.win_rate * 100).toFixed(0)}%</span>
                    <span className="tabular-nums text-muted-foreground">n={b.session_count}</span>
                    <SignalBadge signal={b.signal} />
                  </div>
                ))}
                {buckets.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function ObjectionAnalysisBlock({ results }: { results: ObjectionAnalysisRow[] }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Loss rate por objeción
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 font-medium">Tipo</th>
                <th className="text-right py-2 font-medium">Loss %</th>
                <th className="text-right py-2 font-medium">n</th>
                <th className="text-right py-2 font-medium">W/L</th>
                <th className="text-right py-2 font-medium">Conf</th>
                <th className="text-left py-2 font-medium">Señal</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.objection_type} className="border-b border-border/60">
                  <td className="py-1.5">
                    <span className="font-medium">{OBJECTION_LABELS[r.objection_type] ?? r.objection_type}</span>
                    {(r.over_triggered || r.high_risk) && (
                      <span className="ml-1.5">
                        {r.over_triggered && (
                          <Badge variant="outline" className="text-[9px] py-0 px-1">over</Badge>
                        )}
                        {r.high_risk && (
                          <Badge variant="destructive" className="text-[9px] py-0 px-1">riesgo</Badge>
                        )}
                      </span>
                    )}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">{(r.loss_rate * 100).toFixed(0)}%</td>
                  <td className="py-1.5 text-right tabular-nums">{r.count}</td>
                  <td className="py-1.5 text-right tabular-nums text-muted-foreground">
                    {r.sessions_with_win}/{r.sessions_with_loss}
                  </td>
                  <td className="py-1.5 text-right tabular-nums">
                    {r.avg_confidence != null ? (r.avg_confidence * 100).toFixed(0) + '%' : '—'}
                  </td>
                  <td className="py-1.5">
                    <SignalBadge signal={r.signal} />
                  </td>
                </tr>
              ))}
              {results.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-muted-foreground">
                    Sin objeciones con outcome
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

export function RuleCandidatesBlock({ candidates }: { candidates: RuleCandidate[] }) {
  const byKind = {
    score_weak: candidates.filter((c) => c.kind === 'score_weak'),
    objection_over: candidates.filter((c) => c.kind === 'objection_over'),
    rec_underperform: candidates.filter((c) => c.kind === 'rec_underperform'),
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Candidatos a ajuste
        </p>
        <div className="space-y-3">
          {byKind.score_weak.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Score</p>
              <div className="flex flex-wrap gap-2">
                {byKind.score_weak.map((c) => (
                  <Badge
                    key={c.id}
                    variant={c.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-[10px] font-normal"
                  >
                    {c.label}: {c.detail}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {byKind.objection_over.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Objeciones</p>
              <div className="flex flex-wrap gap-2">
                {byKind.objection_over.map((c) => (
                  <Badge
                    key={c.id}
                    variant={c.priority === 'high' ? 'destructive' : 'secondary'}
                    className="text-[10px] font-normal"
                  >
                    {OBJECTION_LABELS[c.label] ?? c.label}: {c.detail}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {byKind.rec_underperform.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1.5">Recomendaciones</p>
              <div className="flex flex-wrap gap-2">
                {byKind.rec_underperform.map((c) => (
                  <Badge key={c.id} variant="secondary" className="text-[10px] font-normal">
                    {c.label}: {c.detail}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {candidates.length === 0 && (
            <p className="text-xs text-muted-foreground">Sin candidatos con muestra suficiente</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
