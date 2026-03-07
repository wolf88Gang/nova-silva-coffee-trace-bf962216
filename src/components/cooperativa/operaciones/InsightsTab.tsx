import { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useModuleSnapshot } from '@/hooks/useModuleSnapshot';
import { supabase } from '@/integrations/supabase/client';
import { ORG_KEY } from '@/lib/keys';
import { useQuery } from '@tanstack/react-query';
import ModuleIntegrationCard from '@/components/insights/ModuleIntegrationCard';
import InsightsPanel from '@/components/insights/InsightsPanel';
import ProductivityGapChart from '@/components/insights/ProductivityGapChart';
import DiseaseAssessmentForm from '@/components/guard/DiseaseAssessmentForm';
import ResilienceAssessmentForm from '@/components/vital/ResilienceAssessmentForm';

export default function InsightsTab() {
  const { organizationId } = useOrgContext();
  const [parcelaId, setParcelaId] = useState<string | null>(null);
  const [ciclo, setCiclo] = useState('2024-2025');
  const [formsOpen, setFormsOpen] = useState(false);

  const { data: parcelas } = useQuery({
    queryKey: ['parcelas-list', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcelas')
        .select('id, nombre')
        .eq(ORG_KEY, organizationId!);
      if (error) {
        // Fallback: try cooperativa_id
        const { data: d2, error: e2 } = await supabase
          .from('parcelas')
          .select('id, nombre')
          .eq('cooperativa_id', organizationId!);
        if (e2) throw e2;
        return d2 ?? [];
      }
      return data ?? [];
    },
  });

  const { snapshot } = useModuleSnapshot(parcelaId, ciclo);

  return (
    <div className="space-y-4">
      {/* Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Label>Parcela</Label>
          <Select value={parcelaId ?? ''} onValueChange={setParcelaId}>
            <SelectTrigger><SelectValue placeholder="Seleccionar parcela..." /></SelectTrigger>
            <SelectContent>
              {(parcelas ?? []).map((p: { id: string; nombre: string }) => (
                <SelectItem key={p.id} value={p.id}>{p.nombre}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Campaña</Label>
          <Input value={ciclo} onChange={(e) => setCiclo(e.target.value)} placeholder="2024-2025" />
        </div>
      </div>

      {!parcelaId ? (
        <p className="text-muted-foreground text-sm">Seleccione una parcela para ver los insights.</p>
      ) : (
        <>
          <ModuleIntegrationCard snapshot={snapshot} />
          <InsightsPanel snapshot={snapshot} />
          <ProductivityGapChart parcelaId={parcelaId} />

          <Collapsible open={formsOpen} onOpenChange={setFormsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <ChevronDown className={`h-4 w-4 mr-2 transition-transform ${formsOpen ? 'rotate-180' : ''}`} />
                Evaluaciones
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <DiseaseAssessmentForm parcelaId={parcelaId} ciclo={ciclo} />
                <ResilienceAssessmentForm parcelaId={parcelaId} ciclo={ciclo} />
              </div>
            </CollapsibleContent>
          </Collapsible>
        </>
      )}
    </div>
  );
}
