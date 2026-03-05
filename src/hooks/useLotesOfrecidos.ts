/**
 * Hook to fetch lotes_ofrecidos from Supabase.
 * Scoped by organization_id.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_KEY, TABLE } from '@/lib/keys';

export interface LoteOfrecido {
  id: string;
  organization_id: string;
  created_by: string | null;
  titulo: string;
  descripcion: string | null;
  estado: string;
  created_at: string;
  updated_at: string;
}

export function useLotesOfrecidos() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['lotes-ofrecidos', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.LOTES_OFRECIDOS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as LoteOfrecido[];
    },
  });
}

export function useCreateLoteOfrecido() {
  const { organizationId } = useOrgContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: { titulo: string; descripcion?: string }) => {
      const { data, error } = await supabase
        .from(TABLE.LOTES_OFRECIDOS)
        .insert({
          organization_id: organizationId!,
          titulo: input.titulo,
          descripcion: input.descripcion || null,
          estado: 'borrador',
        })
        .select()
        .single();
      if (error) throw error;
      return data as LoteOfrecido;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes-ofrecidos'] });
    },
  });
}

export function useUpdateLoteOfrecidoEstado() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, estado }: { id: string; estado: string }) => {
      const { error } = await supabase
        .from(TABLE.LOTES_OFRECIDOS)
        .update({ estado, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lotes-ofrecidos'] });
    },
  });
}
