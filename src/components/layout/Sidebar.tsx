import logoNovasilva from '@/assets/logo-novasilva.png';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/hooks/useOrgContext';
import { getActorsNavLabel, getOrgTypeLabel } from '@/lib/org-terminology';
import { hasAnyModule, type OrgModule } from '@/lib/org-modules';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Leaf, X,
  LayoutDashboard, Users, Package,
  MessageSquare, Building2,
  Calendar, ShieldCheck, Shield, FileText,
  Sprout, Settings, Map, Award, DollarSign,
  Bug, Coffee, AlertTriangle, ChevronDown,
  BarChart3, Boxes, Wallet, TrendingUp,
  Eye, FolderOpen, Briefcase, UserCheck,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { UserRole } from '@/types';
import { useState } from 'react';

interface NavItemDef {
  title: string;
  url: string;
  icon: LucideIcon;
  requiredModule?: OrgModule | OrgModule[];
}

interface NavGroupDef {
  label: string;
  icon: LucideIcon;
  items: NavItemDef[];
  standalone?: boolean;
  url?: string;
  requiredModule?: OrgModule | OrgModule[];
}

// ── NAV DEFINITIONS (by domain, not by actor type) ──

function getCooperativaNav(actorsLabel: string): NavGroupDef[] {
  return [
    {
      label: 'Panel Principal',
      icon: LayoutDashboard,
      standalone: true,
      url: '/cooperativa/dashboard',
      items: [],
    },
    {
      label: 'Producción',
      icon: Sprout,
      items: [
        { title: actorsLabel, url: '/cooperativa/productores-hub', icon: Users, requiredModule: 'productores' },
        { title: 'Parcelas', url: '/parcelas', icon: Map, requiredModule: 'parcelas' },
        { title: 'Entregas', url: '/entregas', icon: Package, requiredModule: 'entregas' },
        { title: 'Acopio', url: '/cooperativa/acopio', icon: Boxes, requiredModule: 'lotes_acopio' },
        { title: 'Jornales', url: '/cooperativa/operaciones', icon: Briefcase, requiredModule: 'jornales' },
      ],
    },
    {
      label: 'Agronomía',
      icon: Leaf,
      items: [
        { title: 'Nutrición', url: '/cooperativa/nutricion', icon: Sprout, requiredModule: 'nutricion' },
        { title: 'Nova Guard', url: '/alertas', icon: AlertTriangle },
        { title: 'Nova Cup', url: '/cooperativa/calidad', icon: Award, requiredModule: 'calidad' },
      ],
    },
    {
      label: 'Resiliencia',
      icon: Shield,
      items: [
        { title: 'Protocolo VITAL', url: '/cooperativa/vital', icon: Shield, requiredModule: 'vital' },
        { title: 'Inclusión y Equidad', url: '/cooperativa/inclusion', icon: UserCheck, requiredModule: 'inclusion' },
      ],
    },
    {
      label: 'Cumplimiento',
      icon: ShieldCheck,
      items: [
        { title: 'Trazabilidad', url: '/cooperativa/operaciones', icon: Eye },
        { title: 'EUDR', url: '/exportador/eudr', icon: ShieldCheck, requiredModule: 'eudr' },
      ],
    },
    {
      label: 'Comercial',
      icon: DollarSign,
      items: [
        { title: 'Exportadores Asociados', url: '/cooperativa/exportadores', icon: Building2 },
        { title: 'Ofertas Recibidas', url: '/cooperativa/ofertas-recibidas', icon: DollarSign },
      ],
    },
    {
      label: 'Finanzas',
      icon: Wallet,
      requiredModule: ['finanzas', 'creditos'],
      items: [
        { title: 'Panel Financiero', url: '/cooperativa/finanzas-hub', icon: DollarSign, requiredModule: 'finanzas' },
      ],
    },
    {
      label: 'Comunicación',
      icon: MessageSquare,
      standalone: true,
      url: '/cooperativa/comunicacion',
      requiredModule: 'mensajes',
      items: [],
    },
    {
      label: 'Reportes',
      icon: FileText,
      standalone: true,
      url: '/reportes',
      items: [],
    },
    {
      label: 'Administración',
      icon: Settings,
      items: [
        { title: 'Usuarios y Permisos', url: '/cooperativa/usuarios', icon: Users },
        { title: 'Diagnóstico Org', url: '/cooperativa/diagnostico', icon: BarChart3 },
      ],
    },
  ];
}

