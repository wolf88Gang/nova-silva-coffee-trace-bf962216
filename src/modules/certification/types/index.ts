// =============================================================================
// NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
// TypeScript Types — Sections A–I
// =============================================================================

// ---------------------------------------------------------------------------
// ENUMS (mirror of Postgres types)
// ---------------------------------------------------------------------------

export type SchemeType =
  | 'eudr'
  | 'vss'
  | 'corporate'
  | 'national'
  | 'internal';

export type RequirementSeverity =
  | 'zero_tolerance'
  | 'major'
  | 'minor'
  | 'improvement';

export type AuditLogicType =
  | 'geospatial_validation'
  | 'mass_balance'
  | 'plausibility'
  | 'financial_traceability'
  | 'labor_traceback'
  | 'document_review'
  | 'sampling'
  | 'interview';

export type ComplianceStatus =
  | 'not_started'
  | 'in_progress'
  | 'compliant'
  | 'non_compliant'
  | 'waived'
  | 'not_applicable'
  | 'blocked';

export type EvidenceType =
  | 'geospatial'
  | 'financial'
  | 'labor'
  | 'agronomic'
  | 'legal'
  | 'environmental'
  | 'social'
  | 'organizational';

export type EvidenceLifecycleStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'expired'
  | 'superseded';

export type CorrectiveActionStatus =
  | 'open'
  | 'in_progress'
  | 'pending_verification'
  | 'closed'
  | 'overdue'
  | 'waived';

export type AuditResult = 'pass' | 'fail' | 'warning' | 'inconclusive' | 'not_run';

export type BlockchainChain =
  | 'internal'
  | 'polygon_mainnet'
  | 'ethereum_mainnet'
  | 'hyperledger';

export type ScopeLevel = 'organization' | 'farm' | 'parcel' | 'lot';

export type OverlapType = 'equivalent' | 'partial' | 'supersedes' | 'infers';

export type EvidenceLinkType = 'primary' | 'supporting' | 'inferred';

// ---------------------------------------------------------------------------
// SECTION A — ONTOLOGY (Master Reference Tables)
// ---------------------------------------------------------------------------

