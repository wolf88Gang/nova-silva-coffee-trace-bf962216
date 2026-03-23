// =============================================================================
// NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
// Cross-Scheme Engine (Section D)
// =============================================================================
// Purpose: Eliminate duplicate certification effort by mapping requirement
// overlaps between schemes and automatically reusing approved evidence.
// Core principle: deterministic inference only. No probabilistic AI guessing.
//
// Example flows:
//   ESENCIAL compliant (req A) → Fairtrade criterion 2.1.1 (req B) → infer 'compliant'
//   RA2020 geo polygon approved → EUDR geo validation → evidence reuse (equivalent)
//   Fairtrade payment receipt → corporate financial traceability → partial coverage

import { supabase } from '@/integrations/supabase/client';
import type {
  CertificationRequirementOverlap,
  CertificationRequirement,
  CrossSchemeOpportunity,
  OverlapType,
} from '../types';

// ---------------------------------------------------------------------------
// OVERLAP MAP LOADING
// ---------------------------------------------------------------------------

/**
 * Load the full overlap graph for a set of requirements.
 * Returns a map: requirementId → list of overlaps (source or target).
 */
export async function loadOverlapGraph(
  requirementIds: string[],
): Promise<Map<string, CertificationRequirementOverlap[]>> {
  if (!requirementIds.length) return new Map();

  const { data, error } = await supabase
    .from('certification_requirement_overlaps')
    .select('*')
    .or(
      `req_source_id.in.(${requirementIds.join(',')}),req_target_id.in.(${requirementIds.join(',')})`,
    );

  if (error) throw new Error(`Overlap graph load failed: ${error.message}`);

  const graph = new Map<string, CertificationRequirementOverlap[]>();
  for (const overlap of data ?? []) {
    for (const id of [overlap.req_source_id, overlap.req_target_id]) {
      if (!graph.has(id)) graph.set(id, []);
      graph.get(id)!.push(overlap as CertificationRequirementOverlap);
    }
  }

  return graph;
}

// ---------------------------------------------------------------------------
// SHARED EVIDENCE REUSE
// ---------------------------------------------------------------------------

/**
 * For a target requirement, find all approved evidence from OTHER schemes
 * that can be reused based on overlap rules.
 * Returns: list of (evidence_id, coverage_pct, overlap_type) tuples.
 */
export async function findReusableEvidence(
  organizationId: string,
  targetRequirementId: string,
): Promise<ReusableEvidenceResult[]> {
  // Find all source requirements that overlap with the target
  const { data: overlaps, error: olErr } = await supabase
    .from('certification_requirement_overlaps')
    .select('req_source_id, overlap_type, coverage_pct, inference_rule')
    .eq('req_target_id', targetRequirementId)
    .in('overlap_type', ['equivalent', 'partial', 'supersedes']);

  if (olErr) throw new Error(olErr.message);
  if (!overlaps?.length) return [];

  const sourceIds = overlaps.map((o) => o.req_source_id);

  // Find approved evidence linked to those source requirements
  const { data: links, error: linkErr } = await supabase
    .from('certification_evidence_links')
    .select(`
      evidence_id,
      requirement_id,
      coverage_pct,
      certification_evidence_records!inner (
        id,
        lifecycle_status,
        evidence_type,
        title,
        valid_from,
        valid_until,
        scope_level,
        scope_id
      )
    `)
    .eq('organization_id', organizationId)
    .in('requirement_id', sourceIds)
    .eq('certification_evidence_records.lifecycle_status', 'approved');

  if (linkErr) throw new Error(linkErr.message);

  const results: ReusableEvidenceResult[] = [];
  for (const link of links ?? []) {
    const overlap = overlaps.find((o) => o.req_source_id === link.requirement_id);
    if (!overlap) continue;

    const record = link.certification_evidence_records as {
      id: string;
      lifecycle_status: string;
      evidence_type: string;
      title: string;
      valid_from: string;
      valid_until: string | null;
      scope_level: string;
      scope_id: string;
    };

    // Check if evidence is still valid
    if (record.valid_until && new Date(record.valid_until) < new Date()) continue;

    // Effective coverage = link.coverage_pct * overlap.coverage_pct / 100
    const effectiveCoverage = (link.coverage_pct * overlap.coverage_pct) / 100;

    results.push({
      evidence_id: link.evidence_id,
      source_requirement_id: link.requirement_id,
      target_requirement_id: targetRequirementId,
      overlap_type: overlap.overlap_type as OverlapType,
      effective_coverage_pct: effectiveCoverage,
      inference_rule: overlap.inference_rule,
      evidence_title: record.title,
      evidence_type: record.evidence_type,
      scope_level: record.scope_level,
      scope_id: record.scope_id,
    });
  }

  // Sort by effective coverage descending
  return results.sort((a, b) => b.effective_coverage_pct - a.effective_coverage_pct);
}

