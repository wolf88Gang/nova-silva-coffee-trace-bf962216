import logoNovasilva from '@/assets/logo-novasilva.png';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/hooks/useOrgContext';
import { getOrgTypeLabel } from '@/lib/org-terminology';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Leaf, X, LayoutDashboard, Users, Package, Building2,
  ShieldCheck, Shield, FileText, Sprout, Settings, Map,
  DollarSign, Bug, AlertTriangle, ChevronDown, TrendingUp,
  Wallet, Eye, FolderOpen, CreditCard, HelpCircle, BookOpen,
  Headphones,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { UserRole } from '@/types';
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
}

// ── FULL DOMAIN SIDEBAR (canonical) ──

const FULL_SIDEBAR: NavGroupDef[] = [
  {
    label: 'Inicio',
    icon: LayoutDashboard,
    standalone: true,
    url: '/dashboard',
    items: [],
  },
  {
    label: 'Producción',
    icon: Sprout,
    items: [
      { title: 'Resumen de producción', url: '/produccion', icon: Sprout },
      { title: 'Productores', url: '/produccion/productores', icon: Users },
      { title: 'Parcelas', url: '/produccion/parcelas', icon: Map },
      { title: 'Cultivos', url: '/produccion/cultivos', icon: Leaf },
      { title: 'Entregas', url: '/produccion/entregas', icon: Package },
      { title: 'Documentos y evidencias', url: '/produccion/documentos', icon: FolderOpen },
    ],
  },
  {
    label: 'Agronomía',
    icon: Leaf,
    items: [
      { title: 'Centro agronómico', url: '/agronomia', icon: Leaf },
      { title: 'Nutrición', url: '/agronomia/nutricion', icon: Sprout },
      { title: 'Nova Guard', url: '/agronomia/guard', icon: Bug },
      { title: 'Nova Yield', url: '/agronomia/yield', icon: TrendingUp },
      { title: 'Recomendaciones y alertas', url: '/agronomia/alertas', icon: AlertTriangle },
    ],
  },
  {
    label: 'Resiliencia',
    icon: Shield,
    items: [
      { title: 'Protocolo VITAL', url: '/resiliencia/vital', icon: Shield },
      { title: 'Resultados por finca', url: '/resiliencia/vital', icon: Map },
      { title: 'Resultados organizacionales', url: '/resiliencia/vital', icon: Building2 },
      { title: 'Brechas y acciones', url: '/resiliencia/vital', icon: AlertTriangle },
    ],
  },
  {
    label: 'Cumplimiento',
    icon: ShieldCheck,
    items: [
      { title: 'Trazabilidad', url: '/cumplimiento/trazabilidad', icon: Eye },
      { title: 'Lotes', url: '/cumplimiento/lotes', icon: Package },
      { title: 'Dossiers EUDR', url: '/cumplimiento/eudr', icon: ShieldCheck },
      { title: 'Data Room', url: '/cumplimiento/data-room', icon: FolderOpen },
      { title: 'Auditorías', url: '/cumplimiento/auditorias', icon: FileText },
    ],
  },
  {
    label: 'Finanzas',
    icon: Wallet,
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
    items: [
      { title: 'Usuarios y roles', url: '/admin/usuarios', icon: Users },
      { title: 'Organización', url: '/admin/organizacion', icon: Building2 },
      { title: 'Configuración', url: '/admin/configuracion', icon: Settings },
      { title: 'Billing', url: '/admin/billing', icon: Wallet },
      { title: 'Logs e integridad', url: '/admin/logs', icon: FileText },
    ],
  },
  {
    label: 'Ayuda',
    icon: HelpCircle,
    items: [
      { title: 'Centro de ayuda', url: '/ayuda', icon: HelpCircle },
      { title: 'Glosario', url: '/ayuda/glosario', icon: BookOpen },
      { title: 'Soporte demo', url: '/ayuda/soporte', icon: Headphones },
    ],
  },
];

// ── ROLE VISIBILITY RULES ──

type VisibilityRule = {
  visibleGroups: string[];
  hiddenItems?: string[];
  renamedItems?: Record<string, string>;
  replacedItems?: Record<string, { title: string; url: string; icon: LucideIcon }[]>;
};

const ROLE_VISIBILITY: Record<string, VisibilityRule> = {
  cooperativa: {
    visibleGroups: ['Inicio', 'Producción', 'Agronomía', 'Resiliencia', 'Cumplimiento', 'Finanzas', 'Administración', 'Ayuda'],
  },
  productor: {
    visibleGroups: ['Inicio', 'Producción', 'Agronomía', 'Resiliencia', 'Finanzas', 'Ayuda'],
    hiddenItems: ['Productores'],
    renamedItems: { 'Resumen de producción': 'Mi producción' },
  },
  tecnico: {
    visibleGroups: ['Inicio', 'Producción', 'Agronomía', 'Resiliencia', 'Ayuda'],
    hiddenItems: ['Facturación', 'Billing', 'Logs e integridad'],
  },
  exportador: {
    visibleGroups: ['Inicio', 'Producción', 'Cumplimiento', 'Finanzas', 'Administración', 'Ayuda'],
    hiddenItems: ['Productores', 'Cultivos'],
    replacedItems: {
      'Producción': [
        { title: 'Orígenes', url: '/produccion', icon: Sprout },
        { title: 'Proveedores', url: '/produccion/productores', icon: Users },
        { title: 'Lotes comerciales', url: '/produccion/entregas', icon: Package },
        { title: 'Evidencias de origen', url: '/produccion/documentos', icon: FolderOpen },
      ],
    },
  },
  certificadora: {
    visibleGroups: ['Inicio', 'Cumplimiento', 'Ayuda'],
    hiddenItems: [],
  },
  admin: {
    visibleGroups: ['Inicio', 'Administración', 'Ayuda'],
    replacedItems: {
      'Administración': [
        { title: 'Organizaciones', url: '/admin/organizacion', icon: Building2 },
        { title: 'Usuarios', url: '/admin/usuarios', icon: Users },
        { title: 'Billing', url: '/admin/billing', icon: Wallet },
        { title: 'Logs e integridad', url: '/admin/logs', icon: FileText },
        { title: 'Configuración', url: '/admin/configuracion', icon: Settings },
      ],
    },
  },
};

function getSidebarForRole(role: UserRole): NavGroupDef[] {
  const rules = ROLE_VISIBILITY[role] || ROLE_VISIBILITY.cooperativa;

  return FULL_SIDEBAR
    .filter(g => rules.visibleGroups.includes(g.label))
    .map(g => {
      // Replace items if needed
      if (rules.replacedItems?.[g.label]) {
        return { ...g, items: rules.replacedItems[g.label] };
      }

      let items = g.items.filter(item => {
        if (rules.hiddenItems?.includes(item.title)) return false;
        return true;
      });

      // Rename items
      if (rules.renamedItems) {
        items = items.map(item => {
          const newName = rules.renamedItems![item.title];
          return newName ? { ...item, title: newName } : item;
        });
      }

      return { ...g, items };
    })
    .filter(g => g.standalone || g.items.length > 0);
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

// ── Check if a group contains the active route ──
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

  const navGroups = getSidebarForRole(user.role);
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
