/**
 * Sales Intelligence — Session Detail + Outcome Capture
 */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, AlertCircle, Target, TrendingUp, TrendingDown, Minus,
  Save, Edit2, ShieldAlert, ArrowRight as ArrowRightIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface SessionData {
  id: string;
  org_name: string | null;
  org_type: string | null;
  contact_name: string | null;
  pain_score: number | null;
  maturity_score: number | null;
  urgency_score: number | null;
  fit_score: number | null;
  budget_readiness_score: number | null;
  total_score: number | null;
  outcome: string | null;
  deal_value: number | null;
  close_date: string | null;
  reason_lost: string | null;
  outcome_notes: string | null;
  created_at: string;
}

interface Objection {
  id: string;
  objection_type: string;
  confidence: number | null;
  detail: string | null;
}

interface Recommendation {
  id: string;
  recommendation_type: string;
  priority: number | null;
  detail: string | null;
}

type BackendStatus = 'available' | 'unavailable';

function useSessionDetail(sessionId: string) {
  return useQuery({
    queryKey: ['sales-session', sessionId],
    queryFn: async (): Promise<{ session: SessionData | null; objections: Objection[]; recommendations: Recommendation[]; status: BackendStatus }> => {
      const { data, error } = await supabase
        .from('sales_sessions' as any)
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return { session: null, objections: [], recommendations: [], status: 'unavailable' };
        }
        if (error.code === 'PGRST116') {
          return { session: null, objections: [], recommendations: [], status: 'available' };
        }
        throw error;
      }

      // Fetch objections
      const { data: objData } = await supabase
        .from('sales_objections' as any)
        .select('id, objection_type, confidence, detail')
        .eq('session_id', sessionId)
        .order('confidence', { ascending: false });

      // Fetch recommendations
      const { data: recData } = await supabase
        .from('sales_recommendations' as any)
        .select('id, recommendation_type, priority, detail')
        .eq('session_id', sessionId)
        .order('priority', { ascending: true });

      return {
        session: data as SessionData,
        objections: (objData as Objection[]) ?? [],
        recommendations: (recData as Recommendation[]) ?? [],
        status: 'available',
      };
    },
    staleTime: 1000 * 60 * 2,
  });
}

const SCORE_KEYS = [
  { key: 'pain_score', label: 'Pain' },
  { key: 'maturity_score', label: 'Maturity' },
  { key: 'urgency_score', label: 'Urgency' },
  { key: 'fit_score', label: 'Fit' },
  { key: 'budget_readiness_score', label: 'Budget' },
] as const;

function scoreColor(v: number | null): string {
  if (v == null) return 'text-muted-foreground';
  if (v >= 7) return 'text-emerald-600 dark:text-emerald-400';
  if (v >= 4) return 'text-amber-600 dark:text-amber-400';
  return 'text-destructive';
}

