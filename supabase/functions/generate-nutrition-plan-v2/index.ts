import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

// ────────────────────────────────────────────────────────────────
// Constants
// ────────────────────────────────────────────────────────────────

const ENGINE_VERSION = "2.0.0";
const RULESET_VERSION = "2026-03-07";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NUTRIENTS = ["N", "P2O5", "K2O", "CaO", "MgO", "S", "Zn", "B", "Mn"] as const;
type NutrientCode = typeof NUTRIENTS[number];

// Base extraction: kg nutrient removed per ton of green coffee harvested
const BASE_EXTRACTION: Record<NutrientCode, number> = {
  N: 35, P2O5: 8, K2O: 42, CaO: 12, MgO: 5, S: 4, Zn: 0.12, B: 0.08, Mn: 0.06,
};

const DEFAULT_EFFICIENCY: Record<string, number> = {
  N: 0.50, P2O5: 0.25, K2O: 0.60, CaO: 0.70, MgO: 0.65, S: 0.60, Zn: 0.30, B: 0.30, Mn: 0.35,
};

const SCENARIO_MULTIPLIER: Record<string, number> = {
  conservador: 0.85, esperado: 1.0, intensivo: 1.15,
};

// ────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────

interface PlanRequest {
  org_id: string;
  plot_id: string;
  ruleset_id?: string;
  yield_mode: "auto" | "manual";
  yield_manual_ton?: number;
  scenario: "conservador" | "esperado" | "intensivo";
  allow_heuristics: boolean;
  user_id: string;
  soil_analysis_id?: string;
  yield_estimate_id?: string;
  target_harvest_date?: string;
  override_inputs?: { coffee_price_per_kg?: number; labor_cost_per_day?: number };
}

interface Flag { code: string; severity: string; message: string }
interface NutrientDetail {
  demanda_base: number; ajustes: { altitud: number; edad: number; variedad: number; estres: number };
  aporte_suelo: number; aporte_organico: number; eficiencia: number;
  dosis_final: number; indice_suficiencia: number;
}
interface FertProduct { nombre: string; tipo: string; cantidad_kg_ha: number; cantidad_total: number; costo_usd: number | null }
interface CronoEntry {
  fase: string; numero_aplicacion: number; fecha_programada: string | null;
  nutrientes: Record<string, number>; tipo_aplicacion: string; mano_de_obra_jornales: number;
}

// ────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────

const r2 = (n: number) => Math.round(n * 100) / 100;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

function canonicalStringify(obj: unknown): string {
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "number") return Number.isFinite(obj) ? parseFloat(obj.toFixed(2)).toString() : "null";
  if (typeof obj === "string") return JSON.stringify(obj);
  if (typeof obj === "boolean") return obj.toString();
  if (Array.isArray(obj)) return "[" + obj.map(canonicalStringify).join(",") + "]";
  if (typeof obj === "object") {
    const keys = Object.keys(obj as Record<string, unknown>).sort();
    return "{" + keys.map(k => JSON.stringify(k) + ":" + canonicalStringify((obj as Record<string, unknown>)[k])).join(",") + "}";
  }
  return String(obj);
}

