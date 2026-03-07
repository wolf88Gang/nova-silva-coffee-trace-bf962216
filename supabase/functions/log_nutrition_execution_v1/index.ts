/**
 * log_nutrition_execution_v1 — Edge Function para Nova Silva.
 * Registra ejecución de fertilización contra un plan nutricional.
 * Recalcula % ejecución, actualiza estado del plan, inserta evento de auditoría.
 *
 * Requiere JWT. verify_jwt = true.
 *
 * Invocación:
 *   POST /functions/v1/log_nutrition_execution_v1
 *   Authorization: Bearer <session.access_token>
 *   Body: { plan_id, fecha_aplicacion, tipo_aplicacion, dosis_aplicada_json, evidencias?, costo_real?, idempotency_key }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import {
  addNutrientes,
  computeExecutionPct,
  sumNutrientes,
  type DosisNutrientes,
  type DemandaFinal,
} from "./execution-calc.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractDemanda(receta: Record<string, unknown>): DemandaFinal {
  const calc = receta.calculo_nutricional as Record<string, unknown> | undefined;
  const df = (calc?.demanda_final ?? receta.demanda_final ?? receta.demanda_calculada) as DemandaFinal | undefined;
  if (!df || typeof df !== "object") return {};
  return df as DemandaFinal;
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

  const planId = body.plan_id as string | undefined;
  const fechaAplicacion = body.fecha_aplicacion as string | undefined;
  const tipoAplicacion = body.tipo_aplicacion as string | undefined;
  const dosisAplicadaJson = body.dosis_aplicada_json as Record<string, unknown> | undefined;
  const evidencias = body.evidencias as string[] | undefined;
  const costoReal = body.costo_real as number | undefined;
  const idempotencyKey = body.idempotency_key as string | undefined;

  if (!planId || !fechaAplicacion || !tipoAplicacion || !dosisAplicadaJson || !idempotencyKey) {
    return new Response(
      JSON.stringify({
        error: "Missing required fields",
        required: ["plan_id", "fecha_aplicacion", "tipo_aplicacion", "dosis_aplicada_json", "idempotency_key"],
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const validTipos = ["edafica", "foliar", "mixta"];
  if (!validTipos.includes(tipoAplicacion)) {
    return new Response(
      JSON.stringify({ error: "tipo_aplicacion must be edafica, foliar or mixta" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const dateMatch = /^\d{4}-\d{2}-\d{2}$/.exec(fechaAplicacion);
  if (!dateMatch) {
    return new Response(
      JSON.stringify({ error: "fecha_aplicacion must be YYYY-MM-DD" }),
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

  // 2. Verificar plan pertenece a org
  const { data: plan, error: planErr } = await supabase
    .from("nutricion_planes")
    .select("id, organization_id, parcela_id, receta_canonica_json, estado")
    .eq("id", planId)
    .eq("organization_id", orgId)
    .single();

  if (planErr || !plan) {
    return new Response(
      JSON.stringify({ error: "Plan not found or access denied" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 3. Idempotencia
  const { data: existing } = await supabase
    .from("nutricion_aplicaciones")
    .select("id, fecha_aplicacion, tipo_aplicacion, dosis_aplicada_json, evidencias, costo_real, created_at")
    .eq("plan_id", planId)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existing) {
    const { data: allAplicaciones } = await supabase
      .from("nutricion_aplicaciones")
      .select("dosis_aplicada_json")
      .eq("plan_id", planId);
    const receta = (plan.receta_canonica_json ?? {}) as Record<string, unknown>;
    const demanda = extractDemanda(receta);
    const acumulado = (allAplicaciones ?? []).reduce<DosisNutrientes>(
      (acc, row) => addNutrientes(acc, sumNutrientes((row.dosis_aplicada_json as Record<string, unknown>)?.nutrientes as DosisNutrientes)),
      {}
    );
    const { execution_pct_by_nutrient, execution_pct_total } = computeExecutionPct(acumulado, demanda);
    return new Response(
      JSON.stringify({
        idempotent: true,
        aplicacion: existing,
        execution_pct_by_nutrient,
        execution_pct_total,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 4. Insertar nutricion_aplicaciones
  const nutrientes = (dosisAplicadaJson.nutrientes ?? {}) as DosisNutrientes;
  const evidenciasJson = Array.isArray(evidencias) ? evidencias : [];

  const { data: newAplicacion, error: insertErr } = await supabase
    .from("nutricion_aplicaciones")
    .insert({
      organization_id: orgId,
      plan_id: planId,
      parcela_id: plan.parcela_id,
      idempotency_key: idempotencyKey,
      fecha_aplicacion: fechaAplicacion,
      tipo_aplicacion: tipoAplicacion,
      dosis_aplicada_json: { nutrientes: nutrientes, productos: dosisAplicadaJson.productos ?? [], metodo: dosisAplicadaJson.metodo ?? {} },
      evidencias: evidenciasJson,
      costo_real: costoReal ?? null,
      created_by: user.id,
    })
    .select("id, fecha_aplicacion, tipo_aplicacion, dosis_aplicada_json, evidencias, costo_real, created_at")
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      return new Response(
        JSON.stringify({ error: "Duplicate idempotency_key", idempotent: true }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to insert aplicacion", details: insertErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 5-7. Recalcular acumulados y porcentajes
  const { data: allAplicaciones } = await supabase
    .from("nutricion_aplicaciones")
    .select("dosis_aplicada_json")
    .eq("plan_id", planId);

  const receta = (plan.receta_canonica_json ?? {}) as Record<string, unknown>;
  const demanda = extractDemanda(receta);
  const acumulado = (allAplicaciones ?? []).reduce<DosisNutrientes>(
    (acc, row) => {
      const d = row.dosis_aplicada_json as Record<string, unknown>;
      const n = (d?.nutrientes ?? {}) as DosisNutrientes;
      return addNutrientes(acc, sumNutrientes(n));
    },
    {}
  );

  const { execution_pct_by_nutrient, execution_pct_total } = computeExecutionPct(acumulado, demanda);

  // 8. Actualizar nutricion_planes
  const newEstado =
    execution_pct_total >= 90
      ? "completed"
      : plan.estado === "recommended" || plan.estado === "approved_tecnico"
        ? "in_execution"
        : plan.estado;

  const { error: updateErr } = await supabase
    .from("nutricion_planes")
    .update({
      execution_pct_total: execution_pct_total,
      execution_pct_by_nutrient: execution_pct_by_nutrient,
      estado: newEstado,
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("organization_id", orgId);

  if (updateErr) {
    return new Response(
      JSON.stringify({ error: "Failed to update plan", details: updateErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // 9. Insertar ag_plan_events
  await supabase.from("ag_plan_events").insert({
    organization_id: orgId,
    plan_id: planId,
    event_type: "execution_logged",
    payload_json: {
      aplicacion_id: newAplicacion?.id,
      fecha_aplicacion: fechaAplicacion,
      tipo_aplicacion: tipoAplicacion,
      execution_pct_total: execution_pct_total,
      execution_pct_by_nutrient: execution_pct_by_nutrient,
      nuevo_estado: newEstado,
    },
    created_by: user.id,
  });

  return new Response(
    JSON.stringify({
      aplicacion: newAplicacion,
      execution_pct_by_nutrient,
      execution_pct_total,
      estado: newEstado,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
