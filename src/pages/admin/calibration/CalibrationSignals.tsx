/**
 * Calibration Review — Signals & Alerts
 * Identifies patterns that need review.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalibrationShell } from '@/components/calibration/CalibrationShell';
import { BackendUnavailable } from '@/components/calibration/BackendUnavailable';
import { FullPageSkeleton } from '@/components/calibration/CalibrationLoadingSkeleton';
import {
  useCalibrationSessions, useCalibrationObjections, useCalibrationRecommendations,
} from '@/hooks/useCalibrationData';
import { computeSignals } from '@/lib/calibrationAnalytics';
import type { CalibrationSignal } from '@/types/calibration';
import { Eye, BarChart3, ShieldAlert, Lightbulb, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  Scores: BarChart3,
  Bloqueadores: ShieldAlert,
  'Próximos pasos': Lightbulb,
  General: Info,
};

const SEV_COLORS: Record<CalibrationSignal['severity'], string> = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-warning bg-warning/5',
  low: 'border-l-muted-foreground/30 bg-muted/30',
};

const SEV_BADGE: Record<CalibrationSignal['severity'], { label: string; className: string }> = {
  high: { label: 'Alta', className: 'border-destructive/40 text-destructive' },
  medium: { label: 'Media', className: 'border-warning/40 text-warning' },
  low: { label: 'Baja', className: 'border-muted-foreground/30 text-muted-foreground' },
};

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

  const signals = computeSignals(sessions.data, objections.data, recs.data);

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
            {signals.map(signal => {
              const IconComponent = SIGNAL_ICONS[signal.category] ?? Info;
              return (
                <Card key={signal.id} className={cn('border-l-4', SEV_COLORS[signal.severity])}>
                  <CardContent className="py-3 px-4">
                    <div className="flex items-start gap-3">
                      <IconComponent className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-medium text-foreground">{signal.title}</span>
                          <Badge variant="outline" className={cn('text-[10px]', SEV_BADGE[signal.severity].className)}>
                            {SEV_BADGE[signal.severity].label}
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
              );
            })}
          </div>
        )}
      </div>
    </CalibrationShell>
  );
}
