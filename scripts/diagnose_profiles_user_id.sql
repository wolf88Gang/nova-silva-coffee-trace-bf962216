-- Diagnóstico: ¿profiles.user_id tiene UNIQUE?
-- Ejecutar en Supabase SQL Editor antes de aplicar 20250318130000.

SELECT
  tc.constraint_name,
  tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.constraint_column_usage ccu
  ON tc.constraint_name = ccu.constraint_name
  AND tc.table_schema = ccu.table_schema
WHERE tc.table_schema = 'public'
  AND tc.table_name = 'profiles'
  AND ccu.column_name = 'user_id';

-- Si no sale fila con constraint_type = 'UNIQUE' o 'PRIMARY KEY', hay que crear la migración.

-- Duplicados: ejecutar scripts/check_profiles_duplicates.sql
