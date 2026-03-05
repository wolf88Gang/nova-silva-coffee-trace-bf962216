-- ============================================================
-- BLOQUE 4: Trigger anti auto-democión
-- Impide que un admin_org se desactive, cambie su rol o elimine
-- Ejecutar en Supabase SQL Editor DESPUÉS del Bloque 3
-- ============================================================

-- 4a) Función del trigger
CREATE OR REPLACE FUNCTION public.prevent_self_demotion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Solo aplica si el usuario autenticado está modificando su propio registro
  IF OLD.user_id = auth.uid() THEN

    -- UPDATE: impedir auto-desactivación o pérdida de admin_org
    IF TG_OP = 'UPDATE' THEN
      IF OLD.rol_interno = 'admin_org' AND NEW.rol_interno <> 'admin_org' THEN
        RAISE EXCEPTION 'No puedes quitarte el rol de administrador a ti mismo.';
      END IF;
      IF OLD.activo = true AND NEW.activo = false THEN
        RAISE EXCEPTION 'No puedes desactivarte a ti mismo.';
      END IF;
    END IF;

    -- DELETE: impedir auto-eliminación
    IF TG_OP = 'DELETE' THEN
      RAISE EXCEPTION 'No puedes eliminar tu propio registro de la organización.';
    END IF;

  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;

-- 4b) Trigger
DROP TRIGGER IF EXISTS trg_prevent_self_demotion ON public.organizacion_usuarios;
CREATE TRIGGER trg_prevent_self_demotion
  BEFORE UPDATE OR DELETE ON public.organizacion_usuarios
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_self_demotion();

-- ✅ Bloque 4 completado
SELECT 'Bloque 4 OK: trigger anti auto-democión activo' AS resultado;
