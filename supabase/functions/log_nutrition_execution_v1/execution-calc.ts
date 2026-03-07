/**
 * Lógica pura de cálculo de % ejecución nutricional.
 * Exportada para tests unitarios.
 */

export const WEIGHTS = { N: 0.35, K2O: 0.35, P2O5: 0.15, otros: 0.15 } as const;

export type DosisNutrientes = {
  N_kg_ha?: number;
  P2O5_kg_ha?: number;
  K2O_kg_ha?: number;
  CaO_kg_ha?: number;
  MgO_kg_ha?: number;
  micros?: Record<string, number>;
};

export type DemandaFinal = {
  N_kg_ha?: number;
  P2O5_kg_ha?: number;
  K2O_kg_ha?: number;
  CaO_kg_ha?: number;
  MgO_kg_ha?: number;
  micronutrientes?: Record<string, number>;
};

export function sumNutrientes(nutrientes: DosisNutrientes): DosisNutrientes {
  const out: DosisNutrientes = {};
  if (nutrientes.N_kg_ha != null) out.N_kg_ha = nutrientes.N_kg_ha;
  if (nutrientes.P2O5_kg_ha != null) out.P2O5_kg_ha = nutrientes.P2O5_kg_ha;
  if (nutrientes.K2O_kg_ha != null) out.K2O_kg_ha = nutrientes.K2O_kg_ha;
  if (nutrientes.CaO_kg_ha != null) out.CaO_kg_ha = nutrientes.CaO_kg_ha;
  if (nutrientes.MgO_kg_ha != null) out.MgO_kg_ha = nutrientes.MgO_kg_ha;
  if (nutrientes.micros && typeof nutrientes.micros === "object") {
    out.micros = { ...nutrientes.micros };
  }
  return out;
}

export function addNutrientes(acc: DosisNutrientes, add: DosisNutrientes): DosisNutrientes {
  return {
    N_kg_ha: (acc.N_kg_ha ?? 0) + (add.N_kg_ha ?? 0),
    P2O5_kg_ha: (acc.P2O5_kg_ha ?? 0) + (add.P2O5_kg_ha ?? 0),
    K2O_kg_ha: (acc.K2O_kg_ha ?? 0) + (add.K2O_kg_ha ?? 0),
    CaO_kg_ha: (acc.CaO_kg_ha ?? 0) + (add.CaO_kg_ha ?? 0),
    MgO_kg_ha: (acc.MgO_kg_ha ?? 0) + (add.MgO_kg_ha ?? 0),
    micros: mergeMicros(acc.micros, add.micros),
  };
}

function mergeMicros(a?: Record<string, number>, b?: Record<string, number>): Record<string, number> | undefined {
  if (!a && !b) return undefined;
  const out: Record<string, number> = { ...(a ?? {}) };
  for (const [k, v] of Object.entries(b ?? {})) {
    out[k] = (out[k] ?? 0) + v;
  }
  return Object.keys(out).length ? out : undefined;
}

function pct(aplicado: number, recomendado: number): number {
  if (recomendado <= 0) return 100;
  return Math.min(100, Math.round((aplicado / recomendado) * 10000) / 100);
}

function totalMicros(m?: Record<string, number>): number {
  if (!m) return 0;
  return Object.values(m).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
}

function totalMicrosDemanda(d?: Record<string, number>): number {
  if (!d) return 0;
  return Object.values(d).reduce((s, v) => s + (typeof v === "number" ? v : 0), 0);
}

export function computeExecutionPct(
  acumulado: DosisNutrientes,
  demanda: DemandaFinal
): { execution_pct_by_nutrient: Record<string, number>; execution_pct_total: number } {
  const recN = demanda.N_kg_ha ?? 0;
  const recP = demanda.P2O5_kg_ha ?? 0;
  const recK = demanda.K2O_kg_ha ?? 0;
  const recCa = demanda.CaO_kg_ha ?? 0;
  const recMg = demanda.MgO_kg_ha ?? 0;
  const recMicros = totalMicrosDemanda(demanda.micronutrientes);

  const appN = acumulado.N_kg_ha ?? 0;
  const appP = acumulado.P2O5_kg_ha ?? 0;
  const appK = acumulado.K2O_kg_ha ?? 0;
  const appCa = acumulado.CaO_kg_ha ?? 0;
  const appMg = acumulado.MgO_kg_ha ?? 0;
  const appMicros = totalMicros(acumulado.micros);

  const pctN = pct(appN, recN);
  const pctP = pct(appP, recP);
  const pctK = pct(appK, recK);
  const recOtros = recCa + recMg + recMicros;
  const appOtros = appCa + appMg + appMicros;
  const pctOtros = pct(appOtros, recOtros);

  const execution_pct_by_nutrient: Record<string, number> = {
    N: pctN,
    P2O5: pctP,
    K2O: pctK,
    otros: pctOtros,
  };

  const execution_pct_total = Math.min(
    100,
    Math.round(
      (pctN * WEIGHTS.N + pctP * WEIGHTS.P2O5 + pctK * WEIGHTS.K2O + pctOtros * WEIGHTS.otros) * 100
    ) / 100
  );

  return { execution_pct_by_nutrient, execution_pct_total };
}
