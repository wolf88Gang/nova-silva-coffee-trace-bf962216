import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { applyLegacyOrgFilter } from '@/lib/orgFilter';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Switch } from '@/components/ui/switch';
import {
  Zap, AlertTriangle, CheckCircle, Info, Calendar, Sprout, Loader2,
  ArrowRight, Shield, Beaker, Mountain, DollarSign, TrendingUp, Leaf,
} from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co';

interface Parcela { id: string; nombre: string; }

type Scenario = 'conservador' | 'esperado' | 'intensivo';
type YieldMode = 'auto' | 'manual';

interface NutrientDetail {
  demanda_base: number;
  ajustes: { altitud: number; edad: number; variedad: number; estres: number };
  aporte_suelo: number;
  aporte_organico: number;
  eficiencia: number;
  dosis_final: number;
  indice_suficiencia: number;
}

interface PlanResult {
  plan_id: string;
  cached: boolean;
  hash_receta: string;
  engine_version: string;
  modo_calculo: string;
  nivel_confianza: 'alta' | 'media' | 'baja';
  yield_target: { ton_ha: number; intervalo: number; fuente: string };
  data_quality: { completeness: string; missing: string[] };
  nutriente_limitante: { code: string; nombre: string; indice: number; impacto: string } | null;
  demanda: Record<string, NutrientDetail>;
  fertilizantes: Array<{
    nombre: string; tipo: string; cantidad_kg_ha: number;
    cantidad_total: number; costo_usd: number | null;
  }>;
  cronograma: Array<{
    fase: string; numero_aplicacion: number; fecha_programada: string | null;
    nutrientes: Record<string, number>; tipo_aplicacion: string;
    mano_de_obra_jornales: number;
  }>;
  economia: {
    costo_fertilizantes_usd: number; costo_mano_obra_usd: number;
    costo_total_usd: number; roi_estimado: number | null;
  };
  restricciones_aplicadas: string[];
  flags: Array<{ code: string; severity: string; message: string }>;
  explain_trace: string[];
  subengine_results?: {
    edaphic?: { encalado_ton_ha?: number; eficiencias?: Record<string, number> };
    genetic?: { multiplicador_ponderado?: number; micros_multiplier?: number; detalle?: any[] };
    phenological?: { zona?: string; shift_dias?: number; gda_scale?: number };
  };
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
  MgO: 'Magnesio', S: 'Azufre', Zn: 'Zinc', B: 'Boro', Mn: 'Manganeso',
};

const SCENARIO_LABELS: Record<Scenario, { label: string; desc: string; color: string }> = {
  conservador: { label: 'Conservador', desc: 'Menor inversión, rendimiento base', color: 'text-muted-foreground' },
  esperado: { label: 'Esperado', desc: 'Balance costo-beneficio óptimo', color: 'text-primary' },
  intensivo: { label: 'Intensivo', desc: 'Máximo rendimiento, mayor inversión', color: 'text-success' },
};

