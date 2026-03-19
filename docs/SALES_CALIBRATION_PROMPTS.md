# Sales Intelligence — Prompts para Calibración Real

Usar cuando confirmes `flow ok` (1 sesión + 1 outcome guardados).

---

## PROMPT 1 — Primer ciclo de calibración real

```
We are starting the first real calibration cycle for Sales Intelligence.

Context:
- Outcome capture is working
- Calibration Review UI is working
- Backend RPCs for calibration exist
- We have initial real or semi-real sessions with outcomes

Goal:
extract actionable insights from real data and identify first calibration adjustments.

Tasks:

1. Analyze current data using existing RPC outputs:
- score_bucket_analysis
- objection_analysis
- validation summary

2. Identify:

A. Score signals
- which dimensions correlate with wins
- which do not discriminate (flat win rates across buckets)
- which show strong negative patterns

B. Objections
- which objection_types have highest loss rate
- which are over_triggered (high frequency, low loss impact)
- which are high-risk (high loss rate, enough sample)

C. Early patterns
- combinations (e.g. low maturity + low budget)
- any obvious deal-killers

3. Output structured insights:

SECTION 1: SCORE INSIGHTS
- dimension
- observation
- implication

SECTION 2: OBJECTION INSIGHTS
- objection_type
- loss_rate
- interpretation

SECTION 3: EARLY PATTERNS
- pattern
- explanation

SECTION 4: INITIAL ADJUSTMENTS (NO CODE)
- which score weights should go up/down
- which objections should be weakened/strengthened
- which recommendation types may be wrong

Constraints:
- no SQL generation
- no schema changes
- no UI changes
- no ML

Focus only on interpretation and decision support.
```

---

## PROMPT 2 — Endurecer calidad de data

```
We need to improve the quality of outcome data in Sales Intelligence.

Goal:
prevent low-quality inputs that break calibration.

Tasks:

1. Enforce stricter validation for reason_lost:
- minimum length (e.g. 10–15 chars)
- discourage generic phrases (e.g. "no interés", "muy caro")

2. Add lightweight UX hints:
- placeholder examples of good reasons
- inline helper text

3. Add optional tagging (non-blocking):
- allow selecting a category:
  - budget
  - maturity
  - timing
  - authority
  - fit
  - competition

4. Keep it simple:
- no new tables required (optional local enum or text field)
- no redesign

Output:
SECTION 1: VALIDATION IMPROVEMENTS
SECTION 2: UX IMPROVEMENTS
SECTION 3: CODE CHANGES
```

---

## PROMPT 3 — Versionado de ajustes (cuando tengas datos)

```
We need to prepare the first calibration rule adjustment cycle.

Goal:
apply small, controlled improvements based on observed data.

Tasks:

1. Define how to:
- create a new rule version (sales_rule_versions)
- snapshot current rules (sales_rule_version_snapshots)
- mark current version inactive and new one active

2. Define safe adjustment limits:
- score weights max delta ±10
- objection confidence max delta ±0.15

3. Propose:
- how to compare old vs new performance
- how to rollback safely

Output:
SECTION 1: VERSIONING FLOW
SECTION 2: SAFETY RULES
SECTION 3: COMPARISON STRATEGY
```

---

## Orden sugerido

1. **Primer ciclo** — cuando tengas suficientes outcomes para análisis
2. **Calidad de data** — en paralelo o justo después
3. **Versionado** — cuando tengas datos y quieras aplicar ajustes
