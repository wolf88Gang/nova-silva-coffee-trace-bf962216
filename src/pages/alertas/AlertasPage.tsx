import { useState } from 'react';
import { PageHeader } from '@/components/common/PageHeader';
import { useAgroAlerts, useUpdateAlertStatus, type AgroAlert } from '@/hooks/useAgroAlerts';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, XCircle, Eye, Filter, Clock, Activity, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-destructive/80 text-destructive-foreground',
  medium: 'bg-warning text-warning-foreground',
  low: 'bg-muted text-muted-foreground',
};

const SEVERITY_LABEL: Record<string, string> = {
  critical: 'Crítica',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta',
  ack: 'Reconocida',
  closed: 'Cerrada',
};

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function AlertasPage() {
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [issueCode, setIssueCode] = useState('');
  const [severity, setSeverity] = useState<string>('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selected, setSelected] = useState<AgroAlert | null>(null);
  const navigate = useNavigate();

  const { data: alerts, isLoading, isError } = useAgroAlerts({
    status: statusFilter || undefined,
    issue_code: issueCode || undefined,
    severity: severity || undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  const mutation = useUpdateAlertStatus();

  const handleAction = (id: string, status: 'ack' | 'closed') => {
    mutation.mutate({ id, status }, {
      onSuccess: () => toast.success(status === 'ack' ? 'Alerta reconocida' : 'Alerta cerrada'),
      onError: (err: any) => toast.error(err?.message?.includes('policy') 
        ? 'Sin permisos para actualizar. Contacta al administrador.' 
        : 'Error al actualizar la alerta'),
    });
  };

  const clearFilters = () => {
    setStatusFilter('');
    setIssueCode('');
    setSeverity('');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = statusFilter || severity || issueCode || dateFrom || dateTo;

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Alertas"
        description="Gestión de alertas operativas de tu organización"
      />

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">Filtros</span>
            {hasFilters && (
              <Button variant="ghost" size="sm" className="ml-auto h-7 text-xs" onClick={clearFilters}>
                Limpiar
              </Button>
            )}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Estado" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Abierta</SelectItem>
                <SelectItem value="ack">Reconocida</SelectItem>
                <SelectItem value="closed">Cerrada</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger><SelectValue placeholder="Severidad" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Crítica</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
              </SelectContent>
            </Select>

            <Input placeholder="Código de issue" value={issueCode} onChange={e => setIssueCode(e.target.value)} />
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Desde" />
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} title="Hasta" />
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-destructive">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <p className="text-sm">Error al cargar alertas. Verifica tu conexión.</p>
            </div>
          ) : !alerts?.length ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">No hay alertas con los filtros seleccionados.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Severidad</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Código</TableHead>
                  <TableHead>Métrica</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(a => (
                  <TableRow key={a.id} className="group">
                    <TableCell>
                      <Badge className={SEVERITY_BADGE[a.severity] ?? 'bg-muted text-muted-foreground'}>
                        {SEVERITY_LABEL[a.severity] ?? a.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground max-w-[220px] truncate">{a.title}</TableCell>
                    <TableCell><code className="text-xs text-muted-foreground">{a.issue_code}</code></TableCell>
                    <TableCell className="text-sm">
                      {a.metric_key ? (
                        <span className="text-muted-foreground">
                          {a.metric_key}: <span className="font-mono text-foreground">{a.metric_value ?? '—'}</span>
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{STATUS_LABEL[a.status] ?? a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(a.created_at).toLocaleDateString('es')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" title="Ver detalle" onClick={() => setSelected(a)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {a.status === 'open' && (
                          <Button variant="ghost" size="icon" title="Reconocer" onClick={() => handleAction(a.id, 'ack')} disabled={mutation.isPending}>
                            <CheckCircle2 className="h-4 w-4 text-warning" />
                          </Button>
                        )}
                        {a.status !== 'closed' && (
                          <Button variant="ghost" size="icon" title="Cerrar" onClick={() => handleAction(a.id, 'closed')} disabled={mutation.isPending}>
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog detalle */}
      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Detalle de Alerta
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4">
              {/* Título y mensaje */}
              <div>
                <p className="text-sm font-medium text-foreground">{selected.title}</p>
                {selected.message && <p className="text-sm text-muted-foreground mt-1">{selected.message}</p>}
              </div>

              {/* Metadata grid */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <DetailField label="Código" value={selected.issue_code} mono />
                <DetailField label="Severidad">
                  <Badge className={SEVERITY_BADGE[selected.severity] ?? ''}>{SEVERITY_LABEL[selected.severity] ?? selected.severity}</Badge>
                </DetailField>
                <DetailField label="Estado" value={STATUS_LABEL[selected.status] ?? selected.status} />
                <DetailField label="Creada" value={formatDate(selected.created_at)} />
              </div>

              {/* Métrica y ventana temporal */}
              {(selected.metric_key || selected.window_start) && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Activity className="h-3.5 w-3.5" /> Métrica y ventana
                    </p>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {selected.metric_key && (
                        <DetailField label="Métrica">
                          <span className="font-mono text-foreground">{selected.metric_key} = {selected.metric_value ?? '—'}</span>
                        </DetailField>
                      )}
                      {selected.window_start && (
                        <DetailField label="Ventana">
                          <div className="flex items-center gap-1 text-xs">
                            <Clock className="h-3 w-3 text-muted-foreground" />
                            {formatDate(selected.window_start)} → {formatDate(selected.window_end)}
                          </div>
                        </DetailField>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Regla vinculada */}
              {selected.agro_alert_rules && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5" /> Regla de detección
                    </p>
                    <div className="text-sm space-y-1">
                      <p className="text-foreground font-medium">{selected.agro_alert_rules.rule_name ?? 'Sin nombre'}</p>
                      {selected.agro_alert_rules.description && (
                        <p className="text-muted-foreground text-xs">{selected.agro_alert_rules.description}</p>
                      )}
                      {selected.agro_alert_rules.metric_key && (
                        <p className="text-xs text-muted-foreground">
                          Umbral: <span className="font-mono">{selected.agro_alert_rules.metric_key} {selected.agro_alert_rules.threshold_operator} {selected.agro_alert_rules.threshold_value}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Payload */}
              {selected.payload && Object.keys(selected.payload).length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Payload</p>
                    <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                      {JSON.stringify(selected.payload, null, 2)}
                    </pre>
                    <div className="flex gap-3 mt-2">
                      {(selected.payload as any).parcela_id && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setSelected(null); navigate('/productor/produccion'); }}>
                          Ver parcela →
                        </Button>
                      )}
                      {(selected.payload as any).lote_id && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setSelected(null); navigate('/cooperativa/acopio'); }}>
                          Ver lote →
                        </Button>
                      )}
                      {(selected.payload as any).impact_id && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setSelected(null); navigate('/cooperativa/vital'); }}>
                          Ver diagnóstico →
                        </Button>
                      )}
                      {(selected.payload as any).diagnostic_id && (
                        <Button variant="link" size="sm" className="h-auto p-0 text-xs" onClick={() => { setSelected(null); navigate('/cooperativa/vital'); }}>
                          Ver diagnóstico →
                        </Button>
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Acciones */}
              <Separator />
              <div className="flex gap-2">
                {selected.status === 'open' && (
                  <Button size="sm" variant="outline" onClick={() => { handleAction(selected.id, 'ack'); setSelected(null); }}>
                    <CheckCircle2 className="h-4 w-4 mr-1" /> Reconocer
                  </Button>
                )}
                {selected.status !== 'closed' && (
                  <Button size="sm" variant="destructive" onClick={() => { handleAction(selected.id, 'closed'); setSelected(null); }}>
                    <XCircle className="h-4 w-4 mr-1" /> Cerrar
                  </Button>
                )}
                {selected.status === 'closed' && (
                  <p className="text-xs text-muted-foreground italic">Esta alerta ya fue cerrada.</p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

/** Small helper for detail fields */
function DetailField({ label, value, mono, children }: {
  label: string; value?: string; mono?: boolean; children?: React.ReactNode;
}) {
  return (
    <div>
      <span className="text-muted-foreground text-xs">{label}</span>
      <div className={`mt-0.5 ${mono ? 'font-mono text-sm' : 'text-sm'}`}>
        {children ?? <span className="text-foreground">{value ?? '—'}</span>}
      </div>
    </div>
  );
}
