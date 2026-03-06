# Fase 2 — Guía de Ejecución: Modelado Técnico y Edge Functions

> **Generado desde**: `Fase_2_Modelado_Técnico_en_Base_de_Datos_y_Primer_Edge_Function.pdf`
> **Estado actual del proyecto**: Ya existen tablas `nutricion_*` (Fase 1 completada). Esta guía mapea los requerimientos del PDF al esquema existente y define lo pendiente.

---

## 📊 Reconciliación: Documento vs Esquema Existente

| Concepto PDF (prefijo `ag_`) | Estado Actual | Acción |
|---|---|---|
| `ag_variedades` | ✅ Existe como datos en motor §29 (hardcoded en RPC) | ⬜ Migrar a tabla catálogo |
| `ag_reglas_suelo` | ✅ Existe como lógica en RPC `generar_plan_nutricional_v1` | ⬜ Migrar a tabla catálogo |
| `ag_parametros_fenologicos` | ✅ Existe como lógica en RPC | ⬜ Migrar a tabla catálogo |
| `ag_parametros_altitud` | ✅ Existe como lógica en RPC | ⬜ Migrar a tabla catálogo |
| `ag_analisis_suelo` | ✅ `nutricion_analisis_suelo` | ✅ Listo |
| `ag_planes_nutricion` | ✅ `nutricion_planes` | ⬜ Ampliar campos (hash, explain, idempotency, revisiones) |
| `ag_parcela_contexto` | ✅ `nutricion_parcela_contexto` | ✅ Listo |
| `ag_parcela_variedades` | ❌ No existe | ⬜ Crear tabla normalizada |
| `ag_ejecucion_nutricion` | ⚠️ `nutricion_aplicaciones` parcial | ⬜ Ampliar/renombrar |
| `ag_plan_events` | ❌ No existe | ⬜ Crear tabla audit log |
| `ag_nutrition_finance` | ❌ No existe | ⬜ Crear (Fase 2.3) |
| `ag_costos_estimados` | ❌ No existe | ⬜ Crear placeholder |
| `ag_ruleset_versions` | ❌ No existe | ⬜ Crear para gobernanza |
| `ag_nutrition_drafts` | ❌ No existe | ⬜ Opcional v1 |
| `ag_suppliers` | ❌ No existe | ⬜ Crear (Fase 2.5) |
| `ag_supplier_products` | ❌ No existe | ⬜ Crear (Fase 2.5) |
| `ag_quotes` | ❌ No existe | ⬜ Crear (Fase 2.5) |
| `ag_commissions` | ❌ No existe | ⬜ Crear (Fase 2.5) |
| Edge Function `generate_nutrition_plan_v1` | ⚠️ Existe como RPC SQL, no como Edge Function | ⬜ Migrar a Edge Function |
| Edge Function `log_nutrition_execution_v1` | ❌ No existe | ⬜ Crear (Fase 2.3) |
| Edge Function `approve_nutrition_plan_v1` | ❌ No existe | ⬜ Crear (Fase 2.4) |
| Edge Function `revise_nutrition_plan_v1` | ❌ No existe | ⬜ Crear (Fase 2.4) |
| Edge Function `quote_nutrition_inputs_v1` | ❌ No existe | ⬜ Crear (Fase 2.5) |
| Storage buckets | ❌ No existen | ⬜ Crear `soil-analyses` y `nutrition-executions` |

---

## 🔑 Decisión Arquitectónica: Tenancy

**Ya resuelta en el proyecto:**
- Se usa `organization_id` (no claims JWT).
- RLS usa `get_user_organization_id(auth.uid())` — función SECURITY DEFINER.
- Roles via tabla `organizacion_usuarios` con `rol_interno`.
- **NO cambiar este patrón.** Adaptar las policies del PDF a este modelo.

---

## Fase 2.1 — Catálogos y Ampliación del Esquema

### 🟦 Prompt para Supabase AI (SQL)

