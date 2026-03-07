/**
 * Hook to fetch contratos from Supabase.
 * Falls back to demo data when no org or empty result.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_KEY, TABLE } from '@/lib/keys';

export interface Contrato {
  id: string;
  organization_id: string;
  numero: string | null;
  cliente: string | null;
  pais: string | null;
  volumen: number | null;
  unidad: string | null;
  precio_lb: number | null;
  incoterm: string | null;
  ventana: string | null;
  estado: 'activo' | 'en_ejecucion' | 'cerrado';
  ejecutado: number | null;
  notas: string | null;
  created_at: string;
}

// Demo fallback (mirrors ExportadorContratos.tsx original data)
const DEMO_CONTRATOS: Contrato[] = [
  { id: 'C-001', organization_id: '', numero: 'NS-2026-001', cliente: 'European Coffee Trading GmbH', pais: 'Alemania', volumen: 250, unidad: 'sacos 69kg', precio_lb: 4.20, incoterm: 'FOB', ventana: 'Mar-Abr 2026', estado: 'activo', ejecutado: 60, notas: 'SHB EP, preparación europea. Score mínimo 82.', created_at: '' },
  { id: 'C-002', organization_id: '', numero: 'NS-2026-002', cliente: 'Nordic Roasters AB', pais: 'Suecia', volumen: 180, unidad: 'sacos 69kg', precio_lb: 4.50, incoterm: 'CIF', ventana: 'Feb-Mar 2026', estado: 'en_ejecucion', ejecutado: 85, notas: 'Micro-lot Geisha. CIF Gotemburgo. Score >85.', created_at: '' },
  { id: 'C-003', organization_id: '', numero: 'NS-2025-015', cliente: 'Specialty Imports LLC', pais: 'USA', volumen: 320, unidad: 'sacos 69kg', precio_lb: 3.80, incoterm: 'FOB', ventana: 'Nov-Dic 2025', estado: 'cerrado', ejecutado: 100, notas: 'HB, preparación americana.', created_at: '' },
  { id: 'C-004', organization_id: '', numero: 'NS-2026-003', cliente: 'Tokyo Beans Co.', pais: 'Japón', volumen: 120, unidad: 'sacos 69kg', precio_lb: 5.10, incoterm: 'CIF', ventana: 'Abr-May 2026', estado: 'activo', ejecutado: 0, notas: 'Geisha natural process. CIF Yokohama. Score >88.', created_at: '' },
  { id: 'C-005', organization_id: '', numero: 'NS-2026-004', cliente: 'Melbourne Roast Co.', pais: 'Australia', volumen: 90, unidad: 'sacos 69kg', precio_lb: 4.75, incoterm: 'CIF', ventana: 'May-Jun 2026', estado: 'activo', ejecutado: 0, notas: 'SHB honey process. CIF Melbourne.', created_at: '' },
];

export function useContratos() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['contratos', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.CONTRACTS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return DEMO_CONTRATOS;
      return data as Contrato[];
    },
    placeholderData: DEMO_CONTRATOS,
  });
}
