-- =============================================================================
-- Sales: Recommendations Redesign + Finalize Pipeline Fix
--
-- Changes:
--   1. fn_sales_generate_recommendations  — replaced in-place (same signature)
--      Full signal matrix: pitch / demo / plan / next_step
--      Each slot = exactly 1 row, determined by priority-ordered signal matching
--      Payload is frontend-ready (no follow-up queries needed)
--
--   2. fn_sales_finalize_session          — replaced in-place (same signature)
--      Switches objection call from v1 → v2 so recalibrated confidences
--      are present when recommendations run
--
-- Signal thresholds (aligned with recalibration layer):
--   high_pain      score_pain              >= 60
--   medium_pain    score_pain              >= 35
--   low_maturity   score_maturity          <  40
--   high_maturity  score_maturity          >= 60
--   has_urgency    score_urgency           >= 40
--   high_objection score_objection         >= 30  OR  objection_count >= 2
--   low_fit        score_fit               <= 25
--   budget_gap     score_budget_readiness  <= 25
-- =============================================================================


-- =============================================================================
-- 1. fn_sales_generate_recommendations (REPLACED IN-PLACE)
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_sales_generate_recommendations(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_s                 RECORD;

  -- Score flags
  v_high_pain         boolean;
  v_medium_pain       boolean;
  v_low_maturity      boolean;
  v_high_maturity     boolean;
  v_has_urgency       boolean;
  v_high_objection    boolean;
  v_low_fit           boolean;
  v_budget_gap        boolean;

  -- Objection flags (read from recalibrated sales_session_objections)
  v_objection_count   integer;
  v_has_compliance    boolean;
  v_has_trust         boolean;
  v_has_price         boolean;
  v_has_complexity    boolean;
  v_has_no_priority   boolean;
  v_has_adoption_risk boolean;

BEGIN
  perform public._ensure_internal();

  -- ── Load session scores ─────────────────────────────────────────────────────
  SELECT * INTO v_s
  FROM public.sales_sessions
  WHERE id = p_session_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found: %', p_session_id;
  END IF;

  -- ── Compute score flags ─────────────────────────────────────────────────────
  v_high_pain      := coalesce(v_s.score_pain, 0)              >= 60;
  v_medium_pain    := coalesce(v_s.score_pain, 0)              >= 35;
  v_low_maturity   := coalesce(v_s.score_maturity, 0)          <  40;
  v_high_maturity  := coalesce(v_s.score_maturity, 0)          >= 60;
  v_has_urgency    := coalesce(v_s.score_urgency, 0)           >= 40;
  v_low_fit        := coalesce(v_s.score_fit, 0)               <= 25;
  v_budget_gap     := coalesce(v_s.score_budget_readiness, 0)  <= 25;

  -- ── Load objection signals ──────────────────────────────────────────────────
  -- Uses MAX(confidence) per type — reads recalibrated values from v2 pass.
  SELECT
    COUNT(DISTINCT objection_type),
    bool_or(objection_type = 'compliance_fear'),
    bool_or(objection_type = 'trust'),
    bool_or(objection_type = 'price'),
    bool_or(objection_type = 'complexity'),
    bool_or(objection_type = 'no_priority'),
    bool_or(objection_type = 'adoption_risk')
  INTO
    v_objection_count,
    v_has_compliance,
    v_has_trust,
    v_has_price,
    v_has_complexity,
    v_has_no_priority,
    v_has_adoption_risk
  FROM public.sales_session_objections
  WHERE session_id = p_session_id;

  v_has_compliance    := coalesce(v_has_compliance,    false);
  v_has_trust         := coalesce(v_has_trust,         false);
  v_has_price         := coalesce(v_has_price,         false);
  v_has_complexity    := coalesce(v_has_complexity,    false);
  v_has_no_priority   := coalesce(v_has_no_priority,   false);
  v_has_adoption_risk := coalesce(v_has_adoption_risk, false);
  v_objection_count   := coalesce(v_objection_count,   0);

  v_high_objection := coalesce(v_s.score_objection, 0) >= 30
                   OR v_objection_count >= 2;

  -- ── Wipe previous recommendations ──────────────────────────────────────────
  DELETE FROM public.sales_session_recommendations WHERE session_id = p_session_id;


  -- ════════════════════════════════════════════════════════════════════════════
  -- SLOT 1 — PITCH ANGLE
  -- What narrative lens to use when opening the conversation.
  -- Priority: compliance > trust > high_pain+urgency > high_pain > objection > fit > default
  -- ════════════════════════════════════════════════════════════════════════════

  IF v_has_compliance THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'pitch',
      'EUDR como ventaja competitiva',
      'El miedo al incumplimiento es la apertura. Posicionar Nova Silva como el único sistema end-to-end de trazabilidad EUDR para cooperativas latinoamericanas. Abrir con los plazos de la UE y el costo de exclusión de mercado.',
      jsonb_build_object(
        'signal',       'compliance_fear',
        'pitch_angle',  'eudr_competitive_moat',
        'urgency',      'high',
        'modules',      jsonb_build_array('cumplimiento', 'trazabilidad', 'exportacion'),
        'cta',          'Mostrar timeline EUDR 2025 y mapear gap actual del prospecto',
        'hook',         '¿Cuántos de sus compradores europeos ya les han pedido documentación EUDR?'
      ),
      10, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_has_trust AND v_high_objection THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'pitch',
      'Prueba social: resultados de cooperativas similares',
      'La desconfianza bloquea la decisión. Abrir con 2-3 casos de éxito específicos de cooperativas con perfil similar. Métricas concretas: tiempo de certificación reducido, lotes rechazados evitados, precio premium obtenido.',
      jsonb_build_object(
        'signal',       'trust_plus_objection',
        'pitch_angle',  'social_proof',
        'urgency',      CASE WHEN v_has_urgency THEN 'high' ELSE 'medium' END,
        'modules',      jsonb_build_array('trazabilidad', 'cumplimiento'),
        'cta',          'Preparar 2 casos de éxito con perfil similar al prospecto',
        'hook',         'Le cuento qué hizo [Cooperativa X] cuando estaban exactamente en su situación.'
      ),
      10, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_pain AND v_has_urgency THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'pitch',
      'Costo de la inacción: lo que pierden cada mes sin Nova Silva',
      'El dolor es alto y hay urgencia. Usar el marco "costo de no hacer nada". Cuantificar: lotes rechazados, horas de trazabilidad manual, riesgo EUDR pendiente. Cerrar con ROI en 90 días.',
      jsonb_build_object(
        'signal',       'high_pain_urgent',
        'pitch_angle',  'cost_of_inaction_roi',
        'urgency',      'high',
        'modules',      jsonb_build_array('trazabilidad', 'cumplimiento', 'operacion', 'finanzas'),
        'cta',          'Llevar calculadora de ROI personalizada a la reunión',
        'hook',         '¿Cuánto le costó el último lote rechazado por falta de documentación?'
      ),
      10, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_pain THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'pitch',
      'Transformación operativa: de caos a control en 60 días',
      'El dolor es real pero no hay urgencia declarada. Construir la narrativa de transformación: antes/después. Mostrar el camino concreto desde el estado actual hasta operación certificada. Crear urgencia con hitos de mercado.',
      jsonb_build_object(
        'signal',       'high_pain',
        'pitch_angle',  'transformation_narrative',
        'urgency',      'medium',
        'modules',      jsonb_build_array('trazabilidad', 'operacion', 'cumplimiento'),
        'cta',          'Preparar mapa de estado actual vs futuro con el prospecto',
        'hook',         'Si en 60 días pudieran tener trazabilidad completa, ¿qué cambia para ustedes?'
      ),
      10, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_objection THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'pitch',
      'El status quo es el mayor riesgo: narrativa de riesgo manejado',
      'Hay múltiples objeciones activas. Reencuadrar el riesgo: no hacer nada también tiene un costo. Abordar objeciones directamente con evidencia, no con marketing. Posicionar Nova Silva como el camino de menor riesgo.',
      jsonb_build_object(
        'signal',       'high_objection',
        'pitch_angle',  'risk_reframe',
        'urgency',      'medium',
        'modules',      jsonb_build_array('cumplimiento', 'trazabilidad'),
        'cta',          'Mapear cada objeción activa y preparar respuesta con dato concreto',
        'hook',         '¿Cuál sería el impacto para su negocio si un comprador europeo les audita sin trazabilidad lista?'
      ),
      10, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_low_fit THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'pitch',
      'Diagnóstico de fit: construir el caso juntos',
      'El fit es bajo. No forzar el cierre. Usar pitch consultivo: hacer preguntas, descubrir el caso de uso real, y co-construir si Nova Silva es la solución correcta. Más valor en el proceso que en el producto.',
      jsonb_build_object(
        'signal',       'low_fit',
        'pitch_angle',  'consultive_fit_discovery',
        'urgency',      'low',
        'modules',      jsonb_build_array('trazabilidad'),
        'cta',          'Preparar diagnóstico de fit con 5 preguntas clave de descubrimiento',
        'hook',         'Antes de mostrarles el producto, quiero entender qué problema necesitan resolver primero.'
      ),
      10, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSE
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'pitch',
      'Nova Silva: infraestructura de trazabilidad para exportadores que crecen',
      'Prospecto en etapa de exploración. Pitch de categoría: posicionar Nova Silva como la infraestructura de datos agrícolas, no solo un software. Énfasis en red de cooperativas, acceso a mercados premium y cumplimiento estructural.',
      jsonb_build_object(
        'signal',       'default',
        'pitch_angle',  'category_creation',
        'urgency',      'low',
        'modules',      jsonb_build_array('trazabilidad', 'cumplimiento', 'comercial'),
        'cta',          'Demo de la plataforma completa + propuesta de valor por tipo de organización',
        'hook',         'Nova Silva no es solo trazabilidad. Es la capa de datos que conecta su operación con los mercados que importan.'
      ),
      10, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  END IF;


  -- ════════════════════════════════════════════════════════════════════════════
  -- SLOT 2 — DEMO TYPE
  -- What to show and how to structure the demonstration.
  -- Priority: compliance+low_mat > compliance > trust > low_mat > urgency > high_mat > default
  -- ════════════════════════════════════════════════════════════════════════════

  IF v_has_compliance AND v_low_maturity THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'demo',
      'EUDR paso a paso: desde el productor hasta el due diligence',
      'Demo guiada de cumplimiento completo para equipos con poca experiencia en trazabilidad digital. Flujo completo: registro de parcela → entrega → lote → due diligence → reporte EUDR. Máximo 45 minutos. Usar datos reales del sector del prospecto.',
      jsonb_build_object(
        'signal',        'compliance_fear_low_maturity',
        'demo_type',     'eudr_guided_onboarding',
        'duration_min',  45,
        'audience',      jsonb_build_array('operaciones', 'cumplimiento', 'gerencia'),
        'data_needed',   'Solicitar: cantidad de productores, países de destino, certificaciones actuales',
        'flow',          jsonb_build_array('parcelas', 'entregas', 'lotes', 'due_diligence', 'reporte_eudr')
      ),
      20, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_has_compliance THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'demo',
      'Due diligence EUDR en vivo: demostrar el gap cubierto',
      'Demo enfocada en el módulo de cumplimiento EUDR completo. Mostrar: geo-verificación de parcelas, cadena de custodia, generación de due diligence statement, data room para compradores. 30 minutos. Traer al equipo de compliance del prospecto.',
      jsonb_build_object(
        'signal',        'compliance_fear',
        'demo_type',     'eudr_deep_dive',
        'duration_min',  30,
        'audience',      jsonb_build_array('cumplimiento', 'exportacion', 'legal'),
        'data_needed',   'Solicitar: mercados de exportación actuales, auditorías pendientes',
        'flow',          jsonb_build_array('due_diligence', 'geo_verificacion', 'data_room', 'reporte_eudr')
      ),
      20, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_has_trust AND v_low_maturity THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'demo',
      'Prueba de concepto con sus propios datos',
      'La desconfianza se rompe con evidencia real. Proponer un PoC de 2 semanas con datos reales del prospecto (3-5 productores). Demo inicial de 30 min muestra el proceso de carga y primer reporte. Reducir el riesgo percibido con un piloto acotado.',
      jsonb_build_object(
        'signal',        'trust_low_maturity',
        'demo_type',     'proof_of_concept',
        'duration_min',  30,
        'audience',      jsonb_build_array('operaciones', 'tecnologia', 'gerencia'),
        'data_needed',   'Solicitar: muestra de datos de 5 productores + parcelas para el PoC',
        'flow',          jsonb_build_array('carga_datos', 'trazabilidad', 'primer_reporte')
      ),
      20, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_low_maturity THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'demo',
      'Onboarding guiado: primer día en Nova Silva',
      'Demo de adopción para equipos sin experiencia previa en plataformas de trazabilidad. Estructura de "primer día": crear cooperativa, registrar 2 productores, registrar entrega, ver dashboard. Duración: 40 min. Incluir Q&A de adopción.',
      jsonb_build_object(
        'signal',        'low_maturity',
        'demo_type',     'guided_onboarding',
        'duration_min',  40,
        'audience',      jsonb_build_array('operaciones', 'campo', 'administracion'),
        'data_needed',   'Ninguno — usar datos ficticios del sector',
        'flow',          jsonb_build_array('setup_org', 'productores', 'entregas', 'dashboard')
      ),
      20, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_pain AND v_has_urgency THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'demo',
      'Demo ejecutiva de ROI: 25 minutos, decisión clara',
      'El prospecto tiene dolor y urgencia. Demo corta y de alto impacto para tomadores de decisión. Mostrar solo los 3 flujos más relevantes al dolor identificado. Terminar con calculadora de ROI en pantalla. No más de 25 minutos.',
      jsonb_build_object(
        'signal',        'high_pain_urgent',
        'demo_type',     'executive_roi_demo',
        'duration_min',  25,
        'audience',      jsonb_build_array('gerencia', 'direccion', 'cfo'),
        'data_needed',   'Solicitar: volumen anual de café, destinos de exportación, número de productores',
        'flow',          jsonb_build_array('roi_calculator', 'trazabilidad_express', 'cumplimiento_quick')
      ),
      20, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_maturity THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'demo',
      'Demo avanzada: integraciones, APIs y operación a escala',
      'Prospecto maduro digitalmente. Demo técnica y estratégica: API de trazabilidad, integraciones con sistemas existentes, módulos de resiliencia climática y analítica avanzada. Involucrar equipo técnico del prospecto.',
      jsonb_build_object(
        'signal',        'high_maturity',
        'demo_type',     'advanced_integration',
        'duration_min',  60,
        'audience',      jsonb_build_array('tecnologia', 'operaciones', 'gerencia'),
        'data_needed',   'Solicitar: stack tecnológico actual, integraciones existentes, volumen de datos',
        'flow',          jsonb_build_array('api_tour', 'resiliencia_climatica', 'analitica', 'integraciones')
      ),
      20, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSE
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'demo',
      'Demo estándar de plataforma: trazabilidad end-to-end',
      'Demo completa de la plataforma. Flujo productor → acopio → lote → exportación → cumplimiento. 45 minutos. Adaptar el énfasis al tipo de organización del prospecto (cooperativa vs exportador).',
      jsonb_build_object(
        'signal',        'default',
        'demo_type',     'full_platform_overview',
        'duration_min',  45,
        'audience',      jsonb_build_array('operaciones', 'gerencia'),
        'data_needed',   'Tipo de organización, volumen aproximado, principales destinos',
        'flow',          jsonb_build_array('productores', 'acopio', 'lotes', 'exportacion', 'cumplimiento')
      ),
      20, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  END IF;


  -- ════════════════════════════════════════════════════════════════════════════
  -- SLOT 3 — PLAN RECOMMENDATION
  -- Which commercial plan/tier to propose.
  -- Priority: compliance > budget_gap+price > high_pain+high_mat > adoption_risk > low_mat > default
  -- ════════════════════════════════════════════════════════════════════════════

  IF v_has_compliance THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'plan',
      'Plan Pro Compliance',
      'El driver principal es EUDR. Plan Pro Compliance incluye: módulo de due diligence completo, geo-verificación ilimitada, data room para compradores, reportes regulatorios, soporte de compliance dedicado. Presentar como inversión en acceso a mercado, no como costo.',
      jsonb_build_object(
        'signal',      'compliance_fear',
        'plan_code',   'pro_compliance',
        'tier',        'pro',
        'key_modules', jsonb_build_array('cumplimiento_eudr', 'data_room', 'geo_verificacion', 'reportes_regulatorios'),
        'positioning', 'Acceso garantizado al mercado europeo vs costo de exclusión',
        'objection_handle', jsonb_build_object(
          'price',  'El costo de un lote rechazado supera el plan anual completo',
          'timing', 'La regulación EUDR ya está en vigor para grandes operadores'
        )
      ),
      30, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_budget_gap OR v_has_price THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'plan',
      'Plan Starter: entrada de bajo riesgo con ruta de crecimiento',
      'Hay sensibilidad de presupuesto. Proponer Starter con upgrade path claro. Incluir: trazabilidad básica, hasta N productores, 1 módulo de cumplimiento. Ofrecer trimestre piloto con precio de entrada. Mostrar TCO vs alternativas manuales.',
      jsonb_build_object(
        'signal',      'budget_sensitive',
        'plan_code',   'starter',
        'tier',        'starter',
        'key_modules', jsonb_build_array('trazabilidad_basica', 'productores', 'entregas'),
        'positioning', 'Piloto de bajo riesgo con ROI demostrable antes de escalar',
        'upgrade_path','Starter → Growth en 6 meses cuando el ROI sea visible',
        'objection_handle', jsonb_build_object(
          'price',  'Comenzar con Starter y expandir cuando el valor esté probado internamente'
        )
      ),
      30, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_pain AND v_high_maturity THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'plan',
      'Plan Enterprise: operación completa + cumplimiento + analítica',
      'Alto dolor, alta madurez. El prospecto está listo para una solución completa. Plan Enterprise: todos los módulos, usuarios ilimitados, SLA dedicado, onboarding white-glove, integración con sistemas existentes.',
      jsonb_build_object(
        'signal',      'high_pain_high_maturity',
        'plan_code',   'enterprise',
        'tier',        'enterprise',
        'key_modules', jsonb_build_array('todos_los_modulos', 'api_access', 'sla_dedicado', 'onboarding_premium'),
        'positioning', 'La plataforma de operación completa para organizaciones que ya saben lo que necesitan',
        'objection_handle', jsonb_build_object(
          'complexity', 'Onboarding dedicado con su equipo técnico incluido en el plan'
        )
      ),
      30, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_has_adoption_risk OR v_has_complexity THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'plan',
      'Plan Growth + Onboarding Dedicado',
      'Hay miedo a la complejidad de adopción. Plan Growth con paquete de implementación dedicado: 4 sesiones de onboarding, configuración inicial incluida, capacitación en campo para el equipo operativo. Reducir el riesgo percibido con soporte activo en los primeros 90 días.',
      jsonb_build_object(
        'signal',      'adoption_risk',
        'plan_code',   'growth_onboarding',
        'tier',        'growth',
        'key_modules', jsonb_build_array('trazabilidad', 'cumplimiento', 'operacion'),
        'add_ons',     jsonb_build_array('onboarding_4_sessions', 'field_training', 'success_manager_90d'),
        'positioning', 'Nova Silva hace el trabajo pesado de la implementación por ustedes'
      ),
      30, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_low_maturity THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'plan',
      'Plan Growth: crecimiento estructurado con soporte de adopción',
      'Equipo en etapa inicial de digitalización. Plan Growth da el módulo completo de trazabilidad + cumplimiento básico + soporte de adopción incluido. Evitar sobrecargar con módulos avanzados prematuramente.',
      jsonb_build_object(
        'signal',      'low_maturity',
        'plan_code',   'growth',
        'tier',        'growth',
        'key_modules', jsonb_build_array('trazabilidad', 'productores', 'entregas', 'cumplimiento_basico'),
        'positioning', 'Todo lo que necesitan para empezar bien, sin pagar por lo que no usarán aún'
      ),
      30, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSE
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'plan',
      'Plan Growth Operativo',
      'Plan estándar de crecimiento. Trazabilidad + operación agrícola + módulo de cumplimiento. El plan más común para cooperativas y exportadores medianos. Escala con el negocio.',
      jsonb_build_object(
        'signal',      'default',
        'plan_code',   'growth_ops',
        'tier',        'growth',
        'key_modules', jsonb_build_array('trazabilidad', 'operacion', 'cumplimiento'),
        'positioning', 'La operación completa para organizaciones que están escalando'
      ),
      30, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  END IF;


  -- ════════════════════════════════════════════════════════════════════════════
  -- SLOT 4 — NEXT ACTION
  -- The one concrete thing to do in the next 48 hours.
  -- Priority: compliance+no_priority > compliance > high_pain+urgency > trust > high_objection > low_maturity > default
  -- ════════════════════════════════════════════════════════════════════════════

  IF v_has_compliance AND v_has_no_priority THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'next_step',
      'Workshop EUDR: crear urgencia interna con datos de riesgo',
      'Hay miedo al cumplimiento pero no hay urgente interno. El próximo paso es crear la urgencia. Enviar en 24h el informe de riesgos EUDR personalizado para su sector + agendar workshop de riesgo con gerencia y área de cumplimiento.',
      jsonb_build_object(
        'signal',      'compliance_fear_no_priority',
        'action',      'eudr_risk_workshop',
        'timeline',    '48h para enviar informe, 1 semana para agendar workshop',
        'attendees',   jsonb_build_array('gerencia_general', 'cumplimiento', 'exportacion'),
        'deliverable', 'Informe de riesgo EUDR específico para el perfil del prospecto',
        'urgency',     'high',
        'cta',         'Enviar informe de riesgo EUDR hoy. Agendar workshop en los próximos 7 días.'
      ),
      40, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_has_compliance THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'next_step',
      'Auditoría EUDR gratuita: mapear gap actual vs requisitos',
      'Ofrecer una auditoría de cumplimiento EUDR sin costo como siguiente paso. Objetivo: mapear el gap entre el estado actual del prospecto y los requisitos de due diligence de la EU. Resultado: informe de gaps + propuesta técnica ajustada.',
      jsonb_build_object(
        'signal',      'compliance_fear',
        'action',      'free_eudr_audit',
        'timeline',    'Agendar en los próximos 5 días hábiles',
        'attendees',   jsonb_build_array('cumplimiento', 'operaciones', 'exportacion'),
        'deliverable', 'Informe de gap EUDR + roadmap de implementación',
        'urgency',     'high',
        'cta',         'Confirmar fecha de auditoría EUDR gratuita esta semana.'
      ),
      40, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_pain AND v_has_urgency THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'next_step',
      'Demo ejecutiva esta semana: traer CFO y COO',
      'Dolor alto y urgencia presente — el momento es ahora. Agendar demo ejecutiva en los próximos 5 días. Solicitar la asistencia del tomador de decisión final (CFO o COO). Llevar propuesta económica lista para discutir en la misma sesión.',
      jsonb_build_object(
        'signal',      'high_pain_urgent',
        'action',      'exec_demo_with_proposal',
        'timeline',    'Esta semana — máximo 5 días hábiles',
        'attendees',   jsonb_build_array('cfo_o_coo', 'operaciones', 'tecnologia'),
        'deliverable', 'Demo ejecutiva 25 min + propuesta económica personalizada',
        'urgency',     'high',
        'cta',         'Confirmar fecha de demo ejecutiva hoy. Solicitar asistencia del tomador de decisión.'
      ),
      40, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_has_trust THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'next_step',
      'Enviar casos de éxito + conectar con cliente referencia',
      'La desconfianza requiere prueba externa. En 24h: enviar 2 casos de éxito documentados con métricas reales. Ofrecer una llamada de 20 min con un cliente actual de perfil similar como referencia. La credibilidad no se argumenta, se demuestra.',
      jsonb_build_object(
        'signal',      'trust_objection',
        'action',      'send_case_studies_and_reference',
        'timeline',    'Casos de éxito en 24h. Llamada de referencia en 3-5 días.',
        'attendees',   jsonb_build_array('decision_maker', 'influencer_tecnico'),
        'deliverable', '2 casos de éxito PDF + introducción a cliente referencia',
        'urgency',     'medium',
        'cta',         'Enviar casos de éxito hoy. Confirmar si quieren hablar con un cliente actual.'
      ),
      40, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_objection AND v_has_no_priority THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'next_step',
      'Enviar business case personalizado + agendar call con decisor',
      'Múltiples objeciones y falta de prioridad interna. El próximo paso es elevar la conversación al decisor con un business case concreto. Construir el caso económico personalizado (no genérico) basado en los datos del diagnóstico.',
      jsonb_build_object(
        'signal',      'high_objection_no_priority',
        'action',      'custom_business_case_exec_call',
        'timeline',    'Business case en 48h. Call con decisor en 1 semana.',
        'attendees',   jsonb_build_array('decision_maker'),
        'deliverable', 'Business case personalizado con ROI estimado + agenda de call ejecutiva',
        'urgency',     'medium',
        'cta',         'Construir business case esta semana. Agendar call con el decisor final.'
      ),
      40, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_high_objection THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'next_step',
      'Sesión de manejo de objeciones con equipo técnico',
      'Objeciones activas que requieren respuesta directa. Agendar sesión específica de 45 min para abordar cada objeción con el equipo técnico y operativo del prospecto. Llevar evidencia concreta para cada objeción identificada.',
      jsonb_build_object(
        'signal',      'high_objection',
        'action',      'objection_handling_session',
        'timeline',    'Próximos 7 días hábiles',
        'attendees',   jsonb_build_array('operaciones', 'tecnologia', 'cumplimiento'),
        'deliverable', 'Respuestas documentadas a cada objeción activa con evidencia',
        'urgency',     'medium',
        'cta',         'Agendar sesión técnica de 45 min para resolver objeciones específicas.'
      ),
      40, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSIF v_low_maturity THEN
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'next_step',
      'Enviar guía de inicio + agendar assessment de adopción (45 min)',
      'Equipo con madurez digital baja. El siguiente paso es reducir la fricción de entrada. Enviar guía de inicio rápido + agendar un assessment de 45 min para entender el estado actual de sus procesos y diseñar el plan de adopción correcto.',
      jsonb_build_object(
        'signal',      'low_maturity',
        'action',      'send_guide_and_adoption_assessment',
        'timeline',    'Guía en 24h. Assessment en los próximos 7 días.',
        'attendees',   jsonb_build_array('operaciones', 'campo', 'administracion'),
        'deliverable', 'Guía de inicio rápido + plan de adopción personalizado',
        'urgency',     'low',
        'cta',         'Enviar guía de inicio hoy. Agendar assessment de adopción esta semana.'
      ),
      40, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  ELSE
    INSERT INTO public.sales_session_recommendations
      (session_id, recommendation_type, title, description, payload, priority, created_by)
    VALUES (
      p_session_id, 'next_step',
      'Workshop de descubrimiento con equipo operativo y cumplimiento',
      'Agendar workshop de descubrimiento de 60 minutos con el equipo operativo y de cumplimiento del prospecto. Objetivo: mapear el flujo actual de trazabilidad, identificar los 3 mayores puntos de fricción y definir el caso de uso prioritario para la implementación.',
      jsonb_build_object(
        'signal',      'default',
        'action',      'schedule_discovery_workshop',
        'timeline',    'Próximos 10 días hábiles',
        'attendees',   jsonb_build_array('operaciones', 'cumplimiento', 'gerencia'),
        'deliverable', 'Mapa de proceso actual + 3 casos de uso prioritarios identificados',
        'urgency',     'low',
        'cta',         'Agendar workshop de descubrimiento de 60 min con el equipo operativo.'
      ),
      40, auth.uid()
    )
    ON CONFLICT (session_id, recommendation_type, title) DO NOTHING;

  END IF;


  -- ── Event log ───────────────────────────────────────────────────────────────
  INSERT INTO public.sales_session_events(session_id, event_type, payload, created_by)
  VALUES (
    p_session_id,
    'recommendations_generated',
    jsonb_build_object(
      'count',          4,
      'signals_active', jsonb_build_object(
        'high_pain',       v_high_pain,
        'low_maturity',    v_low_maturity,
        'has_urgency',     v_has_urgency,
        'high_objection',  v_high_objection,
        'compliance_fear', v_has_compliance,
        'trust',           v_has_trust,
        'price',           v_has_price,
        'budget_gap',      v_budget_gap,
        'no_priority',     v_has_no_priority,
        'objection_count', v_objection_count
      )
    ),
    auth.uid()
  );

END;
$$;


-- =============================================================================
-- 2. fn_sales_finalize_session (REPLACED IN-PLACE)
-- Switches fn_sales_detect_objections → fn_sales_detect_objections_v2
-- so recalibrated confidences are present when recommendations run.
-- All other logic is identical to the original.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.fn_sales_finalize_session(p_session_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status public.sales_session_status;
  v_q_id   uuid;
BEGIN
  perform public._ensure_internal();

  SELECT status, questionnaire_id
  INTO v_status, v_q_id
  FROM public.sales_sessions
  WHERE id = p_session_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Session not found';
  END IF;

  IF v_status = 'archived' THEN
    RAISE EXCEPTION 'Archived session cannot be finalized';
  END IF;

  IF v_status = 'completed' THEN
    RETURN;
  END IF;

  -- Pipeline order matters:
  --   scores first  → objections read scores for recalibration
  --   objections v2 → recommendations read recalibrated confidences
  PERFORM public.fn_sales_recalculate_scores(p_session_id);
  PERFORM public.fn_sales_detect_objections_v2(p_session_id);    -- ← was v1
  PERFORM public.fn_sales_generate_recommendations(p_session_id);

  -- Immutable EUDR audit snapshot
  INSERT INTO public.sales_session_question_snapshots(
    session_id, question_id, question_code, question_text, question_type,
    section_code, section_title, answer_option_id, answer_option_value, answer_option_label
  )
  SELECT
    p_session_id,
    q.id,
    q.code,
    q.text,
    q.question_type,
    sct.code,
    sct.title,
    ao.id,
    ao.value,
    ao.label
  FROM public.sales_questions q
  JOIN public.sales_question_sections sct ON sct.id = q.section_id
  JOIN public.sales_questionnaires    qq  ON qq.id  = q.questionnaire_id
  LEFT JOIN public.sales_answer_options ao
         ON ao.question_id = q.id AND ao.is_active = true
  WHERE q.questionnaire_id = v_q_id
    AND q.is_active  = true
    AND sct.is_active = true
    AND qq.is_active  = true
  ON CONFLICT (session_id, question_id, answer_option_id) DO NOTHING;

  UPDATE public.sales_sessions
  SET status     = 'completed',
      updated_at = now(),
      updated_by = auth.uid()
  WHERE id = p_session_id;

  INSERT INTO public.sales_session_events(session_id, event_type, payload, created_by)
  VALUES (p_session_id, 'finalized', null, auth.uid());

END;
$$;