```
Necesito crear tablas catálogo y ampliar el esquema de nutrición existente en mi proyecto Supabase.

CONTEXTO EXISTENTE:
- Ya existen: nutricion_parcela_contexto, nutricion_analisis_suelo, nutricion_analisis_foliar, nutricion_planes, nutricion_fraccionamientos, nutricion_aplicaciones.
- Multi-tenant por organization_id uuid.
- RLS usa función get_user_organization_id(auth.uid()) — NO usar JWT claims.
- Tabla de roles: organizacion_usuarios (organizacion_id, user_id, rol_interno).

CREAR TABLAS CATÁLOGO (globales, sin RLS por org):

1. ag_variedades:
   - id uuid pk default gen_random_uuid()
   - nombre_comun text unique not null
   - grupo_morfologico text check ('compacto','alto','compuesto','exotico','f1') not null
   - factor_demanda_base numeric not null default 1.0
   - micros_multiplier numeric not null default 1.0
   - limite_yield_sostenible_kg_ha int
   - sens_exceso_n text check ('baja','media','alta') default 'media'
   - sens_deficit_k text check ('baja','media','alta') default 'media'
   - tolerancia_sequia text check ('baja','media','alta') default 'media'
   - tolerancia_calor text check ('baja','media','alta') default 'media'
   - activo boolean default true
   - created_at timestamptz default now()

2. ag_reglas_suelo:
   - id uuid pk default gen_random_uuid()
   - ruleset_version text not null default '1.0.0'
   - variable text not null (pH, Al, CIC, MO, P, K, Ca, Mg, CaMgRatio, KSatPct, BaseSatPct)
   - operador text not null check ('<','<=','>','>=','between')
   - umbral_min numeric
   - umbral_max numeric
   - accion_tipo text not null check ('bloqueo','ajuste','alerta')
   - accion_objetivo text not null (N, P2O5, K2O, Ca, Mg, micros, eficiencia_N, fraccionamiento, encalado)
   - accion_valor numeric
   - severidad text check ('roja','naranja','amarilla','verde') default 'amarilla'
   - mensaje text
   - explain_code text not null
   - activo boolean default true
   - created_at timestamptz default now()
   - Unique: (ruleset_version, variable, operador, umbral_min, accion_tipo)

3. ag_parametros_fenologicos:
   - id uuid pk
   - fase text not null (cabeza_alfiler, expansion_rapida, llenado_grano, maduracion)
   - dias_post_floracion_min int
   - dias_post_floracion_max int
   - gda_min int (opcional, para v1.1)
   - gda_max int (opcional)
   - nutrientes_clave text[] (ej: {N,K2O})
   - proporcion_pct numeric (% de la dosis total en esta fase)
   - zona_altitudinal text check ('baja','media','alta')
   - created_at timestamptz default now()

4. ag_parametros_altitud:
   - id uuid pk
   - zona text unique not null check ('baja','media','alta')
   - altitud_min int not null
   - altitud_max int not null
   - shift_cronograma_dias int default 0
   - factor_eficiencia_n numeric default 1.0
   - notas text
   - created_at timestamptz default now()

5. ag_ruleset_versions:
   - id uuid pk
   - version text unique not null
   - descripcion text
   - activo boolean default true
   - created_at timestamptz default now()

CREAR TABLA TRANSACCIONAL (con RLS por org):

6. ag_parcela_variedades (mezcla varietal ponderada por parcela):
   - id uuid pk
   - organization_id uuid not null
   - parcela_id uuid not null references parcelas(id) on delete cascade
   - variedad_id uuid not null references ag_variedades(id)
   - proporcion_pct numeric not null check (proporcion_pct between 0 and 100)
   - created_by uuid not null references auth.users(id)
   - created_at timestamptz default now()
   - updated_at timestamptz default now()
   - Unique: (parcela_id, variedad_id)

RLS para ag_parcela_variedades:
- SELECT: organization_id = get_user_organization_id(auth.uid())
- INSERT: organization_id = get_user_organization_id(auth.uid()) AND created_by = auth.uid()
- UPDATE: organization_id = get_user_organization_id(auth.uid())
- DELETE: organization_id = get_user_organization_id(auth.uid())

Políticas para catálogos (ag_variedades, ag_reglas_suelo, ag_parametros_*, ag_ruleset_versions):
- SELECT: para authenticated (lectura global)
- INSERT/UPDATE/DELETE: solo has_role(auth.uid(), 'admin') usando la función existente public.has_role

Crear updated_at trigger para ag_parcela_variedades.
Crear índices: (organization_id, parcela_id) en ag_parcela_variedades.

Entregar SQL completo listo para ejecutar.
```

