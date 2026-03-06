import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ENGINE_VERSION = "1.0.0";
const RULESET_VERSION = "2026-03-05";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface RequestBody {
  parcela_id: string;
  idempotency_key: string;
  fecha_floracion_principal?: string;
  rendimiento_proyectado_kg_ha?: number;
  analisis_suelo_id?: string | null;
}

interface Bloqueo {
  tipo: string;
  parametro: string;
  valor: number;
  umbral: number;
  accion: string;
}

interface DataQuality {
  missing: string[];
  estimated: string[];
  stale: string[];
}

interface Fraccionamiento {
  numero_aplicacion: number;
  fase_fenologica: string;
  gda_objetivo: number;
  fecha_programada: string | null;
  dosis_n: number;
  dosis_p2o5: number;
  dosis_k2o: number;
  dosis_cao: number;
  dosis_mgo: number;
  dosis_s: number;
  dosis_zn: number;
  dosis_b: number;
  tipo_aplicacion: string;
  producto_sugerido: string | null;
  notas: string | null;
}

// ────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────

function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "number") return Number.isFinite(obj) ? parseFloat(obj.toFixed(2)).toString() : "null";
  if (typeof obj === "string") return JSON.stringify(obj);
  if (typeof obj === "boolean") return obj.toString();
  if (Array.isArray(obj)) return "[" + obj.map(canonicalStringify).join(",") + "]";
  if (typeof obj === "object") {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    const pairs = keys.map((k) => JSON.stringify(k) + ":" + canonicalStringify((obj as Record<string, unknown>)[k]));
    return "{" + pairs.join(",") + "}";
  }
  return String(obj);
}

