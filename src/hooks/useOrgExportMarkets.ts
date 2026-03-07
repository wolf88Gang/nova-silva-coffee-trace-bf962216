import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { TABLE, ORG_KEY } from '@/lib/keys';

export interface OrgExportMarket {
  id: string;
  organization_id: string;
  mercado: string;
  principal: boolean;
}

const MARKETS = ['EU', 'USA', 'JAPAN', 'CHINA', 'KOREA', 'CODEX'] as const;
export { MARKETS };

export function useOrgExportMarkets() {
  const { organizationId } = useOrgContext();
  const qc = useQueryClient();
  const key = ['orgExportMarkets', organizationId];

  const query = useQuery<OrgExportMarket[]>({
    queryKey: key,
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.ORG_EXPORT_MARKETS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('mercado');
      if (error) throw error;
      return (data as OrgExportMarket[]) ?? [];
    },
  });

  const toggleMarket = useMutation({
    mutationFn: async (mercado: string) => {
      const existing = (query.data ?? []).find((m) => m.mercado === mercado);
      if (existing) {
        const { error } = await supabase
          .from(TABLE.ORG_EXPORT_MARKETS)
          .delete()
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from(TABLE.ORG_EXPORT_MARKETS)
          .insert({ [ORG_KEY]: organizationId, mercado, principal: false });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const setPrincipal = useMutation({
    mutationFn: async (id: string) => {
      // Unset all principal first
      await supabase
        .from(TABLE.ORG_EXPORT_MARKETS)
        .update({ principal: false })
        .eq(ORG_KEY, organizationId!);
      const { error } = await supabase
        .from(TABLE.ORG_EXPORT_MARKETS)
        .update({ principal: true })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { markets: query.data ?? [], isLoading: query.isLoading, toggleMarket, setPrincipal };
}
