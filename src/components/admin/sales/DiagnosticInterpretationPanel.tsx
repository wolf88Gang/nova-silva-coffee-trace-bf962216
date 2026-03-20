/**
 * Live interpretation side panel for Sales Diagnostic.
 * Shows real-time profile summary, pain signals, scores, objections, recommendations.
 */
import { AlertTriangle, Brain, Crosshair, Gauge, Lightbulb, Signal, Target, User2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Interpretation, LeadProfile } from '@/lib/diagnosticEngine';
import { cn } from '@/lib/utils';

interface Props {
  profile: LeadProfile;
  interpretation: Interpretation;
  answeredCount: number;
}

function ConfidenceBadge({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  return (
    <span className={cn(
      'text-[10px] font-mono px-1.5 py-0.5 rounded',
      pct >= 80 ? 'bg-destructive/10 text-destructive' :
        pct >= 50 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
          'bg-muted text-muted-foreground',
    )}>
      {pct}%
    </span>
  );
}

export function DiagnosticInterpretationPanel({ profile, interpretation, answeredCount }: Props) {
  const { pain_signals, maturity_level, objections, positioning, recommendations } = interpretation;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-2">
        {/* PROFILE SUMMARY */}
        <Card className="bg-primary/5 border-primary/10">
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs uppercase tracking-wider text-primary flex items-center gap-1.5">
              <User2 className="h-3.5 w-3.5" /> Perfil del Lead
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tipo</span>
              <span className="font-medium text-foreground">{profile.organization_type ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Escala</span>
              <span className="font-medium text-foreground">{profile.scale ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Geografía</span>
              <span className="font-medium text-foreground">{profile.geography ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Comercialización</span>
              <span className="font-medium text-foreground">{profile.commercialization_model ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Organización</span>
              <span className="font-medium text-foreground truncate max-w-[140px]">{profile.organization_name ?? '—'}</span>
            </div>
            <Separator className="my-1" />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preguntas respondidas</span>
              <span className="font-mono font-medium text-foreground">{answeredCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Señales detectadas</span>
              <span className="font-mono font-medium text-foreground">{profile.signals.length}</span>
            </div>
          </CardContent>
        </Card>

        {/* MATURITY */}
        <Card>
          <CardHeader className="pb-2 pt-3 px-4">
            <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Gauge className="h-3.5 w-3.5" /> Madurez Digital
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className="text-[10px]">{maturity_level.level}</Badge>
              <span className="text-lg font-bold font-mono text-foreground">{maturity_level.score}/7</span>
            </div>
            <Progress value={(maturity_level.score / 7) * 100} className="h-1.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">{maturity_level.reasoning}</p>
          </CardContent>
        </Card>

        {/* PAIN SIGNALS */}
        {pain_signals.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Signal className="h-3.5 w-3.5" /> Señales de Dolor ({pain_signals.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              {pain_signals.map((s, i) => (
                <div key={i} className="flex items-start gap-2">
                  <Crosshair className="h-3 w-3 mt-0.5 text-destructive/70 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-foreground leading-snug">{s.signal}</p>
                  </div>
                  <ConfidenceBadge value={s.confidence} />
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* OBJECTIONS */}
        {objections.length > 0 && (
          <Card className="border-amber-500/20">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Objeciones Detectadas ({objections.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {objections.map((o, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-start gap-2">
                    <p className="text-[11px] font-medium text-foreground flex-1">{o.hypothesis}</p>
                    <ConfidenceBadge value={o.confidence} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">Trigger: {o.trigger}</p>
                  <div className="rounded bg-primary/5 px-2 py-1.5">
                    <p className="text-[10px] text-primary leading-relaxed">
                      <Lightbulb className="h-2.5 w-2.5 inline mr-1" />
                      {o.suggested_response}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* POSITIONING */}
        {positioning.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Target className="h-3.5 w-3.5" /> Posicionamiento Sugerido
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1.5">
              {positioning.map((p, i) => (
                <p key={i} className="text-[11px] text-foreground leading-relaxed flex items-start gap-1.5">
                  <span className="text-primary font-bold">→</span> {p}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* RECOMMENDATIONS */}
        {recommendations.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Brain className="h-3.5 w-3.5" /> Recomendaciones
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1.5">
              {recommendations.map((r, i) => (
                <p key={i} className="text-[11px] text-foreground leading-relaxed flex items-start gap-1.5">
                  <span className="text-primary font-bold">•</span> {r}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* SIGNALS */}
        {profile.signals.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Señales Internas</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 flex flex-wrap gap-1">
              {profile.signals.map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px]">{s}</Badge>
              ))}
            </CardContent>
          </Card>
        )}

        {/* NOTES */}
        {profile.notes.length > 0 && (
          <Card>
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Notas</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1">
              {profile.notes.map((n, i) => (
                <p key={i} className="text-[10px] text-muted-foreground">{n}</p>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
