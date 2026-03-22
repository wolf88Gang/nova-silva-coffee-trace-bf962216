/**
 * Certification data hooks — connects to real Supabase tables.
 * Uses org_certifications, org_export_markets via organization_id.
 * Falls back to demo generators when no real data exists.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { TABLE, ORG_KEY } from '@/lib/keys';
import {
  CERTIFICATION_SCHEMES,
  generateDemoReadiness,
  generateDemoGaps,
  generateDemoCorrectiveActions,
  generateDemoEvidence,
  type SchemeReadiness,
  type GapItem,
  type CorrectiveAction,
  type EvidenceItem,
  type SchemeKey,
} from '@/lib/certificationEngine';

export interface OrgCertificationRow {
  id: string;
  organization_id: string;
  certificadora: string;
  codigo: string | null;
  fecha_emision: string | null;
  fecha_vencimiento: string | null;
  activo: boolean;
}

export interface OrgExportMarketRow {
  id: string;
  organization_id: string;
  mercado: string;
  activo: boolean;
}

/** Map DB certificadora names to SchemeKey */
const CERT_NAME_TO_SCHEME: Record<string, SchemeKey> = {
  eudr: 'eudr',
  'rainforest alliance': 'rainforest_alliance',
  'rainforest': 'rainforest_alliance',
  ra: 'rainforest_alliance',
  fairtrade: 'fairtrade',
  flo: 'fairtrade',
  'cafe practices': 'cafe_practices',
  'c.a.f.e. practices': 'cafe_practices',
  'cafe_practices': 'cafe_practices',
  '4c': '4c',
  'organic': 'organic',
  'orgánico': 'organic',
  organico: 'organic',
  'usda nop': 'organic',
  'eu organic': 'organic',
  jas: 'organic',
  'esencial costa rica': 'esencial_cr',
  'esencial cr': 'esencial_cr',
  esencial: 'esencial_cr',
};

function matchSchemeKey(certificadora: string): SchemeKey | null {
  const normalized = certificadora.trim().toLowerCase();
  return CERT_NAME_TO_SCHEME[normalized] ?? null;
}

/**
 * Fetch org certifications and export markets, then compute readiness.
 * If no real data, falls back to demo data.
 */
export function useCertificationReadiness() {
  const { organizationId } = useOrgContext();

  return useQuery({
    queryKey: ['certification-readiness', organizationId],
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5,
    queryFn: async (): Promise<{
      readiness: SchemeReadiness[];
      gaps: GapItem[];
      correctives: CorrectiveAction[];
      evidence: EvidenceItem[];
      orgCerts: OrgCertificationRow[];
      exportMarkets: OrgExportMarketRow[];
      dataSource: 'real' | 'demo';
    }> => {
      // Fetch org_certifications
      const { data: certsData, error: certsError } = await supabase
        .from(TABLE.ORG_CERTIFICATIONS)
        .select('*')
        .eq(ORG_KEY, organizationId!);

      // Fetch org_export_markets
      const { data: marketsData, error: marketsError } = await supabase
        .from(TABLE.ORG_EXPORT_MARKETS)
        .select('*')
        .eq(ORG_KEY, organizationId!);

      if (certsError) console.warn('[Certification] org_certifications query error:', certsError.message);
      if (marketsError) console.warn('[Certification] org_export_markets query error:', marketsError.message);

      const orgCerts = (certsData as OrgCertificationRow[] | null) ?? [];
      const exportMarkets = (marketsData as OrgExportMarketRow[] | null) ?? [];

      // If we have real certification records, compute readiness from them
      if (orgCerts.length > 0) {
        const activeSchemes = new Set<SchemeKey>();
        for (const cert of orgCerts) {
          if (!cert.activo) continue;
          const key = matchSchemeKey(cert.certificadora);
          if (key) activeSchemes.add(key);
        }

        // Build readiness only for active schemes
        const readiness: SchemeReadiness[] = CERTIFICATION_SCHEMES
          .filter(s => activeSchemes.has(s.key))
          .map(scheme => {
            const cert = orgCerts.find(c => matchSchemeKey(c.certificadora) === scheme.key && c.activo);
            const isExpired = cert?.fecha_vencimiento ? new Date(cert.fecha_vencimiento) < new Date() : false;
            const reqs = scheme.categories.flatMap(c => c.requirements);
            const total = reqs.length;
            // Without per-requirement evidence tracking, estimate based on cert status
            const baseReadiness = isExpired ? 30 : 65;
            const compliant = Math.floor(total * (baseReadiness / 100));
            const partial = Math.floor((total - compliant) * 0.3);
            const missing = total - compliant - partial;

            return {
              scheme: scheme.key,
              totalRequirements: total,
              compliant,
              partial,
              missing: Math.max(0, missing),
              expired: isExpired ? 1 : 0,
              readinessPercent: baseReadiness,
              criticalGaps: reqs.filter(r => r.severity === 'tolerancia_cero' || r.severity === 'critico').length - Math.floor(compliant * 0.5),
              riskLevel: baseReadiness > 80 ? 'bajo' : baseReadiness > 60 ? 'medio' : baseReadiness > 40 ? 'alto' : 'critico',
            } as SchemeReadiness;
          });

        return {
          readiness: readiness.length > 0 ? readiness : generateDemoReadiness(),
          gaps: generateDemoGaps(),
          correctives: generateDemoCorrectiveActions(),
          evidence: generateDemoEvidence(),
          orgCerts,
          exportMarkets,
          dataSource: readiness.length > 0 ? 'real' : 'demo',
        };
      }

      // No real data — use demo generators
      return {
        readiness: generateDemoReadiness(),
        gaps: generateDemoGaps(),
        correctives: generateDemoCorrectiveActions(),
        evidence: generateDemoEvidence(),
        orgCerts: [],
        exportMarkets: [],
        dataSource: 'demo',
      };
    },
  });
}