### 🟦 Prompt para Supabase AI (Ampliar nutricion_planes)

```
Necesito ampliar la tabla existente nutricion_planes con campos adicionales para soportar versionado, hashing, idempotencia, revisiones y ejecución.

TABLA EXISTENTE: nutricion_planes (ya tiene: id, organization_id, parcela_id, ciclo, objetivo, supuestos_json, status, created_at)

AGREGAR COLUMNAS (ALTER TABLE, no recrear):

ALTER TABLE nutricion_planes ADD COLUMN IF NOT EXISTS
  ruleset_version text default '1.0.0',
  engine_version text default 'nutrition_v1',
  idempotency_key text,
  hash_receta text,
  receta_canonica_json jsonb,
  explain_json jsonb,
  nivel_confianza text check (nivel_confianza in ('alto','medio','bajo')) default 'medio',
  modo_calculo text check (modo_calculo in ('completo','heuristico')) default 'heuristico',
  plan_revision_of uuid references nutricion_planes(id),
  revision_reason text,
  revision_notes text,
  execution_pct_total numeric default 0,
  execution_pct_by_nutrient jsonb default '{}'::jsonb,
  data_quality_json jsonb,
  created_by uuid references auth.users(id);

CREAR ÍNDICES:
- unique(parcela_id, idempotency_key) WHERE idempotency_key IS NOT NULL
- index(plan_revision_of) WHERE plan_revision_of IS NOT NULL
- index(organization_id, parcela_id)

Entregar SQL completo (solo ALTER + CREATE INDEX, no recrear tabla).
```

---

## Fase 2.1 — Seeds

### 🟨 Prompt para Cursor Agent (Seeds)

```
Crear un script de seeds reproducible para Supabase Postgres.

Carpeta: /db/seeds
Archivos:
- 001_ag_variedades.sql (insert/upsert)
- 002_ag_parametros_altitud.sql
- 003_ag_parametros_fenologicos.sql
- 004_ag_reglas_suelo_ruleset_1_0_0.sql
- 005_ag_ruleset_versions.sql

Condiciones:
- Usar INSERT ... ON CONFLICT DO UPDATE para idempotencia.
- Para variedades, ON CONFLICT sobre nombre_comun.
- Para reglas suelo, ON CONFLICT sobre (ruleset_version, variable, operador, umbral_min, accion_tipo).

Datos requeridos:

VARIEDADES (mínimo 30):
Incluir: Caturra, Catuaí, Bourbon, Typica, Colombia, Castillo, Tabi, Geisha, SL28, SL34, Pacamara, Maragogipe, Mundo Novo, Villa Sarchí, Obatã, Catimor, Sarchimor, Marsellesa, Starmaya, H1 (Centroamérica Oro), Parainema, IHCAFE 90, Costa Rica 95, Batian, Ruiru 11, K7, Anacafé 14, Lempira, Java, Mokka.

Campos por variedad:
- nombre_comun, grupo_morfologico (compacto|alto|compuesto|exotico|f1)
- factor_demanda_base (0.85-1.25), micros_multiplier (0.8-1.4)
- limite_yield_sostenible_kg_ha (800-3500 según grupo)
- sens_exceso_n, sens_deficit_k, tolerancia_sequia, tolerancia_calor

REGLAS SUELO (mínimo 40):
Variables: pH, Al, CIC, MO, P, K, Ca, Mg, CaMgRatio, KSatPct, BaseSatPct
Para cada variable: umbrales crítico/deficiente/adecuado/excesivo
Acciones: bloqueo, ajuste eficiencia, alerta
Incluir explain_code estable para auditoría (ej: SOIL_PH_CRITICAL_LOW)

PARÁMETROS ALTITUD:
- baja: 0-1200 msnm, shift 0 días
- media: 1200-1500 msnm, shift +7 días
- alta: >1500 msnm, shift +14 días

PARÁMETROS FENOLÓGICOS (por zona):
- cabeza_alfiler, expansion_rapida, llenado_grano, maduracion
- Con días post-floración y proporción de dosis por fase

Entregar código listo para ejecutar con: psql -f db/seeds/001_ag_variedades.sql
```

