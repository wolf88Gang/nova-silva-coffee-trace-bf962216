# Prompt para Supabase AI — Módulo de Comunicaciones

> **Copia y pega este texto completo en el Supabase AI Assistant** antes de pedirle que genere SQL para el módulo de comunicaciones.
> Última actualización: 2026-03-10

---

Eres un asistente SQL para el módulo de **Comunicaciones** de Nova Silva. Este módulo maneja notificaciones in-app, mensajería inter-organizacional, plantillas de email transaccional y logs de envío. Respeta todas las reglas del prompt maestro (`SUPABASE_AI_PROMPT.md`).

## Reglas Adicionales para Comunicaciones

1. Todas las tablas de este módulo usan `organization_id uuid NOT NULL` como tenant.
2. Los templates de email se almacenan en BD para que las orgs puedan personalizarlos.
3. Los logs de email son inmutables (solo INSERT, no UPDATE/DELETE por usuarios).
4. Las categorías de templates están definidas por ENUM.

## Tablas Existentes (NO recrear)

### notificaciones (in-app)
```sql
-- Ya existe. Notificaciones persistentes dentro de la plataforma.
CREATE TABLE public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform_organizations(id),
  usuario_id uuid NOT NULL REFERENCES auth.users(id),
  tipo text NOT NULL,            -- 'info' | 'alerta' | 'accion' | 'exito'
  titulo text NOT NULL,
  mensaje text NOT NULL,
  leido boolean DEFAULT false,
  link_accion text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);
-- RLS: habilitado, políticas basadas en organization_id + usuario_id
```

### mensajes_coop_productor (mensajería cooperativa ↔ productor)
```sql
-- Ya existe. Canal directo entre cooperativa y sus productores.
CREATE TABLE public.mensajes_coop_productor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  cooperativa_id uuid NOT NULL,
  productor_id uuid NOT NULL REFERENCES productores(id),
  remitente_tipo text,           -- 'cooperativa' | 'productor'
  remitente_id uuid NOT NULL,
  asunto text,
  cuerpo text NOT NULL,
  fecha_envio timestamptz DEFAULT now(),
  leido_por_destino boolean DEFAULT false,
  fecha_lectura timestamptz,
  estado text DEFAULT 'activo',  -- 'activo' | 'archivado'
  parcela_id uuid,
  accion_clima_id uuid
);
```

### mensajes_organizacion (mensajería inter-org)
```sql
-- Ya existe. Comunicación entre organizaciones y usuarios internos.
CREATE TABLE public.mensajes_organizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remitente_user_id uuid NOT NULL,
  remitente_tipo text,
  remitente_org_id uuid,
  destinatario_user_id uuid,
  destinatario_tipo text,
  destinatario_org_id uuid,
  destinatario_productor_id uuid,
  categoria_destinatario text,
  categoria_tema text DEFAULT 'general',  -- 'operativo' | 'comercial' | 'urgente' | 'general'
  asunto text,
  cuerpo text NOT NULL,
  leido boolean DEFAULT false,
  archivado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
```

## Tablas Nuevas a Crear

### 1. email_template_categories (ENUM)

```sql
CREATE TYPE public.email_template_category AS ENUM (
  'bienvenida',
  'transaccional',
  'seguridad',
  'operativo',
  'comercial',
  'recordatorio',
  'alerta'
);
```

### 2. email_templates (plantillas personalizables por org)

```sql
CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform_organizations(id),
  categoria email_template_category NOT NULL,
  codigo text NOT NULL,                    -- Identificador único: 'bienvenida_nuevo_usuario', 'confirmacion_pago', etc.
  nombre text NOT NULL,                    -- Nombre legible: 'Bienvenida - Nuevo Usuario'
  asunto_template text NOT NULL,           -- Asunto con variables: 'Bienvenido/a a {nombre_organizacion}'
  cuerpo_html text NOT NULL,              -- HTML del email con variables: '{nombre_completo}', '{link_accion}'
  cuerpo_texto text,                      -- Versión plain text (fallback)
  variables_requeridas text[] NOT NULL DEFAULT '{}',  -- Lista de variables: ['nombre_completo', 'nombre_organizacion']
  activo boolean DEFAULT true,
  es_default boolean DEFAULT false,        -- true = plantilla base del sistema (no editable por org)
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, codigo)
);

-- Índices
CREATE INDEX idx_email_templates_org ON public.email_templates(organization_id);
CREATE INDEX idx_email_templates_codigo ON public.email_templates(codigo);
CREATE INDEX idx_email_templates_categoria ON public.email_templates(categoria);

-- RLS
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_select" ON public.email_templates FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

CREATE POLICY "email_templates_insert" ON public.email_templates FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid())
  );

CREATE POLICY "email_templates_update" ON public.email_templates FOR UPDATE TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid())
    AND es_default = false
  );

CREATE POLICY "email_templates_delete" ON public.email_templates FOR DELETE TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    AND public.is_org_admin(auth.uid())
    AND es_default = false
  );

-- Trigger updated_at
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### 3. email_send_logs (registro inmutable de envíos)

```sql
CREATE TABLE public.email_send_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES platform_organizations(id),
  template_id uuid REFERENCES email_templates(id),
  template_codigo text,                    -- Snapshot del código del template usado
  destinatario_email text NOT NULL,
  destinatario_nombre text,
  asunto text NOT NULL,                    -- Asunto renderizado (con variables ya sustituidas)
  estado text NOT NULL DEFAULT 'pendiente', -- 'pendiente' | 'enviado' | 'fallido' | 'rebotado'
  proveedor text DEFAULT 'resend',         -- 'resend' | 'sendgrid' | 'ses' | 'smtp'
  proveedor_id text,                       -- ID del proveedor (ej: Resend email ID)
  error_detalle text,                      -- Mensaje de error si falló
  variables_usadas jsonb,                  -- Snapshot de las variables que se usaron
  enviado_por uuid REFERENCES auth.users(id), -- Usuario que disparó el envío (null si automático)
  enviado_at timestamptz,                  -- Timestamp real de envío exitoso
  created_at timestamptz DEFAULT now()
);

