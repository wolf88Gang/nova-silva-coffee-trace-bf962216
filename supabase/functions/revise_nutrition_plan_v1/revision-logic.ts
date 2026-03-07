/**
 * Lógica pura de revisión de planes. Exportada para tests.
 */

export const YIELD_ALTO_THRESHOLD = 2500;
export const VARIEDADES_INTENSIVAS = ["compacto", "compuesto", "f1"];

export function extractDemanda(receta: Record<string, unknown>): Record<string, number> {
  const calc = receta.calculo_nutricional as Record<string, unknown> | undefined;
  const df = (calc?.demanda_final ?? receta.demanda_final ?? receta.demanda_calculada) as Record<string, unknown> | undefined;
  if (!df || typeof df !== "object") return {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(df)) {
    if (typeof v === "number") out[k] = v;
    else if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      for (const [k2, v2] of Object.entries(v as Record<string, unknown>)) {
        if (typeof v2 === "number") out[`${k2}_kg_ha`] = v2;
      }
    }
  }
  if (df.N_kg_ha != null) out.N_kg_ha = df.N_kg_ha as number;
  if (df.P2O5_kg_ha != null) out.P2O5_kg_ha = df.P2O5_kg_ha as number;
  if (df.K2O_kg_ha != null) out.K2O_kg_ha = df.K2O_kg_ha as number;
  return out;
}

export function hasBloqueoEncalado(receta: Record<string, unknown>): boolean {
  const diag = receta.diagnostico_edafico as Record<string, unknown> | undefined;
  const bloqueos = (diag?.bloqueos ?? receta.bloqueos ?? []) as Array<{ explain_code?: string }>;
  return bloqueos.some((b) => /encalado|pH|SOIL_PH_CRITICAL/i.test(b.explain_code ?? ""));
}

export function isVariedadIntensiva(receta: Record<string, unknown>): boolean {
  const ctx = receta.contexto as Record<string, unknown> | undefined;
  const variedades = (ctx?.variedades_vector ?? receta.variedades ?? []) as Array<{ grupo_morfologico?: string }>;
  return variedades.some((v) => VARIEDADES_INTENSIVAS.includes((v.grupo_morfologico ?? "").toLowerCase()));
}

export function getYieldProyectado(receta: Record<string, unknown>): number {
  const inp = receta.inputs_tecnicos ?? receta.inputs ?? receta.contexto as Record<string, unknown>;
  return (inp?.rendimiento_proyectado_kg ?? inp?.rendimiento_proyectado_kg_ha ?? 0) as number;
}

export function applyAdjustments(
  receta: Record<string, unknown>,
  adjustments: Record<string, unknown>
): { receta: Record<string, unknown>; error?: string } {
  const recetaCopy = JSON.parse(JSON.stringify(receta)) as Record<string, unknown>;
  const demanda = extractDemanda(recetaCopy);
  const nutrientesAdj = (adjustments.nutrientes ?? {}) as Record<string, { delta?: number; reason_code?: string }>;
  const cronogramaAdj = (adjustments.cronograma ?? {}) as Record<string, unknown>;

  const yieldProy = getYieldProyectado(recetaCopy);
  const yieldAlto = yieldProy >= YIELD_ALTO_THRESHOLD;
  const variedadIntensiva = isVariedadIntensiva(recetaCopy);
  const bloqueoEncalado = hasBloqueoEncalado(recetaCopy);

  for (const [nutKey, adj] of Object.entries(nutrientesAdj)) {
    const delta = adj?.delta ?? 0;
    const original = demanda[nutKey] ?? demanda[`${nutKey}_kg_ha`] ?? 0;
    const nuevo = Math.max(0, original + delta);

    if (nutKey === "N_kg_ha" || nutKey === "N") {
      const pctChange = original > 0 ? ((original - nuevo) / original) * 100 : 0;
      if (delta < 0 && yieldAlto && variedadIntensiva && pctChange > 30) {
        return { receta: recetaCopy, error: "N no puede bajar más de 30% con yield alto y variedad intensiva" };
      }
    }
    if (nutKey === "K2O_kg_ha" || nutKey === "K2O") {
      const pctChange = original > 0 ? ((original - nuevo) / original) * 100 : 0;
      if (delta < 0 && pctChange > 25) {
        return { receta: recetaCopy, error: "K2O no puede bajar más de 25%" };
      }
    }
  }

  if (bloqueoEncalado) {
    const intentaSaltarEncalado = Object.entries(nutrientesAdj).some(([k, adj]) => {
      if (!/N_kg_ha|N\b|P2O5|K2O/.test(k)) return false;
      const d = (adj as { delta?: number })?.delta ?? 0;
      return d > 0;
    });
    if (intentaSaltarEncalado) {
      return { receta: recetaCopy, error: "No se puede saltar encalado en suelos ácidos: no aplicar NPK sin encalado previo" };
    }
  }

  const calc = (recetaCopy.calculo_nutricional ?? recetaCopy) as Record<string, unknown>;
  const df = (calc.demanda_final ?? recetaCopy.demanda_final ?? recetaCopy.demanda_calculada ?? {}) as Record<string, number>;
  for (const [nutKey, adj] of Object.entries(nutrientesAdj)) {
    const delta = (adj as { delta?: number })?.delta ?? 0;
    const key = nutKey.includes("_kg_ha") ? nutKey : `${nutKey}_kg_ha`;
    const orig = (df[key] ?? df[nutKey] ?? 0) as number;
    df[key] = Math.max(0, orig + delta);
  }
  if (calc && "demanda_final" in calc) calc.demanda_final = df;
  else if (recetaCopy.demanda_final) recetaCopy.demanda_final = df;
  else recetaCopy.demanda_calculada = df;

  const shiftDays = cronogramaAdj.shift_days as number | undefined;
  if (typeof shiftDays === "number" && shiftDays !== 0) {
    const crono = (recetaCopy.cronograma ?? (recetaCopy.calculo_nutricional as Record<string, unknown>)?.cronograma ?? []) as Array<Record<string, unknown>>;
    for (const item of crono) {
      const f = item.fecha_proyectada as string | undefined;
      if (f) {
        const d = new Date(f);
        d.setDate(d.getDate() + shiftDays);
        item.fecha_proyectada = d.toISOString().slice(0, 10);
      }
    }
  }

  return { receta: recetaCopy };
}