export interface ReusableEvidenceResult {
  evidence_id: string;
  source_requirement_id: string;
  target_requirement_id: string;
  overlap_type: OverlapType;
  effective_coverage_pct: number;
  inference_rule: string | null;
  evidence_title: string;
  evidence_type: string;
  scope_level: string;
  scope_id: string;
}

// ---------------------------------------------------------------------------
// INFERENCE ENGINE
// ---------------------------------------------------------------------------

/**
 * Apply inference rules: if source requirement is compliant, and overlap_type
 * is 'infers', propagate a 'compliant' signal to target requirement.
 * This does NOT automatically set compliance — it creates inferred evidence links.
 *
 * Example:
 *   ESENCIAL C1 (compliant) → Fairtrade 2.1.1 (infers, 80% coverage)
 *   → creates 'inferred' link on Fairtrade 2.1.1 with 80% coverage
 *
 * Returns: number of inferences applied
 */
export async function applyInferenceRules(
  organizationId: string,
  schemeVersionId: string,
): Promise<number> {
  // Load all 'infers' overlaps where source req belongs to this scheme version
  const { data: overlaps, error } = await supabase
    .from('certification_requirement_overlaps')
    .select(`
      id,
      req_source_id,
      req_target_id,
      coverage_pct,
      inference_rule,
      certification_requirements!req_source_id (
        scheme_version_id
      )
    `)
    .eq('overlap_type', 'infers');

  if (error) throw new Error(error.message);

  let appliedCount = 0;

  for (const overlap of overlaps ?? []) {
    const sourceReq = overlap.certification_requirements as { scheme_version_id: string } | null;
    if (!sourceReq) continue;

    // Guard: only process overlaps where the source requirement belongs to the requested scheme
    if (sourceReq.scheme_version_id !== schemeVersionId) continue;

    // Check if source requirement is compliant for this org
    const { data: sourceEval } = await supabase
      .from('certification_requirement_evaluations')
      .select('compliance_status')
      .eq('organization_id', organizationId)
      .eq('requirement_id', overlap.req_source_id)
      .in('compliance_status', ['compliant'])
      .limit(1)
      .maybeSingle();

    if (!sourceEval) continue;  // Source not compliant — skip

    // Find an approved evidence record linked to the source requirement
    const { data: sourceLink } = await supabase
      .from('certification_evidence_links')
      .select('evidence_id')
      .eq('organization_id', organizationId)
      .eq('requirement_id', overlap.req_source_id)
      .eq('link_type', 'primary')
      .limit(1)
      .maybeSingle();

    if (!sourceLink) continue;

    // Create inferred link on target requirement
    const { error: insertErr } = await supabase
      .from('certification_evidence_links')
      .insert({
        organization_id: organizationId,
        evidence_id: sourceLink.evidence_id,
        requirement_id: overlap.req_target_id,
        link_type: 'inferred',
        coverage_pct: overlap.coverage_pct,
        overlap_id: overlap.id,
        notes: overlap.inference_rule ?? 'Automatically inferred from cross-scheme compliance',
      })
      .select('id')
      .single();

    if (!insertErr) appliedCount++;
  }

  return appliedCount;
}

// ---------------------------------------------------------------------------
// CROSS-SCHEME OPPORTUNITIES REPORT
// ---------------------------------------------------------------------------

/**
 * Generate a full cross-scheme opportunity report for an organization.
 * Shows: which requirements could be satisfied by reusing existing evidence.
 * Used by: Evidence Center dashboard, audit preparation view.
 */
