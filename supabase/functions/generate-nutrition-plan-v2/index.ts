import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const ENGINE_VERSION = "2.1.0";
const RULESET_VERSION = "2026-03-08";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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
  code: string; nombre: string;
  demanda_base: number;
  ajustes: { altitud: number; edad: number; variedad: number; estres: number };
  aporte_suelo: number; aporte_organico: number; eficiencia: number;
  dosis_final: number; indice_suficiencia: number;
}

interface ProductSelection {
  fertilizer_id: string; nombre: string; tipo: string; formula: string;
  cantidad_kg_ha: number; cantidad_total: number; costo_usd: number | null;
  nutrient_contributions: Record<string, number>;
}

interface ScheduleEntry {
  sequence_no: number; window_code: string; application_goal: string;
  target_date: string | null; nutrients_json: Record<string, number>;
  products_json: ProductSelection[]; labor_days_estimate: number;
  weather_sensitivity: string; priority_score: number;
}

// ────────────────────────────────────────────────────────────────
// Utilities
// ────────────────────────────────────────────────────────────────

const r2 = (n: number) => Math.round(n * 100) / 100;

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

const SCENARIO_MULT: Record<string, number> = { conservador: 0.85, esperado: 1.0, intensivo: 1.15 };

// ────────────────────────────────────────────────────────────────
// Coefficient calculators
// ────────────────────────────────────────────────────────────────

function getAltitudeCoef(alt: number): number {
  if (alt >= 1600) return 1.20;
  if (alt >= 1200) return 1.10;
  if (alt >= 800)  return 1.00;
  return 0.90;
}

function getAgeCoef(edad: number): number {
  if (edad < 3) return 0.60;
  if (edad < 5) return 0.80;
  if (edad <= 15) return 1.00;
  if (edad <= 25) return 1.10;
  return 1.15;
}

function getStressCoef(ctx: Record<string, unknown>): number {
  let c = 1.0;
  if (ctx.deficit_hidrico_actual) c *= 0.90;
  if (Number(ctx.porcentaje_renovacion ?? 0) > 30) c *= 0.85;
  return r2(c);
}

function getTextureEff(tex: string | null): number {
  if (!tex) return 1.0;
  const t = tex.toLowerCase();
  if (t.includes("aren")) return 1.15;
  if (t.includes("arcill")) return 0.90;
  return 1.0;
}

// ────────────────────────────────────────────────────────────────
// Soil supply estimation
// ────────────────────────────────────────────────────────────────

function estimateSoilSupply(suelo: Record<string, unknown> | null): Record<string, number> {
  const s: Record<string, number> = {};
  if (!suelo) return s;
  const mo = Number(suelo.materia_organica_pct ?? 0);
  s.N = r2(mo * 12);
  s.P2O5 = r2(Number(suelo.p_disponible ?? 0) * 0.15);
  s.K2O = r2(Number(suelo.k_intercambiable ?? 0) * 8.0);
  s.CaO = r2(Number(suelo.ca_intercambiable ?? 0) * 3.5);
  s.MgO = r2(Number(suelo.mg_intercambiable ?? 0) * 2.5);
  s.S = r2(Number(suelo.azufre ?? 0) * 0.5);
  s.Zn = r2(Number(suelo.zinc ?? 0) * 0.005);
  s.B = r2(Number(suelo.boro ?? 0) * 0.003);
  s.Mn = r2(Number(suelo.manganeso ?? 0) * 0.004);
  return s;
}

function estimateOrganicSupply(ctx: Record<string, unknown>): Record<string, number> {
  const manejo = String(ctx.sistema_manejo ?? "convencional");
  if (manejo === "organico" || manejo === "agroecologico") {
    return { N: 8, P2O5: 2, K2O: 5, S: 1 };
  }
  return {};
}

// ────────────────────────────────────────────────────────────────
// Phenological windows
// ────────────────────────────────────────────────────────────────

interface WindowSpec {
  code: string; goal: string; weather: string; priority: number;
  pct: Record<string, number>;
}

