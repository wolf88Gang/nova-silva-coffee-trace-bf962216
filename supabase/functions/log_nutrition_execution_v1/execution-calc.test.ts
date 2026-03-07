/**
 * Tests unitarios para execution-calc.ts
 * Ejecutar: deno test execution-calc.test.ts
 */
import {
  addNutrientes,
  computeExecutionPct,
  sumNutrientes,
  type DosisNutrientes,
  type DemandaFinal,
} from "./execution-calc.ts";

// 1. Acumulación suma correctamente
Deno.test("addNutrientes: suma correctamente N, P, K", () => {
  const a: DosisNutrientes = { N_kg_ha: 45, P2O5_kg_ha: 10, K2O_kg_ha: 40 };
  const b: DosisNutrientes = { N_kg_ha: 45, P2O5_kg_ha: 10, K2O_kg_ha: 40 };
  const result = addNutrientes(a, b);
  if (result.N_kg_ha !== 90 || result.P2O5_kg_ha !== 20 || result.K2O_kg_ha !== 80) {
    throw new Error(`Expected {N:90,P:20,K:80}, got ${JSON.stringify(result)}`);
  }
});

Deno.test("addNutrientes: acumula desde vacío", () => {
  const acc: DosisNutrientes = {};
  const add: DosisNutrientes = { N_kg_ha: 50, K2O_kg_ha: 60 };
  const result = addNutrientes(acc, add);
  if (result.N_kg_ha !== 50 || result.K2O_kg_ha !== 60) {
    throw new Error(`Expected {N:50,K:60}, got ${JSON.stringify(result)}`);
  }
});

// 2. execution_pct no supera 100
Deno.test("computeExecutionPct: no supera 100 cuando aplicado > recomendado", () => {
  const acumulado: DosisNutrientes = { N_kg_ha: 200, P2O5_kg_ha: 100, K2O_kg_ha: 200 };
  const demanda: DemandaFinal = { N_kg_ha: 180, P2O5_kg_ha: 45, K2O_kg_ha: 160 };
  const { execution_pct_total } = computeExecutionPct(acumulado, demanda);
  if (execution_pct_total > 100) {
    throw new Error(`execution_pct_total must not exceed 100, got ${execution_pct_total}`);
  }
});

Deno.test("computeExecutionPct: retorna 100 cuando aplicado >= recomendado en todos", () => {
  const acumulado: DosisNutrientes = { N_kg_ha: 180, P2O5_kg_ha: 45, K2O_kg_ha: 160 };
  const demanda: DemandaFinal = { N_kg_ha: 180, P2O5_kg_ha: 45, K2O_kg_ha: 160 };
  const { execution_pct_total, execution_pct_by_nutrient } = computeExecutionPct(acumulado, demanda);
  if (execution_pct_total !== 100) {
    throw new Error(`Expected 100, got ${execution_pct_total}`);
  }
  if (execution_pct_by_nutrient.N !== 100 || execution_pct_by_nutrient.K2O !== 100) {
    throw new Error(`Expected all 100, got ${JSON.stringify(execution_pct_by_nutrient)}`);
  }
});

// 3. Primera ejecución parcial → porcentajes correctos
Deno.test("computeExecutionPct: primera ejecución 25% de N y K", () => {
  const demanda: DemandaFinal = { N_kg_ha: 180, P2O5_kg_ha: 45, K2O_kg_ha: 160 };
  const acumulado: DosisNutrientes = { N_kg_ha: 45, P2O5_kg_ha: 0, K2O_kg_ha: 40 };
  const { execution_pct_by_nutrient, execution_pct_total } = computeExecutionPct(acumulado, demanda);
  const pctN = (45 / 180) * 100;
  const pctK = (40 / 160) * 100;
  if (Math.abs(execution_pct_by_nutrient.N - pctN) > 0.1) {
    throw new Error(`N: expected ~${pctN}, got ${execution_pct_by_nutrient.N}`);
  }
  if (Math.abs(execution_pct_by_nutrient.K2O - pctK) > 0.1) {
    throw new Error(`K2O: expected ~${pctK}, got ${execution_pct_by_nutrient.K2O}`);
  }
  if (execution_pct_total > 100 || execution_pct_total < 0) {
    throw new Error(`execution_pct_total out of range: ${execution_pct_total}`);
  }
});

// 4. sumNutrientes preserva estructura
Deno.test("sumNutrientes: preserva micros", () => {
  const n: DosisNutrientes = { N_kg_ha: 10, micros: { B: 0.2, Zn: 0.3 } };
  const result = sumNutrientes(n);
  if (!result.micros || result.micros.B !== 0.2 || result.micros.Zn !== 0.3) {
    throw new Error(`Expected micros {B:0.2,Zn:0.3}, got ${JSON.stringify(result.micros)}`);
  }
});
