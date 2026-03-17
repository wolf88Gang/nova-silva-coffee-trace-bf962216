/**
 * Admin Overview — Control Tower
 * The most important page: real-time operational status of the entire platform.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, AlertTriangle, ArrowRight, Building2, CheckCircle2, CreditCard,
  DollarSign, FileText, Map, RefreshCw, Shield, TrendingUp,
  Users, XCircle, Zap, Wallet,
} from 'lucide-react';
import { useAdminKPIs, useSystemHealth } from '@/hooks/useAdminData';
import { MetricCard, AlertList, SectionHeader } from '@/components/admin/shared/AdminComponents';
import {
  MOCK_REVENUE, MOCK_ALERTS, MOCK_ORGS,
} from '@/lib/adminMockData';
import { useNavigate } from 'react-router-dom';

// ── Status Banner ──

function StatusBanner({ checks }: { checks: ReturnType<typeof useSystemHealth>['data'] }) {
  if (!checks) return <Skeleton className="h-14 w-full rounded-xl" />;
  const hasError = checks.some(c => c.status === 'error');
  const hasWarning = checks.some(c => (c.latencyMs ?? 0) > 500);
  const status = hasError ? 'critical' : hasWarning ? 'degraded' : 'operational';
  const config = {
    operational: { bg: 'bg-success/10 border-success/25', text: 'text-success', icon: CheckCircle2, label: 'Plataforma operativa', dot: 'bg-success' },
    degraded: { bg: 'bg-warning/10 border-warning/25', text: 'text-warning', icon: AlertTriangle, label: 'Degradación parcial', dot: 'bg-warning' },
    critical: { bg: 'bg-destructive/10 border-destructive/25', text: 'text-destructive', icon: XCircle, label: 'Incidente crítico', dot: 'bg-destructive' },
  }[status];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-3 px-5 py-3.5 rounded-xl border ${config.bg}`}>
      <span className="relative flex h-2.5 w-2.5 shrink-0">
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${config.dot} opacity-75`} />
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${config.dot}`} />
      </span>
      <Icon className={`h-5 w-5 shrink-0 ${config.text}`} />
      <span className={`font-semibold text-sm ${config.text}`}>{config.label}</span>
      <span className="text-xs text-muted-foreground ml-auto">
        {checks.filter(c => c.status === 'ok').length}/{checks.length} servicios activos
      </span>
      <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => {}}>
        Ver detalles <ArrowRight className="h-3 w-3" />
      </Button>
    </div>
  );
}

// ── Activity Row ──

function ActivityRow({ label, value, icon: Icon }: { label: string; value: string | number; icon: React.ElementType }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40">
      <div className="flex items-center gap-2.5">
        <Icon className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-foreground">{label}</span>
      </div>
      <span className="font-semibold text-foreground tabular-nums">{typeof value === 'number' ? value.toLocaleString() : value}</span>
    </div>
  );
}

// ── Risk Row ──

function RiskRow({ label, value, severity }: { label: string; value: number; severity: 'high' | 'medium' | 'low' }) {
  return (
    <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40">
      <span className="text-sm text-foreground">{label}</span>
      <Badge variant={severity === 'high' ? 'destructive' : severity === 'medium' ? 'secondary' : 'outline'}>
        {value}
      </Badge>
    </div>
  );
}

// ── Accounts Summary ──

function AccountsSummary() {
  const navigate = useNavigate();
  const active = MOCK_ORGS.filter(o => o.status === 'active').length;
  const trial = MOCK_ORGS.filter(o => o.status === 'trial').length;
  const suspended = MOCK_ORGS.filter(o => o.status === 'suspended').length;
  const overdue = MOCK_ORGS.filter(o => o.billing.pendingBalance > 0).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /> Cuentas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20 text-center cursor-pointer hover:bg-success/15 transition-colors" onClick={() => navigate('/admin/organizations')}>
            <p className="text-xl font-bold text-success">{active}</p>
            <p className="text-xs text-muted-foreground">Activas</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20 text-center cursor-pointer hover:bg-primary/15 transition-colors" onClick={() => navigate('/admin/organizations')}>
            <p className="text-xl font-bold text-primary">{trial}</p>
            <p className="text-xs text-muted-foreground">En trial</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-center cursor-pointer hover:bg-destructive/15 transition-colors" onClick={() => navigate('/admin/organizations')}>
            <p className="text-xl font-bold text-destructive">{suspended}</p>
            <p className="text-xs text-muted-foreground">Suspendidas</p>
          </div>
          <div className="p-3 rounded-lg bg-warning/10 border border-warning/20 text-center cursor-pointer hover:bg-warning/15 transition-colors" onClick={() => navigate('/admin/billing')}>
            <p className="text-xl font-bold text-warning">{overdue}</p>
            <p className="text-xs text-muted-foreground">Con mora</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ── Main ──

export default function AdminOverview() {
  const kpis = useAdminKPIs();
  const health = useSystemHealth();

  // Derived mock activity data
  const totalProducers = MOCK_ORGS.reduce((s, o) => s + o.usage.producers, 0);
  const totalPlots = MOCK_ORGS.reduce((s, o) => s + o.usage.plots, 0);
  const totalDossiers = MOCK_ORGS.reduce((s, o) => s + o.usage.dossiers, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Control Tower"
        subtitle="Estado operativo de Nova Silva Platform"
        actions={
          <Button variant="outline" size="sm" onClick={() => health.refetch()} className="gap-1.5">
            <RefreshCw className="h-3.5 w-3.5" /> Actualizar
          </Button>
        }
      />

      {/* Global status banner */}
      <StatusBanner checks={health.data} />

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="MRR" value={`$${MOCK_REVENUE.mrr.toLocaleString()}`} icon={DollarSign} trend="up" sublabel="Monthly recurring" />
        <MetricCard label="ARR proyectado" value={`$${MOCK_REVENUE.arrProjected.toLocaleString()}`} icon={TrendingUp} />
        <MetricCard label="Cobrado este mes" value={`$${MOCK_REVENUE.collectedThisMonth.toLocaleString()}`} icon={Wallet} />
        <MetricCard label="Cuentas por cobrar" value={`$${MOCK_REVENUE.accountsReceivable.toLocaleString()}`} icon={CreditCard} sublabel={MOCK_REVENUE.accountsReceivable > 0 ? 'Requiere atención' : ''} />
        <MetricCard label="Organizaciones" value={kpis.orgCount} icon={Building2} loading={kpis.isLoading} />
        <MetricCard label="Usuarios" value={kpis.userCount} icon={Users} loading={kpis.isLoading} />
      </div>

      {/* Activity + Accounts + Risk */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ActivityRow label="Productores activos" value={totalProducers} icon={Users} />
            <ActivityRow label="Parcelas registradas" value={totalPlots} icon={Map} />
            <ActivityRow label="Dossiers EUDR" value={totalDossiers} icon={FileText} />
            <ActivityRow label="Orgs con uso hoy" value={MOCK_ORGS.filter(o => o.lastActivity.includes('h') || o.lastActivity.includes('min')).length} icon={Building2} />
          </CardContent>
        </Card>

        <AccountsSummary />

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning" /> Riesgo operativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <RiskRow label="Orgs con pago atrasado" value={MOCK_ORGS.filter(o => o.billing.pendingBalance > 0).length} severity="high" />
            <RiskRow label="Orgs sin actividad reciente" value={MOCK_ORGS.filter(o => o.lastActivity.includes('d')).length} severity="medium" />
            <RiskRow label="Errores de integridad" value={2} severity="high" />
            <RiskRow label="Lotes con riesgo" value={5} severity="medium" />
          </CardContent>
        </Card>
      </div>

      {/* Critical alerts */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-destructive" /> Alertas críticas</CardTitle>
            <Badge variant="outline">{MOCK_ALERTS.length}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <AlertList alerts={MOCK_ALERTS} />
        </CardContent>
      </Card>
    </div>
  );
}
