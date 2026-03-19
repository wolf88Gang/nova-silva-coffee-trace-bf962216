import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// ─── Tipos de catálogo ─────────────────────────────────────────────────────

export interface NsThreat {
  id: string;
  code: string;
  name: string;
  type: string;
  agent: string | null;
  tissue_target: string | null;
  damage_mechanism: string | null;
  economic_relevance_cr: string;
  active: boolean;
}

export interface NsPhenostage {
  id: string;
  code: string;
  name: string;
  field_markers: string[];
  sort_order: number;
}

export interface NsAction {
  id: string;
  code: string;
  name: string;
  category: string;
  description: string | null;
  expected_effect: string | null;
  risk_level: string;
  cost_level: string;
  contraindications: string[];
  compliance_flags: string[];
}

export interface NsSamplePlan {
  id: string;
  code: string;
  name: string;
  min_trees: number;
  strata_required: boolean;
  min_photos: number;
  notes: string | null;
}

// ─── Tipos de datos operativos ────────────────────────────────────────────

export interface NsFieldObservation {
  id: string;
  org_id: string;
  farm_id: string | null;
  phenostage_id: string | null;
  shade_pct: number | null;
  altitude_m: number | null;
  sample_plan_id: string | null;
  n_trees: number | null;
  coverage_score: number | null;
  metrics_json: Record<string, {
    incidencia?: number;
    severidad?: number;
    trap_count?: number;
    notes?: string;
  }>;
  photos: unknown[];
  notes: string | null;
  obs_date: string;
  created_at: string;
  // joins
  ns_phenostages?: NsPhenostage;
  ns_sample_plans?: NsSamplePlan;
}

export interface NsRiskAssessment {
  id: string;
  org_id: string;
  observation_id: string | null;
  threat_id: string;
  risk_score: number;
  risk_level: 'green' | 'amber' | 'red';
  confidence: number;
  action_mode: 'abstain' | 'preventive' | 'alert' | 'outbreak';
  explanation_json: Record<string, unknown>;
  evidence_gaps: string[];
  valid_from: string;
  valid_until: string | null;
  created_at: string;
  // joins
  ns_threats?: NsThreat;
}

export interface CreateObservationInput {
  org_id: string;
  farm_id?: string;
  phenostage_id?: string;
  sample_plan_id?: string;
  shade_pct?: number;
  altitude_m?: number;
  n_trees?: number;
  coverage_score?: number;
  metrics_json: Record<string, { incidencia?: number; severidad?: number; trap_count?: number; notes?: string }>;
  notes?: string;
  obs_date: string;
}

// ─── Hooks de catálogo ────────────────────────────────────────────────────

export function useNsThreats() {
  return useQuery({
    queryKey: ['ns_threats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ns_threats')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as NsThreat[];
    },
    staleTime: 1000 * 60 * 60, // 1 hora — catálogo estable
  });
}

export function useNsPhenostages() {
  return useQuery({
    queryKey: ['ns_phenostages'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ns_phenostages')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as NsPhenostage[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useNsSamplePlans() {
  return useQuery({
    queryKey: ['ns_sample_plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ns_sample_plans')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as NsSamplePlan[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

export function useNsActions() {
  return useQuery({
    queryKey: ['ns_actions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ns_actions')
        .select('*')
        .eq('active', true)
        .order('name');
      if (error) throw error;
      return data as NsAction[];
    },
    staleTime: 1000 * 60 * 60,
  });
}

// ─── Observaciones de campo ───────────────────────────────────────────────

export function useFieldObservations(orgId: string | undefined) {
  return useQuery({
    queryKey: ['ns_field_observations', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ns_field_observations')
        .select(`
          *,
          ns_phenostages(id, code, name),
          ns_sample_plans(id, code, name)
        `)
        .eq('org_id', orgId!)
        .order('obs_date', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as NsFieldObservation[];
    },
    enabled: !!orgId,
  });
}

export function useCreateFieldObservation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateObservationInput) => {
      const { data, error } = await supabase
        .from('ns_field_observations')
        .insert(input)
        .select()
        .single();
      if (error) throw error;
      return data as NsFieldObservation;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ns_field_observations', data.org_id] });
      queryClient.invalidateQueries({ queryKey: ['ns_risk_assessments', data.org_id] });
    },
  });
}

// ─── Risk Assessments ────────────────────────────────────────────────────

export type CreateRiskAssessmentInput = Omit<NsRiskAssessment, 'id' | 'created_at' | 'ns_threats'> & {
  ruleset_version?: string;
  expected_impact?: Record<string, unknown>;
};

export function useRiskAssessments(orgId: string | undefined) {
  return useQuery({
    queryKey: ['ns_risk_assessments', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ns_risk_assessments')
        .select(`
          *,
          ns_threats(id, code, name, type, tissue_target)
        `)
        .eq('org_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(30);
      if (error) throw error;
      return data as NsRiskAssessment[];
    },
    enabled: !!orgId,
  });
}

export function useCreateRiskAssessment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateRiskAssessmentInput) => {
      const { ruleset_version, expected_impact, ...rest } = input;
      const payload = { ...rest };
      if (ruleset_version !== undefined) (payload as Record<string, unknown>).ruleset_version = ruleset_version;
      if (expected_impact !== undefined) (payload as Record<string, unknown>).expected_impact = expected_impact;
      const { data, error } = await supabase
        .from('ns_risk_assessments')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: NsRiskAssessment) => {
      queryClient.invalidateQueries({ queryKey: ['ns_risk_assessments', data.org_id] });
    },
  });
}

