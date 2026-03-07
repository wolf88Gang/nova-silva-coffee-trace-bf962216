/**
 * Hook para listar reclamos postventa del tenant.
 * Tabla: reclamos_postventa.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';

export function useReclamos(options?: { loteComercialId?: string; estado?: string }) {
  const { organizationId, isLoading: orgLoading } = useOrgContext();

  return useQuery({
    queryKey: ['reclamos_postventa', organizationId, options?.loteComercialId, options?.estado],
    queryFn: async () => {
      if (!organizationId) return [];
      let q = supabase
        .from('reclamos_postventa')
        .select('*')
        .eq('organization_id', organizationId);
      if (options?.loteComercialId) {
        q = q.eq('lote_comercial_id', options.loteComercialId);
      }
      if (options?.estado) {
        q = q.eq('estado', options.estado);
      }
      const { data, error } = await q.order('fecha_reclamo', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !orgLoading && !!organizationId,
  });
}
