/**
 * SoilHealthTab — Pestaña de diagnóstico edáfico integral.
 * Conecta datos reales de nutricion_analisis_suelo al motor de inteligencia.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Layers } from 'lucide-react';
import SoilIntelligenceCard from './SoilIntelligenceCard';
import type { SoilAnalysisInput } from '@/lib/soilIntelligenceEngine';

interface Parcela { id: string; nombre: string | null }
interface SueloRow {
  id: string; parcela_id: string; fecha_analisis: string;
  ph: number | null; mo_pct: number | null; p_ppm: number | null;
  k_cmol: number | null; ca_cmol: number | null; mg_cmol: number | null;
  s_ppm: number | null; cice: number | null; textura: string | null;
  al_cmol?: number | null;
}

export default function SoilHealthTab() {
  const { organizationId } = useOrgContext();
  const [selectedParcela, setSelectedParcela] = useState<string>('');

  // Fetch parcelas
  const { data: parcelas = [] } = useQuery({
    queryKey: ['parcelas-soil-health', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('parcelas')
        .select('id, nombre')
        .eq('cooperativa_id', organizationId!);
      if (error) throw error;
      return (data ?? []) as Parcela[];
    },
  });

  // Fetch latest soil analysis for selected parcela
  const { data: sueloData, isLoading } = useQuery({
    queryKey: ['soil-analysis-latest', selectedParcela],
    enabled: !!selectedParcela,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutricion_analisis_suelo')
        .select('*')
        .eq('parcela_id', selectedParcela)
        .order('fecha_analisis', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as SueloRow | null;
    },
  });

  const parcelaName = parcelas.find(p => p.id === selectedParcela)?.nombre ?? undefined;

  const soilInput: SoilAnalysisInput | null = sueloData ? {
    ph: sueloData.ph,
    mo_pct: sueloData.mo_pct,
    p_ppm: sueloData.p_ppm,
    k_cmol: sueloData.k_cmol,
    ca_cmol: sueloData.ca_cmol,
    mg_cmol: sueloData.mg_cmol,
    s_ppm: sueloData.s_ppm,
    cice: sueloData.cice,
    al_cmol: (sueloData as any).al_cmol ?? null,
    textura: sueloData.textura,
  } : null;

  return (
    <div className="space-y-6">
      {/* Selector de parcela */}
      <div className="flex items-center gap-3">
        <Layers className="h-5 w-5 text-primary" />
        <Select value={selectedParcela} onValueChange={setSelectedParcela}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Seleccionar parcela para diagnóstico" />
          </SelectTrigger>
          <SelectContent>
            {parcelas.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.nombre || p.id.slice(0, 8)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Loading */}
      {isLoading && selectedParcela && (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      )}

      {/* No parcela selected */}
      {!selectedParcela && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <Layers className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Seleccione una parcela para ver el diagnóstico edáfico integral.</p>
            <p className="text-xs mt-1">Incluye: encalado Kamprath, IFBS, bloqueo por toxicidad y suficiencia nutricional.</p>
          </CardContent>
        </Card>
      )}

      {/* No data for parcela */}
      {selectedParcela && !isLoading && !sueloData && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <p>No hay análisis de suelo registrados para esta parcela.</p>
            <p className="text-xs mt-1">Registre un análisis en la pestaña "Análisis" para activar el diagnóstico.</p>
          </CardContent>
        </Card>
      )}

      {/* Results */}
      {soilInput && (
        <SoilIntelligenceCard soilData={soilInput} parcelaName={parcelaName ?? undefined} />
      )}
    </div>
  );
}
