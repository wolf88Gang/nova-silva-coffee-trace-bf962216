import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns the current user's organization_id from the profiles table.
 * This is the canonical way to get the tenant ID on the frontend.
 */
export function useCurrentOrgId() {
  const { user, session } = useAuth();

  return useQuery({
    queryKey: ['currentOrgId', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) { console.error('Error fetching org ID:', error); return null; }
      return (data?.organization_id as string) ?? null;
    },
    enabled: !!user?.id && !!session,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
