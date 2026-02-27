-- Seed: 1 productor de prueba en org2 para RLS smoke test
-- cooperativa_id = organization_id = 00000000-0000-0000-0000-000000000002

INSERT INTO public.productores (
  id,
  nombre,
  cedula,
  comunidad,
  cooperativa_id,
  organization_id
) VALUES (
  'a0000000-0000-0000-0000-000000000002',
  'Productor Prueba Org2',
  '9999-99999-0999',
  'Comunidad Test',
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000002'
)
ON CONFLICT (id) DO UPDATE SET
  nombre = EXCLUDED.nombre,
  cooperativa_id = EXCLUDED.cooperativa_id,
  organization_id = EXCLUDED.organization_id;
