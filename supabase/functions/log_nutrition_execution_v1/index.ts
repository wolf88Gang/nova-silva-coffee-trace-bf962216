import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SUPABASE_URL = "https://qbwmsarqewxjuwgkdfmg.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ── 1. Validar JWT ──────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Missing or invalid Authorization header" }, 401);
    }

    const supabaseUser = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const {
      data: { user },
      error: authErr,
    } = await supabaseUser.auth.getUser(authHeader.replace("Bearer ", ""));

    if (authErr || !user) {
      return json({ error: "Invalid token" }, 401);
    }

    const userId = user.id;

    // ── 2. Parse body ───────────────────────────────────────
    const body = await req.json();
    const {
      plan_id,
      fecha_aplicacion,
      tipo_aplicacion = "edafica",
      dosis_aplicada_json,
      evidencias,
      costo_real,
      idempotency_key,
      fase_objetivo,
      producto_aplicado,
      cantidad_aplicada_kg,
      notas,
    } = body;

    if (!plan_id || !idempotency_key || !fecha_aplicacion) {
      return json(
        { error: "plan_id, idempotency_key and fecha_aplicacion are required" },
        400
      );
    }

    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 3. Verificar plan existe y obtener org ──────────────
    const { data: plan, error: planErr } = await sb
      .from("nutricion_planes")
      .select("id, organization_id, receta_canonica_json, estado, execution_pct_total, execution_pct_by_nutrient")
      .eq("id", plan_id)
      .single();

    if (planErr || !plan) {
      return json({ error: "Plan not found" }, 404);
    }

    // ── 4. Verificar usuario pertenece a la misma org ───────
    const { data: orgRow } = await sb
      .from("organizacion_usuarios")
      .select("organizacion_id")
      .eq("user_id", userId)
      .eq("organizacion_id", plan.organization_id)
      .eq("activo", true)
      .maybeSingle();

    if (!orgRow) {
      return json({ error: "User does not belong to the plan organization" }, 403);
    }

    // ── 5. Idempotencia ─────────────────────────────────────
    const { data: existing } = await sb
      .from("nutricion_aplicaciones")
      .select("*")
      .eq("plan_id", plan_id)
      .eq("idempotency_key", idempotency_key)
      .maybeSingle();

    if (existing) {
      return json({ data: existing, cached: true });
    }

    // ── 6. Insertar aplicación ──────────────────────────────
    const insertPayload: Record<string, unknown> = {
      organization_id: plan.organization_id,
      plan_id,
      parcela_id: (await sb.from("nutricion_planes").select("parcela_id").eq("id", plan_id).single()).data?.parcela_id,
      fecha_aplicacion,
      tipo_aplicacion,
      dosis_aplicada_json: dosis_aplicada_json || null,
      evidencias: evidencias || null,
      costo_real: costo_real || null,
      idempotency_key,
      fase_objetivo: fase_objetivo || null,
      producto_aplicado: producto_aplicado || null,
      cantidad_aplicada_kg: cantidad_aplicada_kg || null,
      justificacion_desviacion: notas || null,
      ejecutado_por: userId,
    };

    const { data: inserted, error: insertErr } = await sb
      .from("nutricion_aplicaciones")
      .insert(insertPayload)
      .select()
      .single();

    if (insertErr) {
      return json({ error: "Insert failed", detail: insertErr.message }, 500);
    }

    // ── 7. Recalcular execution_pct ─────────────────────────
    const { data: allApps } = await sb
      .from("nutricion_aplicaciones")
      .select("dosis_aplicada_json")
      .eq("plan_id", plan_id);

    // Sum applied nutrients
    const applied: Record<string, number> = {};
    for (const app of allApps || []) {
      const nutrients = app.dosis_aplicada_json?.nutrientes;
      if (nutrients) {
        for (const [k, v] of Object.entries(nutrients)) {
          applied[k] = (applied[k] || 0) + (Number(v) || 0);
        }
      }
    }

    // Compare against plan recipe
    const demanda = plan.receta_canonica_json?.demanda_final || {};
    const pctByNutrient: Record<string, number> = {};
    for (const [k, v] of Object.entries(demanda)) {
      const target = Number(v) || 0;
      pctByNutrient[k] = target > 0 ? Math.min(100, ((applied[k] || 0) / target) * 100) : 100;
    }

    // Weighted total: N 0.35, K2O 0.35, P2O5 0.15, others 0.15
    const weights: Record<string, number> = {
      N_kg_ha: 0.35,
      K2O_kg_ha: 0.35,
      P2O5_kg_ha: 0.15,
    };
    const nutrientKeys = Object.keys(pctByNutrient);
    const otherKeys = nutrientKeys.filter((k) => !weights[k]);
    const otherWeight = otherKeys.length > 0 ? 0.15 / otherKeys.length : 0;

    let totalPct = 0;
    let totalWeight = 0;
    for (const k of nutrientKeys) {
      const w = weights[k] || otherWeight;
      totalPct += (pctByNutrient[k] || 0) * w;
      totalWeight += w;
    }
    const executionPctTotal = totalWeight > 0 ? Math.round((totalPct / totalWeight) * 100) / 100 : 0;

    // ── 8. Update plan status ───────────────────────────────
    let newEstado = plan.estado;
    if (plan.estado === "generado" || plan.estado === "approved_tecnico") {
      newEstado = "en_ejecucion";
    }
    if (executionPctTotal >= 90) {
      newEstado = "completado";
    }

    await sb
      .from("nutricion_planes")
      .update({
        execution_pct_total: executionPctTotal,
        execution_pct_by_nutrient: pctByNutrient,
        estado: newEstado,
      })
      .eq("id", plan_id);

    // ── 9. Log event ────────────────────────────────────────
    await sb.from("ag_plan_events").insert({
      organization_id: plan.organization_id,
      plan_id,
      event_type: "execution_logged",
      payload_json: {
        aplicacion_id: inserted.id,
        execution_pct_total: executionPctTotal,
        execution_pct_by_nutrient: pctByNutrient,
        new_estado: newEstado,
      },
      created_by: userId,
    });

    // ── 10. Respond ─────────────────────────────────────────
    return json({
      data: inserted,
      execution: {
        pct_total: executionPctTotal,
        pct_by_nutrient: pctByNutrient,
        estado: newEstado,
      },
      cached: false,
    });
  } catch (err) {
    console.error("log_nutrition_execution_v1 error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
