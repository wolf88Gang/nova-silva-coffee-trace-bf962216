import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  Sprout, Droplets, Leaf, AlertTriangle, CheckCircle, HelpCircle,
  FlaskConical, FileText, Zap, DollarSign, Calendar, Shield,
  ChevronDown, Beaker, Gauge,
} from 'lucide-react';

// ── Rangos Óptimos (Fase 1 §31-44) ──

const RANGOS_SUELO = {
  ph:       { bajo: 5.0, optMin: 5.3, optMax: 5.8, alto: 6.5, unidad: '', label: 'pH' },
  mo_pct:   { bajo: 3, optMin: 3, optMax: 6, alto: 6, unidad: '%', label: 'MO' },
  p_ppm:    { bajo: 10, optMin: 20, optMax: 30, alto: 40, unidad: 'ppm', label: 'P (Bray II)' },
  k_cmol:   { bajo: 0.3, optMin: 0.5, optMax: 0.8, alto: 1.0, unidad: 'cmol/kg', label: 'K' },
  ca_cmol:  { bajo: 3.0, optMin: 4.0, optMax: 8.0, alto: 10.0, unidad: 'cmol/kg', label: 'Ca' },
  mg_cmol:  { bajo: 0.8, optMin: 1.0, optMax: 2.5, alto: 3.5, unidad: 'cmol/kg', label: 'Mg' },
  al_cmol:  { bajo: 0, optMin: 0, optMax: 0.5, alto: 1.0, unidad: 'cmol/kg', label: 'Al' },
  s_ppm:    { bajo: 10, optMin: 12, optMax: 25, alto: 30, unidad: 'ppm', label: 'S' },
  fe_ppm:   { bajo: 10, optMin: 20, optMax: 100, alto: 150, unidad: 'ppm', label: 'Fe' },
  mn_ppm:   { bajo: 5, optMin: 10, optMax: 50, alto: 100, unidad: 'ppm', label: 'Mn' },
  cu_ppm:   { bajo: 0.5, optMin: 1, optMax: 5, alto: 10, unidad: 'ppm', label: 'Cu' },
  zn_ppm:   { bajo: 1.5, optMin: 3, optMax: 8, alto: 15, unidad: 'ppm', label: 'Zn' },
  b_ppm:    { bajo: 0.3, optMin: 0.5, optMax: 1.5, alto: 2.0, unidad: 'ppm', label: 'B' },
  cice:     { bajo: 10, optMin: 10, optMax: 20, alto: 25, unidad: 'cmol/kg', label: 'CICE' },
  sat_bases_pct: { bajo: 40, optMin: 50, optMax: 70, alto: 80, unidad: '%', label: 'Sat. Bases' },
};

const RANGOS_FOLIAR = {
  n_pct:  { bajo: 2.3, optMin: 2.5, optMax: 3.0, alto: 3.5, unidad: '%', label: 'N' },
  p_pct:  { bajo: 0.12, optMin: 0.16, optMax: 0.22, alto: 0.30, unidad: '%', label: 'P' },
  k_pct:  { bajo: 1.8, optMin: 2.3, optMax: 2.8, alto: 3.2, unidad: '%', label: 'K' },
  ca_pct: { bajo: 0.8, optMin: 1.0, optMax: 1.5, alto: 2.0, unidad: '%', label: 'Ca' },
  mg_pct: { bajo: 0.25, optMin: 0.30, optMax: 0.45, alto: 0.55, unidad: '%', label: 'Mg' },
  s_pct:  { bajo: 0.12, optMin: 0.15, optMax: 0.25, alto: 0.30, unidad: '%', label: 'S' },
  fe_ppm: { bajo: 50, optMin: 70, optMax: 200, alto: 300, unidad: 'ppm', label: 'Fe' },
  mn_ppm: { bajo: 30, optMin: 50, optMax: 200, alto: 300, unidad: 'ppm', label: 'Mn' },
  cu_ppm: { bajo: 5, optMin: 8, optMax: 20, alto: 30, unidad: 'ppm', label: 'Cu' },
  zn_ppm: { bajo: 10, optMin: 15, optMax: 40, alto: 60, unidad: 'ppm', label: 'Zn' },
  b_ppm:  { bajo: 25, optMin: 40, optMax: 80, alto: 100, unidad: 'ppm', label: 'B' },
};

// ── Demo Data (expanded with micronutrients, Al, CICE, S, etc.) ──

