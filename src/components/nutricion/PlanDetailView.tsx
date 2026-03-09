/**
 * Full plan detail view — 8 sections consuming get_plan_detail RPC.
 * Falls back to demo data for demo plan IDs.
 */
import { useNutritionPlanDetail, useApprovePlan, type PlanDetail } from '@/hooks/useNutritionPlanDetail';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import {
  CheckCircle, Clock, Sprout, Beaker, ShoppingCart, Calendar,
  DollarSign, FileText, History, ArrowLeft, Shield, AlertTriangle,
  Leaf, User, TrendingUp,
} from 'lucide-react';
import PlanStatusBadge from './PlanStatusBadge';

interface Props {
  planId: string;
  parcelaName: string;
  onBack: () => void;
}

/* ── Demo plan detail data ── */
const DEMO_PLAN_DETAILS: Record<string, PlanDetail> = {
  'demo-plan-001': {
    id: 'demo-plan-001',
    parcela_id: 'demo-parcela-roble',
    organization_id: '00000000-0000-0000-0000-000000000001',
    ciclo: '2025-2026',
    objetivo: 'Optimización NPK post-análisis de suelo',
    status: 'aprobado',
    nivel_confianza: 'media',
    modo_calculo: 'balance_liebig',
    engine_version: 'v2.1',
    hash_receta: 'a1b2c3d4e5f6',
    approved_at: '2026-01-25T14:00:00Z',
    approved_by: 'Ing. Carlos Ramírez',
    created_at: '2026-01-20T10:00:00Z',
    plan_json: {
      economia: {
        costo_fertilizantes_usd: 285,
        costo_mano_obra_usd: 120,
        costo_total_usd: 405,
        roi_estimado: 2.8,
      },
      restricciones_aplicadas: [
        'N limitado a 250 kg/ha (máximo regional)',
        'Enmienda calcárea recomendada antes de 1ª aplicación',
      ],
      data_quality: { missing: [] },
      tecnico: {
        nombre: 'Ing. Carlos Ramírez',
        recomendaciones: 'Aplicar encalado correctivo 2 semanas antes de la primera fertilización. Monitorear pH post-encalado.',
        ajustes: 'Se incrementó K₂O un 15% por historial de déficit en parcela.',
      },
    },
    nutrients: [
      { nutrient_code: 'N', required_amount: 180, unit: 'kg/ha', source: 'balance_liebig' },
      { nutrient_code: 'P₂O₅', required_amount: 45, unit: 'kg/ha', source: 'balance_liebig' },
      { nutrient_code: 'K₂O', required_amount: 125, unit: 'kg/ha', source: 'balance_liebig' },
      { nutrient_code: 'CaO', required_amount: 60, unit: 'kg/ha', source: 'kamprath' },
      { nutrient_code: 'MgO', required_amount: 30, unit: 'kg/ha', source: 'suficiencia' },
      { nutrient_code: 'S', required_amount: 20, unit: 'kg/ha', source: 'suficiencia' },
      { nutrient_code: 'Zn', required_amount: 2, unit: 'kg/ha', source: 'foliar' },
      { nutrient_code: 'B', required_amount: 1.5, unit: 'kg/ha', source: 'foliar' },
    ],
    products: [
      { product_name: 'Urea (46-0-0)', dose: 180, unit: 'kg/ha', price: 95, window_code: 'cabeza_alfiler' },
      { product_name: 'DAP (18-46-0)', dose: 98, unit: 'kg/ha', price: 85, window_code: 'cabeza_alfiler' },
      { product_name: 'KCl (0-0-60)', dose: 130, unit: 'kg/ha', price: 75, window_code: 'expansion_rapida' },
      { product_name: 'Cal dolomítica', dose: 1200, unit: 'kg/ha', price: 30, window_code: 'pre_siembra' },
    ],
    schedule: [
      { sequence_no: 1, window_code: 'Pre-siembra (Encalado)', target_date: '2026-02-15', status: 'completado', products_json: null, nutrients_json: null },
      { sequence_no: 2, window_code: 'Cabeza de alfiler', target_date: '2026-03-01', status: 'pendiente', products_json: null, nutrients_json: null },
      { sequence_no: 3, window_code: 'Expansión rápida', target_date: '2026-05-15', status: 'pendiente', products_json: null, nutrients_json: null },
      { sequence_no: 4, window_code: 'Llenado de grano', target_date: '2026-07-20', status: 'pendiente', products_json: null, nutrients_json: null },
    ],
    explain_steps: [
      { step_order: 1, title: 'Rendimiento objetivo', detail: 'Meta: 1.5 ton/ha café verde. Confianza: media. Fuente: promedio histórico 3 ciclos.' },
      { step_order: 2, title: 'Extracción de nutrientes', detail: 'Coeficientes Caturra: N=45, P=8, K=55 kg/ton. Ajuste altitud (1350 msnm): ×1.05.' },
      { step_order: 3, title: 'Aporte de suelo', detail: 'pH 5.1 → N disponible bajo. P Bray II: 12 ppm → deficiente. K: 0.35 cmol → bajo.' },
      { step_order: 4, title: 'Eficiencia de absorción', detail: 'N: 50%, P: 25%, K: 65%. Textura Franco → absorción estándar.' },
      { step_order: 5, title: 'Aportes orgánicos', detail: 'MO 5.2% → crédito N: 15 kg/ha. Cobertura 70% → crédito K: 8 kg/ha.' },
      { step_order: 6, title: 'Balance final', detail: 'Demanda neta calculada tras descontar aportes de suelo y orgánicos.' },
    ],
    audit_events: [
      { event_type: 'plan_generado', actor_id: 'system', detail: null, created_at: '2026-01-20T10:00:00Z' },
      { event_type: 'plan_revisado', actor_id: 'Ing. Carlos Ramírez', detail: { nota: 'Ajuste K₂O +15%' }, created_at: '2026-01-22T09:30:00Z' },
      { event_type: 'plan_aprobado', actor_id: 'Ing. Carlos Ramírez', detail: null, created_at: '2026-01-25T14:00:00Z' },
    ],
    fraccionamientos: [],
  },
  'demo-plan-002': {
    id: 'demo-plan-002',
    parcela_id: 'demo-parcela-ceiba',
    organization_id: '00000000-0000-0000-0000-000000000001',
    ciclo: '2025-2026',
    objetivo: 'Corrección de acidez + fertilización base',
    status: 'generado',
    nivel_confianza: 'baja',
    modo_calculo: 'heuristico',
    engine_version: 'v2.1',
    hash_receta: null,
    approved_at: null,
    approved_by: null,
    created_at: '2026-02-05T08:30:00Z',
    plan_json: {
      economia: { costo_fertilizantes_usd: 180, costo_mano_obra_usd: 80, costo_total_usd: 260, roi_estimado: 1.9 },
      restricciones_aplicadas: ['pH < 5.0 — NPK bloqueado hasta encalado', 'Al sat > 30% — toxicidad activa'],
      data_quality: { missing: ['análisis foliar', 'variedad confirmada'] },
      tecnico: {
        nombre: 'Pendiente asignación',
        recomendaciones: 'Requiere encalado urgente. No aplicar fertilizantes NPK hasta verificar pH > 5.2.',
        ajustes: 'Plan heurístico — completar datos faltantes para recálculo.',
      },
    },
    nutrients: [
      { nutrient_code: 'CaCO₃', required_amount: 1200, unit: 'kg/ha', source: 'kamprath' },
      { nutrient_code: 'N', required_amount: 150, unit: 'kg/ha', source: 'heuristico' },
      { nutrient_code: 'P₂O₅', required_amount: 40, unit: 'kg/ha', source: 'heuristico' },
      { nutrient_code: 'K₂O', required_amount: 100, unit: 'kg/ha', source: 'heuristico' },
    ],
    products: [
      { product_name: 'Cal dolomítica', dose: 1200, unit: 'kg/ha', price: 30, window_code: 'pre_siembra' },
      { product_name: 'Fórmula completa 15-15-15', dose: 400, unit: 'kg/ha', price: 160, window_code: 'cabeza_alfiler' },
    ],
    schedule: [
      { sequence_no: 1, window_code: 'Encalado correctivo', target_date: '2026-03-10', status: 'pendiente', products_json: null, nutrients_json: null },
      { sequence_no: 2, window_code: 'Fertilización base', target_date: '2026-04-15', status: 'pendiente', products_json: null, nutrients_json: null },
    ],
    explain_steps: [
      { step_order: 1, title: 'Diagnóstico edáfico', detail: 'pH 4.6 — acidez severa. Al intercambiable 0.8 cmol — toxicidad activa.' },
      { step_order: 2, title: 'Bloqueo NPK', detail: 'Se bloquea prescripción NPK por toxicidad alumínica. Encalado prioritario.' },
      { step_order: 3, title: 'Cálculo Kamprath', detail: 'Dosis CaCO₃ = 1.5 × (0.8 - 0.3) × 2000 = 1,200 kg/ha (24 sacos/ha).' },
    ],
    audit_events: [
      { event_type: 'plan_generado', actor_id: 'system', detail: { flags: ['baja_confianza', 'datos_incompletos'] }, created_at: '2026-02-05T08:30:00Z' },
    ],
    fraccionamientos: [],
  },
  'demo-plan-003': {
    id: 'demo-plan-003',
    parcela_id: 'demo-parcela-pinos',
    organization_id: '00000000-0000-0000-0000-000000000001',
    ciclo: '2024-2025',
    objetivo: 'Plan renovación cafetal joven',
    status: 'ejecutado',
    nivel_confianza: 'alta',
    modo_calculo: 'balance_liebig',
    engine_version: 'v2.0',
    hash_receta: 'x9y8z7w6',
    approved_at: '2025-09-18T11:00:00Z',
    approved_by: 'Ing. María López',
    created_at: '2025-09-15T14:00:00Z',
    plan_json: {
      economia: { costo_fertilizantes_usd: 320, costo_mano_obra_usd: 140, costo_total_usd: 460, roi_estimado: 3.2 },
      restricciones_aplicadas: [],
      data_quality: { missing: [] },
      tecnico: {
        nombre: 'Ing. María López',
        recomendaciones: 'Cafetal joven (2 años) — priorizar fósforo para desarrollo radicular. Mantener cobertura vegetal.',
        ajustes: 'P₂O₅ incrementado un 20% por cafetal joven.',
      },
    },
    nutrients: [
      { nutrient_code: 'N', required_amount: 120, unit: 'kg/ha', source: 'balance_liebig' },
      { nutrient_code: 'P₂O₅', required_amount: 60, unit: 'kg/ha', source: 'balance_liebig' },
      { nutrient_code: 'K₂O', required_amount: 95, unit: 'kg/ha', source: 'balance_liebig' },
      { nutrient_code: 'MgO', required_amount: 25, unit: 'kg/ha', source: 'suficiencia' },
    ],
    products: [
      { product_name: 'Fórmula 18-5-15-6-2', dose: 350, unit: 'kg/ha', price: 140, window_code: 'cabeza_alfiler' },
      { product_name: 'Sulfato de Magnesio', dose: 50, unit: 'kg/ha', price: 25, window_code: 'expansion_rapida' },
    ],
    schedule: [
      { sequence_no: 1, window_code: 'Cabeza de alfiler', target_date: '2025-10-01', status: 'completado', products_json: null, nutrients_json: null },
      { sequence_no: 2, window_code: 'Expansión rápida', target_date: '2025-12-15', status: 'completado', products_json: null, nutrients_json: null },
    ],
    explain_steps: [
      { step_order: 1, title: 'Contexto cafetal joven', detail: 'Edad: 2 años. Densidad: 5,500 plantas/ha. Variedad: Obatá.' },
      { step_order: 2, title: 'Ajuste por edad', detail: 'Factor juventud: P×1.2. N reducido por menor biomasa foliar.' },
    ],
    audit_events: [
      { event_type: 'plan_generado', actor_id: 'system', detail: null, created_at: '2025-09-15T14:00:00Z' },
      { event_type: 'plan_aprobado', actor_id: 'Ing. María López', detail: null, created_at: '2025-09-18T11:00:00Z' },
      { event_type: 'ejecucion_completada', actor_id: 'system', detail: { pct_total: 100 }, created_at: '2026-01-10T16:00:00Z' },
    ],
    fraccionamientos: [],
  },
};

