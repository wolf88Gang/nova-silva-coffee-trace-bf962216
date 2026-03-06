import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { applyLegacyOrgFilter } from '@/lib/orgFilter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import { Zap, AlertTriangle, CheckCircle, Info, Calendar, Sprout, Loader2, ArrowRight, Shield, Beaker, Mountain } from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co';

interface Parcela { id: string; nombre: string; }

interface PlanResult {
  cached?: boolean;
  plan_id: string;
  modo_calculo: string;
  nivel_confianza: string;
  data_quality: { completeness: string; missing: string[] };
  demanda: Record<string, number>;
  flags: Array<{ code: string; severity: string; message: string; action?: string }>;
  cronograma: Array<{
    fase: string; numero_aplicacion: number; fecha_programada: string | null;
    nutrientes: Record<string, number>; tipo_aplicacion: string;
  }>;
  subengine_results?: {
    edaphic?: { encalado_ton_ha?: number; eficiencias?: Record<string, number> };
    genetic?: { multiplicador_ponderado?: number; micros_multiplier?: number; detalle?: any[] };
    phenological?: { zona?: string; shift_dias?: number; gda_scale?: number };
  };
  hash_receta?: string;
}

const SEVERITY_STYLES: Record<string, { icon: typeof AlertTriangle; color: string }> = {
  roja: { icon: AlertTriangle, color: 'text-destructive' },
  naranja: { icon: AlertTriangle, color: 'text-warning' },
  amarilla: { icon: Info, color: 'text-yellow-600' },
  verde: { icon: CheckCircle, color: 'text-success' },
  info: { icon: Info, color: 'text-primary' },
};

const FASE_LABELS: Record<string, string> = {
  cabeza_alfiler: 'Cabeza de alfiler',
  expansion_rapida: 'Expansión rápida',
  llenado_grano: 'Llenado de grano',
  maduracion: 'Maduración',
  post_cosecha: 'Post-cosecha',
};

const NUTRIENT_LABELS: Record<string, string> = {
  N: 'Nitrógeno', P2O5: 'Fósforo', K2O: 'Potasio', CaO: 'Calcio',
  MgO: 'Magnesio', S: 'Azufre', Zn: 'Zinc', B: 'Boro',
};

