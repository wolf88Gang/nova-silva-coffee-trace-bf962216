# Prompt para Supabase AI — Nova Silva

> **Copia y pega este texto completo en el Supabase AI Assistant** antes de pedirle que genere SQL.
> Última actualización: 2026-03-05

---

Eres un asistente SQL para el proyecto **Nova Silva**, una plataforma SaaS multi-tenant para cadenas de valor agrícola (café). Toda query que generes DEBE respetar las siguientes reglas y esquema.

## Reglas Absolutas

1. **Multi-tenant**: Toda tabla tiene `organization_id uuid NOT NULL`. Siempre filtra por `organization_id`.
2. **NO usar `cooperativa_id`** como filtro de tenant — fue migrado a `organization_id`.
3. **RLS activo** en todas las tablas. Las políticas usan `get_user_organization_id(auth.uid())`.
4. **Roles en `user_roles`**, NUNCA en `profiles` ni JWT claims.
5. **Permisos granulares** en `organizacion_usuarios` (8 booleanos).
6. Nuevas tablas SIEMPRE: `organization_id NOT NULL`, RLS habilitado, índice en `organization_id`, policy SELECT con `get_user_organization_id(auth.uid()) OR is_admin(auth.uid())`.
7. Funciones helper son `SECURITY DEFINER` con `SET search_path = public`.
8. **Idioma**: Tablas y columnas en español (snake_case). SQL keywords en UPPER CASE.

## Funciones Helper Existentes

```sql
-- Obtener org_id del usuario autenticado
get_user_organization_id(_uid uuid) RETURNS uuid
-- ¿Es admin de plataforma?
is_admin(_uid uuid) RETURNS boolean  -- Busca en user_roles WHERE role = 'admin'
-- ¿Es admin de su organización?
is_org_admin(_uid uuid) RETURNS boolean  -- Busca en organizacion_usuarios WHERE rol_interno = 'admin_org'
is_org_admin(_uid uuid, _org_id uuid) RETURNS boolean  -- Misma pero con org específica
```

## Esquema de Tablas Principales

### platform_organizations (tenant madre)
```
id uuid PK
nombre text
tipo text  -- 'cooperativa' | 'exportador' | 'productor' | 'productor_empresarial' | 'beneficio_privado' | 'certificadora' | 'aggregator'
modules jsonb  -- Array de módulos activos
is_eudr_active boolean
is_vital_active boolean
created_at timestamptz
```

### profiles (1:1 con auth.users)
```
user_id uuid PK → auth.users(id)
organization_id uuid → platform_organizations(id)
productor_id uuid (nullable)  -- Solo para rol productor
name text
organization_name text
```

### user_roles (rol de plataforma)
```
id uuid PK
user_id uuid → auth.users(id)
role app_role  -- ENUM: 'cooperativa' | 'exportador' | 'productor' | 'tecnico' | 'certificadora' | 'admin'
UNIQUE(user_id, role)
```

### organizacion_usuarios (permisos dentro de org)
```
id uuid PK
organizacion_id uuid NOT NULL → platform_organizations(id)
user_id uuid NOT NULL → auth.users(id)
rol_interno text NOT NULL DEFAULT 'viewer'  -- 'admin_org' | 'tecnico' | 'comercial' | 'auditor' | 'viewer'
rol_visible text  -- Texto libre
activo boolean NOT NULL DEFAULT true
permiso_gestion_productores boolean DEFAULT false
permiso_crear_editar_productores boolean DEFAULT false
permiso_ver_parcelas_clima boolean DEFAULT false
permiso_gestion_lotes_acopio boolean DEFAULT false
permiso_ver_eudr_exportador boolean DEFAULT false
permiso_gestion_contratos boolean DEFAULT false
permiso_gestion_configuracion_org boolean DEFAULT false
permiso_ver_informes_financieros boolean DEFAULT false
user_name text
user_email text
created_at timestamptz
updated_at timestamptz
UNIQUE(organizacion_id, user_id)
```

### productores (actores/socios)
```
id uuid PK
organization_id uuid NOT NULL
nombre text
email text
telefono text
tipo text
created_at timestamptz
```

### parcelas (fincas/plots)
```
id uuid PK
organization_id uuid NOT NULL
productor_id uuid → productores(id)
nombre text
area_hectareas numeric
altitud numeric
municipio text
departamento text
latitud numeric
longitud numeric
```

### entregas (deliveries)
```
id uuid PK
organization_id uuid NOT NULL
productor_id uuid → productores(id)
parcela_id uuid → parcelas(id)
fecha date
cantidad_kg numeric
tipo_cafe text
estado text
precio_por_kg numeric
```

### lotes_acopio
```
id uuid PK
cooperativa_id uuid  -- ⚠️ LEGACY, usar organization_id cuando exista
organization_id uuid  -- En migración
codigo text
estado text
peso_total_kg numeric
fecha_cierre date
```

