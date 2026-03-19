/**
 * Calibration Review — Score Analysis
 * Win/loss bucketization by score dimension.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalibrationShell } from '@/components/calibration/CalibrationShell';
import { BackendUnavailable } from '@/components/calibration/BackendUnavailable';
import { FullPageSkeleton } from '@/components/calibration/CalibrationLoadingSkeleton';
import { useCalibrationSessions, useCalibrationOutcomes } from '@/hooks/useCalibrationData';
import { computeScoreBuckets } from '@/lib/calibrationAnalytics';
import { SCORE_LABELS, BUCKET_LABELS, fmtPct } from '@/lib/calibrationLabels';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalibrationScores() {
  const sessions = useCalibrationSessions();
  const outcomesQ = useCalibrationOutcomes();

  if (sessions.backendStatus === 'unavailable') {
    return <CalibrationShell><BackendUnavailable status="unavailable" table="sales_sessions" /></CalibrationShell>;
  }

  if (sessions.isLoading || outcomesQ.isLoading) {
    return <CalibrationShell><FullPageSkeleton /></CalibrationShell>;
  }

  const buckets = computeScoreBuckets(sessions.data, outcomesQ.data);
  const hasData = buckets.some(b => b.low.total + b.mid.total + b.high.total > 0);

  return (
    <CalibrationShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Análisis de scores</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Win/loss rate por dimensión y rango de score</p>
          </div>
          <Badge variant="outline" className="text-xs font-mono border-muted-foreground/30">
            {sessions.data?.length ?? 0} sesiones
          </Badge>
        </div>

        {!hasData ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <BarChart3 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin datos de scoring disponibles</p>
              <p className="text-xs text-muted-foreground mt-1">Las sesiones no contienen scores o no tienen outcome registrado</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {buckets.map(bucket => {
              const total = bucket.low.total + bucket.mid.total + bucket.high.total;
              if (total === 0) return null;

              return (
                <Card key={bucket.scoreKey}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <BarChart3 className="h-3.5 w-3.5 text-primary" />
                      {SCORE_LABELS[bucket.scoreKey] ?? bucket.scoreKey}
                      <Badge variant="outline" className="text-[10px] font-mono ml-auto">{total} sesiones</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-3">
                      {(['low', 'mid', 'high'] as const).map(tier => {
                        const d = bucket[tier];
                        const winRate = d.total > 0 ? (d.won / d.total) * 100 : 0;
                        const lossRate = d.total > 0 ? (d.lost / d.total) * 100 : 0;
                        const signal = winRate > 60 ? 'strong' : lossRate > 60 ? 'weak' : 'neutral';
                        return (
                          <div
                            key={tier}
                            className={cn(
                              'p-3 rounded-lg border',
                              signal === 'strong' ? 'border-success/30 bg-success/5' :
                              signal === 'weak' ? 'border-destructive/20 bg-destructive/5' :
                              'border-border bg-muted/30'
                            )}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-semibold text-muted-foreground uppercase">
                                {BUCKET_LABELS[tier]}
                              </span>
                              {signal === 'strong' && <TrendingUp className="h-3 w-3 text-success" />}
                              {signal === 'weak' && <TrendingDown className="h-3 w-3 text-destructive" />}
                              {signal === 'neutral' && <Minus className="h-3 w-3 text-muted-foreground" />}
                            </div>
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Won</span>
                                <span className="font-medium text-success">{d.won} ({d.total > 0 ? fmtPct(winRate, 0) : '—'})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Lost</span>
                                <span className="font-medium text-destructive">{d.lost} ({d.total > 0 ? fmtPct(lossRate, 0) : '—'})</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">No decision</span>
                                <span className="font-medium text-muted-foreground">{d.noDecision}</span>
                              </div>
                            </div>
                            <div className="mt-2 text-[10px] text-muted-foreground">
                              n={d.total}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </CalibrationShell>
  );
}