export async function getCrossSchemeOpportunityReport(
  organizationId: string,
  targetSchemeVersionId: string,
): Promise<CrossSchemeOpportunityReport> {
  // Get all requirements for target scheme
  const { data: requirements, error: reqErr } = await supabase
    .from('certification_requirements')
    .select('id, code, title, severity')
    .eq('scheme_version_id', targetSchemeVersionId)
    .eq('is_mandatory', true);

  if (reqErr) throw new Error(reqErr.message);

  const targetIds = (requirements ?? []).map((r) => r.id);
  if (!targetIds.length) return { opportunities: [], total_savings: 0, total_requirements: 0 };

  // Get current evaluation status
  const { data: evaluations } = await supabase
    .from('certification_requirement_evaluations')
    .select('requirement_id, compliance_status')
    .eq('organization_id', organizationId)
    .in('requirement_id', targetIds);

  const evalMap = new Map(
    (evaluations ?? []).map((e) => [e.requirement_id, e.compliance_status]),
  );

  // For each non-compliant requirement, check for reusable evidence
  const opportunities: CrossSchemeOpportunity[] = [];

  for (const req of requirements ?? []) {
    const status = evalMap.get(req.id) ?? 'not_started';
    if (status === 'compliant' || status === 'not_applicable') continue;

    const reusable = await findReusableEvidence(organizationId, req.id);
    if (!reusable.length) continue;

    // Group by source scheme
    const byScheme = new Map<string, ReusableEvidenceResult[]>();
    for (const r of reusable) {
      if (!byScheme.has(r.source_requirement_id)) byScheme.set(r.source_requirement_id, []);
      byScheme.get(r.source_requirement_id)!.push(r);
    }

    for (const [sourceReqId, items] of byScheme) {
      opportunities.push({
        source_requirement_id: sourceReqId,
        source_scheme_name: '',  // Enriched below via batch lookup
        overlap_type: items[0].overlap_type,
        coverage_pct: Math.min(100, items.reduce((sum, i) => sum + i.effective_coverage_pct, 0)),
        reusable_evidence_count: items.length,
        inference_rule: items[0].inference_rule,
      });
    }
  }

  // Batch-enrich source_scheme_name from DB — source_requirement_id → scheme name
  if (opportunities.length) {
    const sourceReqIds = [...new Set(opportunities.map((o) => o.source_requirement_id))];
    const { data: reqSchemeRows } = await supabase
      .from('certification_requirements')
      .select('id, certification_scheme_versions (certification_schemes (name))')
      .in('id', sourceReqIds);

    const schemeNameByReqId = new Map<string, string>(
      (reqSchemeRows ?? []).map((r) => [
        r.id,
        (r.certification_scheme_versions as { certification_schemes: { name: string } } | null)
          ?.certification_schemes?.name ?? 'Unknown',
      ]),
    );

    for (const opp of opportunities) {
      opp.source_scheme_name = schemeNameByReqId.get(opp.source_requirement_id) ?? 'Unknown';
    }
  }

  return {
    opportunities,
    total_savings: opportunities.length,
    total_requirements: targetIds.length,
  };
}

export interface CrossSchemeOpportunityReport {
  opportunities: CrossSchemeOpportunity[];
  total_savings: number;
  total_requirements: number;
}

// ---------------------------------------------------------------------------
// OVERLAP MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Register a new cross-scheme overlap mapping.
 * Used by: scheme administrators, certification consultants.
 */