export default function GeneratePlanV2() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();
  const [parcelaId, setParcelaId] = useState('');
  const [scenario, setScenario] = useState<Scenario>('esperado');
  const [yieldMode, setYieldMode] = useState<YieldMode>('auto');
  const [yieldManual, setYieldManual] = useState<number>(2500);
  const [allowHeuristics, setAllowHeuristics] = useState(true);
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

      const body: Record<string, unknown> = {
        org_id: organizationId,
        plot_id: parcelaId,
        yield_mode: yieldMode,
        scenario,
        allow_heuristics: allowHeuristics,
        user_id: session.user.id,
      };
      if (yieldMode === 'manual') body.yield_manual_ton = yieldManual / 1000;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/generate-nutrition-plan-v2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': session.access_token,
        },
        body: JSON.stringify(body),
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
            Motor §29 v2: analiza contexto de parcela, suelo, foliar, variedades y restricciones ambientales para generar un plan con cronograma fenológico y análisis económico.
          </p>

          {/* Parcela */}
          <div>
            <Label>Parcela *</Label>
            <Select value={parcelaId} onValueChange={setParcelaId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger>
              <SelectContent>
                {parcelas?.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Scenario */}
          <div>
            <Label>Escenario</Label>
            <Select value={scenario} onValueChange={(v) => setScenario(v as Scenario)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Object.entries(SCENARIO_LABELS).map(([k, v]) => (
                  <SelectItem key={k} value={k}>
                    <span className={v.color}>{v.label}</span>
                    <span className="text-xs text-muted-foreground ml-2">— {v.desc}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Yield mode */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Switch checked={yieldMode === 'manual'} onCheckedChange={(v) => setYieldMode(v ? 'manual' : 'auto')} />
              <Label className="text-sm">Rendimiento manual</Label>
            </div>
            {yieldMode === 'manual' && (
              <div className="flex items-center gap-2">
                <Input
                  type="number" min={500} max={10000} step={100}
                  value={yieldManual} onChange={(e) => setYieldManual(Number(e.target.value))}
                  className="w-28"
                />
                <span className="text-xs text-muted-foreground">kg/ha</span>
              </div>
            )}
          </div>

          {/* Heuristics */}
          <div className="flex items-center gap-2">
            <Switch checked={allowHeuristics} onCheckedChange={setAllowHeuristics} />
            <Label className="text-sm">Permitir heurísticas si faltan datos</Label>
          </div>

          <Button onClick={() => mutation.mutate()} disabled={!parcelaId || mutation.isPending} className="w-full">
            {mutation.isPending
              ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Calculando plan…</>
              : <><Zap className="h-4 w-4 mr-1" /> Generar Plan v2</>}
          </Button>
        </CardContent>
      </Card>

      {result && <PlanResultView result={result} />}
    </div>
  );
}

/* =================== Result View =================== */

function PlanResultView({ result }: { result: PlanResult }) {
  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-lg font-bold text-foreground">Plan de Nutrición</h3>
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="outline">{result.modo_calculo}</Badge>
              <ConfianzaBadge nivel={result.nivel_confianza} />
              {result.cached && <Badge variant="secondary">Cached</Badge>}
              {result.engine_version && <Badge variant="outline" className="text-[10px]">v{result.engine_version}</Badge>}
            </div>
          </div>

          {/* Yield target */}
          {result.yield_target && (
            <div className="flex items-center gap-2 text-sm bg-muted/30 p-2 rounded">
              <TrendingUp className="h-4 w-4 text-primary shrink-0" />
              <span>Rendimiento objetivo: <strong>{result.yield_target.ton_ha} ton/ha</strong></span>
              <span className="text-muted-foreground text-xs">± {result.yield_target.intervalo}% · {result.yield_target.fuente}</span>
            </div>
          )}

          {/* Limiting nutrient */}
          {result.nutriente_limitante && (
            <div className="flex items-center gap-2 text-sm bg-destructive/10 p-2 rounded">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <span>Nutriente limitante: <strong>{result.nutriente_limitante.nombre}</strong> (índice {result.nutriente_limitante.indice.toFixed(2)})</span>
              <span className="text-xs text-muted-foreground">— {result.nutriente_limitante.impacto}</span>
            </div>
          )}

          {/* Data quality */}
          {result.data_quality?.missing?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-warning bg-warning/10 p-2 rounded">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>Datos faltantes: {result.data_quality.missing.join(', ')} ({result.data_quality.completeness})</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Flags */}
      <FlagsSection flags={result.flags} />

      {/* Demanda detallada */}
      <DemandaSection demanda={result.demanda} />

      {/* Fertilizantes */}
      <FertilizantesSection fertilizantes={result.fertilizantes} />

      {/* Economía */}
      <EconomiaSection economia={result.economia} />

      {/* Cronograma */}
      <CronogramaSection cronograma={result.cronograma} />

      {/* Sub-engines + trace */}
      <SubEngineSection result={result} />
    </div>
  );
}

/* ---- Flags ---- */
function FlagsSection({ flags }: { flags?: PlanResult['flags'] }) {
  if (!flags?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Alertas y Recomendaciones</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {flags.map((f, i) => {
          const style = SEVERITY_STYLES[f.severity] ?? SEVERITY_STYLES.info;
          const Icon = style.icon;
          return (
            <div key={i} className="flex items-start gap-2 text-sm p-2 rounded bg-muted/30">
              <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${style.color}`} />
              <div>
                <p className="text-foreground">{f.message}</p>
                <code className="text-[10px] text-muted-foreground/60">{f.code}</code>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

/* ---- Demanda detallada ---- */
function DemandaSection({ demanda }: { demanda?: PlanResult['demanda'] }) {
  if (!demanda || Object.keys(demanda).length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Demanda Nutricional (kg/ha)</CardTitle></CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(demanda).map(([code, d]) => (
            <div key={code} className="p-3 rounded-lg bg-muted/30 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{NUTRIENT_LABELS[code] ?? code}</span>
                <span className="text-lg font-bold text-primary">{d.dosis_final.toFixed(1)}</span>
              </div>
              <div className="text-[11px] text-muted-foreground space-y-0.5">
                <p>Base: {d.demanda_base.toFixed(1)} · Efic: {(d.eficiencia * 100).toFixed(0)}%</p>
                <p>Suelo: -{d.aporte_suelo.toFixed(1)} · Orgánico: -{d.aporte_organico.toFixed(1)}</p>
                <p>Suficiencia: {(d.indice_suficiencia * 100).toFixed(0)}%</p>
              </div>
              {/* Sufficiency bar */}
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${d.indice_suficiencia >= 0.8 ? 'bg-success' : d.indice_suficiencia >= 0.5 ? 'bg-warning' : 'bg-destructive'}`}
                  style={{ width: `${Math.min(d.indice_suficiencia * 100, 100)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---- Fertilizantes ---- */
function FertilizantesSection({ fertilizantes }: { fertilizantes?: PlanResult['fertilizantes'] }) {
  if (!fertilizantes?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <Leaf className="h-4 w-4 text-primary" /> Fertilizantes Recomendados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {fertilizantes.map((f, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <p className="text-sm font-medium text-foreground">{f.nombre}</p>
                <p className="text-xs text-muted-foreground">{f.tipo}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-foreground">{f.cantidad_kg_ha.toFixed(1)} kg/ha</p>
                <p className="text-xs text-muted-foreground">
                  Total: {f.cantidad_total.toFixed(0)} kg
                  {f.costo_usd != null && ` · $${f.costo_usd.toFixed(0)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ---- Economía ---- */
function EconomiaSection({ economia }: { economia?: PlanResult['economia'] }) {
  if (!economia) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-1.5">
          <DollarSign className="h-4 w-4 text-primary" /> Análisis Económico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 grid-cols-2 lg:grid-cols-4 gap-3">
          <EconCard label="Fertilizantes" value={`$${economia.costo_fertilizantes_usd.toFixed(0)}`} />
          <EconCard label="Mano de obra" value={`$${economia.costo_mano_obra_usd.toFixed(0)}`} />
          <EconCard label="Costo total" value={`$${economia.costo_total_usd.toFixed(0)}`} bold />
          <EconCard label="ROI estimado" value={economia.roi_estimado != null ? `${economia.roi_estimado.toFixed(1)}×` : '—'} bold />
        </div>
      </CardContent>
    </Card>
  );
}

function EconCard({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="text-center p-3 rounded-lg bg-muted/30">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-lg ${bold ? 'font-bold text-primary' : 'font-semibold text-foreground'}`}>{value}</p>
    </div>
  );
}

/* ---- Cronograma ---- */
function CronogramaSection({ cronograma }: { cronograma?: PlanResult['cronograma'] }) {
  if (!cronograma?.length) return null;
  return (
    <Card>
      <CardHeader className="pb-2"><CardTitle className="text-sm">Cronograma de Aplicaciones</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {cronograma.map((c, i) => (
          <div key={i} className="flex items-start gap-3 p-3 rounded-md bg-muted/30">
            <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
              {c.numero_aplicacion}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{FASE_LABELS[c.fase] ?? c.fase}</p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mt-1">
                {Object.entries(c.nutrientes ?? {}).filter(([, v]) => v > 0).map(([k, v]) => (
                  <span key={k}>{k}: {v.toFixed(1)} kg/ha</span>
                ))}
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                {c.fecha_programada && (
                  <span><Calendar className="h-3 w-3 inline mr-0.5" />{new Date(c.fecha_programada).toLocaleDateString('es')}</span>
                )}
                {c.tipo_aplicacion && <span className="capitalize">{c.tipo_aplicacion.replace('_', ' ')}</span>}
                {c.mano_de_obra_jornales > 0 && <span>{c.mano_de_obra_jornales} jornales</span>}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

/* ---- Sub-engines + trace ---- */
function SubEngineSection({ result }: { result: PlanResult }) {
  const hasSub = !!result.subengine_results;
  const hasTrace = result.explain_trace?.length > 0;
  const hasRestrictions = result.restricciones_aplicadas?.length > 0;

  if (!hasSub && !hasTrace && !hasRestrictions) return null;

  return (
    <Accordion type="multiple">
      {hasSub && (
        <AccordionItem value="subengines" className="border rounded-lg mb-2">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm">
            <div className="flex items-center gap-2"><Beaker className="h-4 w-4 text-primary" /> Detalle de Sub-motores</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 space-y-3">
            {result.subengine_results!.edaphic && (
              <div className="p-3 rounded bg-muted/30 space-y-1">
                <p className="text-xs font-medium flex items-center gap-1"><Shield className="h-3.5 w-3.5 text-primary" /> Edáfico</p>
                {result.subengine_results!.edaphic.encalado_ton_ha != null && (
                  <p className="text-xs text-muted-foreground">Encalado: {result.subengine_results!.edaphic.encalado_ton_ha} ton/ha</p>
                )}
                {result.subengine_results!.edaphic.eficiencias && (
                  <div className="flex gap-2 text-xs flex-wrap">
                    {Object.entries(result.subengine_results!.edaphic.eficiencias).map(([k, v]) => (
                      <span key={k}>{k}: {((v as number) * 100).toFixed(0)}%</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            {result.subengine_results!.genetic && (
              <div className="p-3 rounded bg-muted/30 space-y-1">
                <p className="text-xs font-medium flex items-center gap-1"><Sprout className="h-3.5 w-3.5 text-primary" /> Genético</p>
                <p className="text-xs text-muted-foreground">
                  Multiplicador: ×{result.subengine_results!.genetic.multiplicador_ponderado?.toFixed(2)}
                  {result.subengine_results!.genetic.micros_multiplier && ` | Micros: ×${result.subengine_results!.genetic.micros_multiplier.toFixed(2)}`}
                </p>
              </div>
            )}
            {result.subengine_results!.phenological && (
              <div className="p-3 rounded bg-muted/30 space-y-1">
                <p className="text-xs font-medium flex items-center gap-1"><Mountain className="h-3.5 w-3.5 text-primary" /> Fenológico</p>
                <p className="text-xs text-muted-foreground">
                  Zona: {result.subengine_results!.phenological.zona} | Shift: +{result.subengine_results!.phenological.shift_dias} días | GDA: ×{result.subengine_results!.phenological.gda_scale?.toFixed(2)}
                </p>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      )}

      {hasRestrictions && (
        <AccordionItem value="restricciones" className="border rounded-lg mb-2">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm">
            <div className="flex items-center gap-2"><Shield className="h-4 w-4 text-warning" /> Restricciones Aplicadas ({result.restricciones_aplicadas.length})</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ul className="text-xs text-muted-foreground space-y-1">
              {result.restricciones_aplicadas.map((r, i) => <li key={i}>• {r}</li>)}
            </ul>
          </AccordionContent>
        </AccordionItem>
      )}

      {hasTrace && (
        <AccordionItem value="trace" className="border rounded-lg mb-2">
          <AccordionTrigger className="px-4 py-3 hover:no-underline text-sm">
            <div className="flex items-center gap-2"><Info className="h-4 w-4 text-muted-foreground" /> Explain Trace ({result.explain_trace.length} pasos)</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <ol className="text-[11px] text-muted-foreground font-mono space-y-0.5 list-decimal list-inside">
              {result.explain_trace.map((t, i) => <li key={i}>{t}</li>)}
            </ol>
            {result.hash_receta && (
              <p className="text-[10px] text-muted-foreground/50 font-mono break-all mt-2">SHA-256: {result.hash_receta}</p>
            )}
          </AccordionContent>
        </AccordionItem>
      )}
    </Accordion>
  );
}

/* ---- Confidence badge ---- */
function ConfianzaBadge({ nivel }: { nivel: string }) {
  const styles: Record<string, string> = {
    alta: 'bg-success/10 text-success border-success/20',
    media: 'bg-warning/10 text-warning border-warning/20',
    baja: 'bg-destructive/10 text-destructive border-destructive/20',
  };
  return <Badge variant="outline" className={styles[nivel] ?? ''}>{nivel}</Badge>;
}
