/**
 * Admin Sales Intelligence — Diagnostic Wizard
 *
 * Routes:
 *   /admin/sales       → Session list + "Nueva evaluación" button
 *   /admin/sales/new   → Wizard: org select → lead info → diagnostic flow → results
 *
 * Debug: emits [Sales DEBUG] lines to browser console at every critical step.
 */
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { SalesSessionService } from '@/modules/sales/SalesSessionService';
import type { FlowState, LoadedQuestion, LoadedOption } from '@/modules/sales/FlowEngine.types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SectionHeader, EmptyState, ErrorState, DataSourceBadge,
} from '@/components/admin/shared/AdminComponents';
import {
  Play, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle,
  BarChart3, Target, Building2, User, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Debug helper ──────────────────────────────────────────────────────────────

function salesDebug(label: string, data?: unknown) {
  if (data !== undefined) {
    console.log(`[Sales DEBUG] ${label}:`, data);
  } else {
    console.log(`[Sales DEBUG] ${label}`);
  }
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type WizardStep = 'list' | 'setup' | 'diagnostic' | 'results';

interface OrgRow { id: string; nombre: string; }

// ─── Main Component ────────────────────────────────────────────────────────────

export default function AdminSales() {
  const [step, setStep] = useState<WizardStep>('list');
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    salesDebug('AdminSales mounted — this is the REAL component from claude/focused-hugle');
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      {step === 'list' && <SessionList onNewSession={() => setStep('setup')} />}
      {step === 'setup' && (
        <SessionSetup
          onCreated={(id) => { setSessionId(id); setStep('diagnostic'); }}
          onBack={() => setStep('list')}
        />
      )}
      {step === 'diagnostic' && sessionId && (
        <DiagnosticWizard
          sessionId={sessionId}
          onComplete={() => setStep('results')}
          onBack={() => setStep('list')}
        />
      )}
      {step === 'results' && sessionId && (
        <SessionResults
          sessionId={sessionId}
          onBack={() => { setSessionId(null); setStep('list'); }}
        />
      )}
    </div>
  );
}

// ─── SESSION LIST ──────────────────────────────────────────────────────────────

function SessionList({ onNewSession }: { onNewSession: () => void }) {
  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['admin', 'sales-sessions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_sessions')
        .select('id, status, commercial_stage, lead_name, lead_company, score_total, created_at, organization_id')
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <>
      <SectionHeader
        title="Sales Intelligence"
        subtitle="Diagnóstico comercial y motor de recomendaciones"
        actions={
          <Button onClick={onNewSession} className="gap-2">
            <Play className="h-4 w-4" /> Nueva evaluación
          </Button>
        }
      />
      <DataSourceBadge source="real" label="Datos en vivo (Supabase)" />

      {isLoading && (
        <div className="space-y-3">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full" />)}
        </div>
      )}
      {error && <ErrorState message={(error as Error).message} />}
      {!isLoading && !error && (!sessions || sessions.length === 0) && (
        <EmptyState
          title="Sin sesiones de diagnóstico"
          description="Pulsa 'Nueva evaluación' para iniciar un diagnóstico comercial."
          icon={Target}
        />
      )}
      {sessions && sessions.length > 0 && (
        <div className="space-y-2">
          {sessions.map(s => (
            <Card key={s.id} className="hover:border-primary/30 transition-colors">
              <CardContent className="py-3 px-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm font-medium">{s.lead_name || s.lead_company || 'Sin nombre'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
                  <Badge variant="outline" className="text-xs capitalize">{s.status}</Badge>
                  <Badge variant="outline" className="text-xs capitalize">{s.commercial_stage}</Badge>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{s.score_total ?? 0}</p>
                  <p className="text-xs text-muted-foreground">Score total</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}

// ─── SESSION SETUP ─────────────────────────────────────────────────────────────

function SessionSetup({ onCreated, onBack }: { onCreated: (id: string) => void; onBack: () => void }) {
  const { user } = useAuth();
  const [orgId, setOrgId] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load organizations from organizaciones (admin-facing table)
  // IDs are synced to organizations table for FK compatibility
  const { data: orgs, isLoading: orgsLoading } = useQuery({
    queryKey: ['admin', 'orgs-for-sales'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizaciones')
        .select('id, nombre')
        .order('nombre');
      if (error) throw error;
      return (data ?? []) as OrgRow[];
    },
  });

  const handleCreate = useCallback(async () => {
    if (!orgId) { setError('Selecciona una organización'); return; }
    setCreating(true);
    setError(null);

    const supabaseUrl = (supabase as any).supabaseUrl ?? 'unknown';
    const sessionUser = user;

    salesDebug('VITE_SUPABASE_URL', supabaseUrl);
    salesDebug('session_user_id', sessionUser?.id ?? null);
    salesDebug('session_user_role', sessionUser?.role ?? null);

    // Debug: check auth state
    try {
      const { data: authDebug, error: authErr } = await supabase.rpc('fn_debug_sales_auth' as any);
      salesDebug('fn_debug_sales_auth', { data: authDebug, error: authErr?.message ?? null });
    } catch (e) {
      salesDebug('fn_debug_sales_auth error (function may not exist)', (e as Error).message);
    }

    // Debug: check auth.uid() directly
    try {
      const { data: { session } } = await supabase.auth.getSession();
      salesDebug('supabase_auth_session', {
        access_token_exists: !!session?.access_token,
        user_id: session?.user?.id ?? null,
        email: session?.user?.email ?? null,
        expires_at: session?.expires_at ?? null,
      });
    } catch (e) {
      salesDebug('supabase_auth_session error', (e as Error).message);
    }

    const payload = {
      organization_id: orgId,
      questionnaire_code: 'nova_sales_intel',
      questionnaire_version: 1,
      lead_name: leadName || undefined,
      lead_company: leadCompany || undefined,
      commercial_stage: 'lead' as const,
      owner_user_id: sessionUser?.id ?? undefined,
    };
    salesDebug('fn_sales_create_session_payload', payload);

    try {
      const result = await SalesSessionService.createSession(payload);
      salesDebug('fn_sales_create_session result', result);
      onCreated(result.session_id);
    } catch (e) {
      const msg = (e as Error).message;
      salesDebug('fn_sales_create_session error', msg);
      setError(msg);
      setCreating(false);
    }
  }, [orgId, leadName, leadCompany, user, onCreated]);

  return (
    <>
      <SectionHeader title="Nueva Evaluación Comercial" subtitle="Configura la sesión de diagnóstico" />
      <Button variant="ghost" onClick={onBack} className="gap-2 mb-4">
        <ArrowLeft className="h-4 w-4" /> Volver
      </Button>

      <Card className="max-w-lg relative z-10">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" /> Datos de la sesión
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Organization */}
          <div className="space-y-2">
            <Label htmlFor="org">Organización *</Label>
            {orgsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <select
                id="org"
                value={orgId}
                onChange={e => setOrgId(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="">Seleccionar organización...</option>
                {orgs?.map(o => (
                  <option key={o.id} value={o.id}>{o.nombre}</option>
                ))}
              </select>
            )}
          </div>

          {/* Lead info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="leadName">Nombre del lead</Label>
              <Input id="leadName" value={leadName} onChange={e => setLeadName(e.target.value)} placeholder="Juan Pérez" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadCompany">Empresa</Label>
              <Input id="leadCompany" value={leadCompany} onChange={e => setLeadCompany(e.target.value)} placeholder="Cooperativa XYZ" />
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <Button onClick={handleCreate} disabled={creating} className="w-full gap-2">
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Evaluar
          </Button>
        </CardContent>
      </Card>
    </>
  );
}

// ─── DIAGNOSTIC WIZARD ─────────────────────────────────────────────────────────

function DiagnosticWizard({ sessionId, onComplete, onBack }: {
  sessionId: string; onComplete: () => void; onBack: () => void;
}) {
  const [flowState, setFlowState] = useState<FlowState | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Answer state
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [textAnswer, setTextAnswer] = useState('');
  const [numberAnswer, setNumberAnswer] = useState('');
  const [boolAnswer, setBoolAnswer] = useState<boolean | null>(null);

  const resetAnswerState = useCallback(() => {
    setSelectedOptions([]);
    setTextAnswer('');
    setNumberAnswer('');
    setBoolAnswer(null);
  }, []);

  const loadNextStep = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const state = await SalesSessionService.getNextStep(sessionId);
      salesDebug('flowState', {
        next_question_id: state.next_question_id,
        is_complete: state.is_complete,
        flags: state.flags,
        progress: state.progress,
        scores: state.context,
      });
      setFlowState(state);
      resetAnswerState();

      if (state.is_complete) {
        salesDebug('Diagnostic complete — finalizing session');
        await SalesSessionService.finalizeSession(sessionId);
        salesDebug('Session finalized');
        onComplete();
      }
    } catch (e) {
      const msg = (e as Error).message;
      salesDebug('getNextStep error', msg);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [sessionId, onComplete, resetAnswerState]);

  useEffect(() => { loadNextStep(); }, [loadNextStep]);

  const handleSubmitAnswer = useCallback(async () => {
    if (!flowState?.next_question) return;
    const q = flowState.next_question;
    setSaving(true);
    setError(null);

    const answerPayload: any = {
      session_id: sessionId,
      question_id: q.id,
      answer_text: null,
      answer_number: null,
      answer_boolean: null,
      answer_option_ids: null,
    };

    switch (q.question_type) {
      case 'single_select':
        answerPayload.answer_option_ids = selectedOptions.length > 0 ? selectedOptions : null;
        break;
      case 'multi_select':
        answerPayload.answer_option_ids = selectedOptions.length > 0 ? selectedOptions : null;
        break;
      case 'boolean':
        answerPayload.answer_boolean = boolAnswer;
        break;
      case 'number':
        answerPayload.answer_number = numberAnswer ? parseFloat(numberAnswer) : null;
        break;
      case 'text':
      case 'textarea':
        answerPayload.answer_text = textAnswer || null;
        break;
    }

    salesDebug('saveAnswer payload', answerPayload);

    try {
      await SalesSessionService.saveAnswer(answerPayload);
      salesDebug('saveAnswer success');

      // Recalculate scores every 3 answers for live flags
      if (flowState.progress.answered > 0 && flowState.progress.answered % 3 === 0) {
        await SalesSessionService.recalculateScores(sessionId);
        salesDebug('Scores recalculated mid-session');
      }

      await loadNextStep();
    } catch (e) {
      const msg = (e as Error).message;
      salesDebug('saveAnswer error', msg);
      setError(msg);
    } finally {
      setSaving(false);
    }
  }, [flowState, sessionId, selectedOptions, boolAnswer, numberAnswer, textAnswer, loadNextStep]);

  const question = flowState?.next_question;
  const hasAnswer = (() => {
    if (!question) return false;
    switch (question.question_type) {
      case 'single_select': return selectedOptions.length > 0;
      case 'multi_select': return selectedOptions.length > 0;
      case 'boolean': return boolAnswer !== null;
      case 'number': return numberAnswer !== '';
      case 'text':
      case 'textarea': return textAnswer.trim() !== '';
      default: return false;
    }
  })();

  if (loading && !flowState) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Diagnóstico en curso..." />
        <Skeleton className="h-40 w-full max-w-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader title="Diagnóstico Comercial" subtitle={`Sesión: ${sessionId.slice(0, 8)}...`} />

      <Button variant="ghost" onClick={onBack} className="gap-2">
        <ArrowLeft className="h-4 w-4" /> Abandonar
      </Button>

      {/* Progress */}
      {flowState && (
        <div className="max-w-lg space-y-2">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Progreso: {flowState.progress.answered} / {flowState.progress.total_visible}</span>
            <span>{flowState.progress.percentage}%</span>
          </div>
          <Progress value={flowState.progress.percentage} className="h-2" />

          {/* Flags */}
          {flowState.flags.length > 0 && (
            <div className="flex gap-1 flex-wrap mt-2">
              {flowState.flags.map(f => (
                <Badge key={f} variant="outline" className="text-xs">{f}</Badge>
              ))}
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5 max-w-lg">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Question Card */}
      {question && (
        <Card className="max-w-lg border-primary/20">
          <CardHeader>
            <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
              <Badge variant="outline" className="text-xs">{question.section?.code ?? 'N/A'}</Badge>
              <span>Pregunta {question.position}</span>
              {question.is_required && <Badge variant="destructive" className="text-xs">Requerida</Badge>}
            </div>
            <CardTitle className="text-base">{question.text}</CardTitle>
            {question.help && <p className="text-xs text-muted-foreground mt-1">{question.help}</p>}
          </CardHeader>
          <CardContent className="space-y-3">
            <QuestionInput
              question={question}
              selectedOptions={selectedOptions}
              setSelectedOptions={setSelectedOptions}
              textAnswer={textAnswer}
              setTextAnswer={setTextAnswer}
              numberAnswer={numberAnswer}
              setNumberAnswer={setNumberAnswer}
              boolAnswer={boolAnswer}
              setBoolAnswer={setBoolAnswer}
            />

            <Button
              onClick={handleSubmitAnswer}
              disabled={saving || (!hasAnswer && question.is_required)}
              className="w-full gap-2"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
              {saving ? 'Guardando...' : 'Siguiente'}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ─── QUESTION INPUT RENDERER ───────────────────────────────────────────────────

function QuestionInput({ question, selectedOptions, setSelectedOptions, textAnswer, setTextAnswer, numberAnswer, setNumberAnswer, boolAnswer, setBoolAnswer }: {
  question: LoadedQuestion;
  selectedOptions: string[]; setSelectedOptions: (v: string[]) => void;
  textAnswer: string; setTextAnswer: (v: string) => void;
  numberAnswer: string; setNumberAnswer: (v: string) => void;
  boolAnswer: boolean | null; setBoolAnswer: (v: boolean | null) => void;
}) {
  switch (question.question_type) {
    case 'single_select':
      return (
        <div className="space-y-2">
          {question.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => setSelectedOptions([opt.id])}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                selectedOptions.includes(opt.id)
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      );

    case 'multi_select':
      return (
        <div className="space-y-2">
          {question.options.map(opt => (
            <button
              key={opt.id}
              onClick={() => {
                setSelectedOptions(
                  selectedOptions.includes(opt.id)
                    ? selectedOptions.filter(id => id !== opt.id)
                    : [...selectedOptions, opt.id]
                );
              }}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors',
                selectedOptions.includes(opt.id)
                  ? 'border-primary bg-primary/10 text-primary font-medium'
                  : 'border-border hover:border-primary/30 hover:bg-muted/50'
              )}
            >
              <span className="flex items-center gap-2">
                <span className={cn(
                  'h-4 w-4 rounded border flex items-center justify-center shrink-0',
                  selectedOptions.includes(opt.id) ? 'bg-primary border-primary' : 'border-muted-foreground/30'
                )}>
                  {selectedOptions.includes(opt.id) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                </span>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      );

    case 'boolean':
      return (
        <div className="grid grid-cols-2 gap-3">
          {[true, false].map(val => (
            <button
              key={String(val)}
              onClick={() => setBoolAnswer(val)}
              className={cn(
                'px-4 py-3 rounded-lg border text-sm font-medium transition-colors',
                boolAnswer === val
                  ? 'border-primary bg-primary/10 text-primary'
                  : 'border-border hover:border-primary/30'
              )}
            >
              {val ? 'Sí' : 'No'}
            </button>
          ))}
        </div>
      );

    case 'number':
      return (
        <Input
          type="number"
          value={numberAnswer}
          onChange={e => setNumberAnswer(e.target.value)}
          placeholder="Ingresa un número..."
        />
      );

    case 'text':
      return (
        <Input
          value={textAnswer}
          onChange={e => setTextAnswer(e.target.value)}
          placeholder="Escribe tu respuesta..."
        />
      );

    case 'textarea':
      return (
        <textarea
          value={textAnswer}
          onChange={e => setTextAnswer(e.target.value)}
          placeholder="Escribe tu respuesta..."
          rows={4}
          className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
        />
      );

    default:
      return <p className="text-sm text-muted-foreground">Tipo de pregunta no soportado: {question.question_type}</p>;
  }
}

// ─── SESSION RESULTS ───────────────────────────────────────────────────────────

function SessionResults({ sessionId, onBack }: { sessionId: string; onBack: () => void }) {
  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['admin', 'sales-session-summary', sessionId],
    queryFn: () => SalesSessionService.getSessionSummary(sessionId),
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Resultados" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <SectionHeader title="Resultados" />
        <ErrorState message={(error as Error).message} />
      </div>
    );
  }

  if (!summary) return null;

  const scores = summary.scores;
  const scoreItems = [
    { label: 'Total', value: scores.score_total, color: 'text-primary' },
    { label: 'Dolor', value: scores.score_pain, color: 'text-orange-500' },
    { label: 'Madurez', value: scores.score_maturity, color: 'text-blue-500' },
    { label: 'Urgencia', value: scores.score_urgency, color: 'text-red-500' },
    { label: 'Fit', value: scores.score_fit, color: 'text-green-500' },
    { label: 'Presupuesto', value: scores.score_budget_readiness, color: 'text-yellow-500' },
    { label: 'Objeción', value: scores.score_objection, color: 'text-purple-500' },
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        title="Resultados del Diagnóstico"
        subtitle={`Sesión: ${sessionId.slice(0, 8)}... | Estado: ${summary.status} | Etapa: ${summary.commercial_stage}`}
        actions={
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Volver al listado
          </Button>
        }
      />

      {/* Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {scoreItems.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-3 px-4 text-center">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={cn('text-2xl font-bold', s.color)}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Objections */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-warning" /> Objeciones Detectadas ({summary.objections.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.objections.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se detectaron objeciones.</p>
          ) : (
            <div className="space-y-2">
              {summary.objections.map((obj, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="text-xs capitalize">{obj.objection_type}</Badge>
                    <span className="text-sm">{obj.has_behavioral_signal ? '+ señal conductual' : 'regla directa'}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{(obj.effective_confidence * 100).toFixed(0)}%</p>
                    <p className="text-xs text-muted-foreground">{obj.rule_hits} regla(s)</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recommendations */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" /> Recomendaciones ({summary.recommendations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {summary.recommendations.length === 0 ? (
            <p className="text-sm text-muted-foreground">No se generaron recomendaciones.</p>
          ) : (
            <div className="space-y-3">
              {summary.recommendations.map(rec => (
                <div key={rec.id} className="p-4 rounded-lg border space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs capitalize">{rec.recommendation_type}</Badge>
                    <span className="text-xs text-muted-foreground">Prioridad: {rec.priority}</span>
                  </div>
                  <p className="text-sm font-medium">{rec.title}</p>
                  {rec.description && <p className="text-xs text-muted-foreground">{rec.description}</p>}
                  {rec.payload && Object.keys(rec.payload).length > 0 && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Ver payload</summary>
                      <pre className="mt-1 p-2 bg-muted rounded text-xs overflow-auto max-h-32">
                        {JSON.stringify(rec.payload, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
