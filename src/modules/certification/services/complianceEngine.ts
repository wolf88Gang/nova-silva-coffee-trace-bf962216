// =============================================================================
// NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
// Compliance Engine Service
// Section G: Certification Engine + Compliance Hub
// =============================================================================
// DESIGN RULES:
// - Deterministic logic only. No AI inference in core evaluation.
// - All writes go through Supabase RPC / service_role functions.
// - Evidence gaps are computed locally; evaluations are confirmed server-side.
// - Zero-tolerance violations always → 'blocked' status.

import { supabase } from '@/integrations/supabase/client';
import type {
  ComplianceStatus,
  ScopeLevel,
  CertificationRequirementEvaluation,
  OrganizationCertificationScheme,
  CertificationSchemeReadinessSnapshot,
  CertificationMassBalanceCheck,
  CertificationPlausibilityCheck,
  CertificationGeospatialValidation,
  CertificationTracebackCheck,
  EvidenceGap,
  CrossSchemeOpportunity,
  ComplianceEvaluationResult,
  OrgCertificationDashboard,
  BlockingIssue,
} from '../types';

// ---------------------------------------------------------------------------
// COMPLIANCE ENGINE — Core evaluation
// ---------------------------------------------------------------------------

/**
 * Trigger server-side compliance status recomputation for a single requirement.
 * Calls the Postgres function cert_compute_compliance_status().
 * Returns the new compliance status.
 */
export async function computeRequirementCompliance(
  organizationId: string,
  requirementId: string,
  scopeLevel: ScopeLevel,
  scopeId: string,
): Promise<ComplianceStatus> {
  const { data, error } = await supabase.rpc('cert_compute_compliance_status', {
    p_organization_id: organizationId,
    p_requirement_id: requirementId,
    p_scope_level: scopeLevel,
    p_scope_id: scopeId,
  });
  if (error) throw new Error(`Compliance evaluation failed: ${error.message}`);
  return data as ComplianceStatus;
}

/**
 * Recompute all requirements for an org + scheme version.
 * Returns summary of changes.
 */
export async function recomputeSchemeCompliance(
  organizationId: string,
  schemeVersionId: string,
  scopeLevel: ScopeLevel,
  scopeId: string,
): Promise<ComplianceEvaluationResult[]> {
  // Fetch all applicable requirements
  const { data: requirements, error: reqErr } = await supabase
    .from('certification_requirements')
    .select('id, severity, blocks_certification')
    .eq('scheme_version_id', schemeVersionId);

  if (reqErr) throw new Error(reqErr.message);
  if (!requirements?.length) return [];

  // Fetch current evaluations for comparison
  const { data: currentEvals } = await supabase
    .from('certification_requirement_evaluations')
    .select('requirement_id, compliance_status')
    .eq('organization_id', organizationId)
    .eq('scope_level', scopeLevel)
    .eq('scope_id', scopeId);

  const currentStatusMap = new Map<string, ComplianceStatus>(
    (currentEvals ?? []).map((e) => [e.requirement_id, e.compliance_status as ComplianceStatus]),
  );

  const results: ComplianceEvaluationResult[] = [];

  for (const req of requirements) {
    const previousStatus = currentStatusMap.get(req.id) ?? 'not_started';
    let newStatus: ComplianceStatus;

    try {
      newStatus = await computeRequirementCompliance(organizationId, req.id, scopeLevel, scopeId);
    } catch {
      // Log but don't abort — continue with remaining requirements
      console.error(`Failed to evaluate requirement ${req.id}`);
      continue;
    }

    results.push({
      requirement_id: req.id,
      scope_level: scopeLevel,
      scope_id: scopeId,
      previous_status: previousStatus,
      new_status: newStatus,
      changed: previousStatus !== newStatus,
      corrective_action_created: false, // Server-side auto-CA trigger handles this
    });
  }

  return results;
}

/**
 * Rollup scheme-level compliance counts and create readiness snapshot.
 * Calls cert_rollup_scheme_compliance() Postgres function.
 */
