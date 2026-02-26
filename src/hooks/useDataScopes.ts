/**
 * Data hooks for Actor-level drilldown.
 *
 * These hooks provide actor detail, assets (parcelas), and events (entregas)
 * scoped by organization_id + actor_id. They use TanStack Query for caching.
 *
 * All hooks require organizationId from useOrgContext() for tenant isolation.
 * The actor_id narrows the query within the tenant.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ORG_KEY, ACTOR_KEY, ASSET_KEY, TABLE } from '@/lib/keys';

// ── Actor Detail ──

export function useActorDetail(actorId: string | null | undefined) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['actor', organizationId, actorId],
    enabled: !!organizationId && !!actorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.ACTORS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .eq('id', actorId!)
        .single();
      if (error) throw error;
      return data;
    },
  });
}

// ── Actor Assets (parcelas) ──

export function useActorAssets(actorId: string | null | undefined) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['actor-assets', organizationId, actorId],
    enabled: !!organizationId && !!actorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.PLOTS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .eq(ACTOR_KEY, actorId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Actor Events (entregas) ──

export function useActorEvents(actorId: string | null | undefined) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['actor-events', organizationId, actorId],
    enabled: !!organizationId && !!actorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.DELIVERIES)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .eq(ACTOR_KEY, actorId!)
        .order('fecha', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Parcel Documents ──

export function useParcelDocuments(parcelId: string | null | undefined) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['parcel-documents', organizationId, parcelId],
    enabled: !!organizationId && !!parcelId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.DOCUMENTS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .eq(ASSET_KEY, parcelId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Actor Credits ──

export function useActorCredits(actorId: string | null | undefined) {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['actor-credits', organizationId, actorId],
    enabled: !!organizationId && !!actorId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.CREDITS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .eq(ACTOR_KEY, actorId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

// ── Org-level Alerts ──

export function useOrgAlerts() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['org-alerts', organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from(TABLE.ALERTS)
        .select('*')
        .eq(ORG_KEY, organizationId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}