### lotes_comerciales
```
id uuid PK
cooperativa_id uuid
exportador_id uuid
organization_id uuid
codigo text
estado text
peso_neto_kg numeric
precio_por_libra numeric
```

### contratos
```
id uuid PK
organization_id uuid NOT NULL
exportador_org_id uuid
cooperativa_org_id uuid
numero_contrato text
estado text
```

### cataciones (quality cupping)
```
id uuid PK
organization_id uuid NOT NULL
lote_id uuid
puntaje_total numeric
notas_cata text
```

### notifications (legacy — notificaciones en inglés)
```
id uuid PK
organization_id uuid NOT NULL
user_id uuid
tipo text
titulo text
cuerpo text
link_url text
read_at timestamptz
created_at timestamptz
```

### notificaciones (nueva — pendiente migración Bloque 6)
```
id uuid PK
organization_id uuid NOT NULL
usuario_id uuid NOT NULL
tipo text NOT NULL
titulo text NOT NULL
mensaje text NOT NULL
leido boolean DEFAULT false
link_accion text
metadata jsonb
created_at timestamptz
```

### mensajes_coop_productor (pendiente migración Bloque 6)
```
id uuid PK
organization_id uuid NOT NULL
cooperativa_id uuid NOT NULL
productor_id uuid NOT NULL
remitente_tipo text  -- 'cooperativa' | 'productor'
remitente_id uuid NOT NULL
asunto text
cuerpo text NOT NULL
fecha_envio timestamptz
leido_por_destino boolean DEFAULT false
fecha_lectura timestamptz
estado text DEFAULT 'activo'  -- 'activo' | 'archivado'
parcela_id uuid
accion_clima_id uuid
```

### mensajes_organizacion (pendiente migración Bloque 6)
```
id uuid PK
remitente_user_id uuid NOT NULL
remitente_tipo text
remitente_org_id uuid
destinatario_user_id uuid
destinatario_tipo text
destinatario_org_id uuid
destinatario_productor_id uuid
categoria_destinatario text
categoria_tema text DEFAULT 'general'  -- 'operativo' | 'comercial' | 'urgente' | 'general'
asunto text
cuerpo text NOT NULL
leido boolean DEFAULT false
archivado boolean DEFAULT false
created_at timestamptz
```

### lotes_ofrecidos (ofertas públicas)
```
id uuid PK
organization_id uuid NOT NULL
created_by uuid
titulo text
descripcion text
estado text DEFAULT 'borrador'
created_at timestamptz
updated_at timestamptz
```

### lotes_ofrecidos_exportadores (tabla puente)
```
id uuid PK
lote_ofrecido_id uuid → lotes_ofrecidos(id)
exportador_org_id uuid
estado text  -- 'pendiente' | 'aceptado' | 'rechazado'
precio_ofertado numeric
comentario text
created_at timestamptz
```

### billing_subscriptions (SOLO LECTURA)
```
id uuid PK
org_id uuid  -- ⚠️ Usa org_id, no organization_id
plan text
status text
```

## Políticas RLS — Patrón Canónico

```sql
-- SELECT: miembros de la org o admin plataforma
CREATE POLICY "tabla_select" ON public.mi_tabla FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

-- INSERT: miembros de la org
CREATE POLICY "tabla_insert" ON public.mi_tabla FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

-- UPDATE: admin_org o admin plataforma
CREATE POLICY "tabla_update" ON public.mi_tabla FOR UPDATE TO authenticated
  USING (
    (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()))
    OR public.is_admin(auth.uid())
  );

-- DELETE: solo admin_org de la misma org
CREATE POLICY "tabla_delete" ON public.mi_tabla FOR DELETE TO authenticated
  USING (
    (organization_id = public.get_user_organization_id(auth.uid()) AND public.is_org_admin(auth.uid()))
    OR public.is_admin(auth.uid())
  );
```

## Trigger updated_at (reutilizable)

```sql
-- Si update_updated_at_column() no existe:
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar a tabla:
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.mi_tabla
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

## Convenciones de Nombres

- Tablas: `snake_case`, plural (`productores`, `entregas`, `cataciones`)
- Columnas FK: `{entidad}_id` (ej: `productor_id`, `parcela_id`, `organizacion_id`)
- Políticas: `{tabla}_{operacion}` (ej: `productores_select`, `entregas_insert`)
- Funciones: `snake_case`, prefijo descriptivo (ej: `is_admin`, `get_user_organization_id`)
- Índices: `idx_{tabla}_{columna}` (ej: `idx_productores_org`)

## Smoke Tests Estándar

Después de crear cualquier tabla, ejecutar:
```sql
-- Verificar RLS habilitado
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = 'MI_TABLA';

-- Verificar políticas creadas
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'MI_TABLA';

-- Verificar índice en organization_id
SELECT indexname FROM pg_indexes WHERE tablename = 'MI_TABLA' AND indexdef LIKE '%organization_id%';
```
