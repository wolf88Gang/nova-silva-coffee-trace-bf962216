/**
 * Hook para listar ofertas comerciales del tenant.
 * Requiere tabla ofertas_comerciales en Supabase.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';

export function useOfertasComerciales(options?: { loteComercialId?: string }) {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: ['ofertas_comerciales', organizationId, options?.loteComercialId],
    queryFn: async () => {
      if (!organizationId) return [];
      try {
        let q = supabase
          .from('ofertas_comerciales')
          .select('*')
          .eq('organization_id', organizationId);
        if (options?.loteComercialId) {
          q = q.eq('lote_comercial_id', options.loteComercialId);
        }
        const { data, error } = await q;
        if (error) return [];
        return data ?? [];
      } catch {
        return [];
      }
    },
    enabled: !orgLoading && !!organizationId,
  });
}
