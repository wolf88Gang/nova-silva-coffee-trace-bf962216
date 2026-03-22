import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Check,
  ChevronDown,
  ChevronUp,
  Crosshair,
  Edit2,
  Eye,
  Loader2,
  MessageSquare,
  Minus,
  Phone,
  Save,
  Shield,
  ShieldAlert,
  Target,
  TrendingDown,
  TrendingUp,
  X,
  Zap,
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
import { Textarea } from '@/components/ui/textarea';
import { SalesSessionService, type SalesSessionSummary } from '@/lib/salesSessionService';
import {
  buildFrictionClusters,
  classifyObjections,
  classifyRecommendations,
  CLIENT_TYPE_LABELS,
  COMMERCIAL_PHASES,
  generateAccountActionBlocks,
  generateAccountPlaybook,
  generateCommercialReading,
  generateHypothesis,
  generateMeetingObjective,
  generateNextAction,
  generateSuggestedPitch,
  READINESS_LABELS,
  SCORE_COMMERCIAL_LABELS,
  type AccountActionBlocks,
  type AccountPlaybook,
  type BattleCard,
  type CommercialHypothesis,
  type FrictionCluster,
  type MeetingObjective,
} from '@/lib/commercialBriefEngine';
import ScoreRadarChart from '@/components/calibration/ScoreRadarChart';
import { cn } from '@/lib/utils';

/* ══════════════════════════════════════════════════
   HOOKS
   ══════════════════════════════════════════════════ */

function useSessionSummary(sessionId: string) {
  return useQuery({
    queryKey: ['sales-session-summary', sessionId],
    queryFn: () => SalesSessionService.getSessionSummary(sessionId),
    staleTime: 1000 * 60 * 2,
  });
}

/* ══════════════════════════════════════════════════
   CONSTANTS
   ══════════════════════════════════════════════════ */

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

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'border-destructive/40 bg-destructive/5',
  medium: 'border-amber-500/30 bg-amber-500/5',
  low: 'border-border bg-card',
};

const CLASSIFICATION_COLORS: Record<string, string> = {
  confirmed: 'border-destructive/30 text-destructive bg-destructive/10',
  declared: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
  inferred: 'border-border text-muted-foreground bg-muted/50',
};

const IMPACT_COLORS: Record<string, string> = {
  blocks_decision: 'text-destructive',
  delays_decision: 'text-amber-600 dark:text-amber-400',
  reduces_ticket: 'text-foreground',
  low_risk: 'text-muted-foreground',
};

const SEVERITY_COLORS: Record<string, string> = {
  alto: 'border-destructive/40 bg-destructive/5',
  medio: 'border-amber-500/30 bg-amber-500/5',
  bajo: 'border-border bg-muted/30',
};

const SEVERITY_BADGE: Record<string, string> = {
  alto: 'border-destructive/30 text-destructive bg-destructive/10',
  medio: 'border-amber-500/30 text-amber-600 dark:text-amber-400 bg-amber-500/10',
  bajo: 'border-border text-muted-foreground bg-muted/50',
};

/* ══════════════════════════════════════════════════
   FULL BATTLE MODE (overlay per objection)
   ══════════════════════════════════════════════════ */

