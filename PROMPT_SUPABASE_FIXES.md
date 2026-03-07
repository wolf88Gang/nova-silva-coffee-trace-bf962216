# Prompt para Supabase – Correcciones pendientes

Ejecutá estos bloques en el SQL Editor para cerrar los puntos abiertos.

---

## 1. Crear `is_admin()` si no existe

La función verifica si el usuario tiene rol `admin` en `user_roles`:

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin');
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Nota:** Si `user_roles` no existe, creala primero o adaptá la función a tu tabla de roles.

---

## 2. Actualizar RLS con `is_admin()` (opcional)

Si las políticas actuales no usan `is_admin()` y querés que los admins vean todo, ejecutá esto para las tablas que lo necesiten. Ejemplo para `reclamos_postventa`:

```sql
DROP POLICY IF EXISTS "reclamos_select" ON public.reclamos_postventa;
CREATE POLICY "reclamos_select" ON public.reclamos_postventa FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());

DROP POLICY IF EXISTS "comparacion_select" ON public.comparacion_muestras;
CREATE POLICY "comparacion_select" ON public.comparacion_muestras FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());

-- Repetir el patrón para update/delete si aplica
```

---

## 3. Vista `kpi_ranking_coops`

Tu proyecto puede usar `organizations` o `platform_organizations`. Probá en este orden:

### Opción A: Si existe `public.organizations`

```sql
CREATE OR REPLACE VIEW public.kpi_ranking_coops AS
SELECT
  lc.cooperativa_id,
  o.nombre AS cooperativa_nombre,
  COUNT(lc.id)::numeric AS puntaje,
  COUNT(lc.id)::bigint AS lotes_entregados
FROM public.lotes_comerciales lc
LEFT JOIN public.organizations o ON o.id = lc.cooperativa_id
WHERE lc.cooperativa_id IS NOT NULL
GROUP BY lc.cooperativa_id, o.nombre;
```

### Opción B: Si existe `public.platform_organizations` (Lovable)

```sql
CREATE OR REPLACE VIEW public.kpi_ranking_coops AS
SELECT
  lc.cooperativa_id,
  po.name AS cooperativa_nombre,
  COUNT(lc.id)::numeric AS puntaje,
  COUNT(lc.id)::bigint AS lotes_entregados
FROM public.lotes_comerciales lc
LEFT JOIN public.platform_organizations po ON po.id = lc.cooperativa_id
WHERE lc.cooperativa_id IS NOT NULL
GROUP BY lc.cooperativa_id, po.name;
```

### Opción C: Vista mínima (sin nombre de cooperativa)

```sql
CREATE OR REPLACE VIEW public.kpi_ranking_coops AS
SELECT
  lc.cooperativa_id,
  NULL::text AS cooperativa_nombre,
  COUNT(lc.id)::numeric AS puntaje,
  COUNT(lc.id)::bigint AS lotes_entregados
FROM public.lotes_comerciales lc
WHERE lc.cooperativa_id IS NOT NULL
GROUP BY lc.cooperativa_id;
```

**Para elegir:** Ejecutá primero `SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name IN ('organizations','platform_organizations');` y usá la opción que corresponda.

---

## 4. RPC `get_ranking_cooperativas` – compatibilidad con `platform_organizations`

Si el RPC falla porque no existe `organizations`, reemplazalo por esta versión que prueba ambos esquemas:

```sql
CREATE OR REPLACE FUNCTION public.get_ranking_cooperativas(p_organization_id uuid DEFAULT NULL)
RETURNS TABLE (
  cooperativa_id uuid,
  nombre text,
  puntaje numeric,
  volumen_total numeric,
  lotes_entregados bigint
) AS $$
DECLARE
  v_org_id uuid := COALESCE(p_organization_id, public.get_user_organization_id(auth.uid()));
BEGIN
  IF v_org_id IS NULL THEN RETURN; END IF;

  RETURN QUERY
  SELECT
    lc.cooperativa_id,
    COALESCE(
      (SELECT o.nombre FROM public.organizations o WHERE o.id = lc.cooperativa_id LIMIT 1),
      (SELECT po.name FROM public.platform_organizations po WHERE po.id = lc.cooperativa_id LIMIT 1)
    )::text AS nombre,
    COUNT(lc.id)::numeric AS puntaje,
    COUNT(lc.id)::numeric AS volumen_total,
    COUNT(lc.id)::bigint AS lotes_entregados
  FROM public.lotes_comerciales lc
  WHERE (lc.exportador_id = v_org_id OR lc.organization_id = v_org_id)
    AND lc.cooperativa_id IS NOT NULL
  GROUP BY lc.cooperativa_id
  ORDER BY lotes_entregados DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
```

---

## 5. Pendientes: reclamos_postventa y get_user_organization_id

### 5a. reclamos_postventa – agregar `organization_id` si falta

Si la tabla existe sin `organization_id`, agregala y aplicá RLS:

```sql
-- Agregar columna si no existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'reclamos_postventa' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE public.reclamos_postventa ADD COLUMN organization_id uuid;
    CREATE INDEX IF NOT EXISTS idx_reclamos_org ON public.reclamos_postventa (organization_id);
    -- Backfill: inferir org desde lotes_comerciales cuando hay lote_comercial_id
    UPDATE public.reclamos_postventa r SET organization_id = COALESCE(lc.organization_id, lc.exportador_id, lc.cooperativa_id)
    FROM public.lotes_comerciales lc WHERE r.lote_comercial_id = lc.id AND r.organization_id IS NULL;
  END IF;
END $$;

-- RLS con is_admin (solo si organization_id existe)
DROP POLICY IF EXISTS "reclamos_select" ON public.reclamos_postventa;
CREATE POLICY "reclamos_select" ON public.reclamos_postventa FOR SELECT TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "reclamos_insert" ON public.reclamos_postventa;
CREATE POLICY "reclamos_insert" ON public.reclamos_postventa FOR INSERT TO authenticated
  WITH CHECK (organization_id = public.get_user_organization_id(auth.uid()));
DROP POLICY IF EXISTS "reclamos_update" ON public.reclamos_postventa;
CREATE POLICY "reclamos_update" ON public.reclamos_postventa FOR UPDATE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
DROP POLICY IF EXISTS "reclamos_delete" ON public.reclamos_postventa;
CREATE POLICY "reclamos_delete" ON public.reclamos_postventa FOR DELETE TO authenticated
  USING (organization_id = public.get_user_organization_id(auth.uid()) OR public.is_admin());
```

### 5b. get_user_organization_id – crear si no existe

La función lee `organization_id` desde `public.profiles` (tabla típica de Lovable/Supabase):

```sql
CREATE OR REPLACE FUNCTION public.get_user_organization_id(p_user_id uuid)
RETURNS uuid AS $$
  SELECT organization_id FROM public.profiles WHERE user_id = p_user_id LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;
```

**Si `profiles` usa otra columna** (ej. `id` en lugar de `user_id`), adaptá la query. Lovable suele usar `profiles(user_id, organization_id)`.

---

## 6. Verificación final

```sql
-- Funciones
SELECT proname FROM pg_proc WHERE proname IN ('is_admin', 'get_user_organization_id');

-- Vista
SELECT table_name, table_type FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name = 'kpi_ranking_coops';

-- Tablas comerciales
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('comparacion_muestras', 'lotes_exportacion', 'clientes_compradores', 'ofertas_comerciales', 'reclamos_postventa')
ORDER BY table_name;

-- Columna organization_id en reclamos_postventa
SELECT column_name FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'reclamos_postventa' AND column_name = 'organization_id';
```
