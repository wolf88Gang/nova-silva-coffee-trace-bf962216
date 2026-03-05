-- ============================================================
-- BLOQUE 6: Tablas de mensajería y notificaciones
-- Ejecutar en Supabase SQL Editor
-- Idempotente: usa IF NOT EXISTS en todas las sentencias
-- ============================================================

-- ─── 6a) Notificaciones in-app ──────────────────────────────
CREATE TABLE IF NOT EXISTS public.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  usuario_id uuid NOT NULL,
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensaje text NOT NULL,
  leido boolean NOT NULL DEFAULT false,
  link_accion text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notificaciones ENABLE ROW LEVEL SECURITY;

-- Users can view own notifications
DROP POLICY IF EXISTS "notif_select_own" ON public.notificaciones;
CREATE POLICY "notif_select_own"
  ON public.notificaciones FOR SELECT TO authenticated
  USING (usuario_id = auth.uid());

-- System / authenticated can insert
DROP POLICY IF EXISTS "notif_insert" ON public.notificaciones;
CREATE POLICY "notif_insert"
  ON public.notificaciones FOR INSERT TO authenticated
  WITH CHECK (true);

-- Users can update own (mark as read)
DROP POLICY IF EXISTS "notif_update_own" ON public.notificaciones;
CREATE POLICY "notif_update_own"
  ON public.notificaciones FOR UPDATE TO authenticated
  USING (usuario_id = auth.uid());

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario
  ON public.notificaciones (usuario_id, leido, created_at DESC);

-- ─── 6b) Mensajes cooperativa ↔ productor ───────────────────
CREATE TABLE IF NOT EXISTS public.mensajes_coop_productor (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  cooperativa_id uuid NOT NULL,
  productor_id uuid NOT NULL,
  remitente_tipo text NOT NULL CHECK (remitente_tipo IN ('cooperativa', 'productor')),
  remitente_id uuid NOT NULL,
  asunto text,
  cuerpo text NOT NULL,
  fecha_envio timestamptz NOT NULL DEFAULT now(),
  leido_por_destino boolean NOT NULL DEFAULT false,
  fecha_lectura timestamptz,
  estado text NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'archivado')),
  parcela_id uuid,
  accion_clima_id uuid
);

ALTER TABLE public.mensajes_coop_productor ENABLE ROW LEVEL SECURITY;

-- Members of the org can read
DROP POLICY IF EXISTS "msg_coop_select" ON public.mensajes_coop_productor;
CREATE POLICY "msg_coop_select"
  ON public.mensajes_coop_productor FOR SELECT TO authenticated
  USING (
    organization_id IN (
      SELECT organizacion_id FROM public.organizacion_usuarios
      WHERE user_id = auth.uid() AND activo = true
    )
    OR remitente_id = auth.uid()
  );

-- Authenticated can insert
DROP POLICY IF EXISTS "msg_coop_insert" ON public.mensajes_coop_productor;
CREATE POLICY "msg_coop_insert"
  ON public.mensajes_coop_productor FOR INSERT TO authenticated
  WITH CHECK (true);

-- Recipient can update (mark as read / archive)
DROP POLICY IF EXISTS "msg_coop_update" ON public.mensajes_coop_productor;
CREATE POLICY "msg_coop_update"
  ON public.mensajes_coop_productor FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organizacion_id FROM public.organizacion_usuarios
      WHERE user_id = auth.uid() AND activo = true
    )
    OR remitente_id = auth.uid()
  );

CREATE INDEX IF NOT EXISTS idx_msg_coop_org
  ON public.mensajes_coop_productor (organization_id, productor_id, fecha_envio DESC);

-- ─── 6c) Mensajes entre organizaciones ──────────────────────
CREATE TABLE IF NOT EXISTS public.mensajes_organizacion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  remitente_user_id uuid NOT NULL,
  remitente_tipo text NOT NULL,
  remitente_org_id uuid,
  destinatario_user_id uuid,
  destinatario_tipo text NOT NULL,
  destinatario_org_id uuid,
  destinatario_productor_id uuid,
  categoria_destinatario text,
  categoria_tema text NOT NULL DEFAULT 'general'
    CHECK (categoria_tema IN ('operativo', 'comercial', 'urgente', 'general')),
  asunto text,
  cuerpo text NOT NULL,
  leido boolean NOT NULL DEFAULT false,
  archivado boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.mensajes_organizacion ENABLE ROW LEVEL SECURITY;

-- Can read if sender or recipient (user or org member)
DROP POLICY IF EXISTS "msg_org_select" ON public.mensajes_organizacion;
CREATE POLICY "msg_org_select"
  ON public.mensajes_organizacion FOR SELECT TO authenticated
  USING (
    remitente_user_id = auth.uid()
    OR destinatario_user_id = auth.uid()
    OR remitente_org_id IN (
      SELECT organizacion_id FROM public.organizacion_usuarios
      WHERE user_id = auth.uid() AND activo = true
    )
    OR destinatario_org_id IN (
      SELECT organizacion_id FROM public.organizacion_usuarios
      WHERE user_id = auth.uid() AND activo = true
    )
  );

-- Authenticated can insert
DROP POLICY IF EXISTS "msg_org_insert" ON public.mensajes_organizacion;
CREATE POLICY "msg_org_insert"
  ON public.mensajes_organizacion FOR INSERT TO authenticated
  WITH CHECK (remitente_user_id = auth.uid());

-- Recipient can update (mark read / archive)
DROP POLICY IF EXISTS "msg_org_update" ON public.mensajes_organizacion;
CREATE POLICY "msg_org_update"
  ON public.mensajes_organizacion FOR UPDATE TO authenticated
  USING (
    destinatario_user_id = auth.uid()
    OR destinatario_org_id IN (
      SELECT organizacion_id FROM public.organizacion_usuarios
      WHERE user_id = auth.uid() AND activo = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_msg_org_dest
  ON public.mensajes_organizacion (destinatario_org_id, leido, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_msg_org_sender
  ON public.mensajes_organizacion (remitente_org_id, created_at DESC);

-- ✅ Bloque 6 completado
SELECT 'Bloque 6 OK: notificaciones + mensajes_coop_productor + mensajes_organizacion' AS resultado;
