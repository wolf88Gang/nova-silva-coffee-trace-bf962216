-- profiles.user_id UNIQUE — endurecimiento ensure-demo-user
-- Idempotente. No borra datos. Revisa duplicados antes de forzar.
-- Si hay duplicados, NO crea la constraint; reporta en comentario.

-- 1. Verificar si ya existe UNIQUE en user_id
DO $$
DECLARE
  v_has_unique boolean;
  v_dup_count bigint;
BEGIN
  -- ¿Existe constraint UNIQUE o PRIMARY KEY en user_id?
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu
      ON tc.constraint_name = ccu.constraint_name
      AND tc.table_schema = ccu.table_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'profiles'
      AND ccu.column_name = 'user_id'
      AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY')
  ) INTO v_has_unique;

  IF v_has_unique THEN
    RAISE NOTICE 'profiles.user_id ya tiene constraint UNIQUE o PRIMARY KEY. Nada que hacer.';
    RETURN;
  END IF;

  -- Contar duplicados
  SELECT COUNT(*) INTO v_dup_count
  FROM (
    SELECT user_id FROM public.profiles GROUP BY user_id HAVING COUNT(*) > 1
  ) d;

  IF v_dup_count > 0 THEN
    RAISE WARNING 'profiles tiene % user_id duplicados. NO se crea UNIQUE. Resolver duplicados manualmente.', v_dup_count;
    RETURN;
  END IF;

  -- Crear UNIQUE
  CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_user_id_unique
    ON public.profiles (user_id);

  RAISE NOTICE 'Creado UNIQUE en profiles.user_id (idx_profiles_user_id_unique).';
END;
$$;