---

## Fase 2.2 — Edge Function: Motor v1

### 🟨 Prompt para Cursor Agent (Edge Function)

```
Implementar una Supabase Edge Function en Deno TypeScript: generate_nutrition_plan_v1.

CONTEXTO DEL PROYECTO:
- Supabase URL: https://qbwmsarqewxjuwgkdfmg.supabase.co
- Las tablas usan organization_id (no org_id).
- RLS valida via get_user_organization_id(auth.uid()).
- Ya existen: nutricion_parcela_contexto, nutricion_analisis_suelo, nutricion_planes, nutricion_fraccionamientos.
- Catálogos: ag_variedades, ag_reglas_suelo, ag_parametros_fenologicos, ag_parametros_altitud.
- La tabla nutricion_planes ahora tiene: ruleset_version, engine_version, idempotency_key, hash_receta, receta_canonica_json, explain_json, nivel_confianza, modo_calculo, data_quality_json, created_by.

INPUTS (JSON body):
- parcela_id (uuid) requerido
- idempotency_key (string) requerido
- fecha_floracion_principal (YYYY-MM-DD) opcional
- rendimiento_proyectado_kg_ha (number) opcional
- analisis_suelo_id (uuid|null) opcional

BEHAVIOR:
1. Validar JWT (Authorization header). Extraer user_id.
2. Consultar nutricion_parcela_contexto por parcela_id. Verificar que organization_id del contexto coincide con la org del usuario (usar service_role key para consultar organizacion_usuarios).
3. Idempotencia: buscar nutricion_planes con (parcela_id, idempotency_key). Si existe, retornar el existente.
4. Determinar modo_calculo:
   - 'completo' si hay analisis_suelo_id Y rendimiento_proyectado Y fecha_floracion
   - 'heuristico' si falta cualquiera
5. Cargar contexto: altitud_msnm, edad_promedio_anios, variedades (de ag_parcela_variedades con join a ag_variedades).
6. Si hay analisis_suelo_id: cargar nutricion_analisis_suelo.
7. Ejecutar submotores:
   a) Edáfico: evaluar ag_reglas_suelo contra valores del análisis. Generar bloqueos[] y ajustes_eficiencia.
   b) Genético: calcular multiplicador varietal ponderado desde ag_parcela_variedades. Aplicar micros_multiplier.
   c) Fenológico: generar cronograma usando ag_parametros_fenologicos + zona altitudinal (derivada de altitud). Aplicar shift de ag_parametros_altitud.
   d) Cálculo nutricional: extracción base × rendimiento × multiplicadores / eficiencia.
8. Generar data_quality: { missing:[], estimated:[], stale:[] }.
9. Generar receta_canonica_json con canonicalStringify (claves ordenadas recursivamente).
10. Calcular hash SHA-256 del JSON canónico.
11. Persistir en nutricion_planes.
12. Generar fraccionamientos en nutricion_fraccionamientos.
13. Responder JSON con plan completo.

UTILIDADES:
- canonicalStringify(obj): ordenar claves recursivamente, normalizar floats a 2 decimales.
- sha256(str): usar crypto.subtle.digest.

TESTS (6 fixtures):
1. Andisol ácido: pH 4.7, Al alto → bloqueo NPK + requisito encalado
2. Castillo yield alto → multiplicador +15% N y K
3. Mezcla 60/30/10 Caturra/Bourbon/Geisha → multiplicador ponderado correcto
4. Zona alta 1800 msnm → cronograma extendido, K desplazado
5. Sin análisis de suelo → modo heurístico + nivel_confianza bajo
6. Mismo idempotency_key → retorna mismo plan

Crear en: /supabase/functions/generate_nutrition_plan_v1/index.ts
Entregar código listo para commit.
```

