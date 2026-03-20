# Signal-Driven Priority Engine — Spec & Examples

## 1. Priority Model (per question)

Each question has metadata:

```ts
{
  id: string,
  code: string,
  applies_to: OrganizationType[],
  tags: string[],
  weight: number,
  dependencies: string[],
  unlocks: string[],
  signal_targets: (PainSignal | MaturitySignal | UrgencySignal)[],
  gap_targets: ProfileGapField[],
  blocks_for_org_types?: { org_type, when_tagged }[]
}
```

Defined in `src/modules/sales/priorityQuestionConfig.ts` and `priorityEngine.types.ts`.

---

## 2. Gap Detection

**Function:** `getProfileGaps(profile: PriorityProfile): ProfileGapField[]`

Returns missing critical fields:

- `organization_type`
- `scale`
- `commercialization_model`
- `pricing_power`
- `buyer_type`
- `logistics_model`
- `certification_status`
- `pain_severity`
- `maturity_level`
- `urgency_timeline`
- `budget_readiness`
- `objection_profile`

---

## 3. Signal Tracking

Signals are updated from answers:

```ts
{
  pain_signals: ['rejections', 'manual_hours', 'visibility_gap', 'cost_impact', 'severity_high'],
  maturity_signals: ['legacy_systems', 'mobile_adoption', 'connectivity', 'data_format'],
  urgency_signals: ['timeline_short', 'harvest_soon'],
  contradiction_flags: ['budget_vs_urgency', 'maturity_vs_complexity', 'pain_vs_priority']
}
```

Each answer updates signals via `getSignalsFromAnswers(answers, questions)`.

---

## 4. Priority Engine — Scoring

**Function:** `getNextPriorityQuestion(profile, answeredQuestions, signals, questions, skippedQuestions?)`

**Algorithm:**

1. Filter by `organization_type` (applies_to)
2. Remove answered questions
3. Block productor-inappropriate questions (Section 5)
4. Check dependencies met
5. Score each candidate:

```
score =
  + weight
  + gap_relevance (15 per gap filled)
  + signal_relevance (12 per active signal matched)
  + contradiction_priority (20 if any contradiction flag)
  - redundancy_penalty (8 if same section already answered and no gap/signal)
```

6. Return highest-scoring question

---

## 5. Productor Blocking

If `profile.organization_type === 'productor'`:

**BLOCK** questions tagged:

- `cooperative_structure`
- `supplier_network`
- `how_many_producers_deliver`

Example: `CTX_PRODUCERS` ("Cantidad de productores") is blocked for productores.

---

## 6. Question Skipping

- `skippedQuestions: Set<string>` — permanently skipped question IDs (stored in `session.metadata.skipped_question_ids`)
- **Skip** button in UI — omits current question permanently; engine advances to next by relevance
- Engine can jump domains (e.g. operations → commercialization) when higher relevance score

---

## 7. UI — "Why this question?" Tooltip

Tooltip shows:

- **Gaps que cubre:** which profile fields this question fills
- **Señales activas:** which signals triggered this question
- **Score:** breakdown (weight + gap + signal)

---

## 8. Example Profiles → Different Next Questions

### Profile A: Fresh session (no org_type)

```
profile: { organization_type: null, scale: null, ... }
answered: []
signals: { pain_signals: [], maturity_signals: [], urgency_signals: [], contradiction_flags: [] }
```

**Next question:** `CTX_ORG_TYPE` (Tipo de organización)

**Reason:** `organization_type` is required first. Weight 100 + gap_relevance 50.

---

### Profile B: Productor (org_type known)

```
profile: { organization_type: 'productor', scale: null, ... }
answered: [CTX_ORG_TYPE]
signals: { pain_signals: [], maturity_signals: [], urgency_signals: [], contradiction_flags: [] }
```

**Next question:** `PAIN_REJECT` or `PAIN_SEVERITY` (high weight, fills pain_severity gap)

**Blocked:** `CTX_PRODUCERS` (tagged cooperative_structure, supplier_network, how_many_producers_deliver)

**Reason:** `CTX_PRODUCERS` blocked for productor. Pain questions fill `pain_severity` gap.

---

### Profile C: Cooperativa with high pain signal

```
profile: { organization_type: 'cooperativa', scale: '200_500', pain_severity: null, ... }
answered: [CTX_ORG_TYPE, CTX_PRODUCERS, PAIN_REJECT]
signals: { pain_signals: ['rejections'], maturity_signals: [], urgency_signals: [], contradiction_flags: [] }
```

**Next question:** `PAIN_COST` or `PAIN_SEVERITY` (signal_targets include 'rejections' → pain questions get signal_relevance bonus)

**Reason:** Active pain signal `rejections` → questions that deepen pain (PAIN_COST, PAIN_SEVERITY) get +12 signal_relevance. Also fills `pain_severity` gap (+15).

---

## Files

| File | Purpose |
|------|---------|
| `src/modules/sales/priorityEngine.types.ts` | Types |
| `src/modules/sales/priorityQuestionConfig.ts` | Question config |
| `src/modules/sales/priorityEngine.ts` | Engine logic |
| `src/modules/sales/FlowEngineLoader.ts` | Integration |
| `src/components/sales/QuestionRenderer.tsx` | "Why this question?" tooltip |
