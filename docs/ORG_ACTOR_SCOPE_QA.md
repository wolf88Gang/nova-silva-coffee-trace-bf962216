# ORG → ACTOR → ASSET Scope QA Checklist

## Functional Integrity Tests

### 1. Org List → Actor List
- [ ] Login as cooperativa → navigate to Productoras/es
- [ ] Actors list loads with org-scoped data
- [ ] Count matches org's actual actors
- [ ] Network tab: query includes `organization_id=<orgId>`

### 2. Actor Detail → Drilldown
- [ ] Click actor row → detail dialog opens
- [ ] Parcelas tab shows actor's plots only
- [ ] Entregas tab shows actor's deliveries only
- [ ] Créditos tab shows (if credits module active)
- [ ] VITAL score shows (if vital module active)

### 3. Parcel Detail → Documents
- [ ] Navigate to parcel detail
- [ ] Documents list is scoped by parcela_id + organization_id
- [ ] EUDR evidences show (if eudr module active)

### 4. Alerts Cross-Level
- [ ] Org dashboard shows alerts count
- [ ] Actor detail shows actor-specific alerts
- [ ] Parcel detail shows parcel-specific alerts
- [ ] All alerts filtered by organization_id

### 5. Cross-Org Isolation
- [ ] Login as org1 → note an actorId
- [ ] Login as org2 → try to access org1's actorId
- [ ] Result: 404 or empty (no data leak)
- [ ] Network: no response includes org1 data

### 6. Role-Scoped Narrowing
- [ ] Login as productor role
- [ ] Can only see own actor record
- [ ] Parcelas filtered to own plots
- [ ] Entregas filtered to own deliveries
- [ ] Cannot see other actors in the org

### 7. Key Consistency
- [ ] All hooks use `ORG_KEY`, `ACTOR_KEY`, `ASSET_KEY` from keys.ts
- [ ] No hardcoded `'organization_id'` strings in new hooks
- [ ] No `cooperativa_id` references in any query

### 8. Module Visibility
- [ ] Modules not in activeModules are hidden from UI
- [ ] Actor detail tabs respect module activation
- [ ] Dashboard widgets only show for active modules

## Smoke Test Commands
```sql
-- Verify org isolation
SELECT COUNT(*) FROM productores WHERE organization_id = '<org1_id>';
SELECT COUNT(*) FROM productores WHERE organization_id = '<org2_id>';

-- Verify actor scope
SELECT COUNT(*) FROM parcelas
WHERE organization_id = '<org_id>' AND productor_id = '<actor_id>';

-- Verify no orphans
SELECT COUNT(*) FROM parcelas
WHERE organization_id IS NULL OR productor_id IS NULL;
```
