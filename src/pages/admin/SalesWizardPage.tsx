/**
<<<<<<< Current (Your changes)
 * SalesWizardPage — deal desk / operator console for Sales Intelligence.
 * Internal commercial tooling, not a survey.
 *
 * ACTIVE FLOW: session setup → QuestionRenderer + SalesInsightPanel → priority engine → finalize → results
 * LEGACY REMOVED: SalesDiagnosticPage, useAdaptiveDiagnostic, DiagnosticConversationPanel
 * BACKEND CONTRACT: SalesSessionService (fn_sales_create_session, fn_sales_save_answer, fn_sales_finalize_session)
=======
 * SalesWizardPage — LEGACY / FROZEN. URL only: /admin/sales/legacy-wizard (no sidebar, no links from copilot).
 * Do not add features here. PRIMARY: SalesCopilotPage + CopilotLayout + useCopilotDiagnostic.
>>>>>>> Incoming (Background Agent changes)
 */

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { QuestionRenderer, hasValidAnswer, type QuestionValue } from '@/components/sales/QuestionRenderer';
import { SalesInsightPanel } from '@/components/sales/SalesInsightPanel';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSalesWizard } from '@/hooks/useSalesWizard';
import { useAdminOrganizations } from '@/hooks/admin/useAdminOrganizations';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle, Play, ArrowRight } from 'lucide-react';
import type { SaveAnswerPayload } from '@/hooks/useSalesWizard';

