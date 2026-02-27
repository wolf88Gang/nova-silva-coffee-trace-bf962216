/**
 * ng-impact-recompute — Edge Function para Nova Silva.
 * Procesa eventos recompute_requested y materializa ng_impacts + agro_state_parcela.
 * Usa columnas processed_at, processing_started_at para cola y locking.
 * Protegido por header x-ng-recompute-secret. verify_jwt = false.
 *
 * Secret: supabase secrets set NG_RECOMPUTE_SECRET="<token_largo_random>"
 *
 * Invocación:
 *   curl -s -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/ng-impact-recompute' \
 *     -H "Content-Type: application/json" \
 *     -H "x-ng-recompute-secret: <EL_MISMO_TOKEN>" \
 *     -d '{"limit":50}'
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ng-recompute-secret",
};

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

/** Cálculo rules_v1 exacto según spec */
function computeRulesV1(diagnostic: Record<string, unknown>): {
  expectedLossPct: number;
  damageFactor: number;
  confidence: number;
} {
  const inc = ((diagnostic.incidence_pct as number) ?? 0) / 100;
  const sev = (diagnostic.severity_scale as number) ?? 0;
  const pheno = (diagnostic.phenology_index as number) ?? 0.5;
  const issueCode = (diagnostic.issue_code as string) ?? "";

  let base: number;
  if (issueCode === "broca") {
    base = 0.1 * inc + 0.05 * sev;
    base = base * (0.5 + pheno);
  } else if (issueCode === "roya") {
    base = 0.08 * inc + 0.06 * sev;
    base = base * (0.7 + (1 - pheno));
  } else {
    base = 0.05 * inc + 0.03 * sev;
  }

  const expectedLossPct = clamp(base, 0, 1);
  const damageFactor = clamp(1 - expectedLossPct, 0, 1);
  const confidence = (diagnostic.confidence as number) ?? 0.6;

  return { expectedLossPct, damageFactor, confidence };
}

