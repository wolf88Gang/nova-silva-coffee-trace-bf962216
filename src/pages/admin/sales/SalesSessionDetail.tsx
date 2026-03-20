import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Compass,
  Edit2,
  Eye,
  Loader2,
  MessageSquare,
  Minus,
  Save,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';
import { toast } from 'sonner';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { SalesSessionService, type SalesSessionSummary } from '@/lib/salesSessionService';
import {
  classifyObjections,
  classifyRecommendations,
  COMMERCIAL_PHASES,
  generateCommercialReading,
  generateNextAction,
  generateSuggestedPitch,
  READINESS_LABELS,
  SCORE_COMMERCIAL_LABELS,
  type ClassifiedObjection,
} from '@/lib/commercialBriefEngine';
import { cn } from '@/lib/utils';

function useSessionSummary(sessionId: string) {
  return useQuery({
    queryKey: ['sales-session-summary', sessionId],
    queryFn: () => SalesSessionService.getSessionSummary(sessionId),
    staleTime: 1000 * 60 * 2,
  });
}

const SCORE_KEYS = [
  { key: 'score_pain', short: 'Pain' },
  { key: 'score_maturity', short: 'Madurez' },
  { key: 'score_urgency', short: 'Urgencia' },
  { key: 'score_fit', short: 'Fit' },
  { key: 'score_budget_readiness', short: 'Budget' },
  { key: 'score_objection', short: 'Objeción' },
] as const;

function scoreColor(value: number | null): string {
  if (value == null) return 'text-muted-foreground';
  if (value >= 7) return 'text-primary';
  if (value >= 4) return 'text-foreground';
  return 'text-destructive';
}

