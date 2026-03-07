/**
 * Lógica de traducción nutrientes → productos. Exportada para tests.
 */

export function haversineKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export type DemandaNutrientes = {
  N_kg_ha?: number;
  P2O5_kg_ha?: number;
  K2O_kg_ha?: number;
  CaO_kg_ha?: number;
  MgO_kg_ha?: number;
};

export type ProductoAnalisis = {
  N_pct?: number;
  P2O5_pct?: number;
  K2O_pct?: number;
  K2O_equiv_pct?: number;
};

export type SupplierProduct = {
  id: string;
  nombre_producto: string;
  tipo: string;
  analisis_json: Record<string, number>;
  precio_unitario: number;
  moneda: string;
  unidad: string;
};

export type QuoteLine = {
  product_id: string;
  nombre_producto: string;
  kg_ha: number;
  precio_unitario: number;
  subtotal: number;
  moneda: string;
  nutriente_contrib: Record<string, number>;
};

function kgProductForNutrient(
  kgNutrient: number,
  pctInProduct: number
): number {
  if (!pctInProduct || pctInProduct <= 0) return 0;
  return Math.ceil((kgNutrient / (pctInProduct / 100)) * 100) / 100;
}

export function translateDemandaToProducts(
  demanda: DemandaNutrientes,
  products: SupplierProduct[],
  constraints: string[],
  zonaAltitudinal: string
): { lines: QuoteLine[]; total: number; moneda: string; explain: string[] } {
  const lines: QuoteLine[] = [];
  const explain: string[] = [];
  let total = 0;
  let moneda = "USD";

  const noKcl = constraints.includes("NO_KCL");
  const organicOnly = constraints.includes("ORGANIC_ONLY");
  const zonaBaja = zonaAltitudinal === "baja";

  const nProducts = products.filter(
    (p) => p.tipo === "N" || p.tipo === "NPK"
  );
  const pProducts = products.filter(
    (p) => p.tipo === "P" || p.tipo === "NPK"
  );
  const kProducts = products.filter((p) => {
    if (p.tipo !== "K" && p.tipo !== "NPK") return false;
    if (noKcl) {
      const name = (p.nombre_producto ?? "").toLowerCase();
      if (name.includes("cloruro") || name.includes("kcl") || name.includes("cloruro de potasio")) return false;
    }
    return true;
  });

  const nReq = demanda.N_kg_ha ?? 0;
  if (nReq > 0 && nProducts.length > 0) {
    let best = nProducts[0];
    for (const p of nProducts) {
      const anal = (p.analisis_json ?? {}) as ProductoAnalisis;
      const nPct = anal.N_pct ?? 0;
      if (zonaBaja && (p.nombre_producto ?? "").toLowerCase().includes("urea") && nProducts.some((x) => (x.nombre_producto ?? "").toLowerCase().includes("nitrato"))) {
        continue;
      }
      if (nPct > 0) {
        best = p;
        break;
      }
    }
    const anal = (best.analisis_json ?? {}) as ProductoAnalisis;
    const nPct = anal.N_pct ?? 46;
    const kg = kgProductForNutrient(nReq, nPct);
    const subtotal = kg * best.precio_unitario;
    lines.push({
      product_id: best.id,
      nombre_producto: best.nombre_producto,
      kg_ha: kg,
      precio_unitario: best.precio_unitario,
      subtotal,
      moneda: best.moneda ?? "USD",
      nutriente_contrib: { N_kg_ha: nReq },
    });
    total += subtotal;
    moneda = best.moneda ?? moneda;
    explain.push(`N: ${nReq} kg/ha → ${best.nombre_producto} (${nPct}% N) = ${kg} kg`);
  }

  const pReq = demanda.P2O5_kg_ha ?? 0;
  if (pReq > 0 && pProducts.length > 0) {
    const best = pProducts.find((p) => ((p.analisis_json ?? {}) as ProductoAnalisis).P2O5_pct) ?? pProducts[0];
    const anal = (best.analisis_json ?? {}) as ProductoAnalisis;
    const pPct = anal.P2O5_pct ?? 46;
    const kg = kgProductForNutrient(pReq, pPct);
    const subtotal = kg * best.precio_unitario;
    lines.push({
      product_id: best.id,
      nombre_producto: best.nombre_producto,
      kg_ha: kg,
      precio_unitario: best.precio_unitario,
      subtotal,
      moneda: best.moneda ?? "USD",
      nutriente_contrib: { P2O5_kg_ha: pReq },
    });
    total += subtotal;
    explain.push(`P2O5: ${pReq} kg/ha → ${best.nombre_producto} (${pPct}% P2O5) = ${kg} kg`);
  }

  const kReq = demanda.K2O_kg_ha ?? 0;
  if (kReq > 0 && kProducts.length > 0) {
    const best = kProducts[0];
    const anal = (best.analisis_json ?? {}) as ProductoAnalisis;
    const kPct = anal.K2O_pct ?? anal.K2O_equiv_pct ?? 50;
    const kg = kgProductForNutrient(kReq, kPct);
    const subtotal = kg * best.precio_unitario;
    lines.push({
      product_id: best.id,
      nombre_producto: best.nombre_producto,
      kg_ha: kg,
      precio_unitario: best.precio_unitario,
      subtotal,
      moneda: best.moneda ?? "USD",
      nutriente_contrib: { K2O_kg_ha: kReq },
    });
    total += subtotal;
    if (noKcl) explain.push(`K2O: ${kReq} kg/ha → SOP (NO_KCL) ${best.nombre_producto} = ${kg} kg`);
    else explain.push(`K2O: ${kReq} kg/ha → ${best.nombre_producto} (${kPct}% K2O) = ${kg} kg`);
  }

  return { lines, total, moneda, explain };
}
