import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft } from 'lucide-react';

interface PlanDetailViewProps {
  planId: string;
  parcelaName: string;
  onBack: () => void;
}

export default function PlanDetailView({ planId, parcelaName, onBack }: PlanDetailViewProps) {
  const { data: plan, isLoading } = useQuery({
    queryKey: ['ag_planes_nutricion_detail', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ag_planes_nutricion')
        .select('*')
        .eq('id', planId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!planId && !planId.startsWith('demo-'),
  });

  const { data: fraccionamientos } = useQuery({
    queryKey: ['nutricion_fraccionamientos', planId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutricion_fraccionamientos')
        .select('*')
        .eq('plan_id', planId)
        .order('numero_aplicacion');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!planId && !planId.startsWith('demo-'),
  });

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
        <ArrowLeft className="h-4 w-4" />
        Volver a planes
      </Button>
      <Card>
        <CardContent className="pt-6">
          <h2 className="text-lg font-semibold">{parcelaName}</h2>
          <p className="text-sm text-muted-foreground mt-1">Plan {planId.slice(0, 8)}…</p>
          {isLoading ? (
            <p className="text-sm text-muted-foreground mt-4">Cargando…</p>
          ) : plan ? (
            <div className="mt-4 space-y-2 text-sm">
              <p><span className="text-muted-foreground">Estado:</span> {plan.estado}</p>
              {plan.rendimiento_proyectado_kg_ha && (
                <p><span className="text-muted-foreground">Rendimiento proyectado:</span> {plan.rendimiento_proyectado_kg_ha.toLocaleString()} kg/ha</p>
              )}
            </div>
          ) : null}
          {fraccionamientos && fraccionamientos.length > 0 && (
            <div className="mt-6">
              <h3 className="text-sm font-medium mb-2">Fraccionamientos</h3>
              <div className="space-y-2">
                {fraccionamientos.map((f: { id: string; numero_aplicacion: number; etapa_fenologica?: string; n_kg_ha?: number; p2o5_kg_ha?: number; k2o_kg_ha?: number }) => (
                  <div key={f.id} className="p-3 rounded-md bg-muted/30 text-sm">
                    Aplicación {f.numero_aplicacion}
                    {f.etapa_fenologica && ` · ${f.etapa_fenologica}`}
                    {(f.n_kg_ha ?? 0) > 0 && ` · N: ${f.n_kg_ha} kg/ha`}
                    {(f.p2o5_kg_ha ?? 0) > 0 && ` · P₂O₅: ${f.p2o5_kg_ha} kg/ha`}
                    {(f.k2o_kg_ha ?? 0) > 0 && ` · K₂O: ${f.k2o_kg_ha} kg/ha`}
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