export interface CertificationLayer {
  id: string;
  code: string;
  name: string;
  description: string | null;
  layer_type: SchemeType;
  is_regulatory: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CertificationScheme {
  id: string;
  layer_id: string;
  code: string;
  name: string;
  short_name: string | null;
  issuing_body: string | null;
  website_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined
  layer?: CertificationLayer;
}

export interface CertificationSchemeVersion {
  id: string;
  scheme_id: string;
  version_code: string;
  version_name: string;
  effective_from: string;
  effective_until: string | null;
  is_current: boolean;
  changelog_url: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  scheme?: CertificationScheme;
}

export interface CertificationRequirementGroup {
  id: string;
  scheme_version_id: string;
  parent_group_id: string | null;
  code: string;
  name: string;
  description: string | null;
  sort_order: number;
  depth_level: number;
  created_at: string;
  updated_at: string;
  // Joined
  children?: CertificationRequirementGroup[];
  requirements?: CertificationRequirement[];
}

export interface CertificationRequirement {
  id: string;
  scheme_version_id: string;
  group_id: string;
  parent_req_id: string | null;
  code: string;
  title: string;
  description: string;
  rationale: string | null;
  guidance: string | null;
  severity: RequirementSeverity;
  audit_logic_type: AuditLogicType;
  scope_organization: boolean;
  scope_farm: boolean;
  scope_parcel: boolean;
  scope_lot: boolean;
  is_mandatory: boolean;
  blocks_certification: boolean;
  nova_yield_required: boolean;
  nova_guard_required: boolean;
  labor_ops_required: boolean;
  eudr_article_ref: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
  // Joined
  group?: CertificationRequirementGroup;
  sub_requirements?: CertificationRequirement[];
  overlaps?: CertificationRequirementOverlap[];
}

export interface CertificationRequirementOverlap {
  id: string;
  req_source_id: string;
  req_target_id: string;
  overlap_type: OverlapType;
  coverage_pct: number;
  inference_rule: string | null;
  inference_logic: string | null;
  notes: string | null;
  created_at: string;
  // Joined
  source_requirement?: CertificationRequirement;
  target_requirement?: CertificationRequirement;
}

export interface CertificationEvidenceTypeDefinition {
  id: string;
  code: string;
  name: string;
  evidence_type: EvidenceType;
  description: string | null;
  accepted_formats: string[];
  max_age_days: number | null;
  requires_signature: boolean;
  requires_witness: boolean;
  requires_notary: boolean;
  is_geo_tagged: boolean;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// SECTION B — EVIDENCE MODEL (First-Class Evidence Objects)
// ---------------------------------------------------------------------------

export interface CertificationEvidenceRecord {
  id: string;
  organization_id: string;
  evidence_type: EvidenceType;
  type_definition_id: string | null;
  title: string;
  description: string | null;
  source_system: 'manual' | 'nova_yield' | 'nova_guard' | 'labor_ops' | 'compliance_hub' | 'satellite_api' | 'external_auditor';
  source_reference: string | null;
  scope_level: ScopeLevel;
  scope_id: string;
  collected_at: string;
  valid_from: string;
  valid_until: string | null;
  lifecycle_status: EvidenceLifecycleStatus;
  rejection_reason: string | null;
  superseded_by_id: string | null;
  storage_path: string | null;
  file_hash_sha256: string | null;
  file_size_bytes: number | null;
  mime_type: string | null;
  geo_latitude: number | null;
  geo_longitude: number | null;
  geo_precision_m: number | null;
  geo_polygon_wkt: string | null;
  metadata: Record<string, unknown>;
  is_offline_created: boolean;
  offline_device_id: string | null;
  offline_created_at: string | null;
  synced_at: string | null;
  blockchain_anchor_id: string | null;
  created_by: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  links?: CertificationEvidenceLink[];
  validations?: CertificationEvidenceValidation[];
  type_definition?: CertificationEvidenceTypeDefinition;
}

export interface CertificationEvidenceLink {
  id: string;
  organization_id: string;
  evidence_id: string;
  requirement_id: string;
  link_type: EvidenceLinkType;
  coverage_pct: number;
  overlap_id: string | null;
  notes: string | null;
  created_by: string | null;
  created_at: string;
  // Joined
  requirement?: CertificationRequirement;
}

export interface CertificationEvidenceValidation {
  id: string;
  organization_id: string;
  evidence_id: string;
  requirement_id: string | null;
  validation_rule: string;
  audit_logic: AuditLogicType;
  result: AuditResult;
  score: number | null;
  threshold: number | null;
  details: Record<string, unknown>;
  error_message: string | null;
  is_automated: boolean;
  engine_version: string | null;
  validated_at: string;
  validated_by: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// SECTION C — COMPLIANCE ENGINE OUTPUTS
// ---------------------------------------------------------------------------

export interface OrganizationCertificationProfile {
  id: string;
  organization_id: string;
  profile_name: string;
  country_code: string;
  commodity: string;
  farming_system: 'smallholder' | 'estate' | 'mixed' | null;
  hectares_total: number | null;
  producers_count: number | null;
  altitude_min_masl: number | null;
  altitude_max_masl: number | null;
  primary_variety: string | null;
  eudr_due_date: string | null;
  eudr_geo_data_submitted: boolean;
  last_audit_date: string | null;
  next_audit_date: string | null;
  audit_readiness_score: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrganizationCertificationScheme {
  id: string;
  organization_id: string;
  scheme_version_id: string;
  enrollment_date: string;
  expiry_date: string | null;
  certificate_number: string | null;
  certificate_url: string | null;
  audit_date: string | null;
  audit_firm: string | null;
  lead_auditor: string | null;
  compliance_status: ComplianceStatus;
  compliant_count: number;
  non_compliant_count: number;
  blocked_count: number;
  in_progress_count: number;
  not_applicable_count: number;
  total_requirements: number;
  compliance_score: number | null;
  is_active: boolean;
  deactivation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  scheme_version?: CertificationSchemeVersion;
}

export interface CertificationRequirementEvaluation {
  id: string;
  organization_id: string;
  requirement_id: string;
  response_id: string | null;
  scope_level: ScopeLevel;
  scope_id: string;
  compliance_status: ComplianceStatus;
  score: number | null;
  evidence_count: number;
  primary_evidence_count: number;
  missing_evidence: string[];
  missing_evidence_ids: string[];
  blocking_issues: string[];
  has_zero_tolerance_violation: boolean;
  open_ca_count: number;
  overdue_ca_count: number;
  evaluated_at: string;
  evaluated_by: string | null;
  engine_version: string;
  evaluation_version: number;
  blockchain_anchor_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  requirement?: CertificationRequirement;
}

export interface CertificationSchemeReadinessSnapshot {
  id: string;
  organization_id: string;
  org_scheme_id: string;
  snapshot_date: string;
  total_requirements: number;
  compliant_count: number;
  non_compliant_count: number;
  blocked_count: number;
  in_progress_count: number;
  not_started_count: number;
  waived_count: number;
  not_applicable_count: number;
  compliance_score: number;
  audit_readiness_pct: number;
  is_blocked: boolean;
  blocking_reasons: string[];
  reused_evidence_count: number;
  inferred_compliant_count: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// SECTION D — AUDIT / CONTROL TABLES
// ---------------------------------------------------------------------------

export interface CertificationMassBalanceCheck {
  id: string;
  organization_id: string;
  scheme_version_id: string;
  lot_id: string | null;
  period_start: string;
  period_end: string;
  check_level: 'lot' | 'period' | 'annual';
  certified_volume_kg: number;
  received_volume_kg: number;
  processed_volume_kg: number;
  sold_volume_kg: number;
  exported_volume_kg: number;
  stock_opening_kg: number;
  stock_closing_kg: number;
  conversion_ratio: number;
  conversion_basis: 'cherry' | 'parchment' | 'green' | 'roasted' | null;
  variance_kg: number;  // GENERATED column
  variance_pct: number | null;
  tolerance_pct: number;
  result: AuditResult;
  failure_reason: string | null;
  warning_flags: string[];
  calculated_at: string;
  calculated_by: string | null;
  engine_version: string | null;
  blockchain_anchor_id: string | null;
  created_at: string;
}

export interface CertificationPlausibilityCheck {
  id: string;
  organization_id: string;
  parcel_id: string;
  scheme_version_id: string;
  period_start: string;
  period_end: string;
  declared_yield_kg_ha: number;
  declared_area_ha: number | null;
  declared_total_kg: number | null;
  nova_yield_ceiling_kg_ha: number | null;
  nova_yield_run_id: string | null;
  nova_yield_confidence: number | null;
  variety_code: string | null;
  altitude_masl: number | null;
  rainfall_mm: number | null;
  temperature_avg_c: number | null;
  biotic_stress_factor: number | null;
  soil_quality_index: number | null;
  deviation_pct: number | null;
  max_deviation_pct: number;
  result: AuditResult;
  failure_reason: string | null;
  warning_flags: string[];
  calculated_at: string;
  calculated_by: string | null;
  blockchain_anchor_id: string | null;
  created_at: string;
}

export interface CertificationGeospatialValidation {
  id: string;
  organization_id: string;
  parcel_id: string;
  scheme_version_id: string;
  polygon_wkt: string | null;
  polygon_area_ha: number | null;
  declared_area_ha: number | null;
  area_deviation_pct: number | null;
  gps_precision_m: number | null;
  gps_point_count: number | null;
  eudr_reference_date: string;
  deforestation_alert: boolean;
  alert_source: string | null;
  alert_area_ha: number | null;
  alert_confidence_pct: number | null;
  forest_cover_pct: number | null;
  overlap_protected_area: boolean;
  overlap_indigenous: boolean;
  overlap_water_body: boolean;
  overlap_area_ha: number | null;
  satellite_image_date: string | null;
  satellite_image_url: string | null;
  satellite_resolution_m: number | null;
  false_positive_flag: boolean;
  false_positive_reason: string | null;
  false_positive_verified_by: string | null;
  false_positive_verified_at: string | null;
  nova_guard_signal_id: string | null;
  nova_guard_risk_level: 'low' | 'medium' | 'high' | 'critical' | null;
  result: AuditResult;
  failure_reasons: string[];
  warning_flags: string[];
  validated_at: string | null;
  validated_by: string | null;
  engine_version: string | null;
  blockchain_anchor_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CertificationTracebackCheck {
  id: string;
  organization_id: string;
  scheme_version_id: string;
  check_type: 'labor' | 'supply_chain' | 'financial';
  lot_id: string | null;
  parcel_id: string | null;
  producer_id: string | null;
  period_start: string;
  period_end: string;
  workers_declared: number | null;
  workers_verified: number | null;
  seasonal_workers: number | null;
  permanent_workers: number | null;
  child_labor_detected: boolean;
  forced_labor_detected: boolean;
  discrimination_detected: boolean;
  minimum_wage_met: boolean | null;
  payment_gap_pct: number | null;
  ppe_provided: boolean | null;
  safety_training_done: boolean | null;
  labor_ops_run_id: string | null;
  farm_count_declared: number | null;
  farm_count_verified: number | null;
  traceability_pct: number | null;
  price_paid_usd_kg: number | null;
  minimum_price_usd_kg: number | null;
  fairtrade_premium_paid: boolean | null;
  premium_amount_usd: number | null;
  payment_proof_count: number | null;
  result: AuditResult;
  failure_reason: string | null;
  risk_score: number | null;
  warning_flags: string[];
  calculated_at: string;
  calculated_by: string | null;
  blockchain_anchor_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// CORRECTIVE ACTIONS
// ---------------------------------------------------------------------------

export interface CertificationCorrectiveAction {
  id: string;
  organization_id: string;
  requirement_id: string;
  evaluation_id: string | null;
  scope_level: ScopeLevel;
  scope_id: string;
  severity: RequirementSeverity;
  is_blocking: boolean;
  status: CorrectiveActionStatus;
  title: string;
  description: string;
  root_cause: string | null;
  action_plan: string | null;
  audit_finding_ref: string | null;
  scheme_version_id: string | null;
  due_date: string | null;
  days_to_resolve: number | null;
  resolution_description: string | null;
  closed_at: string | null;
  closed_by: string | null;
  verified_at: string | null;
  verified_by: string | null;
  verification_notes: string | null;
  verification_evidence_id: string | null;
  waiver_justification: string | null;
  waived_at: string | null;
  waived_by: string | null;
  escalated: boolean;
  escalated_at: string | null;
  escalation_reason: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  requirement?: CertificationRequirement;
  tasks?: CertificationTask[];
}

export interface CertificationTask {
  id: string;
  organization_id: string;
  corrective_action_id: string;
  title: string;
  description: string | null;
  category: 'data_collection' | 'field_visit' | 'document_upload' | 'stakeholder_meeting' | 'system_update' | 'verification' | 'other' | null;
  assigned_to: string | null;
  assigned_at: string | null;
  due_date: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'done' | 'cancelled';
  completed_at: string | null;
  completed_by: string | null;
  completion_notes: string | null;
  evidence_id: string | null;
  created_at: string;
  updated_at: string;
}

// ---------------------------------------------------------------------------
// BLOCKCHAIN
// ---------------------------------------------------------------------------

export interface BlockchainAnchor {
  id: string;
  organization_id: string;
  entity_type: 'evidence_record' | 'evaluation' | 'mass_balance' | 'geospatial' | 'traceback' | 'plausibility' | 'corrective_action' | 'scheme_snapshot';
  entity_id: string;
  payload_hash: string;
  payload_version: number;
  canonical_json: string | null;
  anchor_chain: BlockchainChain;
  tx_hash: string | null;
  block_number: number | null;
  block_timestamp: string | null;
  prev_anchor_id: string | null;
  chain_hash: string | null;
  is_verified: boolean;
  verified_at: string | null;
  verification_url: string | null;
  anchored_at: string;
  anchored_by: string | null;
}

// ---------------------------------------------------------------------------
// COMPUTED / COMPOSITE TYPES (used by services and hooks)
// ---------------------------------------------------------------------------

/** Full certification dashboard for an organization */
export interface OrgCertificationDashboard {
  profile: OrganizationCertificationProfile;
  schemes: OrgSchemeSummary[];
  blocking_issues: BlockingIssue[];
  pending_evidence: number;
  overdue_cas: number;
  next_audit_date: string | null;
}

export interface OrgSchemeSummary {
  scheme: OrganizationCertificationScheme;
  scheme_version: CertificationSchemeVersion;
  certification_scheme: CertificationScheme;
  latest_snapshot: CertificationSchemeReadinessSnapshot | null;
  is_audit_ready: boolean;
  days_to_expiry: number | null;
}

export interface BlockingIssue {
  requirement_id: string;
  requirement_code: string;
  requirement_title: string;
  scope_level: ScopeLevel;
  scope_id: string;
  issue_description: string;
  corrective_action_id: string | null;
  due_date: string | null;
}

/** Evidence gap for a requirement */
export interface EvidenceGap {
  requirement_id: string;
  requirement_code: string;
  requirement_title: string;
  severity: RequirementSeverity;
  scope_level: ScopeLevel;
  scope_id: string;
  missing_evidence_types: string[];
  current_coverage_pct: number;
  cross_scheme_opportunities: CrossSchemeOpportunity[];
}

/** Cross-scheme reuse opportunity */
export interface CrossSchemeOpportunity {
  source_requirement_id: string;
  source_scheme_name: string;
  overlap_type: OverlapType;
  coverage_pct: number;
  reusable_evidence_count: number;
  inference_rule: string | null;
}

/** Input for creating an evidence record (offline-first) */
export interface CreateEvidenceInput {
  organization_id: string;
  evidence_type: EvidenceType;
  type_definition_id?: string;
  title: string;
  description?: string;
  source_system?: CertificationEvidenceRecord['source_system'];
  source_reference?: string;
  scope_level: ScopeLevel;
  scope_id: string;
  collected_at: string;
  valid_from: string;
  valid_until?: string;
  geo_latitude?: number;
  geo_longitude?: number;
  geo_precision_m?: number;
  geo_polygon_wkt?: string;
  metadata?: Record<string, unknown>;
  is_offline_created?: boolean;
  offline_device_id?: string;
  // File to upload
  file?: File;
}

/** Input for linking evidence to requirements */
export interface LinkEvidenceInput {
  evidence_id: string;
  requirement_ids: string[];
  link_type?: EvidenceLinkType;
  coverage_pct?: number;
  notes?: string;
}

/** Result of a compliance evaluation run */
export interface ComplianceEvaluationResult {
  requirement_id: string;
  scope_level: ScopeLevel;
  scope_id: string;
  previous_status: ComplianceStatus;
  new_status: ComplianceStatus;
  changed: boolean;
  corrective_action_created: boolean;
}
