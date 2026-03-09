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

const DEMO_PARCELAS_SOIL: Parcela[] = [
  { id: 'demo-parcela-roble', nombre: 'Parcela El Roble' },
  { id: 'demo-parcela-ceiba', nombre: 'Parcela La Ceiba' },
  { id: 'demo-parcela-pinos', nombre: 'Parcela Los Pinos' },
];

const DEMO_SOIL_DATA: Record<string, SueloRow> = {
  'demo-parcela-roble': { id: 'ds-1', parcela_id: 'demo-parcela-roble', fecha_analisis: '2026-01-15', ph: 5.1, mo_pct: 5.2, p_ppm: 12, k_cmol: 0.35, ca_cmol: 4.2, mg_cmol: 0.8, s_ppm: 8, cice: 6.5, textura: 'Franco arcilloso', al_cmol: 0.15 },
  'demo-parcela-ceiba': { id: 'ds-2', parcela_id: 'demo-parcela-ceiba', fecha_analisis: '2026-01-20', ph: 4.6, mo_pct: 3.8, p_ppm: 6, k_cmol: 0.22, ca_cmol: 2.1, mg_cmol: 0.4, s_ppm: 5, cice: 4.2, textura: 'Franco arenoso', al_cmol: 0.8 },
  'demo-parcela-pinos': { id: 'ds-3', parcela_id: 'demo-parcela-pinos', fecha_analisis: '2026-02-05', ph: 5.8, mo_pct: 6.1, p_ppm: 18, k_cmol: 0.52, ca_cmol: 6.5, mg_cmol: 1.2, s_ppm: 12, cice: 9.0, textura: 'Franco', al_cmol: 0.05 },
};

export default function SoilHealthTab() {
  const { organizationId } = useOrgContext();
  const [selectedParcela, setSelectedParcela] = useState<string>('');

  // Fetch parcelas
  const { data: rawParcelas = [] } = useQuery({
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

  // Auto-select first parcela
  const effectiveParcela = selectedParcela || (parcelas.length > 0 ? parcelas[0].id : '');
  if (!selectedParcela && parcelas.length > 0) {
    setSelectedParcela(parcelas[0].id);
  }

  // Fetch latest soil analysis for selected parcela (map real DB columns)
  const isDemo = selectedParcela.startsWith('demo-');
  const { data: rawSueloData, isLoading } = useQuery({
    queryKey: ['soil-analysis-latest', selectedParcela],
    enabled: !!selectedParcela && !isDemo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutricion_analisis_suelo')
        .select('*')
        .eq('parcela_id', selectedParcela)
        .order('fecha_analisis', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      const r = data as any;
      return {
        id: r.id,
        parcela_id: r.parcela_id,
        fecha_analisis: r.fecha_analisis,
        ph: r.ph_agua ?? r.ph ?? null,
        mo_pct: r.materia_organica_pct ?? r.mo_pct ?? null,
        p_ppm: r.p_disponible ?? r.p_ppm ?? null,
        k_cmol: r.k_intercambiable ?? r.k_cmol ?? null,
        ca_cmol: r.ca_intercambiable ?? r.ca_cmol ?? null,
        mg_cmol: r.mg_intercambiable ?? r.mg_cmol ?? null,
        s_ppm: r.s_ppm ?? null,
        cice: r.cice ?? null,
        textura: r.textura ?? null,
        al_cmol: r.aluminio_intercambiable ?? r.al_cmol ?? null,
      } as SueloRow;
    },
  });

  const sueloData = isDemo ? (DEMO_SOIL_DATA[selectedParcela] ?? null) : rawSueloData;

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
