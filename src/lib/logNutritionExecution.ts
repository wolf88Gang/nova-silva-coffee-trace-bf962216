import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/log_nutrition_execution_v1';

type JSONValue = string | number | boolean | null | { [k: string]: JSONValue } | JSONValue[];

export interface ExecutionInput {
  plan_id: string;
  fecha_aplicacion: string; // YYYY-MM-DD
  idempotency_key: string;
  tipo_aplicacion?: 'edafica' | 'foliar' | 'fertirriego' | 'otro';
  dosis_aplicada_json?: { nutrientes: Record<string, number> };
  evidencias?: Record<string, JSONValue>;
  costo_real?: number;
  fase_objetivo?: string;
  producto_aplicado?: string;
  cantidad_aplicada_kg?: number;
  notas?: string;
}

export interface ExecutionResult {
  data: {
    id: string;
    plan_id: string;
    organization_id: string;
    fecha_aplicacion: string;
  };
  execution: {
    pct_total: number;
    pct_by_nutrient: Record<string, number>;
    estado: string;
  };
  cached: boolean;
}

export async function logNutritionExecution(input: ExecutionInput): Promise<ExecutionResult> {
  const session = (await supabase.auth.getSession()).data.session;
  if (!session) throw new Error('No hay sesión autenticada.');

  const res = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.detail || data?.error || `Error ${res.status}`);
  }
  return data as ExecutionResult;
}
