/**
 * Convierte demoConfig en cuenta real.
 * Crea: organization, user, profile, user_role, onboarding_session, organization_config, price_quote.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mapea wizard operatingModel a backend
function toBackendOpModel(op: string): string {
  const m: Record<string, string> = {
    solo_produccion: "single_farm",
    produccion_y_compra: "estate_hybrid",
    agrupamos_productores: "aggregator",
    compramos_comercializamos: "trader",
    auditamos: "auditor",
    vendemos_insumos: "aggregator",
  };
  return m[op] ?? "single_farm";
}

// Mapea wizard modules a backend
function toBackendModules(mods: string[]): string[] {
  const map: Record<string, string> = {
    produccion: "produccion",
    agronomia: "agronomia",
    cumplimiento: "cumplimiento",
    calidad: "calidad",
    jornales: "jornales",
    inventario: "inventario",
    catalogo_insumos: "catalogo_insumos",
    abastecimiento: "abastecimiento_cafe",
  };
  const out: string[] = [];
  for (const m of mods) {
    const b = map[m];
    if (b && !out.includes(b)) out.push(b);
  }
  if (out.length === 0) out.push("produccion", "cumplimiento");
  return out;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      email,
      password,
      name,
      orgName,
      country,
      demoConfig,
    } = body;

    if (!email || !password || !name || !orgName || !demoConfig) {
      return new Response(
        JSON.stringify({ error: "Faltan campos: email, password, name, orgName, demoConfig" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const scale = demoConfig.scaleProfile ?? {};
    const answers = {
      plots_count: scale.plotCount ?? 0,
      producers_count: scale.producerOrSupplierCount ?? 0,
      suppliers_count: scale.producerOrSupplierCount ?? 0,
      users_count: scale.userCount ?? 0,
      needs_eudr: (demoConfig.modulesEnabled ?? []).includes("cumplimiento"),
      needs_quality: (demoConfig.modulesEnabled ?? []).includes("calidad"),
      needs_agronomy: (demoConfig.modulesEnabled ?? []).includes("agronomia"),
      needs_labor: scale.hasLabor ?? false,
      needs_inventory: scale.hasInventory ?? false,
      needs_input_catalog: (demoConfig.modulesEnabled ?? []).includes("catalogo_insumos"),
    };

    const operatingModel = toBackendOpModel(demoConfig.operatingModel ?? "solo_produccion");
    const modules = toBackendModules(demoConfig.modulesEnabled ?? []);

    // 1. Crear onboarding_session
    const { data: sessionRow, error: sessErr } = await supabase
      .from("onboarding_sessions")
      .insert({
        email,
        org_name: orgName,
        country: country || null,
        org_type: demoConfig.orgType ?? "productor_privado",
        operating_model: operatingModel,
        answers: answers,
        recommended_plan: "Smart",
        recommended_modules: modules,
        status: "draft",
      })
      .select("id")
      .single();

    if (sessErr) {
      console.error("onboarding_sessions insert:", sessErr);
      return new Response(
        JSON.stringify({ error: "No se pudo crear sesión: " + sessErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const sessionId = sessionRow.id;

    // 2. Crear organization (platform_organizations o organizations)
    let orgId: string;

    const orgPayload: Record<string, unknown> = {
      name: orgName,
      display_name: orgName,
      org_type: demoConfig.orgType ?? "productor_privado",
      operating_model: operatingModel,
      pais: country || null,
      is_demo: false,
    };

    const { data: platformOrg, error: platformErr } = await supabase
      .from("platform_organizations")
      .insert(orgPayload)
      .select("id")
      .single();

    if (platformErr) {
      // Fallback: organizations (nombre en vez de name)
      const { data: orgRow, error: orgErr } = await supabase
        .from("organizations")
        .insert({
          nombre: orgName,
          tipo: demoConfig.orgType ?? "productor_privado",
          pais: country || null,
          estado: "activo",
        })
        .select("id")
        .single();

      if (orgErr) {
        console.error("organization insert:", orgErr, platformErr);
        return new Response(
          JSON.stringify({ error: "No se pudo crear organización: " + (orgErr.message || platformErr.message) }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      orgId = orgRow.id;
    } else {
      orgId = platformOrg.id;
    }

    // 3. Crear usuario auth
    const { data: authData, error: authErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: "cooperativa",
        organization_name: orgName,
      },
    });

    if (authErr) {
      if (authErr.message?.includes("already") || authErr.message?.includes("registered")) {
        return new Response(
          JSON.stringify({ error: "Este correo ya está registrado. Iniciá sesión." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("auth createUser:", authErr);
      return new Response(
        JSON.stringify({ error: "No se pudo crear usuario: " + authErr.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userId = authData.user?.id;
    if (!userId) {
      return new Response(
        JSON.stringify({ error: "No se obtuvo ID de usuario" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 4. Crear profile (profiles usa organization_id si existe)
    const profilePayload: Record<string, unknown> = {
      user_id: userId,
      name,
      organization_name: orgName,
    };
    if (typeof (await supabase.from("profiles").select("organization_id").limit(1).single()).data?.organization_id !== "undefined") {
      profilePayload.organization_id = orgId;
    }

    await supabase.from("profiles").upsert(profilePayload, { onConflict: "user_id" });

    // 5. Crear user_role
    const rolePayload: Record<string, unknown> = {
      user_id: userId,
      role: "cooperativa",
    };
    const { data: urCols } = await supabase.from("user_roles").select("organization_id").limit(1).single();
    if (urCols?.organization_id !== undefined) {
      rolePayload.organization_id = orgId;
    }
    await supabase.from("user_roles").upsert(rolePayload, { onConflict: "user_id" });

    // 6. fn_finalize_onboarding (solo si organization_configs existe y referencia platform_organizations)
    try {
      const { data: finalizeResult, error: finalizeErr } = await supabase.rpc("fn_finalize_onboarding", {
        p_session_id: sessionId,
        p_organization_id: orgId,
      });
      if (finalizeErr) {
        console.warn("fn_finalize_onboarding skipped:", finalizeErr.message);
      }
    } catch {
      // Ignorar si la función o tablas no existen
    }

    return new Response(
      JSON.stringify({
        ok: true,
        userId,
        organizationId: orgId,
        message: "Cuenta creada. Iniciá sesión.",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("convert-demo-to-org:", err);
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
