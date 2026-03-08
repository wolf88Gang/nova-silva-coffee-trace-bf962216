-- ═══════════════════════════════════════════════════════════════════════
-- 05: Fase 1 Plan Lifecycle RPCs
-- approve_nutrition_plan, supersede_nutrition_plan, get_plan_detail
-- Idempotent: CREATE OR REPLACE
-- ═══════════════════════════════════════════════════════════════════════

BEGIN;

-- ─────────────────────────────────────────────────────────────────────
-- 1. approve_nutrition_plan(plan_id, user_id)
--    Atomic transition: status -> 'aprobado', sets approved_at/by
--    Logs audit event
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.approve_nutrition_plan(
  _plan_id uuid,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan record;
  v_org_id uuid;
  v_user_org uuid;
BEGIN
  SELECT id, organization_id, status INTO v_plan
    FROM nutricion_planes WHERE id = _plan_id;

  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Plan not found: %', _plan_id;
  END IF;

  v_user_org := get_user_organization_id(_user_id);
  IF v_plan.organization_id <> v_user_org AND NOT is_admin(_user_id) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  IF v_plan.status NOT IN ('generated', 'borrador', 'generado', 'ajustado') THEN
    RAISE EXCEPTION 'Plan cannot be approved from status: %', v_plan.status;
  END IF;

  UPDATE nutricion_planes SET
    status = 'aprobado',
    estado = 'aprobado',
    approved_at = now(),
    approved_by = _user_id,
    aprobado_fecha = now(),
    aprobado_por = _user_id,
    updated_at = now()
  WHERE id = _plan_id;

  INSERT INTO ag_nut_plan_audit_events (organization_id, plan_id, event_type, created_by, event_payload)
  VALUES (v_plan.organization_id, _plan_id, 'plan_approved', _user_id,
    jsonb_build_object('previous_status', v_plan.status, 'new_status', 'aprobado'));

  RETURN jsonb_build_object('plan_id', _plan_id, 'status', 'aprobado', 'approved_at', now());
END;
$$;

REVOKE EXECUTE ON FUNCTION public.approve_nutrition_plan(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_nutrition_plan(uuid, uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 2. supersede_nutrition_plan(old_plan_id, new_plan_id)
--    Marks old plan as superseded, links to new plan
--    Does NOT delete old plan (immutability)
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.supersede_nutrition_plan(
  _old_plan_id uuid,
  _new_plan_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_old record;
  v_new record;
  v_user_org uuid;
BEGIN
  SELECT id, organization_id, status INTO v_old FROM nutricion_planes WHERE id = _old_plan_id;
  SELECT id, organization_id INTO v_new FROM nutricion_planes WHERE id = _new_plan_id;

  IF v_old IS NULL THEN RAISE EXCEPTION 'Old plan not found'; END IF;
  IF v_new IS NULL THEN RAISE EXCEPTION 'New plan not found'; END IF;
  IF v_old.organization_id <> v_new.organization_id THEN RAISE EXCEPTION 'Plans must belong to same org'; END IF;

  v_user_org := get_user_organization_id(auth.uid());
  IF v_old.organization_id <> v_user_org AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE nutricion_planes SET
    status = 'superseded',
    estado = 'superseded',
    superseded_by_plan_id = _new_plan_id,
    updated_at = now()
  WHERE id = _old_plan_id;

  UPDATE nutricion_planes SET
    parent_plan_id = _old_plan_id,
    updated_at = now()
  WHERE id = _new_plan_id;

  INSERT INTO ag_nut_plan_audit_events (organization_id, plan_id, event_type, created_by, event_payload)
  VALUES (v_old.organization_id, _old_plan_id, 'plan_superseded', auth.uid(),
    jsonb_build_object('superseded_by', _new_plan_id));

  INSERT INTO ag_nut_plan_audit_events (organization_id, plan_id, event_type, created_by, event_payload)
  VALUES (v_new.organization_id, _new_plan_id, 'plan_created_from_supersede', auth.uid(),
    jsonb_build_object('parent_plan', _old_plan_id));

  RETURN jsonb_build_object(
    'old_plan_id', _old_plan_id, 'old_status', 'superseded',
    'new_plan_id', _new_plan_id, 'linked', true
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.supersede_nutrition_plan(uuid, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.supersede_nutrition_plan(uuid, uuid) TO authenticated;

-- ─────────────────────────────────────────────────────────────────────
-- 3. get_plan_detail(plan_id)
--    Returns plan + schedule + audit events as single JSON
-- ─────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.get_plan_detail(_plan_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan jsonb;
  v_schedule jsonb;
  v_audit jsonb;
  v_fraccs jsonb;
  v_org_id uuid;
  v_user_org uuid;
BEGIN
  SELECT organization_id INTO v_org_id FROM nutricion_planes WHERE id = _plan_id;
  IF v_org_id IS NULL THEN RAISE EXCEPTION 'Plan not found'; END IF;

  v_user_org := get_user_organization_id(auth.uid());
  IF v_org_id <> v_user_org AND NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT to_jsonb(p) INTO v_plan FROM nutricion_planes p WHERE p.id = _plan_id;

  SELECT COALESCE(jsonb_agg(s ORDER BY s.sequence_no), '[]'::jsonb) INTO v_schedule
    FROM ag_nut_schedule s WHERE s.plan_id = _plan_id;

  SELECT COALESCE(jsonb_agg(f ORDER BY f.numero_aplicacion), '[]'::jsonb) INTO v_fraccs
    FROM nutricion_fraccionamientos f WHERE f.plan_id = _plan_id;

  SELECT COALESCE(jsonb_agg(a ORDER BY a.created_at), '[]'::jsonb) INTO v_audit
    FROM ag_nut_plan_audit_events a WHERE a.plan_id = _plan_id;

  RETURN jsonb_build_object(
    'plan', v_plan,
    'schedule', v_schedule,
    'fraccionamientos', v_fraccs,
    'audit_events', v_audit
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_plan_detail(uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_plan_detail(uuid) TO authenticated;

COMMIT;
