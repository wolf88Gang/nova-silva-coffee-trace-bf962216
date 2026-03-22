/**
 * /admin/sales/diagnostic — Sales Copilot
 * Supports both existing-org and new-lead flows.
 * Shows 1 question at a time. Compact answered history.
 */
import { useCallback, useMemo, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Building2, Check, Loader2, Plus, Send, Sparkles, UserPlus } from 'lucide-react';
import { toast } from 'sonner';

import { CopilotIntelligencePanel } from '@/components/admin/sales/CopilotIntelligencePanel';
import { CopilotTopBar } from '@/components/admin/sales/CopilotTopBar';
import { DiagnosticInputCard } from '@/components/admin/sales/DiagnosticInputCard';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
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
import { humanizeValue, ORG_TYPE_LABELS } from '@/lib/diagnosticLabels';
import { SalesSessionService } from '@/lib/salesSessionService';
import { cn } from '@/lib/utils';

type EntryMode = null | 'existing' | 'new_lead';

// Nova Silva Admin org used as placeholder for new-lead sessions
// Backend requires non-null organization_id
const NOVA_SILVA_ADMIN_ORG_ID = '66666666-6666-6666-6666-666666666666';

interface AnsweredEntry {
  questionId: string;
  questionTitle: string;
  value: unknown;
}

