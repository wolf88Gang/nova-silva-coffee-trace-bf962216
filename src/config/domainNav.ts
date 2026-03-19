/**
 * Configuración de navegación por dominios.
 * Visibilidad derivada de orgType, operatingModel, modules activos y role.
 */
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Sprout,
  Package,
  Leaf,
  Shield,
  FileCheck,
  Award,
  DollarSign,
  Settings,
  HelpCircle,
  FlaskConical,
  Bug,
  BarChart3,
  ShieldCheck,
} from 'lucide-react';
import type { OrgType, OperatingModel, DemoModule } from './demoArchitecture';

export interface DomainNavItem {
  key: string;
  label: string;
  url: string;
  icon: LucideIcon;
  children?: { key: string; label: string; url: string; icon: LucideIcon }[];
}

/** Dominios base con rutas por dominio (no por rol) */
export const DOMAIN_NAV: DomainNavItem[] = [
  { key: 'dashboard', label: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
  {
    key: 'produccion',
    label: 'Producción',
    url: '/produccion',
    icon: Sprout,
    children: [
      { key: 'parcelas', label: 'Parcelas', url: '/produccion/parcelas', icon: Sprout },
    ],
  },
  {
    key: 'abastecimiento',
    label: 'Abastecimiento',
    url: '/abastecimiento',
    icon: Package,
  },
  {
    key: 'agronomia',
    label: 'Agronomía',
    url: '/agronomia',
    icon: Leaf,
    children: [
      { key: 'nutricion', label: 'Nutrición', url: '/agronomia/nutricion', icon: FlaskConical },
      { key: 'guard', label: 'Nova Guard', url: '/agronomia/guard', icon: Bug },
      { key: 'yield', label: 'Nova Yield', url: '/agronomia/yield', icon: BarChart3 },
    ],
  },
  {
    key: 'resiliencia',
    label: 'Resiliencia',
    url: '/resiliencia',
    icon: Shield,
    children: [
      { key: 'vital', label: 'Protocolo VITAL', url: '/resiliencia/vital', icon: ShieldCheck },
    ],
  },
  {
    key: 'cumplimiento',
    label: 'Cumplimiento',
    url: '/cumplimiento',
    icon: FileCheck,
  },
  {
    key: 'calidad',
    label: 'Calidad',
    url: '/calidad',
    icon: Award,
    children: [
      { key: 'nova-cup', label: 'Nova Cup', url: '/calidad/nova-cup', icon: Award },
    ],
  },
  {
    key: 'finanzas',
    label: 'Finanzas',
    url: '/finanzas',
    icon: DollarSign,
  },
  {
    key: 'jornales',
    label: 'Jornales',
    url: '/produccion/jornales',
    icon: Settings,
  },
  {
    key: 'administracion',
    label: 'Administración',
    url: '/administracion',
    icon: Settings,
  },
  {
    key: 'ayuda',
    label: 'Ayuda',
    url: '/ayuda',
    icon: HelpCircle,
  },
];

/** Módulos que requieren operación propia (producción propia o agregación) para mostrar Jornales */
const OPERACION_PROPIA_MODELS: OperatingModel[] = [
  'solo_produccion_propia',
  'produccion_propia_y_compra_terceros',
  'agregacion_cooperativa',
];

function hasOperacionPropia(operatingModel: OperatingModel): boolean {
  return OPERACION_PROPIA_MODELS.includes(operatingModel);
}

function isModuleActive(modules: DemoModule[], key: string): boolean {
  const m = modules.find((x) => x.key === key);
  return m?.active ?? false;
}

export interface DomainNavInput {
  orgType: OrgType;
  operatingModel: OperatingModel;
  modules: DemoModule[];
  role: string;
}

/**
 * Filtra la navegación por dominios según orgType, operatingModel, modules y role.
 */
export function getDomainNavItems(input: DomainNavInput): DomainNavItem[] {
  const { orgType, operatingModel, modules, role } = input;

  return DOMAIN_NAV.filter((item) => {
    if (item.key === 'dashboard') return true;
    if (item.key === 'ayuda') return true;

    if (item.key === 'jornales') {
      return hasOperacionPropia(operatingModel) && isModuleActive(modules, 'jornales');
    }

    if (item.key === 'produccion') {
      return isModuleActive(modules, 'produccion');
    }
    if (item.key === 'abastecimiento') {
      return isModuleActive(modules, 'abastecimiento');
    }
    if (item.key === 'agronomia') {
      return isModuleActive(modules, 'agronomia');
    }
    if (item.key === 'resiliencia') {
      return isModuleActive(modules, 'resiliencia');
    }
    if (item.key === 'cumplimiento') {
      return isModuleActive(modules, 'cumplimiento');
    }
    if (item.key === 'calidad') {
      return isModuleActive(modules, 'calidad');
    }
    if (item.key === 'finanzas') {
      return isModuleActive(modules, 'finanzas');
    }
    if (item.key === 'administracion') {
      const adminRoles = ['admin_org', 'admin', 'cooperativa', 'exportador', 'certificadora', 'auditor'];
      return adminRoles.includes(role);
    }

    return true;
  });
}
