/**
 * Admin Platform — System health & infrastructure observability.
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  CheckCircle2, XCircle, Clock, RefreshCw, Server, HardDrive,
  Cpu, Wifi, AlertTriangle, Activity, ArrowRight,
} from 'lucide-react';
import { useSystemHealth } from '@/hooks/useAdminData';
import { MetricCard, SectionHeader, StatusBadge, HealthIndicator } from '@/components/admin/shared/AdminComponents';
import {
  MOCK_INFRA, MOCK_MODULE_HEALTH, MOCK_HEALTH_TIMELINE,
  type MockModuleHealth,
} from '@/lib/adminMockData';

function ServiceStatus({ checks, isLoading }: { checks: ReturnType<typeof useSystemHealth>['data']; isLoading: boolean }) {
  const statusIcon = (status: string) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-success" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-destructive" />;
    return <Clock className="h-5 w-5 text-muted-foreground animate-spin" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> Estado de servicios</CardTitle></CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-2">
            {(checks ?? []).map(c => (
              <div key={c.service} className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
                {statusIcon(c.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.service}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
                {c.latencyMs !== undefined && (
                  <Badge variant={c.latencyMs < 300 ? 'outline' : c.latencyMs < 800 ? 'secondary' : 'destructive'} className="font-mono text-xs">
                    {c.latencyMs}ms
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ModuleHealthCard({ mod }: { mod: MockModuleHealth }) {
  const statusConfig = {
    stable: { badge: 'ok' as const, label: 'Estable', color: 'border-l-success' },
    degraded: { badge: 'warning' as const, label: 'Degradado', color: 'border-l-warning' },
    offline: { badge: 'error' as const, label: 'Offline', color: 'border-l-destructive' },
    beta: { badge: 'info' as const, label: 'Beta', color: 'border-l-primary' },
  }[mod.status];

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50 border-l-4 ${statusConfig.color}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-foreground">{mod.name}</p>
          <StatusBadge status={statusConfig.badge} label={statusConfig.label} />
        </div>
        <p className="text-xs text-muted-foreground">{mod.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-foreground">{mod.uptime}%</p>
        <p className="text-xs text-muted-foreground">uptime</p>
      </div>
      {mod.lastIncident && (
        <div className="text-right shrink-0">
          <p className="text-xs text-muted-foreground">Último incidente</p>
          <p className="text-xs text-foreground">{mod.lastIncident}</p>
        </div>
      )}
    </div>
  );
}

export default function AdminSystem() {
  const { data: checks, isLoading, refetch, dataUpdatedAt } = useSystemHealth();

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Plataforma & Infraestructura"
        subtitle="Centro de observabilidad interna"
        actions={
          <div className="flex items-center gap-2">
            {dataUpdatedAt > 0 && <span className="text-xs text-muted-foreground">Último check: {new Date(dataUpdatedAt).toLocaleTimeString('es')}</span>}
            <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Actualizar</Button>
          </div>
        }
      />

      {/* Technical metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <MetricCard label="Latencia media" value={`${MOCK_INFRA.avgLatency}ms`} icon={Activity} />
        <MetricCard label="Errores (24h)" value={MOCK_INFRA.errorsLast24h} icon={AlertTriangle} />
        <MetricCard label="Storage" value={`${MOCK_INFRA.storage.used}/${MOCK_INFRA.storage.total} ${MOCK_INFRA.storage.unit}`} icon={HardDrive} sublabel={`+${MOCK_INFRA.storage.growthPerMonth} GB/mes`} />
        <MetricCard label="Colas pendientes" value={MOCK_INFRA.pendingQueues} icon={Clock} />
        <MetricCard label="Syncs fallidos" value={MOCK_INFRA.failedSyncs} icon={Wifi} />
        <MetricCard label="Edge Functions" value={MOCK_INFRA.edgeFunctions} icon={Cpu} />
      </div>

      {/* Service status */}
      <ServiceStatus checks={checks} isLoading={isLoading} />

      {/* AI metrics + Storage */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" /> Módulos AI / Inferencia</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40">
              <span className="text-sm">Nova Yield inferencias/día</span>
              <span className="font-semibold tabular-nums">{MOCK_INFRA.aiInferences.yield}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40">
              <span className="text-sm">Nova Guard diagnósticos/día</span>
              <span className="font-semibold tabular-nums">{MOCK_INFRA.aiInferences.guard}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-md bg-muted/40">
              <span className="text-sm">Sync offline fail rate</span>
              <span className="font-semibold tabular-nums">{MOCK_INFRA.syncFailRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Uso</span>
                <span>{MOCK_INFRA.storage.used} / {MOCK_INFRA.storage.total} {MOCK_INFRA.storage.unit}</span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(MOCK_INFRA.storage.used / MOCK_INFRA.storage.total) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Crecimiento estimado: +{MOCK_INFRA.storage.growthPerMonth} GB/mes</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Module status */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Estado de módulos</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {MOCK_MODULE_HEALTH.map(mod => <ModuleHealthCard key={mod.code} mod={mod} />)}
        </CardContent>
      </Card>

      {/* Health timeline */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Timeline de incidentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_HEALTH_TIMELINE.map((event, i) => (
              <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border-l-4 ${
                event.severity === 'warning' ? 'border-l-warning bg-warning/5' : 'border-l-primary bg-primary/5'
              }`}>
                <span className="text-xs text-muted-foreground shrink-0 pt-0.5 tabular-nums">{event.date}</span>
                <p className="text-sm text-foreground">{event.event}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
