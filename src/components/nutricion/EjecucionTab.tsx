import { useState } from 'react';
import { format } from 'date-fns';
import { useQueryClient } from '@tanstack/react-query';
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogExecution } from '@/hooks/useLogExecution';
import { useOrgContext } from '@/hooks/useOrgContext';
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
import { toast } from 'sonner';
import EvidenceUploader, { type EvidenceFile } from './EvidenceUploader';

export default function EjecucionTab() {
  const { submit, loading, error, result, reset } = useLogExecution();
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [planId, setPlanId] = useState('');
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [tipo, setTipo] = useState<'edafica' | 'foliar' | 'fertirriego' | 'otro'>('edafica');
  const [nKg, setNKg] = useState('');
  const [k2oKg, setK2oKg] = useState('');
  const [p2o5Kg, setP2o5Kg] = useState('');
  const [productoAplicado, setProductoAplicado] = useState('');
  const [cantidadKg, setCantidadKg] = useState('');
  const [costoReal, setCostoReal] = useState('');
  const [notas, setNotas] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

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
    reset();
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      {/* Formulario */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Registrar Aplicación</CardTitle>
          <CardDescription>
            Registra la ejecución de un plan de fertilización. Los nutrientes aplicados se comparan
            contra la receta del plan para calcular el avance.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Plan ID */}
            <div className="space-y-2">
              <Label htmlFor="plan_id">Plan ID</Label>
              <Input
                id="plan_id"
                placeholder="UUID del plan de nutrición"
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Fecha */}
              <div className="space-y-2">
                <Label>Fecha de aplicación</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !fecha && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fecha ? format(fecha, 'PPP') : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={fecha}
                      onSelect={setFecha}
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tipo aplicación */}
              <div className="space-y-2">
                <Label>Tipo de aplicación</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="edafica">Edáfica</SelectItem>
                    <SelectItem value="foliar">Foliar</SelectItem>
                    <SelectItem value="fertirriego">Fertirriego</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nutrientes */}
            <div className="space-y-2">
              <Label>Nutrientes aplicados (kg/ha)</Label>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">N</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={nKg}
                    onChange={(e) => setNKg(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">K₂O</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={k2oKg}
                    onChange={(e) => setK2oKg(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">P₂O₅</span>
                  <Input
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="0"
                    value={p2o5Kg}
                    onChange={(e) => setP2o5Kg(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>Producto aplicado</Label>
                <Input
                  placeholder="Ej: Urea, DAP, KCl"
                  value={productoAplicado}
                  onChange={(e) => setProductoAplicado(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Cantidad (kg)</Label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  placeholder="0"
                  value={cantidadKg}
                  onChange={(e) => setCantidadKg(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Costo real ($)</Label>
                <Input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={costoReal}
                  onChange={(e) => setCostoReal(e.target.value)}
                />
              </div>
            </div>

            {/* Evidencias */}
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
              <Textarea
                placeholder="Observaciones sobre la aplicación..."
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={3}
              />
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
                <Button type="button" variant="outline" onClick={handleReset}>
                  Nueva aplicación
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Resultado */}
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
