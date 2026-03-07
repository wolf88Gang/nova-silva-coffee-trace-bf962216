/**
 * Hook para listar lotes de exportación del tenant.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';

export function useLotesExportacion(options?: { loteComercialId?: string; estado?: string }) {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: [...QUERY_KEYS.lotesExportacion, organizationId, options?.loteComercialId, options?.estado],
    queryFn: async () => {
      if (!organizationId) return [];
      let q = supabase
        .from('lotes_exportacion')
        .select('*')
        .eq('organization_id', organizationId);
      if (options?.loteComercialId) {
        q = q.eq('lote_comercial_id', options.loteComercialId);
      }
      if (options?.estado) {
        q = q.eq('estado', options.estado);
      }
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !orgLoading && !!organizationId,
  });
}
