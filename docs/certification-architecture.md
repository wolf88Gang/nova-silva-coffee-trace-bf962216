# Nova Silva — Certification Intelligence Engine Architecture

## SECTION A — ONTOLOGY DESIGN

```
certification_layers (EUDR | VSS | Corporate | National | Internal)
    └── certification_schemes (Rainforest Alliance, Fairtrade, EUDR, Nespresso AAA…)
            └── certification_scheme_versions (RA2020-v1, Fairtrade2019-v2…)
                    ├── certification_requirement_groups [Principle → Criterion → Indicator]
                    └── certification_requirements [atomic, evaluable]
                            ├── severity: zero_tolerance | major | minor | improvement
                            ├── audit_logic_type: geospatial | mass_balance | plausibility | …
                            ├── scope: organization | farm | parcel | lot
                            └── integration flags: nova_yield_required | nova_guard_required | labor_ops_required
```

### Severity Model
| Severity | Effect | Grace Period |
|---|---|---|
| `zero_tolerance` | Immediate `blocked` status | None |
| `major` | `non_compliant`, blocks certification | 90 days |
| `minor` | `non_compliant`, tracked | 180 days |
| `improvement` | Advisory only | 365 days |

### Audit Logic Types
| Type | Trigger | Integration |
|---|---|---|
| `geospatial_validation` | Parcel polygon vs. deforestation layers | Nova Guard, Satellite API |
| `mass_balance` | Volume reconciliation | lotes_acopio |
| `plausibility` | Yield vs. biological ceiling | Nova Yield |
| `financial_traceability` | Payment chain proof | LaborOps, Finance |
| `labor_traceback` | Worker identity, wages, child/forced labor | LaborOps |
| `document_review` | Manual doc verification | Storage |
| `sampling` | Statistical lot sampling | — |
| `interview` | Stakeholder interview | — |

---

## SECTION B — EVIDENCE MODEL

Evidence is a **first-class object**. A single evidence record can satisfy requirements across multiple certification schemes simultaneously.

```
certification_evidence_records
    ├── evidence_type: geospatial | financial | labor | agronomic | legal | environmental | social | organizational
    ├── scope_level: organization | farm | parcel | lot
    ├── lifecycle: draft → submitted → under_review → approved/rejected → superseded/expired
    ├── integrity: file_hash_sha256 + blockchain_anchor_id
    ├── offline: is_offline_created + offline_device_id + synced_at
    └── source_system: manual | nova_yield | nova_guard | labor_ops | compliance_hub | satellite_api
        ↓ (linked via)
certification_evidence_links
    ├── link_type: primary | supporting | inferred
    ├── coverage_pct: 0-100
    └── overlap_id → certification_requirement_overlaps (cross-scheme)
        ↓ (validated by)
certification_evidence_validations
    └── audit_logic_type + result + score + details (JSONB)
```

---

## SECTION C — COMPLIANCE ENGINE

**Deterministic logic only. No AI in core evaluation path.**

### Evaluation Flow
```
1. Evidence uploaded → lifecycle: draft
2. Evidence submitted → lifecycle: submitted
3. Auditor approves → lifecycle: approved + blockchain anchor
4. cert_compute_compliance_status() fires:
   - Check applicability (certification_requirement_applicability)
   - Check geospatial_validation result → if fail + zero_tolerance → 'blocked'
   - Check labor_traceback → if child/forced_labor → 'blocked'
   - Check mass_balance result
   - Check plausibility result
   - Count approved evidence (primary_count > 0 → 'compliant')
5. Upsert certification_requirement_evaluations
6. Trigger: cert_auto_create_corrective_action() if non_compliant/blocked
7. cert_rollup_scheme_compliance() → update org scheme counts + snapshot
```

### Missing Evidence Detection
- `missing_evidence[]` — human-readable list of required evidence types not found
- `missing_evidence_ids[]` — FK refs to `certification_evidence_type_definitions`
- Engine compares required types (from `certification_requirement_evidence_types`) against approved links

### Blocking Conditions (Zero Tolerance)
| Condition | Trigger | Recovery |
|---|---|---|
| Deforestation post 2020-12-31 | `certification_geospatial_validations.deforestation_alert = true` | False positive review OR parcel exclusion |
| Child labor detected | `certification_traceback_checks.child_labor_detected = true` | Immediate scheme suspension |
| Forced labor detected | `certification_traceback_checks.forced_labor_detected = true` | Immediate scheme suspension |
| Protected area overlap | `certification_geospatial_validations.overlap_protected_area = true` | Parcel exclusion |

---

## SECTION D — CROSS-SCHEME ENGINE

```
certification_requirement_overlaps
    ├── overlap_type: equivalent | partial | supersedes | infers
    ├── coverage_pct: 0-100 (effective reuse percentage)
    └── inference_rule: human-readable rule text

Engine functions:
    findReusableEvidence()     → find approved evidence from other schemes
    applyInferenceRules()      → propagate compliant signals via 'infers' rules
    detectDuplicateEffort()    → show org where they're working twice
    getCrossSchemeOpportunityReport() → full opportunity matrix
```

