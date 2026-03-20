/**
 * Calibration Review — Overview
 * Executive summary: outcomes, active version, top signals, aggregate score radar.
 */
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalibrationShell } from '@/components/calibration/CalibrationShell';
import { BackendUnavailable } from '@/components/calibration/BackendUnavailable';
import { KPISkeleton } from '@/components/calibration/CalibrationLoadingSkeleton';
import { MetricCard } from '@/components/admin/shared/AdminComponents';
import {
  useCalibrationSessions,
  useCalibrationOutcomes,
  useCalibrationObjections,
  useCalibrationRecommendations,
  useRuleVersions,
} from '@/hooks/useCalibrationData';
import { computeOutcomes, computeObjectionAnalysis, computeRecommendationAnalysis } from '@/lib/calibrationAnalytics';
import { fmtPct, fmtDate } from '@/lib/calibrationLabels';
import {
  Target, TrendingUp, TrendingDown, MinusCircle, Shield,
  CheckCircle2, XCircle, Clock, AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BackendStatus } from '@/types/calibration';
import ScoreRadarChart from '@/components/calibration/ScoreRadarChart';

export default function CalibrationOverview() {
  const sessions = useCalibrationSessions();
  const outcomesQ = useCalibrationOutcomes();
  const objections = useCalibrationObjections();
  const recommendations = useCalibrationRecommendations();
  const versions = useRuleVersions();

  const allUnavailable = sessions.backendStatus === 'unavailable'
    && outcomesQ.backendStatus === 'unavailable'
    && objections.backendStatus === 'unavailable'
    && versions.backendStatus === 'unavailable';

  const anyLoading = sessions.isLoading || outcomesQ.isLoading || objections.isLoading || recommendations.isLoading || versions.isLoading;

  const outcomes = computeOutcomes(outcomesQ.data);
  const topObjections = computeObjectionAnalysis(objections.data, outcomesQ.data).slice(0, 5);
  const topRecs = computeRecommendationAnalysis(recommendations.data, outcomesQ.data).slice(0, 5);
  const activeVersion = versions.data?.find(v => v.is_active) ?? null;

  // Aggregate average scores across all sessions for radar
  const avgScores = useMemo(() => {
    const s = sessions.data;
    if (!s || s.length === 0) return null;
    const avg = (key: string) => {
      const vals = s.map(r => (r as any)[key]).filter((v: any) => v != null && v > 0) as number[];
      return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : null;
    };
    return {
      pain: avg('score_pain'),
      maturity: avg('score_maturity'),
      urgency: avg('score_urgency'),
      fit: avg('score_fit'),
      budget_readiness: avg('score_budget_readiness'),
      objection: avg('score_objection'),
    };
  }, [sessions.data]);

  return (
    <CalibrationShell>
      {allUnavailable ? (
        <BackendUnavailable status="unavailable" table="sales_sessions" />
      ) : (
        <div className="space-y-5">
          {/* KPI Row */}
          {anyLoading ? <KPISkeleton /> : (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <MetricCard label="Sesiones con outcome" value={outcomes.total} icon={Target} />
              <MetricCard label="Win rate" value={outcomes.total > 0 ? fmtPct(outcomes.winRate) : '—'} icon={TrendingUp} />
              <MetricCard label="Loss rate" value={outcomes.total > 0 ? fmtPct(outcomes.lossRate) : '—'} icon={TrendingDown} />
              <MetricCard label="No decision" value={outcomes.total > 0 ? fmtPct(outcomes.noDecisionRate) : '—'} icon={MinusCircle} />
              <MetricCard label="Versión activa" value={activeVersion ? activeVersion.id.slice(0, 8) : '—'} icon={Shield} />
            </div>
          )}

          {/* Active version info */}
          {activeVersion && (
            <Card className="border-primary/20">
              <CardContent className="py-3 px-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-primary shrink-0" />
                  <div>
                    <span className="text-sm font-medium text-foreground">Versión activa: {activeVersion.id.slice(0, 8)}</span>
                    {activeVersion.deployed_at && (
                      <span className="text-xs text-muted-foreground ml-2">
                        Desplegada {fmtDate(activeVersion.deployed_at)}
                      </span>
                    )}
                  </div>
                </div>
                {activeVersion.description && (
                  <p className="text-xs text-muted-foreground max-w-sm truncate">{activeVersion.description}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Outcome distribution */}
          {outcomes.total > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Distribución de outcomes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-1 h-6 rounded-md overflow-hidden">
                  {outcomes.won > 0 && (
                    <div className="h-full bg-success/80 flex items-center justify-center" style={{ width: `${outcomes.winRate}%` }}>
                      <span className="text-[10px] font-semibold text-success-foreground px-1">{fmtPct(outcomes.winRate, 0)}</span>
                    </div>
                  )}
                  {outcomes.lost > 0 && (
                    <div className="h-full bg-destructive/70 flex items-center justify-center" style={{ width: `${outcomes.lossRate}%` }}>
                      <span className="text-[10px] font-semibold text-destructive-foreground px-1">{fmtPct(outcomes.lossRate, 0)}</span>
                    </div>
                  )}
                  {outcomes.no_decision > 0 && (
                    <div className="h-full bg-muted flex items-center justify-center" style={{ width: `${outcomes.noDecisionRate}%` }}>
                      <span className="text-[10px] font-medium text-muted-foreground px-1">{fmtPct(outcomes.noDecisionRate, 0)}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-success/80" /> Won ({outcomes.won})</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/70" /> Lost ({outcomes.lost})</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-muted" /> No decision ({outcomes.no_decision})</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Aggregate score radar */}
          {avgScores && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Perfil promedio de scores (todas las sesiones)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <ScoreRadarChart scores={avgScores} height={240} />
                  <div className="space-y-2 text-xs">
                    {Object.entries(avgScores).map(([key, val]) => {
                      const labels: Record<string, string> = { pain: 'Dolor', maturity: 'Madurez', urgency: 'Urgencia', fit: 'Fit', budget_readiness: 'Presupuesto', objection: 'Objeción' };
                      const isStrong = val != null && val >= 50;
                      const isWeak = val != null && val < 25 && val > 0;
                      return (
                        <div key={key} className="flex items-center justify-between p-2 rounded bg-muted/40">
                          <span className="text-muted-foreground">{labels[key] ?? key}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-foreground">{val ?? '—'}</span>
                            {isStrong && <Badge variant="outline" className="text-[9px] border-primary/30 text-primary">Fuerte</Badge>}
                            {isWeak && <Badge variant="outline" className="text-[9px] border-destructive/30 text-destructive">Débil</Badge>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Two-column: top objections + top recs */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <XCircle className="h-3.5 w-3.5 text-destructive" />
                  Top bloqueadores por loss rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                {objections.backendStatus === 'unavailable' ? (
                  <BackendUnavailable status="unavailable" table="sales_session_objections" />
                ) : topObjections.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Sin datos de bloqueadores</p>
                ) : (
                  <div className="space-y-2">
                    {topObjections.sort((a, b) => b.lossRate - a.lossRate).map(o => (
                      <div key={o.type} className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">{o.type}</p>
                          <p className="text-xs text-muted-foreground">{o.count} detecciones · confianza {fmtPct(o.avgConfidence * 100, 0)}</p>
                        </div>
                        <Badge variant="outline" className={cn('font-mono text-xs',
                          o.lossRate > 60 ? 'border-destructive/40 text-destructive' : 'border-muted-foreground/30'
                        )}>
                          {fmtPct(o.lossRate)} loss
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                  Top próximos pasos por win rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recommendations.backendStatus === 'unavailable' ? (
                  <BackendUnavailable status="unavailable" table="sales_session_recommendations" />
                ) : topRecs.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">Sin datos de recomendaciones</p>
                ) : (
                  <div className="space-y-2">
                    {topRecs.sort((a, b) => b.winRate - a.winRate).map(r => (
                      <div key={r.type} className="flex items-center justify-between p-2 rounded bg-muted/40 border border-border/50">
                        <div>
                          <p className="text-sm font-medium text-foreground">{r.type}</p>
                          <p className="text-xs text-muted-foreground">{r.count} usos</p>
                        </div>
                        <Badge variant="outline" className={cn('font-mono text-xs',
                          r.winRate > 60 ? 'border-success/40 text-success' : 'border-muted-foreground/30'
                        )}>
                          {fmtPct(r.winRate)} win
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* System health */}
          <Card className="border-muted-foreground/10">
            <CardContent className="py-3 px-4">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Salud del sistema de calibración</p>
              <div className="flex flex-wrap gap-3 text-xs">
                <StatusPill label="Sesiones" status={sessions.backendStatus} />
                <StatusPill label="Outcomes" status={outcomesQ.backendStatus} />
                <StatusPill label="Bloqueadores" status={objections.backendStatus} />
                <StatusPill label="Próximos pasos" status={recommendations.backendStatus} />
                <StatusPill label="Versiones" status={versions.backendStatus} />
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </CalibrationShell>
  );
}

function StatusPill({ label, status }: { label: string; status: BackendStatus }) {
  const icon = status === 'available'
    ? <CheckCircle2 className="h-3 w-3 text-success" />
    : status === 'error'
      ? <AlertTriangle className="h-3 w-3 text-destructive" />
      : <Clock className="h-3 w-3 text-muted-foreground" />;
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/50 border border-border/50">
      {icon}
      <span className="text-foreground">{label}</span>
    </span>
  );
}