const DEMO_PARCELAS_ESTADO = [
  {
    parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', variedad: 'Castillo (60%) + Caturra (40%)',
    altitud_msnm: 1450, densidad_plantas_ha: 5200, sombra_pct: 45, pendiente_pct: 18, edad_anios: 4,
    suelo: { ph: 5.1, mo_pct: 4.8, p_ppm: 12, k_cmol: 0.35, ca_cmol: 4.2, mg_cmol: 1.1, al_cmol: 0.3, s_ppm: 14, fe_ppm: 85, mn_ppm: 42, cu_ppm: 2.1, zn_ppm: 3.8, b_ppm: 0.6, cice: 12.4, sat_bases_pct: 58, textura: 'Franco-arcilloso', fecha: '2026-01-15' },
    foliar: { n_pct: 2.8, p_pct: 0.15, k_pct: 2.1, ca_pct: 1.0, mg_pct: 0.32, s_pct: 0.18, fe_ppm: 120, mn_ppm: 85, cu_ppm: 12, zn_ppm: 18, b_ppm: 45, fecha: '2026-01-20' },
    interpretacion: 'Parcela en buen estado general. pH y MO dentro de rangos aceptables para café. El fósforo disponible (12 ppm) está en deficiencia según Bray II (óptimo 20-30 ppm), lo que puede limitar floración y cuajado. P foliar (0.15%) confirma la deficiencia — está justo debajo del umbral óptimo (0.16%). Relación Ca/Mg suelo = 3.8:1 (ideal 3-5:1), adecuada. Al intercambiable 0.3 cmol/kg es aceptable (< 0.5). CICE de 12.4 indica suelo intermedio con retención moderada. Saturación de bases 58% dentro del rango ideal (50-70%). Micronutrientes foliares en rangos normales. B suelo (0.6 ppm) adecuado. Recomendación: aplicación dirigida de DAP o roca fosfórica al inicio de lluvias para corregir P.',
  },
  {
    parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central', variedad: 'Caturra (80%) + Bourbon (20%)',
    altitud_msnm: 1320, densidad_plantas_ha: 4800, sombra_pct: 60, pendiente_pct: 25, edad_anios: 6,
    suelo: { ph: 4.6, mo_pct: 2.9, p_ppm: 6, k_cmol: 0.18, ca_cmol: 2.5, mg_cmol: 0.7, al_cmol: 1.8, s_ppm: 8, fe_ppm: 145, mn_ppm: 68, cu_ppm: 1.2, zn_ppm: 1.4, b_ppm: 0.2, cice: 8.2, sat_bases_pct: 32, textura: 'Franco', fecha: '2025-11-08' },
    foliar: { n_pct: 2.2, p_pct: 0.11, k_pct: 1.6, ca_pct: 0.7, mg_pct: 0.22, s_pct: 0.11, fe_ppm: 92, mn_ppm: 55, cu_ppm: 6, zn_ppm: 9, b_ppm: 28, fecha: '2025-11-15' },
    interpretacion: 'ALERTA CRÍTICA: Suelo con toxicidad por aluminio (Al 1.8 cmol/kg > 1.0 umbral crítico). pH 4.6 = acidez severa que BLOQUEA fertilización NPK convencional — eficiencia será < 35%. MO insuficiente (2.9% < 3%). P disponible en deficiencia severa (6 ppm). K muy bajo (0.18 cmol/kg). Saturación de bases 32% (< 40% = deficiencia Ca/Mg sistémica). Relación Ca/Mg = 3.6:1 aceptable pero valores absolutos insuficientes. Zn suelo crítico (1.4 ppm < 1.5 umbral). B suelo deficiente (0.2 ppm < 0.3). CICE baja (8.2) indica suelo con poca capacidad de retención. Deficiencias foliares generalizadas confirman: N 2.2% (bajo), P 0.11% (crítico), K 1.6% (bajo), Ca 0.7% (bajo), Mg 0.22% (bajo). ACCIÓN: encalado correctivo con cal dolomítica 1.5 ton/ha ANTES de cualquier fertilización. Luego incorporar 3 ton/ha compost para reconstruir MO y biología del suelo.',
  },
  {
    parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes', variedad: 'Geisha (70%) + SL28 (30%)',
    altitud_msnm: 1680, densidad_plantas_ha: 5500, sombra_pct: 35, pendiente_pct: 12, edad_anios: 3,
    suelo: { ph: 5.4, mo_pct: 5.2, p_ppm: 18, k_cmol: 0.42, ca_cmol: 5.8, mg_cmol: 1.5, al_cmol: 0.15, s_ppm: 18, fe_ppm: 62, mn_ppm: 35, cu_ppm: 3.5, zn_ppm: 5.2, b_ppm: 0.9, cice: 16.8, sat_bases_pct: 65, textura: 'Franco-arenoso', fecha: '2026-02-10' },
    foliar: { n_pct: 3.1, p_pct: 0.18, k_pct: 2.4, ca_pct: 1.2, mg_pct: 0.38, s_pct: 0.20, fe_ppm: 145, mn_ppm: 95, cu_ppm: 14, zn_ppm: 22, b_ppm: 55, fecha: '2026-02-15' },
    interpretacion: 'Parcela modelo con excelente balance nutricional. pH 5.4 óptimo para café. MO alta (5.2%) garantiza buena mineralización y capacidad buffer. CICE 16.8 intermedia-alta. Saturación bases 65% ideal. Al 0.15 cmol/kg sin riesgo. P disponible 18 ppm acercándose a adecuado (20-30). Relación Ca/Mg = 3.9:1 ideal. K/Mg = 0.28 adecuado (evita antagonismo). Micronutrientes suelo todos en rango. Zn y B foliares adecuados — importante para Geisha que requiere multiplicador micronutrientes 1.3x. Nota: Geisha a 1,680 msnm está en zona óptima de especialidad (>1,500 msnm). Sombra 35% ligeramente baja para Geisha — considerar aumentar a 40-45%. Estrategia: mantenimiento con fórmula balanceada. Potencial certificación 85+ pts SCA.',
  },
  {
    parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte', variedad: 'Colombia (100%)',
    altitud_msnm: 1180, densidad_plantas_ha: 4200, sombra_pct: 55, pendiente_pct: 30, edad_anios: 8,
    suelo: { ph: 4.3, mo_pct: 1.8, p_ppm: 4, k_cmol: 0.12, ca_cmol: 1.8, mg_cmol: 0.4, al_cmol: 3.2, s_ppm: 5, fe_ppm: 168, mn_ppm: 92, cu_ppm: 0.8, zn_ppm: 0.9, b_ppm: 0.15, cice: 6.5, sat_bases_pct: 22, textura: 'Arcilloso', fecha: '2025-09-20' },
    foliar: null,
    interpretacion: 'PARCELA EN ESTADO CRÍTICO. pH 4.3 = acidez extrema con toxicidad Al severa (3.2 cmol/kg — > 3x el umbral crítico). El Al destruye raíces absorbentes e impide captación de Ca, Mg y P. MO 1.8% = la más baja del portafolio, sin capacidad de mineralización N suficiente. P en deficiencia severa (4 ppm). K muy bajo (0.12 cmol/kg). Saturación bases solo 22% (crítico < 40%). CICE de 6.5 = suelo ligero que necesita fraccionar más. Cu suelo bajo (0.8 ppm < 1.0). Zn deficiente (0.9 ppm < 1.5). B deficiente (0.15 ppm). Fe excesivo (168 ppm) — típico de suelos muy ácidos. FALTA análisis foliar — urgente. Edad 8 años sin renovación + bajo registro insumos = RIESGO AGOTAMIENTO ESTRUCTURAL (§26 Fase 1). Pendiente 30% = eficiencia N reducida a 50% (§28). Plan de recuperación: (1) encalado 2 ton/ha cal dolomítica, (2) 5 ton/ha compost, (3) fertilización escalonada post-corrección. Requiere 2-3 ciclos.',
  },
  {
    parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde', variedad: 'Castillo (100%)',
    altitud_msnm: 1520, densidad_plantas_ha: 5000, sombra_pct: 40, pendiente_pct: 15, edad_anios: 5,
    suelo: { ph: 5.3, mo_pct: 4.1, p_ppm: 14, k_cmol: 0.38, ca_cmol: 4.5, mg_cmol: 1.2, al_cmol: 0.4, s_ppm: 16, fe_ppm: 72, mn_ppm: 38, cu_ppm: 2.8, zn_ppm: 4.1, b_ppm: 0.7, cice: 14.2, sat_bases_pct: 56, textura: 'Franco', fecha: '2026-02-28' },
    foliar: { n_pct: 2.9, p_pct: 0.16, k_pct: 2.3, ca_pct: 1.1, mg_pct: 0.35, s_pct: 0.17, fe_ppm: 110, mn_ppm: 78, cu_ppm: 11, zn_ppm: 16, b_ppm: 42, fecha: '2026-03-01' },
    interpretacion: 'Parcela en buen estado con nutrición adecuada. pH 5.3 aceptable. MO 4.1% en rango medio-óptimo. Al 0.4 cmol/kg en zona de alerta leve (0.5 = umbral), monitorear. CICE 14.2 intermedia. Saturación bases 56% adecuada. Relación Ca/Mg = 3.75:1 buena. K suelo 0.38 cmol/kg en deficiencia leve (0.3-0.5 = deficiente). K foliar 2.3% en límite inferior del rango óptimo (2.3-2.8%) — si desciende afectará llenado de grano y resistencia a enfermedades, especialmente crítico para Castillo con multiplicador demanda 1.15x. Relación N/K foliar 1.26:1 aceptable pero beneficiaría mayor proporción K en segunda fertilización. P foliar 0.16% justo en el umbral mínimo. B y Zn foliares adecuados. Recomendación: incrementar K en fórmula y monitorear P de cerca.',
  },
];

