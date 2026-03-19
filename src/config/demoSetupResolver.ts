/**
 * Resuelve config del wizard a org + profile para DemoContext.
 */
import type { DemoOrganization, DemoProfile } from './demoArchitecture';
import { DEMO_ORGANIZATIONS, DEMO_PROFILES } from './demoArchitecture';
import {
  wizardOrgToArchetype,
  wizardOpToArchetype,
  wizardModulesToDomainKeys,
  type DemoSetupConfig,
} from './demoSetupConfig';

export function resolveConfigToOrg(config: DemoSetupConfig): DemoOrganization {
  const orgType = wizardOrgToArchetype(config.orgType);
  const operatingModel = wizardOpToArchetype(config.operatingModel);
  const domainKeys = wizardModulesToDomainKeys(config.modulesEnabled);

  const base = DEMO_ORGANIZATIONS.find(
    (o) => o.orgType === orgType && o.operatingModel === operatingModel
  );

  const modules = [
    { id: 'm1', key: 'produccion', label: 'Producción', active: domainKeys.produccion ?? false },
    { id: 'm2', key: 'abastecimiento', label: 'Abastecimiento', active: domainKeys.abastecimiento ?? false },
    { id: 'm3', key: 'agronomia', label: 'Agronomía', active: domainKeys.agronomia ?? false },
    { id: 'm4', key: 'resiliencia', label: 'Resiliencia', active: domainKeys.resiliencia ?? true },
    { id: 'm5', key: 'cumplimiento', label: 'Cumplimiento', active: domainKeys.cumplimiento ?? false },
    { id: 'm6', key: 'calidad', label: 'Calidad', active: domainKeys.calidad ?? false },
    { id: 'm7', key: 'finanzas', label: 'Finanzas', active: domainKeys.finanzas ?? true },
    { id: 'm8', key: 'jornales', label: 'Jornales', active: domainKeys.jornales ?? config.scaleProfile.hasLabor },
  ];

  if (base) {
    return { ...base, modules };
  }

  const fallback = DEMO_ORGANIZATIONS.find((o) => o.orgType === orgType) ?? DEMO_ORGANIZATIONS[0];
  return {
    ...fallback,
    id: 'org-wizard-' + Date.now(),
    name: `Demo ${orgType}`,
    orgType,
    operatingModel,
    modules,
  };
}

export function resolveConfigToProfile(org: DemoOrganization): DemoProfile {
  const orgId = org.id;
  const existing = DEMO_PROFILES.find((p) => p.organizationId === orgId);
  if (existing) return existing;

  const byType: Record<string, DemoProfile> = {
    cooperativa: DEMO_PROFILES.find((p) => p.email === 'demo.cooperativa@novasilva.com')!,
    finca_empresarial: DEMO_PROFILES.find((p) => p.organizationId === 'org-finca-1')!,
    exportador: DEMO_PROFILES.find((p) => p.email === 'demo.exportador@novasilva.com')!,
    productor_privado: DEMO_PROFILES.find((p) => p.email === 'demo.productor@novasilva.com')!,
    certificadora: DEMO_PROFILES.find((p) => p.email === 'demo.certificadora@novasilva.com')!,
  };

  const p = byType[org.orgType] ?? DEMO_PROFILES[0];
  return { ...p, id: 'p-wizard', organizationId: orgId };
}
