/**
 * revise_nutrition_plan_v1 — Edge Function para Nova Silva.
 * Crea una revisión de plan con ajustes manuales controlados (solo técnico o admin_org).
 * Límites duros: N -30%, K -25%, no saltarse encalado.
 *
 * Requiere JWT. verify_jwt = true.
 *
 * Invocación:
 *   POST /functions/v1/revise_nutrition_plan_v1
 *   Body: { plan_id_original, idempotency_key, revision_reason, manual_adjustments_json }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { applyAdjustments } from "./revision-logic.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return JSON.stringify(obj);
  if (typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map((v) => canonicalStringify(v)).join(",") + "]";
  const entries = Object.entries(obj as Record<string, unknown>).sort(([a], [b]) => a.localeCompare(b));
  const parts = entries.map(([k, v]) => JSON.stringify(k) + ":" + canonicalStringify(v));
  return "{" + parts.join(",") + "}";
}

async function sha256Hex(data: string): Promise<string> {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest("SHA-256", enc.encode(data));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid Authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  } catch {
    /* empty */
  }

  const planIdOriginal = body.plan_id_original as string | undefined;
  const idempotencyKey = body.idempotency_key as string | undefined;
  const revisionReason = body.revision_reason as string | undefined;
  const manualAdjustmentsJson = body.manual_adjustments_json as Record<string, unknown> | undefined;

  if (!planIdOriginal || !idempotencyKey || !manualAdjustmentsJson) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        required: ["plan_id_original", "idempotency_key", "manual_adjustments_json"],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: orgData } = await supabase.rpc("get_user_organization_id", { p_user_id: user.id });
  const orgId = orgData as string | null;
  if (!orgId) {
    return new Response(
      JSON.stringify({ error: "User has no organization" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: canApprove } = await supabase.rpc("can_approve_nutrition_plan", {
    p_user_id: user.id,
    p_org_id: orgId,
  });
  if (!canApprove) {
    return new Response(
      JSON.stringify({ error: "Insufficient role: requires tecnico or admin_org" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Idempotencia: buscar revisión existente
  const { data: existingRevision } = await supabase
    .from("nutricion_planes")
    .select("id, receta_canonica_json, estado, created_at")
    .eq("plan_revision_of", planIdOriginal)
    .eq("revision_idempotency_key", idempotencyKey)
    .eq("organization_id", orgId)
    .maybeSingle();

  if (existingRevision) {
    return new Response(
      JSON.stringify({
        idempotent: true,
        plan: existingRevision,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Cargar plan original
  const { data: originalPlan, error: planErr } = await supabase
    .from("nutricion_planes")
    .select("*")
    .eq("id", planIdOriginal)
    .eq("organization_id", orgId)
    .single();

  if (planErr || !originalPlan) {
    return new Response(
      JSON.stringify({ error: "Plan not found or access denied" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const receta = (originalPlan.receta_canonica_json ?? {}) as Record<string, unknown>;
  const { receta: recetaRevised, error: limitError } = applyAdjustments(receta, manualAdjustmentsJson);

  if (limitError) {
    return new Response(
      JSON.stringify({ error: "Adjustment rejected", details: limitError }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const canonicalStr = canonicalStringify(recetaRevised);
  const hashReceta = await sha256Hex(canonicalStr);

  const explainJson = [
    ...((originalPlan.explain_json as string[]) ?? []),
    `Revisión: ${revisionReason ?? "manual"}`,
    `Ajustes: ${JSON.stringify(manualAdjustmentsJson)}`,
  ];

  const newPlan = {
    organization_id: orgId,
    parcela_id: originalPlan.parcela_id,
    ruleset_version: originalPlan.ruleset_version,
    engine_version: originalPlan.engine_version,
    receta_canonica_json: recetaRevised,
    hash_receta: hashReceta,
    explain_json: explainJson,
    nivel_confianza: originalPlan.nivel_confianza,
    modo_calculo: originalPlan.modo_calculo,
    estado: "recommended",
    plan_revision_of: planIdOriginal,
    revision_reason: revisionReason ?? null,
    revision_idempotency_key: idempotencyKey,
    created_by: user.id,
  };

  const { data: insertedPlan, error: insertErr } = await supabase
    .from("nutricion_planes")
    .insert(newPlan)
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return new Response(
        JSON.stringify({ error: "Duplicate revision (idempotent)", idempotent: true }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to create revision", details: insertErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  await supabase
    .from("nutricion_planes")
    .update({ estado: "superseded", updated_at: new Date().toISOString() })
    .eq("id", planIdOriginal)
    .eq("organization_id", orgId);

  await supabase.from("ag_plan_events").insert([
    {
      organization_id: orgId,
      plan_id: planIdOriginal,
      event_type: "revised",
      payload_json: {
        new_plan_id: insertedPlan?.id,
        revision_reason: revisionReason,
        superseded: true,
      },
      created_by: user.id,
    },
    {
      organization_id: orgId,
      plan_id: insertedPlan?.id,
      event_type: "generated",
      payload_json: {
        revision_of: planIdOriginal,
        revision_reason: revisionReason,
      },
      created_by: user.id,
    },
  ]);

  return new Response(
    JSON.stringify({
      plan: insertedPlan,
      original_superseded: true,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
