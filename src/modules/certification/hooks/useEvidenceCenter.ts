// =============================================================================
// NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
// Hook: useEvidenceCenter
// Used by: Evidence Center module (Section G)
// =============================================================================

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import {
  createEvidenceRecord,
  approveEvidence,
  rejectEvidence,
  submitEvidence,
  linkEvidenceToRequirements,
  getEvidenceByScope,
  getEvidenceStats,
  syncOfflineEvidence,
  bufferOfflineEvidence,
} from '../services/evidenceService';
import { findReusableEvidence } from '../services/crossSchemeEngine';
import type {
  CertificationEvidenceRecord,
  CreateEvidenceInput,
  LinkEvidenceInput,
  ScopeLevel,
  EvidenceLifecycleStatus,
  ReusableEvidenceResult,
} from '../types';

// Re-export the type so consumers can import it from here
export type { ReusableEvidenceResult };

// ---------------------------------------------------------------------------
// useEvidenceCenter
// Full evidence management for an organization.
// ---------------------------------------------------------------------------

interface UseEvidenceCenterReturn {
  evidence: CertificationEvidenceRecord[];
  stats: {
    total: number;
    pending: number;
    approved: number;
    offline_pending: number;
    expiring_soon: number;
  };
  isLoading: boolean;
  isUploading: boolean;
  error: string | null;
  create: (input: CreateEvidenceInput) => Promise<CertificationEvidenceRecord | null>;
  submit: (evidenceId: string) => Promise<void>;
  approve: (evidenceId: string, reviewedBy: string) => Promise<void>;
  reject: (evidenceId: string, reason: string, reviewedBy: string) => Promise<void>;
  link: (input: LinkEvidenceInput) => Promise<void>;
  syncOffline: () => Promise<{ synced: number; failed: number }>;
  refresh: () => Promise<void>;
}

