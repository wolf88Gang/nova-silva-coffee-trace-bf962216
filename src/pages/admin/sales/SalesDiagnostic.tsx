/**
 * /admin/sales/diagnostic — Sales Copilot
 * 3-zone layout: Top bar · Left conversation · Right intelligence
 */
import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, Loader2, Send, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

import { CopilotIntelligencePanel } from '@/components/admin/sales/CopilotIntelligencePanel';
import { CopilotTopBar } from '@/components/admin/sales/CopilotTopBar';
import { DiagnosticInputCard } from '@/components/admin/sales/DiagnosticInputCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminSalesOrganizations } from '@/hooks/useAdminSalesOrganizations';
import {
  createEmptyProfile,
  getNextQuestions,
  hasMoreQuestions,
  interpretProfile,
  ORG_TYPES,
  updateProfileFromAnswer,
  type LeadProfile,
} from '@/lib/diagnosticEngine';
import { label, ORG_TYPE_LABELS, PAIN_LABELS } from '@/lib/diagnosticLabels';
import { SalesSessionService } from '@/lib/salesSessionService';
import { cn } from '@/lib/utils';

interface AnsweredEntry {
  questionId: string;
  questionTitle: string;
  value: unknown;
}

export default function SalesDiagnostic() {
  const navigate = useNavigate();
  const { data: organizations, isLoading: orgsLoading } = useAdminSalesOrganizations();

  const [profile, setProfile] = useState<LeadProfile>(createEmptyProfile);
  const [answered, setAnswered] = useState<AnsweredEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCreating, setSessionCreating] = useState(false);

  const interpretation = useMemo(() => interpretProfile(profile), [profile]);
  const nextQuestions = useMemo(() => getNextQuestions(profile), [profile]);
  const canFinalize = answered.length >= 3 && sessionId && !hasMoreQuestions(profile);
  const answeredCount = Object.keys(profile.raw_answers).length;

  const createSessionIfNeeded = useCallback(async (updatedProfile: LeadProfile) => {
    if (sessionId || !updatedProfile.organization_id || !updatedProfile.organization_type) return;
    setSessionCreating(true);
    try {
      const result = await SalesSessionService.createSession({
        organization_id: updatedProfile.organization_id,
        lead_name: null,
        lead_company: updatedProfile.organization_name,
        lead_type: updatedProfile.organization_type,
        questionnaire_code: 'nova_sales_intel',
        questionnaire_version: 1,
      });
      setSessionId(result.sessionId);
    } catch (err: any) {
      console.error('[Copilot] Session creation failed:', err);
      toast.error(`Error creando sesión: ${err.message}`);
    } finally {
      setSessionCreating(false);
    }
  }, [sessionId]);

  const handleOrgTypeSelect = useCallback((orgType: string) => {
    const updated = { ...profile, organization_type: orgType };
    setProfile(updated);
    createSessionIfNeeded(updated);
  }, [profile, createSessionIfNeeded]);

  const handleOrgSelect = useCallback((orgId: string) => {
    const org = organizations?.items.find(o => o.id === orgId);
    const updated = { ...profile, organization_id: orgId, organization_name: org?.nombre ?? null };
    setProfile(updated);
    createSessionIfNeeded(updated);
  }, [profile, organizations, createSessionIfNeeded]);

  const handleAnswer = useCallback(async (questionId: string, questionTitle: string, value: unknown, note?: string) => {
    const updated = updateProfileFromAnswer(profile, questionId, value, note);
    setProfile(updated);
    setAnswered(prev => [...prev, { questionId, questionTitle, value }]);
    if (sessionId) {
      try {
        await SalesSessionService.saveAnswer({ sessionId, questionId, answerValue: value as any });
        await SalesSessionService.recalculateScores(sessionId);
      } catch (err: any) {
        console.warn('[Copilot] Answer save failed:', err.message);
      }
    }
  }, [profile, sessionId]);

  const finalizeMutation = useMutation({
    mutationFn: async () => {
      if (!sessionId) throw new Error('No hay sesión activa');
      await SalesSessionService.finalizeSession(sessionId);
      return sessionId;
    },
    onSuccess: (id) => {
      toast.success('Sesión finalizada');
      navigate(`/admin/sales/sessions/${id}`);
    },
    onError: (err: any) => toast.error(err.message || 'Error al finalizar'),
  });

  const orgTypeSelected = Boolean(profile.organization_type);
  const orgSelected = Boolean(profile.organization_id);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      {/* TOP BAR */}
      <CopilotTopBar
        profile={profile}
        sessionId={sessionId}
        sessionCreating={sessionCreating}
        canFinalize={Boolean(canFinalize)}
        finalizing={finalizeMutation.isPending}
        onFinalize={() => finalizeMutation.mutate()}
      />

      {/* MAIN: LEFT + RIGHT */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-0">

          {/* LEFT — Conversation */}
          <div className="lg:col-span-3 overflow-y-auto border-r border-border p-4 space-y-4">

            {/* Org type selector */}
            <Card className={cn(!orgTypeSelected && 'border-primary/30 shadow-sm')}>
              <CardContent className="pt-4 pb-3 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">¿Qué tipo de organización es?</h3>
                <p className="text-xs text-muted-foreground">Todo el diagnóstico se adapta a partir de aquí.</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ORG_TYPES.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => handleOrgTypeSelect(t.value)}
                      disabled={orgTypeSelected}
                      className={cn(
                        'text-left rounded-lg border px-3 py-2.5 transition-all',
                        profile.organization_type === t.value
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
                          : 'border-border bg-background hover:bg-muted/40',
                        orgTypeSelected && profile.organization_type !== t.value && 'opacity-40',
                      )}
                    >
                      <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                        {profile.organization_type === t.value && <Check className="h-3.5 w-3.5 text-primary" />}
                        {t.label}
                      </span>
                      <span className="text-[11px] text-muted-foreground">{t.description}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Org selector */}
            {orgTypeSelected && (
              <Card className={cn(!orgSelected && 'border-primary/30 shadow-sm', 'animate-in fade-in-50 slide-in-from-bottom-2')}>
                <CardContent className="pt-4 pb-3 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <Building2 className="h-4 w-4 text-primary" />
                    Selecciona la organización
                  </h3>
                  {orgsLoading ? (
                    <Skeleton className="h-10 w-full" />
                  ) : organizations?.status === 'unavailable' || !organizations?.items.length ? (
                    <p className="text-xs text-muted-foreground">No hay organizaciones disponibles.</p>
                  ) : (
                    <Select value={profile.organization_id ?? ''} onValueChange={handleOrgSelect} disabled={orgSelected}>
                      <SelectTrigger><SelectValue placeholder="Seleccionar organización" /></SelectTrigger>
                      <SelectContent>
                        {organizations.items.map((org) => (
                          <SelectItem key={org.id} value={org.id}>
                            {org.nombre}{org.tipo ? ` · ${org.tipo}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {orgSelected && profile.organization_name && (
                    <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs text-primary">
                      <Check className="h-3 w-3" />
                      <span>{profile.organization_name}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Answered — collapsed */}
            {answered.map((a) => (
              <Card key={a.questionId} className="bg-muted/30 border-border/50">
                <CardContent className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <Check className="h-3 w-3 text-primary shrink-0" />
                    <span className="text-xs font-medium text-foreground truncate">{a.questionTitle}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5 ml-5 truncate">
                    {Array.isArray(a.value)
                      ? a.value.map(v => PAIN_LABELS[v] ?? v).join(', ')
                      : String(a.value ?? '—')}
                  </p>
                </CardContent>
              </Card>
            ))}

            {/* Next questions */}
            {orgSelected && nextQuestions.map((q, i) => (
              <DiagnosticInputCard
                key={q.id}
                question={q}
                onSubmit={(value, note) => handleAnswer(q.id, q.title, value, note)}
                isFirst={i === 0}
              />
            ))}

            {/* Completion */}
            {orgSelected && nextQuestions.length === 0 && answered.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-6 text-center space-y-2">
                  <Sparkles className="h-6 w-6 text-primary mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Diagnóstico completo</p>
                  <p className="text-xs text-muted-foreground">
                    {answered.length} respuestas · {profile.signals.length} señales detectadas
                  </p>
                  {sessionId && (
                    <Button
                      size="sm"
                      onClick={() => finalizeMutation.mutate()}
                      disabled={finalizeMutation.isPending}
                      className="mt-2 gap-1.5"
                    >
                      {finalizeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Finalizar y ver resultados
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* RIGHT — Intelligence */}
          <div className="lg:col-span-2 overflow-hidden bg-muted/20 p-4 hidden lg:block">
            <CopilotIntelligencePanel
              profile={profile}
              interpretation={interpretation}
              answeredCount={answeredCount}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
