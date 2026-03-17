/**
 * Admin Overview — Control Tower
 * Answers: Is the platform working? Are data trustworthy? Who's using what? Revenue? Risks?
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Activity, AlertTriangle, Building2, CheckCircle2, DollarSign,
  FileText, Leaf, Map, RefreshCw, Shield, TrendingUp, Users, XCircle, Zap,
} from 'lucide-react';
import { useAdminKPIs, useSystemHealth } from '@/hooks/useAdminData';

// ── Mock data for features not yet backed by DB ──
const MOCK_REVENUE = { mrr: 4_250, arr: 51_000, active: 3, trial: 1, expired: 0 };
const MOCK_ACTIVITY = { activeProducers: 620, activePlots: 1_140, dossiers: 87, guardDiagnostics: 34 };
const MOCK_RISK = { noEvidence: 12, noPolygon: 8, incompleteTraceability: 5 };
const MOCK_ALERTS = [
  { id: 1, level: 'critical' as const, message: 'Org "Cooperativa Demo" sin pago hace 15 días', time: 'Hace 2h' },
  { id: 2, level: 'warning' as const, message: 'Alta tasa de error en Nova Yield (>5%)', time: 'Hace 6h' },
  { id: 3, level: 'info' as const, message: 'Nuevo trial registrado: Finca El Progreso', time: 'Hace 1d' },
];

function StatusBanner({ checks }: { checks: ReturnType<typeof useSystemHealth>['data'] }) {
  if (!checks) return <Skeleton className="h-14 w-full rounded-xl" />;
  const hasError = checks.some(c => c.status === 'error');
  const hasWarning = checks.some(c => (c.latencyMs ?? 0) > 500);
  const status = hasError ? 'critical' : hasWarning ? 'degraded' : 'operational';
  const config = {
    operational: { color: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400', icon: CheckCircle2, label: '🟢 Plataforma operativa' },
    degraded: { color: 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400', icon: AlertTriangle, label: '🟡 Degradación parcial' },
    critical: { color: 'bg-red-500/15 border-red-500/30 text-red-400', icon: XCircle, label: '🔴 Incidente crítico' },
  }[status];
  const Icon = config.icon;
  return (
    <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${config.color}`}>
      <Icon className="h-5 w-5 shrink-0" />
      <span className="font-semibold text-sm">{config.label}</span>
      <span className="text-xs opacity-70 ml-auto">
        {checks.filter(c => c.status === 'ok').length}/{checks.length} servicios OK
      </span>
    </div>
  );
}

function KPICard({ label, value, icon: Icon, sublabel, trend, loading }: {
  label: string; value: string | number; icon: React.ElementType; sublabel?: string; trend?: 'up' | 'down' | 'neutral'; loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          {trend === 'up' && <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />}
        </div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {sublabel && <p className="text-xs text-muted-foreground mt-0.5">{sublabel}</p>}
      </CardContent>
    </Card>
  );
}

function AlertRow({ alert }: { alert: typeof MOCK_ALERTS[0] }) {
  const colors = {
    critical: 'border-l-red-500 bg-red-500/5',
    warning: 'border-l-yellow-500 bg-yellow-500/5',
    info: 'border-l-blue-500 bg-blue-500/5',
  };
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border-l-4 ${colors[alert.level]}`}>
      <AlertTriangle className={`h-4 w-4 shrink-0 ${
        alert.level === 'critical' ? 'text-red-500' : alert.level === 'warning' ? 'text-yellow-500' : 'text-blue-500'
      }`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground">{alert.message}</p>
      </div>
      <span className="text-xs text-muted-foreground shrink-0">{alert.time}</span>
    </div>
  );
}

export default function AdminOverview() {
  const kpis = useAdminKPIs();
  const health = useSystemHealth();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Control Tower</h1>
          <p className="text-sm text-muted-foreground mt-1">Estado operativo de Nova Silva Platform</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => health.refetch()} className="gap-1.5">
          <RefreshCw className="h-3.5 w-3.5" /> Actualizar
        </Button>
      </div>

      {/* Global status */}
      <StatusBanner checks={health.data} />

      {/* Revenue + Platform KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KPICard label="MRR" value={`$${MOCK_REVENUE.mrr.toLocaleString()}`} icon={DollarSign} sublabel="Monthly recurring" trend="up" />
        <KPICard label="ARR proyectado" value={`$${MOCK_REVENUE.arr.toLocaleString()}`} icon={TrendingUp} />
        <KPICard label="Organizaciones" value={kpis.orgCount} icon={Building2} loading={kpis.isLoading} />
        <KPICard label="Usuarios" value={kpis.userCount} icon={Users} loading={kpis.isLoading} />
        <KPICard label="Cuentas activas" value={MOCK_REVENUE.active} icon={Zap} sublabel={`${MOCK_REVENUE.trial} en trial`} />
        <KPICard label="Admins" value={kpis.adminCount} icon={Shield} loading={kpis.isLoading} />
      </div>

      {/* Activity + Risk side by side */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4 text-primary" /> Actividad</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Productores activos', value: MOCK_ACTIVITY.activeProducers, icon: Users },
              { label: 'Parcelas activas', value: MOCK_ACTIVITY.activePlots, icon: Map },
              { label: 'Dossiers EUDR generados', value: MOCK_ACTIVITY.dossiers, icon: FileText },
              { label: 'Diagnósticos Nova Guard', value: MOCK_ACTIVITY.guardDiagnostics, icon: Shield },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                <div className="flex items-center gap-2">
                  <item.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-foreground">{item.label}</span>
                </div>
                <span className="font-semibold text-foreground">{item.value.toLocaleString()}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Operational risk */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-yellow-500" /> Riesgo operativo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: 'Registros sin evidencia', value: MOCK_RISK.noEvidence, severity: 'high' },
              { label: 'Parcelas sin polígono', value: MOCK_RISK.noPolygon, severity: 'medium' },
              { label: 'Lotes sin trazabilidad completa', value: MOCK_RISK.incompleteTraceability, severity: 'low' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-2 rounded-md bg-muted/40">
                <span className="text-sm text-foreground">{item.label}</span>
                <Badge variant={item.severity === 'high' ? 'destructive' : item.severity === 'medium' ? 'secondary' : 'outline'}>
                  {item.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Critical alerts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Zap className="h-4 w-4 text-red-500" /> Alertas críticas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {MOCK_ALERTS.map(a => <AlertRow key={a.id} alert={a} />)}
        </CardContent>
      </Card>
    </div>
  );
}
