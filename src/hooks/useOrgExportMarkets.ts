/**
 * Hook para CRUD de mercados de exportación de la organización.
 * Tabla: org_export_markets
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';

export interface OrgExportMarket {
  id: string;
  organization_id: string;
  mercado: string;
  es_principal?: boolean;
  activo?: boolean;
  created_at?: string;
}

const MERCADOS = ['EU', 'USA', 'JAPAN', 'CHINA', 'KOREA', 'CODEX'];

export function useOrgExportMarkets() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.orgExportMarkets, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_export_markets')
        .select('*')
        .eq('organization_id', organizationId!);
      if (error) throw error;
      return (data ?? []) as OrgExportMarket[];
    },
    enabled: !!organizationId,
  });

  const upsert = useMutation({
    mutationFn: async (row: { mercado: string; es_principal?: boolean; activo?: boolean }) => {
      const cached = queryClient.getQueryData<OrgExportMarket[]>([
        ...QUERY_KEYS.orgExportMarkets,
        organizationId,
      ]);
      const existing = (cached ?? []).find((m) => m.mercado === row.mercado);
      if (existing) {
        const { error } = await supabase
          .from('org_export_markets')
          .update({ es_principal: row.es_principal, activo: row.activo ?? true })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('org_export_markets').insert({
          organization_id: organizationId!,
          mercado: row.mercado,
          es_principal: row.es_principal ?? false,
          activo: row.activo ?? true,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgExportMarkets }),
  });

  const setPrincipal = useMutation({
    mutationFn: async (mercadoId: string) => {
      const { error: clearErr } = await supabase
        .from('org_export_markets')
        .update({ es_principal: false })
        .eq('organization_id', organizationId!);
      if (clearErr) throw clearErr;
      const { error } = await supabase
        .from('org_export_markets')
        .update({ es_principal: true })
        .eq('id', mercadoId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgExportMarkets }),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    upsert: upsert.mutateAsync,
    setPrincipal: setPrincipal.mutateAsync,
    mercados: MERCADOS,
  };
}
