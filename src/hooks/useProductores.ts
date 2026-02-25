/**
 * Hook para listar productores del tenant.
 * Filtra por cooperativa_id = organizationId (desde profiles).
 * Para rol productor: opcionalmente eq('productor_id', productorId) si la UI lo requiere.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { DEMO_PRODUCTORES } from '@/lib/demo-data';

export function useProductores(options?: { filterByProductorId?: boolean }) {
  const { organizationId, productorId, role, isLoading: orgLoading } = useOrgContext();

  const query = useQuery({
    queryKey: ['productores', organizationId, productorId, options?.filterByProductorId],
    queryFn: async () => {
      // Cuando haya datos reales: filtrar por cooperativa_id = organizationId
      if (organizationId) {
        let q = supabase.from('productores').select('*').eq('cooperativa_id', organizationId);
        if (role === 'productor' && options?.filterByProductorId && productorId) {
          q = q.eq('id', productorId);
        }
        const { data, error } = await q;
        if (!error && data?.length) return data;
      }
      // Fallback: demo data (sin filtro por org en demo)
      return DEMO_PRODUCTORES;
    },
    enabled: !orgLoading,
  });

  return { ...query, organizationId };
}