// ─── Helper: compute simple risk from observation ─────────────────────────
// MVP risk engine (client-side). Replica simplificada de la función de riesgo del spec.
// Fases futuras pueden mover esto a un Edge Function.

export function computeSimpleRisk(
  threatCode: string,
  metrics: { incidencia?: number; severidad?: number; trap_count?: number },
  env: { shade_pct?: number; rain_mm_7d?: number; rh_night?: number }
): { risk_score: number; risk_level: 'green' | 'amber' | 'red'; action_mode: 'abstain' | 'preventive' | 'alert' | 'outbreak'; confidence: number } {
  const inc = metrics.incidencia ?? 0;
  const sev = metrics.severidad ?? 0;

  // Umbrales por amenaza (simplificados)
  const thresholds: Record<string, { alert: number; outbreak: number }> = {
    broca:       { alert: 0.05,  outbreak: 0.10 },
    roya:        { alert: 0.05,  outbreak: 0.15 },
    ojo_de_gallo:{ alert: 0.08,  outbreak: 0.20 },
    antracnosis: { alert: 0.10,  outbreak: 0.25 },
    mancha_hierro:{ alert: 0.10, outbreak: 0.30 },
  };
  const t = thresholds[threatCode] ?? { alert: 0.08, outbreak: 0.20 };

  // Base score por incidencia y severidad
  const incScore = Math.min(inc / t.outbreak, 1);
  const sevScore = Math.min(sev / 0.5, 1);
  let baseScore = 0.55 * incScore + 0.35 * sevScore;

  // Modificadores ambientales simples
  if (env.shade_pct && env.shade_pct >= 50 && ['roya', 'ojo_de_gallo'].includes(threatCode)) {
    baseScore *= 1.2;
  }
  if (env.rain_mm_7d && env.rain_mm_7d >= 80 && ['roya', 'ojo_de_gallo'].includes(threatCode)) {
    baseScore *= 1.15;
  }
  if (env.rh_night && env.rh_night >= 85 && threatCode === 'roya') {
    baseScore *= 1.25;
  }

  const risk_score = Math.min(Math.round(baseScore * 1000) / 1000, 1);

  let risk_level: 'green' | 'amber' | 'red';
  let action_mode: 'abstain' | 'preventive' | 'alert' | 'outbreak';

  if (inc === 0 && sev === 0 && (metrics.trap_count === undefined || metrics.trap_count === 0)) {
    return { risk_score: 0, risk_level: 'green', action_mode: 'abstain', confidence: 0.4 };
  }
  if (risk_score < 0.35)  { risk_level = 'green';  action_mode = 'preventive'; }
  else if (risk_score < 0.65) { risk_level = 'amber'; action_mode = 'alert'; }
  else                    { risk_level = 'red';    action_mode = 'outbreak'; }

  const confidence = inc > 0 ? 0.70 : 0.45;
  return { risk_score, risk_level, action_mode, confidence };
}