async function sha256(str: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function ok(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}
function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// ────────────────────────────────────────────────────────────────
// Coefficient calculators (inline, no dependency on SQL RPCs)
// ────────────────────────────────────────────────────────────────

function getAltitudeCoefficient(altitud: number): number {
  if (altitud >= 1600) return 1.20;
  if (altitud >= 1200) return 1.10;
  if (altitud >= 800)  return 1.00;
  return 0.90;
}

function getAgeCoefficient(edad: number): number {
  if (edad < 3) return 0.60;
  if (edad < 5) return 0.80;
  if (edad <= 15) return 1.00;
  if (edad <= 25) return 1.10;
  return 1.15;
}

function getVarietalCoefficient(variedades: Array<Record<string, unknown>>): { mult: number; micros: number } {
  if (!variedades.length) return { mult: 1.0, micros: 1.0 };
  let wMult = 0, wMicros = 0, wSum = 0;
  for (const v of variedades) {
    const pct = Number(v.porcentaje ?? 100 / variedades.length);
    wMult += Number(v.multiplicador_demanda ?? 1.0) * pct;
    wMicros += Number(v.multiplicador_micronutrientes ?? 1.0) * pct;
    wSum += pct;
  }
  const f = wSum > 0 ? 1 / wSum : 1;
  return { mult: r2(wMult * f), micros: r2(wMicros * f) };
}

function getStressCoefficient(ctx: Record<string, unknown>): number {
  let c = 1.0;
  if (ctx.deficit_hidrico_actual) c *= 0.90;
  const reno = Number(ctx.porcentaje_renovacion ?? 0);
  if (reno > 30) c *= 0.85;
  return r2(c);
}

function getTextureEfficiencyFactor(textura: string | null): number {
  if (!textura) return 1.0;
  const t = textura.toLowerCase();
  if (t.includes("aren")) return 1.15;
  if (t.includes("arcill")) return 0.90;
  return 1.0;
}

// ────────────────────────────────────────────────────────────────
// Soil supply estimation
// ────────────────────────────────────────────────────────────────

function estimateSoilSupply(suelo: Record<string, unknown> | null): Record<NutrientCode, number> {
  const supply: Record<string, number> = {};
  for (const n of NUTRIENTS) supply[n] = 0;
  if (!suelo) return supply as Record<NutrientCode, number>;

  const mo = Number(suelo.materia_organica_pct ?? 0);
  supply.N = r2(mo * 12);
  supply.P2O5 = r2(Number(suelo.p_disponible ?? 0) * 0.15);
  supply.K2O = r2(Number(suelo.k_intercambiable ?? 0) * 8.0);
  supply.CaO = r2(Number(suelo.ca_intercambiable ?? 0) * 3.5);
  supply.MgO = r2(Number(suelo.mg_intercambiable ?? 0) * 2.5);
  supply.S = r2(Number(suelo.azufre ?? 0) * 0.5);
  supply.Zn = r2(Number(suelo.zinc ?? 0) * 0.005);
  supply.B = r2(Number(suelo.boro ?? 0) * 0.003);
  supply.Mn = r2(Number(suelo.manganeso ?? 0) * 0.004);
  return supply as Record<NutrientCode, number>;
}

function estimateOrganicSupply(ctx: Record<string, unknown>): Record<NutrientCode, number> {
  const supply: Record<string, number> = {};
  for (const n of NUTRIENTS) supply[n] = 0;
  const manejo = String(ctx.sistema_manejo ?? "convencional");
  if (manejo === "organico" || manejo === "agroecologico") {
    supply.N = 8; supply.P2O5 = 2; supply.K2O = 5; supply.S = 1;
  }
  return supply as Record<NutrientCode, number>;
}

// ────────────────────────────────────────────────────────────────
// Phenological calendar
// ────────────────────────────────────────────────────────────────

interface PhaseSpec { fase: string; pct: Record<NutrientCode, number>; tipo: string; jornales: number }

const PHASES: PhaseSpec[] = [
  { fase: "crecimiento_vegetativo", pct: { N:.30, P2O5:.35, K2O:.15, CaO:.25, MgO:.25, S:.25, Zn:.30, B:.30, Mn:.25 }, tipo: "edafica", jornales: 1.5 },
  { fase: "cabeza_alfiler",         pct: { N:.25, P2O5:.30, K2O:.20, CaO:.25, MgO:.25, S:.25, Zn:.25, B:.25, Mn:.25 }, tipo: "edafica", jornales: 1.5 },
  { fase: "expansion_rapida",       pct: { N:.25, P2O5:.20, K2O:.30, CaO:.25, MgO:.25, S:.25, Zn:.25, B:.25, Mn:.25 }, tipo: "edafica", jornales: 1.5 },
  { fase: "llenado_grano",          pct: { N:.20, P2O5:.15, K2O:.35, CaO:.25, MgO:.25, S:.25, Zn:.20, B:.20, Mn:.25 }, tipo: "edafica", jornales: 1.0 },
];

// ────────────────────────────────────────────────────────────────
// Default fertilizer products (fallback when ag_fertilizers missing)
// ────────────────────────────────────────────────────────────────

const FALLBACK_PRODUCTS: Array<{ nombre: string; tipo: string; contenido: Partial<Record<NutrientCode, number>>; costo_kg_usd: number }> = [
  { nombre: "Urea (46-0-0)", tipo: "sintetico", contenido: { N: 0.46 }, costo_kg_usd: 0.55 },
  { nombre: "DAP (18-46-0)", tipo: "sintetico", contenido: { N: 0.18, P2O5: 0.46 }, costo_kg_usd: 0.70 },
  { nombre: "KCl (0-0-60)", tipo: "sintetico", contenido: { K2O: 0.60 }, costo_kg_usd: 0.50 },
  { nombre: "Sulfato de Mg", tipo: "sintetico", contenido: { MgO: 0.16, S: 0.13 }, costo_kg_usd: 0.40 },
  { nombre: "Cal dolomitica", tipo: "enmienda", contenido: { CaO: 0.30, MgO: 0.20 }, costo_kg_usd: 0.08 },
  { nombre: "Sulfato de Zn", tipo: "micronutriente", contenido: { Zn: 0.23, S: 0.11 }, costo_kg_usd: 1.20 },
  { nombre: "Borax", tipo: "micronutriente", contenido: { B: 0.11 }, costo_kg_usd: 0.90 },
];

// ────────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const trace: string[] = [];
  const flags: Flag[] = [];
  const t0 = Date.now();

  try {
    // ── 1. Auth ──────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) return err("Missing Authorization header", 401);

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const userClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return err("Invalid JWT", 401);
    trace.push(`auth: user=${user.id}`);

    // ── 2. Parse & validate ─────────────────────────────────
    const body: PlanRequest = await req.json();
    if (!body.org_id) return err("org_id required");
    if (!body.plot_id) return err("plot_id required");
    if (!body.yield_mode) body.yield_mode = "auto";
    if (!body.scenario) body.scenario = "esperado";
    if (body.allow_heuristics === undefined) body.allow_heuristics = true;
    body.user_id = user.id;

    // Verify user belongs to org
    const { data: profile } = await admin.from("profiles").select("organization_id").eq("user_id", user.id).maybeSingle();
    if (!profile?.organization_id || profile.organization_id !== body.org_id) {
      return err("Access denied: user does not belong to org_id", 403);
    }
    trace.push(`org: ${body.org_id}`);

    // ── 3. Idempotency ──────────────────────────────────────
    const requestCanonical = canonicalStringify({
      org_id: body.org_id, plot_id: body.plot_id,
      yield_mode: body.yield_mode, yield_manual_ton: body.yield_manual_ton ?? null,
      scenario: body.scenario, soil_analysis_id: body.soil_analysis_id ?? null,
    });
    const requestHash = await sha256(requestCanonical);

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await admin.from("nutricion_planes")
      .select("*").eq("parcela_id", body.plot_id)
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (cached) {
      const cachedExplain = cached.explicaciones as Record<string, unknown> | null;
      if (cachedExplain && (cachedExplain as any).request_hash === requestHash) {
        trace.push("idempotency: cache hit");
        const { data: fraccs } = await admin.from("nutricion_fraccionamientos")
          .select("*").eq("plan_id", cached.id).order("numero_aplicacion");
        return ok({ plan_id: cached.id, cached: true, hash_receta: requestHash, engine_version: ENGINE_VERSION,
          modo_calculo: cached.es_heuristico ? "heuristico" : "completo",
          nivel_confianza: cached.nivel_confianza, plan: cached, fraccionamientos: fraccs ?? [], explain_trace: trace });
      }
    }
    trace.push("idempotency: miss");

    // ── 4. Load plot context ────────────────────────────────
    const { data: parcela } = await admin.from("parcelas").select("*").eq("id", body.plot_id).maybeSingle();
    if (!parcela) return err("Parcela not found", 404);

    const { data: ctx } = await admin.from("nutricion_parcela_contexto")
      .select("*").eq("parcela_id", body.plot_id).order("created_at", { ascending: false }).limit(1).maybeSingle();

    const altitud = Number(ctx?.altitud_msnm ?? parcela.altitud_msnm ?? 1200);
    const edad = Number(ctx?.edad_promedio_anios ?? 8);
    const densidad = Number(ctx?.densidad_plantas_ha ?? 5000);
    const areaHa = Number(ctx?.area_ha ?? parcela.area_hectareas ?? 1);
    const textura = (ctx?.textura ?? null) as string | null;
    trace.push(`plot: altitud=${altitud} edad=${edad} densidad=${densidad} area=${areaHa}`);

    // Missing data tracking
    const missing: string[] = [];

    // ── 5. Load soil analysis ───────────────────────────────
    let suelo: Record<string, unknown> | null = null;
    if (body.soil_analysis_id) {
      const { data } = await admin.from("nutricion_analisis_suelo").select("*").eq("id", body.soil_analysis_id).maybeSingle();
      suelo = data;
    }
    if (!suelo) {
      const { data } = await admin.from("nutricion_analisis_suelo")
        .select("*").eq("parcela_id", body.plot_id).order("fecha_analisis", { ascending: false }).limit(1).maybeSingle();
      suelo = data;
    }
    if (!suelo) {
      missing.push("soil_analysis");
      if (!body.allow_heuristics) return err("No soil analysis found and heuristics not allowed", 422);
      flags.push({ code: "NO_SOIL", severity: "warning", message: "Sin analisis de suelo. Usando heuristicas." });
    }
    trace.push(`soil: ${suelo ? "loaded" : "heuristic"}`);

    // ── 6. Load foliar (optional) ───────────────────────────
    const { data: foliar } = await admin.from("nutricion_analisis_foliar")
      .select("*").eq("parcela_id", body.plot_id).order("fecha_muestreo", { ascending: false }).limit(1).maybeSingle();
    if (!foliar) missing.push("foliar_analysis");

    // ── 7. Load varieties ───────────────────────────────────
    let variedadesList: Array<Record<string, unknown>> = [];
    const ctxVar = ctx?.variedades;
    if (ctxVar) {
      let names: string[] = [];
      if (Array.isArray(ctxVar)) names = ctxVar;
      else if (typeof ctxVar === "string") {
        try { names = JSON.parse(ctxVar); } catch { names = ctxVar.split(",").map((s: string) => s.trim()).filter(Boolean); }
      }
      if (names.length) {
        const { data: vd } = await admin.from("nutricion_variedades").select("*").in("nombre_comun", names);
        variedadesList = (vd ?? []).map((v: Record<string, unknown>) => ({ ...v, porcentaje: 100 / (vd?.length ?? 1) }));
      }
    }
    if (!variedadesList.length) {
      if (parcela.variedad_principal) {
        const { data: vSingle } = await admin.from("nutricion_variedades")
          .select("*").eq("nombre_comun", parcela.variedad_principal).maybeSingle();
        if (vSingle) variedadesList = [{ ...vSingle, porcentaje: 100 }];
      }
    }
    if (!variedadesList.length) missing.push("varietal_data");
    trace.push(`varieties: ${variedadesList.length} loaded`);

    // ── 8. Yield target ─────────────────────────────────────
    let yieldTonHa: number;
    let yieldSource: string;
    if (body.yield_mode === "manual" && body.yield_manual_ton) {
      yieldTonHa = body.yield_manual_ton;
      yieldSource = "manual";
    } else if (ctx?.rendimiento_proyectado_kg_ha) {
      yieldTonHa = Number(ctx.rendimiento_proyectado_kg_ha) / 1000;
      yieldSource = "contexto";
    } else {
      yieldTonHa = 1.2;
      yieldSource = "default_heuristic";
      missing.push("yield_estimate");
    }
    yieldTonHa *= SCENARIO_MULTIPLIER[body.scenario] ?? 1.0;
    const yieldInterval = r2(yieldTonHa * 0.15);
    trace.push(`yield: ${yieldTonHa} ton/ha (${yieldSource}, scenario=${body.scenario})`);

    // ── 9. Coefficients ─────────────────────────────────────
    const coefAlt = getAltitudeCoefficient(altitud);
    const coefEdad = getAgeCoefficient(edad);
    const { mult: coefVar, micros: coefMicros } = getVarietalCoefficient(variedadesList);
    const coefEstres = getStressCoefficient(ctx ?? {});
    const texFactor = getTextureEfficiencyFactor(textura);
    trace.push(`coefs: alt=${coefAlt} age=${coefEdad} var=${coefVar} stress=${coefEstres} tex=${texFactor}`);

    // ── 10. Soil supply + organic supply ────────────────────
    const soilSupply = estimateSoilSupply(suelo);
    const organicSupply = estimateOrganicSupply(ctx ?? {});

    // ── 11. Nutrient demand calculation ─────────────────────
    const modoCalculo = missing.length === 0 ? "completo" : "heuristico";
    const demanda: Record<string, NutrientDetail> = {};
    let minSufIdx = Infinity;
    let limitingNutrient: { code: string; nombre: string; indice: number; impacto: string } | null = null;

    // Load ruleset limits (try ag_rulesets, fallback to hardcoded)
    let maxLimits: Record<string, number> = { N: 300, P2O5: 150, K2O: 250, CaO: 500, MgO: 100, S: 60, Zn: 15, B: 5, Mn: 10 };
    const { data: ruleset } = await admin.from("ag_rulesets")
      .select("*").limit(1).maybeSingle();
    if (ruleset?.parametros) {
      const params = ruleset.parametros as Record<string, unknown>;
      if (params.max_n_kg_ha) maxLimits.N = Number(params.max_n_kg_ha);
      if (params.max_p_kg_ha) maxLimits.P2O5 = Number(params.max_p_kg_ha);
      if (params.max_k_kg_ha) maxLimits.K2O = Number(params.max_k_kg_ha);
    }

    const restriccionesAplicadas: string[] = [];

    for (const nut of NUTRIENTS) {
      const isMicro = ["Zn", "B", "Mn"].includes(nut);
      const base = r2(BASE_EXTRACTION[nut] * yieldTonHa);
      const varMultForNut = isMicro ? coefMicros : coefVar;

      const ajustada = r2(base * coefAlt * coefEdad * varMultForNut * coefEstres);
      const aporteSuelo = soilSupply[nut];
      const aporteOrg = organicSupply[nut];
      const eficiencia = DEFAULT_EFFICIENCY[nut] ?? 0.50;

      let dosisNeta = Math.max(0, ajustada - aporteSuelo - aporteOrg) / eficiencia;
      let dosisFinal = r2(dosisNeta * texFactor);

      // Apply ruleset limits
      const limit = maxLimits[nut];
      if (limit && dosisFinal > limit) {
        dosisFinal = limit;
        restriccionesAplicadas.push(`${nut} capped at ${limit} kg/ha by ruleset`);
      }

      const sufIdx = ajustada > 0 ? r2((aporteSuelo + aporteOrg) / ajustada) : 1.0;
      if (sufIdx < minSufIdx) {
        minSufIdx = sufIdx;
        const nombreMap: Record<string, string> = {
          N: "Nitrogeno", P2O5: "Fosforo", K2O: "Potasio", CaO: "Calcio",
          MgO: "Magnesio", S: "Azufre", Zn: "Zinc", B: "Boro", Mn: "Manganeso",
        };
        const impacto = sufIdx < 0.3 ? "critico" : sufIdx < 0.5 ? "limitante" : "moderado";
        limitingNutrient = { code: nut, nombre: nombreMap[nut] ?? nut, indice: sufIdx, impacto };
      }

      demanda[nut] = {
        demanda_base: base,
        ajustes: { altitud: coefAlt, edad: coefEdad, variedad: varMultForNut, estres: coefEstres },
        aporte_suelo: aporteSuelo,
        aporte_organico: aporteOrg,
        eficiencia,
        dosis_final: dosisFinal,
        indice_suficiencia: sufIdx,
      };
    }
    trace.push(`demand: computed for ${NUTRIENTS.length} nutrients, limiting=${limitingNutrient?.code ?? "none"}`);

    // ── 12. Soil blockages ──────────────────────────────────
    if (suelo) {
      const ph = Number(suelo.ph_agua ?? 0);
      const al = Number(suelo.saturacion_al_cic_pct ?? Number(suelo.aluminio_intercambiable ?? 0));
      if (ph > 0 && ph < 5.0) {
        flags.push({ code: "LOW_PH", severity: "critical", message: `pH ${ph} < 5.0. Encalado requerido antes de fertilizar.` });
      }
      if (al > 20) {
        flags.push({ code: "HIGH_AL", severity: "critical", message: `Saturacion Al ${al}% > 20%. Toxicidad aluminio.` });
      }
    }

    // ── 13. Convert to fertilizer products ──────────────────
    const fertilizantes: FertProduct[] = [];
    const pendingNutrients = new Map<string, number>();
    for (const nut of NUTRIENTS) pendingNutrients.set(nut, demanda[nut].dosis_final);

    for (const prod of FALLBACK_PRODUCTS) {
      let bestNut = "";
      let bestNeed = 0;
      for (const [nut, fraction] of Object.entries(prod.contenido)) {
        const need = pendingNutrients.get(nut) ?? 0;
        if (need > bestNeed) { bestNut = nut; bestNeed = need; }
      }
      if (bestNeed <= 0.01) continue;

      const fraction = prod.contenido[bestNut as NutrientCode] ?? 0;
      if (fraction <= 0) continue;
      const kgHa = r2(bestNeed / fraction);
      const kgTotal = r2(kgHa * areaHa);

      for (const [nut, frac] of Object.entries(prod.contenido)) {
        const supplied = kgHa * (frac ?? 0);
        pendingNutrients.set(nut, Math.max(0, (pendingNutrients.get(nut) ?? 0) - supplied));
      }

      fertilizantes.push({
        nombre: prod.nombre, tipo: prod.tipo,
        cantidad_kg_ha: kgHa, cantidad_total: kgTotal,
        costo_usd: r2(kgTotal * prod.costo_kg_usd),
      });
    }
    trace.push(`products: ${fertilizantes.length} selected`);

    // ── 14. Calendar ────────────────────────────────────────
    const cronograma: CronoEntry[] = PHASES.map((phase, i) => {
      const nutrientes: Record<string, number> = {};
      for (const nut of NUTRIENTS) {
        nutrientes[nut] = r2(demanda[nut].dosis_final * (phase.pct[nut] ?? 0.25));
      }
      return {
        fase: phase.fase, numero_aplicacion: i + 1,
        fecha_programada: body.target_harvest_date ? estimatePhaseDate(body.target_harvest_date, i) : null,
        nutrientes, tipo_aplicacion: phase.tipo,
        mano_de_obra_jornales: phase.jornales,
      };
    });
    trace.push(`calendar: ${cronograma.length} applications`);

    // ── 15. Economics ───────────────────────────────────────
    const costoFert = r2(fertilizantes.reduce((s, f) => s + (f.costo_usd ?? 0), 0));
    const costoMO = r2(cronograma.reduce((s, c) => s + c.mano_de_obra_jornales, 0) * (body.override_inputs?.labor_cost_per_day ?? 15));
    const costoTotal = r2(costoFert + costoMO);
    const coffeePrice = body.override_inputs?.coffee_price_per_kg ?? 3.5;
    const ingresoEstimado = r2(yieldTonHa * 1000 * coffeePrice * areaHa);
    const roi = ingresoEstimado > 0 ? r2((ingresoEstimado - costoTotal) / costoTotal) : null;

    // ── 16. Confidence ──────────────────────────────────────
    const nivelConfianza = missing.length === 0 ? "alta" : missing.length <= 2 ? "media" : "baja";
    const completeness = `${Math.round(((NUTRIENTS.length * 4 - missing.length * 4) / (NUTRIENTS.length * 4)) * 100)}%`;

    // ── 17. Build canonical + hash ──────────────────────────
    const planJson = { demanda, fertilizantes, cronograma, restriccionesAplicadas, flags };
    const hashReceta = await sha256(canonicalStringify(planJson));
    trace.push(`hash: ${hashReceta.slice(0, 12)}...`);

    // ── 18. Persist ─────────────────────────────────────────
    const planRow: Record<string, unknown> = {
      organization_id: body.org_id,
      parcela_id: body.plot_id,
      analisis_suelo_id: body.soil_analysis_id ?? (suelo as any)?.id ?? null,
      ciclo: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      yield_usado_kg_ha: r2(yieldTonHa * 1000),
      fecha_floracion: ctx?.fecha_floracion_principal ?? null,
      es_heuristico: modoCalculo === "heuristico",
      es_condicionado: flags.some(f => f.severity === "critical"),
      nivel_confianza: nivelConfianza === "alta" ? "alto" : nivelConfianza === "media" ? "medio" : "bajo",
      estado: "generado",
      multiplicador_varietal_ponderado: coefVar,
      eficiencia_n: DEFAULT_EFFICIENCY.N,
      eficiencia_p: DEFAULT_EFFICIENCY.P2O5,
      eficiencia_k: DEFAULT_EFFICIENCY.K2O,
      ajuste_altitud: coefAlt,
      ajuste_edad: coefEdad,
      ajuste_suelo: suelo ? 1.0 : 0.0,
      demanda_n_kg_ha: demanda.N.dosis_final,
      demanda_p2o5_kg_ha: demanda.P2O5.dosis_final,
      demanda_k2o_kg_ha: demanda.K2O.dosis_final,
      demanda_cao_kg_ha: demanda.CaO.dosis_final,
      demanda_mgo_kg_ha: demanda.MgO.dosis_final,
      demanda_s_kg_ha: demanda.S.dosis_final,
      demanda_zn_kg_ha: demanda.Zn.dosis_final,
      demanda_b_kg_ha: demanda.B.dosis_final,
      demanda_mn_kg_ha: demanda.Mn.dosis_final,
      costo_estimado_total: costoTotal,
      version_reglas: RULESET_VERSION,
      explicaciones: { request_hash: requestHash, trace, engine_version: ENGINE_VERSION },
      flags_riesgo: flags,
      confianza_detalle: { completeness, missing },
      bloqueos: flags.filter(f => f.severity === "critical"),
    };

    const { data: plan, error: planErr } = await admin.from("nutricion_planes")
      .insert(planRow).select("id").single();
    if (planErr) return err("Failed to persist plan: " + planErr.message, 500);
    trace.push(`persisted: plan_id=${plan.id}`);

    // Fraccionamientos
    const fraccRows = cronograma.map((c, i) => ({
      organization_id: body.org_id,
      plan_id: plan.id,
      numero_aplicacion: i + 1,
      fase_fenologica: c.fase,
      gda_objetivo: (i + 1) * 700,
      fecha_programada: c.fecha_programada,
      dosis_n: c.nutrientes.N ?? 0,
      dosis_p2o5: c.nutrientes.P2O5 ?? 0,
      dosis_k2o: c.nutrientes.K2O ?? 0,
      dosis_cao: c.nutrientes.CaO ?? 0,
      dosis_mgo: c.nutrientes.MgO ?? 0,
      dosis_s: c.nutrientes.S ?? 0,
      dosis_zn: c.nutrientes.Zn ?? 0,
      dosis_b: c.nutrientes.B ?? 0,
      tipo_aplicacion: c.tipo_aplicacion,
      producto_sugerido: null,
      notas: null,
    }));

    await admin.from("nutricion_fraccionamientos").insert(fraccRows);
    trace.push(`persisted: ${fraccRows.length} fraccionamientos`);

    // ── 19. Response ────────────────────────────────────────
    const elapsed = Date.now() - t0;
    trace.push(`elapsed: ${elapsed}ms`);

    return ok({
      plan_id: plan.id,
      cached: false,
      hash_receta: hashReceta,
      engine_version: ENGINE_VERSION,
      modo_calculo: modoCalculo,
      nivel_confianza: nivelConfianza,
      yield_target: { ton_ha: yieldTonHa, intervalo: yieldInterval, fuente: yieldSource },
      data_quality: { completeness, missing },
      nutriente_limitante: limitingNutrient,
      demanda,
      fertilizantes,
      cronograma,
      economia: { costo_fertilizantes_usd: costoFert, costo_mano_obra_usd: costoMO, costo_total_usd: costoTotal, roi_estimado: roi },
      restricciones_aplicadas: restriccionesAplicadas,
      flags,
      explain_trace: trace,
    });
  } catch (e) {
    trace.push(`error: ${e instanceof Error ? e.message : String(e)}`);
    console.error("generate-nutrition-plan-v2 error:", e);
    return err("Internal error: " + (e instanceof Error ? e.message : String(e)), 500);
  }
});

function estimatePhaseDate(harvestDate: string, phaseIndex: number): string {
  const d = new Date(harvestDate);
  d.setMonth(d.getMonth() - (8 - phaseIndex * 2));
  return d.toISOString().split("T")[0];
}
