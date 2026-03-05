import { useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentOrgId } from './useCurrentOrgId';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { resolveActiveModules, type OrgTipo, type OrgModule } from '@/lib/org-modules';

interface OrgContext {
  organizationId: string | null;
  productorId: string | null;
  role: string | null;
  orgTipo: OrgTipo | null;
  orgName: string | null;
  activeModules: OrgModule[];
  isLoading: boolean;
  isReady: boolean;
}

/**
 * Central org context hook -- single source of truth for tenant info.
 * Resolves organizationId, orgTipo, activeModules from the DB.
 */
export function useOrgContext(): OrgContext {
  const { user, isLoading: authLoading } = useAuth();
  const { data: organizationId, isLoading: orgIdLoading } = useCurrentOrgId();

  const { data: orgInfo, isLoading: orgInfoLoading } = useQuery({
    queryKey: ['orgInfo', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await supabase
        .from('organizaciones')
        .select('tipo, nombre')
        .eq('id', organizationId)
        .maybeSingle();
      if (error || !data) {
        const { data: poData } = await supabase
          .from('platform_organizations')
          .select('tipo, name, modules, is_eudr_active, is_vital_active')
          .eq('id', organizationId)
          .maybeSingle();
        return poData ? {
          tipo: poData.tipo as OrgTipo,
          nombre: poData.name,
          modules: poData.modules as string[] | null,
          is_eudr_active: poData.is_eudr_active,
          is_vital_active: poData.is_vital_active,
        } : null;
      }
      return { tipo: data.tipo as OrgTipo, nombre: data.nombre, modules: null, is_eudr_active: false, is_vital_active: false };
    },
    enabled: !!organizationId,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  const { data: productorId } = useQuery({
    queryKey: ['productorId', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('productor_id')
        .eq('user_id', user.id)
        .maybeSingle();
      return (data?.productor_id as string) ?? null;
    },
    enabled: !!user?.id && user?.role === 'productor',
    staleTime: 5 * 60 * 1000,
  });

  const isLoading = authLoading || orgIdLoading || orgInfoLoading;

  const activeModules = useMemo(() => {
    if (!orgInfo?.tipo) return ['core' as OrgModule];
    return resolveActiveModules(
      orgInfo.tipo,
      orgInfo.modules,
      { is_eudr_active: orgInfo.is_eudr_active, is_vital_active: orgInfo.is_vital_active },
    );
  }, [orgInfo]);

  return {
    organizationId: organizationId ?? null,
    productorId: productorId ?? null,
    role: user?.role ?? null,
    orgTipo: orgInfo?.tipo ?? null,
    orgName: orgInfo?.nombre ?? user?.organizationName ?? null,
    activeModules,
    isLoading,
    isReady: !isLoading && !!organizationId,
  };
}