### Example Inference Rules
- `ESENCIAL C1.1 compliant → Fairtrade 2.1.1 inferred (80% coverage)`
- `RA2020 geo polygon approved → EUDR geo validation equivalent (100% coverage)`
- `Fairtrade payment receipt → Nespresso AAA financial traceability partial (60%)`

---

## SECTION E — SUPABASE DATA MODEL

### Migration Order
```
20260322000001  ENUMS
20260322000002  MASTER TABLES (layers, schemes, versions, requirements, overlaps)
20260322000003  EVIDENCE TABLES (records, links, validations, versions)
20260322000004  TENANT TABLES (profiles, org_schemes, applicability, responses, evaluations, snapshots)
20260322000005  AUDIT TABLES (mass_balance, plausibility, geospatial, traceback)
20260322000006  CORRECTIVE ACTIONS + BLOCKCHAIN ANCHORS
20260322000007  INDEXES + RLS
20260322000008  FUNCTIONS + TRIGGERS
```

### Table Groups
| Group | Tables | Purpose |
|---|---|---|
| Master | `certification_layers`, `certification_schemes`, `certification_scheme_versions`, `certification_requirement_groups`, `certification_requirements`, `certification_requirement_overlaps`, `certification_evidence_type_definitions`, `certification_requirement_evidence_types` | Global reference data |
| Evidence | `certification_evidence_records`, `certification_evidence_links`, `certification_evidence_validations`, `certification_evidence_versions` | Evidence lifecycle |
| Tenant | `organization_certification_profiles`, `organization_certification_schemes`, `certification_requirement_applicability`, `certification_requirement_responses`, `certification_requirement_evaluations`, `certification_scheme_readiness_snapshots` | Per-org state |
| Audit | `certification_mass_balance_checks`, `certification_plausibility_checks`, `certification_geospatial_validations`, `certification_traceback_checks` | Deterministic audit checks |
| CA | `certification_corrective_actions`, `certification_tasks`, `certification_ca_history` | Corrective action lifecycle |
| Crypto | `blockchain_anchors` | Immutable integrity log |

---

## SECTION F — MVP ALIGNMENT (Top 20)

| # | MVP Requirement | Table | Module | Logic | Evidence |
|---|---|---|---|---|---|
| 1 | EUDR geo compliance | `certification_geospatial_validations` | Compliance Hub | `cert_evaluate_geospatial()` trigger | `geospatial` evidence record |
| 2 | Deforestation cutoff 2020-12-31 | `certification_geospatial_validations.eudr_reference_date` | Compliance Hub | `deforestation_alert` check | Satellite imagery |
| 3 | Mass balance reconciliation | `certification_mass_balance_checks` | Audit Engine | `cert_run_mass_balance()` | Financial records, lot data |
| 4 | Yield plausibility | `certification_plausibility_checks` | Audit Engine | `cert_run_plausibility_check()` + Nova Yield | Agronomic records |
| 5 | Child labor zero tolerance | `certification_traceback_checks.child_labor_detected` | LaborOps integration | Zero-tolerance constraint + auto-block | Labor contracts |
| 6 | Forced labor zero tolerance | `certification_traceback_checks.forced_labor_detected` | LaborOps integration | Zero-tolerance constraint | Labor audits |
| 7 | Farm-level traceability | `certification_traceback_checks` (supply_chain) | Certification Engine | `traceability_pct` check | Delivery records |
| 8 | Minimum price / Fairtrade premium | `certification_traceback_checks` (financial) | Compliance Hub | `minimum_wage_met`, `fairtrade_premium_paid` | Payment receipts |
| 9 | Cross-scheme evidence reuse | `certification_requirement_overlaps` + `certification_evidence_links` | Cross-scheme Engine | `cert_infer_cross_scheme_links()` | Shared evidence records |
| 10 | Evidence lifecycle management | `certification_evidence_records` | Evidence Center | Status transition functions | All evidence types |
| 11 | Blockchain integrity anchoring | `blockchain_anchors` | Certification Engine | `cert_anchor_entity()` | SHA-256 + chain hash |
| 12 | Offline data capture | `certification_evidence_records.is_offline_created` | Evidence Center | `bufferOfflineEvidence()` + `syncOfflineEvidence()` | All types |
| 13 | Corrective action tracking | `certification_corrective_actions` | Corrective Actions Engine | Auto-creation trigger + lifecycle | Verification evidence |
| 14 | GPS precision error handling | `certification_geospatial_validations.gps_precision_m` | Compliance Hub | Warning if >30m | GPS data |
| 15 | False positive satellite alerts | `certification_geospatial_validations.false_positive_flag` | Compliance Hub | Manual review + `flagFalsePositive()` | Manual verification |
| 16 | Multi-scheme enrollment | `organization_certification_schemes` | Certification Engine | Per-scheme compliance scores | Per-scheme evidence |
| 17 | Audit readiness score | `certification_scheme_readiness_snapshots.audit_readiness_pct` | Audit Engine | `cert_rollup_scheme_compliance()` | Aggregate |
| 18 | Nova Guard risk signal integration | `certification_geospatial_validations.nova_guard_signal_id` | Compliance Hub | Signal → `nova_guard_risk_level` | Risk signals |
| 19 | Nova Yield biological ceiling | `certification_plausibility_checks.nova_yield_ceiling_kg_ha` | Audit Engine | `cert_run_plausibility_check()` | Yield records |
| 20 | LaborOps integration | `certification_traceback_checks.labor_ops_run_id` | Corrective Actions | `check_type = 'labor'` queries | Labor records |

