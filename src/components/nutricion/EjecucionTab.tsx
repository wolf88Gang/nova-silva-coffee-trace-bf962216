import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, CheckCircle } from 'lucide-react';

interface PlanOption {
  id: string;
  parcela_nombre: string;
  ciclo: string;
  status: string;
}

export default function EjecucionTab() {
  const { organizationId } = useOrgContext();
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  const { data: planOptions } = useQuery({
    queryKey: ['ag_planes_for_ejecucion', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ag_planes_nutricion')
        .select('id, parcela_id, estado, created_at')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) return [];
      const parcelaIds = [...new Set((data ?? []).map((d: { parcela_id: string }) => d.parcela_id))];
      let parcelas: Record<string, string> = {};
      if (parcelaIds.length > 0) {
        const { data: pData } = await supabase.from('parcelas').select('id, nombre').in('id', parcelaIds);
        parcelas = Object.fromEntries((pData ?? []).map((p: { id: string; nombre: string }) => [p.id, p.nombre]));
      }
      return (data ?? []).map((d: { id: string; parcela_id: string; created_at: string; estado: string }) => {
        const year = new Date(d.created_at).getFullYear();
        return {
          id: d.id,
          parcela_nombre: parcelas[d.parcela_id] ?? d.parcela_id?.slice(0, 8),
          ciclo: `${year}-${year + 1}`,
          status: d.estado,
        };
      }) as PlanOption[];
    },
    enabled: !!organizationId,
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-lg font-semibold">Registro de ejecución</h2>
      <p className="text-sm text-muted-foreground">
        Selecciona un plan y registra las aplicaciones realizadas.
      </p>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div>
            <Label>Plan de nutrición</Label>
            <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
              <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
              <SelectContent>
                {(planOptions ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.parcela_nombre} — {p.ciclo} ({p.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPlanId && (
            <div className="p-4 rounded-lg bg-muted/30 text-sm">
              <p className="font-medium">Plan seleccionado</p>
              <p className="text-muted-foreground mt-1">
                {planOptions?.find((p) => p.id === selectedPlanId)?.parcela_nombre} —{' '}
                {planOptions?.find((p) => p.id === selectedPlanId)?.ciclo}
              </p>
              <Button size="sm" className="mt-3 gap-1.5" disabled>
                <Calendar className="h-4 w-4" />
                Registrar aplicación
              </Button>
              <p className="text-xs text-muted-foreground mt-2">
                Módulo en desarrollo — el registro de aplicaciones se conectará próximamente.
              </p>
            </div>
          )}

          {(!planOptions || planOptions.length === 0) && (
            <div className="py-8 text-center">
              <CheckCircle className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">No hay planes disponibles.</p>
              <p className="text-xs text-muted-foreground mt-1">
                Genera un plan en la pestaña Planes primero.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
