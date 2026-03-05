-- ============================================================
-- BLOQUE 5: Verificación post-migración
-- Ejecutar DESPUÉS de los bloques 1–4
-- ============================================================

-- 5a) Columnas esperadas en organizacion_usuarios
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'organizacion_usuarios'
  AND column_name IN (
    'rol_interno','user_name','user_email',
    'permiso_gestion_productores','permiso_crear_editar_productores',
    'permiso_ver_parcelas_clima','permiso_gestion_lotes_acopio',
    'permiso_ver_eudr_exportador','permiso_gestion_contratos',
    'permiso_gestion_configuracion_org','permiso_ver_informes_financieros'
  )
ORDER BY column_name;

-- 5b) UNIQUE constraint
SELECT conname FROM pg_constraint
WHERE conrelid = 'public.organizacion_usuarios'::regclass
  AND contype = 'u';

-- 5c) Índices
SELECT indexname FROM pg_indexes
WHERE tablename = 'organizacion_usuarios'
  AND schemaname = 'public';

-- 5d) Funciones helper
SELECT routine_name, security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('get_user_organization_id','is_admin','is_org_admin','prevent_self_demotion');

-- 5e) Políticas RLS
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'organizacion_usuarios'
  AND schemaname = 'public'
ORDER BY policyname;

-- 5f) Triggers
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.organizacion_usuarios'::regclass
  AND NOT tgisinternal;

-- ✅ Verificación completada
SELECT 'Bloque 5 OK: verificación post-migración' AS resultado;
