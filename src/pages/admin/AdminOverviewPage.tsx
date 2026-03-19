import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MetricCard } from '@/components/admin/MetricCard';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import {
  Activity,
  AlertTriangle,
  DollarSign,
  Building2,
  Users,
  Clock,
  TrendingUp,
  Shield,
  ArrowRight,
} from 'lucide-react';
import { useAdminOverview } from '@/hooks/admin/useAdminOverview';
import { DegradedModeBanner } from '@/components/admin/DegradedModeBanner';
import { AdminErrorAlert } from '@/components/admin/AdminErrorAlert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdminOverviewPage() {
  const { organizations, revenue, compliance, platformStatus } = useAdminOverview();
  const platformResult = platformStatus.data;
  const revenueResult = revenue.data;
  const orgsResult = organizations.data;
  const complianceResult = compliance.data;
  const platformStatusData = platformResult?.data;
  const revenueData = revenueResult?.data;
  const organizationsData = orgsResult?.data ?? [];
  const complianceIssues = complianceResult?.data ?? [];
  const isDegraded = !!(platformResult?.isFallback || revenueResult?.isFallback || orgsResult?.isFallback || complianceResult?.isFallback);

  const hasError = organizations.isError || revenue.isError || compliance.isError || platformStatus.isError;
  const criticalAlerts = (complianceIssues ?? []).filter(
    (i) => i.severity === 'critical' || i.severity === 'high'
  );
  const orgsWithActivity = organizationsData?.filter((o) => o.lastActivityAt) ?? [];
  const recentOrgs = orgsWithActivity.slice(0, 5);

  return (
    <div className="space-y-6">
      <AdminErrorAlert visible={hasError} />
      <DegradedModeBanner visible={isDegraded} />
      {/* Estado global */}
      <Alert
        className={
          platformStatusData === 'critical'
            ? 'border-destructive bg-destructive/10'
            : platformStatusData === 'degraded'
              ? 'border-amber-500 bg-amber-500/10'
              : 'border-green-500/50 bg-green-500/5'
        }
      >
        <Activity className="h-4 w-4" />
        <AlertTitle>
          Plataforma {platformStatusData === 'operational' ? 'Operativa' : platformStatusData === 'degraded' ? 'Degradación parcial' : platformStatusData === 'critical' ? 'Incidente crítico' : 'Operativa'}
        </AlertTitle>
        <AlertDescription>
          {(!platformStatusData || platformStatusData === 'operational') && 'Todos los servicios operativos. Edge Functions y sync sin incidencias recientes.'}
          {platformStatusData === 'degraded' && 'Edge Functions con latencia elevada. Monitorear generate_nutrition_plan_v1.'}
          {platformStatusData === 'critical' && 'Servicio afectado. Revisar estado en /admin/platform.'}
        </AlertDescription>
        <Link to="/admin/platform" className="mt-2 inline-block">
          <Button variant="outline" size="sm">
            Ver estado detallado
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </Alert>

      {/* Revenue snapshot */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <MetricCard label="MRR" value={`$${revenueData?.mrr?.toLocaleString() ?? '—'}`} icon={DollarSign} />
        <MetricCard label="Clientes activos" value={revenueData?.activeClients ?? '—'} icon={Building2} />
        <MetricCard label="Trials activos" value={revenueData?.trialsActive ?? '—'} icon={TrendingUp} variant="success" />
        <MetricCard label="Cuentas vencidas" value={revenueData?.overdueAccounts ?? '—'} icon={AlertTriangle} variant={revenueData?.overdueAccounts ? 'danger' : 'default'} />
        <MetricCard label="Cobranzas pendientes" value={`$${revenueData?.pendingCollections?.toLocaleString() ?? '—'}`} icon={DollarSign} variant={revenueData?.pendingCollections ? 'warning' : 'default'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actividad reciente */}
        <SectionCard title="Actividad reciente" description="Organizaciones con actividad hoy">
          <div className="space-y-2">
            {recentOrgs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
            ) : (
              recentOrgs.map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2 rounded-md bg-muted/30">
                  <div>
                    <p className="text-sm font-medium">{o.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.lastActivityAt ? format(new Date(o.lastActivityAt), "d MMM HH:mm", { locale: es }) : '—'}
                    </p>
                  </div>
                  <Link to={`/admin/organizations/${o.id}`}>
                    <Button variant="ghost" size="sm">
                      Ver
                    </Button>
                  </Link>
                </div>
              ))
            )}
          </div>
          <Link to="/admin/organizations" className="mt-4 inline-block">
            <Button variant="outline" size="sm">
              Ver todas las organizaciones
            </Button>
          </Link>
        </SectionCard>

        {/* Riesgo operativo */}
        <SectionCard title="Riesgo operativo" description="Organizaciones con mora o sin actividad">
          <div className="space-y-2">
            {(organizationsData ?? [])
              .filter((o) => o.status === 'vencido' || o.riskLevel === 'high')
              .slice(0, 5)
              .map((o) => (
                <div key={o.id} className="flex items-center justify-between p-2 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <div>
                    <p className="text-sm font-medium">{o.name}</p>
                    <p className="text-xs text-muted-foreground">{o.status} · Riesgo {o.riskLevel}</p>
                  </div>
                  <Link to={`/admin/organizations/${o.id}`}>
                    <Button variant="outline" size="sm">
                      Acción
                    </Button>
                  </Link>
                </div>
              ))}
            {!organizationsData?.some((o) => o.status === 'vencido' || o.riskLevel === 'high') && (
              <p className="text-sm text-muted-foreground">Sin alertas de riesgo.</p>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Alertas críticas */}
      <SectionCard
        title="Alertas críticas"
        description="Acciones prioritarias"
        actions={
          criticalAlerts.length > 0 && (
            <StatusBadge label={`${criticalAlerts.length} pendientes`} variant="danger" />
          )
        }
      >
        <div className="space-y-3">
          {criticalAlerts.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin alertas críticas.</p>
          ) : (
            criticalAlerts.slice(0, 5).map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-md bg-muted/50">
                <div>
                  <p className="text-sm font-medium">{a.organizationName}</p>
                  <p className="text-xs text-muted-foreground">{a.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge label={a.severity} variant={a.severity === 'critical' ? 'danger' : 'warning'} />
                  {a.actionRoute && (
                    <Link to={a.actionRoute}>
                      <Button size="sm">{a.actionLabel ?? 'Ver'}</Button>
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>
    </div>
  );
}
