import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const ORG1 = "00000000-0000-0000-0000-000000000001";
const ORG2 = "00000000-0000-0000-0000-000000000002";

interface StepResult {
  table: string;
  step: string;
  ok: boolean;
  rowsCount?: number;
  error?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

  const supabase = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "not authenticated" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseAdmin = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  const { data: profileRow } = await supabaseAdmin
    .from("user_organization_map")
    .select("organization_id")
    .eq("user_id", user.id)
    .maybeSingle();

  let callerOrgId: string | null = profileRow?.organization_id ?? null;

  if (!callerOrgId) {
    const { data: prodRow } = await supabaseAdmin
      .from("productores")
      .select("cooperativa_id")
      .eq("user_id", user.id)
      .maybeSingle();
    callerOrgId = prodRow?.cooperativa_id ?? null;
  }

  if (!callerOrgId) {
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();
    if (roleRow?.role === "cooperativa") callerOrgId = ORG1;
    else if (roleRow?.role === "exportador") callerOrgId = ORG2;
  }

  const results: StepResult[] = [];

  // ── productores ──────────────────────────────────────────
  // SELECT org1
  const { data: pSelOrg1, error: pSelOrg1Err } = await supabase
    .from("productores")
    .select("id")
    .eq("cooperativa_id", ORG1);
  results.push({
    table: "productores",
    step: "select_org1",
    ok: !pSelOrg1Err,
    rowsCount: pSelOrg1?.length ?? 0,
    ...(pSelOrg1Err && { error: pSelOrg1Err.message }),
  });

  // SELECT org2
  const { data: pSelOrg2, error: pSelOrg2Err } = await supabase
    .from("productores")
    .select("id")
    .eq("cooperativa_id", ORG2);
  results.push({
    table: "productores",
    step: "select_org2",
    ok: !pSelOrg2Err,
    rowsCount: pSelOrg2?.length ?? 0,
    ...(pSelOrg2Err && { error: pSelOrg2Err.message }),
  });

  // INSERT org1
  const { data: pInsOrg1, error: pInsOrg1Err } = await supabase
    .from("productores")
    .insert({ cooperativa_id: ORG1, nombre: `_rls_test_org1_${Date.now()}` })
    .select("id");
  results.push({
    table: "productores",
    step: "insert_org1",
    ok: !pInsOrg1Err,
    rowsCount: pInsOrg1?.length ?? 0,
    ...(pInsOrg1Err && { error: pInsOrg1Err.message }),
  });
  const insertedProdOrg1Id = pInsOrg1?.[0]?.id;

  // INSERT org2
  const { data: pInsOrg2, error: pInsOrg2Err } = await supabase
    .from("productores")
    .insert({ cooperativa_id: ORG2, nombre: `_rls_test_org2_${Date.now()}` })
    .select("id");
  results.push({
    table: "productores",
    step: "insert_org2",
    ok: !pInsOrg2Err,
    rowsCount: pInsOrg2?.length ?? 0,
    ...(pInsOrg2Err && { error: pInsOrg2Err.message }),
  });
  const insertedProdOrg2Id = pInsOrg2?.[0]?.id;

  // ── parcelas ─────────────────────────────────────────────
  // Find a valid productor per org for FK
  const { data: prodForOrg1 } = await supabase
    .from("productores")
    .select("id")
    .eq("cooperativa_id", ORG1)
    .limit(1)
    .maybeSingle();
  const { data: prodForOrg2 } = await supabase
    .from("productores")
    .select("id")
    .eq("cooperativa_id", ORG2)
    .limit(1)
    .maybeSingle();

  // SELECT org1
  const { data: parSelOrg1, error: parSelOrg1Err } = await supabase
    .from("parcelas")
    .select("id")
    .eq("cooperativa_id", ORG1);
  results.push({
    table: "parcelas",
    step: "select_org1",
    ok: !parSelOrg1Err,
    rowsCount: parSelOrg1?.length ?? 0,
    ...(parSelOrg1Err && { error: parSelOrg1Err.message }),
  });

  // SELECT org2
  const { data: parSelOrg2, error: parSelOrg2Err } = await supabase
    .from("parcelas")
    .select("id")
    .eq("cooperativa_id", ORG2);
  results.push({
    table: "parcelas",
    step: "select_org2",
    ok: !parSelOrg2Err,
    rowsCount: parSelOrg2?.length ?? 0,
    ...(parSelOrg2Err && { error: parSelOrg2Err.message }),
  });

  // INSERT org1 parcela
  const prodIdOrg1 = prodForOrg1?.id ?? insertedProdOrg1Id;
  if (prodIdOrg1) {
    const { data: parInsOrg1, error: parInsOrg1Err } = await supabase
      .from("parcelas")
      .insert({
        cooperativa_id: ORG1,
        productor_id: prodIdOrg1,
        nombre: `_rls_parc_org1_${Date.now()}`,
      })
      .select("id");
    results.push({
      table: "parcelas",
      step: "insert_org1",
      ok: !parInsOrg1Err,
      rowsCount: parInsOrg1?.length ?? 0,
      ...(parInsOrg1Err && { error: parInsOrg1Err.message }),
    });
  } else {
    results.push({
      table: "parcelas",
      step: "insert_org1",
      ok: false,
      error: "no productor found in org1 for FK",
    });
  }

