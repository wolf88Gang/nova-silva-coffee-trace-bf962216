import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Send, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

import { SalesQuestionRenderer } from '@/components/admin/sales/SalesQuestionRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSalesOrganizations } from '@/hooks/useAdminSalesOrganizations';
import {
  getInitialAnswerForQuestion,
  SalesSessionService,
  type SalesQuestion,
  type SalesQuestionAnswer,
} from '@/lib/salesSessionService';

const LEAD_TYPES = ['cooperativa', 'exportador', 'beneficio_privado', 'productor_empresarial', 'aggregator'];

type Step = 'org' | 'question' | 'ready';

export default function SalesNewSession() {
  const navigate = useNavigate();
  const { data: organizations, isLoading: orgsLoading, isError: orgsError, error: orgsErrorValue } = useAdminSalesOrganizations();

  const [step, setStep] = useState<Step>('org');
  const [organizationId, setOrganizationId] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadType, setLeadType] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<SalesQuestion | null>(null);
  const [answerValue, setAnswerValue] = useState<SalesQuestionAnswer>(null);
  const [flowError, setFlowError] = useState<string | null>(null);

  const selectedOrg = useMemo(
    () => organizations?.items.find((item) => item.id === organizationId) ?? null,
    [organizationId, organizations?.items]
  );

  const canStart = Boolean(organizationId);

  const startMutation = useMutation({
    mutationFn: async () => {
      setFlowError(null);
      const created = await SalesSessionService.createSession({
        organization_id: organizationId,
        lead_name: leadName.trim() || null,
        lead_company: leadCompany.trim() || null,
        lead_type: leadType || null,
        questionnaire_code: 'nova_sales_intel',
        questionnaire_version: 1,
      });

      const nextStep = await SalesSessionService.getNextStep(created.sessionId);
      return { sessionId: created.sessionId, nextStep };
    },
    onSuccess: ({ sessionId: createdSessionId, nextStep }) => {
      setSessionId(createdSessionId);
      setCurrentQuestion(nextStep.question);
      setAnswerValue(getInitialAnswerForQuestion(nextStep.question));

      if (nextStep.isComplete || !nextStep.question) {
        setStep('ready');
        toast.success('Sesión creada');
        return;
      }

      setStep('question');
      toast.success('Sesión creada');
    },
    onError: (error: any) => {
      const message = error?.message || 'No se pudo crear la sesión';
      setFlowError(message);
    },
  });

  const answerMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId || !currentQuestion) throw new Error('No hay pregunta activa');
      await SalesSessionService.saveAnswer({
        sessionId,
        questionId: currentQuestion.id,
        answerValue,
      });
      await SalesSessionService.recalculateScores(sessionId);
      return SalesSessionService.getNextStep(sessionId);
    },
    onSuccess: (nextStep) => {
      setFlowError(null);
      setCurrentQuestion(nextStep.question);
      setAnswerValue(getInitialAnswerForQuestion(nextStep.question));

      if (nextStep.isComplete || !nextStep.question) {
        setStep('ready');
      }
    },
    onError: (error: any) => {
      setFlowError(error?.message || 'No se pudo guardar la respuesta');
    },
  });

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No hay sesión activa');
      await SalesSessionService.finalizeSession(sessionId);
      return sessionId;
    },
    onSuccess: (createdSessionId) => {
      toast.success('Sesión finalizada');
      navigate(`/admin/sales/sessions/${createdSessionId}`);
    },
    onError: (error: any) => {
      setFlowError(error?.message || 'No se pudo finalizar la sesión');
    },
  });

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/sales')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nueva sesión</h1>
          <p className="text-sm text-muted-foreground">Diagnóstico comercial</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {['Lead', currentQuestion ? 'Pregunta actual' : 'Wizard', 'Resultados'].map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            {index > 0 && <div className="h-px w-6 bg-border" />}
            <span className={index === 0 && step === 'org' ? 'font-medium text-foreground' : index === 1 && step === 'question' ? 'font-medium text-foreground' : index === 2 && step === 'ready' ? 'font-medium text-foreground' : ''}>
              {index + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {step === 'org' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Selecciona organización y contexto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Organización *</Label>
              {orgsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : organizations?.status === 'unavailable' ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  No se pudo cargar la fuente real de organizaciones para admin.
                </div>
              ) : organizations?.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  No hay organizaciones activas disponibles.
                </div>
              ) : (
                <Select value={organizationId} onValueChange={setOrganizationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {organizations?.items.map((org) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.nombre}{org.tipo ? ` · ${org.tipo}` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Lead company</Label>
              <Input value={leadCompany} onChange={(event) => setLeadCompany(event.target.value)} placeholder="Opcional" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Lead name</Label>
              <Input value={leadName} onChange={(event) => setLeadName(event.target.value)} placeholder="Opcional" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Lead type</Label>
              <Select value={leadType} onValueChange={setLeadType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedOrg && (
              <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-3 text-sm text-muted-foreground">
                <Building2 className="h-4 w-4 text-primary" />
                <span>{selectedOrg.nombre}</span>
              </div>
            )}

            {flowError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-destructive">{flowError}</p>
              </div>
            )}

            {orgsError && !orgsLoading && (
              <p className="text-xs text-destructive">{(orgsErrorValue as Error)?.message || 'Error cargando organizaciones'}</p>
            )}

            <div className="flex justify-end">
              <Button size="sm" disabled={!canStart || startMutation.isPending || organizations?.status !== 'available'} onClick={() => startMutation.mutate()} className="gap-1.5">
                {startMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                Evaluar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'question' && currentQuestion && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{currentQuestion.title}</CardTitle>
            {currentQuestion.description && (
              <p className="text-sm text-muted-foreground">{currentQuestion.description}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <SalesQuestionRenderer
              question={currentQuestion}
              value={answerValue}
              onChange={setAnswerValue}
              disabled={answerMutation.isPending}
            />

            {flowError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-destructive">{flowError}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button size="sm" onClick={() => answerMutation.mutate()} disabled={answerMutation.isPending} className="gap-1.5">
                {answerMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                Guardar y continuar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'ready' && sessionId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Sesión lista para finalizar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">El cuestionario devolvió control al flujo de cierre.</p>
                <p className="text-xs text-muted-foreground mt-1">Session ID: {sessionId}</p>
              </div>
            </div>

            {flowError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-destructive">{flowError}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/sales/sessions/${sessionId}`)}>
                Ver borrador
              </Button>
              <Button size="sm" onClick={() => finalizeMutation.mutate()} disabled={finalizeMutation.isPending} className="gap-1.5">
                {finalizeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                Finalizar sesión
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