function getProductorNav(): NavGroupDef[] {
  return [
    {
      label: 'Inicio',
      icon: LayoutDashboard,
      standalone: true,
      url: '/productor/dashboard',
      items: [],
    },
    {
      label: 'Mi Finca',
      icon: Sprout,
      items: [
        { title: 'Parcelas', url: '/productor/produccion', icon: Map, requiredModule: 'parcelas' },
        { title: 'Entregas', url: '/productor/entregas', icon: Package },
        { title: 'Documentos', url: '/productor/produccion', icon: FolderOpen },
      ],
    },
    {
      label: 'Agronomía',
      icon: Leaf,
      items: [
        { title: 'Nutrición', url: '/productor/produccion', icon: Sprout, requiredModule: 'nutricion' },
        { title: 'Sanidad Vegetal', url: '/productor/sanidad', icon: Bug },
      ],
    },
    {
      label: 'Resiliencia',
      icon: Shield,
      items: [
        { title: 'Protocolo VITAL', url: '/productor/sostenibilidad', icon: Shield, requiredModule: 'vital' },
      ],
    },
    {
      label: 'Finanzas',
      icon: DollarSign,
      standalone: true,
      url: '/productor/finanzas',
      requiredModule: 'finanzas',
      items: [],
    },
    {
      label: 'Comunidad',
      icon: MessageSquare,
      standalone: true,
      url: '/productor/avisos',
      requiredModule: 'mensajes',
      items: [],
    },
  ];
}

function getTecnicoNav(): NavGroupDef[] {
  return [
    { label: 'Panel Principal', icon: LayoutDashboard, standalone: true, url: '/tecnico/dashboard', items: [] },
    {
      label: 'Producción',
      icon: Sprout,
      items: [
        { title: 'Productoras y productores', url: '/tecnico/productores', icon: Users, requiredModule: 'productores' },
        { title: 'Parcelas y Mapas', url: '/tecnico/parcelas', icon: Map, requiredModule: 'parcelas' },
      ],
    },
    {
      label: 'Agronomía',
      icon: Leaf,
      items: [
        { title: 'Nutrición', url: '/cooperativa/nutricion', icon: Sprout, requiredModule: 'nutricion' },
        { title: 'Nova Guard', url: '/alertas', icon: AlertTriangle },
      ],
    },
    {
      label: 'Resiliencia',
      icon: Shield,
      items: [
        { title: 'Protocolo VITAL', url: '/tecnico/vital', icon: Shield, requiredModule: 'vital' },
      ],
    },
    { label: 'Agenda', icon: Calendar, standalone: true, url: '/tecnico/agenda', items: [] },
  ];
}

function getExportadorNav(actorsLabel: string): NavGroupDef[] {
  return [
    { label: 'Panel Principal', icon: LayoutDashboard, standalone: true, url: '/exportador/dashboard', items: [] },
    {
      label: 'Orígenes',
      icon: Sprout,
      items: [
        { title: actorsLabel, url: '/exportador/proveedores', icon: Users, requiredModule: 'productores' },
        { title: 'Entregas y Acopio', url: '/cooperativa/acopio', icon: Package, requiredModule: ['entregas', 'lotes_acopio'] },
        { title: 'Nova Cup', url: '/exportador/calidad', icon: Award, requiredModule: 'calidad' },
      ],
    },
    {
      label: 'Comercial',
      icon: Coffee,
      items: [
        { title: 'Gestión de Café', url: '/exportador/cafe', icon: Coffee, requiredModule: ['lotes_acopio', 'lotes_comerciales'] },
        { title: 'Lotes Comerciales', url: '/exportador/lotes', icon: Package, requiredModule: 'lotes_comerciales' },
        { title: 'Contratos', url: '/exportador/contratos', icon: FileText, requiredModule: 'contratos' },
        { title: 'Embarques', url: '/exportador/embarques', icon: Package, requiredModule: 'contratos' },
        { title: 'Clientes', url: '/exportador/clientes', icon: Building2, requiredModule: 'contratos' },
      ],
    },
    {
      label: 'Cumplimiento',
      icon: ShieldCheck,
      items: [
        { title: 'EUDR', url: '/exportador/eudr', icon: ShieldCheck, requiredModule: 'eudr' },
        { title: 'Trazabilidad', url: '/exportador/eudr', icon: Eye, requiredModule: 'eudr' },
      ],
    },
    {
      label: 'Analítica',
      icon: BarChart3,
      standalone: true,
      url: '/reportes',
      items: [],
    },
    {
      label: 'Finanzas',
      icon: Wallet,
      standalone: true,
      url: '/cooperativa/finanzas-hub',
      requiredModule: 'finanzas',
      items: [],
    },
    {
      label: 'Administración',
      icon: Settings,
      items: [
        { title: 'Configuración', url: '/exportador/configuracion', icon: Settings },
        { title: 'Mensajes', url: '/exportador/mensajes', icon: MessageSquare, requiredModule: 'mensajes' },
      ],
    },
  ];
}

