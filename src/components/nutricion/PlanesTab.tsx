import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { applyOrgFilter } from '@/lib/orgFilter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { FileText, Sprout, Zap, DollarSign, Calendar, Package, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

interface NutritionPlan {
  id: string; parcela_id: string; ciclo: string; objetivo: string | null;
  supuestos_json: any; status: string; created_at: string;
}

interface Aplicacion {
  id: string; plan_id: string; orden: number; producto: string;
  dosis_por_ha: string | null; metodo: string | null; mes_aplicacion: string | null;
  costo_estimado_usd: number | null; evidencia_doc_id: string | null; notas: string | null;
}

interface Parcela { id: string; nombre: string; }

const STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-muted text-muted-foreground',
  activo: 'bg-success/10 text-success border-success/20',
  completado: 'bg-primary/10 text-primary border-primary/20',
  cancelado: 'bg-destructive/10 text-destructive border-destructive/20',
};

export default function PlanesTab() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();
  const [showGenerate, setShowGenerate] = useState(false);

  // Fetch plans
  const { data: planes, isLoading } = useQuery({
    queryKey: ['ag_nutrition_planes', organizationId],
    queryFn: async () => {
      let q = supabase.from('ag_nutrition_planes').select('*');
      q = applyOrgFilter(q, organizationId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as NutritionPlan[];
    },
    enabled: !!organizationId,
  });

  // Fetch parcelas for name lookup
  const { data: parcelas } = useQuery({
    queryKey: ['parcelas_for_planes', organizationId],
    queryFn: async () => {
      let q = supabase.from('parcelas').select('id, nombre');
      q = applyOrgFilter(q, organizationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Parcela[];
    },
    enabled: !!organizationId,
  });

  const parcelaName = (id: string) => parcelas?.find(p => p.id === id)?.nombre ?? id.slice(0, 8);

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
                queryClient.invalidateQueries({ queryKey: ['ag_nutrition_planes'] });
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
            <PlanCard key={plan.id} plan={plan} parcelaName={parcelaName(plan.parcela_id)} />
          ))}
        </Accordion>
      )}
    </div>
  );
}

function PlanCard({ plan, parcelaName }: { plan: NutritionPlan; parcelaName: string }) {
  const { data: aplicaciones, isLoading } = useQuery({
    queryKey: ['ag_nutrition_aplicaciones', plan.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ag_nutrition_aplicaciones')
        .select('*')
        .eq('plan_id', plan.id)
        .order('orden');
      if (error) throw error;
      return (data ?? []) as Aplicacion[];
    },
  });

  const totalCost = aplicaciones?.reduce((sum, a) => sum + (a.costo_estimado_usd ?? 0), 0) ?? 0;

  return (
    <AccordionItem value={plan.id} className="border rounded-lg">
      <AccordionTrigger className="px-4 py-3 hover:no-underline">
        <div className="flex items-center gap-3 w-full mr-2">
          <Sprout className="h-5 w-5 text-primary shrink-0" />
          <div className="text-left flex-1">
            <p className="text-sm font-medium">{parcelaName} — {plan.ciclo}</p>
            <p className="text-xs text-muted-foreground">{plan.objetivo || 'Plan generado automáticamente'}</p>
          </div>
          <Badge variant="outline" className={STATUS_COLORS[plan.status] ?? ''}>{plan.status}</Badge>
          {totalCost > 0 && (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" />{totalCost.toFixed(0)} USD
            </span>
          )}
        </div>
      </AccordionTrigger>
      <AccordionContent className="px-4 pb-4">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : !aplicaciones?.length ? (
          <p className="text-sm text-muted-foreground">Sin aplicaciones definidas.</p>
        ) : (
          <div className="space-y-2">
            {aplicaciones.map((app, i) => (
              <div key={app.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30 text-sm">
                <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                  {app.orden}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{app.producto}</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                    {app.dosis_por_ha && <span>Dosis: {app.dosis_por_ha}</span>}
                    {app.metodo && <span>Método: {app.metodo}</span>}
                    {app.mes_aplicacion && <span><Calendar className="h-3 w-3 inline mr-0.5" />{app.mes_aplicacion}</span>}
                    {app.costo_estimado_usd != null && <span><DollarSign className="h-3 w-3 inline" />{app.costo_estimado_usd} USD</span>}
                  </div>
                  {app.notas && <p className="text-xs text-muted-foreground/70 mt-1">{app.notas}</p>}
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
    onSuccess: (planId) => {
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
