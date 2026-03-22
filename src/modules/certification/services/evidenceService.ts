// =============================================================================
// NOVA SILVA — CERTIFICATION INTELLIGENCE ENGINE
// Evidence Center Service (Section B + Section G: Evidence Center)
// =============================================================================
// Evidence is a first-class object. This service handles:
// - Creation (with file upload to Supabase Storage)
// - Lifecycle management (submit → review → approve/reject)
// - Cross-requirement linking
// - Offline-first buffering and sync
// - Blockchain anchoring after approval

import { supabase } from '@/integrations/supabase/client';
import type {
  CertificationEvidenceRecord,
  CertificationEvidenceLink,
  CreateEvidenceInput,
  LinkEvidenceInput,
  EvidenceLifecycleStatus,
  ScopeLevel,
  EvidenceType,
} from '../types';

// ---------------------------------------------------------------------------
// EVIDENCE CREATION
// ---------------------------------------------------------------------------

/**
 * Create an evidence record, optionally uploading a file.
 * Supports offline-first: if offline_device_id is set, synced_at is null.
 */
export async function createEvidenceRecord(
  input: CreateEvidenceInput,
): Promise<CertificationEvidenceRecord> {
  let storagePath: string | null = null;
  let fileHash: string | null = null;
  let fileSizeBytes: number | null = null;
  let mimeType: string | null = null;

  // Upload file if provided
  if (input.file) {
    const result = await uploadEvidenceFile(
      input.organization_id,
      input.scope_level,
      input.scope_id,
      input.file,
    );
    storagePath = result.path;
    fileHash = result.hash;
    fileSizeBytes = input.file.size;
    mimeType = input.file.type;
  }

  const { data, error } = await supabase
    .from('certification_evidence_records')
    .insert({
      organization_id: input.organization_id,
      evidence_type: input.evidence_type,
      type_definition_id: input.type_definition_id ?? null,
      title: input.title,
      description: input.description ?? null,
      source_system: input.source_system ?? 'manual',
      source_reference: input.source_reference ?? null,
      scope_level: input.scope_level,
      scope_id: input.scope_id,
      collected_at: input.collected_at,
      valid_from: input.valid_from,
      valid_until: input.valid_until ?? null,
      geo_latitude: input.geo_latitude ?? null,
      geo_longitude: input.geo_longitude ?? null,
      geo_precision_m: input.geo_precision_m ?? null,
      geo_polygon_wkt: input.geo_polygon_wkt ?? null,
      metadata: input.metadata ?? {},
      is_offline_created: input.is_offline_created ?? false,
      offline_device_id: input.offline_device_id ?? null,
      offline_created_at: input.is_offline_created ? new Date().toISOString() : null,
      lifecycle_status: 'draft',
      storage_path: storagePath,
      file_hash_sha256: fileHash,
      file_size_bytes: fileSizeBytes,
      mime_type: mimeType,
    })
    .select()
    .single();

  if (error) throw new Error(`Evidence creation failed: ${error.message}`);
  return data as CertificationEvidenceRecord;
}

/**
 * Upload evidence file to Supabase Storage.
 * Path: evidence/{org_id}/{scope_level}/{scope_id}/{timestamp}_{filename}
 */
