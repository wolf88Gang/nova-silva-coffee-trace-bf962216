import { useState } from 'react';
import { format } from 'date-fns';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { CalendarIcon, Loader2, CheckCircle2, AlertCircle, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useLogExecution } from '@/hooks/useLogExecution';
import { useOrgContext } from '@/hooks/useOrgContext';
import { applyOrgFilter, applyLegacyOrgFilter } from '@/lib/orgFilter';
import { supabase } from '@/integrations/supabase/client';
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
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import EvidenceUploader, { type EvidenceFile } from './EvidenceUploader';

interface PlanOption { id: string; parcela_nombre: string; ciclo: string; status: string; }

export default function EjecucionTab() {
  const { submit, loading, error, result, reset } = useLogExecution();
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();

  const [uploading, setUploading] = useState(false);
  const [planId, setPlanId] = useState('');
  const [fecha, setFecha] = useState<Date | undefined>(new Date());
  const [tipo, setTipo] = useState<'edafica' | 'foliar' | 'fertirriego' | 'enmienda' | 'otro'>('edafica');
  // Macronutrientes
  const [nKg, setNKg] = useState('');
  const [k2oKg, setK2oKg] = useState('');
  const [p2o5Kg, setP2o5Kg] = useState('');
  // Secundarios
  const [caKg, setCaKg] = useState('');
  const [mgKg, setMgKg] = useState('');
  const [sKg, setSKg] = useState('');
  // Enmienda
  const [calKg, setCalKg] = useState('');
  // Producto
  const [productoAplicado, setProductoAplicado] = useState('');
  const [cantidadKg, setCantidadKg] = useState('');
  const [costoReal, setCostoReal] = useState('');
  const [notas, setNotas] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFile[]>([]);

  // Fetch available plans for selector
  const { data: planOptions } = useQuery({
    queryKey: ['planes_for_ejecucion', organizationId],
    queryFn: async () => {
      let q = supabase.from('nutricion_planes').select('id, ciclo, status, parcela_id');
      q = applyOrgFilter(q, organizationId);
      const { data, error } = await q.order('created_at', { ascending: false }).limit(20);
      if (error) return [];
      // Get parcela names
      const parcelaIds = [...new Set((data ?? []).map((d: any) => d.parcela_id))];
      let parcelas: Record<string, string> = {};
      if (parcelaIds.length > 0) {
        const { data: pData } = await supabase.from('parcelas').select('id, nombre').in('id', parcelaIds);
        parcelas = Object.fromEntries((pData ?? []).map((p: any) => [p.id, p.nombre]));
      }
      return (data ?? []).map((d: any) => ({
        id: d.id,
        parcela_nombre: parcelas[d.parcela_id] ?? d.parcela_id?.slice(0, 8),
        ciclo: d.ciclo,
        status: d.status,
      })) as PlanOption[];
    },
    enabled: !!organizationId,
  });

  const isEnmienda = tipo === 'enmienda';

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!planId || !fecha) {
      toast.error('Plan y fecha son obligatorios');
      return;
    }

    const idempotencyKey = `exec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const nutrientes: Record<string, number> = {};
    if (!isEnmienda) {
      if (parseFloat(nKg) > 0) nutrientes.N_kg_ha = parseFloat(nKg);
      if (parseFloat(p2o5Kg) > 0) nutrientes.P2O5_kg_ha = parseFloat(p2o5Kg);
      if (parseFloat(k2oKg) > 0) nutrientes.K2O_kg_ha = parseFloat(k2oKg);
      if (parseFloat(caKg) > 0) nutrientes.CaO_kg_ha = parseFloat(caKg);
      if (parseFloat(mgKg) > 0) nutrientes.MgO_kg_ha = parseFloat(mgKg);
      if (parseFloat(sKg) > 0) nutrientes.S_kg_ha = parseFloat(sKg);
    } else {
      if (parseFloat(calKg) > 0) nutrientes.CaCO3_kg_ha = parseFloat(calKg);
    }

    try {
      const r = await submit({
        plan_id: planId,
        fecha_aplicacion: format(fecha, 'yyyy-MM-dd'),
        idempotency_key: idempotencyKey,
        tipo_aplicacion: tipo,
        dosis_aplicada_json: { nutrientes },
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
    setNKg(''); setK2oKg(''); setP2o5Kg('');
    setCaKg(''); setMgKg(''); setSKg(''); setCalKg('');
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
            {/* Plan selector */}
            <div className="space-y-2">
              <Label>Plan de nutrición</Label>
              {planOptions && planOptions.length > 0 ? (
                <Select value={planId} onValueChange={setPlanId}>
                  <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
                  <SelectContent>
                    {planOptions.map(p => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.parcela_nombre} — {p.ciclo} ({p.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  placeholder="UUID del plan de nutrición"
                  value={planId}
                  onChange={(e) => setPlanId(e.target.value)}
                  required
                />
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Fecha */}
              <div className="space-y-2">
                <Label>Fecha de aplicación</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn('w-full justify-start text-left font-normal', !fecha && 'text-muted-foreground')}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fecha ? format(fecha, 'PPP') : 'Seleccionar fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={fecha} onSelect={setFecha} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Tipo aplicación */}
              <div className="space-y-2">
                <Label>Tipo de aplicación</Label>
                <Select value={tipo} onValueChange={(v) => setTipo(v as typeof tipo)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="edafica">Edáfica</SelectItem>
                    <SelectItem value="foliar">Foliar</SelectItem>
                    <SelectItem value="fertirriego">Fertirriego</SelectItem>
                    <SelectItem value="enmienda">Enmienda / Cal</SelectItem>
                    <SelectItem value="otro">Otro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Nutrientes */}
            {!isEnmienda ? (
              <div className="space-y-3">
                <Label className="flex items-center gap-1"><Leaf className="h-3.5 w-3.5" /> Nutrientes aplicados (kg/ha)</Label>
                <p className="text-xs text-muted-foreground">Macronutrientes primarios</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1"><span className="text-xs text-muted-foreground">N</span><Input type="number" step="0.1" min="0" placeholder="0" value={nKg} onChange={(e) => setNKg(e.target.value)} /></div>
                  <div className="space-y-1"><span className="text-xs text-muted-foreground">P₂O₅</span><Input type="number" step="0.1" min="0" placeholder="0" value={p2o5Kg} onChange={(e) => setP2o5Kg(e.target.value)} /></div>
                  <div className="space-y-1"><span className="text-xs text-muted-foreground">K₂O</span><Input type="number" step="0.1" min="0" placeholder="0" value={k2oKg} onChange={(e) => setK2oKg(e.target.value)} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Secundarios</p>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1"><span className="text-xs text-muted-foreground">CaO</span><Input type="number" step="0.1" min="0" placeholder="0" value={caKg} onChange={(e) => setCaKg(e.target.value)} /></div>
                  <div className="space-y-1"><span className="text-xs text-muted-foreground">MgO</span><Input type="number" step="0.1" min="0" placeholder="0" value={mgKg} onChange={(e) => setMgKg(e.target.value)} /></div>
                  <div className="space-y-1"><span className="text-xs text-muted-foreground">S</span><Input type="number" step="0.1" min="0" placeholder="0" value={sKg} onChange={(e) => setSKg(e.target.value)} /></div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label>Enmienda aplicada (kg/ha)</Label>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1"><span className="text-xs text-muted-foreground">CaCO₃ (cal)</span><Input type="number" step="1" min="0" placeholder="0" value={calKg} onChange={(e) => setCalKg(e.target.value)} /></div>
                </div>
                <p className="text-xs text-muted-foreground">Registre la cantidad de cal dolomítica o agrícola aplicada como enmienda correctiva.</p>
              </div>
            )}

            <Separator />

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2"><Label>Producto aplicado</Label><Input placeholder="Ej: Urea, DAP, KCl, Cal" value={productoAplicado} onChange={(e) => setProductoAplicado(e.target.value)} /></div>
              <div className="space-y-2"><Label>Cantidad (kg)</Label><Input type="number" step="0.1" min="0" placeholder="0" value={cantidadKg} onChange={(e) => setCantidadKg(e.target.value)} /></div>
              <div className="space-y-2"><Label>Costo real ($)</Label><Input type="number" min="0" placeholder="0" value={costoReal} onChange={(e) => setCostoReal(e.target.value)} /></div>
            </div>

            {/* Evidencias */}
            {planId && organizationId && (
              <div className="space-y-2">
                <Label>Evidencias fotográficas</Label>
                <EvidenceUploader organizationId={organizationId} planId={planId} onFilesChange={setEvidenceFiles} onUploadingChange={setUploading} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notas / Observaciones</Label>
              <Textarea placeholder="Observaciones sobre la aplicación..." value={notas} onChange={(e) => setNotas(e.target.value)} rows={3} />
            </div>

            {error && (
              <div className="flex items-center gap-2 text-destructive text-sm">
                <AlertCircle className="h-4 w-4" />{error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" disabled={loading || uploading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? 'Registrando...' : uploading ? 'Esperando evidencias…' : 'Registrar aplicación'}
              </Button>
              {result && <Button type="button" variant="outline" onClick={handleReset}>Nueva aplicación</Button>}
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
                  <CardTitle className="text-base">{result.cached ? 'Registro existente' : 'Aplicación registrada'}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-muted-foreground">ID</span><span className="font-mono text-xs">{result.data.id.slice(0, 8)}…</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Estado del plan</span><Badge variant="secondary">{result.execution.estado}</Badge></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-base">Avance por nutriente</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-sm"><span className="font-medium">Total</span><span className="font-semibold text-primary">{result.execution.pct_total}%</span></div>
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
