import logoNovasilva from '@/assets/logo-novasilva.png';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/hooks/useOrgContext';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { getOrgTypeLabel } from '@/lib/org-terminology';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Leaf, X, LayoutDashboard, Users, Package, Building2,
  ShieldCheck, Shield, FileText, Sprout, Settings, Map,
  DollarSign, Bug, AlertTriangle, ChevronDown, TrendingUp,
  Wallet, Eye, FolderOpen, CreditCard, HelpCircle, BookOpen,
  Headphones, Award, Briefcase, Coffee, BarChart3, Truck,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

// ── TYPES ──

interface NavItemDef {
  title: string;
  url: string;
  icon: LucideIcon;
}

interface NavGroupDef {
  label: string;
  icon: LucideIcon;
  items: NavItemDef[];
  standalone?: boolean;
  url?: string;
  /** Module keys that activate this group */
  moduleKeys?: string[];
}

// ── ALL DOMAIN GROUPS (module-driven) ──

const ALL_GROUPS: NavGroupDef[] = [
  {
    label: 'Inicio',
    icon: LayoutDashboard,
    standalone: true,
    url: '/produccion',
    items: [],
    // Always visible
  },
  {
    label: 'Producción',
    icon: Sprout,
    moduleKeys: ['Producción', 'produccion'],
    items: [
      { title: 'Resumen de producción', url: '/produccion', icon: Sprout },
      { title: 'Productores', url: '/produccion/productores', icon: Users },
      { title: 'Parcelas', url: '/produccion/parcelas', icon: Map },
      { title: 'Cultivos', url: '/produccion/cultivos', icon: Leaf },
      { title: 'Entregas', url: '/produccion/entregas', icon: Package },
      { title: 'Documentos', url: '/produccion/documentos', icon: FolderOpen },
    ],
  },
  {
    label: 'Abastecimiento',
    icon: Truck,
    moduleKeys: ['Abastecimiento', 'abastecimiento'],
    items: [
      { title: 'Proveedores', url: '/abastecimiento/proveedores', icon: Users },
      { title: 'Recepción de café', url: '/abastecimiento/recepcion', icon: Package },
      { title: 'Compras y lotes', url: '/abastecimiento/compras', icon: FileText },
      { title: 'Evidencias proveedor', url: '/abastecimiento/evidencias', icon: FolderOpen },
      { title: 'Riesgo de origen', url: '/abastecimiento/riesgo', icon: AlertTriangle },
    ],
  },
  {
    label: 'Orígenes',
    icon: Map,
    moduleKeys: ['Orígenes', 'origenes'],
    items: [
      { title: 'Proveedores', url: '/origenes/proveedores', icon: Users },
      { title: 'Regiones', url: '/origenes/regiones', icon: Map },
      { title: 'Riesgo de origen', url: '/origenes/riesgo', icon: AlertTriangle },
      { title: 'EUDR por proveedor', url: '/origenes/eudr', icon: ShieldCheck },
    ],
  },
  {
    label: 'Agronomía',
    icon: Leaf,
    moduleKeys: ['Agronomía', 'agronomia'],
    items: [
      { title: 'Centro agronómico', url: '/agronomia', icon: Leaf },
      { title: 'Nutrición', url: '/agronomia/nutricion', icon: Sprout },
      { title: 'Nova Guard', url: '/agronomia/guard', icon: Bug },
      { title: 'Nova Yield', url: '/agronomia/yield', icon: TrendingUp },
      { title: 'Alertas', url: '/agronomia/alertas', icon: AlertTriangle },
    ],
  },
  {
    label: 'Analítica Agronómica',
    icon: BarChart3,
    moduleKeys: ['Analítica', 'analitica'],
    items: [
      { title: 'Señales de riesgo', url: '/analitica/riesgo', icon: AlertTriangle },
      { title: 'Recomendaciones', url: '/analitica/recomendaciones', icon: TrendingUp },
      { title: 'Riesgo fitosanitario', url: '/analitica/fitosanitario', icon: Map },
      { title: 'Potencial productivo', url: '/analitica/productivo', icon: BarChart3 },
    ],
  },
  {
    label: 'Jornales',
    icon: Briefcase,
    moduleKeys: ['Jornales', 'jornales'],
    items: [
      { title: 'Registro de jornales', url: '/jornales', icon: Briefcase },
    ],
  },
  {
    label: 'Inventario',
    icon: Package,
    moduleKeys: ['Inventario', 'inventario'],
    items: [
      { title: 'Control de inventario', url: '/operaciones/inventario', icon: Package },
    ],
  },
  {
    label: 'Resiliencia',
    icon: Shield,
    moduleKeys: ['VITAL', 'vital'],
    items: [
      { title: 'Protocolo VITAL', url: '/resiliencia/vital', icon: Shield },
      { title: 'Resultados por finca', url: '/resiliencia/vital', icon: Map },
      { title: 'Brechas y acciones', url: '/resiliencia/vital', icon: AlertTriangle },
    ],
  },
  {
    label: 'Cumplimiento',
    icon: ShieldCheck,
    moduleKeys: ['Cumplimiento', 'cumplimiento', 'EUDR', 'eudr', 'Auditorías', 'auditorias', 'Data Room', 'data_room', 'Dossiers', 'dossiers'],
    items: [
      { title: 'Trazabilidad', url: '/cumplimiento/trazabilidad', icon: Eye },
      { title: 'Lotes', url: '/cumplimiento/lotes', icon: Package },
      { title: 'Dossiers EUDR', url: '/cumplimiento/eudr', icon: ShieldCheck },
      { title: 'Data Room', url: '/cumplimiento/data-room', icon: FolderOpen },
      { title: 'Auditorías', url: '/cumplimiento/auditorias', icon: FileText },
    ],
  },
  {
    label: 'Calidad',
    icon: Award,
    moduleKeys: ['Nova Cup', 'nova_cup', 'calidad'],
    items: [
      { title: 'Nova Cup', url: '/calidad', icon: Award },
      { title: 'Resultados por lote', url: '/calidad', icon: Coffee },
      { title: 'Tendencias', url: '/calidad', icon: TrendingUp },
    ],
  },
  {
    label: 'Comercial',
    icon: Coffee,
    moduleKeys: ['Lotes', 'lotes', 'comercial'],
    items: [
      { title: 'Lotes comerciales', url: '/comercial/lotes', icon: Package },
      { title: 'Contratos', url: '/comercial/contratos', icon: FileText },
      { title: 'Trazabilidad', url: '/comercial/trazabilidad', icon: Eye },
    ],
  },
  {
    label: 'Finanzas',
    icon: Wallet,
    moduleKeys: ['Finanzas', 'finanzas'],
    items: [
      { title: 'Panel financiero', url: '/finanzas/panel', icon: DollarSign },
      { title: 'Créditos', url: '/finanzas/creditos', icon: CreditCard },
      { title: 'Score Nova', url: '/finanzas/score-nova', icon: TrendingUp },
      { title: 'Carbono', url: '/finanzas/carbono', icon: Leaf },
      { title: 'Facturación', url: '/finanzas/facturacion', icon: FileText },
    ],
  },
  {
    label: 'Administración',
    icon: Settings,
    moduleKeys: [], // visible to admin or org-admin
    items: [
      { title: 'Usuarios y roles', url: '/admin/usuarios', icon: Users },
      { title: 'Organización', url: '/admin/organizacion', icon: Building2 },
      { title: 'Configuración', url: '/admin/configuracion', icon: Settings },
      { title: 'Billing', url: '/admin/billing', icon: Wallet },
    ],
  },
  {
    label: 'Ayuda',
    icon: HelpCircle,
    items: [
      { title: 'Centro de ayuda', url: '/ayuda', icon: HelpCircle },
      { title: 'Glosario', url: '/ayuda/glosario', icon: BookOpen },
      { title: 'Soporte', url: '/ayuda/soporte', icon: Headphones },
    ],
  },
];

