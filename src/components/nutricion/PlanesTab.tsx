import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { applyOrgFilter, applyLegacyOrgFilter } from '@/lib/orgFilter';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Sprout, Zap, Calendar, Eye } from 'lucide-react';
import PlanProgressBar from './PlanProgressBar';
import PlanStatusBadge from './PlanStatusBadge';
import PlanDetailView from './PlanDetailView';
import { useApprovePlan } from '@/hooks/useNutritionPlanDetail';
import { toast } from 'sonner';

interface NutritionPlan {
  id: string; parcela_id: string; ciclo: string; objetivo: string | null;
  supuestos_json: unknown; status: string; created_at: string;
  execution_pct_total?: number | null;
  execution_pct_by_nutrient?: Record<string, number> | null;
}

interface Fraccionamiento {
  id: string; plan_id: string; numero_aplicacion: number;
  etapa_fenologica: string | null; fecha_programada: string | null;
  n_kg_ha: number | null; p2o5_kg_ha: number | null; k2o_kg_ha: number | null;
  tipo_aplicacion: string | null; notas: string | null;
}

interface Parcela { id: string; nombre: string; }

const ETAPA_LABELS: Record<string, string> = {
  cabeza_alfiler: 'Cabeza de alfiler',
  expansion_rapida: 'Expansión rápida',
  llenado_grano: 'Llenado de grano',
  maduracion: 'Maduración',
};

/* ── Demo plans data ── */
const DEMO_PLANS: NutritionPlan[] = [
  {
    id: 'demo-plan-001', parcela_id: 'demo-parcela-roble', ciclo: '2025-2026',
    objetivo: 'Optimización NPK post-análisis de suelo', supuestos_json: null,
    status: 'aprobado', created_at: '2026-01-20T10:00:00Z',
    execution_pct_total: 45,
    execution_pct_by_nutrient: { N_kg_ha: 55, P2O5_kg_ha: 30, K2O_kg_ha: 40 },
  },
  {
    id: 'demo-plan-002', parcela_id: 'demo-parcela-ceiba', ciclo: '2025-2026',
    objetivo: 'Corrección de acidez + fertilización base', supuestos_json: null,
    status: 'generado', created_at: '2026-02-05T08:30:00Z',
    execution_pct_total: null, execution_pct_by_nutrient: null,
  },
  {
    id: 'demo-plan-003', parcela_id: 'demo-parcela-pinos', ciclo: '2024-2025',
    objetivo: 'Plan renovación cafetal joven', supuestos_json: null,
    status: 'ejecutado', created_at: '2025-09-15T14:00:00Z',
    execution_pct_total: 100,
    execution_pct_by_nutrient: { N_kg_ha: 100, P2O5_kg_ha: 100, K2O_kg_ha: 95 },
  },
];

const DEMO_FRACCIONAMIENTOS: Record<string, Fraccionamiento[]> = {
  'demo-plan-001': [
    { id: 'df1', plan_id: 'demo-plan-001', numero_aplicacion: 1, etapa_fenologica: 'cabeza_alfiler', fecha_programada: '2026-03-01', n_kg_ha: 45, p2o5_kg_ha: 20, k2o_kg_ha: 30, tipo_aplicacion: 'edafica', notas: 'Primera aplicación — inicio floración' },
    { id: 'df2', plan_id: 'demo-plan-001', numero_aplicacion: 2, etapa_fenologica: 'expansion_rapida', fecha_programada: '2026-05-15', n_kg_ha: 60, p2o5_kg_ha: 15, k2o_kg_ha: 40, tipo_aplicacion: 'edafica', notas: 'Segunda aplicación — expansión del fruto' },
    { id: 'df3', plan_id: 'demo-plan-001', numero_aplicacion: 3, etapa_fenologica: 'llenado_grano', fecha_programada: '2026-07-20', n_kg_ha: 50, p2o5_kg_ha: 10, k2o_kg_ha: 35, tipo_aplicacion: 'edafica', notas: 'Llenado de grano — ajuste K' },
    { id: 'df4', plan_id: 'demo-plan-001', numero_aplicacion: 4, etapa_fenologica: 'maduracion', fecha_programada: '2026-09-01', n_kg_ha: 25, p2o5_kg_ha: 0, k2o_kg_ha: 20, tipo_aplicacion: 'foliar', notas: 'Aplicación foliar de cierre' },
  ],
  'demo-plan-002': [
    { id: 'df5', plan_id: 'demo-plan-002', numero_aplicacion: 1, etapa_fenologica: null, fecha_programada: '2026-03-10', n_kg_ha: 0, p2o5_kg_ha: 0, k2o_kg_ha: 0, tipo_aplicacion: 'edafica', notas: 'Encalado correctivo — 1,200 kg CaCO₃/ha' },
    { id: 'df6', plan_id: 'demo-plan-002', numero_aplicacion: 2, etapa_fenologica: 'cabeza_alfiler', fecha_programada: '2026-04-15', n_kg_ha: 50, p2o5_kg_ha: 25, k2o_kg_ha: 35, tipo_aplicacion: 'edafica', notas: 'Fertilización base post-encalado' },
  ],
  'demo-plan-003': [
    { id: 'df7', plan_id: 'demo-plan-003', numero_aplicacion: 1, etapa_fenologica: 'cabeza_alfiler', fecha_programada: '2025-10-01', n_kg_ha: 40, p2o5_kg_ha: 30, k2o_kg_ha: 25, tipo_aplicacion: 'edafica', notas: 'Aplicación de arranque — cafetal joven' },
    { id: 'df8', plan_id: 'demo-plan-003', numero_aplicacion: 2, etapa_fenologica: 'expansion_rapida', fecha_programada: '2025-12-15', n_kg_ha: 55, p2o5_kg_ha: 20, k2o_kg_ha: 40, tipo_aplicacion: 'edafica', notas: 'Expansión — refuerzo nitrógeno' },
  ],
};

