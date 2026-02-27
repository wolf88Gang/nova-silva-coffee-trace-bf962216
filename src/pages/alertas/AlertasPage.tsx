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
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, CheckCircle2, XCircle, Eye, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'bg-destructive text-destructive-foreground',
  high: 'bg-destructive/80 text-destructive-foreground',
  medium: 'bg-warning text-warning-foreground',
  low: 'bg-muted text-muted-foreground',
};

const STATUS_LABEL: Record<string, string> = {
  open: 'Abierta',
  ack: 'Reconocida',
  closed: 'Cerrada',
};

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
      onError: () => toast.error('Error al actualizar la alerta'),
    });
  };

  const clearFilters = () => {
    setStatusFilter('');
    setIssueCode('');
    setSeverity('');
    setDateFrom('');
    setDateTo('');
  };

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
          {(statusFilter || severity || issueCode || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="mt-2" onClick={clearFilters}>Limpiar filtros</Button>
          )}
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[1,2,3].map(i => <Skeleton key={i} className="h-10 w-full" />)}
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
                  <TableHead>Estado</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alerts.map(a => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <Badge className={SEVERITY_BADGE[a.severity] ?? 'bg-muted text-muted-foreground'}>
                        {a.severity}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground max-w-[240px] truncate">{a.title}</TableCell>
                    <TableCell><code className="text-xs text-muted-foreground">{a.issue_code}</code></TableCell>
                    <TableCell>
                      <Badge variant="outline">{STATUS_LABEL[a.status] ?? a.status}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {new Date(a.created_at).toLocaleDateString('es')}
                    </TableCell>
                    <TableCell className="text-right space-x-1">
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
              <div>
                <p className="text-sm font-medium text-foreground">{selected.title}</p>
                {selected.message && <p className="text-sm text-muted-foreground mt-1">{selected.message}</p>}
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Código:</span>
                  <span className="ml-2 font-mono">{selected.issue_code}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Severidad:</span>
                  <Badge className={`ml-2 ${SEVERITY_BADGE[selected.severity] ?? ''}`}>{selected.severity}</Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Estado:</span>
                  <span className="ml-2">{STATUS_LABEL[selected.status] ?? selected.status}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Creada:</span>
                  <span className="ml-2">{new Date(selected.created_at).toLocaleString('es')}</span>
                </div>
              </div>

              {/* Payload */}
              {selected.payload && Object.keys(selected.payload).length > 0 && (
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">Datos adicionales</p>
                  <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-40">
                    {JSON.stringify(selected.payload, null, 2)}
                  </pre>
                  {/* Links a parcela/lote si existen */}
                  <div className="flex gap-2 mt-2">
                    {(selected.payload as any).parcela_id && (
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { setSelected(null); navigate('/productor/produccion'); }}>
                        Ver parcela →
                      </Button>
                    )}
                    {(selected.payload as any).lote_id && (
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { setSelected(null); navigate('/cooperativa/acopio'); }}>
                        Ver lote →
                      </Button>
                    )}
                    {(selected.payload as any).impact_id && (
                      <Button variant="link" size="sm" className="h-auto p-0" onClick={() => { setSelected(null); navigate('/cooperativa/vital'); }}>
                        Ver diagnóstico →
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Acciones */}
              <div className="flex gap-2 pt-2 border-t border-border">
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
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