export default function SalesSessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: result, isLoading, isError } = useSessionDetail(sessionId!);

  const [editing, setEditing] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [dealValue, setDealValue] = useState('');
  const [closeDate, setCloseDate] = useState('');
  const [reasonLost, setReasonLost] = useState('');
  const [outcomeNotes, setOutcomeNotes] = useState('');

  const session = result?.session;

  useEffect(() => {
    if (session) {
      setOutcome(session.outcome ?? '');
      setDealValue(session.deal_value?.toString() ?? '');
      setCloseDate(session.close_date ?? '');
      setReasonLost(session.reason_lost ?? '');
      setOutcomeNotes(session.outcome_notes ?? '');
    }
  }, [session]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload: Record<string, any> = {
        outcome: outcome || null,
        outcome_notes: outcomeNotes.trim() || null,
      };
      if (outcome === 'won') {
        payload.deal_value = dealValue ? parseFloat(dealValue) : null;
        payload.close_date = closeDate || null;
      }
      if (outcome === 'lost') {
        payload.reason_lost = reasonLost.trim() || null;
      }

      const { error } = await supabase
        .from('sales_sessions' as any)
        .update(payload as any)
        .eq('id', sessionId!);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Resultado guardado');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['sales-session', sessionId] });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Error al guardar');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || result?.status === 'unavailable') {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <Target className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Backend no disponible</p>
            <p className="text-xs text-muted-foreground mt-1">La tabla <code className="bg-muted px-1 rounded text-[11px]">sales_sessions</code> no existe</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="max-w-3xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="py-10 text-center">
            <AlertCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">Sesión no encontrada</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => navigate('/admin/sales')}>
              Volver a sesiones
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasOutcome = !!session.outcome;
  const showForm = editing || !hasOutcome;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/sales')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{session.org_name || 'Sin nombre'}</h1>
          <p className="text-xs text-muted-foreground">
            {session.org_type} · {new Date(session.created_at).toLocaleDateString('es')}
            {session.contact_name && ` · ${session.contact_name}`}
          </p>
        </div>
      </div>

      {/* Scores */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Scores</CardTitle>
            <span className={cn('text-2xl font-bold font-mono', scoreColor(session.total_score))}>
              {session.total_score ?? '—'}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2 text-center">
            {SCORE_KEYS.map(({ key, label }) => {
              const val = session[key as keyof SessionData] as number | null;
              return (
                <div key={key} className="bg-muted/50 rounded-md py-2.5">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                  <p className={cn('text-lg font-mono font-bold', scoreColor(val))}>{val ?? '—'}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Bloqueadores (Objections) */}
      {result!.objections.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5 text-destructive" /> Bloqueadores
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result!.objections.map(o => (
                <div key={o.id} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{o.objection_type}</Badge>
                  <span className="text-muted-foreground flex-1">{o.detail || '—'}</span>
                  {o.confidence != null && (
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">{Math.round(o.confidence * 100)}%</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Próximos pasos (Recommendations) */}
      {result!.recommendations.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1.5">
              <ArrowRightIcon className="h-3.5 w-3.5 text-primary" /> Próximos pasos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {result!.recommendations.map(r => (
                <div key={r.id} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="text-[10px] shrink-0 mt-0.5">{r.recommendation_type}</Badge>
                  <span className="text-muted-foreground flex-1">{r.detail || '—'}</span>
                  {r.priority != null && (
                    <span className="text-[10px] text-muted-foreground font-mono shrink-0">P{r.priority}</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outcome Capture */}
      <Card className={cn(hasOutcome && !editing ? 'border-primary/20' : '')}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Resultado comercial</CardTitle>
            {hasOutcome && !editing && (
              <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={() => setEditing(true)}>
                <Edit2 className="h-3 w-3" /> Editar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasOutcome && !editing ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                {session.outcome === 'won' && <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><TrendingUp className="h-3 w-3 mr-1" /> Won</Badge>}
                {session.outcome === 'lost' && <Badge variant="destructive" className="gap-1"><TrendingDown className="h-3 w-3" /> Lost</Badge>}
                {session.outcome === 'no_decision' && <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" /> No decision</Badge>}
              </div>
              {session.deal_value != null && session.deal_value > 0 && (
                <p className="text-sm text-muted-foreground">Deal value: <span className="font-mono font-medium text-foreground">${session.deal_value.toLocaleString()}</span></p>
              )}
              {session.close_date && (
                <p className="text-sm text-muted-foreground">Close date: <span className="font-medium text-foreground">{session.close_date}</span></p>
              )}
              {session.reason_lost && (
                <p className="text-sm text-muted-foreground">Razón: <span className="text-foreground">{session.reason_lost}</span></p>
              )}
              {session.outcome_notes && (
                <p className="text-sm text-muted-foreground">{session.outcome_notes}</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Outcome *</Label>
                <Select value={outcome} onValueChange={setOutcome}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar resultado" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                    <SelectItem value="no_decision">No decision</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {outcome === 'won' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Deal value ($)</Label>
                    <Input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="0" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Close date</Label>
                    <Input type="date" value={closeDate} onChange={e => setCloseDate(e.target.value)} />
                  </div>
                </div>
              )}

              {outcome === 'lost' && (
                <div className="space-y-1.5">
                  <Label className="text-xs">Razón de pérdida *</Label>
                  <Textarea value={reasonLost} onChange={e => setReasonLost(e.target.value)} placeholder="¿Por qué se perdió?" rows={2} />
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs">Notas</Label>
                <Textarea value={outcomeNotes} onChange={e => setOutcomeNotes(e.target.value)} placeholder="Notas adicionales (opcional)" rows={2} />
              </div>

              <div className="flex justify-end gap-2 pt-1">
                {editing && (
                  <Button variant="outline" size="sm" onClick={() => setEditing(false)}>Cancelar</Button>
                )}
                <Button
                  size="sm"
                  disabled={!outcome || (outcome === 'lost' && !reasonLost.trim()) || saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="gap-1.5"
                >
                  <Save className="h-3.5 w-3.5" /> {saveMutation.isPending ? 'Guardando…' : 'Guardar'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