export async function rollupSchemeCompliance(
  organizationId: string,
  orgSchemeId: string,
): Promise<void> {
  const { error } = await supabase.rpc('cert_rollup_scheme_compliance', {
    p_organization_id: organizationId,
    p_org_scheme_id: orgSchemeId,
  });
  if (error) throw new Error(`Rollup failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// EVIDENCE GAP DETECTION
// ---------------------------------------------------------------------------

/**
 * Compute evidence gaps for an org + scheme version.
 * A gap = approved evidence count of 0 for a mandatory requirement.
 * Cross-scheme opportunities are computed simultaneously.
 */
export async function detectEvidenceGaps(
  organizationId: string,
  schemeVersionId: string,
): Promise<EvidenceGap[]> {
  // Load requirements with their evidence type definitions
  const { data: requirements, error: reqErr } = await supabase
    .from('certification_requirements')
    .select(`
      id,
      code,
      title,
      severity,
      scope_parcel,
      scope_lot,
      scope_organization,
      scope_farm,
      certification_requirement_evidence_types (
        evidence_type_def_id,
        is_primary,
        certification_evidence_type_definitions (code, name)
      )
    `)
    .eq('scheme_version_id', schemeVersionId)
    .eq('is_mandatory', true);

  if (reqErr) throw new Error(reqErr.message);
  if (!requirements?.length) return [];

  // Load all approved evidence links for this org
  const { data: links, error: linksErr } = await supabase
    .from('certification_evidence_links')
    .select(`
      requirement_id,
      coverage_pct,
      link_type,
      evidence_id,
      certification_evidence_records!inner (
        lifecycle_status,
        scope_level,
        scope_id
      )
    `)
    .eq('organization_id', organizationId)
    .eq('certification_evidence_records.lifecycle_status', 'approved');

  if (linksErr) throw new Error(linksErr.message);

  // Build: requirementId → total coverage map
  const coverageMap = new Map<string, { pct: number; primaryCount: number }>();
  for (const link of links ?? []) {
    const existing = coverageMap.get(link.requirement_id) ?? { pct: 0, primaryCount: 0 };
    coverageMap.set(link.requirement_id, {
      pct: Math.min(100, existing.pct + (link.coverage_pct ?? 0)),
      primaryCount: existing.primaryCount + (link.link_type === 'primary' ? 1 : 0),
    });
  }

  // Load overlaps for cross-scheme opportunity detection
  const requirementIds = requirements.map((r) => r.id);
  const { data: overlaps } = await supabase
    .from('certification_requirement_overlaps')
    .select(`
      req_target_id,
      req_source_id,
      overlap_type,
      coverage_pct,
      inference_rule,
      certification_requirements!req_source_id (
        id,
        code,
        scheme_version_id,
        certification_scheme_versions (
          certification_schemes (name)
        )
      )
    `)
    .in('req_target_id', requirementIds);

  const gaps: EvidenceGap[] = [];

  for (const req of requirements) {
    const coverage = coverageMap.get(req.id);
    const coveragePct = coverage?.pct ?? 0;

    // Determine primary scope level
    const scopeLevel: ScopeLevel = req.scope_parcel
      ? 'parcel'
      : req.scope_lot
        ? 'lot'
        : req.scope_farm
          ? 'farm'
          : 'organization';

    if (coveragePct >= 100 && (coverage?.primaryCount ?? 0) > 0) continue;

    // Build missing evidence types list
    const missingTypes = (req.certification_requirement_evidence_types ?? [])
      .filter((et: { is_primary: boolean }) => et.is_primary)
      .map((et: { certification_evidence_type_definitions: { name: string } | null }) =>
        et.certification_evidence_type_definitions?.name ?? 'Unknown',
      );

    // Build cross-scheme opportunities
    const reqOverlaps = (overlaps ?? []).filter((o) => o.req_target_id === req.id);
    const opportunities: CrossSchemeOpportunity[] = reqOverlaps.map((o) => {
      const sourceReq = o.certification_requirements as {
        id: string;
        scheme_version_id: string;
        certification_scheme_versions?: {
          certification_schemes?: { name: string };
        };
      } | null;
      return {
        source_requirement_id: o.req_source_id,
        source_scheme_name:
          sourceReq?.certification_scheme_versions?.certification_schemes?.name ?? 'Unknown Scheme',
        overlap_type: o.overlap_type,
        coverage_pct: o.coverage_pct,
        reusable_evidence_count: (links ?? []).filter(
          (l) => l.requirement_id === o.req_source_id,
        ).length,
        inference_rule: o.inference_rule,
      };
    });

    gaps.push({
      requirement_id: req.id,
      requirement_code: req.code,
      requirement_title: req.title,
      severity: req.severity,
      scope_level: scopeLevel,
      scope_id: '',  // Caller must iterate over specific scopes for parcel/lot
      missing_evidence_types: missingTypes,
      current_coverage_pct: coveragePct,
      cross_scheme_opportunities: opportunities,
    });
  }

  return gaps;
}

// ---------------------------------------------------------------------------
// AUDIT CHECK RUNNERS
// ---------------------------------------------------------------------------

/**
 * Trigger mass balance calculation for a specific check record.
 * Calls cert_run_mass_balance() Postgres function.
 */
export async function runMassBalanceCheck(checkId: string): Promise<CertificationMassBalanceCheck> {
  const { error } = await supabase.rpc('cert_run_mass_balance', { p_check_id: checkId });
  if (error) throw new Error(`Mass balance calculation failed: ${error.message}`);

  const { data, error: fetchErr } = await supabase
    .from('certification_mass_balance_checks')
    .select('*')
    .eq('id', checkId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);
  return data as CertificationMassBalanceCheck;
}

/**
 * Trigger yield plausibility check for a specific record.
 * Calls cert_run_plausibility_check() Postgres function.
 */
export async function runPlausibilityCheck(
  checkId: string,
): Promise<CertificationPlausibilityCheck> {
  const { error } = await supabase.rpc('cert_run_plausibility_check', { p_check_id: checkId });
  if (error) throw new Error(`Plausibility check failed: ${error.message}`);

  const { data, error: fetchErr } = await supabase
    .from('certification_plausibility_checks')
    .select('*')
    .eq('id', checkId)
    .single();

  if (fetchErr) throw new Error(fetchErr.message);
  return data as CertificationPlausibilityCheck;
}

/**
 * Create or update a geospatial validation record.
 * The cert_evaluate_geospatial() trigger fires automatically on insert/update.
 */
export async function upsertGeospatialValidation(
  input: Omit<
    CertificationGeospatialValidation,
    | 'id'
    | 'result'
    | 'failure_reasons'
    | 'warning_flags'
    | 'validated_at'
    | 'created_at'
    | 'updated_at'
  >,
): Promise<CertificationGeospatialValidation> {
  const { data, error } = await supabase
    .from('certification_geospatial_validations')
    .upsert(input, { onConflict: 'organization_id,parcel_id,scheme_version_id' })
    .select()
    .single();

  if (error) throw new Error(`Geospatial validation upsert failed: ${error.message}`);
  return data as CertificationGeospatialValidation;
}

/**
 * Flag a geospatial alert as a false positive (SECTION I — Risk mitigation).
 * Requires manual verification + justification.
 */
export async function flagFalsePositive(
  validationId: string,
  reason: string,
  verifiedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('certification_geospatial_validations')
    .update({
      false_positive_flag: true,
      false_positive_reason: reason,
      false_positive_verified_by: verifiedBy,
      false_positive_verified_at: new Date().toISOString(),
    })
    .eq('id', validationId);

  if (error) throw new Error(`False positive flag failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// DASHBOARD & READINESS
// ---------------------------------------------------------------------------

/**
 * Fetch the full certification dashboard for an organization.
 */
export async function getOrgCertificationDashboard(
  organizationId: string,
): Promise<OrgCertificationDashboard> {
  const [profileRes, schemesRes, blockingRes] = await Promise.all([
    supabase
      .from('organization_certification_profiles')
      .select('*')
      .eq('organization_id', organizationId)
      .single(),

    supabase
      .from('organization_certification_schemes')
      .select(`
        *,
        certification_scheme_versions (
          *,
          certification_schemes (*)
        ),
        certification_scheme_readiness_snapshots (
          *
        )
      `)
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),

    supabase
      .from('certification_requirement_evaluations')
      .select(`
        requirement_id,
        scope_level,
        scope_id,
        blocking_issues,
        certification_requirements (code, title),
        certification_corrective_actions (id, due_date)
      `)
      .eq('organization_id', organizationId)
      .eq('has_zero_tolerance_violation', true)
      .limit(50),
  ]);

  if (profileRes.error) throw new Error(profileRes.error.message);
  if (schemesRes.error) throw new Error(schemesRes.error.message);

  const profile = profileRes.data;
  const rawSchemes = schemesRes.data ?? [];

  // Build scheme summaries
  const schemes = rawSchemes.map((s) => {
    const snapshots = (s.certification_scheme_readiness_snapshots ?? []) as CertificationSchemeReadinessSnapshot[];
    const latestSnapshot = snapshots.sort(
      (a, b) => new Date(b.snapshot_date).getTime() - new Date(a.snapshot_date).getTime(),
    )[0] ?? null;

    const daysToExpiry = s.expiry_date
      ? Math.floor(
          (new Date(s.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
        )
      : null;

    return {
      scheme: s as OrganizationCertificationScheme,
      scheme_version: s.certification_scheme_versions as never,
      certification_scheme: (s.certification_scheme_versions as { certification_schemes: never }).certification_schemes,
      latest_snapshot: latestSnapshot,
      is_audit_ready:
        (latestSnapshot?.audit_readiness_pct ?? 0) >= 80 &&
        !latestSnapshot?.is_blocked,
      days_to_expiry: daysToExpiry,
    };
  });

  // Build blocking issues
  const blockingIssues: BlockingIssue[] = (blockingRes.data ?? []).map((e) => {
    const req = e.certification_requirements as { code: string; title: string } | null;
    const cas = (e.certification_corrective_actions ?? []) as { id: string; due_date: string | null }[];
    return {
      requirement_id: e.requirement_id,
      requirement_code: req?.code ?? '',
      requirement_title: req?.title ?? '',
      scope_level: e.scope_level as ScopeLevel,
      scope_id: e.scope_id,
      issue_description: (e.blocking_issues as string[])[0] ?? 'Zero-tolerance violation',
      corrective_action_id: cas[0]?.id ?? null,
      due_date: cas[0]?.due_date ?? null,
    };
  });

  // Count pending evidence
  const { count: pendingEvidence } = await supabase
    .from('certification_evidence_records')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('lifecycle_status', 'submitted');

  // Count overdue CAs
  const { count: overdueCAs } = await supabase
    .from('certification_corrective_actions')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('status', 'overdue');

  return {
    profile,
    schemes,
    blocking_issues: blockingIssues,
    pending_evidence: pendingEvidence ?? 0,
    overdue_cas: overdueCAs ?? 0,
    next_audit_date: profile.next_audit_date,
  };
}

/**
 * Fetch evaluations for a specific scope (e.g. all parcels in a scheme).
 */
export async function getEvaluationsByScope(
  organizationId: string,
  schemeVersionId: string,
  scopeLevel: ScopeLevel,
  scopeId: string,
): Promise<CertificationRequirementEvaluation[]> {
  const { data, error } = await supabase
    .from('certification_requirement_evaluations')
    .select(`
      *,
      certification_requirements (
        id, code, title, severity, audit_logic_type, blocks_certification
      )
    `)
    .eq('organization_id', organizationId)
    .eq('scope_level', scopeLevel)
    .eq('scope_id', scopeId);

  if (error) throw new Error(error.message);

  // Filter to requirements that belong to the target scheme version
  const reqIds = (data ?? [])
    .filter((e) => {
      const req = e.certification_requirements as { id: string } | null;
      return req?.id != null;
    })
    .map((e) => (e.certification_requirements as { id: string }).id);

  if (!reqIds.length) return [];

  const { data: schemeReqs } = await supabase
    .from('certification_requirements')
    .select('id')
    .eq('scheme_version_id', schemeVersionId)
    .in('id', reqIds);

  const schemeReqSet = new Set((schemeReqs ?? []).map((r) => r.id));
  return (data ?? []).filter((e) =>
    schemeReqSet.has((e.certification_requirements as { id: string }).id),
  ) as CertificationRequirementEvaluation[];
}

/**
 * Mark a corrective action as overdue based on due_date.
 * Called by a daily scheduled job.
 */
export async function markOverdueCorrectiveActions(organizationId: string): Promise<number> {
  const { data, error } = await supabase
    .from('certification_corrective_actions')
    .update({ status: 'overdue' })
    .eq('organization_id', organizationId)
    .in('status', ['open', 'in_progress'])
    .lt('due_date', new Date().toISOString().split('T')[0])
    .select('id');

  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}