function markProcessed(
  supabase: ReturnType<typeof createClient>,
  evId: string,
  status: "ok" | "error",
  errorMsg: string | null,
  payload: Record<string, unknown>
) {
  const nowIso = new Date().toISOString();
  const mirrored: Record<string, unknown> = { ...payload, processed_at: nowIso, status };
  if (errorMsg) mirrored.error_message = errorMsg;
  return supabase
    .from("agro_events")
    .update({
      processed_at: nowIso,
      processing_status: status,
      processing_error: errorMsg,
      payload: mirrored,
    })
    .eq("id", evId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const secret = Deno.env.get("NG_RECOMPUTE_SECRET");
  const headerSecret = req.headers.get("x-ng-recompute-secret");
  if (!secret || !headerSecret || headerSecret !== secret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: missing or invalid x-ng-recompute-secret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let limit = 50;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.limit === "number" && body.limit > 0) {
      limit = Math.min(body.limit, 200);
    }
  } catch {
    /* default */
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const staleBeforeIso = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const staleBeforeOr = staleBeforeIso.replaceAll(":", "%3A");
  const since48h = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();

  const { data: events, error: fetchError } = await supabase
    .from("agro_events")
    .select("id, organization_id, payload, observed_at, processing_started_at")
    .eq("event_type", "recompute_requested")
    .is("processed_at", null)
    .gte("observed_at", since48h)
    .or(`processing_started_at.is.null,processing_started_at.lt.${staleBeforeOr}`)
    .order("observed_at", { ascending: true })
    .limit(limit);

  if (fetchError) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch events", details: fetchError.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const processed: string[] = [];
  const errors: { eventId: string; error: string }[] = [];
  const skipped: string[] = [];

  for (const ev of events ?? []) {
    const payload = (ev.payload as Record<string, unknown>) ?? {};

    const diagnosticIdRaw = payload.diagnostic_id;
    const diagnosticId = diagnosticIdRaw != null ? String(diagnosticIdRaw) : undefined;
    if (!diagnosticId) {
      await markProcessed(supabase, ev.id, "error", "Missing diagnostic_id", payload);
      errors.push({ eventId: ev.id, error: "Missing diagnostic_id" });
      continue;
    }

    const lockTs = new Date().toISOString();
    // Lock: intentar tomar lock (solo si processing_started_at es null)
    const { data: lockedRows, error: lockErr } = await supabase
      .from("agro_events")
      .update({
        processing_started_at: lockTs,
        processing_status: "processing",
        processing_error: null,
      })
      .eq("id", ev.id)
      .is("processed_at", null)
      .is("processing_started_at", null)
      .select("id");

    if (lockErr) {
      await markProcessed(supabase, ev.id, "error", lockErr.message, payload);
      errors.push({ eventId: ev.id, error: lockErr.message });
      continue;
    }

    if (!lockedRows || lockedRows.length === 0) {
      // Otro worker lo tomó; intentar steal si está stale
      const { data: stolenRows, error: stealErr } = await supabase
        .from("agro_events")
        .update({
          processing_started_at: lockTs,
          processing_status: "processing",
          processing_error: null,
        })
        .eq("id", ev.id)
        .is("processed_at", null)
        .lt("processing_started_at", staleBeforeIso)
        .select("id");

      if (stealErr || !stolenRows || stolenRows.length === 0) {
        skipped.push(ev.id);
        continue;
      }
    }

    const { data: diagnostic, error: diagError } = await supabase
      .from("ng_diagnostics")
      .select("id, organization_id, parcela_id, lote_id, productor_id, issue_code, incidence_pct, severity_scale, phenology_index, observed_at, created_by, source, model_version, confidence")
      .eq("id", diagnosticId)
      .single();

    if (diagError || !diagnostic) {
      await markProcessed(supabase, ev.id, "error", diagError?.message ?? "Diagnostic not found", payload);
      errors.push({ eventId: ev.id, error: diagError?.message ?? "Diagnostic not found" });
      continue;
    }

    try {
      const orgId = diagnostic.organization_id as string;
      const parcelaId = diagnostic.parcela_id as string | undefined;
      const loteId = diagnostic.lote_id as string | undefined;
      const productorId = diagnostic.productor_id as string | undefined;
      const observedAt = (diagnostic.observed_at as string) ?? new Date().toISOString();

      // Idempotencia: limit(1) en vez de maybeSingle
      const { data: existingImpacts, error: exErr } = await supabase
        .from("ng_impacts")
        .select("id")
        .eq("method", "rules_v1")
        .eq("organization_id", orgId)
        .contains("inputs", { diagnostic_id: String(diagnosticId) })
        .limit(1);

      if (exErr) throw exErr;
      if (existingImpacts && existingImpacts.length > 0) {
        await markProcessed(supabase, ev.id, "ok", "already_done", payload);
        processed.push(ev.id);
        continue;
      }

      const { expectedLossPct, damageFactor, confidence } = computeRulesV1(diagnostic);

      const windowEnd = observedAt;
      const windowStartDate = new Date(observedAt);
      windowStartDate.setDate(windowStartDate.getDate() - 14);
      const windowStart = windowStartDate.toISOString();

      const inputs = {
        diagnostic_id: diagnosticId,
        incidence_pct: diagnostic.incidence_pct,
        severity_scale: diagnostic.severity_scale,
        phenology_index: diagnostic.phenology_index,
        model_version: diagnostic.model_version,
      };

      const { error: impactError } = await supabase.from("ng_impacts").insert({
        organization_id: orgId,
        parcela_id: parcelaId ?? null,
        lote_id: loteId ?? null,
        productor_id: productorId ?? null,
        window_start: windowStart,
        window_end: windowEnd,
        issue_code: diagnostic.issue_code,
        expected_loss_pct: expectedLossPct,
        damage_factor: damageFactor,
        method: "rules_v1",
        inputs,
        confidence,
        computed_at: new Date().toISOString(),
        created_by: diagnostic.created_by,
      });

      if (impactError) throw impactError;

      if (parcelaId) {
        const { error: stateErr } = await supabase.from("agro_state_parcela").upsert(
          {
            organization_id: orgId,
            parcela_id: parcelaId,
            damage_factor_current: damageFactor,
            damage_factor_updated_at: observedAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "organization_id,parcela_id" }
        );
        if (stateErr) throw stateErr;
      }

      const { error: guardErr } = await supabase.from("agro_events").insert({
        organization_id: orgId,
        parcela_id: parcelaId ?? null,
        lote_id: loteId ?? null,
        productor_id: productorId ?? null,
        event_type: "guard_impact_updated",
        payload: {
          diagnostic_id: diagnosticId,
          issue_code: diagnostic.issue_code,
          expected_loss_pct: expectedLossPct,
          damage_factor: damageFactor,
          method: "rules_v1",
        },
        observed_at: observedAt,
        created_by: diagnostic.created_by,
        source: "edge",
        confidence,
      });
      if (guardErr) throw guardErr;

      await markProcessed(supabase, ev.id, "ok", null, payload);
      processed.push(ev.id);
    } catch (e) {
      const msg = (e as Error).message;
      await markProcessed(supabase, ev.id, "error", msg, payload);
      errors.push({ eventId: ev.id, error: msg });
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      processed: processed.length,
      processedIds: processed,
      errors: errors.length,
      errorDetails: errors,
      skipped: skipped.length,
      skippedIds: skipped,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