const WINDOWS: WindowSpec[] = [
  { code: "crecimiento_vegetativo", goal: "Arranque vegetativo post-poda o post-cosecha", weather: "media", priority: 3,
    pct: { N:.30, P2O5:.35, K2O:.15, CaO:.25, MgO:.25, S:.25, Zn:.30, B:.30, Mn:.25 } },
  { code: "cabeza_alfiler", goal: "Soporte a floracion y cuajado", weather: "alta", priority: 4,
    pct: { N:.25, P2O5:.30, K2O:.20, CaO:.25, MgO:.25, S:.25, Zn:.25, B:.25, Mn:.25 } },
  { code: "expansion_rapida", goal: "Crecimiento rapido del fruto", weather: "media", priority: 3,
    pct: { N:.25, P2O5:.20, K2O:.30, CaO:.25, MgO:.25, S:.25, Zn:.25, B:.25, Mn:.25 } },
  { code: "llenado_grano", goal: "Llenado y maduracion del grano", weather: "baja", priority: 2,
    pct: { N:.20, P2O5:.15, K2O:.35, CaO:.25, MgO:.25, S:.25, Zn:.20, B:.20, Mn:.25 } },
];

function estimatePhaseDate(harvest: string, idx: number): string {
  const d = new Date(harvest);
  d.setMonth(d.getMonth() - (8 - idx * 2));
  return d.toISOString().split("T")[0];
}

