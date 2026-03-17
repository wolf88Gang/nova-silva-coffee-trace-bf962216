/**
 * Admin System Health — Infrastructure monitoring
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, XCircle, Clock, RefreshCw, Server, Database, Shield, Cloud, HardDrive, Cpu } from 'lucide-react';
import { useSystemHealth } from '@/hooks/useAdminData';

// Mock infrastructure metrics
const MOCK_INFRA = {
  storage: { used: 1.2, total: 8, unit: 'GB' },
  syncFailRate: 0.3,
  aiInferences: { yield: 142, guard: 67 },
  edgeFunctions: 22,
};

export default function AdminSystem() {
  const { data: checks, isLoading, refetch, dataUpdatedAt } = useSystemHealth();

  const statusIcon = (status: string) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-destructive" />;
    return <Clock className="h-5 w-5 text-muted-foreground animate-spin" />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">Plataforma & Infraestructura</h1>
          <p className="text-sm text-muted-foreground mt-1">Health checks y monitoreo del sistema</p></div>
        <div className="flex items-center gap-2">
          {dataUpdatedAt > 0 && <span className="text-xs text-muted-foreground">Último check: {new Date(dataUpdatedAt).toLocaleTimeString('es')}</span>}
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5"><RefreshCw className="h-3.5 w-3.5" /> Actualizar</Button>
        </div>
      </div>

      {/* Service status */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Server className="h-4 w-4" /> Servicios</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
          ) : (
            <div className="space-y-2">
              {(checks ?? []).map(c => (
                <div key={c.service} className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
                  {statusIcon(c.status)}
                  <div className="flex-1"><p className="text-sm font-medium text-foreground">{c.service}</p><p className="text-xs text-muted-foreground">{c.detail}</p></div>
                  {c.latencyMs !== undefined && <Badge variant={c.latencyMs < 300 ? 'outline' : c.latencyMs < 800 ? 'secondary' : 'destructive'} className="font-mono text-xs">{c.latencyMs}ms</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Infrastructure metrics */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><HardDrive className="h-4 w-4" /> Storage</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Uso</span><span>{MOCK_INFRA.storage.used} / {MOCK_INFRA.storage.total} {MOCK_INFRA.storage.unit}</span></div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${(MOCK_INFRA.storage.used / MOCK_INFRA.storage.total) * 100}%` }} />
              </div>
              <p className="text-xs text-muted-foreground">Crecimiento estimado: +0.3 GB/mes</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Cpu className="h-4 w-4" /> Módulos AI</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/40">
              <span className="text-sm">Nova Yield inferencias/día</span>
              <span className="font-semibold">{MOCK_INFRA.aiInferences.yield}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/40">
              <span className="text-sm">Nova Guard diagnósticos/día</span>
              <span className="font-semibold">{MOCK_INFRA.aiInferences.guard}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-md bg-muted/40">
              <span className="text-sm">Sync offline fail rate</span>
              <span className="font-semibold">{MOCK_INFRA.syncFailRate}%</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
