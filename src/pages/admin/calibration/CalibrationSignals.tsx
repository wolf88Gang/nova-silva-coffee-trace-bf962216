/**
 * Calibration Review — Signals & Alerts
 * Identifies patterns that need review.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalibrationShell } from '@/components/calibration/CalibrationShell';
import { BackendUnavailable } from '@/components/calibration/BackendUnavailable';
import { FullPageSkeleton } from '@/components/calibration/CalibrationLoadingSkeleton';
import {
  useCalibrationSessions, useCalibrationObjections, useCalibrationRecommendations,
  computeScoreBuckets, computeObjectionAnalysis, computeRecommendationAnalysis,
  SCORE_KEYS,
} from '@/hooks/useCalibrationData';
import { SCORE_LABELS, fmtPct } from '@/lib/calibrationLabels';
import { AlertTriangle, Eye, BarChart3, ShieldAlert, Lightbulb, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Signal {
  id: string;
  severity: 'high' | 'medium' | 'low';
  category: string;
  title: string;
  detail: string;
  icon: React.ElementType;
}

export default function CalibrationSignals() {
  const sessions = useCalibrationSessions();
  const objections = useCalibrationObjections();
  const recs = useCalibrationRecommendations();

  const allUnavailable = sessions.backendStatus === 'unavailable'
    && objections.backendStatus === 'unavailable';

  if (allUnavailable) {
    return <CalibrationShell><BackendUnavailable status="unavailable" table="sales_sessions" /></CalibrationShell>;
  }

  const anyLoading = sessions.isLoading || objections.isLoading || recs.isLoading;
  if (anyLoading) {
    return <CalibrationShell><FullPageSkeleton /></CalibrationShell>;
  }

  // Generate signals from data
  const signals: Signal[] = [];

  // 1. Low sample scores
  if (sessions.data && sessions.data.length > 0) {
    const buckets = computeScoreBuckets(sessions.data);
    buckets.forEach(b => {
      const total = b.low.total + b.mid.total + b.high.total;
      if (total < 5 && total > 0) {
        signals.push({
          id: `low-sample-${b.scoreKey}`,
          severity: 'medium',
          category: 'Scores',
          title: `Muestra insuficiente para ${SCORE_LABELS[b.scoreKey]}`,
          detail: `Solo ${total} sesiones tienen score ${b.scoreKey}. Resultados estadísticamente poco confiables.`,
          icon: BarChart3,
        });
      }
    });

    // 2. Scores with no discriminating power
    buckets.forEach(b => {
      const total = b.low.total + b.mid.total + b.high.total;
      if (total >= 10) {
        const lowWR = b.low.total > 0 ? b.low.won / b.low.total : 0;
        const highWR = b.high.total > 0 ? b.high.won / b.high.total : 0;
        if (Math.abs(highWR - lowWR) < 0.1) {
          signals.push({
            id: `no-discrim-${b.scoreKey}`,
            severity: 'high',
            category: 'Scores',
            title: `${SCORE_LABELS[b.scoreKey]} no discrimina outcomes`,
            detail: `Win rate similar en bucket bajo (${fmtPct(lowWR * 100)}) y alto (${fmtPct(highWR * 100)}). Posible ruido.`,
            icon: BarChart3,
          });
        }
      }
    });
  }

  // 3. Objections signals
  if (objections.data && sessions.data) {
    const objAnalysis = computeObjectionAnalysis(objections.data, sessions.data);
    objAnalysis.forEach(o => {
      if (o.count >= 10 && o.lossRate < 20) {
        signals.push({
          id: `over-detected-${o.type}`,
          severity: 'medium',
          category: 'Bloqueadores',
          title: `"${o.type}" posiblemente sobre-detectado`,
          detail: `${o.count} detecciones pero solo ${fmtPct(o.lossRate)} loss rate. Podría ser ruido.`,
          icon: ShieldAlert,
        });
      }
      if (o.count < 3 && o.lossRate > 80) {
        signals.push({
          id: `under-detected-${o.type}`,
          severity: 'high',
          category: 'Bloqueadores',
          title: `"${o.type}" con muestra mínima pero alto loss rate`,
          detail: `Solo ${o.count} detecciones con ${fmtPct(o.lossRate)} loss rate. Requiere más datos o revisión de threshold.`,
          icon: ShieldAlert,
        });
      }
    });
  }

  // 4. Recommendation signals
  if (recs.data && sessions.data) {
    const recAnalysis = computeRecommendationAnalysis(recs.data, sessions.data);
    const avg = recAnalysis.length > 0 ? recAnalysis.reduce((s, a) => s + a.count, 0) / recAnalysis.length : 0;
    recAnalysis.forEach(r => {
      if (r.count > avg * 3 && r.winRate < 30) {
        signals.push({
          id: `overused-rec-${r.type}`,
          severity: 'high',
          category: 'Próximos pasos',
          title: `"${r.type}" sobreutilizada sin resultados`,
          detail: `${r.count} usos (3x promedio) con solo ${fmtPct(r.winRate)} win rate. Evaluar eliminación o ajuste.`,
          icon: Lightbulb,
        });
      }
    });
  }

  // 5. General sample size
  if (sessions.data && sessions.data.length > 0 && sessions.data.length < 20) {
    signals.push({
      id: 'low-total-sample',
      severity: 'low',
      category: 'General',
      title: 'Muestra total reducida',
      detail: `Solo ${sessions.data.length} sesiones. Todas las métricas deben interpretarse con cautela.`,
      icon: Info,
    });
  }

  const sevOrder = { high: 0, medium: 1, low: 2 };
  signals.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);

  const sevColors = {
    high: 'border-l-destructive bg-destructive/5',
    medium: 'border-l-warning bg-warning/5',
    low: 'border-l-muted-foreground/30 bg-muted/30',
  };

  const sevBadge = {
    high: { label: 'Alta', className: 'border-destructive/40 text-destructive' },
    medium: { label: 'Media', className: 'border-warning/40 text-warning' },
    low: { label: 'Baja', className: 'border-muted-foreground/30 text-muted-foreground' },
  };

  return (
    <CalibrationShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Señales y alertas de calibración</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Patrones que merecen revisión antes de recalibrar</p>
          </div>
          <Badge variant="outline" className="text-xs font-mono border-muted-foreground/30">
            {signals.length} señales
          </Badge>
        </div>

        {signals.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-10 text-center">
              <Eye className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">Sin señales de calibración detectadas</p>
              <p className="text-xs text-muted-foreground mt-1">
                {sessions.data && sessions.data.length > 0
                  ? 'Los datos actuales no generan alertas con los umbrales configurados'
                  : 'Se requieren datos de sesiones para generar señales'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {signals.map(signal => (
              <Card key={signal.id} className={cn('border-l-4', sevColors[signal.severity])}>
                <CardContent className="py-3 px-4">
                  <div className="flex items-start gap-3">
                    <signal.icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{signal.title}</span>
                        <Badge variant="outline" className={cn('text-[10px]', sevBadge[signal.severity].className)}>
                          {sevBadge[signal.severity].label}
                        </Badge>
                        <Badge variant="outline" className="text-[10px] border-muted-foreground/20 text-muted-foreground">
                          {signal.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{signal.detail}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </CalibrationShell>
  );
}
