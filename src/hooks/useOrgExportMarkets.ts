import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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
  const qc = useQueryClient();
  const key = ['orgExportMarkets'];

  const query = useQuery<OrgExportMarket[]>({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_export_markets' as any);
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
          .insert({ mercado, principal: false } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const setPrincipal = useMutation({
    mutationFn: async (id: string) => {
      // Unset all principal first, then set the selected one
      const allIds = (query.data ?? []).map((m) => m.id);
      if (allIds.length > 0) {
        await supabase
          .from(TABLE.ORG_EXPORT_MARKETS)
          .update({ principal: false })
          .in('id', allIds);
      }
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
