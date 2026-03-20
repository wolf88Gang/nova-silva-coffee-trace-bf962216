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
  Sparkles,
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
  classifyObjections,
  classifyRecommendations,
  CLIENT_TYPE_LABELS,
  COMMERCIAL_PHASES,
  generateCommercialReading,
  generateNextAction,
  generateSuggestedPitch,
  READINESS_LABELS,
  SCORE_COMMERCIAL_LABELS,
  type BattleCard,
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

/* ── Battle Card (always visible, structured) ── */
function BattleCardComponent({ card, onOpenFull }: { card: BattleCard; onOpenFull: () => void }) {
  return (
    <div className={cn('rounded-lg border p-4 space-y-3', PRIORITY_COLORS[card.priority])}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-foreground">{card.label}</p>
            <Badge variant="outline" className={cn('text-[10px] shrink-0', CLASSIFICATION_COLORS[card.classification])}>
              {card.classificationLabel}
            </Badge>
            <Badge variant="outline" className="text-[10px] shrink-0 border-border">
              {card.priorityLabel}
            </Badge>
          </div>
          <p className={cn('text-[11px] mt-0.5 font-medium', IMPACT_COLORS[card.impact])}>
            {card.impactLabel}
          </p>
        </div>
      </div>

      {/* What it really means */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Qué significa realmente</p>
        <p className="text-xs text-foreground leading-relaxed">{card.realMeaning}</p>
      </div>

      {/* Evidence */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Evidencia</p>
        <p className="text-[11px] text-muted-foreground">{card.evidence}</p>
      </div>

      {/* Response script */}
      <div className="rounded-md bg-primary/5 border border-primary/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
          <Crosshair className="h-3 w-3" /> Cómo responder
        </p>
        <p className="text-xs text-foreground leading-relaxed italic">{card.responseScript}</p>
      </div>

      {/* Strong argument */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Argumento fuerte</p>
        <p className="text-xs text-foreground leading-relaxed">{card.strongArgument}</p>
      </div>

      {/* Do NOT */}
      <div className="rounded-md bg-destructive/5 border border-destructive/10 px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-0.5">No hacer</p>
        <p className="text-xs text-foreground leading-relaxed">{card.doNot}</p>
      </div>

      {/* Open full battle mode */}
      <Button variant="outline" size="sm" className="w-full text-xs gap-1.5" onClick={onOpenFull}>
        <Shield className="h-3 w-3" /> Abrir modo batalla completo
      </Button>
    </div>
  );
}

/* ── Full Battle Mode (overlay) ── */
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
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" /> {card.label}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={cn('text-xs', CLASSIFICATION_COLORS[card.classification])}>
                {card.classificationLabel}
              </Badge>
              <Badge variant="outline" className={cn('text-xs', statusColors[status])}>
                {statusLabels[status]}
              </Badge>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        <Separator />

        {/* Impact + meaning */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm">Qué significa realmente</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-sm text-foreground leading-relaxed">{card.realMeaning}</p>
              <p className={cn('text-xs font-medium mt-2', IMPACT_COLORS[card.impact])}>{card.impactLabel}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-5">
              <CardTitle className="text-sm">Evidencia</CardTitle>
            </CardHeader>
            <CardContent className="px-5 pb-4">
              <p className="text-sm text-muted-foreground">{card.evidence}</p>
              <p className="text-xs text-muted-foreground mt-2">Confianza: {Math.round(card.confidence * 100)}%</p>
            </CardContent>
          </Card>
        </div>

        {/* Response script - prominent */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm flex items-center gap-1.5 text-primary">
              <Crosshair className="h-4 w-4" /> Script de respuesta
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-sm text-foreground leading-relaxed italic">{card.responseScript}</p>
          </CardContent>
        </Card>

        {/* Three columns: argument, proof, validate */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs">Argumento fuerte</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-foreground leading-relaxed">{card.strongArgument}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs">Prueba / evidencia a usar</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-foreground leading-relaxed">{card.proofToUse}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs">Validar en próxima interacción</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-xs text-foreground leading-relaxed">{card.validateNext}</p>
            </CardContent>
          </Card>
        </div>

        {/* Do NOT */}
        <Card className="border-destructive/20 bg-destructive/5">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm text-destructive">Qué NO hacer</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-sm text-foreground leading-relaxed">{card.doNot}</p>
          </CardContent>
        </Card>

        <Separator />

        {/* Seller editable fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Respuesta refinada del vendedor</Label>
            <Textarea
              value={sellerResponse}
              onChange={(e) => setSellerResponse(e.target.value)}
              placeholder="Escribe tu versión personalizada del script de respuesta..."
              className="min-h-[80px]"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-semibold">Notas de follow-up</Label>
            <Textarea
              value={followUpNotes}
              onChange={(e) => setFollowUpNotes(e.target.value)}
              placeholder="Qué validar, con quién hablar, qué preparar..."
              className="min-h-[60px]"
            />
          </div>
          <div className="flex items-center gap-3">
            <Label className="text-sm font-semibold shrink-0">Estado:</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as typeof status)}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="in_progress">En progreso</SelectItem>
                <SelectItem value="resolved">Resuelta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} className="gap-1.5">
            <Check className="h-4 w-4" /> Cerrar batalla
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ── Meeting Mode ── */
function MeetingMode({ cards, onExit }: { cards: BattleCard[]; onExit: () => void }) {
  const topCards = cards.filter(c => c.priority === 'critical').slice(0, 2);
  const fallback = topCards.length === 0 ? cards.slice(0, 2) : topCards;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <Phone className="h-5 w-5 text-primary" /> Modo llamada / reunión
          </h2>
          <Button variant="outline" size="sm" onClick={onExit} className="gap-1.5">
            <X className="h-3.5 w-3.5" /> Salir
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Top objeciones activas con scripts de respuesta rápida. Sin ruido.
        </p>
        <Separator />
        {fallback.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-8 text-center">
              <p className="text-sm text-muted-foreground">No hay objeciones detectadas para esta sesión.</p>
            </CardContent>
          </Card>
        ) : (
          fallback.map((card, i) => (
            <div key={i} className="space-y-3">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn('text-xs', CLASSIFICATION_COLORS[card.classification])}>
                  {card.classificationLabel}
                </Badge>
                <h3 className="text-sm font-bold text-foreground">{card.label}</h3>
              </div>
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3 px-4">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-primary mb-1">Script de respuesta</p>
                  <p className="text-sm text-foreground leading-relaxed italic">{card.responseScript}</p>
                </CardContent>
              </Card>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-md border border-border px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-0.5">Argumento fuerte</p>
                  <p className="text-xs text-foreground leading-relaxed">{card.strongArgument}</p>
                </div>
                <div className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-destructive mb-0.5">No hacer</p>
                  <p className="text-xs text-foreground leading-relaxed">{card.doNot}</p>
                </div>
              </div>
              {i < fallback.length - 1 && <Separator />}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* ── Main Page ── */
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

  const session = data?.session ?? null;
  const existingOutcome = data?.outcome ?? null;

  const reading = useMemo(() => data ? generateCommercialReading(data) : null, [data]);
  const nextAction = useMemo(() => (data && reading) ? generateNextAction(data, reading) : null, [data, reading]);
  const pitch = useMemo(() => data ? generateSuggestedPitch(data) : null, [data]);
  const battleCards = useMemo(() => data ? classifyObjections(data) : [], [data]);
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
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/admin/sales')}>
              Volver a sesiones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (battleCard) {
    return <FullBattleMode card={battleCard} onClose={() => setBattleCard(null)} />;
  }

  if (meetingMode) {
    return <MeetingMode cards={battleCards} onExit={() => setMeetingMode(false)} />;
  }

  const hasOutcome = Boolean(existingOutcome);
  const clientType = session.lead_type ? (CLIENT_TYPE_LABELS[session.lead_type] ?? session.lead_type) : null;

  return (
    <div className="max-w-5xl mx-auto space-y-5 p-4">
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
            <Badge variant="outline" className={cn('text-xs font-semibold', readinessInfo.color)}>
              {readinessInfo.label}
            </Badge>
          )}
        </div>
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

      {/* TWO COLUMN: Action + Pitch */}
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
              {nextAction.materials.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Material recomendado</p>
                  {nextAction.materials.map((m, i) => (
                    <p key={i} className="text-xs text-foreground">• {m}</p>
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

      {/* D. BATTLE CARDS — always visible, no toggles */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4 text-destructive" /> Riesgos y bloqueadores
          </h2>
          {battleCards.length > 0 && (
            <span className="text-[10px] text-muted-foreground">
              {battleCards.filter(c => c.priority === 'critical').length} críticas · {battleCards.length} total
            </span>
          )}
        </div>
        {battleCards.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-4 text-center">
              <p className="text-xs text-muted-foreground">Sin objeciones detectadas en esta sesión.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {battleCards.map((card, i) => (
              <BattleCardComponent key={i} card={card} onOpenFull={() => setBattleCard(card)} />
            ))}
          </div>
        )}
      </div>

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
                  <span className="text-primary font-bold text-xs">{i + 1}.</span>
                  <span className="font-medium text-foreground">{rec.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* SCORES — collapsible */}
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

        <Card>
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm">Siguiente fase comercial</CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-4">
            <p className="text-xs text-muted-foreground mb-3">
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