-- Índices
CREATE INDEX idx_email_logs_org ON public.email_send_logs(organization_id);
CREATE INDEX idx_email_logs_estado ON public.email_send_logs(estado);
CREATE INDEX idx_email_logs_destinatario ON public.email_send_logs(destinatario_email);
CREATE INDEX idx_email_logs_template ON public.email_send_logs(template_id);
CREATE INDEX idx_email_logs_created ON public.email_send_logs(created_at DESC);

-- RLS
ALTER TABLE public.email_send_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_logs_select" ON public.email_send_logs FOR SELECT TO authenticated
  USING (
    organization_id = public.get_user_organization_id(auth.uid())
    OR public.is_admin(auth.uid())
  );

-- Solo INSERT desde Edge Functions (service_role) o admin_org
CREATE POLICY "email_logs_insert" ON public.email_send_logs FOR INSERT TO authenticated
  WITH CHECK (
    organization_id = public.get_user_organization_id(auth.uid())
  );

-- No UPDATE ni DELETE por usuarios — los logs son inmutables
```

### 4. email_webhook_events (eventos de webhook del proveedor)

```sql
CREATE TABLE public.email_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  proveedor text NOT NULL,                 -- 'resend' | 'sendgrid'
  evento_tipo text NOT NULL,               -- 'delivered' | 'bounced' | 'complained' | 'opened' | 'clicked'
  proveedor_email_id text,                 -- ID del email en el proveedor
  email_log_id uuid REFERENCES email_send_logs(id),
  payload jsonb NOT NULL,                  -- Payload crudo del webhook
  procesado boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_webhook_events_proveedor_id ON public.email_webhook_events(proveedor_email_id);
CREATE INDEX idx_webhook_events_log ON public.email_webhook_events(email_log_id);

