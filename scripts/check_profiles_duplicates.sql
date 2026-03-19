-- Lista duplicados en profiles.user_id.
-- Ejecutar antes de deploy si profiles.user_id aún no tiene UNIQUE.
-- Si hay filas → resolver manualmente antes de aplicar 20250318130000.

SELECT
  user_id,
  COUNT(*) AS dup_count
FROM public.profiles
GROUP BY user_id
HAVING COUNT(*) > 1;

-- Si la query devuelve 0 filas: seguro aplicar la migración.
-- Si devuelve filas: decidir qué perfil conservar por user_id, eliminar o fusionar duplicados.
