// =============================================================================
// NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
// Hook: useCertificationStatus
// Used by: Compliance Hub, Certification Engine dashboard
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  getOrgCertificationDashboard,
  rollupSchemeCompliance,
  markOverdueCorrectiveActions,
} from '../services/complianceEngine';
import type {
  OrgCertificationDashboard,
  OrganizationCertificationScheme,
  CertificationRequirementEvaluation,
  ComplianceStatus,
} from '../types';

// ---------------------------------------------------------------------------
// useCertificationStatus
// Main dashboard hook: loads all enrolled schemes + readiness for an org.
// ---------------------------------------------------------------------------

interface UseCertificationStatusReturn {
  dashboard: OrgCertificationDashboard | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  isBlocked: boolean;
  overallScore: number;
}

export function useCertificationStatus(
  organizationId: string | null,
): UseCertificationStatusReturn {
  const [dashboard, setDashboard] = useState<OrgCertificationDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);
    try {
      // Mark overdue CAs before loading dashboard
      await markOverdueCorrectiveActions(organizationId).catch(() => {/* non-fatal */});
      const data = await getOrgCertificationDashboard(organizationId);
      setDashboard(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load certification status');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time subscription to evaluation changes
  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`cert_status_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'certification_requirement_evaluations',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => { load(); },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'organization_certification_schemes',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => { load(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organizationId, load]);

  const isBlocked = (dashboard?.blocking_issues?.length ?? 0) > 0;

  const overallScore =
    dashboard?.schemes.length
      ? dashboard.schemes.reduce(
          (sum, s) => sum + (s.latest_snapshot?.compliance_score ?? 0),
          0,
        ) / dashboard.schemes.length
      : 0;

  return {
    dashboard,
    isLoading,
    error,
    refresh: load,
    isBlocked,
    overallScore,
  };
}

// ---------------------------------------------------------------------------
// useSchemeCompliance
// Detailed compliance for a single enrolled scheme.
// ---------------------------------------------------------------------------

interface UseSchemeComplianceReturn {
  scheme: OrganizationCertificationScheme | null;
  evaluations: CertificationRequirementEvaluation[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recompute: () => Promise<void>;
  statusCounts: Record<ComplianceStatus, number>;
}

export function useSchemeCompliance(
  organizationId: string | null,
  orgSchemeId: string | null,
): UseSchemeComplianceReturn {
  const [scheme, setScheme] = useState<OrganizationCertificationScheme | null>(null);
  const [evaluations, setEvaluations] = useState<CertificationRequirementEvaluation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId || !orgSchemeId) return;
    setIsLoading(true);
    setError(null);

    try {
      // Load the scheme first to get scheme_version_id, then filter evaluations to that version.
      const schemeRes = await supabase
        .from('organization_certification_schemes')
        .select(`
          *,
          certification_scheme_versions (
            *,
            certification_schemes (*)
          )
        `)
        .eq('id', orgSchemeId)
        .eq('organization_id', organizationId)
        .single();

      if (schemeRes.error) throw new Error(schemeRes.error.message);
      const schemeVersionId = schemeRes.data.scheme_version_id as string;

      const evalsRes = await supabase
        .from('certification_requirement_evaluations')
        .select(`
          *,
          certification_requirements!inner (
            id, code, title, severity, audit_logic_type, blocks_certification,
            certification_requirement_groups (code, name)
          )
        `)
        .eq('organization_id', organizationId)
        .eq('certification_requirements.scheme_version_id', schemeVersionId)
        .order('evaluated_at', { ascending: false });

      if (evalsRes.error) throw new Error(evalsRes.error.message);

      setScheme(schemeRes.data as OrganizationCertificationScheme);
      setEvaluations(evalsRes.data as CertificationRequirementEvaluation[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load scheme compliance');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, orgSchemeId]);

  const recompute = useCallback(async () => {
    if (!organizationId || !orgSchemeId) return;
    try {
      await rollupSchemeCompliance(organizationId, orgSchemeId);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recomputation failed');
    }
  }, [organizationId, orgSchemeId, load]);

  useEffect(() => { load(); }, [load]);

  // Compute status counts
  const statusCounts = evaluations.reduce(
    (acc, e) => {
      acc[e.compliance_status] = (acc[e.compliance_status] ?? 0) + 1;
      return acc;
    },
    {} as Record<ComplianceStatus, number>,
  );

  return { scheme, evaluations, isLoading, error, refresh: load, recompute, statusCounts };
}

// ---------------------------------------------------------------------------
// useCorrectiveActions
// Corrective actions for an organization with real-time updates.
// ---------------------------------------------------------------------------

interface UseCorrectiveActionsReturn {
  open: import('../types').CertificationCorrectiveAction[];
  overdue: import('../types').CertificationCorrectiveAction[];
  blocking: import('../types').CertificationCorrectiveAction[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useCorrectiveActions(
  organizationId: string | null,
): UseCorrectiveActionsReturn {
  const [actions, setActions] = useState<import('../types').CertificationCorrectiveAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('certification_corrective_actions')
        .select(`
          *,
          certification_requirements (id, code, title, severity),
          certification_tasks (*)
        `)
        .eq('organization_id', organizationId)
        .not('status', 'in', '("closed","waived")')
        .order('due_date', { ascending: true, nullsFirst: false });

      if (err) throw new Error(err.message);
      setActions((data ?? []) as import('../types').CertificationCorrectiveAction[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load corrective actions');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!organizationId) return;

    const channel = supabase
      .channel(`cert_cas_${organizationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'certification_corrective_actions',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => { load(); },
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [organizationId, load]);

  const open = actions.filter((a) => a.status === 'open');
  const overdue = actions.filter((a) => a.status === 'overdue');
  const blocking = actions.filter((a) => a.is_blocking);

  return { open, overdue, blocking, isLoading, error, refresh: load };
}
