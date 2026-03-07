/**
 * quote_nutrition_inputs_v1 — Edge Function para Nova Silva.
 * Sugiere proveedores cercanos o genera cotización a partir del plan nutricional.
 *
 * Requiere JWT. verify_jwt = true.
 *
 * Invocación:
 *   POST /functions/v1/quote_nutrition_inputs_v1
 *   Body: { plan_id, supplier_id?, constraints?, idempotency_key }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { haversineKm, translateDemandaToProducts, type DemandaNutrientes, type SupplierProduct } from "./quote-engine.ts";

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

function extractDemanda(receta: Record<string, unknown>): DemandaNutrientes {
  const calc = receta.calculo_nutricional as Record<string, unknown> | undefined;
  const df = (calc?.demanda_final ?? receta.demanda_final ?? receta.demanda_calculada) as Record<string, unknown> | undefined;
  if (!df || typeof df !== "object") return {};
  return {
    N_kg_ha: df.N_kg_ha as number | undefined,
    P2O5_kg_ha: df.P2O5_kg_ha as number | undefined,
    K2O_kg_ha: df.K2O_kg_ha as number | undefined,
    CaO_kg_ha: df.CaO_kg_ha as number | undefined,
    MgO_kg_ha: df.MgO_kg_ha as number | undefined,
  };
}

function getZonaAltitudinal(receta: Record<string, unknown>): string {
  const inp = receta.inputs_tecnicos ?? receta.contexto as Record<string, unknown>;
  return ((inp?.zona_altitudinal ?? receta.zona_altitudinal) as string) ?? "media";
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
  const supplierId = body.supplier_id as string | undefined;
  const constraints = (body.constraints as string[]) ?? [];
  const idempotencyKey = body.idempotency_key as string | undefined;

  if (!planId || !idempotencyKey) {
    return new Response(
      JSON.stringify({ error: "Missing required fields: plan_id, idempotency_key" }),
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

  const { data: plan, error: planErr } = await supabase
    .from("nutricion_planes")
    .select("id, organization_id, parcela_id, receta_canonica_json")
    .eq("id", planId)
    .eq("organization_id", orgId)
    .single();

  if (planErr || !plan) {
    return new Response(
      JSON.stringify({ error: "Plan not found or access denied" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const receta = (plan.receta_canonica_json ?? {}) as Record<string, unknown>;
  const demanda = extractDemanda(receta);
  const zonaAltitudinal = getZonaAltitudinal(receta);

  if (!supplierId) {
    const { data: centroidRows } = await supabase.rpc("get_parcela_centroid", {
      p_parcela_id: plan.parcela_id,
    });
    const centroid = Array.isArray(centroidRows) && centroidRows.length > 0
      ? centroidRows[0] as { lat: number; lng: number }
      : null;

    const { data: suppliers } = await supabase
      .from("ag_suppliers")
      .select("id, nombre, lat, lng, telefono, whatsapp, email, radio_servicio_km")
      .eq("organization_id", orgId)
      .eq("activo", true);

    let withDistance = (suppliers ?? []).map((s) => {
      const lat = s.lat as number | null;
      const lng = s.lng as number | null;
      let distancia_km: number | null = null;
      if (centroid && lat != null && lng != null) {
        distancia_km = Math.round(haversineKm(centroid.lat, centroid.lng, lat, lng) * 100) / 100;
      }
      return { ...s, distancia_km };
    });

    withDistance.sort((a, b) => {
      if (a.distancia_km == null && b.distancia_km == null) return 0;
      if (a.distancia_km == null) return 1;
      if (b.distancia_km == null) return -1;
      return a.distancia_km - b.distancia_km;
    });

    const top3 = withDistance.slice(0, 3);
    return new Response(
      JSON.stringify({
        suggested_suppliers: top3,
        parcela_centroid: centroid,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: existingQuote } = await supabase
    .from("ag_quotes")
    .select("id, quote_json, hash_quote, quote_status, created_at")
    .eq("plan_id", planId)
    .eq("supplier_id", supplierId)
    .eq("quote_idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingQuote) {
    return new Response(
      JSON.stringify({
        idempotent: true,
        quote: existingQuote,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const { data: products } = await supabase
    .from("ag_supplier_products")
    .select("id, nombre_producto, tipo, analisis_json, precio_unitario, moneda, unidad")
    .eq("supplier_id", supplierId)
    .eq("activo", true);

  const supplierProducts: SupplierProduct[] = (products ?? []).map((p) => ({
    id: p.id,
    nombre_producto: p.nombre_producto,
    tipo: p.tipo,
    analisis_json: (p.analisis_json ?? {}) as Record<string, number>,
    precio_unitario: p.precio_unitario,
    moneda: p.moneda ?? "USD",
    unidad: p.unidad ?? "kg",
  }));

  const { lines, total, moneda, explain } = translateDemandaToProducts(
    demanda,
    supplierProducts,
    constraints,
    zonaAltitudinal
  );

  const quoteJson = {
    plan_id: planId,
    supplier_id: supplierId,
    demanda,
    constraints,
    zona_altitudinal: zonaAltitudinal,
    lines,
    total,
    moneda,
    explain,
    generated_at: new Date().toISOString(),
  };

  const hashQuote = await sha256Hex(canonicalStringify(quoteJson));

  const { data: supplier } = await supabase
    .from("ag_suppliers")
    .select("id, commission_pct_default")
    .eq("id", supplierId)
    .single();

  const commissionPct = (supplier?.commission_pct_default ?? 0.03) as number;
  const commissionAmount = Math.round(total * commissionPct * 100) / 100;

  const { data: newQuote, error: insertErr } = await supabase
    .from("ag_quotes")
    .insert({
      organization_id: orgId,
      plan_id: planId,
      supplier_id: supplierId,
      quote_status: "draft",
      quote_json: quoteJson,
      hash_quote: hashQuote,
      quote_idempotency_key: idempotencyKey,
      created_by: user.id,
    })
    .select()
    .single();

  if (insertErr) {
    if (insertErr.code === "23505") {
      const { data: dup } = await supabase
        .from("ag_quotes")
        .select("id, quote_json, hash_quote")
        .eq("plan_id", planId)
        .eq("supplier_id", supplierId)
        .eq("quote_idempotency_key", idempotencyKey)
        .maybeSingle();
      return new Response(
        JSON.stringify({ idempotent: true, quote: dup }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    return new Response(
      JSON.stringify({ error: "Failed to create quote", details: insertErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  await supabase.from("ag_quote_events").insert({
    organization_id: orgId,
    quote_id: newQuote?.id,
    event_type: "generated",
    payload_json: { plan_id: planId, constraints, total },
    created_by: user.id,
  });

  await supabase.from("ag_commissions").insert({
    organization_id: orgId,
    quote_id: newQuote?.id,
    supplier_id: supplierId,
    invoice_amount: total,
    commission_pct: commissionPct,
    commission_amount: commissionAmount,
    status: "estimated",
  });

  return new Response(
    JSON.stringify({
      quote: newQuote,
      total,
      moneda,
      lines,
      explain,
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