async function sha256(str: string): Promise<string> {
  const data = new TextEncoder().encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function getZonaAltitudinal(altitud: number): string {
  if (altitud >= 1600) return "muy_alta";
  if (altitud >= 1200) return "alta";
  if (altitud >= 800) return "media";
  return "baja";
}

function jsonOk(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function jsonErr(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ────────────────────────────────────────────────────────────────
// Sub-engines
// ────────────────────────────────────────────────────────────────

// Default extraction coefficients (kg per 1000 kg of green coffee)
const BASE_EXTRACTION = {
  N: 35, P2O5: 8, K2O: 42, CaO: 12, MgO: 5, S: 4, Zn: 0.12, B: 0.08,
};

// Default efficiencies
const DEFAULT_EFFICIENCY = { N: 0.50, P: 0.25, K: 0.60 };

interface EdaphicResult {
  bloqueos: Bloqueo[];
  ajustes_eficiencia: { N: number; P: number; K: number };
  necesidad_encalado_kg_ha: number;
}

function runEdaphicEngine(suelo: Record<string, unknown> | null): EdaphicResult {
  const bloqueos: Bloqueo[] = [];
  const eficiencia = { ...DEFAULT_EFFICIENCY };
  let encalado = 0;

  if (!suelo) {
    return { bloqueos, ajustes_eficiencia: eficiencia, necesidad_encalado_kg_ha: 0 };
  }

  const ph = Number(suelo.ph_agua ?? suelo.ph ?? 0);
  const al = Number(suelo.aluminio_intercambiable ?? suelo.saturacion_al_cic_pct ?? 0);
  const mo = Number(suelo.materia_organica_pct ?? suelo.mo_pct ?? 0);
  const p = Number(suelo.p_disponible ?? suelo.p_ppm ?? 0);
  const k = Number(suelo.k_intercambiable ?? suelo.k_cmol_kg ?? 0);
  const satBases = Number(suelo.saturacion_bases_pct ?? 0);
  const caMg = Number(suelo.relacion_ca_mg ?? 0);
  const needLime = Number(suelo.necesidad_encalado_kg_ha ?? 0);

  if (ph > 0 && ph < 5.0) {
    bloqueos.push({
      tipo: "bloqueo_npk", parametro: "ph_agua", valor: ph,
      umbral: 5.0, accion: "Encalar antes de aplicar NPK. pH muy acido reduce absorcion.",
    });
    eficiencia.N *= 0.70;
    eficiencia.P *= 0.50;
    eficiencia.K *= 0.80;
  }

  if (al > 20) {
    bloqueos.push({
      tipo: "toxicidad_aluminio", parametro: "saturacion_al_cic_pct", valor: al,
      umbral: 20, accion: "Toxicidad de aluminio. Requiere encalado correctivo urgente.",
    });
    eficiencia.P *= 0.40;
  }

  if (mo < 2.0 && mo > 0) {
    eficiencia.N *= 0.85;
  }

  if (p > 0 && p < 5) {
    eficiencia.P *= 0.70;
  }

  encalado = needLime > 0 ? needLime : (ph > 0 && ph < 5.2 ? round2((5.5 - ph) * 1500) : 0);

  return { bloqueos, ajustes_eficiencia: eficiencia, necesidad_encalado_kg_ha: encalado };
}

interface GeneticResult {
  multiplicador_ponderado: number;
  micros_multiplier: number;
  detalle: Array<{ variedad: string; pct: number; multiplicador: number }>;
}

function runGeneticEngine(variedades: Array<Record<string, unknown>>): GeneticResult {
  if (!variedades || variedades.length === 0) {
    return { multiplicador_ponderado: 1.0, micros_multiplier: 1.0, detalle: [] };
  }

  let sumWeightedMult = 0;
  let sumWeightedMicros = 0;
  let sumPct = 0;
  const detalle: GeneticResult["detalle"] = [];

  for (const v of variedades) {
    const pct = Number(v.porcentaje ?? v.pct ?? 100 / variedades.length);
    const mult = Number(v.multiplicador_demanda ?? 1.0);
    const microsMult = Number(v.multiplicador_micronutrientes ?? 1.0);
    const nombre = String(v.nombre_comun ?? v.nombre ?? v.variedad ?? "desconocida");

    sumWeightedMult += mult * (pct / 100);
    sumWeightedMicros += microsMult * (pct / 100);
    sumPct += pct;
    detalle.push({ variedad: nombre, pct, multiplicador: mult });
  }

  const factor = sumPct > 0 ? 100 / sumPct : 1;
  return {
    multiplicador_ponderado: round2(sumWeightedMult * factor),
    micros_multiplier: round2(sumWeightedMicros * factor),
    detalle,
  };
}

interface PhenologicalPhase {
  fase: string;
  gda: number;
  pct_n: number;
  pct_p: number;
  pct_k: number;
  pct_otros: number;
  tipo_aplicacion: string;
}

const DEFAULT_PHASES: PhenologicalPhase[] = [
  { fase: "post_cosecha", gda: 0, pct_n: 0.10, pct_p: 0.20, pct_k: 0.05, pct_otros: 0.15, tipo_aplicacion: "edafica_granular" },
  { fase: "pre_floracion", gda: 600, pct_n: 0.25, pct_p: 0.30, pct_k: 0.15, pct_otros: 0.20, tipo_aplicacion: "edafica_granular" },
  { fase: "cuajado", gda: 1200, pct_n: 0.25, pct_p: 0.25, pct_k: 0.20, pct_otros: 0.25, tipo_aplicacion: "edafica_granular" },
  { fase: "llenado_grano", gda: 2000, pct_n: 0.25, pct_p: 0.15, pct_k: 0.35, pct_otros: 0.25, tipo_aplicacion: "edafica_granular" },
  { fase: "maduracion", gda: 2800, pct_n: 0.15, pct_p: 0.10, pct_k: 0.25, pct_otros: 0.15, tipo_aplicacion: "edafica_granular" },
];

function getAltitudeShift(zona: string): { gda_factor: number; k_shift: number } {
  switch (zona) {
    case "muy_alta": return { gda_factor: 1.25, k_shift: 0.10 };
    case "alta": return { gda_factor: 1.15, k_shift: 0.05 };
    case "media": return { gda_factor: 1.0, k_shift: 0.0 };
    case "baja": return { gda_factor: 0.90, k_shift: -0.05 };
    default: return { gda_factor: 1.0, k_shift: 0.0 };
  }
}

function runPhenologicalEngine(
  zona: string,
  fechaFloracion: string | null,
): { fases: PhenologicalPhase[]; cronograma_extendido: boolean } {
  const shift = getAltitudeShift(zona);
  const cronograma_extendido = shift.gda_factor > 1.0;

  const fases = DEFAULT_PHASES.map((f) => ({
    ...f,
    gda: Math.round(f.gda * shift.gda_factor),
    pct_k: round2(f.pct_k + shift.k_shift),
    pct_n: round2(f.pct_n - shift.k_shift * 0.5),
    pct_otros: round2(f.pct_otros - shift.k_shift * 0.5),
  }));

  return { fases, cronograma_extendido };
}

// ────────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // 1. Validate JWT
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return jsonErr("Missing Authorization header", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const adminClient = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return jsonErr("Invalid JWT", 401);

    // 2. Parse body
    const body: RequestBody = await req.json();
    if (!body.parcela_id) return jsonErr("parcela_id is required");
    if (!body.idempotency_key) return jsonErr("idempotency_key is required");

    // 3. Load context and verify org
    const { data: ctx, error: ctxErr } = await adminClient
      .from("nutricion_parcela_contexto")
      .select("*")
      .eq("parcela_id", body.parcela_id)
      .maybeSingle();

    if (ctxErr || !ctx) return jsonErr("Parcela context not found for parcela_id: " + body.parcela_id, 404);

    // Verify org ownership
    const { data: userOrg } = await adminClient
      .from("profiles")
      .select("organization_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!userOrg?.organization_id || userOrg.organization_id !== ctx.organization_id) {
      return jsonErr("Access denied: parcela belongs to a different organization", 403);
    }

    const orgId = ctx.organization_id as string;

    // 4. Idempotency check
    const { data: existing } = await adminClient
      .from("nutricion_planes")
      .select("*")
      .eq("parcela_id", body.parcela_id)
      .eq("idempotency_key", body.idempotency_key)
      .maybeSingle();

    if (existing) {
      const { data: fraccs } = await adminClient
        .from("nutricion_fraccionamientos")
        .select("*")
        .eq("plan_id", existing.id)
        .order("numero_aplicacion");

      return jsonOk({
        plan: existing,
        fraccionamientos: fraccs ?? [],
        cached: true,
      });
    }

    // 5. Determine calculation mode
    const fechaFloracion = body.fecha_floracion_principal ?? ctx.fecha_floracion_principal ?? null;
    const rendimiento = body.rendimiento_proyectado_kg_ha ?? ctx.rendimiento_proyectado_kg_ha ?? null;
    const analisisSueloId = body.analisis_suelo_id ?? null;

    const modoCalculo = (analisisSueloId && rendimiento && fechaFloracion) ? "completo" : "heuristico";

    // 6. Load soil analysis if provided
    let suelo: Record<string, unknown> | null = null;
    if (analisisSueloId) {
      const { data: sueloData } = await adminClient
        .from("nutricion_analisis_suelo")
        .select("*")
        .eq("id", analisisSueloId)
        .maybeSingle();
      suelo = sueloData;
    }

    // 7. Load varieties
    const ctxVariedades = ctx.variedades as string | null;
    let variedadesList: Array<Record<string, unknown>> = [];

    if (ctxVariedades) {
      // variedades is stored as text (comma-separated or JSON array)
      let varNames: string[] = [];
      try {
        varNames = JSON.parse(ctxVariedades);
      } catch {
        varNames = ctxVariedades.split(",").map((s: string) => s.trim()).filter(Boolean);
      }

      if (varNames.length > 0) {
        const { data: vData } = await adminClient
          .from("nutricion_variedades")
          .select("*")
          .in("nombre_comun", varNames);

        if (vData && vData.length > 0) {
          variedadesList = vData.map((v: Record<string, unknown>, i: number) => ({
            ...v,
            porcentaje: 100 / vData.length,
          }));
        }
      }
    }

    // 8. Context values
    const altitud = Number(ctx.altitud_msnm ?? 1200);
    const zona = getZonaAltitudinal(altitud);
    const edadPromedio = Number(ctx.edad_promedio_anios ?? 8);
    const yieldUsed = rendimiento ?? 1200; // default 1200 kg/ha green coffee

    // 9. Run sub-engines
    const edafic = runEdaphicEngine(suelo);
    const genetic = runGeneticEngine(variedadesList);
    const pheno = runPhenologicalEngine(zona, fechaFloracion);

    // 10. Calculate nutrient demands
    const yieldFactor = yieldUsed / 1000; // extraction per 1000 kg
    const varMult = genetic.multiplicador_ponderado;
    const microsMult = genetic.micros_multiplier;

    // Age adjustment: young plants need less, old need more maintenance
    const edadAjuste = edadPromedio < 4 ? 0.70 : edadPromedio > 20 ? 1.15 : 1.0;

    const demanda = {
      N: round2(BASE_EXTRACTION.N * yieldFactor * varMult * edadAjuste / edafic.ajustes_eficiencia.N),
      P2O5: round2(BASE_EXTRACTION.P2O5 * yieldFactor * varMult * edadAjuste / edafic.ajustes_eficiencia.P),
      K2O: round2(BASE_EXTRACTION.K2O * yieldFactor * varMult * edadAjuste / edafic.ajustes_eficiencia.K),
      CaO: round2(BASE_EXTRACTION.CaO * yieldFactor * varMult * edadAjuste),
      MgO: round2(BASE_EXTRACTION.MgO * yieldFactor * varMult * edadAjuste),
      S: round2(BASE_EXTRACTION.S * yieldFactor * varMult * edadAjuste),
      Zn: round2(BASE_EXTRACTION.Zn * yieldFactor * microsMult * edadAjuste),
      B: round2(BASE_EXTRACTION.B * yieldFactor * microsMult * edadAjuste),
    };

    // 11. Data quality
    const dataQuality: DataQuality = { missing: [], estimated: [], stale: [] };
    if (!analisisSueloId) dataQuality.missing.push("analisis_suelo");
    if (!rendimiento) { dataQuality.estimated.push("rendimiento_proyectado"); }
    if (!fechaFloracion) dataQuality.estimated.push("fecha_floracion");
    if (variedadesList.length === 0) dataQuality.estimated.push("variedades");
    if (suelo) {
      const fechaAnalisis = suelo.fecha_analisis as string | undefined;
      if (fechaAnalisis) {
        const ageMonths = (Date.now() - new Date(fechaAnalisis).getTime()) / (30 * 24 * 60 * 60 * 1000);
        if (ageMonths > 18) dataQuality.stale.push("analisis_suelo");
      }
    }

    const nivelConfianza = modoCalculo === "completo" && dataQuality.missing.length === 0 && dataQuality.stale.length === 0
      ? "alto"
      : modoCalculo === "heuristico" ? "bajo" : "medio";

    // 12. Build canonical recipe
    const receta = {
      demanda,
      bloqueos: edafic.bloqueos,
      eficiencia: edafic.ajustes_eficiencia,
      encalado_kg_ha: edafic.necesidad_encalado_kg_ha,
      multiplicador_varietal: genetic.multiplicador_ponderado,
      micros_multiplier: genetic.micros_multiplier,
      zona_altitudinal: zona,
      cronograma_extendido: pheno.cronograma_extendido,
      yield_usado: yieldUsed,
      edad_ajuste: edadAjuste,
    };

    const recetaCanonica = canonicalStringify(receta);
    const hashReceta = await sha256(recetaCanonica);

    // 13. Build explain
    const explain = {
      engine_version: ENGINE_VERSION,
      ruleset_version: RULESET_VERSION,
      modo_calculo: modoCalculo,
      inputs: {
        parcela_id: body.parcela_id,
        altitud_msnm: altitud,
        zona_altitudinal: zona,
        edad_promedio: edadPromedio,
        yield_proyectado: yieldUsed,
        fecha_floracion: fechaFloracion,
        analisis_suelo_id: analisisSueloId,
        variedades_count: variedadesList.length,
      },
      sub_engines: {
        edafico: { bloqueos_count: edafic.bloqueos.length, encalado: edafic.necesidad_encalado_kg_ha, eficiencia: edafic.ajustes_eficiencia },
        genetico: genetic.detalle,
        fenologico: { fases_count: pheno.fases.length, cronograma_extendido: pheno.cronograma_extendido },
      },
      data_quality: dataQuality,
      nivel_confianza: nivelConfianza,
    };

    // 14. Persist plan
    const planRow: Record<string, unknown> = {
      organization_id: orgId,
      parcela_id: body.parcela_id,
      analisis_suelo_id: analisisSueloId,
      ciclo: new Date().getFullYear() + "-" + String(new Date().getMonth() + 1).padStart(2, "0"),
      yield_usado_kg_ha: yieldUsed,
      fecha_floracion: fechaFloracion,
      es_heuristico: modoCalculo === "heuristico",
      nivel_confianza: nivelConfianza,
      estado: edafic.bloqueos.length > 0 ? "condicionado" : "borrador",
      es_condicionado: edafic.bloqueos.length > 0,
      bloqueos: edafic.bloqueos,
      multiplicador_varietal_ponderado: genetic.multiplicador_ponderado,
      eficiencia_n: edafic.ajustes_eficiencia.N,
      eficiencia_p: edafic.ajustes_eficiencia.P,
      eficiencia_k: edafic.ajustes_eficiencia.K,
      ajuste_suelo: suelo ? "con_analisis" : "sin_analisis",
      ajuste_altitud: zona,
      ajuste_edad: edadAjuste,
      ajuste_fecha: fechaFloracion ? "con_fecha" : "estimada",
      demanda_n_kg_ha: demanda.N,
      demanda_p2o5_kg_ha: demanda.P2O5,
      demanda_k2o_kg_ha: demanda.K2O,
      demanda_cao_kg_ha: demanda.CaO,
      demanda_mgo_kg_ha: demanda.MgO,
      demanda_s_kg_ha: demanda.S,
      demanda_zn_kg_ha: demanda.Zn,
      demanda_b_kg_ha: demanda.B,
      version_reglas: RULESET_VERSION,
      explicaciones: explain,
      flags_riesgo: edafic.bloqueos.map((b) => b.tipo),
      confianza_detalle: dataQuality,
    };

    // Add new columns only if they exist (dynamic insert)
    const newCols: Record<string, unknown> = {
      idempotency_key: body.idempotency_key,
      hash_receta: hashReceta,
      receta_canonica_json: receta,
      explain_json: explain,
      modo_calculo: modoCalculo,
      data_quality_json: dataQuality,
      engine_version: ENGINE_VERSION,
      ruleset_version: RULESET_VERSION,
      created_by: user.id,
    };
    Object.assign(planRow, newCols);

    const { data: plan, error: planErr } = await adminClient
      .from("nutricion_planes")
      .insert(planRow)
      .select("*")
      .single();

    if (planErr) {
      // If new columns don't exist, retry without them
      if (planErr.message?.includes("column") && planErr.message?.includes("does not exist")) {
        for (const k of Object.keys(newCols)) delete planRow[k];
        const { data: plan2, error: planErr2 } = await adminClient
          .from("nutricion_planes")
          .insert(planRow)
          .select("*")
          .single();
        if (planErr2) return jsonErr("Failed to persist plan: " + planErr2.message, 500);
        return await buildResponse(adminClient, plan2, pheno, demanda, orgId);
      }
      return jsonErr("Failed to persist plan: " + planErr.message, 500);
    }

    return await buildResponse(adminClient, plan, pheno, demanda, orgId);
  } catch (err) {
    console.error("Unhandled error:", err);
    return jsonErr("Internal error: " + (err instanceof Error ? err.message : String(err)), 500);
  }
});

async function buildResponse(
  adminClient: SupabaseClient,
  plan: Record<string, unknown>,
  pheno: { fases: PhenologicalPhase[] },
  demanda: Record<string, number>,
  orgId: string,
): Promise<Response> {
  // Generate fraccionamientos
  const fraccRows: Array<Record<string, unknown>> = pheno.fases.map((f, i) => ({
    organization_id: orgId,
    plan_id: plan.id,
    numero_aplicacion: i + 1,
    fase_fenologica: f.fase,
    gda_objetivo: f.gda,
    fecha_programada: null,
    dosis_n: round2(demanda.N * f.pct_n),
    dosis_p2o5: round2(demanda.P2O5 * f.pct_p),
    dosis_k2o: round2(demanda.K2O * f.pct_k),
    dosis_cao: round2(demanda.CaO * f.pct_otros),
    dosis_mgo: round2(demanda.MgO * f.pct_otros),
    dosis_s: round2(demanda.S * f.pct_otros),
    dosis_zn: round2(demanda.Zn * f.pct_otros),
    dosis_b: round2(demanda.B * f.pct_otros),
    tipo_aplicacion: f.tipo_aplicacion,
    producto_sugerido: null,
    notas: null,
  }));

  const { data: fraccs, error: fraccErr } = await adminClient
    .from("nutricion_fraccionamientos")
    .insert(fraccRows)
    .select("*");

  if (fraccErr) console.error("Fraccionamientos insert error:", fraccErr.message);

  return jsonOk({
    plan,
    fraccionamientos: fraccs ?? [],
    cached: false,
  });
}
