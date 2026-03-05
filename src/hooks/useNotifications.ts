/**
 * Hook to fetch real notifications from the `notifications` table.
 * Scoped by organization_id. Ordered by created_at desc.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { ORG_KEY, TABLE } from '@/lib/keys';

export interface Notification {
  id: string;
  organization_id: string;
  user_id: string | null;
  tipo: string;
  titulo: string;
  cuerpo: string;
  link_url: string | null;
  read_at: string | null;
  created_at: string;
}

export function useNotifications(limit = 20) {
  const { organizationId } = useOrgContext();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['notifications', organizationId, user?.id, limit],
    enabled: !!organizationId,
    queryFn: async () => {
      let q = supabase
        .from(TABLE.NOTIFICATIONS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false })
        .limit(limit);

      // If user_id is set, also include org-wide (null user_id) notifications
      // We fetch all for the org and filter client-side for user-specific + org-wide
      const { data, error } = await q;
      if (error) throw error;

      // Filter: show notifications targeted to this user OR org-wide (user_id is null)
      const userId = user?.id;
      return (data ?? []).filter(
        (n: any) => !n.user_id || n.user_id === userId
      ) as Notification[];
    },
    refetchInterval: 60_000, // poll every 60s
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from(TABLE.NOTIFICATIONS)
        .update({ read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const { organizationId } = useOrgContext();
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from(TABLE.NOTIFICATIONS)
        .update({ read_at: new Date().toISOString() })
        .eq(ORG_KEY, organizationId!)
        .is('read_at', null);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
