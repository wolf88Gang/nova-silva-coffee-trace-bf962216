/**
 * Hook para CRUD de certificaciones de la organización.
 * Tabla: org_certifications
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from './useOrgContext';
import { QUERY_KEYS } from '@/config/keys';

export interface OrgCertification {
  id: string;
  organization_id: string;
  certificadora: string;
  codigo?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  activo?: boolean;
  created_at?: string;
}

const CERTIFICADORAS = [
  'fairtrade',
  'gcp',
  'rainforest_alliance',
  'organic',
  '4c',
  'utz',
  'otro',
];

export function useOrgCertifications() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [...QUERY_KEYS.orgCertifications, organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_certifications')
        .select('*')
        .eq('organization_id', organizationId!)
        .order('certificadora');
      if (error) throw error;
      return (data ?? []) as OrgCertification[];
    },
    enabled: !!organizationId,
  });

  const insert = useMutation({
    mutationFn: async (row: Omit<OrgCertification, 'id' | 'organization_id'>) => {
      const { error } = await supabase.from('org_certifications').insert({
        organization_id: organizationId!,
        ...row,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgCertifications }),
  });

  const update = useMutation({
    mutationFn: async ({ id, ...row }: Partial<OrgCertification> & { id: string }) => {
      const { error } = await supabase.from('org_certifications').update(row).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgCertifications }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('org_certifications').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: QUERY_KEYS.orgCertifications }),
  });

  return {
    data: query.data ?? [],
    isLoading: query.isLoading,
    error: query.error,
    insert: insert.mutateAsync,
    update: update.mutateAsync,
    remove: remove.mutateAsync,
    certificadoras: CERTIFICADORAS,
  };
}
