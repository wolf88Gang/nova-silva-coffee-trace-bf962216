/**
 * Hook to fetch lotes_comerciales from Supabase.
 * Falls back to DEMO_LOTES_COMERCIALES when no org or no rows.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_KEY, TABLE } from '@/lib/keys';
import { DEMO_LOTES_COMERCIALES, type DemoLoteComercial } from '@/lib/demo-data';

export interface LoteComercial {
  id: string;
  organization_id: string;
  codigo_ico: string | null;
  origen: string | null;
  peso_sacos: number | null;
  tipo_cafe: string | null;
  puntaje_sca: number | null;
  estado_eudr: string | null;
  estado: string | null;
  contrato_id: string | null;
  created_at: string;
}

/** Map DB row → DemoLoteComercial shape for backward-compat with UI */
function toDemo(r: LoteComercial): DemoLoteComercial {
  return {
    id: r.id,
    codigoICO: r.codigo_ico ?? '',
    origen: r.origen ?? '',
    pesoSacos: r.peso_sacos ?? 0,
    tipoCafe: r.tipo_cafe ?? '',
    puntajeSCA: r.puntaje_sca ?? 0,
    estadoEUDR: (r.estado_eudr as DemoLoteComercial['estadoEUDR']) ?? 'pending',
    estado: (r.estado as DemoLoteComercial['estado']) ?? 'en_formacion',
    contratoId: r.contrato_id ?? undefined,
  };
}

export function useLotesComerciales() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['lotes-comerciales', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.LOTS_COMMERCIAL)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (!data || data.length === 0) return DEMO_LOTES_COMERCIALES;
      return (data as LoteComercial[]).map(toDemo);
    },
    placeholderData: DEMO_LOTES_COMERCIALES,
  });
}
