-- ============================================================
-- Bucket + RLS para evidencias de ejecución de nutrición
-- Ejecutar manualmente en Supabase SQL Editor
-- ============================================================

-- 1) Crear bucket privado
insert into storage.buckets (id, name, public)
values ('nutrition-executions', 'nutrition-executions', false)
on conflict (id) do nothing;

-- 2) Helper: IDs de organizaciones del usuario autenticado
create or replace function public.user_org_ids()
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(o.organizacion_id::text),
    '{}'::text[]
  )
  from public.organizacion_usuarios o
  where o.user_id = auth.uid()
    and coalesce(o.activo, true) = true
$$;

revoke execute on function public.user_org_ids() from anon;

-- 3) INSERT: solo dentro de carpeta de su org
create policy "org_upload_nutrition_evidence"
on storage.objects
for insert to authenticated
with check (
  bucket_id = 'nutrition-executions'
  and (storage.foldername(name))[1] = any(public.user_org_ids())
);

-- 4) SELECT: solo dentro de carpeta de su org
create policy "org_read_nutrition_evidence"
on storage.objects
for select to authenticated
using (
  bucket_id = 'nutrition-executions'
  and (storage.foldername(name))[1] = any(public.user_org_ids())
);

-- 5) DELETE: solo admin_org puede borrar
create policy "org_admin_delete_nutrition_evidence"
on storage.objects
for delete to authenticated
using (
  bucket_id = 'nutrition-executions'
  and (storage.foldername(name))[1] = any(public.user_org_ids())
  and public.has_org_role(auth.uid(), ((storage.foldername(name))[1])::uuid, array['admin_org'])
);
