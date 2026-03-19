import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { ConfidentialityNotice } from '@/components/admin/ConfidentialityNotice';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminCompliance, useAdminComplianceMetrics } from '@/hooks/admin/useAdminCompliance';
import { DegradedModeBanner } from '@/components/admin/DegradedModeBanner';
import { AdminErrorAlert } from '@/components/admin/AdminErrorAlert';
import { LimitedDataNotice } from '@/components/admin/LimitedDataNotice';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SEVERITY_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  critical: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
};

export default function AdminCompliancePage() {
  const complianceQuery = useAdminCompliance();
  const metricsQuery = useAdminComplianceMetrics();
  const result = complianceQuery.data;
  const metricsResult = metricsQuery.data;
  const issues = result?.data ?? [];
  const metrics = metricsResult?.data;
  const isDegraded = result?.isFallback ?? false;
  const isLoading = complianceQuery.isLoading;

  const openIssues = issues.filter((i) => i.status !== 'resolved');
  const metricsError = metricsQuery.isError;
  const metricsLoading = metricsQuery.isLoading;
  const issuesError = complianceQuery.isError;
  const hasError = metricsError || issuesError;

  return (
    <div className="space-y-6">
      <AdminErrorAlert visible={hasError} />
      <DegradedModeBanner visible={isDegraded} />
      <AdminPageHeader
        title="Cumplimiento"
        description="Integridad, trazabilidad y auditoría"
      />

      <ConfidentialityNotice prominent />

      <LimitedDataNotice
        title="Datos limitados"
        description="Integridad de datos y estado regulatorio EUDR pendientes de integración. Facturación y parcelas desde fuentes reales."
      />


      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SectionCard title="Facturas vencidas" description="Invoices overdue">
          {metricsLoading ? (
            <p className="text-2xl font-bold text-muted-foreground">…</p>
          ) : (
            <>
              <p className="text-2xl font-bold">{metrics?.invoices_overdue_count ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Fuente: invoices</p>
            </>
          )}
        </SectionCard>
        <SectionCard title="Facturas pendientes" description="Invoices issued sin pagar">
          {metricsLoading ? (
            <p className="text-2xl font-bold text-muted-foreground">…</p>
          ) : (
            <>
              <p className="text-2xl font-bold">{metrics?.invoices_pending_count ?? '—'}</p>
              <p className="text-xs text-muted-foreground mt-1">Fuente: invoices</p>
            </>
          )}
        </SectionCard>
        <SectionCard title="Parcelas sin polígono" description="Parcelas sin poligono_geojson">
          {metricsLoading ? (
            <p className="text-2xl font-bold text-muted-foreground">…</p>
          ) : metrics?.parcelas_sin_poligono_status === 'real' ? (
            <>
              <p className="text-2xl font-bold">{metrics.parcelas_sin_poligono_count ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Fuente: parcelas</p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-muted-foreground">—</p>
              <p className="text-xs text-muted-foreground mt-1">Pendiente de integración</p>
            </>
          )}
        </SectionCard>
        <SectionCard title="Integridad de datos" description="Registros verificados">
          <p className="text-2xl font-bold text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground mt-1">Pendiente de integración</p>
        </SectionCard>
        <SectionCard title="Estado regulatorio EUDR" description="Conformidad">
          <p className="text-2xl font-bold text-muted-foreground">—</p>
          <p className="text-xs text-muted-foreground mt-1">Pendiente de integración</p>
        </SectionCard>
      </div>

      <SectionCard
        title="Cola de revisión"
        description="Issues abiertos por severidad"
        actions={openIssues.length > 0 && <StatusBadge label={`${openIssues.length} abiertos`} variant="warning" />}
      >
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Severidad</TableHead>
                <TableHead>Organización</TableHead>
                <TableHead>Categoría</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((i) => (
                <TableRow key={i.id}>
                  <TableCell>
                    <StatusBadge label={i.severity} variant={SEVERITY_VARIANT[i.severity]} />
                  </TableCell>
                  <TableCell className="font-medium">{i.organizationName}</TableCell>
                  <TableCell>{i.category}</TableCell>
                  <TableCell className="max-w-xs truncate">{i.description}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">{format(new Date(i.createdAt), "d MMM yyyy", { locale: es })}</TableCell>
                  <TableCell>{i.status}</TableCell>
                  <TableCell>
                    {i.actionRoute && (
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={i.actionRoute}>{i.actionLabel ?? 'Ver'}</Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </SectionCard>
    </div>
  );
}