---

## Fase 2.3 — Ejecución, Evidencia y Auditoría

### 🟦 Prompt para Supabase AI (SQL)

```
Generar SQL Supabase Postgres para las siguientes tablas transaccionales.

CONTEXTO: Multi-tenant por organization_id. RLS usa get_user_organization_id(auth.uid()). Ya existe nutricion_planes y nutricion_aplicaciones.

CREAR:

1. ag_plan_events (audit log inmutable):
   - id uuid pk default gen_random_uuid()
   - organization_id uuid not null
   - plan_id uuid not null references nutricion_planes(id)
   - event_type text not null check (event_type in ('generated','approved','revised','execution_logged','invoice_linked','cancelled_climate','closed','terms_accepted'))
   - payload_json jsonb
   - created_by uuid not null references auth.users(id)
   - created_at timestamptz not null default now()
   - Índices: (organization_id, plan_id), (plan_id, event_type)

2. ag_nutrition_finance (facturas vinculadas a plan):
   - id uuid pk
   - organization_id uuid not null
   - plan_id uuid not null references nutricion_planes(id)
   - invoice_url text
   - invoice_amount numeric
   - currency text default 'USD'
   - supplier_name text
   - payment_mode text check (payment_mode in ('cash','credit','coop_deduction'))
   - created_by uuid not null references auth.users(id)
   - created_at timestamptz default now()

RLS para ambas tablas:
- SELECT: organization_id = get_user_organization_id(auth.uid())
- INSERT: organization_id = get_user_organization_id(auth.uid()) AND created_by = auth.uid()

Habilitar RLS en ambas.

AMPLIAR nutricion_aplicaciones (si le faltan campos):
- ADD COLUMN IF NOT EXISTS dosis_aplicada_json jsonb
- ADD COLUMN IF NOT EXISTS evidencias jsonb
- ADD COLUMN IF NOT EXISTS costo_real numeric
- ADD COLUMN IF NOT EXISTS fase_objetivo text

Crear Storage buckets (SQL):
INSERT INTO storage.buckets (id, name, public) VALUES
  ('soil-analyses', 'soil-analyses', false),
  ('nutrition-executions', 'nutrition-executions', false)
ON CONFLICT DO NOTHING;

Storage policies: lectura/escritura restringida por organization_id en el path.

Entregar SQL completo.
```

### 🟨 Prompt para Cursor Agent (Edge Function ejecución)

