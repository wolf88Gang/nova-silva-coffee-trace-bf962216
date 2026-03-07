import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { TABLE, ORG_KEY } from '@/lib/keys';

export interface OrgCertification {
  id: string;
  organization_id: string;
  certificadora: string;
  codigo: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  activo: boolean;
}

export function useOrgCertifications() {
  const { organizationId } = useOrgContext();
  const qc = useQueryClient();
  const key = ['orgCertifications', organizationId];

  const query = useQuery<OrgCertification[]>({
    queryKey: key,
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.ORG_CERTIFICATIONS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('certificadora');
      if (error) throw error;
      return (data as OrgCertification[]) ?? [];
    },
  });

  const addCert = useMutation({
    mutationFn: async (cert: Omit<OrgCertification, 'id' | 'organization_id'>) => {
      const { error } = await supabase
        .from(TABLE.ORG_CERTIFICATIONS)
        .insert({ ...cert, [ORG_KEY]: organizationId });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  const toggleCert = useMutation({
    mutationFn: async ({ id, activo }: { id: string; activo: boolean }) => {
      const { error } = await supabase
        .from(TABLE.ORG_CERTIFICATIONS)
        .update({ activo })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  });

  return { certifications: query.data ?? [], isLoading: query.isLoading, addCert, toggleCert };
}
