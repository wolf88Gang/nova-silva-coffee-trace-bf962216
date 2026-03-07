# Prompt para Supabase AI — Motor de Cumplimiento de Agroquímicos

> **Copia y pega este texto completo en el Supabase SQL Editor** y ejecútalo.
> Requiere: Tramo A ejecutado (tablas `ag_*`, `platform_organizations`, `parcelas`).
> Última actualización: 2026-03-07

---

Eres un asistente SQL para **Nova Silva**. Este script crea los catálogos de ingredientes activos, productos comerciales, LMR por mercado, reglas de certificación y el seed de sustancias reguladas globalmente.

## Reglas

1. Multi-tenant: tablas de catálogo son **globales** (sin `organization_id`), gobernadas por super-admin.
2. RLS activo en todas las tablas.
3. Idioma: columnas en inglés técnico, valores descriptivos en español donde aplique.
4. `IF NOT EXISTS` / `ON CONFLICT DO NOTHING` para idempotencia.

---

```sql
-- ============================================================
-- MOTOR DE CUMPLIMIENTO DE AGROQUÍMICOS — CATÁLOGOS Y SEED
-- Ejecutar de una sola vez en SQL Editor de Supabase
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- PARTE 1: INGREDIENTES ACTIVOS (Catálogo maestro de moléculas)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ag_active_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_comun text NOT NULL,
  cas_number text UNIQUE,                       -- CAS Registry Number (identificador universal)
  clase_funcional text NOT NULL CHECK (clase_funcional IN (
    'herbicida','fungicida','insecticida','acaricida','nematicida',
    'fumigante','regulador_crecimiento','bactericida','molusquicida','rodenticida','otro'
  )),
  toxicidad_oms text CHECK (toxicidad_oms IN ('Ia','Ib','II','III','U','NL')),
  is_hhp boolean NOT NULL DEFAULT false,        -- Plaguicida Altamente Peligroso (FAO/OMS)
  is_stockholm boolean NOT NULL DEFAULT false,  -- Convenio de Estocolmo
  is_rotterdam boolean NOT NULL DEFAULT false,  -- Convenio de Rotterdam (PIC)
  is_montreal boolean NOT NULL DEFAULT false,   -- Protocolo de Montreal
  notas text,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(nombre_comun)
);

ALTER TABLE public.ag_active_ingredients ENABLE ROW LEVEL SECURITY;

-- Catálogo global: lectura para todos los autenticados, escritura solo admin
CREATE POLICY "ag_active_ingredients_select" ON public.ag_active_ingredients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ag_active_ingredients_admin" ON public.ag_active_ingredients
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ag_active_ingredients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ────────────────────────────────────────────────────────────
-- PARTE 2: PRODUCTOS COMERCIALES
-- Relación muchos-a-muchos con ingredientes activos
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ag_commercial_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_comercial text NOT NULL,
  fabricante text,
  pais_registro text,                           -- ISO 3166-1 alpha-2
  tipo_formulacion text,                        -- 'EC','WP','SC','SL','GR', etc.
  concentracion_texto text,                     -- ej. '480 g/L'
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.ag_commercial_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_commercial_products_select" ON public.ag_commercial_products
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ag_commercial_products_admin" ON public.ag_commercial_products
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ag_commercial_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Tabla puente: ingredientes activos ↔ productos comerciales
CREATE TABLE IF NOT EXISTS public.ag_product_ingredients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.ag_commercial_products(id) ON DELETE CASCADE,
  ingredient_id uuid NOT NULL REFERENCES public.ag_active_ingredients(id) ON DELETE CASCADE,
  concentracion_pct numeric,                    -- % del ingrediente en la formulación
  UNIQUE(product_id, ingredient_id)
);

ALTER TABLE public.ag_product_ingredients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_product_ingredients_select" ON public.ag_product_ingredients
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ag_product_ingredients_admin" ON public.ag_product_ingredients
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));


-- ────────────────────────────────────────────────────────────
-- PARTE 3: LÍMITES MÁXIMOS DE RESIDUOS POR MERCADO
-- Tabla pivote ingrediente × mercado
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ag_market_mrls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ag_active_ingredients(id) ON DELETE CASCADE,
  mercado text NOT NULL CHECK (mercado IN ('EU','USA','JAPAN','CHINA','KOREA','CODEX')),
  commodity text NOT NULL DEFAULT 'coffee_green', -- 'coffee_green','coffee_roasted','coffee_instant'
  limite_ppm numeric,                             -- NULL = no establecido
  is_default_lod boolean NOT NULL DEFAULT false,  -- true = prohibición encubierta como LOD (0.01 ppm)
  estatus text CHECK (estatus IN (
    'autorizado','tolerancia','regulado','limitado','cancelado','prohibido'
  )),
  notas text,
  ruleset_version integer NOT NULL DEFAULT 1,
  vigente_desde date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ingredient_id, mercado, commodity, ruleset_version)
);

ALTER TABLE public.ag_market_mrls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_market_mrls_select" ON public.ag_market_mrls
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ag_market_mrls_admin" ON public.ag_market_mrls
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_ag_market_mrls_ingredient ON public.ag_market_mrls(ingredient_id);
CREATE INDEX idx_ag_market_mrls_mercado ON public.ag_market_mrls(mercado);


-- ────────────────────────────────────────────────────────────
-- PARTE 4: REGLAS DE CERTIFICACIÓN
-- Fairtrade, GCP, Rainforest Alliance, Orgánico
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.ag_certification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ingredient_id uuid NOT NULL REFERENCES public.ag_active_ingredients(id) ON DELETE CASCADE,
  certificadora text NOT NULL CHECK (certificadora IN (
    'fairtrade','gcp','rainforest_alliance','organico_usda','organico_eu','c.a.f.e._practices','4c'
  )),
  nivel_restriccion text NOT NULL CHECK (nivel_restriccion IN (
    'prohibido','lista_roja','lista_naranja','lista_amarilla',
    'restringido','phase_out_2026','phase_out_2030','eup','permitido'
  )),
  condicion_fenologica text,                      -- ej. 'no_aplicar_1_mes_antes_floracion'
  condicion_texto text,                           -- descripción legible
  fecha_phase_out date,                           -- ej. '2026-12-31'
  permite_eup boolean NOT NULL DEFAULT false,     -- ¿admite Exceptional Use Policy?
  cultivo text NOT NULL DEFAULT 'cafe',
  ruleset_version integer NOT NULL DEFAULT 1,
  created_at timestamptz DEFAULT now(),
  UNIQUE(ingredient_id, certificadora, cultivo, ruleset_version)
);

ALTER TABLE public.ag_certification_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ag_certification_rules_select" ON public.ag_certification_rules
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ag_certification_rules_admin" ON public.ag_certification_rules
  FOR ALL TO authenticated USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

CREATE INDEX idx_ag_certification_rules_ingredient ON public.ag_certification_rules(ingredient_id);
CREATE INDEX idx_ag_certification_rules_cert ON public.ag_certification_rules(certificadora);


-- ────────────────────────────────────────────────────────────
-- PARTE 5: CERTIFICACIONES POR ORGANIZACIÓN
-- Vincula qué sellos tiene cada cooperativa/exportador
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.org_certifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  certificadora text NOT NULL CHECK (certificadora IN (
    'fairtrade','gcp','rainforest_alliance','organico_usda','organico_eu','c.a.f.e._practices','4c'
  )),
  codigo_certificado text,
  fecha_emision date,
  fecha_vencimiento date,
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, certificadora)
);

ALTER TABLE public.org_certifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_certifications_select" ON public.org_certifications
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "org_certifications_manage" ON public.org_certifications
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_org_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_org_admin(auth.uid()));

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.org_certifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ────────────────────────────────────────────────────────────
-- PARTE 6: MERCADOS DE EXPORTACIÓN POR ORGANIZACIÓN
-- Define a qué mercados exporta cada org (para filtrado de MRL)
-- ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.org_export_markets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.platform_organizations(id) ON DELETE CASCADE,
  mercado text NOT NULL CHECK (mercado IN ('EU','USA','JAPAN','CHINA','KOREA','CODEX')),
  es_principal boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, mercado)
);

ALTER TABLE public.org_export_markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_export_markets_select" ON public.org_export_markets
  FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "org_export_markets_manage" ON public.org_export_markets
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()) OR public.is_org_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()) OR public.is_org_admin(auth.uid()));


-- ────────────────────────────────────────────────────────────
-- PARTE 7: RPC DE VALIDACIÓN DE CUMPLIMIENTO
-- ────────────────────────────────────────────────────────────

-- 7.1 Obtener el ruleset más restrictivo para una org
-- Combina mercados + certificaciones para retornar ingredientes bloqueados
CREATE OR REPLACE FUNCTION public.get_blocked_ingredients(_org_id uuid)
RETURNS TABLE(
  ingredient_id uuid,
  nombre_comun text,
  clase_funcional text,
  bloqueado_por text,        -- 'mercado:EU', 'cert:fairtrade', etc.
  nivel text,                -- 'prohibido', 'lista_roja', 'cancelado'
  detalle text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Bloqueados por mercado de exportación
  SELECT
    m.ingredient_id,
    ai.nombre_comun,
    ai.clase_funcional,
    'mercado:' || m.mercado AS bloqueado_por,
    m.estatus AS nivel,
    CASE
      WHEN m.is_default_lod THEN 'LOD 0.01 ppm (tolerancia cero comercial)'
      ELSE 'LMR: ' || COALESCE(m.limite_ppm::text, 'no establecido')
    END AS detalle
  FROM public.ag_market_mrls m
  JOIN public.ag_active_ingredients ai ON ai.id = m.ingredient_id
  WHERE m.mercado IN (
    SELECT em.mercado FROM public.org_export_markets em WHERE em.organization_id = _org_id
  )
  AND (m.estatus IN ('prohibido','cancelado') OR m.is_default_lod = true)
  AND m.ruleset_version = (
    SELECT MAX(m2.ruleset_version) FROM public.ag_market_mrls m2
    WHERE m2.ingredient_id = m.ingredient_id AND m2.mercado = m.mercado
  )

  UNION ALL

  -- Bloqueados por certificación de la org
  SELECT
    cr.ingredient_id,
    ai.nombre_comun,
    ai.clase_funcional,
    'cert:' || cr.certificadora AS bloqueado_por,
    cr.nivel_restriccion AS nivel,
    COALESCE(cr.condicion_texto, '') AS detalle
  FROM public.ag_certification_rules cr
  JOIN public.ag_active_ingredients ai ON ai.id = cr.ingredient_id
  WHERE cr.certificadora IN (
    SELECT oc.certificadora FROM public.org_certifications oc
    WHERE oc.organization_id = _org_id AND oc.activo = true
  )
  AND cr.nivel_restriccion IN ('prohibido','lista_roja')
  AND cr.ruleset_version = (
    SELECT MAX(cr2.ruleset_version) FROM public.ag_certification_rules cr2
    WHERE cr2.ingredient_id = cr.ingredient_id AND cr2.certificadora = cr.certificadora
  )

  UNION ALL

  -- HHP globales (siempre bloqueados)
  SELECT
    ai.id AS ingredient_id,
    ai.nombre_comun,
    ai.clase_funcional,
    'convenio:' ||
      CASE
        WHEN ai.is_stockholm THEN 'estocolmo'
        WHEN ai.is_rotterdam THEN 'rotterdam'
        WHEN ai.is_montreal THEN 'montreal'
        ELSE 'hhp_global'
      END AS bloqueado_por,
    'prohibido' AS nivel,
    'Plaguicida Altamente Peligroso (HHP) o convenio internacional' AS detalle
  FROM public.ag_active_ingredients ai
  WHERE ai.is_hhp = true OR ai.is_stockholm = true OR ai.is_rotterdam = true OR ai.is_montreal = true;
$$;

-- 7.2 Validar si un ingrediente específico está permitido para una org
CREATE OR REPLACE FUNCTION public.check_ingredient_compliance(
  _org_id uuid,
  _ingredient_id uuid
)
RETURNS TABLE(
  is_allowed boolean,
  bloqueado_por text,
  nivel text,
  detalle text,
  alternativa_sugerida text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    NOT EXISTS (
      SELECT 1 FROM public.get_blocked_ingredients(_org_id) bi
      WHERE bi.ingredient_id = _ingredient_id
    ) AS is_allowed,
    (SELECT bi.bloqueado_por FROM public.get_blocked_ingredients(_org_id) bi
     WHERE bi.ingredient_id = _ingredient_id LIMIT 1),
    (SELECT bi.nivel FROM public.get_blocked_ingredients(_org_id) bi
     WHERE bi.ingredient_id = _ingredient_id LIMIT 1),
    (SELECT bi.detalle FROM public.get_blocked_ingredients(_org_id) bi
     WHERE bi.ingredient_id = _ingredient_id LIMIT 1),
    NULL::text AS alternativa_sugerida;
$$;

-- 7.3 Obtener ingredientes en phase-out para una org (alertas tempranas)
CREATE OR REPLACE FUNCTION public.get_phaseout_ingredients(_org_id uuid)
RETURNS TABLE(
  ingredient_id uuid,
  nombre_comun text,
  certificadora text,
  nivel_restriccion text,
  fecha_phase_out date,
  dias_restantes integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    cr.ingredient_id,
    ai.nombre_comun,
    cr.certificadora,
    cr.nivel_restriccion,
    cr.fecha_phase_out,
    (cr.fecha_phase_out - CURRENT_DATE)::integer AS dias_restantes
  FROM public.ag_certification_rules cr
  JOIN public.ag_active_ingredients ai ON ai.id = cr.ingredient_id
  WHERE cr.certificadora IN (
    SELECT oc.certificadora FROM public.org_certifications oc
    WHERE oc.organization_id = _org_id AND oc.activo = true
  )
  AND cr.nivel_restriccion IN ('phase_out_2026','phase_out_2030')
  AND cr.fecha_phase_out IS NOT NULL
  ORDER BY cr.fecha_phase_out ASC;
$$;


-- ────────────────────────────────────────────────────────────
-- PARTE 8: SEED DE INGREDIENTES ACTIVOS REGULADOS
-- Datos extraídos de la matriz regulatoria global
-- ────────────────────────────────────────────────────────────

INSERT INTO public.ag_active_ingredients (nombre_comun, clase_funcional, toxicidad_oms, is_hhp, is_stockholm, is_rotterdam, notas) VALUES
  -- Prohibidos globalmente / Convenios internacionales
  ('Aldicarb', 'insecticida', 'Ia', true, false, true, 'Nematicida/insecticida extremadamente tóxico. Rotterdam PIC.'),
  ('Endosulfán', 'insecticida', 'II', true, true, true, 'Convenio de Estocolmo. Prohibido globalmente.'),
  ('DDT', 'insecticida', 'II', true, true, true, 'Convenio de Estocolmo. Persistente orgánico.'),
  ('Aldrín', 'insecticida', 'Ia', true, true, true, 'Estocolmo + Rotterdam. Prohibido globalmente.'),
  ('Dieldrín', 'insecticida', 'Ia', true, true, true, 'Estocolmo + Rotterdam. Prohibido globalmente.'),
  ('Captafol', 'fungicida', 'Ia', true, false, true, 'Rotterdam PIC. Carcinógeno probable.'),

  -- Lista Roja Fairtrade (prohibición absoluta para café, julio 2022)
  ('Clorpirifos', 'insecticida', 'II', true, false, false, 'Lista Roja Fairtrade. Cancelado EPA para café. LOD en UE.'),
  ('Clorpirifos-metil', 'insecticida', 'III', false, false, false, 'Lista Roja Fairtrade.'),
  ('Clorotalonil', 'fungicida', 'U', false, false, false, 'Lista Roja Fairtrade. Probable carcinógeno. LOD en UE.'),
  ('Glifosato', 'herbicida', 'III', false, false, false, 'Lista Roja Fairtrade. Phase-out GCP 2030. Regulado en UE.'),
  ('Paraquat', 'herbicida', 'II', true, false, true, 'Lista Roja Fairtrade. Prohibido GCP. Rotterdam PIC. LOD en UE.'),
  ('Abamectina', 'insecticida', 'Ib', true, false, false, 'Lista Roja Fairtrade. Phase-out GCP 2026.'),
  ('Imidacloprid', 'insecticida', 'II', false, false, false, 'Lista Roja Fairtrade. Neonicotinoide. LOD en UE. Phase-out GCP 2026.'),
  ('Tiametoxam', 'insecticida', 'III', false, false, false, 'Lista Roja Fairtrade. Neonicotinoide. LOD en UE.'),
  ('Clotianidina', 'insecticida', 'II', false, false, false, 'Lista Roja Fairtrade. Neonicotinoide. LOD en UE.'),
  ('Beta-ciflutrina', 'insecticida', 'Ib', true, false, false, 'Lista Roja Fairtrade.'),
  ('Lambda-cialotrina', 'insecticida', 'II', false, false, false, 'Lista Roja Fairtrade. Phase-out GCP 2026.'),
  ('Oxamilo', 'insecticida', 'Ib', true, false, false, 'Lista Roja Fairtrade. Extremadamente tóxico.'),

  -- Lista Naranja Fairtrade (restringidos / condición fenológica)
  ('Cipermetrina', 'insecticida', 'II', false, false, false, 'Lista Naranja Fairtrade. Phase-out GCP 2030. Condición B (polinizadores).'),
  ('Deltametrina', 'insecticida', 'II', false, false, false, 'Lista Naranja Fairtrade. Phase-out GCP 2030. Condición B.'),
  ('Fipronil', 'insecticida', 'II', false, false, false, 'Lista Naranja Fairtrade. Phase-out GCP 2030. Sin EUP en RA.'),
  ('Sulfoxaflor', 'insecticida', 'III', false, false, false, 'Lista Naranja Fairtrade. Condición B (polinizadores).'),
  ('Tiacloprid', 'insecticida', 'II', false, false, false, 'Lista Naranja Fairtrade. Condición B. Prohibido UE 2020.'),

  -- GCP Prohibidos (adicionales)
  ('Fosfuro de Aluminio', 'fumigante', 'Ia', true, false, false, 'Prohibido GCP. Fumigante extremadamente tóxico.'),
  ('Carbofurano', 'insecticida', 'Ib', true, false, true, 'Prohibido GCP + EPA. Rotterdam PIC.'),
  ('Bromuro de Metilo', 'fumigante', 'NL', false, false, true, 'Prohibido GCP. Protocolo de Montreal.'),
  ('Terbufós', 'insecticida', 'Ia', true, false, false, 'Prohibido GCP. Extremadamente tóxico.'),
  ('Triazofós', 'insecticida', 'Ib', true, false, false, 'Prohibido GCP. Altamente tóxico.'),
  ('Dinoseb', 'herbicida', 'Ib', true, false, true, 'Rotterdam PIC.'),

  -- GCP Phase-out 2026
  ('Ácido bórico', 'otro', 'III', false, false, false, 'Phase-out GCP 2026. Regulador/enmienda.'),
  ('Hidróxido de Cobre (II)', 'fungicida', 'III', false, false, false, 'Phase-out GCP 2026. Fungicida cúprico.'),
  ('Diquat', 'herbicida', 'II', false, false, false, 'Phase-out GCP 2026. LOD en UE.'),
  ('Fenpiroximato', 'acaricida', 'II', false, false, false, 'Phase-out GCP 2026.'),
  ('Glufosinato-amonio', 'herbicida', 'III', false, false, false, 'Phase-out GCP 2026.'),
  ('Tebuconazol', 'fungicida', 'III', false, false, false, 'Phase-out GCP 2026. Triazol.'),
  ('Zeta-Cipermetrina', 'insecticida', 'II', false, false, false, 'Phase-out GCP 2026. Reclasificación toxicológica.'),

  -- GCP Phase-out 2030 (selección relevante café)
  ('Carbaril', 'insecticida', 'II', false, false, false, 'Phase-out GCP 2030.'),
  ('Carbendazima', 'fungicida', 'U', false, false, false, 'Phase-out GCP 2030. Mutágeno. LOD en UE.'),
  ('Clorantraniliprol', 'insecticida', 'U', false, false, false, 'Phase-out GCP 2030. LOD en UE.'),
  ('Diazinón', 'insecticida', 'II', false, false, false, 'Phase-out GCP 2030.'),
  ('Dimetoato', 'insecticida', 'II', false, false, false, 'Phase-out GCP 2030. LOD en UE.'),
  ('Diurón', 'herbicida', 'III', false, false, false, 'Phase-out GCP 2030.'),
  ('Epoxiconazol', 'fungicida', 'III', false, false, false, 'Phase-out GCP 2030. LOD en UE.'),
  ('Esfenvalerato', 'insecticida', 'II', false, false, false, 'Phase-out GCP 2030.'),
  ('Lufenurón', 'insecticida', 'U', false, false, false, 'Phase-out GCP 2030.'),
  ('Malatión', 'insecticida', 'III', false, false, false, 'Phase-out GCP 2030. Probable carcinógeno IARC.'),
  ('Mancozeb', 'fungicida', 'U', false, false, false, 'Phase-out GCP 2030. LOD en UE.'),
  ('Permetrina', 'insecticida', 'II', false, false, false, 'Phase-out GCP 2030.'),
  ('Profenofós', 'insecticida', 'II', false, false, false, 'Phase-out GCP 2030.'),
  ('Propiconazol', 'fungicida', 'II', false, false, false, 'Phase-out GCP 2030. LOD en UE.')
ON CONFLICT (nombre_comun) DO NOTHING;


-- ────────────────────────────────────────────────────────────
-- PARTE 9: SEED DE LMR POR MERCADO (café verde)
-- Valores de la matriz regulatoria compilada
-- ────────────────────────────────────────────────────────────

-- Helper para insertar MRL por nombre
CREATE OR REPLACE FUNCTION public._seed_mrl(
  _nombre text, _mercado text, _limite numeric, _is_lod boolean, _estatus text
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE _iid uuid;
BEGIN
  SELECT id INTO _iid FROM public.ag_active_ingredients WHERE nombre_comun = _nombre;
  IF _iid IS NULL THEN RETURN; END IF;
  INSERT INTO public.ag_market_mrls (ingredient_id, mercado, limite_ppm, is_default_lod, estatus)
  VALUES (_iid, _mercado, _limite, _is_lod, _estatus)
  ON CONFLICT (ingredient_id, mercado, commodity, ruleset_version) DO NOTHING;
END;
$$;

-- Aldicarb
SELECT public._seed_mrl('Aldicarb', 'USA', 0.1, false, 'regulado');
SELECT public._seed_mrl('Aldicarb', 'EU', 0.01, true, 'prohibido');
SELECT public._seed_mrl('Aldicarb', 'JAPAN', 0.1, false, 'regulado');

-- Clorpirifos
SELECT public._seed_mrl('Clorpirifos', 'USA', NULL, false, 'cancelado');
SELECT public._seed_mrl('Clorpirifos', 'EU', 0.01, true, 'prohibido');
SELECT public._seed_mrl('Clorpirifos', 'JAPAN', NULL, false, 'limitado');

-- Clorotalonil
SELECT public._seed_mrl('Clorotalonil', 'USA', 0.2, false, 'tolerancia');
SELECT public._seed_mrl('Clorotalonil', 'EU', 0.01, true, 'prohibido');
SELECT public._seed_mrl('Clorotalonil', 'JAPAN', 0.2, false, 'regulado');

-- Paraquat
SELECT public._seed_mrl('Paraquat', 'USA', NULL, false, 'regulado');
SELECT public._seed_mrl('Paraquat', 'EU', 0.01, true, 'prohibido');
SELECT public._seed_mrl('Paraquat', 'JAPAN', NULL, false, 'limitado');

-- Endosulfán
SELECT public._seed_mrl('Endosulfán', 'USA', NULL, false, 'prohibido');
SELECT public._seed_mrl('Endosulfán', 'EU', NULL, false, 'prohibido');
SELECT public._seed_mrl('Endosulfán', 'JAPAN', NULL, false, 'prohibido');

-- Glifosato
SELECT public._seed_mrl('Glifosato', 'USA', NULL, false, 'tolerancia');
SELECT public._seed_mrl('Glifosato', 'EU', NULL, false, 'regulado');
SELECT public._seed_mrl('Glifosato', 'JAPAN', NULL, false, 'regulado');

-- Imidacloprid
SELECT public._seed_mrl('Imidacloprid', 'EU', 0.01, true, 'prohibido');
SELECT public._seed_mrl('Imidacloprid', 'USA', NULL, false, 'regulado');

-- Carbofurano
SELECT public._seed_mrl('Carbofurano', 'USA', NULL, false, 'prohibido');
SELECT public._seed_mrl('Carbofurano', 'EU', 0.01, true, 'prohibido');
SELECT public._seed_mrl('Carbofurano', 'JAPAN', NULL, false, 'regulado');

-- Bromuro de Metilo
SELECT public._seed_mrl('Bromuro de Metilo', 'USA', 150, false, 'regulado');
SELECT public._seed_mrl('Bromuro de Metilo', 'EU', 0.01, true, 'prohibido');

-- Abamectina
SELECT public._seed_mrl('Abamectina', 'USA', NULL, false, 'regulado');
SELECT public._seed_mrl('Abamectina', 'EU', NULL, false, 'regulado');

-- Fipronil
SELECT public._seed_mrl('Fipronil', 'USA', NULL, false, 'tolerancia');
SELECT public._seed_mrl('Fipronil', 'EU', 0.01, true, 'prohibido');

-- Clorantraniliprol
SELECT public._seed_mrl('Clorantraniliprol', 'USA', 0.4, false, 'tolerancia');
SELECT public._seed_mrl('Clorantraniliprol', 'EU', 0.01, true, 'prohibido');
SELECT public._seed_mrl('Clorantraniliprol', 'JAPAN', 0.4, false, 'regulado');

-- Cleanup helper
DROP FUNCTION IF EXISTS public._seed_mrl;


-- ────────────────────────────────────────────────────────────
-- PARTE 10: SEED DE REGLAS DE CERTIFICACIÓN
-- ────────────────────────────────────────────────────────────

-- Helper para insertar regla por nombre
CREATE OR REPLACE FUNCTION public._seed_cert(
  _nombre text, _cert text, _nivel text, _condicion text DEFAULT NULL, _phase_out date DEFAULT NULL, _eup boolean DEFAULT false
)
RETURNS void LANGUAGE plpgsql AS $$
DECLARE _iid uuid;
BEGIN
  SELECT id INTO _iid FROM public.ag_active_ingredients WHERE nombre_comun = _nombre;
  IF _iid IS NULL THEN RETURN; END IF;
  INSERT INTO public.ag_certification_rules (ingredient_id, certificadora, nivel_restriccion, condicion_fenologica, condicion_texto, fecha_phase_out, permite_eup)
  VALUES (_iid, _cert, _nivel, _condicion, _condicion, _phase_out, _eup)
  ON CONFLICT (ingredient_id, certificadora, cultivo, ruleset_version) DO NOTHING;
END;
$$;

-- Fairtrade Lista Roja
SELECT public._seed_cert('Clorpirifos', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Clorpirifos-metil', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Clorotalonil', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Glifosato', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Paraquat', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Abamectina', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Imidacloprid', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Tiametoxam', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Clotianidina', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Beta-ciflutrina', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Lambda-cialotrina', 'fairtrade', 'lista_roja');
SELECT public._seed_cert('Oxamilo', 'fairtrade', 'lista_roja');

-- Fairtrade Lista Naranja (con condición fenológica para polinizadores)
SELECT public._seed_cert('Cipermetrina', 'fairtrade', 'lista_naranja', 'no_aplicar_1_mes_antes_floracion');
SELECT public._seed_cert('Deltametrina', 'fairtrade', 'lista_naranja', 'no_aplicar_1_mes_antes_floracion');
SELECT public._seed_cert('Fipronil', 'fairtrade', 'lista_naranja', 'no_aplicar_1_mes_antes_floracion');
SELECT public._seed_cert('Sulfoxaflor', 'fairtrade', 'lista_naranja', 'no_aplicar_1_mes_antes_floracion');
SELECT public._seed_cert('Tiacloprid', 'fairtrade', 'lista_naranja', 'no_aplicar_1_mes_antes_floracion');

-- GCP Prohibidos
SELECT public._seed_cert('Aldicarb', 'gcp', 'prohibido');
SELECT public._seed_cert('Fosfuro de Aluminio', 'gcp', 'prohibido');
SELECT public._seed_cert('Carbofurano', 'gcp', 'prohibido');
SELECT public._seed_cert('Clorotalonil', 'gcp', 'prohibido');
SELECT public._seed_cert('Endosulfán', 'gcp', 'prohibido');
SELECT public._seed_cert('Bromuro de Metilo', 'gcp', 'prohibido');
SELECT public._seed_cert('Paraquat', 'gcp', 'prohibido');
SELECT public._seed_cert('Terbufós', 'gcp', 'prohibido');
SELECT public._seed_cert('Triazofós', 'gcp', 'prohibido');

-- GCP Phase-out 2026
SELECT public._seed_cert('Abamectina', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Ácido bórico', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Hidróxido de Cobre (II)', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Clorpirifos', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Diquat', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Fenpiroximato', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Glufosinato-amonio', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Imidacloprid', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Lambda-cialotrina', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Tebuconazol', 'gcp', 'phase_out_2026', NULL, '2026-12-31');
SELECT public._seed_cert('Zeta-Cipermetrina', 'gcp', 'phase_out_2026', NULL, '2026-12-31');

-- GCP Phase-out 2030
SELECT public._seed_cert('Carbaril', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Carbendazima', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Clorantraniliprol', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Cipermetrina', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Deltametrina', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Diazinón', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Dimetoato', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Diurón', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Epoxiconazol', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Esfenvalerato', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Fipronil', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Glifosato', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Lufenurón', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Malatión', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Mancozeb', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Permetrina', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Profenofós', 'gcp', 'phase_out_2030', NULL, '2030-12-31');
SELECT public._seed_cert('Propiconazol', 'gcp', 'phase_out_2030', NULL, '2030-12-31');

-- Rainforest Alliance
SELECT public._seed_cert('Fipronil', 'rainforest_alliance', 'prohibido');
SELECT public._seed_cert('Paraquat', 'rainforest_alliance', 'prohibido');
SELECT public._seed_cert('Endosulfán', 'rainforest_alliance', 'prohibido');

-- Cleanup helper
DROP FUNCTION IF EXISTS public._seed_cert;


-- ────────────────────────────────────────────────────────────
-- SMOKE TESTS
-- ────────────────────────────────────────────────────────────

-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('ag_active_ingredients','ag_commercial_products','ag_product_ingredients',
                    'ag_market_mrls','ag_certification_rules','org_certifications','org_export_markets');

-- Conteos
SELECT 'ag_active_ingredients' AS tabla, COUNT(*) AS filas FROM public.ag_active_ingredients
UNION ALL
SELECT 'ag_market_mrls', COUNT(*) FROM public.ag_market_mrls
UNION ALL
SELECT 'ag_certification_rules', COUNT(*) FROM public.ag_certification_rules;

-- Verificar RPCs
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_blocked_ingredients','check_ingredient_compliance','get_phaseout_ingredients');
```