-- RLS: solo service_role inserta (webhooks). Admin lee.
ALTER TABLE public.email_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "webhook_events_select" ON public.email_webhook_events FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));
```

## Funciones Helper para Comunicaciones

### Obtener template activo por código

```sql
CREATE OR REPLACE FUNCTION public.get_email_template(
  _org_id uuid,
  _codigo text
)
RETURNS TABLE(
  id uuid,
  asunto_template text,
  cuerpo_html text,
  cuerpo_texto text,
  variables_requeridas text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, asunto_template, cuerpo_html, cuerpo_texto, variables_requeridas
  FROM public.email_templates
  WHERE organization_id = _org_id
    AND codigo = _codigo
    AND activo = true
  LIMIT 1;
$$;
```

### Registrar envío de email

```sql
CREATE OR REPLACE FUNCTION public.log_email_send(
  _org_id uuid,
  _template_codigo text,
  _destinatario_email text,
  _destinatario_nombre text,
  _asunto text,
  _estado text,
  _proveedor text,
  _proveedor_id text,
  _variables jsonb,
  _enviado_por uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _log_id uuid;
  _template_id uuid;
BEGIN
  -- Buscar template_id si existe
  SELECT id INTO _template_id
  FROM public.email_templates
  WHERE organization_id = _org_id AND codigo = _template_codigo
  LIMIT 1;

  INSERT INTO public.email_send_logs (
    organization_id, template_id, template_codigo,
    destinatario_email, destinatario_nombre, asunto,
    estado, proveedor, proveedor_id,
    variables_usadas, enviado_por,
    enviado_at
  ) VALUES (
    _org_id, _template_id, _template_codigo,
    _destinatario_email, _destinatario_nombre, _asunto,
    _estado, _proveedor, _proveedor_id,
    _variables, _enviado_por,
    CASE WHEN _estado = 'enviado' THEN now() ELSE NULL END
  )
  RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$;
```

## Templates Seed (Plantillas Default)

Después de crear las tablas, insertar plantillas base para cada organización existente:

```sql
-- Función para sembrar templates default a una org
CREATE OR REPLACE FUNCTION public.seed_default_email_templates(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_templates (organization_id, categoria, codigo, nombre, asunto_template, cuerpo_html, cuerpo_texto, variables_requeridas, es_default)
  VALUES
    -- Bienvenida
    (_org_id, 'bienvenida', 'bienvenida_nuevo_usuario',
     'Bienvenida - Nuevo Usuario',
     'Bienvenido/a a {nombre_organizacion}',
     '<h1>¡Bienvenido/a, {nombre_completo}!</h1><p>Tu cuenta en {nombre_organizacion} está activa.</p>',
     'Bienvenido/a, {nombre_completo}. Tu cuenta en {nombre_organizacion} está activa.',
     ARRAY['nombre_completo', 'nombre_organizacion'],
     true),

    -- Transaccional
    (_org_id, 'transaccional', 'confirmacion_pago',
     'Confirmación de Pago',
     'Pago confirmado — {monto}',
     '<h1>Pago confirmado</h1><p>Hola {nombre_completo}, tu pago de {monto} ha sido procesado el {fecha}.</p><p>Referencia: {referencia}</p>',
     'Pago confirmado. Monto: {monto}. Fecha: {fecha}. Referencia: {referencia}.',
     ARRAY['nombre_completo', 'monto', 'fecha', 'referencia'],
     true),

    (_org_id, 'transaccional', 'confirmacion_entrega',
     'Confirmación de Entrega',
     'Entrega recibida — {cantidad_kg} kg',
     '<h1>Entrega registrada</h1><p>{nombre_completo}, recibimos {cantidad_kg} kg de {tipo_cafe} el {fecha}.</p>',
     'Entrega registrada: {cantidad_kg} kg de {tipo_cafe}. Fecha: {fecha}.',
     ARRAY['nombre_completo', 'cantidad_kg', 'tipo_cafe', 'fecha'],
     true),

    -- Seguridad
    (_org_id, 'seguridad', 'reset_password',
     'Restablecimiento de Contraseña',
     'Restablecer tu contraseña — {nombre_organizacion}',
     '<h1>Restablecer contraseña</h1><p>Hola {nombre_completo}, haz clic en el enlace para restablecer tu contraseña:</p><a href="{link_accion}">Restablecer</a><p>Este enlace expira en {expiracion}.</p>',
     'Hola {nombre_completo}. Restablece tu contraseña aquí: {link_accion}. Expira en {expiracion}.',
     ARRAY['nombre_completo', 'nombre_organizacion', 'link_accion', 'expiracion'],
     true),

    -- Operativo
    (_org_id, 'operativo', 'asignacion_lote',
     'Asignación de Lote',
     'Nuevo lote asignado — {codigo_lote}',
     '<h1>Lote asignado</h1><p>{nombre_completo}, se te asignó el lote {codigo_lote} con {peso_total_kg} kg.</p>',
     'Lote asignado: {codigo_lote}. Peso: {peso_total_kg} kg.',
     ARRAY['nombre_completo', 'codigo_lote', 'peso_total_kg'],
     true),

    (_org_id, 'operativo', 'resultado_catacion',
     'Resultado de Catación',
     'Resultado de catación — Lote {codigo_lote}',
     '<h1>Resultado de catación</h1><p>El lote {codigo_lote} obtuvo un puntaje de {puntaje}/100.</p><p>Notas: {notas_cata}</p>',
     'Catación del lote {codigo_lote}: {puntaje}/100. Notas: {notas_cata}.',
     ARRAY['codigo_lote', 'puntaje', 'notas_cata'],
     true),

    -- Comercial
    (_org_id, 'comercial', 'nueva_oferta',
     'Nueva Oferta Comercial',
     'Nueva oferta recibida — {titulo_oferta}',
     '<h1>Oferta recibida</h1><p>{nombre_completo}, recibiste una oferta: {titulo_oferta}.</p><a href="{link_accion}">Ver detalles</a>',
     'Nueva oferta: {titulo_oferta}. Ver detalles: {link_accion}.',
     ARRAY['nombre_completo', 'titulo_oferta', 'link_accion'],
     true),

    (_org_id, 'comercial', 'contrato_firmado',
     'Contrato Firmado',
     'Contrato {numero_contrato} firmado',
     '<h1>Contrato firmado</h1><p>El contrato {numero_contrato} ha sido firmado entre {org_compradora} y {org_vendedora}.</p>',
     'Contrato {numero_contrato} firmado entre {org_compradora} y {org_vendedora}.',
     ARRAY['numero_contrato', 'org_compradora', 'org_vendedora'],
     true),

    -- Alerta
    (_org_id, 'alerta', 'alerta_fitosanitaria',
     'Alerta Fitosanitaria',
     '⚠️ Alerta fitosanitaria — {nombre_parcela}',
     '<h1>⚠️ Alerta fitosanitaria</h1><p>Se detectó {tipo_alerta} en la parcela {nombre_parcela}.</p><p>Acción recomendada: {accion_recomendada}</p>',
     'Alerta: {tipo_alerta} en {nombre_parcela}. Acción: {accion_recomendada}.',
     ARRAY['nombre_parcela', 'tipo_alerta', 'accion_recomendada'],
     true),

    -- Recordatorio
    (_org_id, 'recordatorio', 'recordatorio_aplicacion',
     'Recordatorio de Aplicación',
     'Recordatorio: aplicación pendiente — {producto}',
     '<h1>Aplicación pendiente</h1><p>{nombre_completo}, tienes una aplicación de {producto} programada para {fecha} en {nombre_parcela}.</p>',
     'Recordatorio: aplicar {producto} el {fecha} en {nombre_parcela}.',
     ARRAY['nombre_completo', 'producto', 'fecha', 'nombre_parcela'],
     true)

  ON CONFLICT (organization_id, codigo) DO NOTHING;
END;
$$;

-- Ejecutar seed para todas las orgs existentes:
-- SELECT public.seed_default_email_templates(id) FROM platform_organizations;
```

## Vistas Útiles

### Resumen de envíos por organización
```sql
CREATE OR REPLACE VIEW public.v_email_send_summary AS
SELECT
  organization_id,
  template_codigo,
  estado,
  COUNT(*) AS total,
  MAX(created_at) AS ultimo_envio
FROM public.email_send_logs
GROUP BY organization_id, template_codigo, estado;
```

## Convenciones de Códigos de Template

| Categoría     | Código                      | Variables Clave                              |
|---------------|----------------------------|----------------------------------------------|
| bienvenida    | `bienvenida_nuevo_usuario` | nombre_completo, nombre_organizacion         |
| transaccional | `confirmacion_pago`        | nombre_completo, monto, fecha, referencia    |
| transaccional | `confirmacion_entrega`     | nombre_completo, cantidad_kg, tipo_cafe      |
| seguridad     | `reset_password`           | nombre_completo, link_accion, expiracion     |
| operativo     | `asignacion_lote`          | nombre_completo, codigo_lote, peso_total_kg  |
| operativo     | `resultado_catacion`       | codigo_lote, puntaje, notas_cata             |
| comercial     | `nueva_oferta`             | nombre_completo, titulo_oferta, link_accion  |
| comercial     | `contrato_firmado`         | numero_contrato, org_compradora, org_vendedora|
| alerta        | `alerta_fitosanitaria`     | nombre_parcela, tipo_alerta, accion_recomendada|
| recordatorio  | `recordatorio_aplicacion`  | nombre_completo, producto, fecha, nombre_parcela|

## Smoke Tests

```sql
-- Verificar tablas creadas
SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  AND tablename IN ('email_templates', 'email_send_logs', 'email_webhook_events');

-- Verificar RLS
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'
  AND tablename IN ('email_templates', 'email_send_logs', 'email_webhook_events');

-- Verificar políticas
SELECT tablename, policyname, cmd FROM pg_policies
  WHERE tablename IN ('email_templates', 'email_send_logs', 'email_webhook_events');

-- Verificar ENUM
SELECT enumlabel FROM pg_enum
  WHERE enumtypid = 'email_template_category'::regtype;

-- Verificar índices
SELECT tablename, indexname FROM pg_indexes
  WHERE tablename IN ('email_templates', 'email_send_logs', 'email_webhook_events');

-- Verificar seed (después de ejecutar)
SELECT organization_id, COUNT(*) AS templates
FROM email_templates
WHERE es_default = true
GROUP BY organization_id;
```

## Edge Function: send-client-email

La Edge Function `send-client-email` ya existe en el repositorio. Envía emails via Resend API.

**Flujo de envío completo:**
1. Frontend obtiene template → `get_email_template(_org_id, _codigo)`
2. Frontend sustituye variables en asunto y body
3. Frontend invoca Edge Function con HTML renderizado
4. Edge Function envía via Resend y devuelve `{ success, id }`
5. Frontend registra log → `log_email_send(...)` con el `proveedor_id` devuelto

**Secret requerido en Supabase:** `RESEND_API_KEY`

**URL de invocación:**
```
https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/send-client-email
```
