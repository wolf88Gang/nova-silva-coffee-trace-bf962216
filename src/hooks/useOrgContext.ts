/**
 * Hook de contexto de organización (tenant).
 * Resuelve organizationId desde profiles.organization_id, productorId desde profiles.productor_id.
 * Usar para filtrar queries por cooperativa_id = organizationId.
 */
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { UserRole } from '@/types';

export interface OrgContext {
  organizationId: string | null;
  productorId: string | null;
  role: UserRole | null;
  orgTipo: string | null;
  isLoading: boolean;
}

/**
 * Devuelve organizationId, productorId, role y orgTipo.
 * orgTipo se obtiene de platform_organizations (Lovable canonical).
 */
export function useOrgContext(): OrgContext {
  const { user, isLoading: authLoading } = useAuth();
  const [orgTipo, setOrgTipo] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.organizationId) {
      setOrgTipo(null);
      return;
    }
    let cancelled = false;
    supabase
      .from('platform_organizations')
      .select('tipo')
      .eq('id', user.organizationId)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setOrgTipo(data?.tipo ?? null);
      })
      .catch(() => {
        if (!cancelled) setOrgTipo(null);
      });
    return () => { cancelled = true; };
  }, [user?.organizationId]);

  return {
    organizationId: user?.organizationId ?? null,
    productorId: user?.productorId ?? null,
    role: user?.role ?? null,
    orgTipo,
    isLoading: authLoading,
  };
}
