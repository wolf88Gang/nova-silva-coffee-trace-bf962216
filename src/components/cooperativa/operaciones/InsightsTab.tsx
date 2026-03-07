import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useParcelas } from '@/hooks/useParcelas';
import { useModuleSnapshot } from '@/hooks/useModuleSnapshot';
import { usePlotSnapshotsHistory } from '@/hooks/usePlotSnapshotsHistory';
import { plotSnapshotToModuleSnapshot } from '@/lib/interModuleEngine';
import { ModuleIntegrationCard } from '@/components/insights/ModuleIntegrationCard';
import { DiseaseAssessmentForm } from '@/components/guard/DiseaseAssessmentForm';
import { ResilienceAssessmentForm } from '@/components/vital/ResilienceAssessmentForm';
import { ProductivityGapChart, type CycleData } from '@/components/insights/ProductivityGapChart';
import { InsightsPanel } from '@/components/insights/InsightsPanel';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/config/keys';
import { toast } from 'sonner';

const CICLOS = ['2025-2026', '2024-2025', '2023-2024'];

export default function InsightsTab() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();
  const { data: parcelas = [] } = useParcelas();

  const [parcelaId, setParcelaId] = useState<string>('');
  const [ciclo, setCiclo] = useState<string>(CICLOS[0] ?? '2025-2026');

  const selectedParcelaId = parcelaId || (parcelas[0] as { id: string } | undefined)?.id || null;
  const selectedParcela = parcelas.find((p: { id: string }) => p.id === selectedParcelaId) as { nombre?: string; nombre_parcela?: string } | undefined;
  const parcelaNombre = selectedParcela?.nombre ?? selectedParcela?.nombre_parcela ?? 'Parcela';

  const { snapshot: rawSnapshot, upsertSnapshot } = useModuleSnapshot(selectedParcelaId, ciclo);
  const { data: historyData = [] } = usePlotSnapshotsHistory(selectedParcelaId);

  const snapshot = plotSnapshotToModuleSnapshot(rawSnapshot as Record<string, unknown> | null);

  const chartData: CycleData[] = historyData.map((r: { ciclo: string; yield_expected?: number; yield_real?: number; yield_adjusted?: number; productivity_gap?: number }) => ({
    ciclo: r.ciclo,
    yieldExpected: r.yield_expected ?? 0,
    yieldReal: r.yield_real,
    yieldAdjusted: r.yield_adjusted,
    productivityGap: r.productivity_gap,
  }));

  const handleDiseaseSave = async (data: {
    roya: number;
    broca: number;
    defoliation: number;
    stress: number;
    diseasePressureIndex: number;
    diseaseFactor: number;
  }) => {
    if (!organizationId || !selectedParcelaId) return;
    try {
      await supabase.from('disease_assessments').insert({
        organization_id: organizationId,
        parcela_id: selectedParcelaId,
        ciclo,
        fecha_evaluacion: new Date().toISOString().slice(0, 10),
        roya_incidence: data.roya,
        broca_incidence: data.broca,
        defoliation_level: data.defoliation,
        stress_symptoms: data.stress,
        disease_pressure_index: data.diseasePressureIndex,
        disease_factor: data.diseaseFactor,
      });
      const yieldEst = (rawSnapshot?.yield_expected as number) ?? 2500;
      const nutrientFactor = (rawSnapshot?.nutrient_factor as number) ?? 1;
      const waterFactor = (rawSnapshot?.water_factor as number) ?? 1;
      const yieldAdjusted = yieldEst * data.diseaseFactor * nutrientFactor * waterFactor;
      await upsertSnapshot({
        yield_expected: rawSnapshot?.yield_expected ?? yieldEst,
        roya_incidence: data.roya,
        broca_incidence: data.broca,
        defoliation_level: data.defoliation,
        disease_pressure_index: data.diseasePressureIndex,
        disease_factor: data.diseaseFactor,
        yield_adjusted: yieldAdjusted,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleSnapshot });
      toast.success('Evaluación fitosanitaria guardada');
    } catch (e) {
      toast.error('Error al guardar');
      throw e;
    }
  };

  const handleResilienceSave = async (data: {
    soilHealth: number;
    organicMatter: number;
    biodiversity: number;
    waterManagement: number;
    erosionControl: number;
    resilienceIndex: number;
    resilienceLevel: string;
  }) => {
    if (!organizationId || !selectedParcelaId) return;
    try {
      await supabase.from('resilience_assessments').insert({
        organization_id: organizationId,
        parcela_id: selectedParcelaId,
        ciclo,
        fecha_evaluacion: new Date().toISOString().slice(0, 10),
        soil_health: data.soilHealth,
        organic_matter_score: data.organicMatter,
        biodiversity: data.biodiversity,
        water_management: data.waterManagement,
        erosion_control: data.erosionControl,
        resilience_index: data.resilienceIndex,
        resilience_level: data.resilienceLevel,
      });
      const yieldEst = (rawSnapshot?.yield_expected as number) ?? 2500;
      const nutrientFactor = (rawSnapshot?.nutrient_factor as number) ?? 1;
      const diseaseFactor = (rawSnapshot?.disease_factor as number) ?? 1;
      const waterFactor = Math.max(0.5, 1 - data.resilienceIndex * 0.3);
      const yieldAdjusted = yieldEst * diseaseFactor * nutrientFactor * waterFactor;
      await upsertSnapshot({
        yield_expected: rawSnapshot?.yield_expected ?? yieldEst,
        soil_health_score: data.soilHealth,
        resilience_index: data.resilienceIndex,
        water_factor: waterFactor,
        yield_adjusted: yieldAdjusted,
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.moduleSnapshot });
      toast.success('Evaluación de resiliencia guardada');
    } catch (e) {
      toast.error('Error al guardar');
      throw e;
    }
  };

  if (parcelas.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
        No hay parcelas registradas. Agregá parcelas para ver el análisis integrado.
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Parcela</label>
          <Select value={selectedParcelaId ?? ''} onValueChange={setParcelaId}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Seleccionar parcela" />
            </SelectTrigger>
            <SelectContent>
              {parcelas.map((p: { id: string; nombre?: string; nombre_parcela?: string }) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.nombre ?? p.nombre_parcela ?? p.id}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm text-muted-foreground block mb-1">Campaña</label>
          <Select value={ciclo} onValueChange={setCiclo}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CICLOS.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ModuleIntegrationCard
          snapshot={snapshot}
          parcelaNombre={parcelaNombre}
          ciclo={ciclo}
        />
        <InsightsPanel
          parcelaNombre={parcelaNombre}
          limitingFactor={snapshot?.limitingNutrient ?? undefined}
          riskLevel={snapshot ? (snapshot.diseasePressureIndex > 0.6 ? 'alto' : snapshot.diseasePressureIndex > 0.35 ? 'medio' : 'bajo') : undefined}
        />
      </div>

      <ProductivityGapChart data={chartData} />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DiseaseAssessmentForm
          parcelaId={selectedParcelaId!}
          ciclo={ciclo}
          yieldEstimated={(rawSnapshot?.yield_expected as number) ?? 2500}
          onSave={handleDiseaseSave}
        />
        <ResilienceAssessmentForm
          parcelaId={selectedParcelaId!}
          ciclo={ciclo}
          onSave={handleResilienceSave}
        />
      </div>
    </div>
  );
}
