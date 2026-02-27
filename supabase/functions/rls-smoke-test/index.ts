/**
 * RLS Smoke Test — usa JWT del caller (NO service role).
 * Prueba SELECT/INSERT contra productores, parcelas y entregas para verificar RLS.
 *
 * Llamar con: Authorization: Bearer <session.access_token>
 * Siempre responde 200 con JSON estructurado (aunque haya 403 en operaciones).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ORG1 = "00000000-0000-0000-0000-000000000001";
const ORG2 = "00000000-0000-0000-0000-000000000002";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type ResultStep = {
  table: string;
  step: string;
  ok: boolean;
  rowsCount?: number;
  insertedId?: string;
  error?: string;
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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const results: ResultStep[] = [];
  let caller_user_id: string | null = null;
  let caller_org_id: string | null = null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    caller_user_id = user?.id ?? null;

    const rpcRes = caller_user_id
      ? await supabase.rpc("get_user_organization_id", { p_user_id: caller_user_id })
      : await supabase.rpc("current_org_id");
    caller_org_id = rpcRes.data ?? null;
  } catch (_e) {
    // seguir con nulls
  }

  const runSelect = async (
    table: string,
    orgId: string,
    step: string
  ): Promise<ResultStep> => {
    const { count, error } = await supabase
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq("cooperativa_id", orgId);
    return {
      table,
      step,
      ok: !error,
      rowsCount: error ? 0 : (count ?? 0),
      error: error ? error.message : undefined,
    };
  };

  const runInsert = async (
    table: string,
    orgId: string,
    step: string,
    payload: Record<string, unknown>
  ): Promise<ResultStep> => {
    const { data, error } = await supabase
      .from(table)
      .insert(payload)
      .select("id")
      .maybeSingle();
    return {
      table,
      step,
      ok: !error,
      insertedId: data?.id,
      error: error ? error.message : undefined,
    };
  };

  const getProductorId = async (orgId: string): Promise<string | null> => {
    const { data } = await supabase
      .from("productores")
      .select("id")
      .eq("cooperativa_id", orgId)
      .limit(1)
      .maybeSingle();
    return data?.id ?? null;
  };

  const tables = ["productores", "parcelas", "entregas"] as const;
  for (const table of tables) {
    results.push(await runSelect(table, ORG1, "select_org1"));
    results.push(await runSelect(table, ORG2, "select_org2"));

    if (table === "productores") {
      results.push(
        await runInsert(table, ORG1, "insert_org1", {
          cooperativa_id: ORG1,
          organization_id: ORG1,
          nombre: `Smoke ${Date.now()}`,
          cedula: "0000-00000-0000",
          comunidad: "Test",
        })
      );
      results.push(
        await runInsert(table, ORG2, "insert_org2", {
          cooperativa_id: ORG2,
          organization_id: ORG2,
          nombre: `Smoke ${Date.now()}`,
          cedula: "0000-00000-0000",
          comunidad: "Test",
        })
      );
    } else if (table === "parcelas") {
      const productorOrg1 = await getProductorId(ORG1);
      const productorOrg2 = await getProductorId(ORG2);
      results.push(
        await runInsert(table, ORG1, "insert_org1", {
          cooperativa_id: ORG1,
          organization_id: ORG1,
          nombre: "Parcela Smoke",
          productor_id: productorOrg1,
        })
      );
      results.push(
        await runInsert(table, ORG2, "insert_org2", {
          cooperativa_id: ORG2,
          organization_id: ORG2,
          nombre: "Parcela Smoke",
          productor_id: productorOrg2,
        })
      );
    } else if (table === "entregas") {
      const productorOrg1 = await getProductorId(ORG1);
      const productorOrg2 = await getProductorId(ORG2);
      const basePayload = (orgId: string, productorId: string | null) => ({
        cooperativa_id: orgId,
        organization_id: orgId,
        productor_id: productorId,
        fecha: new Date().toISOString().slice(0, 10),
        peso_kg: 1,
      });
      results.push(
        await runInsert(table, ORG1, "insert_org1", basePayload(ORG1, productorOrg1))
      );
      results.push(
        await runInsert(table, ORG2, "insert_org2", basePayload(ORG2, productorOrg2))
      );
    }
  }

  const body = {
    caller_user_id: caller_user_id,
    caller_org_id: caller_org_id,
    results,
  };

  return new Response(JSON.stringify(body, null, 2), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