// ────────────────────────────────────────────────────────────────
// Main handler
// ────────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  const trace: string[] = [];
  const flags: Flag[] = [];
  const t0 = Date.now();

  try {
    // ── Auth ─────────────────────────────────────────────────
    const authH = req.headers.get("Authorization") ?? "";
    if (!authH.startsWith("Bearer ")) return err("Missing Authorization", 401);

    const url = Deno.env.get("SUPABASE_URL") ?? "";
    const sKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const aKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    const uClient = createClient(url, aKey, { global: { headers: { Authorization: authH } } });
    const admin = createClient(url, sKey);

    const { data: { user }, error: aErr } = await uClient.auth.getUser();
    if (aErr || !user) return err("Invalid JWT", 401);
    trace.push(`auth: ${user.id}`);

    // ── Parse + validate ────────────────────────────────────
    const body: PlanRequest = await req.json();
    if (!body.org_id) return err("org_id required");
    if (!body.plot_id) return err("plot_id required");
    body.yield_mode ??= "auto";
    body.scenario ??= "esperado";
    body.allow_heuristics ??= true;
    body.user_id = user.id;

    const { data: prof } = await admin.from("profiles").select("organization_id").eq("user_id", user.id).maybeSingle();
    if (!prof?.organization_id || prof.organization_id !== body.org_id) return err("Access denied", 403);
    trace.push(`org: ${body.org_id}`);

    // ── Idempotency ─────────────────────────────────────────
    const reqHash = await sha256(canonicalStringify({
      org_id: body.org_id, plot_id: body.plot_id, yield_mode: body.yield_mode,
      yield_manual_ton: body.yield_manual_ton ?? null, scenario: body.scenario,
      soil_analysis_id: body.soil_analysis_id ?? null,
    }));

    const cutoff = new Date(Date.now() - 24 * 3600_000).toISOString();
    const { data: cached } = await admin.from("nutricion_planes").select("id, explicaciones")
      .eq("parcela_id", body.plot_id).gte("created_at", cutoff)
      .order("created_at", { ascending: false }).limit(1).maybeSingle();

    if (cached?.explicaciones && (cached.explicaciones as any).request_hash === reqHash) {
      trace.push("cache hit");
      return ok({ plan_id: cached.id, cached: true, hash_receta: reqHash, engine_version: ENGINE_VERSION });
    }
    trace.push("cache miss");

    // ── Load context ────────────────────────────────────────
    const { data: parcela } = await admin.from("parcelas").select("*").eq("id", body.plot_id).maybeSingle();
    if (!parcela) return err("Parcela not found", 404);

    const { data: ctx } = await admin.from("nutricion_parcela_contexto").select("*")
      .eq("parcela_id", body.plot_id).order("created_at", { ascending: false }).limit(1).maybeSingle();

    const alt = Number(ctx?.altitud_msnm ?? parcela.altitud_msnm ?? 1200);
    const edad = Number(ctx?.edad_promedio_anios ?? 8);
    const areaHa = Number(ctx?.area_ha ?? parcela.area_hectareas ?? 1);
    const textura = (ctx?.textura ?? null) as string | null;
    const missing: string[] = [];
    trace.push(`plot: alt=${alt} edad=${edad} area=${areaHa}`);

    // ── Load ag_nutrients (real catalog) ────────────────────
    const { data: nutCatalog } = await admin.from("ag_nutrients").select("*");
    const nutMap = new Map<string, Record<string, unknown>>();
    const FALLBACK_EXTRACTION: Record<string, number> = {
      N: 35, P2O5: 8, K2O: 42, CaO: 12, MgO: 5, S: 4, Zn: 0.12, B: 0.08, Mn: 0.06,
    };
    const FALLBACK_EFF: Record<string, number> = {
      N: 0.50, P2O5: 0.25, K2O: 0.60, CaO: 0.70, MgO: 0.65, S: 0.60, Zn: 0.30, B: 0.30, Mn: 0.35,
    };

    if (nutCatalog && nutCatalog.length > 0) {
      for (const n of nutCatalog) nutMap.set(String(n.codigo), n);
      trace.push(`ag_nutrients: ${nutCatalog.length} loaded from catalog`);
    } else {
      trace.push("ag_nutrients: using fallback constants");
    }

    const nutrientCodes = nutMap.size > 0
      ? Array.from(nutMap.keys())
      : Object.keys(FALLBACK_EXTRACTION);

    // ── Load soil analysis ──────────────────────────────────
    let suelo: Record<string, unknown> | null = null;
    if (body.soil_analysis_id) {
      const { data } = await admin.from("nutricion_analisis_suelo").select("*").eq("id", body.soil_analysis_id).maybeSingle();
      suelo = data;
    }
    if (!suelo) {
      const { data } = await admin.from("nutricion_analisis_suelo").select("*")
        .eq("parcela_id", body.plot_id).order("fecha_analisis", { ascending: false }).limit(1).maybeSingle();
      suelo = data;
    }
    if (!suelo) {
      missing.push("soil_analysis");
      if (!body.allow_heuristics) return err("No soil analysis and heuristics disabled", 422);
      flags.push({ code: "NO_SOIL", severity: "warning", message: "Sin analisis de suelo. Usando heuristicas." });
    }
    trace.push(`soil: ${suelo ? "loaded" : "heuristic"}`);

    // ── Foliar ──────────────────────────────────────────────
    const { data: foliar } = await admin.from("nutricion_analisis_foliar").select("*")
      .eq("parcela_id", body.plot_id).order("fecha_muestreo", { ascending: false }).limit(1).maybeSingle();
    if (!foliar) missing.push("foliar_analysis");

    // ── Varieties ───────────────────────────────────────────
    let varList: Array<Record<string, unknown>> = [];
    const ctxV = ctx?.variedades;
    if (ctxV) {
      let names: string[] = [];
      if (Array.isArray(ctxV)) names = ctxV;
      else if (typeof ctxV === "string") {
        try { names = JSON.parse(ctxV); } catch { names = ctxV.split(",").map((s: string) => s.trim()).filter(Boolean); }
      }
      if (names.length) {
        const { data } = await admin.from("nutricion_variedades").select("*").in("nombre_comun", names);
        varList = (data ?? []).map((v: Record<string, unknown>) => ({ ...v, porcentaje: 100 / (data?.length ?? 1) }));
      }
    }
    if (!varList.length && parcela.variedad_principal) {
      const { data } = await admin.from("nutricion_variedades").select("*")
        .eq("nombre_comun", parcela.variedad_principal).maybeSingle();
      if (data) varList = [{ ...data, porcentaje: 100 }];
    }
    if (!varList.length) missing.push("varietal_data");

    // ── Yield ───────────────────────────────────────────────
    let yieldTon: number;
    let yieldSrc: string;
    if (body.yield_mode === "manual" && body.yield_manual_ton) {
      yieldTon = body.yield_manual_ton; yieldSrc = "manual";
    } else if (ctx?.rendimiento_proyectado_kg_ha) {
      yieldTon = Number(ctx.rendimiento_proyectado_kg_ha) / 1000; yieldSrc = "contexto";
    } else {
      yieldTon = 1.2; yieldSrc = "default"; missing.push("yield_estimate");
    }
    yieldTon *= SCENARIO_MULT[body.scenario] ?? 1.0;
    trace.push(`yield: ${yieldTon} ton/ha (${yieldSrc})`);

    // ── Coefficients ────────────────────────────────────────
    const cAlt = getAltitudeCoef(alt);
    const cAge = getAgeCoef(edad);
    let cVar = 1.0, cMicros = 1.0;
    if (varList.length) {
      let wM = 0, wMi = 0, wS = 0;
      for (const v of varList) {
        const p = Number(v.porcentaje ?? 100 / varList.length);
        wM += Number(v.multiplicador_demanda ?? 1) * p;
        wMi += Number(v.multiplicador_micronutrientes ?? 1) * p;
        wS += p;
      }
      cVar = r2(wM / (wS || 1)); cMicros = r2(wMi / (wS || 1));
    }
    const cStress = getStressCoef(ctx ?? {});
    const texFactor = getTextureEff(textura);

    // ── Soil rules (ag_reglas_suelo) ────────────────────────
    const { data: soilRules } = await admin.from("ag_reglas_suelo").select("*").eq("activo", true);
    const bloqueos: Flag[] = [];
    if (suelo && soilRules) {
      for (const rule of soilRules) {
        const val = Number((suelo as any)[rule.variable] ?? null);
        if (val === null || isNaN(val)) continue;
        let triggered = false;
        if (rule.operador === "<" && val < Number(rule.umbral_min)) triggered = true;
        if (rule.operador === ">" && val > Number(rule.umbral_max)) triggered = true;
        if (rule.operador === "between" && (val < Number(rule.umbral_min) || val > Number(rule.umbral_max))) triggered = true;
        if (triggered) {
          bloqueos.push({ code: rule.explain_code ?? rule.variable, severity: rule.severidad, message: rule.mensaje });
        }
      }
    }
    if (bloqueos.length) trace.push(`soil rules: ${bloqueos.length} triggered`);
    flags.push(...bloqueos);

    // ── Nutrient demand ─────────────────────────────────────
    const soilSup = estimateSoilSupply(suelo);
    const orgSup = estimateOrganicSupply(ctx ?? {});
    const modoCalculo = missing.length === 0 ? "completo" : "heuristico";

    const maxLimits: Record<string, number> = { N: 300, P2O5: 150, K2O: 250, CaO: 500, MgO: 100, S: 60, Zn: 15, B: 5, Mn: 10 };
    const restricciones: string[] = [];

    const nutrients: NutrientDetail[] = [];
    let limitNut: { code: string; nombre: string; indice: number; impacto: string } | null = null;
    let minSuf = Infinity;

    for (const code of nutrientCodes) {
      const catRow = nutMap.get(code);
      const extraction = catRow ? Number(catRow.extraction_per_ton ?? 0) : (FALLBACK_EXTRACTION[code] ?? 0);
      const efficiency = catRow ? Number(catRow.absorption_efficiency ?? 0.5) : (FALLBACK_EFF[code] ?? 0.5);
      const nombre = catRow ? String(catRow.nombre ?? code) : code;
      const isMicro = ["Zn", "B", "Mn"].includes(code);

      const base = r2(extraction * yieldTon);
      const varMul = isMicro ? cMicros : cVar;
      const adjusted = r2(base * cAlt * cAge * varMul * cStress);
      const supSoil = soilSup[code] ?? 0;
      const supOrg = orgSup[code] ?? 0;
      const netDose = Math.max(0, adjusted - supSoil - supOrg) / efficiency;
      let final = r2(netDose * texFactor);

      if (maxLimits[code] && final > maxLimits[code]) {
        restricciones.push(`${code} capped at ${maxLimits[code]} kg/ha`);
        final = maxLimits[code];
      }

      const suf = adjusted > 0 ? r2((supSoil + supOrg) / adjusted) : 1.0;
      if (suf < minSuf) {
        minSuf = suf;
        limitNut = { code, nombre, indice: suf, impacto: suf < 0.3 ? "critico" : suf < 0.5 ? "limitante" : "moderado" };
      }

      nutrients.push({
        code, nombre, demanda_base: base,
        ajustes: { altitud: cAlt, edad: cAge, variedad: varMul, estres: cStress },
        aporte_suelo: supSoil, aporte_organico: supOrg, eficiencia: efficiency,
        dosis_final: final, indice_suficiencia: suf,
      });
    }
    trace.push(`demand: ${nutrients.length} nutrients, limiting=${limitNut?.code ?? "none"}`);

    // ── Fertilizer products (from ag_fertilizers catalog) ───
    const { data: fertCatalog } = await admin.from("ag_fertilizers").select("*").eq("activo", true);
    const products: ProductSelection[] = [];
    const pending = new Map<string, number>();
    for (const n of nutrients) pending.set(n.code, n.dosis_final);

    const fertList = fertCatalog && fertCatalog.length > 0 ? fertCatalog : [
      { id: "f-urea", nombre: "Urea (46-0-0)", formula: "CO(NH2)2", n_pct: 46, p2o5_pct: 0, k2o_pct: 0, costo_usd_kg: 0.55 },
      { id: "f-dap", nombre: "DAP (18-46-0)", formula: "(NH4)2HPO4", n_pct: 18, p2o5_pct: 46, k2o_pct: 0, costo_usd_kg: 0.70 },
      { id: "f-kcl", nombre: "KCl (0-0-60)", formula: "KCl", n_pct: 0, p2o5_pct: 0, k2o_pct: 60, costo_usd_kg: 0.50 },
    ];

    if (fertCatalog && fertCatalog.length > 0) trace.push(`ag_fertilizers: ${fertCatalog.length} from catalog`);
    else trace.push("ag_fertilizers: using fallback");

    for (const fert of fertList) {
      const contents: Record<string, number> = {};
      if (Number(fert.n_pct ?? 0) > 0) contents.N = Number(fert.n_pct) / 100;
      if (Number(fert.p2o5_pct ?? 0) > 0) contents.P2O5 = Number(fert.p2o5_pct) / 100;
      if (Number(fert.k2o_pct ?? 0) > 0) contents.K2O = Number(fert.k2o_pct) / 100;

      let bestNut = ""; let bestNeed = 0;
      for (const [nut, frac] of Object.entries(contents)) {
        if ((pending.get(nut) ?? 0) > bestNeed) { bestNut = nut; bestNeed = pending.get(nut) ?? 0; }
      }
      if (bestNeed < 0.01) continue;

      const frac = contents[bestNut] ?? 0;
      if (frac <= 0) continue;
      const kgHa = r2(bestNeed / frac);
      const kgTotal = r2(kgHa * areaHa);

      const contributions: Record<string, number> = {};
      for (const [nut, f] of Object.entries(contents)) {
        const supplied = r2(kgHa * f);
        contributions[nut] = supplied;
        pending.set(nut, Math.max(0, (pending.get(nut) ?? 0) - supplied));
      }

      products.push({
        fertilizer_id: String(fert.id), nombre: String(fert.nombre),
        tipo: "sintetico", formula: String(fert.formula ?? ""),
        cantidad_kg_ha: kgHa, cantidad_total: kgTotal,
        costo_usd: r2(kgTotal * Number(fert.costo_usd_kg ?? 0)),
        nutrient_contributions: contributions,
      });
    }
    trace.push(`products: ${products.length}`);

    // ── Schedule ────────────────────────────────────────────
    const schedule: ScheduleEntry[] = WINDOWS.map((w, i) => {
      const nutJson: Record<string, number> = {};
      for (const n of nutrients) nutJson[n.code] = r2(n.dosis_final * (w.pct[n.code] ?? 0.25));
      return {
        sequence_no: i + 1, window_code: w.code, application_goal: w.goal,
        target_date: body.target_harvest_date ? estimatePhaseDate(body.target_harvest_date, i) : null,
        nutrients_json: nutJson,
        products_json: products.map(p => ({
          ...p, cantidad_kg_ha: r2(p.cantidad_kg_ha * (Object.values(w.pct)[0] ?? 0.25)),
          cantidad_total: r2(p.cantidad_total * (Object.values(w.pct)[0] ?? 0.25)),
        })),
        labor_days_estimate: 1.5, weather_sensitivity: w.weather, priority_score: w.priority,
      };
    });
    trace.push(`schedule: ${schedule.length} windows`);

    // ── Economics ────────────────────────────────────────────
    const costoFert = r2(products.reduce((s, p) => s + (p.costo_usd ?? 0), 0));
    const costoMO = r2(schedule.reduce((s, c) => s + c.labor_days_estimate, 0) * (body.override_inputs?.labor_cost_per_day ?? 15));
    const costoTotal = r2(costoFert + costoMO);
    const coffeePrice = body.override_inputs?.coffee_price_per_kg ?? 3.5;
    const ingresoEst = r2(yieldTon * 1000 * coffeePrice * areaHa);
    const roi = ingresoEst > 0 ? r2((ingresoEst - costoTotal) / costoTotal) : null;

    // ── Confidence ──────────────────────────────────────────
    const nivelConf = missing.length === 0 ? "alta" : missing.length <= 2 ? "media" : "baja";
    const completeness = Math.round(((nutrients.length * 4 - missing.length * 4) / (nutrients.length * 4)) * 100);

    // ── Hash ────────────────────────────────────────────────
    const planCanonical = canonicalStringify({ nutrients, products, schedule });
    const hashReceta = await sha256(planCanonical);
    trace.push(`hash: ${hashReceta.slice(0, 12)}...`);

    // ── Build persist payload for persist_nutrition_plan_v2 RPC ──
    const demandaFlat: Record<string, number> = {};
    for (const n of nutrients) demandaFlat[`demanda_${n.code.toLowerCase()}_kg_ha`] = n.dosis_final;

    const persistPayload = {
      organization_id: body.org_id,
      parcela_id: body.plot_id,
      analisis_suelo_id: body.soil_analysis_id ?? (suelo as any)?.id ?? null,
      ciclo: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`,
      yield_usado_kg_ha: r2(yieldTon * 1000),
      fecha_floracion: ctx?.fecha_floracion_principal ?? null,
      es_heuristico: modoCalculo === "heuristico",
      es_condicionado: bloqueos.length > 0,
      status: "generated",
      nivel_confianza: nivelConf === "alta" ? "alto" : nivelConf === "media" ? "medio" : "bajo",
      confidence_score: completeness,
      confidence_band: nivelConf,
      multiplicador_varietal_ponderado: cVar,
      eficiencia_n: FALLBACK_EFF.N,
      eficiencia_p: FALLBACK_EFF.P2O5,
      eficiencia_k: FALLBACK_EFF.K2O,
      ajuste_altitud: cAlt,
      ajuste_edad: cAge,
      ajuste_suelo: suelo ? 1.0 : 0.0,
      version_reglas: RULESET_VERSION,
      idempotency_key: reqHash,
      explicaciones: { request_hash: reqHash, trace, engine_version: ENGINE_VERSION, modo_calculo: modoCalculo },
      flags_riesgo: flags,
      confianza_detalle: { completeness: `${completeness}%`, missing },
      bloqueos,
      costo_estimado_total: costoTotal,
      ...demandaFlat,
      // Child data for RPC to handle
      _nutrients: nutrients,
      _products: products,
      _schedule: schedule,
      _audit: { event_type: "plan_generated", created_by: user.id },
    };

    // ── Call persist_nutrition_plan_v2 RPC ───────────────────
    const { data: rpcResult, error: rpcErr } = await admin.rpc("persist_nutrition_plan_v2", {
      _payload: persistPayload,
    });

    let planId: string;

    if (rpcErr) {
      trace.push(`persist RPC failed: ${rpcErr.message}, falling back to direct insert`);

      // Fallback: direct insert (strips child data)
      const directRow = { ...persistPayload };
      delete (directRow as any)._nutrients;
      delete (directRow as any)._products;
      delete (directRow as any)._schedule;
      delete (directRow as any)._audit;

      const { data: directPlan, error: directErr } = await admin.from("nutricion_planes")
        .insert(directRow).select("id").single();

      if (directErr) return err("Persist failed: " + directErr.message, 500);
      planId = directPlan.id;

      // Persist fraccionamientos directly
      const fraccRows = schedule.map((s) => ({
        organization_id: body.org_id, plan_id: planId,
        numero_aplicacion: s.sequence_no, fase_fenologica: s.window_code,
        gda_objetivo: s.sequence_no * 700,
        fecha_programada: s.target_date,
        dosis_n: s.nutrients_json.N ?? 0, dosis_p2o5: s.nutrients_json.P2O5 ?? 0,
        dosis_k2o: s.nutrients_json.K2O ?? 0, dosis_cao: s.nutrients_json.CaO ?? 0,
        dosis_mgo: s.nutrients_json.MgO ?? 0, dosis_s: s.nutrients_json.S ?? 0,
        dosis_zn: s.nutrients_json.Zn ?? 0, dosis_b: s.nutrients_json.B ?? 0,
        tipo_aplicacion: "edafica", producto_sugerido: null, notas: null,
      }));
      await admin.from("nutricion_fraccionamientos").insert(fraccRows);

      // Persist schedule directly
      const schedRows = schedule.map((s) => ({
        organization_id: body.org_id, plan_id: planId,
        sequence_no: s.sequence_no, window_code: s.window_code,
        application_goal: s.application_goal, target_date: s.target_date,
        nutrients_json: s.nutrients_json, products_json: s.products_json,
        labor_days_estimate: s.labor_days_estimate,
        weather_sensitivity: s.weather_sensitivity,
        priority_score: s.priority_score, status: "planned", created_by: user.id,
      }));
      await admin.from("ag_nut_schedule").insert(schedRows);

      // Audit event
      await admin.from("ag_nut_plan_audit_events").insert({
        organization_id: body.org_id, plan_id: planId,
        event_type: "plan_generated", created_by: user.id,
        event_payload: { engine_version: ENGINE_VERSION, hash: hashReceta, modo: modoCalculo },
      });

      trace.push(`fallback persist: plan=${planId}`);
    } else {
      planId = typeof rpcResult === "string" ? rpcResult : (rpcResult as any)?.plan_id ?? "unknown";
      trace.push(`RPC persist: plan=${planId}`);
    }

    // ── Response ─────────────────────────────────────────────
    trace.push(`elapsed: ${Date.now() - t0}ms`);

    return ok({
      plan_id: planId,
      cached: false,
      hash_receta: hashReceta,
      engine_version: ENGINE_VERSION,
      modo_calculo: modoCalculo,
      nivel_confianza: nivelConf,
      yield_target: { ton_ha: yieldTon, intervalo: r2(yieldTon * 0.15), fuente: yieldSrc },
      data_quality: { completeness: `${completeness}%`, missing },
      nutriente_limitante: limitNut,
      demanda: Object.fromEntries(nutrients.map(n => [n.code, n])),
      fertilizantes: products,
      cronograma: schedule,
      economia: { costo_fertilizantes_usd: costoFert, costo_mano_obra_usd: costoMO, costo_total_usd: costoTotal, roi_estimado: roi },
      restricciones_aplicadas: restricciones,
      flags,
      explain_trace: trace,
    });
  } catch (e) {
    trace.push(`error: ${e instanceof Error ? e.message : String(e)}`);
    console.error("v2 error:", e);
    return err("Internal: " + (e instanceof Error ? e.message : String(e)), 500);
  }
});