---

## SECTION G — MODULE ARCHITECTURE

```
src/modules/certification/
├── types/index.ts                    ← All TypeScript types (mirrors SQL schema exactly)
├── services/
│   ├── complianceEngine.ts           ← Core evaluation, rollup, dashboard, audit runners
│   ├── evidenceService.ts            ← CRUD, lifecycle, file upload, offline sync, blockchain
│   └── crossSchemeEngine.ts          ← Overlap graph, reuse detection, inference, duplicate effort
├── hooks/
│   ├── useCertificationStatus.ts     ← Dashboard, scheme compliance, corrective actions
│   └── useEvidenceCenter.ts          ← Evidence CRUD, reuse opportunities, geospatial
└── index.ts                          ← Public API re-exports
```

### Module Responsibilities

| Module | Responsibility |
|---|---|
| **Compliance Hub (EUDR)** | `cert_evaluate_geospatial()`, EUDR article 3 checks, false positive handling, `flagFalsePositive()` |
| **Certification Engine** | Enrollment, `cert_compute_compliance_status()`, rollup, scheme-level compliance score |
| **Evidence Center** | `createEvidenceRecord()`, lifecycle management, file upload, offline sync, `blockchain_anchors` |
| **Audit Engine** | `cert_run_mass_balance()`, `cert_run_plausibility_check()`, traceback checks, readiness snapshots |
| **Corrective Actions Engine** | Auto-creation trigger, status lifecycle, `markOverdueCorrectiveActions()`, task management |
| **Cross-Scheme Engine** | Overlap registration, `findReusableEvidence()`, `applyInferenceRules()`, `detectDuplicateEffort()` |

---

## SECTION H — FILE STRUCTURE

```
supabase/migrations/
├── 20260322000001_certification_enums.sql
├── 20260322000002_certification_master_tables.sql
├── 20260322000003_certification_evidence_tables.sql
├── 20260322000004_certification_tenant_tables.sql
├── 20260322000005_certification_audit_tables.sql
├── 20260322000006_certification_corrective_actions_blockchain.sql
├── 20260322000007_certification_indexes_rls.sql
└── 20260322000008_certification_functions.sql

src/modules/certification/
├── types/index.ts
├── services/
│   ├── complianceEngine.ts
│   ├── evidenceService.ts
│   └── crossSchemeEngine.ts
├── hooks/
│   ├── useCertificationStatus.ts
│   └── useEvidenceCenter.ts
└── index.ts
```

---

## SECTION I — RISKS AND MITIGATIONS

| Risk | Description | Mitigation |
|---|---|---|
| **Satellite false positives** | GFW/GLAD alerts can flag agricultural land as deforestation. False positive rate ~15-30% in some regions. | `false_positive_flag` + manual review workflow. Alert confidence threshold. `false_positive_verified_by/at` audit trail. Engine uses `warning` not `fail` for low-confidence alerts. |
| **GPS precision errors** | Field GPS devices often ±10-50m. Polygon area calculations can be wrong by >5%. | `gps_precision_m` field. Warning trigger at >30m. `area_deviation_pct` check (warning at 20%, fail at 50%). |
| **Offline sync conflicts** | Multiple devices capture the same parcel offline simultaneously. On sync, duplicate records or data collisions. | `offline_device_id` + `synced_at` + `sync_conflict` + `conflict_details` JSONB. Deduplication by (org_id, requirement_id, scope_level, scope_id) UNIQUE constraint. Conflict flagged for manual resolution. |
| **Garbage-in, garbage-out** | Organizations can self-declare compliant yields or falsify payment records. | `cert_run_plausibility_check()` compares against Nova Yield ceiling. `cert_run_mass_balance()` catches volume inflation. Evidence requires file upload + hash integrity check. `blockchain_anchor_id` prevents post-approval tampering. |
| **User adoption risk** | Complex certification processes → users skip evidence collection or use workarounds. | Offline-first capture. Evidence gaps surfaced in dashboard. Cross-scheme reuse reduces work. Auto-created corrective actions with due dates. Task assignment with priority. |
| **Schema drift** | Certification standards update (e.g. RA 2020 → RA 2024). New requirements added mid-cycle. | `certification_scheme_versions` — requirements always version-pinned. `org_scheme` uses version_id not scheme_id. New versions created as new migration seeds. Organizations explicitly migrated to new versions. |
| **Evidence expiry** | Certificates, field visits, and lab reports expire. Stale evidence silently stays 'approved'. | `valid_until` on every evidence record. `max_age_days` on type definitions. `expiring_soon` stat (30-day window) in Evidence Center dashboard. Daily job to transition expired → `expired`. |