const DEMO_SUELO = [
  { id: 's1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2026-01-15', ph: 5.1, mo_pct: 4.8, p_ppm: 12, k_cmol: 0.35, ca_cmol: 4.2, mg_cmol: 1.1, al_cmol: 0.3, s_ppm: 14, fe_ppm: 85, mn_ppm: 42, cu_ppm: 2.1, zn_ppm: 3.8, b_ppm: 0.6, cice: 12.4, sat_bases_pct: 58, textura: 'Franco-arcilloso', interpretacion: 'Suelo con buena estructura. P en deficiencia (12 ppm < 20). K límite bajo. Al aceptable. Micronutrientes en rango. Sat. bases adecuada (58%).' },
  { id: 's2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central', fecha_muestreo: '2025-11-08', ph: 4.6, mo_pct: 2.9, p_ppm: 6, k_cmol: 0.18, ca_cmol: 2.5, mg_cmol: 0.7, al_cmol: 1.8, s_ppm: 8, fe_ppm: 145, mn_ppm: 68, cu_ppm: 1.2, zn_ppm: 1.4, b_ppm: 0.2, cice: 8.2, sat_bases_pct: 32, textura: 'Franco', interpretacion: 'BLOQUEO: Al tóxico (1.8 cmol/kg). pH ácido severo. P, K, Zn, B todos deficientes. Sat. bases crítica (32%). Requiere encalado antes de cualquier fertilización.' },
  { id: 's3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes', fecha_muestreo: '2026-02-10', ph: 5.4, mo_pct: 5.2, p_ppm: 18, k_cmol: 0.42, ca_cmol: 5.8, mg_cmol: 1.5, al_cmol: 0.15, s_ppm: 18, fe_ppm: 62, mn_ppm: 35, cu_ppm: 3.5, zn_ppm: 5.2, b_ppm: 0.9, cice: 16.8, sat_bases_pct: 65, textura: 'Franco-arenoso', interpretacion: 'Excelente perfil edáfico. Todos los parámetros en rango óptimo o adecuado. Al insignificante. CICE buena (16.8). P acercándose a óptimo (18 ppm).' },
  { id: 's4', parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte', fecha_muestreo: '2025-09-20', ph: 4.3, mo_pct: 1.8, p_ppm: 4, k_cmol: 0.12, ca_cmol: 1.8, mg_cmol: 0.4, al_cmol: 3.2, s_ppm: 5, fe_ppm: 168, mn_ppm: 92, cu_ppm: 0.8, zn_ppm: 0.9, b_ppm: 0.15, cice: 6.5, sat_bases_pct: 22, textura: 'Arcilloso', interpretacion: 'SUELO CRÍTICO. Al tóxico extremo (3.2 cmol/kg). Deficiencias múltiples: P, K, S, Cu, Zn, B. MO extremadamente baja. Fe excesivo por acidez. Requiere plan de recuperación de 2-3 ciclos.' },
  { id: 's5', parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde', fecha_muestreo: '2026-02-28', ph: 5.3, mo_pct: 4.1, p_ppm: 14, k_cmol: 0.38, ca_cmol: 4.5, mg_cmol: 1.2, al_cmol: 0.4, s_ppm: 16, fe_ppm: 72, mn_ppm: 38, cu_ppm: 2.8, zn_ppm: 4.1, b_ppm: 0.7, cice: 14.2, sat_bases_pct: 56, textura: 'Franco', interpretacion: 'Suelo aceptable. K y P en deficiencia leve. Al en zona de alerta (0.4 cmol/kg). Micronutrientes en rango. Monitorear pH y Al en próximo ciclo.' },
  { id: 's6', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2025-07-10', ph: 5.0, mo_pct: 4.5, p_ppm: 10, k_cmol: 0.30, ca_cmol: 3.9, mg_cmol: 1.0, al_cmol: 0.4, s_ppm: 12, fe_ppm: 90, mn_ppm: 45, cu_ppm: 1.9, zn_ppm: 3.2, b_ppm: 0.5, cice: 11.8, sat_bases_pct: 54, textura: 'Franco-arcilloso', interpretacion: 'Análisis anterior. Comparando con enero 2026: pH mejoró 5.0→5.1, P mejoró 10→12 ppm, Al bajó 0.4→0.3. Tendencia positiva.' },
];

const DEMO_HOJA = [
  { id: 'h1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1', fecha_muestreo: '2026-01-20', n_pct: 2.8, p_pct: 0.15, k_pct: 2.1, ca_pct: 1.0, mg_pct: 0.32, s_pct: 0.18, fe_ppm: 120, mn_ppm: 85, cu_ppm: 12, zn_ppm: 18, b_ppm: 45, interpretacion: 'N adecuado (2.8%). P ligeramente bajo (0.15% < 0.16% umbral). K bajo (2.1% < 2.3% umbral). Ca y Mg adecuados. Micronutrientes todos en rango. S adecuado. Incrementar fertilización fosfórica y potásica.' },
  { id: 'h2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central', fecha_muestreo: '2025-11-15', n_pct: 2.2, p_pct: 0.11, k_pct: 1.6, ca_pct: 0.7, mg_pct: 0.22, s_pct: 0.11, fe_ppm: 92, mn_ppm: 55, cu_ppm: 6, zn_ppm: 9, b_ppm: 28, interpretacion: 'Deficiencias múltiples: N bajo (2.2% < 2.5%), P crítico (0.11% < 0.12%), K bajo (1.6% < 1.8%), Ca bajo (0.7% < 0.8%), Mg bajo (0.22% < 0.25%), S bajo (0.11% < 0.12%). B bajo (28 ppm < 40). Fe bajo (92 < 70-200 rango pero bajo para deficiencia suelo). Refleja incapacidad del suelo ácido para suministrar nutrientes.' },
  { id: 'h3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes', fecha_muestreo: '2026-02-15', n_pct: 3.1, p_pct: 0.18, k_pct: 2.4, ca_pct: 1.2, mg_pct: 0.38, s_pct: 0.20, fe_ppm: 145, mn_ppm: 95, cu_ppm: 14, zn_ppm: 22, b_ppm: 55, interpretacion: 'Excelente balance nutricional. Todos los macro y micronutrientes dentro de rangos óptimos. N 3.1% excelente. P 0.18% adecuado. K 2.4% adecuado. Ca, Mg, S óptimos. Zn y B adecuados — importante para Geisha. Mantener plan actual.' },
  { id: 'h4', parcela_id: 'p5', parcela_nombre: 'Finca Monte Verde', fecha_muestreo: '2026-03-01', n_pct: 2.9, p_pct: 0.16, k_pct: 2.3, ca_pct: 1.1, mg_pct: 0.35, s_pct: 0.17, fe_ppm: 110, mn_ppm: 78, cu_ppm: 11, zn_ppm: 16, b_ppm: 42, interpretacion: 'Niveles adecuados en general. K justo en el límite inferior óptimo (2.3%). P en el umbral (0.16%). B adecuado (42 ppm). S aceptable (0.17%). Monitorear K y P en próximo ciclo — cualquier descenso podría afectar llenado de grano.' },
];

const DEMO_PLANES = [
  {
    id: 'plan1', parcela_id: 'p1', parcela_nombre: 'Finca La Esperanza — Lote 1',
    ciclo: '2026', objetivo: 'Optimización NPK para producción de especialidad',
    status: 'activo', created_at: '2026-01-25', nivel_confianza: 'Alto',
    interpretacion: 'Plan basado en análisis completo de suelo y foliar (nivel confianza: Alto). La fórmula 18-5-15 fue seleccionada por el déficit leve de P foliar (0.15%) y K foliar (2.1%). Multiplicador varietal ponderado: Castillo 60% (1.15) + Caturra 40% (1.00) = 1.09x. Ajuste por altitud 1,450 msnm (zona media): eficiencia óptima, 3-4 fraccionamientos. Costo total estimado $455/ha dentro del rango eficiente (ROI esperado: 3.2x a 25 qq/ha precio diferenciado). Enmienda calcárea en agosto es preventiva — ejecutar solo si pH < 5.0 en julio.',
    aplicaciones: [
      { id: 'a1', orden: 1, producto: 'NPK 18-5-15-6-2(MgO-S) granulado', dosis_por_ha: '350 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 185, notas: 'Primera fertilización post-floración. Aplicar en corona a 20cm del tallo.' },
      { id: 'a2', orden: 2, producto: 'Foliar K₂O + B + Zn (micronutrientes)', dosis_por_ha: '3 L/ha', metodo: 'Aspersión foliar', mes_aplicacion: 'Abril 2026', costo_estimado_usd: 45, notas: 'Complemento de K y micronutrientes para expansión rápida (60-120 días post-floración).' },
      { id: 'a3', orden: 3, producto: 'NPK 18-5-15-6-2(MgO-S) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Junio 2026', costo_estimado_usd: 160, notas: 'Segunda fertilización en fase llenado de grano. Reducir si lluvia excesiva.' },
      { id: 'a4', orden: 4, producto: 'Cal dolomítica (enmienda)', dosis_por_ha: '500 kg/ha', metodo: 'Al voleo incorporado', mes_aplicacion: 'Agosto 2026', costo_estimado_usd: 65, notas: 'Corrección preventiva de pH. Solo si pH < 5.0 en análisis de julio.' },
    ],
  },
  {
    id: 'plan2', parcela_id: 'p2', parcela_nombre: 'Finca El Roble — Lote Central',
    ciclo: '2026', objetivo: 'Plan correctivo — suelo ácido con baja MO y Al tóxico',
    status: 'borrador', created_at: '2026-02-20', nivel_confianza: 'Alto',
    interpretacion: 'PLAN CONDICIONADO por bloqueo de acidez (§10.1 Fase 1): pH 4.6 + Al 1.8 cmol/kg impide fertilización NPK directa. Eficiencia sin corrección: 30-40%. El plan inicia con enmienda y MO ANTES de NPK. Costo total $945/ha es alto pero necesario — sin corrección, inversión en NPK es desperdicio. Multiplicador Caturra 80% (1.00) + Bourbon 20% (0.90) = 0.98x. Pendiente 25% = eficiencia N 55% (§4.1.4). Post-ejecución esperado: pH 5.0-5.2, MO 3.5-4.0% para ciclo 2027. Análisis de control en septiembre obligatorio.',
    aplicaciones: [
      { id: 'a5', orden: 1, producto: 'Cal dolomítica', dosis_por_ha: '1500 kg/ha', metodo: 'Al voleo incorporado', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 195, notas: 'Corrección urgente Al + pH. Aplicar 60 días antes de primera fertilización.' },
      { id: 'a6', orden: 2, producto: 'Bocashi compostado', dosis_por_ha: '3000 kg/ha', metodo: 'En corona, incorporar', mes_aplicacion: 'Abril 2026', costo_estimado_usd: 280, notas: 'Reconstrucción de MO. Mínimo 45 días de compostaje previo.' },
      { id: 'a7', orden: 3, producto: 'NPK 20-5-20 + S', dosis_por_ha: '400 kg/ha', metodo: 'Al suelo, media luna', mes_aplicacion: 'Mayo 2026', costo_estimado_usd: 220, notas: 'Fertilización correctiva con mayor N y K. Solo después de encalado.' },
      { id: 'a8', orden: 4, producto: 'Foliar multimineral (Zn+B+Cu+Mn)', dosis_por_ha: '4 L/ha', metodo: 'Aspersión foliar', mes_aplicacion: 'Junio 2026', costo_estimado_usd: 55, notas: 'Aporte rápido de micronutrientes deficientes mientras se corrige suelo.' },
      { id: 'a9', orden: 5, producto: 'NPK 20-5-20 + S', dosis_por_ha: '350 kg/ha', metodo: 'Al suelo, media luna', mes_aplicacion: 'Agosto 2026', costo_estimado_usd: 195, notas: 'Segunda dosis correctiva.' },
    ],
  },
  {
    id: 'plan3', parcela_id: 'p3', parcela_nombre: 'Finca Las Nubes',
    ciclo: '2026', objetivo: 'Mantenimiento — parcela modelo con Geisha + SL28',
    status: 'activo', created_at: '2026-02-18', nivel_confianza: 'Alto',
    interpretacion: 'Plan de reposición para parcela en excelente condición. Geisha 70% requiere multiplicador micronutrientes 1.3x y restricción N tardío (§20.16). SL28 30% requiere mayor K en llenado. Vector varietal ponderado: Geisha 0.90 + SL28 0.95 = 0.915x base, pero 1.19x en micronutrientes. Con solo 2 aplicaciones edáficas + 1 foliar a $405/ha, es la parcela más eficiente. No requiere enmiendas. Zona alta 1,680 msnm: ciclo 9-10 meses, desplazar K 30 días (§4.4). Benchmark para comparar rendimiento.',
    aplicaciones: [
      { id: 'a10', orden: 1, producto: 'NPK 17-6-18-2(MgO) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Marzo 2026', costo_estimado_usd: 165, notas: 'Fertilización de mantenimiento. Suelo óptimo.' },
      { id: 'a11', orden: 2, producto: 'Foliar Zn+B+Mn (especialidad Geisha)', dosis_por_ha: '3 L/ha', metodo: 'Aspersión foliar', mes_aplicacion: 'Mayo 2026', costo_estimado_usd: 75, notas: 'Requisito Geisha: 3 aplicaciones foliares Zn+B mínimo por ciclo (§20.16).' },
      { id: 'a12', orden: 3, producto: 'NPK 17-6-18-2(MgO) granulado', dosis_por_ha: '300 kg/ha', metodo: 'Al suelo, banda lateral', mes_aplicacion: 'Julio 2026', costo_estimado_usd: 165, notas: 'Segunda dosis. K desplazado 30 días por zona alta.' },
    ],
  },
  {
    id: 'plan4', parcela_id: 'p4', parcela_nombre: 'Finca Agua Dulce — Lote Norte',
    ciclo: '2025', objetivo: 'Recuperación de parcela degradada — Ciclo 1 de 3',
    status: 'completado', created_at: '2025-03-10', nivel_confianza: 'Medio',
    interpretacion: 'Plan de recuperación ejecutado en 2025 (Ciclo 1/3). Nivel confianza MEDIO por falta de análisis foliar. Inversión $800/ha justificada por estado degradado. Resultados parciales: pH 4.3→4.7 (aún insuficiente, objetivo 5.0-5.2), MO 1.8→2.4% (objetivo 3.5%). Colombia multiplicador 1.12x pero no aplicable en suelo tan degradado — se usó plan heurístico (§5). Pendiente 30% = eficiencia N reducida a 50%. Flag activo: "Riesgo agotamiento estructural" (8 años sin renovación). Requiere ciclo 2 en 2026 para alcanzar niveles productivos mínimos.',
    aplicaciones: [
      { id: 'a13', orden: 1, producto: 'Cal viva', dosis_por_ha: '2000 kg/ha', metodo: 'Al voleo', mes_aplicacion: 'Marzo 2025', costo_estimado_usd: 240, notas: 'Corrección severa pH 4.3 + Al 3.2 cmol/kg.' },
      { id: 'a14', orden: 2, producto: 'Compost + gallinaza', dosis_por_ha: '5000 kg/ha', metodo: 'En corona incorporado', mes_aplicacion: 'Mayo 2025', costo_estimado_usd: 420, notas: 'Aporte masivo de MO para recuperar biología.' },
      { id: 'a15', orden: 3, producto: 'NPK 15-15-15 (balanceado)', dosis_por_ha: '250 kg/ha', metodo: 'Al suelo', mes_aplicacion: 'Julio 2025', costo_estimado_usd: 140, notas: 'Fertilización balanceada inicial. Modo heurístico.' },
    ],
  },
];

// ── Scoring helpers ──

type NutrientStatus = 'ok' | 'warning' | 'critical' | 'unknown';

function evalRange(value: number | null, rango: { bajo: number; optMin: number; optMax: number; alto: number }, invertForAl = false): NutrientStatus {
  if (value == null) return 'unknown';
  if (invertForAl) {
    if (value > rango.alto) return 'critical';
    if (value > rango.optMax) return 'warning';
    return 'ok';
  }
  if (value < rango.bajo) return 'critical';
  if (value < rango.optMin) return 'warning';
  if (value > rango.alto) return 'warning';
  return 'ok';
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'ok': return <CheckCircle className="h-3.5 w-3.5 text-success shrink-0" />;
    case 'warning': return <AlertTriangle className="h-3.5 w-3.5 text-warning shrink-0" />;
    case 'critical': return <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0" />;
    default: return <HelpCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />;
  }
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, string> = {
    ok: 'bg-success/10 text-success border-success/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
    unknown: 'bg-muted text-muted-foreground border-border',
  };
  const labels: Record<string, string> = { ok: 'Óptimo', warning: 'Atención', critical: 'Crítico', unknown: 'Sin datos' };
  return <Badge variant="outline" className={variants[status] ?? variants.unknown}>{labels[status] ?? status}</Badge>;
}

const PLAN_STATUS_COLORS: Record<string, string> = {
  borrador: 'bg-muted text-muted-foreground',
  activo: 'bg-success/10 text-success border-success/20',
  completado: 'bg-primary/10 text-primary border-primary/20',
};

function NutrientRow({ label, value, rango, invert }: { label: string; value: number | null; rango: { bajo: number; optMin: number; optMax: number; alto: number; unidad: string }; invert?: boolean }) {
  const st = evalRange(value, rango, invert);
  return (
    <div className="flex items-center justify-between py-1 border-b border-border/30 last:border-0">
      <div className="flex items-center gap-1.5">
        <StatusIcon status={st} />
        <span className="text-xs text-foreground">{label}</span>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className="font-mono font-semibold text-foreground">{value != null ? value : '—'}</span>
        <span className="text-muted-foreground">{rango.unidad}</span>
        <span className="text-[10px] text-muted-foreground/60">({rango.optMin}–{rango.optMax})</span>
      </div>
    </div>
  );
}

// ── Main Component ──

export default function NutricionTab() {
  const [subTab, setSubTab] = useState<'estado' | 'analisis' | 'planes'>('estado');

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {[
          { key: 'estado' as const, icon: Sprout, label: 'Estado Nutricional' },
          { key: 'analisis' as const, icon: FlaskConical, label: 'Análisis' },
          { key: 'planes' as const, icon: FileText, label: 'Planes' },
        ].map(t => (
          <Button key={t.key} size="sm" variant={subTab === t.key ? 'default' : 'outline'} onClick={() => setSubTab(t.key)}>
            <t.icon className="h-4 w-4 mr-1" /> {t.label}
          </Button>
        ))}
      </div>

      {subTab === 'estado' && <EstadoSection />}
      {subTab === 'analisis' && <AnalisisSection />}
      {subTab === 'planes' && <PlanesSection />}
    </div>
  );
}

// ── Estado Nutricional (expandable cards) ──

function EstadoSection() {
  return (
    <Accordion type="single" collapsible className="space-y-3">
      {DEMO_PARCELAS_ESTADO.map(p => {
        const phSt = evalRange(p.suelo.ph, RANGOS_SUELO.ph);
        const moSt = evalRange(p.suelo.mo_pct, RANGOS_SUELO.mo_pct);
        const alSt = evalRange(p.suelo.al_cmol, RANGOS_SUELO.al_cmol, true);
        const overall = [phSt, moSt, alSt].includes('critical') ? 'critical'
          : [phSt, moSt, alSt].includes('warning') ? 'warning'
          : 'ok';

        return (
          <AccordionItem key={p.parcela_id} value={p.parcela_id} className="border rounded-lg bg-card">
            <AccordionTrigger className="px-4 py-3 hover:no-underline">
              <div className="flex items-center gap-3 w-full mr-2">
                <Sprout className="h-5 w-5 text-primary shrink-0" />
                <div className="text-left flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.parcela_nombre}</p>
                  <p className="text-xs text-muted-foreground">{p.variedad} · {p.altitud_msnm} msnm · {p.edad_anios} años</p>
                </div>
                <StatusBadge status={overall} />
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4 space-y-4">
              {/* Context */}
              <div className="grid grid-cols-4 gap-2 text-xs">
                {[
                  { label: 'Densidad', value: `${p.densidad_plantas_ha.toLocaleString()} pl/ha` },
                  { label: 'Sombra', value: `${p.sombra_pct}%` },
                  { label: 'Pendiente', value: `${p.pendiente_pct}%` },
                  { label: 'Altitud', value: `${p.altitud_msnm} m` },
                ].map(m => (
                  <div key={m.label} className="text-center p-2 rounded-md bg-muted/50">
                    <p className="text-muted-foreground">{m.label}</p>
                    <p className="font-semibold text-foreground">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Soil full breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Droplets className="h-4 w-4 text-primary" />
                  <span>Análisis de Suelo</span>
                  <span className="ml-auto text-muted-foreground text-[10px]">{new Date(p.suelo.fecha).toLocaleDateString('es')} · {p.suelo.textura}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-muted/20 rounded-md p-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Macronutrientes & pH</p>
                    <NutrientRow label="pH" value={p.suelo.ph} rango={RANGOS_SUELO.ph} />
                    <NutrientRow label="Materia Orgánica" value={p.suelo.mo_pct} rango={RANGOS_SUELO.mo_pct} />
                    <NutrientRow label="Fósforo (P)" value={p.suelo.p_ppm} rango={RANGOS_SUELO.p_ppm} />
                    <NutrientRow label="Potasio (K)" value={p.suelo.k_cmol} rango={RANGOS_SUELO.k_cmol} />
                    <NutrientRow label="Calcio (Ca)" value={p.suelo.ca_cmol} rango={RANGOS_SUELO.ca_cmol} />
                    <NutrientRow label="Magnesio (Mg)" value={p.suelo.mg_cmol} rango={RANGOS_SUELO.mg_cmol} />
                    <NutrientRow label="Azufre (S)" value={p.suelo.s_ppm} rango={RANGOS_SUELO.s_ppm} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Micronutrientes & Capacidad</p>
                    <NutrientRow label="Aluminio (Al)" value={p.suelo.al_cmol} rango={RANGOS_SUELO.al_cmol} invert />
                    <NutrientRow label="Hierro (Fe)" value={p.suelo.fe_ppm} rango={RANGOS_SUELO.fe_ppm} />
                    <NutrientRow label="Manganeso (Mn)" value={p.suelo.mn_ppm} rango={RANGOS_SUELO.mn_ppm} />
                    <NutrientRow label="Cobre (Cu)" value={p.suelo.cu_ppm} rango={RANGOS_SUELO.cu_ppm} />
                    <NutrientRow label="Zinc (Zn)" value={p.suelo.zn_ppm} rango={RANGOS_SUELO.zn_ppm} />
                    <NutrientRow label="Boro (B)" value={p.suelo.b_ppm} rango={RANGOS_SUELO.b_ppm} />
                    <NutrientRow label="CICE" value={p.suelo.cice} rango={RANGOS_SUELO.cice} />
                    <NutrientRow label="Sat. Bases" value={p.suelo.sat_bases_pct} rango={RANGOS_SUELO.sat_bases_pct} />
                  </div>
                </div>

                {/* Relaciones catiónicas */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Ca/Mg', value: (p.suelo.ca_cmol / p.suelo.mg_cmol).toFixed(1), ideal: '3.0–5.0' },
                    { label: 'Ca/K', value: (p.suelo.ca_cmol / p.suelo.k_cmol).toFixed(1), ideal: '5.0–25.0' },
                    { label: 'Mg/K', value: (p.suelo.mg_cmol / p.suelo.k_cmol).toFixed(1), ideal: '2.5–15.0' },
                  ].map(r => (
                    <div key={r.label} className="text-center p-2 rounded-md bg-muted/50">
                      <p className="text-muted-foreground">{r.label}</p>
                      <p className="font-semibold text-foreground">{r.value}</p>
                      <p className="text-[10px] text-muted-foreground/60">ideal: {r.ideal}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Foliar full breakdown */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-foreground">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span>Análisis Foliar</span>
                  {p.foliar && <span className="ml-auto text-muted-foreground text-[10px]">{new Date(p.foliar.fecha).toLocaleDateString('es')}</span>}
                </div>
                {p.foliar ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-muted/20 rounded-md p-3">
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Macronutrientes</p>
                      <NutrientRow label="Nitrógeno (N)" value={p.foliar.n_pct} rango={RANGOS_FOLIAR.n_pct} />
                      <NutrientRow label="Fósforo (P)" value={p.foliar.p_pct} rango={RANGOS_FOLIAR.p_pct} />
                      <NutrientRow label="Potasio (K)" value={p.foliar.k_pct} rango={RANGOS_FOLIAR.k_pct} />
                      <NutrientRow label="Calcio (Ca)" value={p.foliar.ca_pct} rango={RANGOS_FOLIAR.ca_pct} />
                      <NutrientRow label="Magnesio (Mg)" value={p.foliar.mg_pct} rango={RANGOS_FOLIAR.mg_pct} />
                      <NutrientRow label="Azufre (S)" value={p.foliar.s_pct} rango={RANGOS_FOLIAR.s_pct} />
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Micronutrientes</p>
                      <NutrientRow label="Hierro (Fe)" value={p.foliar.fe_ppm} rango={RANGOS_FOLIAR.fe_ppm} />
                      <NutrientRow label="Manganeso (Mn)" value={p.foliar.mn_ppm} rango={RANGOS_FOLIAR.mn_ppm} />
                      <NutrientRow label="Cobre (Cu)" value={p.foliar.cu_ppm} rango={RANGOS_FOLIAR.cu_ppm} />
                      <NutrientRow label="Zinc (Zn)" value={p.foliar.zn_ppm} rango={RANGOS_FOLIAR.zn_ppm} />
                      <NutrientRow label="Boro (B)" value={p.foliar.b_ppm} rango={RANGOS_FOLIAR.b_ppm} />
                    </div>
                  </div>
                ) : (
                  <div className="p-3 rounded-md bg-destructive/5 border border-destructive/20 text-xs text-destructive">
                    <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
                    Sin análisis foliar — se recomienda toma de muestras urgente.
                  </div>
                )}
              </div>

              {/* Interpretación Nova Silva */}
              <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs font-semibold text-primary">Interpretación Nova Silva</span>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed">{p.interpretacion}</p>
              </div>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

// ── Análisis ──

function AnalisisSection() {
  const [tipo, setTipo] = useState<'suelo' | 'foliar'>('suelo');

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button size="sm" variant={tipo === 'suelo' ? 'default' : 'outline'} onClick={() => setTipo('suelo')}>
          <Droplets className="h-4 w-4 mr-1" /> Suelo ({DEMO_SUELO.length})
        </Button>
        <Button size="sm" variant={tipo === 'foliar' ? 'default' : 'outline'} onClick={() => setTipo('foliar')}>
          <Leaf className="h-4 w-4 mr-1" /> Foliar ({DEMO_HOJA.length})
        </Button>
      </div>

      {tipo === 'suelo' && (
        <Accordion type="single" collapsible className="space-y-2">
          {DEMO_SUELO.map(s => (
            <AccordionItem key={s.id} value={s.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Droplets className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-left flex-1 truncate">{s.parcela_nombre}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={evalRange(s.ph, RANGOS_SUELO.ph)} />
                    <Badge variant="outline" className="text-[10px]">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(s.fecha_muestreo).toLocaleDateString('es')}
                    </Badge>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-muted/20 rounded-md p-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Macronutrientes & pH</p>
                    <NutrientRow label="pH" value={s.ph} rango={RANGOS_SUELO.ph} />
                    <NutrientRow label="MO" value={s.mo_pct} rango={RANGOS_SUELO.mo_pct} />
                    <NutrientRow label="P (Bray II)" value={s.p_ppm} rango={RANGOS_SUELO.p_ppm} />
                    <NutrientRow label="K" value={s.k_cmol} rango={RANGOS_SUELO.k_cmol} />
                    <NutrientRow label="Ca" value={s.ca_cmol} rango={RANGOS_SUELO.ca_cmol} />
                    <NutrientRow label="Mg" value={s.mg_cmol} rango={RANGOS_SUELO.mg_cmol} />
                    <NutrientRow label="S" value={s.s_ppm} rango={RANGOS_SUELO.s_ppm} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Micro, Al & Capacidad</p>
                    <NutrientRow label="Al" value={s.al_cmol} rango={RANGOS_SUELO.al_cmol} invert />
                    <NutrientRow label="Fe" value={s.fe_ppm} rango={RANGOS_SUELO.fe_ppm} />
                    <NutrientRow label="Mn" value={s.mn_ppm} rango={RANGOS_SUELO.mn_ppm} />
                    <NutrientRow label="Cu" value={s.cu_ppm} rango={RANGOS_SUELO.cu_ppm} />
                    <NutrientRow label="Zn" value={s.zn_ppm} rango={RANGOS_SUELO.zn_ppm} />
                    <NutrientRow label="B" value={s.b_ppm} rango={RANGOS_SUELO.b_ppm} />
                    <NutrientRow label="CICE" value={s.cice} rango={RANGOS_SUELO.cice} />
                    <NutrientRow label="Sat. Bases" value={s.sat_bases_pct} rango={RANGOS_SUELO.sat_bases_pct} />
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Textura: {s.textura}</p>
                {/* Relaciones catiónicas */}
                <div className="grid grid-cols-3 gap-2 text-xs">
                  {[
                    { label: 'Ca/Mg', value: (s.ca_cmol / s.mg_cmol).toFixed(1), ideal: '3–5' },
                    { label: 'Ca/K', value: (s.ca_cmol / s.k_cmol).toFixed(1), ideal: '5–25' },
                    { label: 'Mg/K', value: (s.mg_cmol / s.k_cmol).toFixed(1), ideal: '2.5–15' },
                  ].map(r => (
                    <div key={r.label} className="text-center p-1.5 rounded bg-muted/50">
                      <p className="text-muted-foreground">{r.label}</p>
                      <p className="font-semibold text-foreground">{r.value}</p>
                      <p className="text-[10px] text-muted-foreground/60">{r.ideal}</p>
                    </div>
                  ))}
                </div>
                {/* Interpretación */}
                <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">Interpretación Nova Silva</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{s.interpretacion}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {tipo === 'foliar' && (
        <Accordion type="single" collapsible className="space-y-2">
          {DEMO_HOJA.map(h => (
            <AccordionItem key={h.id} value={h.id} className="border rounded-lg bg-card">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Leaf className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-medium text-left flex-1 truncate">{h.parcela_nombre}</span>
                  <Badge variant="outline" className="text-[10px]">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(h.fecha_muestreo).toLocaleDateString('es')}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 bg-muted/20 rounded-md p-3">
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Macronutrientes</p>
                    <NutrientRow label="N" value={h.n_pct} rango={RANGOS_FOLIAR.n_pct} />
                    <NutrientRow label="P" value={h.p_pct} rango={RANGOS_FOLIAR.p_pct} />
                    <NutrientRow label="K" value={h.k_pct} rango={RANGOS_FOLIAR.k_pct} />
                    <NutrientRow label="Ca" value={h.ca_pct} rango={RANGOS_FOLIAR.ca_pct} />
                    <NutrientRow label="Mg" value={h.mg_pct} rango={RANGOS_FOLIAR.mg_pct} />
                    <NutrientRow label="S" value={h.s_pct} rango={RANGOS_FOLIAR.s_pct} />
                  </div>
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">Micronutrientes</p>
                    <NutrientRow label="Fe" value={h.fe_ppm} rango={RANGOS_FOLIAR.fe_ppm} />
                    <NutrientRow label="Mn" value={h.mn_ppm} rango={RANGOS_FOLIAR.mn_ppm} />
                    <NutrientRow label="Cu" value={h.cu_ppm} rango={RANGOS_FOLIAR.cu_ppm} />
                    <NutrientRow label="Zn" value={h.zn_ppm} rango={RANGOS_FOLIAR.zn_ppm} />
                    <NutrientRow label="B" value={h.b_ppm} rango={RANGOS_FOLIAR.b_ppm} />
                  </div>
                </div>
                <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">Interpretación Nova Silva</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{h.interpretacion}</p>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

// ── Planes ──

function PlanesSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Planes de fertilización generados por el motor de nutrición</p>
        <Button size="sm"><Zap className="h-4 w-4 mr-1" /> Generar Plan</Button>
      </div>

      <Accordion type="single" collapsible className="space-y-2">
        {DEMO_PLANES.map(plan => {
          const totalCost = plan.aplicaciones.reduce((sum, a) => sum + a.costo_estimado_usd, 0);

          return (
            <AccordionItem key={plan.id} value={plan.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full mr-2">
                  <Sprout className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{plan.parcela_nombre} — {plan.ciclo}</p>
                    <p className="text-xs text-muted-foreground truncate">{plan.objetivo}</p>
                  </div>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border shrink-0 ${PLAN_STATUS_COLORS[plan.status] ?? ''}`}>{plan.status}</span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1 shrink-0">
                    <DollarSign className="h-3 w-3" />${totalCost.toFixed(0)}
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4 space-y-3">
                {/* Nivel de confianza */}
                <div className="flex items-center gap-2 text-xs">
                  <Gauge className="h-4 w-4 text-primary" />
                  <span className="text-muted-foreground">Nivel de Confianza:</span>
                  <Badge variant="outline" className={
                    plan.nivel_confianza === 'Alto' ? 'bg-success/10 text-success border-success/20' :
                    plan.nivel_confianza === 'Medio' ? 'bg-warning/10 text-warning border-warning/20' :
                    'bg-destructive/10 text-destructive border-destructive/20'
                  }>{plan.nivel_confianza}</Badge>
                </div>

                {/* Interpretación Nova Silva */}
                <div className="p-3 rounded-md bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Shield className="h-3.5 w-3.5 text-primary" />
                    <span className="text-xs font-semibold text-primary">Interpretación Nova Silva</span>
                  </div>
                  <p className="text-xs text-foreground/80 leading-relaxed">{plan.interpretacion}</p>
                </div>

                {/* Aplicaciones */}
                <div className="space-y-2">
                  {plan.aplicaciones.map(app => (
                    <div key={app.id} className="flex items-start gap-3 p-3 rounded-md bg-muted/30 text-sm">
                      <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0">
                        {app.orden}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{app.producto}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-1">
                          <span>Dosis: {app.dosis_por_ha}</span>
                          <span>Método: {app.metodo}</span>
                          <span><Calendar className="h-3 w-3 inline mr-0.5" />{app.mes_aplicacion}</span>
                          <span><DollarSign className="h-3 w-3 inline" />{app.costo_estimado_usd} USD</span>
                        </div>
                        {app.notas && <p className="text-xs text-muted-foreground/70 mt-1">{app.notas}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
}