export async function registerOverlap(
  sourceReqId: string,
  targetReqId: string,
  overlapType: OverlapType,
  coveragePct: number,
  inferenceRule?: string,
  notes?: string,
  createdBy?: string,
): Promise<CertificationRequirementOverlap> {
  const { data, error } = await supabase
    .from('certification_requirement_overlaps')
    .insert({
      req_source_id: sourceReqId,
      req_target_id: targetReqId,
      overlap_type: overlapType,
      coverage_pct: coveragePct,
      inference_rule: inferenceRule ?? null,
      notes: notes ?? null,
      created_by: createdBy ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Overlap registration failed: ${error.message}`);
  return data as CertificationRequirementOverlap;
}

/**
 * Load all overlaps for a given scheme version (used in overlap matrix view).
 */
export async function getSchemeOverlapMatrix(
  schemeVersionId: string,
): Promise<OverlapMatrixEntry[]> {
  // Fetch requirement IDs for this scheme first — avoids raw SQL interpolation in .or()
  const { data: reqRows, error: reqErr } = await supabase
    .from('certification_requirements')
    .select('id')
    .eq('scheme_version_id', schemeVersionId);

  if (reqErr) throw new Error(reqErr.message);
  const reqIds = (reqRows ?? []).map((r) => r.id);
  if (!reqIds.length) return [];

  const { data, error } = await supabase
    .from('certification_requirement_overlaps')
    .select(`
      id,
      overlap_type,
      coverage_pct,
      inference_rule,
      req_source:certification_requirements!req_source_id (
        id, code, title, scheme_version_id,
        certification_scheme_versions (version_code, certification_schemes (name))
      ),
      req_target:certification_requirements!req_target_id (
        id, code, title, scheme_version_id,
        certification_scheme_versions (version_code, certification_schemes (name))
      )
    `)
    .or(`req_source_id.in.(${reqIds.join(',')}),req_target_id.in.(${reqIds.join(',')})`);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    overlap_type: row.overlap_type as OverlapType,
    coverage_pct: row.coverage_pct,
    inference_rule: row.inference_rule,
    source: row.req_source as OverlapMatrixRequirement,
    target: row.req_target as OverlapMatrixRequirement,
  }));
}

export interface OverlapMatrixRequirement {
  id: string;
  code: string;
  title: string;
  scheme_version_id: string;
  certification_scheme_versions: {
    version_code: string;
    certification_schemes: { name: string };
  };
}

export interface OverlapMatrixEntry {
  id: string;
  overlap_type: OverlapType;
  coverage_pct: number;
  inference_rule: string | null;
  source: OverlapMatrixRequirement;
  target: OverlapMatrixRequirement;
}

// ---------------------------------------------------------------------------
// DUPLICATE EFFORT DETECTION
// ---------------------------------------------------------------------------

/**
 * Detect when an organization is performing duplicate work across schemes.
 * Returns list of schemes where work is being duplicated unnecessarily.
 */
export async function detectDuplicateEffort(
  organizationId: string,
): Promise<DuplicateEffortReport[]> {
  // Get org's enrolled schemes
  const { data: schemes, error } = await supabase
    .from('organization_certification_schemes')
    .select(`
      id,
      scheme_version_id,
      certification_scheme_versions (
        certification_schemes (name, code)
      )
    `)
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) throw new Error(error.message);
  if ((schemes?.length ?? 0) < 2) return [];

  const reports: DuplicateEffortReport[] = [];
  const schemeVersionIds = (schemes ?? []).map((s) => s.scheme_version_id);

  // Find requirements across schemes that have 'equivalent' overlaps
  const { data: overlaps } = await supabase
    .from('certification_requirement_overlaps')
    .select(`
      req_source_id,
      req_target_id,
      coverage_pct,
      certification_requirements!req_source_id (scheme_version_id),
      target_req:certification_requirements!req_target_id (scheme_version_id)
    `)
    .eq('overlap_type', 'equivalent')
    .in('certification_requirements.scheme_version_id', schemeVersionIds)
    .in('target_req.scheme_version_id', schemeVersionIds);

  for (const overlap of overlaps ?? []) {
    const sourceVersionId = (overlap.certification_requirements as { scheme_version_id: string } | null)?.scheme_version_id;
    const targetVersionId = (overlap.target_req as { scheme_version_id: string } | null)?.scheme_version_id;

    if (!sourceVersionId || !targetVersionId || sourceVersionId === targetVersionId) continue;

    const sourceScheme = schemes?.find((s) => s.scheme_version_id === sourceVersionId);
    const targetScheme = schemes?.find((s) => s.scheme_version_id === targetVersionId);

    if (!sourceScheme || !targetScheme) continue;

    const sourceName = (sourceScheme.certification_scheme_versions as { certification_schemes: { name: string } } | null)?.certification_schemes?.name ?? 'Unknown';
    const targetName = (targetScheme.certification_scheme_versions as { certification_schemes: { name: string } } | null)?.certification_schemes?.name ?? 'Unknown';

    reports.push({
      source_scheme_name: sourceName,
      target_scheme_name: targetName,
      source_requirement_id: overlap.req_source_id,
      target_requirement_id: overlap.req_target_id,
      coverage_pct: overlap.coverage_pct,
      recommendation: `Evidence approved for ${sourceName} can be automatically reused for ${targetName} at ${overlap.coverage_pct}% coverage. No duplicate collection needed.`,
    });
  }

  return reports;
}

export interface DuplicateEffortReport {
  source_scheme_name: string;
  target_scheme_name: string;
  source_requirement_id: string;
  target_requirement_id: string;
  coverage_pct: number;
  recommendation: string;
}