async function uploadEvidenceFile(
  organizationId: string,
  scopeLevel: ScopeLevel,
  scopeId: string,
  file: File,
): Promise<{ path: string; hash: string }> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `evidence/${organizationId}/${scopeLevel}/${scopeId}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage.from('certification-evidence').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw new Error(`File upload failed: ${error.message}`);

  // Compute SHA-256 hash in browser (SECTION I — integrity check)
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return { path, hash };
}

// ---------------------------------------------------------------------------
// LIFECYCLE MANAGEMENT
// ---------------------------------------------------------------------------

/**
 * Submit evidence for review (draft → submitted).
 */
export async function submitEvidence(evidenceId: string): Promise<void> {
  await transitionLifecycle(evidenceId, 'submitted');
}

/**
 * Approve evidence (under_review → approved).
 * Triggers: version snapshot, compliance re-evaluation, blockchain anchor.
 */
export async function approveEvidence(
  evidenceId: string,
  reviewedBy: string,
): Promise<CertificationEvidenceRecord> {
  const { data, error } = await supabase
    .from('certification_evidence_records')
    .update({
      lifecycle_status: 'approved',
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', evidenceId)
    .select()
    .single();

  if (error) throw new Error(`Evidence approval failed: ${error.message}`);

  // Anchor the approved evidence on internal blockchain
  await anchorEvidence(data as CertificationEvidenceRecord, reviewedBy);

  return data as CertificationEvidenceRecord;
}

/**
 * Reject evidence with reason (submitted/under_review → rejected).
 */
export async function rejectEvidence(
  evidenceId: string,
  reason: string,
  reviewedBy: string,
): Promise<void> {
  const { error } = await supabase
    .from('certification_evidence_records')
    .update({
      lifecycle_status: 'rejected',
      rejection_reason: reason,
      reviewed_by: reviewedBy,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', evidenceId);

  if (error) throw new Error(`Evidence rejection failed: ${error.message}`);
}

/**
 * Supersede an evidence record with a newer version.
 * Old record: lifecycle_status → superseded.
 * Caller must then create the new record.
 */
export async function supersedeEvidence(
  oldEvidenceId: string,
  newEvidenceId: string,
): Promise<void> {
  const { error } = await supabase
    .from('certification_evidence_records')
    .update({
      lifecycle_status: 'superseded',
      superseded_by_id: newEvidenceId,
    })
    .eq('id', oldEvidenceId);

  if (error) throw new Error(`Evidence supersession failed: ${error.message}`);
}

async function transitionLifecycle(
  evidenceId: string,
  newStatus: EvidenceLifecycleStatus,
): Promise<void> {
  const { error } = await supabase
    .from('certification_evidence_records')
    .update({ lifecycle_status: newStatus })
    .eq('id', evidenceId);

  if (error) throw new Error(`Lifecycle transition to ${newStatus} failed: ${error.message}`);
}

// ---------------------------------------------------------------------------
// EVIDENCE LINKING (cross-scheme reuse)
// ---------------------------------------------------------------------------

/**
 * Link one evidence record to multiple requirements.
 * Automatically triggers cross-scheme inference for each link.
 */
export async function linkEvidenceToRequirements(
  organizationId: string,
  input: LinkEvidenceInput,
): Promise<CertificationEvidenceLink[]> {
  const links = input.requirement_ids.map((reqId) => ({
    organization_id: organizationId,
    evidence_id: input.evidence_id,
    requirement_id: reqId,
    link_type: input.link_type ?? 'primary',
    coverage_pct: input.coverage_pct ?? 100,
    notes: input.notes ?? null,
  }));

  const { data, error } = await supabase
    .from('certification_evidence_links')
    .upsert(links, { onConflict: 'evidence_id,requirement_id' })
    .select();

  if (error) throw new Error(`Evidence linking failed: ${error.message}`);

  // Trigger cross-scheme inference for each link
  for (const reqId of input.requirement_ids) {
    await inferCrossSchemeLinks(organizationId, input.evidence_id, reqId);
  }

  return data as CertificationEvidenceLink[];
}

/**
 * Calls cert_infer_cross_scheme_links() Postgres function.
 * Infers evidence links to overlapping requirements in other schemes.
 */
async function inferCrossSchemeLinks(
  organizationId: string,
  evidenceId: string,
  requirementId: string,
): Promise<number> {
  const { data, error } = await supabase.rpc('cert_infer_cross_scheme_links', {
    p_organization_id: organizationId,
    p_evidence_id: evidenceId,
    p_requirement_id: requirementId,
  });

  if (error) {
    // Non-fatal: log but don't throw (inference is best-effort)
    console.warn(`Cross-scheme inference failed for req ${requirementId}: ${error.message}`);
    return 0;
  }
  return (data as number) ?? 0;
}

// ---------------------------------------------------------------------------
// BLOCKCHAIN ANCHORING
// ---------------------------------------------------------------------------

/**
 * Anchor an approved evidence record to the internal blockchain.
 * Calls cert_anchor_entity() Postgres function.
 */
async function anchorEvidence(
  evidence: CertificationEvidenceRecord,
  anchoredBy: string,
): Promise<string> {
  // Build canonical JSON (deterministic field ordering)
  const canonical = JSON.stringify({
    id: evidence.id,
    organization_id: evidence.organization_id,
    evidence_type: evidence.evidence_type,
    scope_level: evidence.scope_level,
    scope_id: evidence.scope_id,
    collected_at: evidence.collected_at,
    valid_from: evidence.valid_from,
    valid_until: evidence.valid_until,
    file_hash_sha256: evidence.file_hash_sha256,
    lifecycle_status: 'approved',
    reviewed_at: evidence.reviewed_at,
  });

  const { data, error } = await supabase.rpc('cert_anchor_entity', {
    p_organization_id: evidence.organization_id,
    p_entity_type: 'evidence_record',
    p_entity_id: evidence.id,
    p_canonical_json: canonical,
    p_anchored_by: anchoredBy,
  });

  if (error) throw new Error(`Blockchain anchoring failed: ${error.message}`);

  // Update evidence record with anchor ID
  await supabase
    .from('certification_evidence_records')
    .update({ blockchain_anchor_id: data as string })
    .eq('id', evidence.id);

  return data as string;
}

// ---------------------------------------------------------------------------
// OFFLINE SYNC (Section H — offline-first ingestion)
// ---------------------------------------------------------------------------

const OFFLINE_EVIDENCE_KEY = 'nova_silva_offline_evidence';

/**
 * Buffer an evidence record locally when offline.
 * Stores in localStorage for sync when connectivity returns.
 */
export function bufferOfflineEvidence(input: CreateEvidenceInput): string {
  const offlineId = `offline_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const existing = JSON.parse(localStorage.getItem(OFFLINE_EVIDENCE_KEY) ?? '[]') as Array<
    CreateEvidenceInput & { offline_id: string; buffered_at: string }
  >;

  existing.push({
    ...input,
    offline_id: offlineId,
    buffered_at: new Date().toISOString(),
    is_offline_created: true,
    offline_device_id: getDeviceId(),
  });

  localStorage.setItem(OFFLINE_EVIDENCE_KEY, JSON.stringify(existing));
  return offlineId;
}

