import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import {
  CalendarIcon, Loader2, CheckCircle2, AlertCircle, ClipboardList,
  Play, Clock, ChevronRight, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogExecution } from '@/hooks/useLogExecution';
import { useOrgContext } from '@/hooks/useOrgContext';
import {
  usePendingApplications,
  useExecutionSummaries,
  getWindowLabel,
  type ScheduleItem,
} from '@/hooks/usePendingApplications';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import EvidenceUploader, { type EvidenceFile } from './EvidenceUploader';

export default function EjecucionTab() {
  const [activeTab, setActiveTab] = useState('pendientes');
  const [selectedTask, setSelectedTask] = useState<ScheduleItem | null>(null);

  return (
    <div className="space-y-4">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pendientes">
            <ClipboardList className="h-4 w-4 mr-1" /> Tareas pendientes
          </TabsTrigger>
          <TabsTrigger value="registrar">
            <Play className="h-4 w-4 mr-1" /> Registrar aplicación
          </TabsTrigger>
          <TabsTrigger value="resumen">
            <BarChart3 className="h-4 w-4 mr-1" /> Avance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pendientes" className="mt-4">
          <PendingTasksList
            onSelectTask={(task) => {
              setSelectedTask(task);
              setActiveTab('registrar');
            }}
          />
        </TabsContent>

        <TabsContent value="registrar" className="mt-4">
          <ExecutionForm
            prefilledTask={selectedTask}
            onClearTask={() => setSelectedTask(null)}
          />
        </TabsContent>

        <TabsContent value="resumen" className="mt-4">
          <ExecutionSummaryPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ──────────────────────────────────────── */
/*  Pending Tasks List                      */
/* ──────────────────────────────────────── */

function PendingTasksList({ onSelectTask }: { onSelectTask: (t: ScheduleItem) => void }) {
  const { data: tasks, isLoading } = usePendingApplications();

  if (isLoading) {
    return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-20 w-full" />)}</div>;
  }

  if (!tasks?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground mb-1">Sin tareas pendientes</h3>
          <p className="text-sm text-muted-foreground">
            No hay aplicaciones programadas. Aprueba un plan para generar el calendario de ejecución.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Group by plan
  const grouped = new Map<string, ScheduleItem[]>();
  tasks.forEach(t => {
    const key = t.plan_id;
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key)!.push(t);
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {tasks.length} aplicación(es) pendiente(s) de {grouped.size} plan(es)
      </p>
      {Array.from(grouped.entries()).map(([planId, items]) => (
        <Card key={planId}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                {items[0].parcela_nombre} — {items[0].plan_ciclo}
              </CardTitle>
              <Badge variant="outline" className="text-xs">
                {items.length} pendiente(s)
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {items.map(item => (
              <button
                key={item.id}
                onClick={() => onSelectTask(item)}
                className="w-full flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/50 transition-colors text-left"
              >
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {item.sequence_no}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {getWindowLabel(item.window_code)}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {item.target_date && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {format(new Date(item.target_date), 'dd MMM yyyy', { locale: es })}
                      </span>
                    )}
                    {item.nutrients_json && (
                      <span className="text-xs text-muted-foreground">
                        {formatNutrients(item.nutrients_json)}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function formatNutrients(json: unknown): string {
  if (!json || typeof json !== 'object') return '';
  const n = json as Record<string, number | null>;
  const parts: string[] = [];
  if (n.N) parts.push(`N:${n.N}`);
  if (n.P2O5) parts.push(`P₂O₅:${n.P2O5}`);
  if (n.K2O) parts.push(`K₂O:${n.K2O}`);
  return parts.join(' · ');
}

/* ──────────────────────────────────────── */
/*  Execution Form (enhanced)               */
/* ──────────────────────────────────────── */

function ExecutionForm({
  prefilledTask,
  onClearTask,
}: {
  prefilledTask: ScheduleItem | null;
  onClearTask: () => void;
}) {
  const { submit, loading, error, result, reset } = useLogExecution();
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [planId, setPlanId] = useState(prefilledTask?.plan_id ?? '');
  const [fecha, setFecha] = useState<Date | undefined>(
    prefilledTask?.target_date ? new Date(prefilledTask.target_date) : new Date()
  );
  const [tipo, setTipo] = useState<'edafica' | 'foliar' | 'fertirriego' | 'otro'>('edafica');
  const [nKg, setNKg] = useState('');
  const [k2oKg, setK2oKg] = useState('');
  const [p2o5Kg, setP2o5Kg] = useState('');
  const [productoAplicado, setProductoAplicado] = useState('');
  const [cantidadKg, setCantidadKg] = useState('');
  const [costoReal, setCostoReal] = useState('');
  const [notas, setNotas] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

  // Sync prefilled task
  if (prefilledTask && planId !== prefilledTask.plan_id) {
    setPlanId(prefilledTask.plan_id);
    if (prefilledTask.target_date) setFecha(new Date(prefilledTask.target_date));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId || !fecha) {
      toast.error('Plan ID y fecha son obligatorios');
      return;
    }

    const idempotencyKey = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      const r = await submit({
        plan_id: planId,
        fecha_aplicacion: format(fecha, 'yyyy-MM-dd'),
        idempotency_key: idempotencyKey,
        tipo_aplicacion: tipo,
        dosis_aplicada_json: {
          nutrientes: {
            N_kg_ha: parseFloat(nKg) || 0,
            K2O_kg_ha: parseFloat(k2oKg) || 0,
            P2O5_kg_ha: parseFloat(p2o5Kg) || 0,
          },
        },
        evidencias: evidenceFiles.length
          ? { files: evidenceFiles.map(f => ({ path: f.path, name: f.name, size: f.size, type: f.type })) }
          : undefined,
        producto_aplicado: productoAplicado || undefined,
        cantidad_aplicada_kg: parseFloat(cantidadKg) || undefined,
        costo_real: parseFloat(costoReal) || undefined,
        notas: notas || undefined,
      });
      if (!r.cached) {
        await queryClient.invalidateQueries({ queryKey: ['nutricion_planes', organizationId] });
        await queryClient.invalidateQueries({ queryKey: ['pending_applications'] });
        await queryClient.invalidateQueries({ queryKey: ['execution_summaries'] });
      }
      toast.success(
        r.cached
          ? 'Aplicación ya registrada (idempotente)'
          : `Aplicación registrada — avance: ${r.execution.pct_total}%`
      );
    } catch {
      toast.error('Error al registrar la aplicación');
    }
  }

  function handleReset() {
    setPlanId('');
    setFecha(new Date());
    setTipo('edafica');
    setNKg('');
    setK2oKg('');
    setP2o5Kg('');
    setProductoAplicado('');
    setCantidadKg('');
    setCostoReal('');
    setNotas('');
    setEvidenceFiles([]);
    onClearTask();
    reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Registrar Aplicación</CardTitle>
          <CardDescription>
            {prefilledTask
              ? `Registrando: ${getWindowLabel(prefilledTask.window_code)} (aplicación #${prefilledTask.sequence_no})`
              : 'Registra la ejecución de un plan de fertilización.'}
          </CardDescription>
          {prefilledTask && (
            <Button variant="ghost" size="sm" onClick={handleReset} className="w-fit">
              ← Registrar otra aplicación
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="plan_id">Plan ID</Label>
              <Input
                id="plan_id"
                placeholder="UUID del plan de nutrición"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
                disabled={!!prefilledTask}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Fecha de aplicación</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !fecha && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fecha ? format(fecha, 'PPP', { locale: es }) : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fecha} onSelect={setFecha} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label>Tipo de aplicación</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="edafica">Edáfica</SelectItem>
                    <SelectItem value="foliar">Foliar</SelectItem>
                    <SelectItem value="fertirriego">Fertirriego</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Nutrientes aplicados (kg/ha)</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">N</span>
                  <Input type="number" step="0.1" min="0" placeholder="0" value={nKg} onChange={(e) => setNKg(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">K₂O</span>
                  <Input type="number" step="0.1" min="0" placeholder="0" value={k2oKg} onChange={(e) => setK2oKg(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">P₂O₅</span>
                  <Input type="number" step="0.1" min="0" placeholder="0" value={p2o5Kg} onChange={(e) => setP2o5Kg(e.target.value)} />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Producto aplicado</Label>
                <Input placeholder="Ej: Urea, DAP, KCl" value={productoAplicado} onChange={(e) => setProductoAplicado(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Cantidad (kg)</Label>
                <Input type="number" step="0.1" min="0" placeholder="0" value={cantidadKg} onChange={(e) => setCantidadKg(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Costo real ($)</Label>
                <Input type="number" min="0" placeholder="0" value={costoReal} onChange={(e) => setCostoReal(e.target.value)} />
              </div>
            </div>

            {planId && organizationId && (
              <div className="space-y-2">
                <Label>Evidencias fotográficas</Label>
                <EvidenceUploader
                  organizationId={organizationId}
                  planId={planId}
                  onFilesChange={setEvidenceFiles}
                  onUploadingChange={setUploading}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notas / Observaciones</Label>
              <Textarea placeholder="Observaciones sobre la aplicación..." value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || uploading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Registrando...' : uploading ? 'Esperando evidencias…' : 'Registrar aplicación'}
              </Button>
              {result && (
                <Button type="button" variant="outline" onClick={handleReset}>Nueva aplicación</Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Result panel */}
      <div className="space-y-4">
        {result ? (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">
                    {result.cached ? 'Registro existente' : 'Aplicación registrada'}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">ID</span>
                    <span className="font-mono text-xs">{result.data.id.slice(0, 8)}…</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Estado del plan</span>
                    <Badge variant="secondary">{result.execution.estado}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Avance por nutriente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Total</span>
                    <span className="font-semibold text-primary">{result.execution.pct_total}%</span>
                  </div>
                  <Progress value={Math.min(result.execution.pct_total, 100)} className="h-2" />
                </div>
                {Object.entries(result.execution.pct_by_nutrient).map(([key, pct]) => (
                  <div key={key} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{key.replace('_kg_ha', '')}</span>
                      <span>{Math.round(pct)}%</span>
                    </div>
                    <Progress value={Math.min(pct, 100)} className="h-1.5" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </>
        ) : (
          <Card>
            <CardContent className="py-10 text-center text-muted-foreground text-sm">
              Registra una aplicación para ver el avance del plan.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────── */
/*  Execution Summary Panel                 */
/* ──────────────────────────────────────── */

function ExecutionSummaryPanel() {
  const { data: summaries, isLoading } = useExecutionSummaries();

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  }

  if (!summaries?.length) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground text-sm">
          No hay planes en ejecución. Aprueba un plan para comenzar a registrar aplicaciones.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {summaries.map(s => (
        <Card key={s.plan_id}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{s.parcela_nombre}</CardTitle>
            <CardDescription>{s.ciclo}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Completitud</span>
              <span className="font-semibold text-primary">{s.pct_complete}%</span>
            </div>
            <Progress value={Math.min(s.pct_complete, 100)} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{s.completed} de {s.total_applications} aplicaciones</span>
              <span className="font-mono">{s.plan_id.slice(0, 8)}…</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
