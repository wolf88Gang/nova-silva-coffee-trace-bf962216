/**
 * Tests para quote-engine.ts
 * Ejecutar: deno test quote-engine.test.ts --allow-read
 */
import {
  haversineKm,
  translateDemandaToProducts,
  type SupplierProduct,
} from "./quote-engine.ts";

Deno.test("haversineKm: distancia conocida", () => {
  const d = haversineKm(9.9, -84.0, 10.0, -84.0);
  if (d < 10 || d > 15) throw new Error(`Expected ~11 km, got ${d}`);
});

Deno.test("Sugerencia proveedores: orden por distancia", () => {
  const suppliers = [
    { lat: 10.0, lng: -84.0 },
    { lat: 9.5, lng: -84.0 },
    { lat: 10.5, lng: -84.0 },
  ];
  const parcela = { lat: 10.0, lng: -84.0 };
  const withDist = suppliers.map((s) => ({
    ...s,
    distancia_km: haversineKm(parcela.lat, parcela.lng, s.lat, s.lng),
  }));
  withDist.sort((a, b) => a.distancia_km - b.distancia_km);
  if (withDist[0].distancia_km > 1) throw new Error(`Closest should be ~0, got ${withDist[0].distancia_km}`);
});

Deno.test("NO_KCL: excluye KCl y usa SOP", () => {
  const products: SupplierProduct[] = [
    { id: "1", nombre_producto: "Cloruro de potasio", tipo: "K", analisis_json: { K2O_pct: 60 }, precio_unitario: 1, moneda: "USD", unidad: "kg" },
    { id: "2", nombre_producto: "Sulfato de potasio SOP", tipo: "K", analisis_json: { K2O_pct: 50 }, precio_unitario: 1.5, moneda: "USD", unidad: "kg" },
  ];
  const { lines, explain } = translateDemandaToProducts(
    { K2O_kg_ha: 100 },
    products,
    ["NO_KCL"],
    "media"
  );
  const kLine = lines.find((l) => l.nutriente_contrib.K2O_kg_ha);
  if (!kLine) throw new Error("Expected K line");
  if (kLine.nombre_producto.toLowerCase().includes("cloruro")) {
    throw new Error("NO_KCL should force SOP, not KCl");
  }
  if (!explain.some((e) => e.includes("NO_KCL"))) {
    throw new Error("Explain should mention NO_KCL");
  }
});

Deno.test("Conversión nutriente→producto: N 180 kg con urea 46%", () => {
  const products: SupplierProduct[] = [
    { id: "1", nombre_producto: "Urea", tipo: "N", analisis_json: { N_pct: 46 }, precio_unitario: 0.8, moneda: "USD", unidad: "kg" },
  ];
  const { lines, total } = translateDemandaToProducts(
    { N_kg_ha: 180 },
    products,
    [],
    "media"
  );
  const nLine = lines[0];
  const kgExpected = 180 / 0.46;
  if (Math.abs(nLine.kg_ha - kgExpected) > 1) {
    throw new Error(`Expected ~${kgExpected} kg, got ${nLine.kg_ha}`);
  }
  if (total !== Math.round(nLine.kg_ha * 0.8 * 100) / 100) {
    throw new Error(`Total mismatch: ${total}`);
  }
});

Deno.test("Idempotencia: mismo input mismo output", () => {
  const products: SupplierProduct[] = [
    { id: "1", nombre_producto: "Urea", tipo: "N", analisis_json: { N_pct: 46 }, precio_unitario: 1, moneda: "USD", unidad: "kg" },
  ];
  const r1 = translateDemandaToProducts({ N_kg_ha: 100 }, products, [], "media");
  const r2 = translateDemandaToProducts({ N_kg_ha: 100 }, products, [], "media");
  if (r1.total !== r2.total || r1.lines.length !== r2.lines.length) {
    throw new Error("Same input should produce same output");
  }
});
