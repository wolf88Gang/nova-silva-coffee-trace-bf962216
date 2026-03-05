import type { OrgTipo } from './org-modules';

interface OrgTerminology {
  actores: string;
  navLabel: string;
  dashboard: string;
  singular: string;
}

const TERMINOLOGY: Record<string, OrgTerminology> = {
  cooperativa: {
    actores: 'Personas socias',
    navLabel: 'Productoras y Productores',
    dashboard: 'Panel de Cooperativa',
    singular: 'persona socia',
  },
  exportador: {
    actores: 'Proveedores',
    navLabel: 'Cartera de Proveedores',
    dashboard: 'Panel de Exportacion',
    singular: 'proveedor',
  },
  productor_empresarial: {
    actores: 'Unidades productivas',
    navLabel: 'Unidades',
    dashboard: 'Panel de Produccion',
    singular: 'unidad productiva',
  },
  beneficio_privado: {
    actores: 'Proveedores',
    navLabel: 'Proveedores',
    dashboard: 'Panel de Beneficio',
    singular: 'proveedor',
  },
  certificadora: {
    actores: 'Organizaciones',
    navLabel: 'Organizaciones',
    dashboard: 'Panel de Certificacion',
    singular: 'organizacion',
  },
};

const DEFAULT_TERMS: OrgTerminology = {
  actores: 'Productores',
  navLabel: 'Productores',
  dashboard: 'Panel Principal',
  singular: 'productor',
};

export function getOrgTerminology(orgTipo: OrgTipo | string | null): OrgTerminology {
  if (!orgTipo) return DEFAULT_TERMS;
  return TERMINOLOGY[orgTipo] ?? DEFAULT_TERMS;
}
