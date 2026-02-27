/**
 * agro-alert-evaluator — Edge Function para Nova Silva.
 * Evalúa ng_impacts contra agro_alert_rules y crea agro_alerts.
 * Protegido por header x-agro-alert-secret. verify_jwt = false.
 *
 * Secret: supabase secrets set AGRO_ALERT_SECRET="<token_largo_random>"
 *
 * Invocación:
 *   curl -s -X POST 'https://<PROJECT_REF>.supabase.co/functions/v1/agro-alert-evaluator' \
 *     -H "Content-Type: application/json" \
 *     -H "x-agro-alert-secret: <EL_MISMO_TOKEN>" \
 *     -d '{"limit":200,"since_hours":72}'
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-agro-alert-secret",
};

type AlertRule = {
  id: string;
  organization_id: string;
  rule_key: string;
  params: Record<string, unknown>;
  severity: string;
};

type NgImpact = {
  id: string;
  organization_id: string;
  parcela_id: string | null;
  lote_id: string | null;
  productor_id: string | null;
  window_start: string;
  window_end: string;
  issue_code: string;
  expected_loss_pct: number;
  damage_factor: number;
  inputs: Record<string, unknown>;
};

function matchesRule(rule: AlertRule, impact: NgImpact): { match: boolean; metricKey?: string; metricValue?: number } {
  if (rule.rule_key === "ng_expected_loss_threshold") {
    const issueCode = rule.params.issue_code as string | undefined;
    const threshold = (rule.params.threshold as number) ?? 0.15;
    if (issueCode && impact.issue_code === issueCode && impact.expected_loss_pct >= threshold) {
      return { match: true, metricKey: "expected_loss_pct", metricValue: impact.expected_loss_pct };
    }
  } else if (rule.rule_key === "ng_damage_factor_threshold") {
    const issueCode = rule.params.issue_code as string | undefined;
    const threshold = (rule.params.threshold as number) ?? 0.5;
    if ((!issueCode || impact.issue_code === issueCode) && impact.damage_factor >= threshold) {
      return { match: true, metricKey: "damage_factor", metricValue: impact.damage_factor };
    }
  }
  return { match: false };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const secret = Deno.env.get("AGRO_ALERT_SECRET");
  const headerSecret = req.headers.get("x-agro-alert-secret");
  if (!secret || !headerSecret || headerSecret !== secret) {
    return new Response(
      JSON.stringify({ error: "Unauthorized: missing or invalid x-agro-alert-secret" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let limit = 200;
  let sinceHours = 72;
  try {
    const body = await req.json().catch(() => ({}));
    if (typeof body?.limit === "number" && body.limit > 0) limit = Math.min(body.limit, 500);
    if (typeof body?.since_hours === "number" && body.since_hours > 0) sinceHours = Math.min(body.since_hours, 168);
  } catch {
    /* default */
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const since = new Date(Date.now() - sinceHours * 60 * 60 * 1000).toISOString();
  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: rules, error: rulesErr } = await supabase
    .from("agro_alert_rules")
    .select("id, organization_id, rule_key, params, severity")
    .eq("is_enabled", true);

  if (rulesErr) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch rules", details: rulesErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: impacts, error: impactsErr } = await supabase
    .from("ng_impacts")
    .select("id, organization_id, parcela_id, lote_id, productor_id, window_start, window_end, issue_code, expected_loss_pct, damage_factor, inputs")
    .gte("window_end", since)
    .order("window_end", { ascending: false })
    .limit(limit);

  if (impactsErr) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch impacts", details: impactsErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const rulesByOrg = new Map<string, AlertRule[]>();
  for (const r of rules ?? []) {
    const list = rulesByOrg.get(r.organization_id) ?? [];
    list.push(r as AlertRule);
    rulesByOrg.set(r.organization_id, list);
  }

  const created: string[] = [];
  const skipped: string[] = [];

  for (const impact of impacts ?? []) {
    const orgRules = rulesByOrg.get(impact.organization_id);
    if (!orgRules?.length) continue;

    for (const rule of orgRules) {
      const { match, metricKey, metricValue } = matchesRule(rule, impact as NgImpact);
      if (!match || !metricKey) continue;

      const parcelaId = impact.parcela_id ?? null;
      const issueCode = impact.issue_code ?? null;

      let dedupQuery = supabase
        .from("agro_alerts")
        .select("id")
        .eq("organization_id", impact.organization_id)
        .eq("rule_id", rule.id)
        .eq("window_end", impact.window_end)
        .eq("status", "open")
        .gte("created_at", since24h);

      if (parcelaId != null) dedupQuery = dedupQuery.eq("parcela_id", parcelaId);
      else dedupQuery = dedupQuery.is("parcela_id", null);
      if (issueCode != null) dedupQuery = dedupQuery.eq("issue_code", issueCode);
      else dedupQuery = dedupQuery.is("issue_code", null);

      const { data: existing } = await dedupQuery.limit(1);

      if (existing && existing.length > 0) {
        skipped.push(`${rule.id}:${impact.id}`);
        continue;
      }

      const alertPayload: Record<string, unknown> = {
        impact_id: impact.id,
        diagnostic_id: (impact.inputs as Record<string, unknown>)?.diagnostic_id,
      };

      const { data: newAlert, error: insertErr } = await supabase
        .from("agro_alerts")
        .insert({
          organization_id: impact.organization_id,
          rule_id: rule.id,
          parcela_id: parcelaId,
          lote_id: impact.lote_id ?? null,
          productor_id: impact.productor_id ?? null,
          issue_code: issueCode,
          metric_key: metricKey,
          metric_value: metricValue ?? null,
          window_start: impact.window_start,
          window_end: impact.window_end,
          status: "open",
          payload: alertPayload,
        })
        .select("id")
        .single();

      if (insertErr) {
        skipped.push(`${rule.id}:${impact.id}:${insertErr.message}`);
        continue;
      }

      if (newAlert?.id) {
        created.push(newAlert.id);
        await supabase.from("agro_events").insert({
          organization_id: impact.organization_id,
          parcela_id: parcelaId,
          lote_id: impact.lote_id ?? null,
          productor_id: impact.productor_id ?? null,
          event_type: "alert_created",
          payload: { alert_id: newAlert.id, rule_id: rule.id, impact_id: impact.id },
          observed_at: new Date().toISOString(),
          source: "edge",
        });
      }
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      created: created.length,
      createdIds: created,
      skipped: skipped.length,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