export default function SalesWizardPage() {
  const navigate = useNavigate();
  const orgsQuery = useAdminOrganizations();
  const orgs = orgsQuery.data?.data ?? [];
  const isFallbackOrgs = orgsQuery.data?.isFallback ?? false;
  const {
    sessionId,
    flowState,
    isLoading,
    error,
    createSession,
    saveAnswer,
    skipQuestion,
    finalizeAndComplete,
  } = useSalesWizard();

  const [organizationId, setOrganizationId] = useState<string>('');
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadType, setLeadType] = useState<string>('cooperativa');
  const [sessionContext, setSessionContext] = useState<{
    orgName: string;
    leadName?: string;
    leadCompany?: string;
  } | null>(null);
  const [answerValue, setAnswerValue] = useState<QuestionValue>(null);

  const orgName = sessionContext?.orgName ?? orgs.find((o) => o.id === organizationId)?.name;
  const { toast } = useToast();

  const handleStart = async () => {
    if (!organizationId) {
      toast({ title: 'Selecciona una organización', description: 'Debes elegir una cuenta antes de evaluar.', variant: 'destructive' });
      return;
    }
    if (isFallbackOrgs) {
      toast({ title: 'Backend no disponible', description: 'Las organizaciones no cargaron desde el backend. No se puede crear sesión con datos mock.', variant: 'destructive' });
      return;
    }
    const org = orgs.find((o) => o.id === organizationId);
    const sid = await createSession({
      organization_id: organizationId,
      lead_name: leadName || undefined,
      lead_company: leadCompany || undefined,
      lead_type: leadType as 'cooperativa' | 'exportador' | 'certificadora',
    });
    if (sid) {
      setSessionContext({
        orgName: org?.name ?? 'Organización',
        leadName: leadName || undefined,
        leadCompany: leadCompany || undefined,
      });
      setAnswerValue(null);
    }
  };

  const buildPayload = (q: NonNullable<typeof flowState>['next_question'], v: QuestionValue): SaveAnswerPayload => {
    if (q.question_type === 'single_select' || q.question_type === 'multi_select') {
      const ids = Array.isArray(v) ? v : [];
      return { answer_option_ids: ids };
    }
    if (q.question_type === 'boolean') return { answer_boolean: v === true };
    if (q.question_type === 'number') return { answer_number: typeof v === 'number' ? v : 0 };
    if (q.question_type === 'text' || q.question_type === 'textarea') return { answer_text: String(v ?? '') };
    return { answer_option_ids: [] };
  };

  const handleSubmitAnswer = async () => {
    const q = flowState?.next_question;
    if (!q || !sessionId) return;
    if (!hasValidAnswer(q, answerValue)) return;
    try {
      await saveAnswer(q.id, buildPayload(q, answerValue));
      setAnswerValue(null);
    } catch {
      // error set in hook
    }
  };

  const handleComplete = async () => {
    if (!sessionId) return;
    try {
      await finalizeAndComplete();
      navigate(`/admin/sales/sessions/${sessionId}`);
    } catch {
      // error set in hook
    }
  };

  const question = flowState?.next_question;
  const isComplete = flowState?.is_complete ?? false;
  const progress = flowState?.progress;
  const canSubmit = question && hasValidAnswer(question, answerValue);

  return (
    <div className="space-y-4">
      <Alert variant="destructive" className="border-amber-600/50 bg-amber-950/20 text-amber-100 [&>svg]:text-amber-500">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="font-medium">
          Flujo legado. No usar para ventas nuevas. El diagnóstico activo está en <strong>/admin/sales/new</strong> (copilot).
          Esta pantalla solo existe como respaldo de emergencia vía URL directa.
        </AlertDescription>
      </Alert>

      <AdminPageHeader
        title="Sales Intelligence (legado)"
        description="Diagnóstico comercial — flujo congelado"
      />

      {isFallbackOrgs && orgs.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Organizaciones en modo mock. El backend no respondió. Ejecuta insert_demo_orgs.sql y verifica v_admin_organizations_summary.
          </AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {!sessionId ? (
        <Card className="relative z-10">
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Cuenta</Label>
                <Select value={organizationId} onValueChange={setOrganizationId} required>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Seleccionar organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgsQuery.isLoading ? (
                      <div className="py-2 px-2 text-xs text-muted-foreground">
                        Cargando…
                      </div>
                    ) : orgs.length === 0 ? (
                      <div className="py-2 px-2 text-xs text-muted-foreground">
                        Sin organizaciones. Ejecuta insert_demo_orgs.sql en Supabase.
                      </div>
                    ) : (
                      orgs.map((o) => (
                        <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lead</Label>
                <Input
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                  placeholder="Nombre"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Empresa</Label>
                <Input
                  value={leadCompany}
                  onChange={(e) => setLeadCompany(e.target.value)}
                  placeholder="Opcional"
                  className="h-9"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tipo</Label>
                <Select value={leadType} onValueChange={setLeadType}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cooperativa">Cooperativa</SelectItem>
                    <SelectItem value="exportador">Exportador</SelectItem>
                    <SelectItem value="certificadora">Certificadora</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleStart}
                disabled={!organizationId || isLoading || orgsQuery.isLoading || orgs.length === 0 || isFallbackOrgs}
                size="sm"
                className="h-9"
              >
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Evaluar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : isComplete ? (
        <Card>
          <CardContent className="pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="font-medium">Listo</p>
              <p className="text-xs text-muted-foreground">Ver score, bloqueadores y próximos pasos</p>
            </div>
            <Button onClick={handleComplete} disabled={isLoading} size="sm">
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
              Generar resultados
            </Button>
          </CardContent>
        </Card>
      ) : question ? (
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 min-w-0">
            {/* Deal header bar */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-3 text-sm">
              <span className="font-medium">{sessionContext?.orgName ?? orgName}</span>
              {sessionContext?.leadName && (
                <span className="text-muted-foreground">· {sessionContext.leadName}</span>
              )}
              {progress && (
                <span className="text-muted-foreground tabular-nums">
                  {progress.answered}/{progress.total_visible}
                </span>
              )}
              <span className="text-xs text-muted-foreground">
                {question.section?.title ?? ''}
              </span>
            </div>
            <Card>
              <CardContent className="pt-5 pb-5">
                <div className="space-y-4">
                  <QuestionRenderer
                    question={question}
                    value={answerValue}
                    onChange={setAnswerValue}
                    disabled={isLoading}
                    questionReason={flowState?.next_question_reason ?? null}
                  />
                  <div className="flex justify-end items-center gap-2 pt-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => question && skipQuestion(question.id)}
                      disabled={isLoading}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Omitir
                    </Button>
                    <Button
                      onClick={handleSubmitAnswer}
                      disabled={!canSubmit || isLoading}
                      size="sm"
                      aria-busy={isLoading}
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" /> : null}
                      {isLoading ? 'Guardando…' : 'Continuar'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="lg:w-[220px] shrink-0">
            <div className="lg:sticky lg:top-4">
              <SalesInsightPanel
                flowState={flowState}
                orgName={sessionContext?.orgName ?? orgName}
                leadName={sessionContext?.leadName ?? (leadName || undefined)}
                leadCompany={sessionContext?.leadCompany ?? (leadCompany || undefined)}
                sessionId={sessionId}
              />
            </div>
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando…
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Sin más preguntas. <Button variant="link" className="h-auto p-0 text-xs" asChild><Link to="/admin/sales">Nueva sesión</Link></Button>
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
