/**
 * approve_nutrition_plan_v1 — Edge Function para Nova Silva.
 * Aprueba un plan nutricional (solo técnico o admin_org).
 *
 * Requiere JWT. verify_jwt = true.
 *
 * Invocación:
 *   POST /functions/v1/approve_nutrition_plan_v1
 *   Authorization: Bearer <session.access_token>
 *   Body: { plan_id, approval_notes? }
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  const approvalNotes = body.approval_notes as string | undefined;

  if (!planId) {
    return new Response(
      JSON.stringify({ error: "Missing required field: plan_id" }),
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

  // Verificar rol tecnico o admin_org
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

  // Cargar plan y verificar org
  const { data: plan, error: planErr } = await supabase
    .from("nutricion_planes")
    .select("*")
    .eq("id", planId)
    .eq("organization_id", orgId)
    .single();

  if (planErr || !plan) {
    return new Response(
      JSON.stringify({ error: "Plan not found or access denied" }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Actualizar estado
  const { data: updated, error: updateErr } = await supabase
    .from("nutricion_planes")
    .update({
      estado: "approved_tecnico",
      updated_at: new Date().toISOString(),
    })
    .eq("id", planId)
    .eq("organization_id", orgId)
    .select()
    .single();

  if (updateErr) {
    return new Response(
      JSON.stringify({ error: "Failed to update plan", details: updateErr.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Insertar evento
  await supabase.from("ag_plan_events").insert({
    organization_id: orgId,
    plan_id: planId,
    event_type: "approved",
    payload_json: {
      approval_notes: approvalNotes ?? null,
      approved_by: user.id,
    },
    created_by: user.id,
  });

  return new Response(
    JSON.stringify({ plan: updated }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
