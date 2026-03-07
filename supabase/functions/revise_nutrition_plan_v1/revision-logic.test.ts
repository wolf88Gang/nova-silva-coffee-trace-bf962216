/**
 * Tests para revision-logic.ts
 * Ejecutar: deno test revision-logic.test.ts --allow-read
 */
import { applyAdjustments } from "./revision-logic.ts";

// Fixture: plan con yield alto y variedad intensiva
const recetaYieldAltoIntensivo = {
  contexto: { variedades_vector: [{ grupo_morfologico: "compacto" }] },
  inputs_tecnicos: { rendimiento_proyectado_kg_ha: 2800 },
  calculo_nutricional: {
    demanda_final: { N_kg_ha: 180, P2O5_kg_ha: 45, K2O_kg_ha: 160 },
  },
};

// Fixture: plan con bloqueo encalado
const recetaBloqueoEncalado = {
  diagnostico_edafico: { bloqueos: [{ explain_code: "SOIL_PH_CRITICAL_LOW" }] },
  calculo_nutricional: { demanda_final: { N_kg_ha: 180, K2O_kg_ha: 160 } },
};

Deno.test("Límites duros: N -35% con yield alto y variedad intensiva → rechaza", () => {
  const { error } = applyAdjustments(recetaYieldAltoIntensivo, {
    nutrientes: { N_kg_ha: { delta: -63, reason_code: "CASH" } },
  });
  if (!error || !error.includes("30%")) {
    throw new Error(`Expected error about N 30%, got: ${error}`);
  }
});

Deno.test("Límites duros: K2O -30% → rechaza", () => {
  const { error } = applyAdjustments(
    { calculo_nutricional: { demanda_final: { K2O_kg_ha: 160 } } },
    { nutrientes: { K2O_kg_ha: { delta: -48, reason_code: "CASH" } } }
  );
  if (!error || !error.includes("25%")) {
    throw new Error(`Expected error about K2O 25%, got: ${error}`);
  }
});

Deno.test("Límites duros: N -20% con yield alto → acepta", () => {
  const { error, receta } = applyAdjustments(recetaYieldAltoIntensivo, {
    nutrientes: { N_kg_ha: { delta: -36, reason_code: "CASH" } },
  });
  if (error) throw new Error(`Unexpected error: ${error}`);
  const df = (receta.calculo_nutricional as Record<string, unknown>).demanda_final as Record<string, number>;
  if (df.N_kg_ha !== 144) throw new Error(`Expected N=144, got ${df.N_kg_ha}`);
});

Deno.test("Bloqueo encalado: delta positivo en N → rechaza", () => {
  const { error } = applyAdjustments(recetaBloqueoEncalado, {
    nutrientes: { N_kg_ha: { delta: 10, reason_code: "X" } },
  });
  if (!error || !error.includes("encalado")) {
    throw new Error(`Expected error about encalado, got: ${error}`);
  }
});

Deno.test("Ajuste válido: N -15, shift_days 7", () => {
  const receta = {
    calculo_nutricional: { demanda_final: { N_kg_ha: 180, K2O_kg_ha: 160 } },
    cronograma: [{ fecha_proyectada: "2025-03-15" }],
  };
  const { error, receta: out } = applyAdjustments(receta, {
    nutrientes: { N_kg_ha: { delta: -15, reason_code: "CASH" } },
    cronograma: { shift_days: 7, reason_code: "RAIN" },
  });
  if (error) throw new Error(`Unexpected error: ${error}`);
  const df = (out.calculo_nutricional as Record<string, unknown>).demanda_final as Record<string, number>;
  if (df.N_kg_ha !== 165) throw new Error(`Expected N=165, got ${df.N_kg_ha}`);
  const crono = out.cronograma as Array<{ fecha_proyectada: string }>;
  if (crono[0].fecha_proyectada !== "2025-03-22") {
    throw new Error(`Expected fecha 2025-03-22, got ${crono[0].fecha_proyectada}`);
  }
});
