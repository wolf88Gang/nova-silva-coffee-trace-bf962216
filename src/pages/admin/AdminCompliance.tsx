/**
 * Admin Compliance Hub — Uses adapter layer.
 * TODO: Replace mock data with ag_nut_plan_audit_events, ag_support_tickets when ready.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield, CheckCircle2, AlertTriangle, FileText, Lock, Eye,
} from 'lucide-react';
import {
  MetricCard, SectionHeader, SearchInput, EmptyState, StatusBadge,
  PendingIntegration, DataSourceBadge, LimitedDataNotice,
} from '@/components/admin/shared/AdminComponents';
import { useAdminComplianceData } from '@/hooks/useAdminDataAdapters';
import { getSeverityVariant, type MockComplianceIssue } from '@/lib/adminMockData';

function ComplianceIssueRow({ issue }: { issue: MockComplianceIssue }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
      <AlertTriangle className={`h-4 w-4 shrink-0 mt-0.5 ${issue.severity === 'critical' || issue.severity === 'high' ? 'text-destructive' : 'text-warning'}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-foreground">{issue.type}</p>
          <Badge variant={getSeverityVariant(issue.severity)} className="capitalize text-xs">{issue.severity}</Badge>
          <StatusBadge status={issue.status === 'resolved' ? 'ok' : issue.status === 'investigating' ? 'warning' : 'error'} label={issue.status === 'resolved' ? 'Resuelto' : issue.status === 'investigating' ? 'Investigando' : 'Pendiente'} />
        </div>
        <p className="text-xs text-muted-foreground">{issue.description}</p>
        <p className="text-xs text-muted-foreground mt-1"><span className="font-medium">{issue.orgName}</span> . {issue.date}</p>
        <p className="text-xs text-primary mt-1">Recomendación: {issue.recommendedAction}</p>
      </div>
    </div>
  );
}

export default function AdminCompliance() {
  const compliance = useAdminComplianceData();
  const [search, setSearch] = useState('');
  const [filterSeverity, setFilterSeverity] = useState('all');

  const filteredIssues = compliance.issues
    .filter(ci => filterSeverity === 'all' || ci.severity === filterSeverity)
    .filter(ci => ci.orgName.toLowerCase().includes(search.toLowerCase()) || ci.type.toLowerCase().includes(search.toLowerCase()));

  const pendingCount = compliance.issues.filter(ci => ci.status !== 'resolved').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Cumplimiento e Integridad"
        subtitle="Garante de verdad: integridad criptográfica, trazabilidad y cumplimiento regulatorio"
        actions={
          <div className="flex items-center gap-2">
            <DataSourceBadge source="mock" />
          </div>
        }
      />

      <PendingIntegration feature="Eventos de auditoría reales (ag_nut_plan_audit_events, ag_support_tickets)" />

      <Tabs defaultValue="integridad">
        <TabsList className="grid grid-cols-5 max-w-2xl">
          <TabsTrigger value="integridad">Integridad</TabsTrigger>
          <TabsTrigger value="documental">Documental</TabsTrigger>
          <TabsTrigger value="eudr">EUDR</TabsTrigger>
          <TabsTrigger value="auditoria">Auditoría</TabsTrigger>
          <TabsTrigger value="cola">Cola de revisión <Badge variant="secondary" className="ml-1.5 text-xs">{pendingCount}</Badge></TabsTrigger>
        </TabsList>

        <TabsContent value="integridad" className="mt-4 space-y-4">
          <LimitedDataNotice message="Métricas de integridad pendientes de integración con backend de auditoría" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Registros verificados" value={`${compliance.integrity.verifiedRecords}%`} icon={CheckCircle2} source="mock" />
            <MetricCard label="Hashes SHA-256 válidos" value={`${compliance.integrity.validHashes}%`} icon={Lock} source="mock" />
            <MetricCard label="Mismatch detectados" value={compliance.integrity.mismatchIncidents} icon={AlertTriangle} source="mock" />
            <MetricCard label="Eventos sin evidencia" value={compliance.integrity.eventsWithoutEvidence} icon={FileText} source="mock" />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Registros con problemas de integridad</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {compliance.issues.filter(ci => ci.type.toLowerCase().includes('hash') || ci.type.toLowerCase().includes('integridad')).map(ci => (
                <ComplianceIssueRow key={ci.id} issue={ci} />
              ))}
              {compliance.issues.filter(ci => ci.type.toLowerCase().includes('hash')).length === 0 && (
                <EmptyState title="Sin problemas de integridad" description="Todos los registros tienen hashes válidos." icon={CheckCircle2} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documental" className="mt-4 space-y-4">
          <LimitedDataNotice message="Conteos documentales pendientes de integración con tablas de parcelas y lotes" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Orgs con faltantes" value={2} icon={AlertTriangle} source="mock" />
            <MetricCard label="Lotes incompletos" value={5} icon={FileText} source="mock" />
            <MetricCard label="Parcelas sin polígono" value={72} icon={Shield} source="mock" />
            <MetricCard label="Dossiers con advertencias" value={compliance.eudr.withGaps} icon={Eye} source="mock" />
          </div>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Incidencias documentales</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {compliance.issues.filter(ci => ci.type.includes('Parcela') || ci.type.includes('Evidencia') || ci.type.includes('Dossier') || ci.type.includes('Trazabilidad')).length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="No se encontraron incidencias documentales." icon={CheckCircle2} />
              ) : (
                compliance.issues.filter(ci => ci.type.includes('Parcela') || ci.type.includes('Evidencia') || ci.type.includes('Dossier') || ci.type.includes('Trazabilidad')).map(ci => (
                  <ComplianceIssueRow key={ci.id} issue={ci} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="eudr" className="mt-4 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Shield className="h-4 w-4" /> Estado EUDR global</CardTitle>
                <DataSourceBadge source="mock" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-4 rounded-lg bg-primary/10 border border-primary/20 text-center">
                  <p className="text-2xl font-bold text-primary">{compliance.eudr.generated}</p>
                  <p className="text-xs text-muted-foreground mt-1">Dossiers generados</p>
                </div>
                <div className="p-4 rounded-lg bg-success/10 border border-success/20 text-center">
                  <p className="text-2xl font-bold text-success">{compliance.eudr.approvable}</p>
                  <p className="text-xs text-muted-foreground mt-1">Aprobables</p>
                </div>
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-center">
                  <p className="text-2xl font-bold text-destructive">{compliance.eudr.atRisk}</p>
                  <p className="text-xs text-muted-foreground mt-1">En riesgo</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 text-center">
                  <p className="text-2xl font-bold text-warning">{compliance.eudr.withGaps}</p>
                  <p className="text-xs text-muted-foreground mt-1">Con brechas</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-sm">Organizaciones con brechas EUDR</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {compliance.issues.filter(ci => ci.type.includes('EUDR')).length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="Sin brechas EUDR activas." icon={CheckCircle2} />
              ) : (
                compliance.issues.filter(ci => ci.type.includes('EUDR')).map(ci => (
                  <ComplianceIssueRow key={ci.id} issue={ci} />
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="auditoria" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Eye className="h-4 w-4" /> Auditoría y trazabilidad</CardTitle>
                <DataSourceBadge source="mock" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {compliance.auditLog.length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="Sin eventos de auditoría registrados." />
              ) : (
                compliance.auditLog.map(e => {
                  const color = e.severity === 'ok' ? 'border-l-success bg-success/5' :
                    e.severity === 'warning' ? 'border-l-warning bg-warning/5' : 'border-l-destructive bg-destructive/5';
                  const iconColor = e.severity === 'ok' ? 'text-success' : e.severity === 'warning' ? 'text-warning' : 'text-destructive';
                  const Icon = e.severity === 'ok' ? CheckCircle2 : AlertTriangle;
                  return (
                    <div key={e.id} className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${color}`}>
                      <Icon className={`h-4 w-4 shrink-0 ${iconColor}`} />
                      <div className="flex-1"><p className="text-sm text-foreground">{e.event}</p></div>
                      <span className="text-xs text-muted-foreground shrink-0">{e.time}</span>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cola" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar incidencia..." />
            <select value={filterSeverity} onChange={e => setFilterSeverity(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">Todas las severidades</option>
              <option value="critical">Critica</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </div>
          <Card>
            <CardContent className="pt-4 space-y-2">
              {filteredIssues.length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="No hay incidencias que coincidan con los filtros." icon={CheckCircle2} />
              ) : (
                filteredIssues.map(ci => <ComplianceIssueRow key={ci.id} issue={ci} />)
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