```
Implementar Supabase Edge Function: log_nutrition_execution_v1.

CONTEXTO: Misma config que generate_nutrition_plan_v1. Tablas: nutricion_planes, nutricion_aplicaciones, ag_plan_events.

INPUTS:
- plan_id uuid
- fecha_aplicacion YYYY-MM-DD
- tipo_aplicacion (edafica|foliar|mixta)
- dosis_aplicada_json (formato: { nutrientes: { N_kg_ha, P2O5_kg_ha, K2O_kg_ha, ... }, productos: [...], metodo: {...} })
- evidencias string[] (urls de Storage)
- costo_real numeric (opcional)
- idempotency_key string (requerido)

BEHAVIOR:
1. Validar JWT y org.
2. Verificar plan pertenece a org (organization_id).
3. Idempotencia: unique(plan_id, idempotency_key). Si existe, retornar.
4. Insertar fila en nutricion_aplicaciones.
5. Recalcular acumulados sumando dosis_aplicada_json.nutrientes de todas las ejecuciones del plan.
6. Comparar contra receta_canonica_json.demanda_final del plan.
7. Calcular execution_pct_by_nutrient y execution_pct_total (ponderado: N 0.35, K2O 0.35, P2O5 0.15, otros 0.15).
8. Actualizar nutricion_planes: execution_pct_total, execution_pct_by_nutrient, estado (recommended→in_execution si primera, >=90%→completed).
9. Insertar ag_plan_events (execution_logged).
10. Responder con ejecución y nuevos porcentajes.

TESTS:
- Primera ejecución → estado in_execution
- Acumulación suma correctamente
- execution_pct no supera 100
- Idempotencia

Crear en: /supabase/functions/log_nutrition_execution_v1/index.ts
```

---

## Fase 2.4 — Aprobación, Revisiones y RBAC

### 🟦 Prompt para Supabase AI

```
Ya tengo organizacion_usuarios con rol_interno (admin_org, tecnico, comercial, auditor, viewer).
Necesito crear función helper para validar rol en RLS de nutrición.

CREATE OR REPLACE FUNCTION public.has_org_role(_user_id uuid, _org_id uuid, _roles text[])
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizacion_usuarios
    WHERE user_id = _user_id
      AND organizacion_id = _org_id
      AND rol_interno = ANY(_roles)
      AND activo = true
  )
$$;

Crear policies adicionales en nutricion_planes:
- UPDATE estado a 'approved_tecnico' o 'superseded': solo si has_org_role(auth.uid(), organization_id, ARRAY['tecnico','admin_org'])

Entregar SQL completo.
```

### 🟨 Prompt para Cursor Agent (Edge Functions aprobación + revisión)

```
Implementar 2 Edge Functions:

1) approve_nutrition_plan_v1
   Input: plan_id, approval_notes (opcional)
   Behavior:
   - Validar JWT y org
   - Verificar rol tecnico o admin_org via organizacion_usuarios
   - Set estado = approved_tecnico
   - Insertar ag_plan_events (approved)
   - Return plan actualizado

2) revise_nutrition_plan_v1
   Input: plan_id_original, idempotency_key, revision_reason, manual_adjustments_json
   
   Formato manual_adjustments_json:
   {
     "nutrientes": { "N_kg_ha": { "delta": -15, "reason_code": "CASH_CONSTRAINT" } },
     "cronograma": { "shift_days": 7, "reason_code": "RAINFALL_FORECAST" }
   }
   
   Behavior:
   - Validar rol tecnico o admin_org
   - Cargar plan original (receta_canonica_json, contexto)
   - Aplicar patch con LÍMITES DUROS:
     - N no puede bajar >30% si yield alto y variedad intensiva
     - K no puede bajar >25% si fase llenado y compactos
     - No permitir saltarse encalado en suelos ácidos
   - Recalcular hash SHA-256 del nuevo JSON canónico
   - Insertar nuevo plan con plan_revision_of = original
   - Marcar original estado = superseded
   - Registrar eventos
   
   Tests:
   - Revisión crea nuevo plan
   - Original queda superseded
   - Límites duros rechazan cambios extremos
   - Idempotencia por (plan_id_original, idempotency_key)

Crear en: /supabase/functions/approve_nutrition_plan_v1/ y /supabase/functions/revise_nutrition_plan_v1/
```

---

## Fase 2.5 — Agroinsumos: Proveedores, Cotización, Comisión

### 🟦 Prompt para Supabase AI (SQL)

