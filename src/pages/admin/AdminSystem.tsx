/**
 * Admin Platform — System health & infrastructure observability.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import {
  CheckCircle2, XCircle, Clock, RefreshCw, Server, HardDrive,
  Cpu, Wifi, AlertTriangle, Activity, Wrench, Terminal, Copy, Check,
} from 'lucide-react';
import { useSystemHealth, type SystemHealthCheck } from '@/hooks/useAdminData';
import { MetricCard, SectionHeader, StatusBadge, HealthIndicator } from '@/components/admin/shared/AdminComponents';
import {
  MOCK_INFRA, MOCK_MODULE_HEALTH, MOCK_HEALTH_TIMELINE,
  SERVICE_REMEDIATIONS,
  type MockModuleHealth,
  type MockHealthEvent,
} from '@/lib/adminMockData';

// ── Code Block with copy ──

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="relative group">
      <pre className="bg-muted/60 border border-border/50 rounded-lg p-3 text-xs font-mono text-foreground overflow-x-auto whitespace-pre-wrap">{code}</pre>
      <Button
        variant="ghost" size="sm"
        className="absolute top-1.5 right-1.5 h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={handleCopy}
      >
        {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

// ── Service Status with remediation ──

function ServiceStatus({ checks, isLoading }: { checks: ReturnType<typeof useSystemHealth>['data']; isLoading: boolean }) {
  const [selectedCheck, setSelectedCheck] = useState<SystemHealthCheck | null>(null);

  const statusIcon = (status: string) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-success" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-destructive" />;
    return <Clock className="h-5 w-5 text-muted-foreground animate-spin" />;
  };

  const getRemediation = (serviceName: string) =>
    SERVICE_REMEDIATIONS.find(r => r.service === serviceName);

  return (
    <>
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> Estado de servicios</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {(checks ?? []).map(c => (
                <div
                  key={c.service}
                  className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50 cursor-pointer hover:bg-muted/60 transition-colors"
                  onClick={() => setSelectedCheck(c)}
                >
                  {statusIcon(c.status)}
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{c.service}</p>
                    <p className="text-xs text-muted-foreground">{c.detail}</p>
                  </div>
                  {c.status === 'error' && (
                    <Badge variant="destructive" className="gap-1 text-xs">
                      <Wrench className="h-3 w-3" /> Ver solución
                    </Badge>
                  )}
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

      <Dialog open={!!selectedCheck} onOpenChange={() => setSelectedCheck(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedCheck?.status === 'ok' ? <CheckCircle2 className="h-5 w-5 text-success" /> : <XCircle className="h-5 w-5 text-destructive" />}
              {selectedCheck?.service}
            </DialogTitle>
            <DialogDescription>
              Estado: {selectedCheck?.status === 'ok' ? 'Operativo' : 'Con errores'}
              {selectedCheck?.latencyMs !== undefined && ` · Latencia: ${selectedCheck.latencyMs}ms`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedCheck?.detail && (
              <div>
                <p className="text-sm font-medium text-foreground mb-1">Detalle</p>
                <p className="text-sm text-muted-foreground">{selectedCheck.detail}</p>
              </div>
            )}
            {selectedCheck && getRemediation(selectedCheck.service) && (
              <div>
                <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                  <Terminal className="h-4 w-4 text-primary" />
                  {selectedCheck.status === 'error' ? 'Solución recomendada' : 'Guía de diagnóstico'}
                </p>
                <CodeBlock code={getRemediation(selectedCheck.service)!.remediation} />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Module Health Card (clickable) ──

function ModuleHealthCard({ mod, onClick }: { mod: MockModuleHealth; onClick: () => void }) {
  const statusConfig = {
    stable: { badge: 'ok' as const, label: 'Estable', color: 'border-l-success' },
    degraded: { badge: 'warning' as const, label: 'Degradado', color: 'border-l-warning' },
    offline: { badge: 'error' as const, label: 'Offline', color: 'border-l-destructive' },
    beta: { badge: 'info' as const, label: 'Beta', color: 'border-l-primary' },
  }[mod.status];

  return (
    <div
      className={`flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50 border-l-4 ${statusConfig.color} cursor-pointer hover:bg-muted/60 transition-colors`}
      onClick={onClick}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-medium text-foreground">{mod.name}</p>
          <StatusBadge status={statusConfig.badge} label={statusConfig.label} />
        </div>
        <p className="text-xs text-muted-foreground">{mod.description}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold text-foreground">{mod.uptime}%</@>
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

// ── Module Detail Dialog ──

function ModuleDetailDialog({ mod, open, onClose }: { mod: MockModuleHealth | null; open: boolean; onClose: () => void }) {
  if (!mod) return null;
  const statusLabels = { stable: 'Estable', degraded: 'Degradado', offline: 'Offline', beta: 'Beta' };
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-primary" />
            {mod.name}
          </DialogTitle>
          <DialogDescription>
            Estado: {statusLabels[mod.status]} · Uptime: {mod.uptime}%
            {mod.lastIncident && ` · Último incidente: ${mod.lastIncident}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {mod.details && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Descripción del estado</p>
              <p className="text-sm text-muted-foreground">{mod.details}</p>
            </div>
          )}
          {mod.remediation && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-primary" />
                Acción recomendada
              </p>
              <CodeBlock code={mod.remediation} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Timeline Detail Dialog ──

function TimelineDetailDialog({ event, open, onClose }: { event: MockHealthEvent | null; open: boolean; onClose: () => void }) {
  if (!event) return null;
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {event.severity === 'warning' ? <AlertTriangle className="h-5 w-5 text-warning" /> : <CheckCircle2 className="h-5 w-5 text-primary" />}
            Incidente {event.date}
          </DialogTitle>
          <DialogDescription>
            {event.module && `Módulo: ${event.module} · `}{event.event}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {event.details && (
            <div>
              <p className="text-sm font-medium text-foreground mb-1">Detalle del incidente</p>
              <p className="text-sm text-muted-foreground">{event.details}</p>
            </div>
          )}
          {event.remediation && (
            <div>
              <p className="text-sm font-medium text-foreground mb-2 flex items-center gap-1.5">
                <Terminal className="h-4 w-4 text-primary" />
                Acción / Resolución
              </p>
              <CodeBlock code={event.remediation} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ── Main ──

export default function AdminSystem() {
  const { data: checks, isLoading, refetch, dataUpdatedAt } = useSystemHealth();
  const [selectedModule, setSelectedModule] = useState<MockModuleHealth | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MockHealthEvent | null>(null);

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
          {MOCK_MODULE_HEALTH.map(mod => (
            <ModuleHealthCard key={mod.code} mod={mod} onClick={() => setSelectedModule(mod)} />
          ))}
        </CardContent>
      </Card>

      <ModuleDetailDialog mod={selectedModule} open={!!selectedModule} onClose={() => setSelectedModule(null)} />

      {/* Health timeline */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4" /> Timeline de incidentes</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {MOCK_HEALTH_TIMELINE.map((event, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 p-3 rounded-lg border-l-4 cursor-pointer hover:opacity-80 transition-opacity ${
                  event.severity === 'warning' ? 'border-l-warning bg-warning/5' : 'border-l-primary bg-primary/5'
                }`}
                onClick={() => setSelectedEvent(event)}
              >
                <span className="text-xs text-muted-foreground shrink-0 pt-0.5 tabular-nums">{event.date}</span>
                <p className="text-sm text-foreground flex-1">{event.event}</p>
                <Badge variant="outline" className="text-xs shrink-0">Ver detalle</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <TimelineDetailDialog event={selectedEvent} open={!!selectedEvent} onClose={() => setSelectedEvent(null)} />
    </div>
  );
}