  // INSERT org2 parcela
  const prodIdOrg2 = prodForOrg2?.id ?? insertedProdOrg2Id;
  if (prodIdOrg2) {
    const { data: parInsOrg2, error: parInsOrg2Err } = await supabase
      .from("parcelas")
      .insert({
        cooperativa_id: ORG2,
        productor_id: prodIdOrg2,
        nombre: `_rls_parc_org2_${Date.now()}`,
      })
      .select("id");
    results.push({
      table: "parcelas",
      step: "insert_org2",
      ok: !parInsOrg2Err,
      rowsCount: parInsOrg2?.length ?? 0,
      ...(parInsOrg2Err && { error: parInsOrg2Err.message }),
    });
  } else {
    results.push({
      table: "parcelas",
      step: "insert_org2",
      ok: false,
      error: "no productor found in org2 for FK",
    });
  }

  // ── entregas ─────────────────────────────────────────────
  // Find a valid parcela per org for FK
  const { data: parcForOrg1 } = await supabase
    .from("parcelas")
    .select("id, productor_id")
    .eq("cooperativa_id", ORG1)
    .limit(1)
    .maybeSingle();
  const { data: parcForOrg2 } = await supabase
    .from("parcelas")
    .select("id, productor_id")
    .eq("cooperativa_id", ORG2)
    .limit(1)
    .maybeSingle();

  // SELECT org1
  const { data: eSelOrg1, error: eSelOrg1Err } = await supabase
    .from("entregas")
    .select("id")
    .eq("cooperativa_id", ORG1);
  results.push({
    table: "entregas",
    step: "select_org1",
    ok: !eSelOrg1Err,
    rowsCount: eSelOrg1?.length ?? 0,
    ...(eSelOrg1Err && { error: eSelOrg1Err.message }),
  });

  // SELECT org2
  const { data: eSelOrg2, error: eSelOrg2Err } = await supabase
    .from("entregas")
    .select("id")
    .eq("cooperativa_id", ORG2);
  results.push({
    table: "entregas",
    step: "select_org2",
    ok: !eSelOrg2Err,
    rowsCount: eSelOrg2?.length ?? 0,
    ...(eSelOrg2Err && { error: eSelOrg2Err.message }),
  });

  // INSERT org1 entrega
  if (parcForOrg1?.id && (parcForOrg1.productor_id || prodIdOrg1)) {
    const { data: eInsOrg1, error: eInsOrg1Err } = await supabase
      .from("entregas")
      .insert({
        cooperativa_id: ORG1,
        productor_id: parcForOrg1.productor_id ?? prodIdOrg1,
        parcela_id: parcForOrg1.id,
        fecha: new Date().toISOString().split("T")[0],
        cantidad_kg: 0.01,
        tipo_cafe: "cherry",
      })
      .select("id");
    results.push({
      table: "entregas",
      step: "insert_org1",
      ok: !eInsOrg1Err,
      rowsCount: eInsOrg1?.length ?? 0,
      ...(eInsOrg1Err && { error: eInsOrg1Err.message }),
    });
  } else {
    results.push({
      table: "entregas",
      step: "insert_org1",
      ok: false,
      error: "no parcela found in org1 for FK",
    });
  }

  // INSERT org2 entrega
  if (parcForOrg2?.id && (parcForOrg2.productor_id || prodIdOrg2)) {
    const { data: eInsOrg2, error: eInsOrg2Err } = await supabase
      .from("entregas")
      .insert({
        cooperativa_id: ORG2,
        productor_id: parcForOrg2.productor_id ?? prodIdOrg2,
        parcela_id: parcForOrg2.id,
        fecha: new Date().toISOString().split("T")[0],
        cantidad_kg: 0.01,
        tipo_cafe: "cherry",
      })
      .select("id");
    results.push({
      table: "entregas",
      step: "insert_org2",
      ok: !eInsOrg2Err,
      rowsCount: eInsOrg2?.length ?? 0,
      ...(eInsOrg2Err && { error: eInsOrg2Err.message }),
    });
  } else {
    results.push({
      table: "entregas",
      step: "insert_org2",
      ok: false,
      error: "no parcela found in org2 for FK",
    });
  }

  // ── Cleanup test rows ────────────────────────────────────
  const adminClient = createClient(
    supabaseUrl,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );
  await adminClient
    .from("entregas")
    .delete()
    .like("cantidad_kg", "0.01")
    .or("cooperativa_id.eq." + ORG1 + ",cooperativa_id.eq." + ORG2);
  await adminClient
    .from("parcelas")
    .delete()
    .like("nombre", "_rls_%");
  await adminClient
    .from("productores")
    .delete()
    .like("nombre", "_rls_%");

  return new Response(
    JSON.stringify({ caller_org_id: callerOrgId, results }, null, 2),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
