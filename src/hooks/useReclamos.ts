/**
 * Hook to manage reclamos_postventa from Supabase.
 * Scoped by organization_id.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_KEY } from '@/lib/keys';

export interface Reclamo {
  id: string;
  organization_id: string;
  contrato_id: string | null;
  lote_comercial_id: string | null;
  tipo: string | null;
  severidad: string | null;
  descripcion: string | null;
  estado: string;
  resolucion: string | null;
  created_at: string;
  updated_at: string;
}

export function useReclamos() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['reclamos', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reclamos_postventa')
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Reclamo[];
    },
  });
}

export function useCreateReclamo() {
  const { organizationId } = useOrgContext();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (input: Omit<Reclamo, 'id' | 'organization_id' | 'created_at' | 'updated_at' | 'estado'>) => {
      const { data, error } = await supabase
        .from('reclamos_postventa')
        .insert({
          organization_id: organizationId!,
          ...input,
          estado: 'abierto',
        })
        .select()
        .single();
      if (error) throw error;
      return data as Reclamo;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['reclamos'] });
    },
  });
}
