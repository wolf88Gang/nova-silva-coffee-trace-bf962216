import { useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Loader2, Send, AlertCircle, CheckCircle2, Building2, UserPlus } from 'lucide-react';
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

const LEAD_TYPES: { value: string; label: string }[] = [
  { value: 'cooperativa', label: 'Cooperativa / Asociación' },
  { value: 'exportador', label: 'Exportador' },
  { value: 'exportador_red', label: 'Exportador con red de productores' },
  { value: 'beneficio_privado', label: 'Beneficio (compra + procesa)' },
  { value: 'finca_privada', label: 'Finca privada' },
  { value: 'trader', label: 'Comercializador / Trader' },
];

type EntryMode = 'choose' | 'existing_org' | 'new_lead';
type Step = 'entry' | 'question' | 'ready';

export default function SalesNewSession() {
  const navigate = useNavigate();
  const { data: organizations, isLoading: orgsLoading } = useAdminSalesOrganizations();

  const [entryMode, setEntryMode] = useState<EntryMode>('choose');
  const [step, setStep] = useState<Step>('entry');
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

  // New lead requires at least company or name + type
  const canStartNewLead = Boolean((leadCompany.trim() || leadName.trim()) && leadType);
  // Existing org requires org selection
  const canStartExistingOrg = Boolean(organizationId);
  const canStart = entryMode === 'new_lead' ? canStartNewLead : entryMode === 'existing_org' ? canStartExistingOrg : false;

  const startMutation = useMutation({
    mutationFn: async () => {
      setFlowError(null);
      const orgId = entryMode === 'existing_org' ? organizationId : null;
      const created = await SalesSessionService.createSession({
        organization_id: orgId || null,
        lead_name: leadName.trim() || null,
        lead_company: leadCompany.trim() || (entryMode === 'existing_org' && selectedOrg ? selectedOrg.nombre : null),
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
      toast.success('Sesión creada — diagnóstico iniciado');
    },
    onError: (error: any) => {
      const message = error?.message || 'No se pudo crear la sesión';
      // If the backend rejects null org_id, tell the user clearly
      if (message.includes('organization_id') || message.includes('not-null')) {
        setFlowError('El backend requiere vincular una organización existente para crear la sesión. Selecciona una organización o solicita al equipo técnico habilitar leads sin organización.');
      } else {
        setFlowError(message);
      }
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
      toast.success('Diagnóstico finalizado');
      navigate(`/admin/sales/sessions/${createdSessionId}`);
    },
    onError: (error: any) => {
      setFlowError(error?.message || 'No se pudo finalizar la sesión');
    },
  });

  const stepLabels = ['Lead', currentQuestion ? 'Pregunta actual' : 'Diagnóstico', 'Resultados'];
  const activeStepIndex = step === 'entry' ? 0 : step === 'question' ? 1 : 2;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate('/admin/sales')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground">Nuevo diagnóstico comercial</h1>
          <p className="text-sm text-muted-foreground">Perfilamiento de lead o cuenta</p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {stepLabels.map((label, index) => (
          <div key={label} className="flex items-center gap-2">
            {index > 0 && <div className="h-px w-6 bg-border" />}
            <span className={index === activeStepIndex ? 'font-medium text-foreground' : ''}>
              {index + 1}. {label}
            </span>
          </div>
        ))}
      </div>

      {/* ── ENTRY: Choose mode ── */}
      {step === 'entry' && entryMode === 'choose' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setEntryMode('new_lead')}>
            <CardContent className="py-6 text-center">
              <UserPlus className="h-6 w-6 mx-auto mb-2 text-primary" />
              <p className="text-sm font-medium text-foreground">Lead nuevo</p>
              <p className="text-xs text-muted-foreground mt-1">Prospecto que aún no está en el sistema</p>
            </CardContent>
          </Card>
          <Card className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => setEntryMode('existing_org')}>
            <CardContent className="py-6 text-center">
              <Building2 className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm font-medium text-foreground">Organización existente</p>
              <p className="text-xs text-muted-foreground mt-1">Cuenta ya registrada en Nova Silva</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* ── ENTRY: New lead form ── */}
      {step === 'entry' && entryMode === 'new_lead' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Información del lead</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setEntryMode('choose')}>
                ← Cambiar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa / organización *</Label>
              <Input value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} placeholder="Nombre de la empresa del prospecto" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Contacto principal</Label>
              <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Nombre del contacto (opcional)" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo de organización *</Label>
              <Select value={leadType} onValueChange={setLeadType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {flowError && (
              <div className="flex items-start gap-2 rounded-md border border-destructive/20 bg-destructive/10 p-3">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                <p className="text-xs text-destructive">{flowError}</p>
              </div>
            )}

            <div className="flex justify-end">
              <Button size="sm" disabled={!canStart || startMutation.isPending} onClick={() => startMutation.mutate()} className="gap-1.5">
                {startMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                Iniciar diagnóstico
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── ENTRY: Existing org form ── */}
      {step === 'entry' && entryMode === 'existing_org' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Seleccionar organización</CardTitle>
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setEntryMode('choose')}>
                ← Cambiar
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Organización *</Label>
              {orgsLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : organizations?.status === 'unavailable' ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  No se pudo cargar organizaciones.
                </div>
              ) : organizations?.items.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground">
                  No hay organizaciones activas.
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
              <Label className="text-xs">Contacto (opcional)</Label>
              <Input value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Nombre del contacto" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Tipo</Label>
              <Select value={leadType} onValueChange={setLeadType}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
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

            <div className="flex justify-end">
              <Button size="sm" disabled={!canStart || startMutation.isPending || organizations?.status !== 'available'} onClick={() => startMutation.mutate()} className="gap-1.5">
                {startMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
                Iniciar diagnóstico
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── QUESTION STEP ── */}
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

      {/* ── READY / FINALIZE ── */}
      {step === 'ready' && sessionId && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Diagnóstico listo para finalizar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 px-4 py-4">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium text-foreground">Todas las preguntas fueron respondidas.</p>
                <p className="text-xs text-muted-foreground mt-1">Finaliza para generar el análisis comercial completo.</p>
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
                Finalizar diagnóstico
              </Button>
            </div>

            <div className="flex gap-2 pt-2 border-t border-border">
              <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/admin/sales')}>
                Volver a Sales Intelligence
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