function FullBattleMode({ card, onClose }: { card: BattleCard; onClose: () => void }) {
  const [sellerResponse, setSellerResponse] = useState('');
  const [followUpNotes, setFollowUpNotes] = useState('');
  const [status, setStatus] = useState<'pending' | 'in_progress' | 'resolved'>(card.status);

  const statusLabels = { pending: 'Pendiente', in_progress: 'En progreso', resolved: 'Resuelta' };
  const statusColors = {
    pending: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    in_progress: 'bg-primary/10 text-primary border-primary/30',
    resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> {card.label}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <Badge variant="outline" className={cn('text-xs', CLASSIFICATION_COLORS[card.classification])}>{card.classificationLabel}</Badge>
              <Badge variant="outline" className={cn('text-xs', statusColors[status])}>{statusLabels[status]}</Badge>
              <span className={cn('text-xs font-medium', IMPACT_COLORS[card.impact])}>{card.impactLabel}</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}><X className="h-5 w-5" /></Button>
        </div>

        <Separator />

        {/* BLOCK 1: Qué responder ahora — MOST PROMINENT */}
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader className="pb-2 pt-5 px-6">
            <CardTitle className="text-base flex items-center gap-2 text-primary">
              <Crosshair className="h-4.5 w-4.5" /> Qué responder al cliente ahora
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-5 space-y-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-1.5">Respuesta corta para llamada</p>
              <p className="text-base text-foreground leading-relaxed italic">{card.shortScript}</p>
            </div>
            <Separator className="opacity-30" />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary/70 mb-1.5">Respuesta desarrollada para reunión</p>
              <p className="text-sm text-foreground leading-relaxed italic">{card.fullScript}</p>
            </div>
          </CardContent>
        </Card>

        {/* BLOCK 2: Si insiste */}
        <Card className="border-amber-500/20 bg-amber-500/5">
          <CardHeader className="pb-2 pt-4 px-6">
            <CardTitle className="text-sm flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <ArrowRightIcon className="h-4 w-4" /> Si el cliente insiste, segunda línea de respuesta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <p className="text-sm text-foreground leading-relaxed italic">{card.secondResponse}</p>
          </CardContent>
        </Card>

        {/* BLOCK 3: Cómo reposicionar Nova Silva */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-6">
            <CardTitle className="text-sm">Cómo reposicionar Nova Silva frente a esta objeción</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4 space-y-2">
            <p className="text-xs text-muted-foreground mb-1">Objetivo del vendedor:</p>
            <p className="text-sm text-foreground leading-relaxed font-medium">{card.sellerObjective}</p>
            <Separator className="my-2 opacity-30" />
            <p className="text-xs text-muted-foreground mb-1">Ángulo Nova Silva:</p>
            <p className="text-sm text-foreground leading-relaxed">{card.novaSilvaAngle}</p>
          </CardContent>
        </Card>

        {/* BLOCK 4 & 5: Arguments + Proof side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-sm">Argumentos fuertes</CardTitle></CardHeader>
            <CardContent className="px-5 pb-4 space-y-1.5">
              {card.strongArguments.map((arg, i) => (
                <p key={i} className="text-xs text-foreground leading-relaxed flex items-start gap-1.5">
                  <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {arg}
                </p>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-5"><CardTitle className="text-sm">Evidencia / material a preparar</CardTitle></CardHeader>
            <CardContent className="px-5 pb-4 space-y-1.5">
              {card.proofAssets.map((p, i) => (
                <p key={i} className="text-xs text-foreground leading-relaxed flex items-start gap-1.5">
                  <Eye className="h-3 w-3 text-muted-foreground mt-0.5 shrink-0" /> {p}
                </p>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* BLOCK 6: Tactical question */}
        <Card className="border-primary/15">
          <CardHeader className="pb-2 pt-4 px-6">
            <CardTitle className="text-sm text-primary">Pregunta táctica para avanzar</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-4">
            <p className="text-base text-foreground leading-relaxed italic">{card.tacticalQuestion}</p>
          </CardContent>
        </Card>

        {/* BLOCK 7: Qué NO decir */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2 pt-4 px-6"><CardTitle className="text-sm text-destructive">Qué NO decir</CardTitle></CardHeader>
          <CardContent className="px-6 pb-4 space-y-1">
            {card.doNot.map((d, i) => (
              <p key={i} className="text-sm text-foreground leading-relaxed flex items-start gap-1.5">
                <X className="h-3 w-3 text-destructive mt-0.5 shrink-0" /> {d}
              </p>
            ))}
          </CardContent>
        </Card>

        {/* BLOCK 8: Meaning + Variations + Escalation — lower weight */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs text-muted-foreground">Qué significa realmente</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4"><p className="text-xs text-foreground leading-relaxed">{card.realMeaning}</p></CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs text-muted-foreground">Cómo puede sonar del cliente</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4 space-y-0.5">
              {card.clientVariations.length > 0 ? card.clientVariations.map((v, i) => (
                <p key={i} className="text-xs text-foreground italic">{v}</p>
              )) : <p className="text-xs text-muted-foreground">—</p>}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4"><CardTitle className="text-xs text-muted-foreground">Si no se resuelve hoy</CardTitle></CardHeader>
            <CardContent className="px-4 pb-4"><p className="text-xs text-foreground leading-relaxed">{card.escalationPath}</p></CardContent>
          </Card>
        </div>

        {/* Follow-up draft */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-6"><CardTitle className="text-sm">Mensaje de follow-up sugerido</CardTitle></CardHeader>
          <CardContent className="px-6 pb-4">
            <p className="text-xs text-foreground leading-relaxed bg-muted/50 rounded-md px-4 py-3 italic">{card.followUpDraft}</p>
          </CardContent>
        </Card>

        <Separator />

        {/* Seller editable — persistence-ready */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Respuesta refinada del vendedor</Label>
            <Textarea value={sellerResponse} onChange={(e) => setSellerResponse(e.target.value)} placeholder="Escribe tu versión personalizada del script de respuesta..." className="min-h-[80px]" />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Notas de follow-up</Label>
            <Textarea value={followUpNotes} onChange={(e) => setFollowUpNotes(e.target.value)} placeholder="Qué validar, con quién hablar, qué preparar..." className="min-h-[60px]" />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold shrink-0">Estado:</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="resolved">Resuelta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} className="gap-1.5"><Check className="h-4 w-4" /> Cerrar batalla</Button>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MEETING MODE — focused, large-type, minimal
   ══════════════════════════════════════════════════ */

function MeetingMode({
  cards,
  hypothesis,
  playbook,
  onExit,
}: {
  cards: BattleCard[];
  hypothesis: CommercialHypothesis;
  playbook: AccountPlaybook;
  onExit: () => void;
}) {
  const topCards = cards.filter(c => c.priority === 'critical').slice(0, 2);
  const fallback = topCards.length === 0 ? cards.slice(0, 2) : topCards;

  return (
    <div className="fixed inset-0 z-[100] bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> Modo reunión activa
          </h2>
          <Button variant="outline" size="sm" onClick={onExit} className="gap-1.5"><X className="h-3.5 w-3.5" /> Salir</Button>
        </div>

        {/* Account thesis — large */}
        <p className="text-xl font-semibold text-foreground leading-snug tracking-tight">{hypothesis.paragraph}</p>

        <Separator />

        {/* Top objection clusters with scripts */}
        {fallback.length === 0 ? (
          <p className="text-base text-muted-foreground text-center py-8">Sin objeciones activas para esta sesión.</p>
        ) : (
          fallback.map((card, i) => (
            <div key={i} className="space-y-4">
              <div>
                <Badge variant="outline" className={cn('text-xs mb-1', CLASSIFICATION_COLORS[card.classification])}>{card.classificationLabel}</Badge>
                <h3 className="text-lg font-bold text-foreground">{card.label}</h3>
              </div>
              <div className="rounded-lg border border-primary/20 bg-primary/5 px-5 py-4">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-2">Respuesta rápida</p>
                <p className="text-base text-foreground leading-relaxed italic">{card.shortScript}</p>
              </div>
              <div className="rounded-lg border border-border px-5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Argumento fuerte</p>
                <div className="space-y-1">
                  {card.strongArguments.slice(0, 2).map((a, j) => (
                    <p key={j} className="text-sm text-foreground leading-relaxed flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {a}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-destructive/20 bg-destructive/5 px-5 py-3">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">No decir</p>
                <div className="space-y-0.5">
                  {card.doNot.slice(0, 2).map((d, j) => (
                    <p key={j} className="text-sm text-foreground leading-relaxed">{d}</p>
                  ))}
                </div>
              </div>
              {i < fallback.length - 1 && <Separator />}
            </div>
          ))
        )}

        <Separator />

        {/* Best next question */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Pregunta clave para esta reunión</p>
          <p className="text-lg font-semibold text-primary leading-snug">"{playbook.bestNextQuestion}"</p>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════
   MAIN PAGE
   ══════════════════════════════════════════════════ */

export default function SalesSessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useSessionSummary(sessionId!);

  const [editing, setEditing] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [showScores, setShowScores] = useState(false);
  const [battleCard, setBattleCard] = useState<BattleCard | null>(null);
  const [meetingMode, setMeetingMode] = useState(false);
  // Persistence-ready: phase selection should save to sales_session_phase_updates
  const [selectedPhase, setSelectedPhase] = useState<string | null>(null);
  const [phaseNote, setPhaseNote] = useState('');

  const session = data?.session ?? null;
  const existingOutcome = data?.outcome ?? null;

  const reading = useMemo(() => data ? generateCommercialReading(data) : null, [data]);
  const nextAction = useMemo(() => (data && reading) ? generateNextAction(data, reading) : null, [data, reading]);
  const pitch = useMemo(() => data ? generateSuggestedPitch(data) : null, [data]);
  const battleCards = useMemo(() => data ? classifyObjections(data) : [], [data]);
  const clusters = useMemo(() => buildFrictionClusters(battleCards), [battleCards]);
  const hypothesis = useMemo(() => (data && reading) ? generateHypothesis(data, reading, clusters) : null, [data, reading, clusters]);
  const playbook = useMemo(() => (data && reading && pitch) ? generateAccountPlaybook(data, reading, pitch, clusters) : null, [data, reading, pitch, clusters]);
  const meetingObj = useMemo(() => (reading) ? generateMeetingObjective(reading, clusters) : null, [reading, clusters]);
  const classifiedRecs = useMemo(() => data ? classifyRecommendations(data) : [], [data]);
  const readinessInfo = reading ? READINESS_LABELS[reading.readinessLevel] : null;

  useEffect(() => {
    setOutcome(existingOutcome?.outcome ?? '');
    setDealValue(existingOutcome?.deal_value?.toString() ?? '');
  }, [existingOutcome]);

  // Initialize selected phase from readiness
  useEffect(() => {
    if (selectedPhase === null && reading) {
      const map: Record<string, string> = {
        ready_proposal: 'proposal',
        ready_discovery: 'discovery',
        ready_negotiation: 'negotiation',
        nurture: 'follow_up',
        immature: 'hold',
      };
      setSelectedPhase(map[reading.readinessLevel] ?? null);
    }
  }, [reading, selectedPhase]);

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

  /* ── Loading / Error / Empty ── */

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto space-y-4 p-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-5xl mx-auto p-4">
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
      <div className="max-w-5xl mx-auto p-4">
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Sesión no encontrada</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/admin/sales')}>Volver a sesiones</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  /* ── Overlay modes ── */
  if (battleCard) return createPortal(<FullBattleMode card={battleCard} onClose={() => setBattleCard(null)} />, document.body);
  if (meetingMode && hypothesis && playbook) return createPortal(<MeetingMode cards={battleCards} hypothesis={hypothesis} playbook={playbook} onExit={() => setMeetingMode(false)} />, document.body);

  const hasOutcome = Boolean(existingOutcome);
  const clientType = session.lead_type ? (CLIENT_TYPE_LABELS[session.lead_type] ?? session.lead_type) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 p-4">

      {/* ═══ HEADER — work unit strip ═══ */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/sales')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-foreground truncate">
              {session.lead_company || session.lead_name || 'Sesión comercial'}
            </h1>
            <p className="text-xs text-muted-foreground">
              {clientType ? `${clientType} · ` : ''}
              {new Date(session.created_at).toLocaleDateString('es')}
              {session.lead_name && session.lead_company ? ` · ${session.lead_name}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {battleCards.length > 0 && (
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => setMeetingMode(true)}>
                <Phone className="h-3.5 w-3.5" /> Modo reunión
              </Button>
            )}
            {readinessInfo && (
              <Badge variant="outline" className={cn('text-xs font-semibold', readinessInfo.color)}>{readinessInfo.label}</Badge>
            )}
          </div>
        </div>
        {/* Work unit metadata strip */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground px-1 flex-wrap">
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" /> Estado: <span className="font-medium text-foreground">{session.status === 'completed' ? 'Diagnóstico completado' : session.status === 'in_progress' ? 'En progreso' : session.status === 'draft' ? 'Borrador' : session.status ?? 'Pendiente'}</span>
          </span>
          {session.commercial_stage && (
            <span>Fase: <span className="font-medium text-foreground capitalize">{session.commercial_stage}</span></span>
          )}
          {session.updated_at && (
            <span>Última actividad: <span className="font-medium text-foreground">{new Date(session.updated_at).toLocaleDateString('es')}</span></span>
          )}
          {/* Persistence-ready: owner would come from sales_sessions.owner_user_id */}
          <span className="text-[10px] text-muted-foreground/60">
            ID: {session.id.slice(0, 8)}
          </span>
        </div>
      </div>

      {/* ═══ SECTION 1: RESUMEN ESTRATÉGICO ═══ */}
      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
            <Target className="h-4 w-4" /> Resumen estratégico de la cuenta
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-4">
          {/* A: Lectura ejecutiva */}
          {reading && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Lectura ejecutiva Nova Silva</p>
              {reading.bullets.map((b, i) => (
                <p key={i} className="text-[13px] text-foreground leading-relaxed flex items-start gap-2">
                  <span className="text-primary mt-0.5 shrink-0">→</span><span>{b}</span>
                </p>
              ))}
            </div>
          )}

          {/* B: Hipótesis comercial */}
          {hypothesis && (
            <div className="rounded-md bg-muted/50 border border-border px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hipótesis comercial central</p>
              <p className="text-sm text-foreground leading-relaxed">{hypothesis.paragraph}</p>
            </div>
          )}

          {/* C+D: Strategy + Objective in two cols */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {readinessInfo && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Estrategia sugerida</p>
                <p className={cn('text-sm font-semibold', readinessInfo.color)}>{readinessInfo.label}</p>
              </div>
            )}
            {meetingObj && (
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Objetivo próxima reunión</p>
                <p className="text-sm text-foreground">{meetingObj.objective}</p>
              </div>
            )}
          </div>

          {/* E: Material recomendado */}
          {nextAction && nextAction.materials.length > 0 && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Material recomendado</p>
              <div className="flex flex-wrap gap-1.5">
                {nextAction.materials.map((m, i) => (
                  <Badge key={i} variant="outline" className="text-[11px] font-normal">{m}</Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ═══ TWO COLUMN: Action + Pitch ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {nextAction && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <ArrowRightIcon className="h-4 w-4 text-primary" /> Qué hacer ahora
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-3">
              <p className="text-sm font-semibold text-foreground">{nextAction.action}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{nextAction.why}</p>
              {nextAction.validate.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Validar en próxima reunión</p>
                  {nextAction.validate.map((v, i) => (
                    <p key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <Eye className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" /> {v}
                    </p>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {pitch && (
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" /> Enfoque de conversación
              </CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4 space-y-2">
              <p className="text-sm font-semibold text-foreground">{pitch.angle}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{pitch.reasoning}</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ═══ SECTION 3: ACCOUNT BATTLE PLAN ═══ */}
      {playbook && (
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-primary" /> Plan de batalla de esta cuenta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Secuencia recomendada</p>
                <ol className="space-y-1">
                  {playbook.sequence.map((step, i) => (
                    <li key={i} className="text-xs text-foreground flex items-start gap-2">
                      <span className="text-primary font-bold shrink-0">{i + 1}.</span><span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
              <div className="space-y-3">
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-1">Riesgo mayor de perder la venta</p>
                  <p className="text-xs text-foreground leading-relaxed">{playbook.biggestRisk}</p>
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1">Cómo reducir ese riesgo</p>
                  {playbook.riskMitigation.map((m, i) => (
                    <p key={i} className="text-xs text-foreground flex items-start gap-1.5">
                      <Check className="h-3 w-3 text-primary mt-0.5 shrink-0" /> {m}
                    </p>
                  ))}
                </div>
              </div>
            </div>
            <div className="rounded-md bg-primary/5 border border-primary/10 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Pregunta clave para la próxima interacción</p>
              <p className="text-sm text-foreground italic">"{playbook.bestNextQuestion}"</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ SECTION 4: FRICTION MAP (clusters) ═══ */}
      {clusters.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5 px-1">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Mapa de fricción comercial
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {clusters.map(cluster => (
              <div key={cluster.key} className={cn('rounded-lg border p-4 space-y-3', SEVERITY_COLORS[cluster.severity])}>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{cluster.label}</p>
                  <Badge variant="outline" className={cn('text-[10px]', SEVERITY_BADGE[cluster.severity])}>{cluster.severity.charAt(0).toUpperCase() + cluster.severity.slice(1)}</Badge>
                  <span className="text-[10px] text-muted-foreground">{cluster.cards.length} señal{cluster.cards.length !== 1 ? 'es' : ''}</span>
                </div>
                <p className="text-xs text-foreground leading-relaxed">{cluster.meaning}</p>
                <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-0.5">Cómo vender aquí</p>
                  <p className="text-xs text-foreground leading-relaxed">{cluster.sellerStance}</p>
                </div>

                {/* Individual battle cards within cluster — compact */}
                <div className="space-y-2 pt-1">
                  {cluster.cards.map((card, ci) => (
                    <div key={ci} className="flex items-center justify-between gap-2 rounded-md border border-border bg-background px-3 py-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <Badge variant="outline" className={cn('text-[9px] shrink-0', CLASSIFICATION_COLORS[card.classification])}>{card.classificationLabel}</Badge>
                        <span className="text-xs font-medium text-foreground truncate">{card.label}</span>
                        <span className={cn('text-[10px]', IMPACT_COLORS[card.impact])}>{card.impactLabel}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-[11px] gap-1 shrink-0" onClick={() => setBattleCard(card)}>
                        <Shield className="h-3 w-3" /> Batalla
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ═══ SCORES — collapsible with radar ═══ */}
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <ScoreRadarChart
                  scores={{
                    pain: session.score_pain as number | null,
                    maturity: session.score_maturity as number | null,
                    urgency: session.score_urgency as number | null,
                    fit: session.score_fit as number | null,
                    budget_readiness: session.score_budget_readiness as number | null,
                    objection: session.score_objection as number | null,
                  }}
                  height={220}
                />
                <div className="grid grid-cols-3 gap-2 text-center">
                  {SCORE_KEYS.map(({ key, short }) => {
                    const value = session[key as keyof typeof session] as number | null;
                    const isStrong = value != null && value >= 7;
                    const isWeak = value != null && value < 4 && value > 0;
                    return (
                      <div key={key} className="rounded-md bg-muted/50 py-2">
                        <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{SCORE_COMMERCIAL_LABELS[key] ?? short}</p>
                        <p className={cn('text-lg font-bold font-mono', scoreColor(value))}>{value ?? '—'}</p>
                        {isStrong && <p className="text-[9px] text-primary">Fuerte</p>}
                        {isWeak && <p className="text-[9px] text-destructive">Débil</p>}
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ═══ NEXT PHASE + OUTCOME ═══ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Next phase — interactive */}
        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm">Siguiente fase comercial</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              {readinessInfo
                ? `Basado en el diagnóstico, este lead está: ${readinessInfo.label}.`
                : 'Completa el diagnóstico para obtener una recomendación.'}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {COMMERCIAL_PHASES.map(phase => {
                const isRecommended =
                  (reading?.readinessLevel === 'ready_proposal' && phase.value === 'proposal') ||
                  (reading?.readinessLevel === 'ready_discovery' && phase.value === 'discovery') ||
                  (reading?.readinessLevel === 'ready_negotiation' && phase.value === 'negotiation') ||
                  (reading?.readinessLevel === 'nurture' && phase.value === 'follow_up') ||
                  (reading?.readinessLevel === 'immature' && phase.value === 'hold');
                const isSelected = selectedPhase === phase.value;
                return (
                  <button
                    key={phase.value}
                    onClick={() => setSelectedPhase(phase.value)}
                    className={cn(
                      'rounded-md border px-3 py-2 text-xs text-center transition-colors cursor-pointer',
                      isSelected
                        ? 'border-primary bg-primary/10 text-primary font-semibold ring-1 ring-primary/30'
                        : isRecommended
                          ? 'border-primary/30 bg-primary/5 text-primary'
                          : 'border-border text-muted-foreground hover:border-foreground/20',
                    )}
                  >
                    {phase.label}
                    {isRecommended && !isSelected && <span className="block text-[9px] text-primary/60 mt-0.5">Recomendada</span>}
                    {isSelected && <Check className="h-3 w-3 mx-auto mt-0.5" />}
                  </button>
                );
              })}
            </div>
            {/* Persistence-ready: phase note for sales_session_phase_updates */}
            <Textarea
              value={phaseNote}
              onChange={(e) => setPhaseNote(e.target.value)}
              placeholder="Razón o nota sobre la fase seleccionada..."
              className="min-h-[50px] text-xs"
            />
          </CardContent>
        </Card>

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
      </div>
    </div>
  );
}