export function useEvidenceCenter(
  organizationId: string | null,
  scopeLevel?: ScopeLevel,
  scopeId?: string,
  statusFilter?: EvidenceLifecycleStatus[],
): UseEvidenceCenterReturn {
  const [evidence, setEvidence] = useState<CertificationEvidenceRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, offline_pending: 0, expiring_soon: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId) return;
    setIsLoading(true);
    setError(null);

    try {
      const [records, rawStats] = await Promise.all([
        scopeLevel && scopeId
          ? getEvidenceByScope(organizationId, scopeLevel, scopeId, statusFilter)
          : supabase
              .from('certification_evidence_records')
              .select(`
                *,
                certification_evidence_links (
                  requirement_id,
                  link_type,
                  coverage_pct,
                  certification_requirements (id, code, title)
                )
              `)
              .eq('organization_id', organizationId)
              .order('created_at', { ascending: false })
              .limit(200)
              .then(({ data, error: e }) => {
                if (e) throw new Error(e.message);
                return (data ?? []) as CertificationEvidenceRecord[];
              }),
        getEvidenceStats(organizationId),
      ]);

      setEvidence(records as CertificationEvidenceRecord[]);
      setStats({
        total: rawStats.total,
        pending: (rawStats.by_status['submitted'] ?? 0) + (rawStats.by_status['under_review'] ?? 0),
        approved: rawStats.by_status['approved'] ?? 0,
        offline_pending: rawStats.offline_pending,
        expiring_soon: rawStats.expiring_soon,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load evidence');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, scopeLevel, scopeId, statusFilter]);

  useEffect(() => { load(); }, [load]);

  // Real-time subscription
  useEffect(() => {
    if (!organizationId) return;
    const channel = supabase
      .channel(`cert_evidence_${organizationId}_${scopeId ?? 'all'}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'certification_evidence_records',
          filter: `organization_id=eq.${organizationId}`,
        },
        () => { load(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [organizationId, scopeId, load]);

  const create = useCallback(
    async (input: CreateEvidenceInput): Promise<CertificationEvidenceRecord | null> => {
      if (!organizationId) return null;
      setIsUploading(true);
      setError(null);
      try {
        // Check connectivity — if offline, buffer locally
        if (!navigator.onLine) {
          bufferOfflineEvidence({ ...input, organization_id: organizationId });
          return null;
        }
        const record = await createEvidenceRecord({ ...input, organization_id: organizationId });
        await load();
        return record;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Evidence creation failed');
        return null;
      } finally {
        setIsUploading(false);
      }
    },
    [organizationId, load],
  );

  const submit = useCallback(
    async (evidenceId: string) => {
      try {
        await submitEvidence(evidenceId);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Submit failed');
      }
    },
    [load],
  );

  const approve = useCallback(
    async (evidenceId: string, reviewedBy: string) => {
      try {
        await approveEvidence(evidenceId, reviewedBy);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Approval failed');
      }
    },
    [load],
  );

  const reject = useCallback(
    async (evidenceId: string, reason: string, reviewedBy: string) => {
      try {
        await rejectEvidence(evidenceId, reason, reviewedBy);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Rejection failed');
      }
    },
    [load],
  );

  const link = useCallback(
    async (input: LinkEvidenceInput) => {
      if (!organizationId) return;
      try {
        await linkEvidenceToRequirements(organizationId, input);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Linking failed');
      }
    },
    [organizationId, load],
  );

  const syncOffline = useCallback(async () => {
    const result = await syncOfflineEvidence();
    if (result.synced > 0) await load();
    return result;
  }, [load]);

  return {
    evidence,
    stats,
    isLoading,
    isUploading,
    error,
    create,
    submit,
    approve,
    reject,
    link,
    syncOffline,
    refresh: load,
  };
}

// ---------------------------------------------------------------------------
// useReusableEvidence
// For a specific requirement: find approved evidence from other schemes.
// Used by: Evidence gap view, cross-scheme suggestion panel.
// ---------------------------------------------------------------------------

interface UseReusableEvidenceReturn {
  opportunities: ReusableEvidenceResult[];
  isLoading: boolean;
  applyReuse: (evidenceId: string, coveragePct?: number) => Promise<void>;
}

export function useReusableEvidence(
  organizationId: string | null,
  requirementId: string | null,
): UseReusableEvidenceReturn {
  const [opportunities, setOpportunities] = useState<ReusableEvidenceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!organizationId || !requirementId) {
      setOpportunities([]);
      return;
    }
    setIsLoading(true);
    findReusableEvidence(organizationId, requirementId)
      .then(setOpportunities)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [organizationId, requirementId]);

  const applyReuse = useCallback(
    async (evidenceId: string, coveragePct = 100) => {
      if (!organizationId || !requirementId) return;
      await linkEvidenceToRequirements(organizationId, {
        evidence_id: evidenceId,
        requirement_ids: [requirementId],
        link_type: 'inferred',
        coverage_pct: coveragePct,
        notes: 'Applied via cross-scheme evidence reuse',
      });
    },
    [organizationId, requirementId],
  );

  return { opportunities, isLoading, applyReuse };
}

// ---------------------------------------------------------------------------
// useGeospatialValidation
// EUDR-specific: load + manage geospatial validations for a parcel.
// ---------------------------------------------------------------------------

interface UseGeospatialValidationReturn {
  validation: import('../types').CertificationGeospatialValidation | null;
  isLoading: boolean;
  error: string | null;
  flagFalsePositive: (reason: string, verifiedBy: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useGeospatialValidation(
  organizationId: string | null,
  parcelId: string | null,
  schemeVersionId: string | null,
): UseGeospatialValidationReturn {
  const [validation, setValidation] = useState<import('../types').CertificationGeospatialValidation | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!organizationId || !parcelId || !schemeVersionId) return;
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: err } = await supabase
        .from('certification_geospatial_validations')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('parcel_id', parcelId)
        .eq('scheme_version_id', schemeVersionId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (err) throw new Error(err.message);
      setValidation(data as import('../types').CertificationGeospatialValidation | null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load geospatial validation');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, parcelId, schemeVersionId]);

  useEffect(() => { load(); }, [load]);

  const flagFalsePositive = useCallback(
    async (reason: string, verifiedBy: string) => {
      if (!validation) return;
      try {
        const { flagFalsePositive: flagFP } = await import('../services/complianceEngine');
        await flagFP(validation.id, reason, verifiedBy);
        await load();
      } catch (err) {
        setError(err instanceof Error ? err.message : 'False positive flag failed');
      }
    },
    [validation, load],
  );

  return { validation, isLoading, error, flagFalsePositive, refresh: load };
}
