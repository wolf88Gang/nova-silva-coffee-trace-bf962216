/**
 * Full plan detail view — 8 sections consuming get_plan_detail RPC.
 * Sections: Resumen, Diagnóstico, Nutrientes, Productos, Calendario,
 *           Economía, Explain, Historial/Auditoría.
 */
import { useNutritionPlanDetail, useApprovePlan } from '@/hooks/useNutritionPlanDetail';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Separator } from '@/components/ui/separator';
import {
  CheckCircle, Clock, Sprout, Beaker, ShoppingCart, Calendar,
  DollarSign, FileText, History, ArrowLeft, Shield, AlertTriangle,
} from 'lucide-react';
import PlanStatusBadge from './PlanStatusBadge';

interface Props {
  planId: string;
  parcelaName: string;
  onBack: () => void;
}

export default function PlanDetailView({ planId, parcelaName, onBack }: Props) {
  const { data: plan, isLoading, error } = useNutritionPlanDetail(planId);
  const approveMutation = useApprovePlan();

  if (isLoading) return <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>;
  if (error || !plan) return (
    <Card><CardContent className="p-6 text-center">
      <p className="text-destructive">Error al cargar detalle del plan</p>
      <Button variant="outline" size="sm" onClick={onBack} className="mt-2"><ArrowLeft className="h-4 w-4 mr-1" /> Volver</Button>
    </CardContent></Card>
  );

  const planJson = plan.plan_json as Record<string, any> | null;
  const canApprove = plan.status === 'generado' || plan.status === 'borrador';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
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
            <Button
              size="sm"
              onClick={() => approveMutation.mutate(planId)}
              disabled={approveMutation.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-1" />
              {approveMutation.isPending ? 'Aprobando…' : 'Aprobar Plan'}
            </Button>
          )}
        </div>
      </div>

      <Accordion type="multiple" defaultValue={['resumen', 'nutrientes', 'calendario']} className="space-y-2">
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
            {planJson?.data_quality?.missing?.length > 0 && (
              <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 bg-amber-50 dark:bg-amber-950/30 p-2 rounded">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Datos faltantes: {planJson.data_quality.missing.join(', ')}</span>
              </div>
            )}
          </AccordionContent>
        </AccordionItem>

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
            <div className="flex items-center gap-2"><Sprout className="h-4 w-4 text-primary" /> Nutrientes ({plan.nutrients?.length || 0})</div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            {plan.nutrients?.length ? (
              <div className="space-y-2">
                {plan.nutrients.map((n) => (
                  <div key={n.nutrient_code} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                    <span className="font-medium text-foreground">{n.nutrient_code}</span>
                    <span className="text-muted-foreground">{n.required_amount.toFixed(1)} {n.unit}</span>
                    <Badge variant="outline" className="text-xs">{n.source}</Badge>
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
                  <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/30 text-sm">
                    <span className="font-medium text-foreground">{p.product_name}</span>
                    <span className="text-muted-foreground">{p.dose} {p.unit}</span>
                    <span className="text-muted-foreground">{p.window_code}</span>
                    {p.price != null && <span className="text-muted-foreground">${p.price.toFixed(2)}</span>}
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
                  <div key={s.sequence_no} className="flex items-start gap-3 p-3 rounded bg-muted/30 text-sm">
                    <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
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
                      <PlanStatusBadge status={s.status} size="sm" />
                    </div>
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
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <InfoCell label="Fertilizantes" value={`$${planJson.economia.costo_fertilizantes_usd?.toFixed(0) ?? '—'}`} />
                <InfoCell label="Mano de obra" value={`$${planJson.economia.costo_mano_obra_usd?.toFixed(0) ?? '—'}`} />
                <InfoCell label="Total" value={`$${planJson.economia.costo_total_usd?.toFixed(0) ?? '—'}`} />
                <InfoCell label="ROI" value={planJson.economia.roi_estimado ? `${(planJson.economia.roi_estimado * 100).toFixed(0)}%` : '—'} />
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
              <ol className="space-y-2">
                {plan.explain_steps.map((s) => (
                  <li key={s.step_order} className="text-sm">
                    <span className="font-medium text-foreground">{s.step_order}. {s.title}</span>
                    <p className="text-xs text-muted-foreground ml-4">{s.detail}</p>
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
                  <div key={i} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/30">
                    <Badge variant="outline" className="text-xs">{e.event_type}</Badge>
                    <span className="text-muted-foreground text-xs">{new Date(e.created_at).toLocaleString('es')}</span>
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
    <div className="p-2 rounded bg-muted/30">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground text-sm">{value}</p>
    </div>
  );
}