```
Generar SQL Supabase Postgres para marketplace de agroinsumos.

CONTEXTO: Multi-tenant por organization_id. RLS con get_user_organization_id(auth.uid()).

CREAR:

1. ag_suppliers (proveedores/centros):
   - id uuid pk
   - organization_id uuid not null
   - nombre text not null
   - pais text, provincia text, canton text, distrito text
   - lat numeric, lng numeric
   - radio_servicio_km numeric
   - telefono text, whatsapp text, email text
   - commission_pct_default numeric default 0.03
   - activo boolean default true
   - created_by uuid references auth.users(id)
   - created_at timestamptz default now()

2. ag_supplier_products (catálogo precios):
   - id uuid pk
   - supplier_id uuid not null references ag_suppliers(id) on delete cascade
   - nombre_producto text not null
   - tipo text check ('NPK','N','P','K','Ca','Mg','Micros','Enmienda')
   - analisis_json jsonb (% nutrientes)
   - unidad text check ('kg','saco_50kg','litro')
   - precio_unitario numeric not null
   - moneda text default 'USD'
   - vigencia_desde date, vigencia_hasta date
   - activo boolean default true

3. ag_quotes (cotizaciones):
   - id uuid pk
   - organization_id uuid not null
   - plan_id uuid references nutricion_planes(id)
   - supplier_id uuid references ag_suppliers(id)
   - quote_status text check ('draft','sent','accepted','expired','cancelled','fulfilled') default 'draft'
   - quote_json jsonb not null
   - hash_quote text
   - created_by uuid references auth.users(id)
   - created_at timestamptz default now()

4. ag_quote_events:
   - id uuid pk
   - quote_id uuid references ag_quotes(id)
   - event_type text check ('generated','sent','accepted','paid','fulfilled')
   - payload_json jsonb
   - created_by uuid references auth.users(id)
   - created_at timestamptz default now()

5. ag_commissions:
   - id uuid pk
   - organization_id uuid not null
   - quote_id uuid references ag_quotes(id)
   - supplier_id uuid references ag_suppliers(id)
   - commission_pct numeric
   - commission_amount numeric
   - status text check ('estimated','confirmed','paid') default 'estimated'
   - created_at timestamptz default now()

RLS en todas: SELECT/INSERT/UPDATE por organization_id = get_user_organization_id(auth.uid()).
ag_supplier_products hereda acceso via supplier_id → ag_suppliers.organization_id.

Índices: (organization_id), (supplier_id), (plan_id) donde aplique.
Entregar SQL completo.
```

### 🟨 Prompt para Cursor Agent (Quote Engine)

```
Implementar Edge Function: quote_nutrition_inputs_v1.

INPUTS:
- plan_id uuid
- supplier_id uuid (opcional — si no se pasa, sugerir proveedores cercanos)
- constraints json (opcional: ["NO_KCL", "ORGANIC_ONLY", "CASH_LIMIT"])
- idempotency_key string

BEHAVIOR:
1. Validar org + membership.
2. Cargar plan (receta_canonica_json: demanda_final, cronograma, flags, zona altitudinal).
3. Si NO supplier_id:
   - Obtener parcela lat/lng
   - Calcular distancia Haversine a ag_suppliers activos de la org
   - Retornar top 3 ordenados por distancia con metadata
4. Si supplier_id:
   - Cargar ag_supplier_products activos del proveedor
   - Traducir demanda_final nutrientes a líneas de producto:
     a) Seleccionar fuente N, P, K según constraints y zona:
        - Zona baja: preferir nitratos sobre urea
        - NO_KCL: usar SOP
        - Suelo ácido con encalado: cotizar enmienda separada
     b) Convertir kg nutriente a kg producto usando analisis_json (%)
     c) Calcular total por moneda
   - Generar quote_json canónico + hash SHA-256
   - Idempotencia: unique(plan_id, supplier_id, idempotency_key)
   - Insertar ag_quotes status='draft'
   - Insertar ag_quote_events('generated')
   - Crear ag_commissions status='estimated'
5. Return quote.

TESTS:
- Sugerencia proveedores ordenada por distancia
- NO_KCL fuerza SOP
- Conversión nutriente→producto correcta
- Idempotencia

Crear en: /supabase/functions/quote_nutrition_inputs_v1/index.ts
```

