/**
 * Right-column intelligence panel for the Sales Copilot.
 * Order: Route → Missing → Objections → Signals → Profile
 * Hides route when default/no evidence. No vanity counters.
 */
import { AlertTriangle, Compass, Eye, Radar, Route, User2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import type { Interpretation, LeadProfile } from '@/lib/diagnosticEngine';
import {
  BUDGET_LABELS,
  COMMERCIALIZATION_LABELS,
  getMissingInfo,
  getSuggestedRoute,
  humanizeObjectionTrigger,
  label,
  MATURITY_LABELS,
  ORG_TYPE_LABELS,
  SCALE_LABELS,
  SIGNAL_LABELS,
  TIMELINE_LABELS,
} from '@/lib/diagnosticLabels';
import { cn } from '@/lib/utils';

interface Props {
  profile: LeadProfile;
  interpretation: Interpretation;
  answeredCount: number;
}

function ObjLevel({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const lvl = pct >= 75 ? 'alta' : pct >= 45 ? 'media' : 'baja';
  return (
    <Badge
      variant="outline"
      className={cn(
        'text-[10px] font-medium',
        pct >= 75 ? 'border-destructive/30 text-destructive' :
          pct >= 45 ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' :
            'border-border text-muted-foreground',
      )}
    >
      {lvl}
    </Badge>
  );
}

export function CopilotIntelligencePanel({ profile, interpretation, answeredCount }: Props) {
  const { pain_signals, maturity_level, objections } = interpretation;
  const missingInfo = getMissingInfo(profile);
  const route = getSuggestedRoute(profile);
  const budget = profile.raw_answers['budget_readiness'] as string | undefined;
  const timeline = profile.raw_answers['urgency_timeline'] as string | undefined;

  return (
    <ScrollArea className="h-full">
      <div className="space-y-3 pr-2 pb-4">

        {/* 1. ROUTE — only when meaningful */}
        {!route.isDefault && profile.organization_type && (
          <Card className="bg-primary/5 border-primary/15">
            <CardHeader className="pb-1.5 pt-3 px-4">
              <CardTitle className="text-[11px] uppercase tracking-wider text-primary flex items-center gap-1.5">
                <Route className="h-3.5 w-3.5" /> Ruta comercial sugerida
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-2">
              <p className="text-sm font-semibold text-foreground">{route.route}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{route.why}</p>
              {route.evidence.length > 0 && (
                <>
                  <Separator className="my-1" />
                  <div className="space-y-0.5">
                    <p className="text-[10px] font-medium text-muted-foreground">Señal basada en:</p>
                    {route.evidence.map((e, i) => (
                      <p key={i} className="text-[10px] text-foreground">• {e}</p>
                    ))}
                  </div>
                </>
              )}
              {route.missing.length > 0 && (
                <div className="space-y-0.5 mt-1">
                  <p className="text-[10px] font-medium text-muted-foreground">Todavía falta confirmar:</p>
                  {route.missing.map((m, i) => (
                    <p key={i} className="text-[10px] text-amber-600 dark:text-amber-400">○ {m}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* 2. MISSING INFO */}
        {missingInfo.length > 0 && (
          <Card className="border-amber-500/20">
            <CardHeader className="pb-1.5 pt-3 px-4">
              <CardTitle className="text-[11px] uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5" /> Próximo objetivo de descubrimiento
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1.5">
              {missingInfo.map((info, i) => (
                <p key={i} className="text-[11px] text-foreground leading-snug flex items-start gap-1.5">
                  <span className="text-amber-500 mt-px">○</span> {info}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 3. OBJECTIONS */}
        {objections.length > 0 && (
          <Card className="border-destructive/15">
            <CardHeader className="pb-1.5 pt-3 px-4">
              <CardTitle className="text-[11px] uppercase tracking-wider text-destructive flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Objeciones emergentes
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              {objections.map((o, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[11px] font-medium text-foreground flex-1">{o.hypothesis}</p>
                    <ObjLevel value={o.confidence} />
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {humanizeObjectionTrigger(o.trigger)}
                  </p>
                  <div className="rounded bg-primary/5 px-2.5 py-1.5 mt-1">
                    <p className="text-[10px] text-primary leading-relaxed">
                      <Compass className="h-2.5 w-2.5 inline mr-1 -mt-px" />
                      {o.suggested_response}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* 4. SIGNALS */}
        {(pain_signals.length > 0 || profile.signals.length > 0) && (
          <Card>
            <CardHeader className="pb-1.5 pt-3 px-4">
              <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Radar className="h-3.5 w-3.5" /> Señales detectadas
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1.5">
              {pain_signals.map((s, i) => (
                <p key={`p-${i}`} className="text-[11px] text-foreground leading-snug flex items-start gap-1.5">
                  <span className="text-primary font-bold mt-px">→</span>
                  <span>{s.signal}</span>
                </p>
              ))}
              {profile.signals
                .filter(s => !pain_signals.some(ps => ps.source === s))
                .map(s => (
                  <p key={s} className="text-[11px] text-foreground leading-snug flex items-start gap-1.5">
                    <span className="text-primary font-bold mt-px">→</span>
                    <span>{SIGNAL_LABELS[s] ?? s}</span>
                  </p>
                ))}
            </CardContent>
          </Card>
        )}

        {/* 5. PROFILE (last — least urgent) */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-1.5 pt-3 px-4">
            <CardTitle className="text-[11px] uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <User2 className="h-3.5 w-3.5" /> Perfil del lead
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-3">
            <div className="grid grid-cols-1 gap-1.5 text-xs">
              <ProfileRow label="Tipo" value={label(ORG_TYPE_LABELS, profile.organization_type)} />
              <ProfileRow label="Escala" value={label(SCALE_LABELS, profile.scale)} />
              <ProfileRow label="Comercialización" value={label(COMMERCIALIZATION_LABELS, profile.commercialization_model)} />
              <ProfileRow
                label="Presión regulatoria"
                value={
                  profile.signals.includes('eudr_pressure') ? 'EUDR activa' :
                    profile.signals.includes('compliance_urgency') ? 'Alta' : '—'
                }
                highlight={profile.signals.includes('compliance_urgency') || profile.signals.includes('eudr_pressure')}
              />
              <ProfileRow label="Madurez digital" value={label(MATURITY_LABELS, maturity_level.level)} />
              <ProfileRow label="Presupuesto" value={label(BUDGET_LABELS, budget)} />
              <ProfileRow label="Urgencia" value={label(TIMELINE_LABELS, timeline)} highlight={timeline === 'immediate'} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollArea>
  );
}

function ProfileRow({ label: lbl, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted-foreground">{lbl}</span>
      <span className={cn('font-medium text-right truncate max-w-[160px]', highlight ? 'text-primary' : 'text-foreground')}>
        {value}
      </span>
    </div>
  );
}