export default function SalesDiagnostic() {
  const navigate = useNavigate();
  const { data: organizations, isLoading: orgsLoading } = useAdminSalesOrganizations();

  const [entryMode, setEntryMode] = useState<EntryMode>(null);
  const [profile, setProfile] = useState<LeadProfile>(createEmptyProfile);
  const [answered, setAnswered] = useState<AnsweredEntry[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [sessionCreating, setSessionCreating] = useState(false);

  // New lead fields
  const [newLeadName, setNewLeadName] = useState('');
  const [newLeadCompany, setNewLeadCompany] = useState('');
  const [newLeadNote, setNewLeadNote] = useState('');

  const interpretation = useMemo(() => interpretProfile(profile), [profile]);
  // FIX #1: Only 1 question at a time
  const nextQuestions = useMemo(() => getNextQuestions(profile, 1), [profile]);
  const canFinalize = answered.length >= 3 && sessionId && !hasMoreQuestions(profile);
  const answeredCount = Object.keys(profile.raw_answers).length;

  const orgTypeSelected = Boolean(profile.organization_type);
  const orgSelected = Boolean(profile.organization_id);
  // For new leads, discovery starts once org type is selected
  const discoveryStarted = entryMode === 'new_lead' ? orgTypeSelected : orgSelected;

  const createSessionIfNeeded = useCallback(async (updatedProfile: LeadProfile) => {
    if (sessionId || !updatedProfile.organization_type) return;
    // For new leads, use placeholder org if no real org_id
    const orgId = updatedProfile.organization_id || NOVA_SILVA_ADMIN_ORG_ID;
    setSessionCreating(true);
    try {
      const result = await SalesSessionService.createSession({
        organization_id: orgId,
        lead_name: updatedProfile.notes.find(n => n.startsWith('[lead_name]'))?.replace('[lead_name] ', '') ?? null,
        lead_company: updatedProfile.organization_name,
        lead_type: updatedProfile.organization_type,
        questionnaire_code: 'nova_sales_intel',
        questionnaire_version: 1,
      });
      setSessionId(result.sessionId);
      toast.success('Sesión creada correctamente');
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
    // Always attempt session creation when org type is selected
    createSessionIfNeeded(updated);
  }, [profile, createSessionIfNeeded]);

  const handleOrgSelect = useCallback((orgId: string) => {
    const org = organizations?.items.find(o => o.id === orgId);
    const updated = { ...profile, organization_id: orgId, organization_name: org?.nombre ?? null };
    setProfile(updated);
    createSessionIfNeeded(updated);
  }, [profile, organizations, createSessionIfNeeded]);

  const handleNewLeadConfirm = useCallback(() => {
    // For new leads without org_id, we still need to try session creation.
    // The profile is ready for discovery even without backend session.
    const updated = {
      ...profile,
      organization_name: newLeadCompany.trim() || newLeadName.trim() || 'Lead nuevo',
      notes: [
        ...(newLeadName.trim() ? [`[lead_name] ${newLeadName.trim()}`] : []),
        ...(newLeadNote.trim() ? [`[nota_inicial] ${newLeadNote.trim()}`] : []),
      ],
    };
    setProfile(updated);
    // Session creation will be attempted when org type is also selected
    // For now, the seller can proceed with profiling
  }, [profile, newLeadName, newLeadCompany, newLeadNote]);

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

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col">
      <CopilotTopBar
        profile={profile}
        sessionCreating={sessionCreating}
        canFinalize={Boolean(canFinalize)}
        finalizing={finalizeMutation.isPending}
        onFinalize={() => finalizeMutation.mutate()}
      />

      <div className="flex-1 overflow-hidden">
        <div className="h-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-0">

          {/* LEFT — Conversation */}
          <div className="lg:col-span-3 overflow-y-auto border-r border-border p-4 space-y-3">

            {/* ENTRY MODE SELECTOR */}
            {entryMode === null && (
              <Card className="border-primary/30 shadow-sm">
                <CardContent className="pt-5 pb-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">¿Cómo quieres comenzar?</h3>
                  <p className="text-xs text-muted-foreground">Puedes trabajar con una organización ya registrada o iniciar un perfil comercial desde cero.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      onClick={() => setEntryMode('existing')}
                      className="text-left rounded-lg border border-border bg-background hover:bg-muted/40 px-4 py-3 transition-all"
                    >
                      <span className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-primary" />
                        Organización existente
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        Seleccionar de la base de datos
                      </span>
                    </button>
                    <button
                      onClick={() => setEntryMode('new_lead')}
                      className="text-left rounded-lg border border-border bg-background hover:bg-muted/40 px-4 py-3 transition-all"
                    >
                      <span className="text-sm font-medium text-foreground flex items-center gap-2">
                        <UserPlus className="h-4 w-4 text-primary" />
                        Lead nuevo
                      </span>
                      <span className="text-[11px] text-muted-foreground mt-0.5 block">
                        Iniciar perfil comercial desde cero
                      </span>
                    </button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* NEW LEAD SETUP */}
            {entryMode === 'new_lead' && !orgTypeSelected && (
              <Card className="border-primary/30 shadow-sm animate-in fade-in-50 slide-in-from-bottom-2">
                <CardContent className="pt-4 pb-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Nuevo lead
                  </h3>
                  <p className="text-xs text-muted-foreground">Ingresa la información básica del contacto. Puedes completar lo que falte durante el diagnóstico.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Nombre del contacto</Label>
                      <Input
                        value={newLeadName}
                        onChange={e => setNewLeadName(e.target.value)}
                        placeholder="Ej: María López"
                        className="text-sm"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Empresa / Organización</Label>
                      <Input
                        value={newLeadCompany}
                        onChange={e => setNewLeadCompany(e.target.value)}
                        placeholder="Ej: Cooperativa El Roble"
                        className="text-sm"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Observación inicial (opcional)</Label>
                    <Textarea
                      rows={2}
                      value={newLeadNote}
                      onChange={e => setNewLeadNote(e.target.value)}
                      placeholder="Ej: Llegó por referencia de IHCAFE, interesado en EUDR…"
                      className="text-sm"
                    />
                  </div>

                  {/* Org type within the same card for new leads */}
                  <div className="pt-2 border-t border-border space-y-2">
                    <Label className="text-xs text-muted-foreground">Tipo de organización</Label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {ORG_TYPES.map((t) => (
                        <button
                          key={t.value}
                          onClick={() => {
                            handleNewLeadConfirm();
                            handleOrgTypeSelect(t.value);
                          }}
                          className="text-left rounded-lg border border-border bg-background hover:bg-muted/40 px-3 py-2 transition-all"
                        >
                          <span className="text-xs font-medium text-foreground">{t.value === 'aggregator' ? 'Comercializador / Trader' : t.label}</span>
                          <span className="text-[10px] text-muted-foreground block">{t.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EXISTING ORG: ORG TYPE SELECTOR */}
            {entryMode === 'existing' && !orgTypeSelected && (
              <Card className="border-primary/30 shadow-sm animate-in fade-in-50 slide-in-from-bottom-2">
                <CardContent className="pt-4 pb-3 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">¿Qué tipo de organización es?</h3>
                  <p className="text-xs text-muted-foreground">Todo el diagnóstico se adapta a partir de aquí.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {ORG_TYPES.map((t) => (
                      <button
                        key={t.value}
                        onClick={() => handleOrgTypeSelect(t.value)}
                        className="text-left rounded-lg border border-border bg-background hover:bg-muted/40 px-3 py-2.5 transition-all"
                      >
                        <span className="text-sm font-medium text-foreground">
                          {t.value === 'aggregator' ? 'Comercializador / Trader' : t.label}
                        </span>
                        <span className="text-[11px] text-muted-foreground block">{t.description}</span>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* EXISTING ORG: ORG SELECTOR */}
            {entryMode === 'existing' && orgTypeSelected && !orgSelected && (
              <Card className="border-primary/30 shadow-sm animate-in fade-in-50 slide-in-from-bottom-2">
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
                    <Select value={profile.organization_id ?? ''} onValueChange={handleOrgSelect}>
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
                </CardContent>
              </Card>
            )}

            {/* Setup confirmation for existing org */}
            {entryMode === 'existing' && orgSelected && profile.organization_name && answered.length === 0 && nextQuestions.length > 0 && (
              <div className="flex items-center gap-2 rounded-md bg-primary/5 px-3 py-2 text-xs text-primary">
                <Check className="h-3 w-3" />
                <span>{profile.organization_name} · {ORG_TYPE_LABELS[profile.organization_type ?? ''] ?? profile.organization_type}</span>
              </div>
            )}

            {/* New lead: session notice */}
            {entryMode === 'new_lead' && orgTypeSelected && !sessionId && !sessionCreating && (
              <div className="rounded-md bg-muted/50 border border-border px-3 py-2.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-foreground">Modo descubrimiento:</span>{' '}
                Puedes perfilar al lead ahora. La sesión se creará cuando se vincule a una organización en el sistema.
              </div>
            )}

            {/* ANSWERED HISTORY — compact */}
            {answered.length > 0 && (
              <div className="space-y-1">
                {answered.map((a) => (
                  <div key={a.questionId} className="flex items-baseline gap-2 px-1 py-1 text-xs">
                    <Check className="h-2.5 w-2.5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground truncate">{a.questionTitle}:</span>
                    <span className="font-medium text-foreground truncate">{humanizeValue(a.value)}</span>
                  </div>
                ))}
              </div>
            )}

            {/* ACTIVE QUESTION — single */}
            {discoveryStarted && nextQuestions.map((q) => (
              <DiagnosticInputCard
                key={q.id}
                question={q}
                onSubmit={(value, note) => handleAnswer(q.id, q.title, value, note)}
                isFirst
              />
            ))}

            {/* COMPLETION */}
            {discoveryStarted && nextQuestions.length === 0 && answered.length > 0 && (
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-6 text-center space-y-2">
                  <Sparkles className="h-6 w-6 text-primary mx-auto" />
                  <p className="text-sm font-semibold text-foreground">Diagnóstico completo</p>
                  <p className="text-xs text-muted-foreground">
                    {answered.length} respuestas · {profile.signals.length} señales detectadas
                  </p>
                  {sessionId ? (
                    <Button
                      size="sm"
                      onClick={() => finalizeMutation.mutate()}
                      disabled={finalizeMutation.isPending}
                      className="mt-2 gap-1.5"
                    >
                      {finalizeMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                      Finalizar y ver resultados
                    </Button>
                  ) : (
                    <p className="text-[11px] text-muted-foreground mt-2">
                      Para finalizar, vincula este lead a una organización del sistema.
                    </p>
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