export default function PlanDetailView({ planId, parcelaName, onBack }: Props) {
  const isDemo = planId.startsWith('demo-');
  const { data: rpcPlan, isLoading, error } = useNutritionPlanDetail(isDemo ? null : planId);
  const approveMutation = useApprovePlan();

  const plan = isDemo ? DEMO_PLAN_DETAILS[planId] : rpcPlan;

  if (!isDemo && isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (!plan) return (
    <Card><CardContent className="p-6 text-center">
      <p className="text-destructive">Error al cargar detalle del plan</p>
      <Button variant="outline" size="sm" onClick={onBack} className="mt-2"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
    </CardContent></Card>
  );

  const planJson = plan.plan_json as Record<string, any> | null;
  const canApprove = (plan.status === 'generado' || plan.status === 'borrador') && !isDemo;
  const tecnico = planJson?.tecnico as { nombre?: string; recomendaciones?: string; ajustes?: string } | null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          <div>
            <h2 className="text-lg font-semibold text-foreground">{parcelaName} — {plan.ciclo}</h2>
            <p className="text-xs text-muted-foreground">{plan.objetivo || 'Plan generado automáticamente'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <PlanStatusBadge status={plan.status} />
          {canApprove && (
            <Button size="sm" onClick={() => approveMutation.mutate(planId)} disabled={approveMutation.isPending}>
              <CheckCircle className="h-4 w-4 mr-1" />
              {approveMutation.isPending ? 'Aprobando…' : 'Aprobar Plan'}
            </Button>
          )}
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['resumen', 'tecnico', 'nutrientes', 'calendario']} className="space-y-2">
        {/* 1. Resumen */}
        <AccordionItem value="resumen" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2"><Sprout className="h-4 w-4 text-primary" /> Resumen</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
              <InfoCell label="Motor" value={plan.engine_version || 'v2'} />
              <InfoCell label="Modo" value={plan.modo_calculo || '—'} />
              <InfoCell label="Confianza" value={plan.nivel_confianza || '—'} />
              <InfoCell label="Hash" value={plan.hash_receta?.slice(0, 12) || '—'} />
            </div>
            {plan.approved_at && (
              <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle className="h-3.5 w-3.5 text-primary" />
                Aprobado el {new Date(plan.approved_at).toLocaleDateString('es')} por {plan.approved_by || 'sistema'}
              </div>
            )}
            {planJson?.data_quality?.missing?.length > 0 && (
              <div className="mt-3 flex items-start gap-2 text-xs text-destructive bg-destructive/10 p-2 rounded border border-destructive/20">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Datos faltantes: {planJson.data_quality.missing.join(', ')}</span>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

        {/* 1.5 Técnico / Recomendaciones */}
        {tecnico && (
          <AccordionItem value="tecnico" className="border rounded-lg border-primary/20">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-2"><User className="h-4 w-4 text-primary" /> Técnico y Recomendaciones</div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-3">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">{tecnico.nombre || 'Sin asignar'}</span>
              </div>
              {tecnico.recomendaciones && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                  <p className="text-xs font-semibold text-primary mb-1">Recomendaciones</p>
                  <p className="text-sm text-foreground">{tecnico.recomendaciones}</p>
                </div>
              )}
              {tecnico.ajustes && (
                <div className="bg-muted border border-border rounded-lg p-3">
                  <p className="text-xs font-semibold text-foreground mb-1">Ajustes aplicados</p>
                  <p className="text-sm text-muted-foreground">{tecnico.ajustes}</p>
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        )}

        {/* 2. Diagnóstico edáfico */}
        <AccordionItem value="diagnostico" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2"><Beaker className="h-4 w-4 text-primary" /> Diagnóstico Edáfico</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4 text-sm">
            {planJson?.restricciones_aplicadas?.length > 0 ? (
              <ul className="space-y-1">
                {(planJson.restricciones_aplicadas as string[]).map((r, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-amber-500" />
                    <span className="text-muted-foreground">{r}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-muted-foreground">Sin restricciones edáficas aplicadas.</p>}
          </AccordionContent>
        </AccordionItem>

        {/* 3. Nutrientes */}
        <AccordionItem value="nutrientes" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2"><Leaf className="h-4 w-4 text-primary" /> Nutrientes ({plan.nutrients?.length || 0})</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {plan.nutrients?.length ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {plan.nutrients.map((n) => (
                  <div key={n.nutrient_code} className="p-3 rounded-lg border border-border text-center space-y-1">
                    <p className="text-xs text-muted-foreground">{n.source}</p>
                    <p className="text-lg font-bold text-foreground">{n.required_amount.toFixed(1)}</p>
                    <p className="text-xs text-muted-foreground">{n.unit}</p>
                    <Badge variant="outline" className="text-xs">{n.nutrient_code}</Badge>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin datos de nutrientes estructurados.</p>}
          </AccordionContent>
        </AccordionItem>

        {/* 4. Productos */}
        <AccordionItem value="productos" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Productos ({plan.products?.length || 0})</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {plan.products?.length ? (
              <div className="space-y-2">
                {plan.products.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border text-sm">
                    <div>
                      <p className="font-medium text-foreground">{p.product_name}</p>
                      <p className="text-xs text-muted-foreground">{p.window_code?.replace(/_/g, ' ')}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-foreground">{p.dose} {p.unit}</p>
                      {p.price != null && <p className="text-xs text-muted-foreground">${p.price}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin productos asignados.</p>}
          </AccordionContent>
        </AccordionItem>

        {/* 5. Calendario */}
        <AccordionItem value="calendario" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /> Calendario ({plan.schedule?.length || 0})</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {plan.schedule?.length ? (
              <div className="space-y-2">
                {plan.schedule.map((s) => (
                  <div key={s.sequence_no} className="flex items-start gap-3 p-3 rounded-lg border border-border text-sm">
                    <div className="flex items-center justify-center h-7 w-7 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                      {s.sequence_no}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{s.window_code}</p>
                      {s.target_date && (
                        <p className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-0.5" />
                          {new Date(s.target_date).toLocaleDateString('es')}
                        </p>
                      )}
                    </div>
                    <PlanStatusBadge status={s.status} size="sm" />
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin calendario definido.</p>}
          </AccordionContent>
        </AccordionItem>

        {/* 6. Economía */}
        <AccordionItem value="economia" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Economía</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {planJson?.economia ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <InfoCell label="Fertilizantes" value={`$${planJson.economia.costo_fertilizantes_usd?.toFixed(0) ?? '—'}`} />
                  <InfoCell label="Mano de obra" value={`$${planJson.economia.costo_mano_obra_usd?.toFixed(0) ?? '—'}`} />
                  <InfoCell label="Total" value={`$${planJson.economia.costo_total_usd?.toFixed(0) ?? '—'}`} />
                  <InfoCell label="ROI estimado" value={planJson.economia.roi_estimado ? `${(planJson.economia.roi_estimado * 100).toFixed(0)}%` : '—'} />
                </div>
                {planJson.economia.roi_estimado && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-primary/5 p-2 rounded border border-primary/20">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <span>ROI {(planJson.economia.roi_estimado * 100).toFixed(0)}% — por cada $1 invertido se esperan ${(1 + planJson.economia.roi_estimado).toFixed(1)} de retorno</span>
                  </div>
                )}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin datos económicos.</p>}
          </AccordionContent>
        </AccordionItem>

        {/* 7. Explain */}
        <AccordionItem value="explain" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> Trazabilidad ({plan.explain_steps?.length || 0})</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {plan.explain_steps?.length ? (
              <ol className="space-y-3">
                {plan.explain_steps.map((s) => (
                  <li key={s.step_order} className="text-sm border-l-2 border-primary/30 pl-3">
                    <span className="font-medium text-foreground">{s.step_order}. {s.title}</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{s.detail}</p>
                  </li>
                ))}
              </ol>
            ) : <p className="text-sm text-muted-foreground">Sin pasos de trazabilidad.</p>}
          </AccordionContent>
        </AccordionItem>

        {/* 8. Auditoría */}
        <AccordionItem value="auditoria" className="border rounded-lg">
          <AccordionTrigger className="px-4 py-3 hover:no-underline">
            <div className="flex items-center gap-2"><History className="h-4 w-4 text-primary" /> Auditoría ({plan.audit_events?.length || 0})</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {plan.audit_events?.length ? (
              <div className="space-y-2">
                {plan.audit_events.map((e, i) => (
                  <div key={i} className="flex items-center gap-3 text-sm p-2 rounded-lg border border-border">
                    <Badge variant="outline" className="text-xs shrink-0">{e.event_type.replace(/_/g, ' ')}</Badge>
                    <span className="text-xs text-muted-foreground flex-1">{e.actor_id}</span>
                    <span className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleString('es')}</span>
                  </div>
                ))}
              </div>
            ) : <p className="text-sm text-muted-foreground">Sin eventos de auditoría.</p>}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2 rounded-lg border border-border">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground text-sm">{value}</p>
    </div>
  );
}
