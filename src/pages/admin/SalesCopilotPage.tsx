/**
 * SalesCopilotPage — PRIMARY entry /admin/sales/new.
 * Session setup → Commercial Copilot (CopilotLayout).
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
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
import { LeadProfileProvider, useLeadProfile } from '@/contexts/LeadProfileContext';
import { useCopilotDiagnostic } from '@/hooks/useCopilotDiagnostic';
import { useAdminOrganizations } from '@/hooks/admin/useAdminOrganizations';
import { useToast } from '@/hooks/use-toast';
import { CopilotLayout } from '@/components/sales/copilot/CopilotLayout';
import { Loader2, AlertCircle, Play } from 'lucide-react';

function SalesCopilotInner() {
  const orgsQuery = useAdminOrganizations();
  const orgs = orgsQuery.data?.data ?? [];
  const isFallbackOrgs = orgsQuery.data?.isFallback ?? false;
  const { toast } = useToast();
  const { reset: resetProfile } = useLeadProfile();

  const copilot = useCopilotDiagnostic();
  const {
    sessionId,
    flowState,
    questions,
    answers,
    isLoading,
    error,
    createSession,
    saveAnswer,
    skipQuestion,
    finalizeSession,
    reset: resetCopilot,
  } = copilot;

  const [organizationId, setOrganizationId] = useState('');
  const [leadName, setLeadName] = useState('');
  const [leadCompany, setLeadCompany] = useState('');
  const [leadType, setLeadType] = useState('cooperativa');
  const [sessionContext, setSessionContext] = useState<{
    orgName: string;
    leadName?: string;
    leadCompany?: string;
  } | null>(null);

  const orgName = sessionContext?.orgName ?? orgs.find((o) => o.id === organizationId)?.name;

  const handleStart = async () => {
    if (!organizationId) {
      toast({ title: 'Selecciona una organización', variant: 'destructive' });
      return;
    }
    if (isFallbackOrgs) {
      toast({ title: 'Backend no disponible', variant: 'destructive' });
      return;
    }
    const org = orgs.find((o) => o.id === organizationId);
    resetProfile();
    resetCopilot();
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
    }
  };

  return (
    <div className="space-y-4">
      <AdminPageHeader
        title="Sales Intelligence"
        description="Copilot comercial — diagnóstico con interpretación en vivo"
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/admin/sales/legacy-wizard">Vista legado</Link>
          </Button>
        }
      />

      {isFallbackOrgs && orgs.length > 0 && (
        <Alert variant="destructive" className="py-2">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Organizaciones en modo mock.</AlertDescription>
        </Alert>
      )}

      {!sessionId ? (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto_auto_auto] sm:items-end">
              <div className="space-y-1.5">
                <Label className="text-xs">Cuenta</Label>
                <Select value={organizationId} onValueChange={setOrganizationId}>
                  <SelectTrigger className="h-9">
                    <SelectValue placeholder="Organización" />
                  </SelectTrigger>
                  <SelectContent>
                    {orgs.map((o) => (
                      <SelectItem key={o.id} value={o.id}>
                        {o.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Lead</Label>
                <Input className="h-9" value={leadName} onChange={(e) => setLeadName(e.target.value)} placeholder="Nombre" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Empresa</Label>
                <Input className="h-9" value={leadCompany} onChange={(e) => setLeadCompany(e.target.value)} placeholder="Opcional" />
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
              <Button onClick={handleStart} disabled={!organizationId || isLoading || isFallbackOrgs} size="sm" className="h-9">
                {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                Iniciar
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <CopilotLayout
          orgName={orgName ?? 'Organización'}
          leadName={sessionContext?.leadName}
          leadCompany={sessionContext?.leadCompany}
          leadType={leadType}
          sessionId={sessionId}
          flowState={flowState}
          questions={questions}
          answers={answers}
          isLoading={isLoading}
          error={error}
          saveAnswer={saveAnswer}
          skipQuestion={skipQuestion}
          finalizeSession={finalizeSession}
        />
      )}
    </div>
  );
}

export default function SalesCopilotPage() {
  return (
    <LeadProfileProvider>
      <SalesCopilotInner />
    </LeadProfileProvider>
  );
}