/**
 * Sync buffered offline evidence records to Supabase.
 * Returns: { synced: number; failed: number }
 */
export async function syncOfflineEvidence(): Promise<{ synced: number; failed: number }> {
  const buffered = JSON.parse(
    localStorage.getItem(OFFLINE_EVIDENCE_KEY) ?? '[]',
  ) as Array<CreateEvidenceInput & { offline_id: string; buffered_at: string }>;

  if (!buffered.length) return { synced: 0, failed: 0 };

  let synced = 0;
  let failed = 0;
  const remaining: typeof buffered = [];

  for (const item of buffered) {
    try {
      await createEvidenceRecord({
        ...item,
        is_offline_created: true,
        offline_device_id: item.offline_device_id ?? getDeviceId(),
      });
      synced++;
    } catch (err) {
      console.error(`Failed to sync offline evidence ${item.offline_id}:`, err);
      failed++;
      remaining.push(item);
    }
  }

  localStorage.setItem(OFFLINE_EVIDENCE_KEY, JSON.stringify(remaining));
  return { synced, failed };
}

function getDeviceId(): string {
  const key = 'nova_silva_device_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem(key, id);
  }
  return id;
}

// ---------------------------------------------------------------------------
// QUERIES
// ---------------------------------------------------------------------------

/**
 * Fetch all evidence for a specific scope entity.
 */
export async function getEvidenceByScope(
  organizationId: string,
  scopeLevel: ScopeLevel,
  scopeId: string,
  statusFilter?: EvidenceLifecycleStatus[],
): Promise<CertificationEvidenceRecord[]> {
  let query = supabase
    .from('certification_evidence_records')
    .select(`
      *,
      certification_evidence_links (
        *,
        certification_requirements (id, code, title, severity)
      ),
      certification_evidence_type_definitions (name, accepted_formats)
    `)
    .eq('organization_id', organizationId)
    .eq('scope_level', scopeLevel)
    .eq('scope_id', scopeId)
    .order('collected_at', { ascending: false });

  if (statusFilter?.length) {
    query = query.in('lifecycle_status', statusFilter);
  }

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data as CertificationEvidenceRecord[];
}

/**
 * Fetch all evidence linked to a specific requirement.
 */
export async function getEvidenceByRequirement(
  organizationId: string,
  requirementId: string,
): Promise<CertificationEvidenceRecord[]> {
  const { data, error } = await supabase
    .from('certification_evidence_records')
    .select(`
      *,
      certification_evidence_links!inner (
        requirement_id,
        link_type,
        coverage_pct
      )
    `)
    .eq('organization_id', organizationId)
    .eq('certification_evidence_links.requirement_id', requirementId)
    .in('lifecycle_status', ['submitted', 'under_review', 'approved'])
    .order('collected_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data as CertificationEvidenceRecord[];
}

/**
 * Fetch evidence statistics for an organization (Evidence Center dashboard).
 */
export async function getEvidenceStats(organizationId: string): Promise<{
  by_type: Record<EvidenceType, number>;
  by_status: Record<EvidenceLifecycleStatus, number>;
  total: number;
  offline_pending: number;
  expiring_soon: number;  // within 30 days
}> {
  const { data, error } = await supabase
    .from('certification_evidence_records')
    .select('evidence_type, lifecycle_status, valid_until, is_offline_created, synced_at')
    .eq('organization_id', organizationId);

  if (error) throw new Error(error.message);
  const records = data ?? [];

  const byType = {} as Record<EvidenceType, number>;
  const byStatus = {} as Record<EvidenceLifecycleStatus, number>;
  let offlinePending = 0;
  let expiringSoon = 0;
  const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

  for (const r of records) {
    byType[r.evidence_type as EvidenceType] = (byType[r.evidence_type as EvidenceType] ?? 0) + 1;
    byStatus[r.lifecycle_status as EvidenceLifecycleStatus] =
      (byStatus[r.lifecycle_status as EvidenceLifecycleStatus] ?? 0) + 1;

    if (r.is_offline_created && !r.synced_at) offlinePending++;
    if (r.valid_until && new Date(r.valid_until) <= thirtyDaysFromNow) expiringSoon++;
  }

  return {
    by_type: byType,
    by_status: byStatus,
    total: records.length,
    offline_pending: offlinePending,
    expiring_soon: expiringSoon,
  };
}

/**
 * Get a signed download URL for evidence file.
 */
export async function getEvidenceFileUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('certification-evidence')
    .createSignedUrl(storagePath, 3600); // 1 hour expiry

  if (error) throw new Error(`Signed URL generation failed: ${error.message}`);
  return data.signedUrl;
}