---

## Storage: Buckets y Paths

### 🟦 Prompt para Supabase AI

```
Crear buckets de Storage y policies para evidencia de nutrición.

Buckets:
- soil-analyses (privado)
- nutrition-executions (privado)

Paths esperados:
- soil-analyses/{organization_id}/{parcela_id}/{filename}
- nutrition-executions/{organization_id}/{parcela_id}/{plan_id}/{YYYY}/{MM}/{filename}

Policies:
- SELECT: usuario puede leer si (storage.foldername(name))[1] coincide con su organization_id
- INSERT: igual + authenticated
- DELETE: solo admin_org

Usar get_user_organization_id(auth.uid()) para validar.
Entregar SQL completo.
```

---

## 🎨 UI (Lovable) — Lo que yo construiré cuando los endpoints estén listos

### Fase 2.1 UI
- Añadir módulo `nutricion` al registry de org-modules
- Tab "Catálogos" en panel admin para ver variedades y reglas (solo lectura)

### Fase 2.2 UI
- **Generar Plan**: Formulario con selección de parcela, fecha floración, rendimiento, análisis de suelo. Botón "Generar" que llama al endpoint.
- **Ver Plan**: Dosis final (N, P₂O₅, K₂O), cronograma como timeline, flags/bloqueos en badges, explain en acordeón.
- Mostrar nivel_confianza y modo_calculo prominentemente.
- Disclaimer: "Recomendación orientativa, no garantía de rendimiento."

### Fase 2.3 UI
- **Registrar Ejecución**: Seleccionar plan → fecha, tipo aplicación, dosis → subir evidencia a Storage → confirmar.
- **Barra de progreso**: % ejecución por nutriente con colores.
- **Timeline de eventos**: Desde ag_plan_events.

### Fase 2.4 UI
- Botón "Enviar a aprobación técnica" (productor)
- Pantalla "Aprobar" (técnico) con checkbox de aceptación legal
- Pantalla "Crear revisión" con sliders de delta y reason_codes

### Fase 2.5 UI
- Lista de proveedores cercanos con distancia
- Cotización: líneas de producto, totales, constraints como chips
- Disclaimer: "Cotización referencial"
- Botón aceptar cotización + subir factura

---

## ⚡ Orden de Ejecución Recomendado

1. **Supabase AI**: Ejecutar SQL catálogos + ampliar nutricion_planes
2. **Cursor**: Generar seeds y cargarlos
3. **Cursor**: Implementar Edge Function generate_nutrition_plan_v1
4. **Lovable (yo)**: UI de Generar Plan + Ver Plan
5. **Supabase AI**: SQL ejecución + auditoría + storage
6. **Cursor**: Edge Function log_nutrition_execution_v1
7. **Lovable (yo)**: UI Registrar Ejecución + % progreso
8. **Supabase AI**: SQL RBAC + revisiones
9. **Cursor**: Edge Functions aprobación + revisión
10. **Lovable (yo)**: UI aprobación + revisión
11. **Supabase AI**: SQL suppliers + quotes
12. **Cursor**: Edge Function quote engine
13. **Lovable (yo)**: UI proveedores + cotización

---

## ✅ Checklist Final Fase 2

- [ ] Migraciones aplicadas sin errores
- [ ] RLS verificado con 2 organizaciones distintas
- [ ] Seeds cargados (30+ variedades, 40+ reglas suelo)
- [ ] Edge Function genera plan idempotente
- [ ] Hash canónico estable (mismo input = mismo hash)
- [ ] 6 fixtures pasan tests
- [ ] Storage buckets operativos
- [ ] Ejecución suma y actualiza % correctamente
- [ ] Aprobación técnica con evento auditado
- [ ] Revisión genera nuevo plan inmutable
- [ ] Cotización traduce nutrientes a productos
- [ ] UI end-to-end funcional