const DEMO_PARCELA_NAMES: Record<string, string> = {
  'demo-parcela-roble': 'Parcela El Roble',
  'demo-parcela-ceiba': 'Parcela La Ceiba',
  'demo-parcela-pinos': 'Parcela Los Pinos',
};

export default function PlanesTab() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  const { data: rawPlanes, isLoading } = useQuery({
    queryKey: ['nutricion_planes', organizationId],
    queryFn: async () => {
      let q = supabase.from('nutricion_planes').select('*');
      q = applyOrgFilter(q, organizationId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as NutritionPlan[];
    },
    enabled: !!organizationId,
  });

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas_for_planes', organizationId],
    queryFn: async () => {
      let q = supabase.from('parcelas').select('id, nombre');
      q = applyLegacyOrgFilter(q, organizationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Parcela[];
    },
    enabled: !!organizationId,
  });

  // Merge real + demo plans
  const planes = (() => {
    const real = rawPlanes ?? [];
    const realIds = new Set(real.map(r => r.id));
    const extras = DEMO_PLANS.filter(d => !realIds.has(d.id));
    return [...real, ...extras];
  })();

  const parcelaName = (id: string) =>
    parcelas?.find(p => p.id === id)?.nombre ?? DEMO_PARCELA_NAMES[id] ?? id.slice(0, 8);

  // Detail view
  if (selectedPlanId) {
    const plan = planes?.find(p => p.id === selectedPlanId);
    return (
      <PlanDetailView
        planId={selectedPlanId}
        parcelaName={plan ? parcelaName(plan.parcela_id) : '—'}
        onBack={() => setSelectedPlanId(null)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Planes de fertilización generados por el motor de nutrición</p>
        <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
          <DialogTrigger asChild>
            <Button size="sm"><Zap className="h-4 w-4 mr-1" /> Generar Plan</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Generar Plan de Nutrición</DialogTitle></DialogHeader>
            <GeneratePlanForm
              parcelas={parcelas ?? []}
              onSuccess={() => {
                setShowGenerate(false);
                queryClient.invalidateQueries({ queryKey: ['nutricion_planes'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-32 w-full" />)}</div>
      ) : !planes?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">Sin planes de nutrición</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Genera un plan automático basado en los análisis de suelo y contexto de la parcela.
            </p>
            <Button size="sm" onClick={() => setShowGenerate(true)}>
              <Zap className="h-4 w-4 mr-1" /> Generar primer plan
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {planes.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              parcelaName={parcelaName(plan.parcela_id)}
              onViewDetail={() => setSelectedPlanId(plan.id)}
            />
          ))}
        </Accordion>
      )}
    </div>
  );
}

function PlanCard({ plan, parcelaName, onViewDetail }: { plan: NutritionPlan; parcelaName: string; onViewDetail: () => void }) {
  const approveMutation = useApprovePlan();
  const canApprove = plan.status === 'generado' || plan.status === 'borrador';
  const isDemo = plan.id.startsWith('demo-');

  const { data: fraccionamientos, isLoading } = useQuery({
    queryKey: ['nutricion_fraccionamientos', plan.id],
    queryFn: async () => {
      if (isDemo) return DEMO_FRACCIONAMIENTOS[plan.id] ?? [];
      const { data, error } = await supabase
        .from('nutricion_fraccionamientos')
        .select('*')
        .eq('plan_id', plan.id)
        .order('numero_aplicacion');
      if (error) throw error;
      return (data ?? []) as Fraccionamiento[];
    },
  });

  return (
    <AccordionItem value={plan.id} className="border rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-3 w-full mr-2">
          <Sprout className="h-5 w-5 text-primary shrink-0" />
          <div className="text-left flex-1">
            <p className="text-sm font-medium text-foreground">{parcelaName} — {plan.ciclo}</p>
            <p className="text-xs text-muted-foreground">{plan.objetivo || 'Plan generado automáticamente'}</p>
          </div>
          {plan.execution_pct_total != null && (
            <PlanProgressBar pctTotal={plan.execution_pct_total} compact />
          )}
          <PlanStatusBadge status={plan.status} />
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {/* Action bar */}
        <div className="flex items-center gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={onViewDetail}>
            <Eye className="h-4 w-4 mr-1" /> Ver detalle completo
          </Button>
          {canApprove && !isDemo && (
            <Button size="sm" onClick={() => approveMutation.mutate(plan.id)} disabled={approveMutation.isPending}>
              {approveMutation.isPending ? 'Aprobando…' : '✓ Aprobar'}
            </Button>
          )}
        </div>

        {plan.execution_pct_total != null && (
          <div className="mb-4">
            <PlanProgressBar
              pctTotal={plan.execution_pct_total}
              pctByNutrient={plan.execution_pct_by_nutrient ?? undefined}
            />
          </div>
        )}
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !fraccionamientos?.length ? (
          <p className="text-sm text-muted-foreground">Sin fraccionamientos definidos.</p>
        ) : (
          <div className="space-y-2">
            {fraccionamientos.map(f => (
              <div key={f.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30 text-sm">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {f.numero_aplicacion}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">
                    {ETAPA_LABELS[f.etapa_fenologica ?? ''] ?? f.etapa_fenologica ?? `Aplicación ${f.numero_aplicacion}`}
                  </p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {f.n_kg_ha != null && f.n_kg_ha > 0 && <span>N: {f.n_kg_ha.toFixed(1)} kg/ha</span>}
                    {f.p2o5_kg_ha != null && f.p2o5_kg_ha > 0 && <span>P₂O₅: {f.p2o5_kg_ha.toFixed(1)} kg/ha</span>}
                    {f.k2o_kg_ha != null && f.k2o_kg_ha > 0 && <span>K₂O: {f.k2o_kg_ha.toFixed(1)} kg/ha</span>}
                    {f.tipo_aplicacion && <span className="capitalize">{f.tipo_aplicacion.replace('_', ' ')}</span>}
                    {f.fecha_programada && (
                      <span><Calendar className="h-3 w-3 inline mr-0.5" />{new Date(f.fecha_programada).toLocaleDateString('es')}</span>
                    )}
                  </div>
                  {f.notas && <p className="text-xs text-muted-foreground/70 mt-1">{f.notas}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </AccordionContent>
    </AccordionItem>
  );
}

function GeneratePlanForm({ parcelas, onSuccess }: { parcelas: Parcela[]; onSuccess: () => void }) {
  const [parcelaId, setParcelaId] = useState('');

  const mutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('generate_nutrition_plan_v1', { p_parcela_id: parcelaId });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Plan de nutrición generado exitosamente');
      onSuccess();
    },
    onError: (e: any) => toast.error(`Error al generar plan: ${e.message}`),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        El motor analizará el contexto de la parcela y sus últimos análisis de suelo/foliar para generar un plan de fertilización personalizado.
      </p>
      <div>
        <Label>Parcela *</Label>
        <Select value={parcelaId} onValueChange={setParcelaId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar parcela" /></SelectTrigger>
          <SelectContent>
            {parcelas.map(p => <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
      <Button onClick={() => mutation.mutate()} disabled={!parcelaId || mutation.isPending} className="w-full">
        {mutation.isPending ? 'Generando plan…' : 'Generar Plan de Nutrición'}
      </Button>
    </div>
  );
}