function getCertificadoraNav(): NavGroupDef[] {
  return [
    { label: 'Panel Principal', icon: LayoutDashboard, standalone: true, url: '/certificadora/dashboard', items: [] },
    {
      label: 'Auditorías',
      icon: ShieldCheck,
      items: [
        { title: 'Sesiones', url: '/certificadora/auditorias', icon: FileText },
        { title: 'Verificaciones', url: '/certificadora/verificar', icon: ShieldCheck },
      ],
    },
    {
      label: 'Data Room',
      icon: FolderOpen,
      items: [
        { title: 'Organizaciones', url: '/certificadora/orgs', icon: Building2 },
        { title: 'Evidencia', url: '/certificadora/reportes', icon: Eye },
      ],
    },
    { label: 'Reportes', icon: FileText, standalone: true, url: '/certificadora/reportes', items: [] },
  ];
}

function getAdminNav(): NavGroupDef[] {
  return [
    { label: 'Panel de Administración', icon: Shield, standalone: true, url: '/admin', items: [] },
    {
      label: 'Plataforma',
      icon: Building2,
      items: [
        { title: 'Organizaciones', url: '/admin/directorio', icon: Building2 },
        { title: 'Catálogos', url: '/admin/catalogos', icon: Sprout },
        { title: 'Usuarios', url: '/admin', icon: Users },
      ],
    },
  ];
}

function getNavGroupsByRole(role: UserRole, orgTipo: string | null | undefined): NavGroupDef[] {
  const actorsLabel = getActorsNavLabel(orgTipo);
  switch (role) {
    case 'cooperativa': return getCooperativaNav(actorsLabel);
    case 'exportador': return getExportadorNav(actorsLabel);
    case 'productor': return getProductorNav();
    case 'tecnico': return getTecnicoNav();
    case 'certificadora': return getCertificadoraNav();
    case 'admin': return getAdminNav();
    default: return [];
  }
}

/** Filter groups and items by active modules */
function filterGroupsByModules(groups: NavGroupDef[], activeModules: OrgModule[], isAdmin: boolean): NavGroupDef[] {
  if (isAdmin) return groups;

  return groups
    .map(group => {
      if (group.requiredModule) {
        const required = Array.isArray(group.requiredModule) ? group.requiredModule : [group.requiredModule];
        if (!hasAnyModule(activeModules, required)) return null;
      }

      if (group.standalone) return group;

      const filteredItems = group.items.filter(item => {
        if (!item.requiredModule) return true;
        const required = Array.isArray(item.requiredModule) ? item.requiredModule : [item.requiredModule];
        return hasAnyModule(activeModules, required);
      });

      if (filteredItems.length === 0) return null;
      return { ...group, items: filteredItems };
    })
    .filter(Boolean) as NavGroupDef[];
}

// ── Check if a group contains the active route ──
function groupContainsRoute(group: NavGroupDef, pathname: string): boolean {
  if (group.standalone && group.url) return pathname.startsWith(group.url);
  return group.items.some(item => pathname.startsWith(item.url));
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
          {group.items.map((item) => (
            <NavItemLink key={item.url + item.title} item={item} onClick={onClick} />
          ))}
        </div>
      )}
    </div>
  );
}

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { orgTipo, activeModules } = useOrgContext();
  const location = useLocation();

  if (!user) return null;

  const rawGroups = getNavGroupsByRole(user.role, orgTipo);
  const navGroups = filterGroupsByModules(rawGroups, activeModules, user.role === 'admin');
  const orgTypeDisplay = getOrgTypeLabel(orgTipo);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Header */}
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

      {/* User info */}
      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/70 truncate">{user.organizationName}</p>
        <p className="text-sm font-medium text-sidebar-foreground truncate">{user.name}</p>
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground capitalize">
          {orgTypeDisplay}
        </span>
      </div>

      {/* Nav */}
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

export default Sidebar;