// ── MODULE-DRIVEN FILTERING ──

function getSidebarGroups(role: string, modules: string[]): NavGroupDef[] {
  const modulesLower = modules.map(m => m.toLowerCase());

  return ALL_GROUPS.filter(group => {
    // Always show Inicio and Ayuda
    if (group.label === 'Inicio' || group.label === 'Ayuda') return true;

    // Admin always sees Administración
    if (group.label === 'Administración') {
      return ['cooperativa', 'admin', 'exportador'].includes(role);
    }

    // Certificadora: only Cumplimiento
    if (role === 'certificadora') {
      return ['Cumplimiento'].includes(group.label);
    }

    // Module-driven: check if any moduleKey matches
    if (group.moduleKeys && group.moduleKeys.length > 0) {
      return group.moduleKeys.some(key =>
        modules.includes(key) || modulesLower.includes(key.toLowerCase())
      );
    }

    return false;
  });
}

// ── COMPONENTS ──

function NavItemLink({ item, onClick }: { item: NavItemDef; onClick?: () => void }) {
  return (
    <NavLink
      to={item.url}
      onClick={onClick}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
          : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <item.icon className="h-3.5 w-3.5 shrink-0" />
      <span>{item.title}</span>
    </NavLink>
  );
}

function NavGroup({ group, onClick, defaultOpen }: { group: NavGroupDef; onClick?: () => void; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  if (group.standalone && group.url) {
    return (
      <NavLink
        to={group.url}
        onClick={onClick}
        className={({ isActive }) => cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <group.icon className="h-4 w-4 shrink-0" />
        <span>{group.label}</span>
      </NavLink>
    );
  }

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors"
      >
        <div className="flex items-center gap-2">
          <group.icon className="h-3.5 w-3.5" />
          <span>{group.label}</span>
        </div>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen ? '' : '-rotate-90')} />
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-1">
          {group.items.map(item => (
            <NavItemLink key={item.url + item.title} item={item} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  );
}

function groupContainsRoute(group: NavGroupDef, pathname: string): boolean {
  if (group.standalone && group.url) return pathname === group.url;
  return group.items.some(item => pathname.startsWith(item.url));
}

// ── SIDEBAR ──

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { orgTipo } = useOrgContext();
  const location = useLocation();

  if (!user) return null;

  // Get modules from demo config or fall back to role-based defaults
  const demoConfig = getDemoConfig();
  const modules = demoConfig?.modules || getDefaultModulesForRole(user.role);
  const navGroups = getSidebarGroups(user.role, modules);
  const orgTypeDisplay = demoConfig?.orgType
    ? formatOrgType(demoConfig.orgType)
    : getOrgTypeLabel(orgTipo);
  const orgDisplayName = demoConfig?.orgName || user.organizationName;

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <img src={logoNovasilva} alt="Nova Silva" className="h-8 w-8 object-contain" />
          <span className="font-bold text-lg text-sidebar-foreground">Nova Silva</span>
        </div>
        <div className="flex items-center gap-1">
          <ThemeToggle className="text-sidebar-foreground/70 hover:text-sidebar-foreground" />
          <button className="lg:hidden p-1.5 text-sidebar-foreground" onClick={onClose}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/70 truncate">{orgDisplayName}</p>
        <p className="text-sm font-medium text-sidebar-foreground truncate">{demoConfig?.profileLabel || user.name}</p>
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground capitalize">
          {orgTypeDisplay}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navGroups.map((group, i) => (
          <NavGroup
            key={group.label + i}
            group={group}
            onClick={onClose}
            defaultOpen={groupContainsRoute(group, location.pathname)}
          />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      )}
      <aside
        className={cn(
          "fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

// ── HELPERS ──

function getDefaultModulesForRole(role: string): string[] {
  switch (role) {
    case 'cooperativa': return ['Producción', 'Agronomía', 'VITAL', 'EUDR', 'Finanzas', 'Nova Cup'];
    case 'productor': return ['Producción', 'Agronomía', 'VITAL', 'Finanzas', 'Nova Cup'];
    case 'tecnico': return ['Producción', 'Agronomía', 'VITAL'];
    case 'exportador': return ['Orígenes', 'Cumplimiento', 'EUDR', 'Lotes', 'Analítica', 'Nova Cup', 'Finanzas'];
    case 'certificadora': return ['Auditorías', 'Data Room', 'Dossiers'];
    case 'admin': return ['Producción', 'Agronomía', 'VITAL', 'Cumplimiento', 'Finanzas'];
    default: return ['Producción'];
  }
}

function formatOrgType(orgType: string): string {
  const map: Record<string, string> = {
    cooperativa: 'Cooperativa',
    finca_empresarial: 'Finca empresarial',
    exportador: 'Exportador',
    productor_privado: 'Productor privado',
    certificadora: 'Certificadora',
    admin: 'Plataforma',
  };
  return map[orgType] || orgType;
}

export default Sidebar;