function ObjectionCard({ obj }: { obj: ClassifiedObjection }) {
  const [expanded, setExpanded] = useState(false);
  const badgeClass =
    obj.classification === 'confirmed' ? 'border-destructive/30 text-destructive' :
    obj.classification === 'declared' ? 'border-amber-500/30 text-amber-600 dark:text-amber-400' :
    'border-border text-muted-foreground';

  return (
    <div className="rounded-lg border border-border bg-card p-3 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{obj.label}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{obj.why}</p>
        </div>
        <Badge variant="outline" className={cn('text-[10px] shrink-0', badgeClass)}>
          {obj.classificationLabel}
        </Badge>
      </div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[11px] text-primary flex items-center gap-1 hover:underline"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? 'Ocultar guía' : 'Ver guía para el vendedor'}
      </button>
      {expanded && (
        <div className="space-y-2 pt-1 animate-in fade-in-50 slide-in-from-top-1">
          <div className="rounded bg-primary/5 px-3 py-2">
            <p className="text-[10px] font-medium text-primary mb-0.5 flex items-center gap-1">
              <Compass className="h-3 w-3" /> Cómo manejarla
            </p>
            <p className="text-[11px] text-foreground leading-relaxed">{obj.handling}</p>
          </div>
          <div className="rounded bg-destructive/5 px-3 py-2">
            <p className="text-[10px] font-medium text-destructive mb-0.5">No hacer</p>
            <p className="text-[11px] text-foreground leading-relaxed">{obj.doNot}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SalesSessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useSessionSummary(sessionId!);

  const [editing, setEditing] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [showScores, setShowScores] = useState(false);

  const session = data?.session ?? null;
  const existingOutcome = data?.outcome ?? null;

  // Commercial brief computations
  const reading = useMemo(() => data ? generateCommercialReading(data) : null, [data]);
  const nextAction = useMemo(() => (data && reading) ? generateNextAction(data, reading) : null, [data, reading]);
  const pitch = useMemo(() => data ? generateSuggestedPitch(data) : null, [data]);
  const classifiedObjections = useMemo(() => data ? classifyObjections(data) : [], [data]);
  const classifiedRecs = useMemo(() => data ? classifyRecommendations(data) : [], [data]);
  const readinessInfo = reading ? READINESS_LABELS[reading.readinessLevel] : null;

  useEffect(() => {
    setOutcome(existingOutcome?.outcome ?? '');
    setDealValue(existingOutcome?.deal_value?.toString() ?? '');
  }, [existingOutcome]);

  const saveOutcomeMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId || !outcome) throw new Error('Selecciona un outcome');
      await SalesSessionService.saveOutcome({
        sessionId,
        outcome,
        dealValue: outcome === 'won' && dealValue ? Number(dealValue) : null,
      });
    },
    onSuccess: () => {
      toast.success('Resultado guardado');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['sales-session-summary', sessionId] });
    },
    onError: (mutationError: any) => {
      toast.error(mutationError?.message || 'No se pudo guardar el resultado');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <AlertCircle className="h-8 w-8 text-destructive mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">No se pudo cargar la sesión</p>
            <p className="text-xs text-muted-foreground mt-1">{(error as Error)?.message || 'Error desconocido'}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-4xl mx-auto p-4">
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Sesión no encontrada</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/admin/sales')}>
              Volver a sesiones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasOutcome = Boolean(existingOutcome);

  return (
    <div className="max-w-4xl mx-auto space-y-4 p-4">
      {/* HEADER */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/sales')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold text-foreground truncate">
            {session.lead_company || session.lead_name || 'Sesión comercial'}
          </h1>
          <p className="text-xs text-muted-foreground">
            {session.lead_type ? `${session.lead_type} · ` : ''}
            {new Date(session.created_at).toLocaleDateString('es')}
            {session.lead_name ? ` · ${session.lead_name}` : ''}
          </p>
        </div>
        {readinessInfo && (
          <Badge variant="outline" className={cn('text-xs font-semibold', readinessInfo.color)}>
            {readinessInfo.label}
          </Badge>
        )}
      </div>

      {/* A. LECTURA NOVA SILVA */}
      {reading && (
        <Card className="bg-primary/5 border-primary/15">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
              <Sparkles className="h-4 w-4" /> Lectura Nova Silva
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-2">
            {reading.bullets.map((b, i) => (
              <p key={i} className="text-[13px] text-foreground leading-relaxed flex items-start gap-2">
                <span className="text-primary mt-0.5 shrink-0">→</span>
                <span>{b}</span>
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {/* TWO COLUMN LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* B. QUÉ HACER AHORA */}
        {nextAction && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ArrowRightIcon className="h-4 w-4 text-primary" /> Qué hacer ahora
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">{nextAction.action}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{nextAction.why}</p>
              {nextAction.validate.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Validar en próxima reunión</p>
                  {nextAction.validate.map((v, i) => (
                    <p key={i} className="text-[11px] text-foreground flex items-start gap-1.5">
                      <Eye className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" /> {v}
                    </p>
                  ))}
                </div>
              )}
              {nextAction.materials.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Material recomendado</p>
                  {nextAction.materials.map((m, i) => (
                    <p key={i} className="text-[11px] text-foreground">• {m}</p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* C. PITCH SUGERIDO */}
        {pitch && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" /> Enfoque de conversación
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{pitch.angle}</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{pitch.reasoning}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* D. OBJECIONES / RIESGOS */}
      {classifiedObjections.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Riesgos y bloqueadores
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {classifiedObjections.map((obj, i) => (
              <ObjectionCard key={i} obj={obj} />
            ))}
          </div>
        </div>
      )}

      {classifiedObjections.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-4 text-center">
            <p className="text-xs text-muted-foreground">Sin objeciones detectadas en esta sesión.</p>
          </CardContent>
        </Card>
      )}

      {/* E. RECOMENDACIONES */}
      {classifiedRecs.length > 0 && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Check className="h-4 w-4 text-primary" /> Próximos pasos sugeridos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <div className="space-y-2">
              {classifiedRecs.map((rec, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <span className="text-primary font-bold text-xs">
                    {rec.priority != null ? `${i + 1}.` : '•'}
                  </span>
                  <span className="font-medium text-foreground">{rec.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SCORES — collapsible, de-emphasized */}
      <div className="space-y-1">
        <button
          onClick={() => setShowScores(!showScores)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
        >
          {showScores ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          Scores de diagnóstico ({session.score_total ?? '—'} total)
        </button>
        {showScores && (
          <Card className="animate-in fade-in-50 slide-in-from-top-1">
            <CardContent className="py-3 px-5">
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
                {SCORE_KEYS.map(({ key, short }) => {
                  const value = session[key as keyof typeof session] as number | null;
                  return (
                    <div key={key} className="rounded-md bg-muted/50 py-2">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{SCORE_COMMERCIAL_LABELS[key] ?? short}</p>
                      <p className={cn('text-lg font-bold font-mono', scoreColor(value))}>{value ?? '—'}</p>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SIGUIENTE FASE + OUTCOME */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Outcome */}
        <Card className={cn(hasOutcome && !editing ? 'border-primary/20' : '')}>
          <CardHeader className="pb-2 pt-4 px-5">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Resultado comercial</CardTitle>
              {hasOutcome && !editing && (
                <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditing(true)}>
                  <Edit2 className="h-3 w-3" /> Editar
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            {hasOutcome && !editing ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  {existingOutcome?.outcome === 'won' && <Badge className="border-primary/30 bg-primary/10 text-primary"><TrendingUp className="mr-1 h-3 w-3" /> Ganado</Badge>}
                  {existingOutcome?.outcome === 'lost' && <Badge variant="destructive" className="gap-1"><TrendingDown className="h-3 w-3" /> Perdido</Badge>}
                  {existingOutcome?.outcome === 'no_decision' && <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" /> Sin decisión</Badge>}
                </div>
                {existingOutcome?.deal_value != null && existingOutcome.deal_value > 0 && (
                  <p className="text-sm text-muted-foreground">Valor: <span className="font-medium font-mono text-foreground">${existingOutcome.deal_value.toLocaleString()}</span></p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Resultado *</Label>
                  <Select value={outcome} onValueChange={setOutcome}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar resultado" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="won">Ganado</SelectItem>
                      <SelectItem value="lost">Perdido</SelectItem>
                      <SelectItem value="no_decision">Sin decisión</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {outcome === 'won' && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Valor del deal ($)</Label>
                    <Input type="number" value={dealValue} onChange={(e) => setDealValue(e.target.value)} placeholder="0" />
                  </div>
                )}
                <div className="flex justify-end gap-2 pt-1">
                  {editing && <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>}
                  <Button
                    size="sm"
                    disabled={!outcome || saveOutcomeMutation.isPending}
                    onClick={() => saveOutcomeMutation.mutate()}
                    className="gap-1.5"
                  >
                    <Save className="h-3.5 w-3.5" /> {saveOutcomeMutation.isPending ? 'Guardando…' : 'Guardar'}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Siguiente fase */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm">Siguiente fase comercial</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-[11px] text-muted-foreground mb-3">
              {readinessInfo
                ? `Basado en el diagnóstico, este lead está: ${readinessInfo.label}.`
                : 'Completa el diagnóstico para obtener una recomendación.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {COMMERCIAL_PHASES.map(phase => {
                const isRecommended =
                  (reading?.readinessLevel === 'ready_proposal' && phase.value === 'proposal') ||
                  (reading?.readinessLevel === 'ready_demo' && phase.value === 'demo') ||
                  (reading?.readinessLevel === 'ready_pilot' && phase.value === 'pilot') ||
                  (reading?.readinessLevel === 'nurture' && phase.value === 'follow_up') ||
                  (reading?.readinessLevel === 'immature' && phase.value === 'hold');
                return (
                  <div
                    key={phase.value}
                    className={cn(
                      'rounded-md border px-3 py-2 text-xs text-center transition-colors',
                      isRecommended
                        ? 'border-primary bg-primary/10 text-primary font-semibold'
                        : 'border-border text-muted-foreground',
                    )}
                  >
                    {phase.label}
                    {isRecommended && <Check className="h-3 w-3 mx-auto mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
