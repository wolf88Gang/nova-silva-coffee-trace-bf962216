import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight as ArrowRightIcon,
  Edit2,
  Minus,
  Save,
  ShieldAlert,
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
import { Skeleton } from '@/components/ui/skeleton';
import { SalesSessionService, type SalesSessionSummary } from '@/lib/salesSessionService';
import { cn } from '@/lib/utils';

function useSessionSummary(sessionId: string) {
  return useQuery({
    queryKey: ['sales-session-summary', sessionId],
    queryFn: () => SalesSessionService.getSessionSummary(sessionId),
    staleTime: 1000 * 60 * 2,
  });
}

const SCORE_KEYS = [
  { key: 'score_pain', label: 'Pain' },
  { key: 'score_maturity', label: 'Maturity' },
  { key: 'score_urgency', label: 'Urgency' },
  { key: 'score_fit', label: 'Fit' },
  { key: 'score_budget_readiness', label: 'Budget' },
  { key: 'score_objection', label: 'Objection' },
] as const;

function scoreColor(value: number | null): string {
  if (value == null) return 'text-muted-foreground';
  if (value >= 7) return 'text-primary';
  if (value >= 4) return 'text-foreground';
  return 'text-destructive';
}

export default function SalesSessionDetail() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, isError, error } = useSessionSummary(sessionId!);

  const [editing, setEditing] = useState(false);
  const [outcome, setOutcome] = useState('');
  const [dealValue, setDealValue] = useState('');

  const session = data?.session ?? null;
  const existingOutcome = data?.outcome ?? null;

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
      <div className="max-w-3xl mx-auto space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-3xl mx-auto">
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
      <div className="max-w-3xl mx-auto">
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
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/sales')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-xl font-bold text-foreground">{session.lead_company || session.lead_name || 'Sesión comercial'}</h1>
          <p className="text-xs text-muted-foreground">
            {session.lead_type || 'Sin tipo'} · {new Date(session.created_at).toLocaleDateString('es')}
            {session.lead_name ? ` · ${session.lead_name}` : ''}
            {session.commercial_stage ? ` · ${session.commercial_stage}` : ''}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Score total</CardTitle>
            <span className={cn('text-2xl font-bold font-mono', scoreColor(session.score_total))}>{session.score_total ?? '—'}</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6">
            {SCORE_KEYS.map(({ key, label }) => {
              const value = session[key as keyof typeof session] as number | null;
              return (
                <div key={key} className="rounded-md bg-muted/50 py-2.5">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
                  <p className={cn('text-lg font-bold font-mono', scoreColor(value))}>{value ?? '—'}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5 text-primary" /> Bloqueadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.objections.length ? (
            <div className="space-y-2">
              {data.objections.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">{item.objection_type}</Badge>
                  {item.confidence != null && <span className="shrink-0 text-[10px] font-mono text-muted-foreground">{Math.round(item.confidence * 100)}%</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin bloqueadores registrados.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-1.5">
            <ArrowRightIcon className="h-3.5 w-3.5 text-primary" /> Próximos pasos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {data?.recommendations.length ? (
            <div className="space-y-2">
              {data.recommendations.map((item) => (
                <div key={item.id} className="flex items-start gap-2 text-sm">
                  <Badge variant="outline" className="mt-0.5 shrink-0 text-[10px]">{item.recommendation_type}</Badge>
                  {item.priority != null && <span className="shrink-0 text-[10px] font-mono text-muted-foreground">P{item.priority}</span>}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin recomendaciones registradas.</p>
          )}
        </CardContent>
      </Card>

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
                {existingOutcome?.outcome === 'won' && <Badge className="border-primary/30 bg-primary/10 text-primary"><TrendingUp className="mr-1 h-3 w-3" /> Won</Badge>}
                {existingOutcome?.outcome === 'lost' && <Badge variant="destructive" className="gap-1"><TrendingDown className="h-3 w-3" /> Lost</Badge>}
                {existingOutcome?.outcome === 'no_decision' && <Badge variant="secondary" className="gap-1"><Minus className="h-3 w-3" /> No decision</Badge>}
              </div>
              {existingOutcome?.deal_value != null && existingOutcome.deal_value > 0 && (
                <p className="text-sm text-muted-foreground">Deal value: <span className="font-medium font-mono text-foreground">${existingOutcome.deal_value.toLocaleString()}</span></p>
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
                <div className="space-y-1.5">
                  <Label className="text-xs">Deal value ($)</Label>
                  <Input type="number" value={dealValue} onChange={(event) => setDealValue(event.target.value)} placeholder="0" />
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
  );
}
