/**
 * Calibration Review — Signals & Alerts with drill-down
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CalibrationShell } from '@/components/calibration/CalibrationShell';
import { BackendUnavailable } from '@/components/calibration/BackendUnavailable';
import { FullPageSkeleton } from '@/components/calibration/CalibrationLoadingSkeleton';
import {
  useCalibrationSessions, useCalibrationOutcomes, useCalibrationObjections, useCalibrationRecommendations,
} from '@/hooks/useCalibrationData';
import { computeSignals } from '@/lib/calibrationAnalytics';
import type { CalibrationSignal } from '@/types/calibration';
import { Eye, BarChart3, ShieldAlert, Lightbulb, Info, X, ArrowRight, AlertTriangle, Target } from 'lucide-react';
import { cn } from '@/lib/utils';

const SIGNAL_ICONS: Record<string, React.ElementType> = {
  Scores: BarChart3,
  Bloqueadores: ShieldAlert,
  'Próximos pasos': Lightbulb,
  General: Info,
};

const SEV_COLORS: Record<CalibrationSignal['severity'], string> = {
  high: 'border-l-destructive bg-destructive/5',
  medium: 'border-l-amber-500 bg-amber-500/5',
  low: 'border-l-muted-foreground/30 bg-muted/30',
};

const SEV_BADGE: Record<CalibrationSignal['severity'], { label: string; className: string }> = {
  high: { label: 'Alta', className: 'border-destructive/40 text-destructive' },
  medium: { label: 'Media', className: 'border-amber-500/40 text-amber-600 dark:text-amber-400' },
  low: { label: 'Baja', className: 'border-muted-foreground/30 text-muted-foreground' },
};

/** Maps signal categories to actionable guidance */
function getSignalGuidance(signal: CalibrationSignal): {
  comercialImportance: string;
  suggestedAction: string;
  relatedArea: string;
} {
  const cat = signal.category;
  if (cat === 'Scores') {
    return {
      comercialImportance: 'Los scores que no correlacionan con resultados generan ruido en la priorización comercial y pueden guiar a los vendedores hacia leads equivocados.',
      suggestedAction: 'Revisar los umbrales de este score. Si la muestra es suficiente, considerar recalibrar pesos o eliminar la dimensión.',
      relatedArea: 'Calibración de reglas → Scores',
    };
  }
  if (cat === 'Bloqueadores') {
    return {
      comercialImportance: 'Las objeciones con baja correlación a pérdida pueden estar sobre-detectadas, mientras que las sub-detectadas ocultan riesgos reales.',
      suggestedAction: 'Comparar loss rate de sesiones con y sin esta objeción. Ajustar confianza mínima si hay mucho ruido.',
      relatedArea: 'Calibración de reglas → Bloqueadores',
    };
  }
  if (cat === 'Próximos pasos') {
    return {
      comercialImportance: 'Las recomendaciones que no generan wins más altos que el promedio no aportan valor y pueden distraer al vendedor.',
      suggestedAction: 'Evaluar si la recomendación necesita reformulación o si depende de un segmento específico.',
      relatedArea: 'Calibración de reglas → Próximos pasos',
    };
  }
  return {
    comercialImportance: 'Señal que merece atención operativa para mantener la calidad del motor comercial.',
    suggestedAction: 'Revisar datos subyacentes y confirmar si aplica una recalibración.',
    relatedArea: 'Calibración general',
  };
}

function SignalDrillDown({ signal, onClose }: { signal: CalibrationSignal; onClose: () => void }) {
  const guidance = getSignalGuidance(signal);
  const IconComponent = SIGNAL_ICONS[signal.category] ?? Info;

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-card border-l border-border z-50 shadow-xl overflow-y-auto animate-in slide-in-from-right">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-2">
          <IconComponent className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">Detalle de señal</h3>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>

      <div className="p-5 space-y-5">
        {/* Signal identity */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="outline" className={cn('text-xs', SEV_BADGE[signal.severity].className)}>
              Prioridad {SEV_BADGE[signal.severity].label}
            </Badge>
            <Badge variant="outline" className="text-xs border-muted-foreground/20 text-muted-foreground">
              {signal.category}
            </Badge>
          </div>
          <h4 className="text-base font-bold text-foreground">{signal.title}</h4>
          <p className="text-sm text-muted-foreground mt-1">{signal.detail}</p>
        </div>

        <Separator />

        {/* Why it matters */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
            <AlertTriangle className="h-3 w-3" /> Por qué importa comercialmente
          </div>
          <p className="text-sm text-foreground leading-relaxed">{guidance.comercialImportance}</p>
        </div>

        {/* What to do */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground uppercase tracking-wider">
            <Target className="h-3 w-3" /> Acción sugerida
          </div>
          <p className="text-sm text-foreground leading-relaxed">{guidance.suggestedAction}</p>
        </div>

        {/* Related area */}
        <div className="p-3 rounded-lg bg-muted/40">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Área relacionada</span>
            <span className="text-xs font-medium text-foreground">{guidance.relatedArea}</span>
          </div>
        </div>

        {/* Evidence summary */}
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-foreground uppercase tracking-wider">Evidencia de la señal</div>
          <Card className={cn('border-l-4', SEV_COLORS[signal.severity])}>
            <CardContent className="py-3 px-4">
              <p className="text-xs text-muted-foreground">{signal.detail}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Severidad: <span className="font-medium">{SEV_BADGE[signal.severity].label}</span> · Categoría: <span className="font-medium">{signal.category}</span>
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function CalibrationSignals() {
  const sessions = useCalibrationSessions();
  const outcomesQ = useCalibrationOutcomes();
  const objections = useCalibrationObjections();
  const recs = useCalibrationRecommendations();
  const [selectedSignal, setSelectedSignal] = useState<CalibrationSignal | null>(null);

  const allUnavailable = sessions.backendStatus === 'unavailable'
    && objections.backendStatus === 'unavailable';

  if (allUnavailable) {
    return <CalibrationShell><BackendUnavailable status="unavailable" table="sales_sessions" /></CalibrationShell>;
  }

  const anyLoading = sessions.isLoading || outcomesQ.isLoading || objections.isLoading || recs.isLoading;
  if (anyLoading) {
    return <CalibrationShell><FullPageSkeleton /></CalibrationShell>;
  }

  const signals = computeSignals(sessions.data, outcomesQ.data, objections.data, recs.data);

  return (
    <CalibrationShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground">Señales y alertas de calibración</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Haz clic en una señal para ver detalle, impacto comercial y acción sugerida</p>
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
                <Card
                  key={signal.id}
                  className={cn('border-l-4 cursor-pointer hover:border-primary/30 transition-colors', SEV_COLORS[signal.severity])}
                  onClick={() => setSelectedSignal(signal)}
                >
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
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {selectedSignal && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedSignal(null)} />
          <SignalDrillDown signal={selectedSignal} onClose={() => setSelectedSignal(null)} />
        </>
      )}
    </CalibrationShell>
  );
}