export default function GeneratePlanV2() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();
  const [parcelaId, setParcelaId] = useState('');
  const [result, setResult] = useState<PlanResult | null>(null);

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas_for_plan_v2', organizationId],
    queryFn: async () => {
      let q = supabase.from('parcelas').select('id, nombre');
      q = applyLegacyOrgFilter(q, organizationId);
      const { data, error } = await q.order('nombre');
      if (error) throw error;
      return (data ?? []) as Parcela[];
    },
    enabled: !!organizationId,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');

      const idempotencyKey = `plan_${parcelaId}_${new Date().toISOString().slice(0, 10)}`;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate_nutrition_plan_v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': session.access_token,
        },
        body: JSON.stringify({ parcela_id: parcelaId, idempotency_key: idempotencyKey }),
      });

      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `Error ${res.status}`);
      }
      return await res.json() as PlanResult;
    },
    onSuccess: (data) => {
      setResult(data);
      queryClient.invalidateQueries({ queryKey: ['nutricion_planes'] });
      toast.success(data.cached ? 'Plan existente recuperado (idempotente)' : 'Plan generado exitosamente');
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  return (
    <div className="space-y-6">
      {/* Generator Form */}
      <Card>
        <CardContent className="pt-5 space-y-4">
          <p className="text-sm text-muted-foreground">
            El motor §29 analizará el contexto de la parcela, análisis de suelo/foliar y variedades para generar un plan de nutrición personalizado con cronograma fenológico.
          </p>
          <div>
            <Label>Parcela *</Label>
            <Select value={parcelaId} onValueChange={setParcelaId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger>
              <SelectContent>
                {parcelas?.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => mutation.mutate()} disabled={!parcelaId || mutation.isPending} className="w-full">
            {mutation.isPending ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Calculando plan…</> : <><Zap className="h-4 w-4 mr-1" /> Generar Plan v2</>}
          </Button>
        </CardContent>
      </Card>

      {/* Result */}
      {result && <PlanResultView result={result} />}
    </div>
  );
}

function PlanResultView({ result }: { result: PlanResult }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <Card>
        <CardContent className="pt-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-bold text-foreground">Plan de Nutrición</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline">{result.modo_calculo}</Badge>
              <ConfianzaBadge nivel={result.nivel_confianza} />
              {result.cached && <Badge variant="secondary">Cached</Badge>}
            </div>
          </div>
          {result.data_quality?.missing?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 p-2 rounded">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Datos faltantes: {result.data_quality.missing.join(', ')}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flags */}
      {result.flags?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Alertas y Recomendaciones</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {result.flags.map((f, i) => {
              const style = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.info;
              const Icon = style.icon;
              return (
                <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30">
                  <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.color}`} />
                  <div>
                    <p className="text-foreground">{f.message}</p>
                    {f.action && <p className="text-xs text-muted-foreground mt-0.5"><ArrowRight className="h-3 w-3 inline mr-1" />{f.action}</p>}
                    <code className="text-[10px] text-muted-foreground/60">{f.code}</code>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}

      {/* Demanda Total */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Demanda Total (kg/ha/ciclo)</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {Object.entries(result.demanda ?? {}).map(([k, v]) => (
              <div key={k} className="text-center p-2 rounded bg-muted/50">
                <p className="text-xs text-muted-foreground">{NUTRIENT_LABELS[k] ?? k}</p>
                <p className="text-lg font-bold text-foreground">{typeof v === 'number' ? v.toFixed(1) : v}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cronograma */}
      {result.cronograma?.length > 0 && (
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Cronograma de Aplicaciones</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {result.cronograma.map((c, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
                <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {c.numero_aplicacion}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {FASE_LABELS[c.fase] ?? c.fase}
                  </p>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                    {Object.entries(c.nutrientes ?? {}).filter(([, v]) => v > 0).map(([k, v]) => (
                      <span key={k}>{k}: {v.toFixed(1)} kg/ha</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    {c.fecha_programada && (
                      <span><Calendar className="h-3 w-3 inline mr-0.5" />{new Date(c.fecha_programada).toLocaleDateString('es')}</span>
                    )}
                    {c.tipo_aplicacion && <span className="capitalize">{c.tipo_aplicacion.replace('_', ' ')}</span>}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Sub-engine details */}
      {result.subengine_results && (
        <Accordion type="single" collapsible>
          <AccordionItem value="subengines" className="border rounded-lg">
            <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm">
              <div className="flex items-center gap-2">
                <Beaker className="h-4 w-4 text-primary" />
                Detalle de Sub-motores
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              {result.subengine_results.edaphic && (
                <div className="p-3 rounded bg-muted/30 space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-primary" /> Edáfico</p>
                  {result.subengine_results.edaphic.encalado_ton_ha != null && (
                    <p className="text-xs text-muted-foreground">Encalado recomendado: {result.subengine_results.edaphic.encalado_ton_ha} ton/ha</p>
                  )}
                  {result.subengine_results.edaphic.eficiencias && (
                    <div className="flex gap-2 text-xs">
                      {Object.entries(result.subengine_results.edaphic.eficiencias).map(([k, v]) => (
                        <span key={k}>{k}: {((v as number) * 100).toFixed(0)}%</span>
                      ))}
                    </div>
                  )}
                </div>
              )}
              {result.subengine_results.genetic && (
                <div className="p-3 rounded bg-muted/30 space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1"><Sprout className="h-3.5 w-3.5 text-primary" /> Genético</p>
                  <p className="text-xs text-muted-foreground">
                    Multiplicador ponderado: ×{result.subengine_results.genetic.multiplicador_ponderado?.toFixed(2)}
                    {result.subengine_results.genetic.micros_multiplier && ` | Micros: ×${result.subengine_results.genetic.micros_multiplier.toFixed(2)}`}
                  </p>
                </div>
              )}
              {result.subengine_results.phenological && (
                <div className="p-3 rounded bg-muted/30 space-y-1">
                  <p className="text-xs font-medium flex items-center gap-1"><Mountain className="h-3.5 w-3.5 text-primary" /> Fenológico</p>
                  <p className="text-xs text-muted-foreground">
                    Zona: {result.subengine_results.phenological.zona} | Shift: +{result.subengine_results.phenological.shift_dias} días | GDA: ×{result.subengine_results.phenological.gda_scale?.toFixed(2)}
                  </p>
                </div>
              )}
              {result.hash_receta && (
                <p className="text-[10px] text-muted-foreground/50 font-mono break-all">SHA-256: {result.hash_receta}</p>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}

function ConfianzaBadge({ nivel }: { nivel: string }) {
  const styles: Record<string, string> = {
    alto: 'bg-success/10 text-success border-success/20',
    medio: 'bg-warning/10 text-warning border-warning/20',
    bajo: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return <Badge variant="outline" className={styles[nivel] ?? ''}>Confianza: {nivel}</Badge>;
}
