import logoNovasilva from '@/assets/logo-novasilva.png';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/hooks/useOrgContext';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { getOrgTypeLabel } from '@/lib/org-terminology';
import { getOperatingModel, showsProductores, showsAbastecimiento, showsJornales, showsInventario, showsAgronomia, showsComercial, showsCumplimiento, showsOrigenes, showsAnalitica } from '@/lib/operatingModel';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Leaf, X, LayoutDashboard, Users, Package, Building2,
  ShieldCheck, Shield, FileText, Sprout, Settings, Map,
  DollarSign, Bug, AlertTriangle, ChevronDown, TrendingUp,
  Wallet, Eye, FolderOpen, CreditCard, HelpCircle,
  Award, Briefcase, Coffee, BarChart3, Truck,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useState } from 'react';

interface NavItemDef { title: string; url: string; icon: LucideIcon; }
interface NavGroupDef { label: string; icon: LucideIcon; items: NavItemDef[]; standalone?: boolean; url?: string; }

function getNavGroups(orgType: string, role: string): NavGroupDef[] {
  const model = getOperatingModel(orgType);
  const groups: NavGroupDef[] = [];

  // Inicio
  const homeUrl = model === 'trader' ? '/origenes' : model === 'auditor' ? '/cumplimiento' : '/produccion';
  groups.push({ label: 'Inicio', icon: LayoutDashboard, standalone: true, url: homeUrl, items: [] });

  // Producción (not for trader/auditor)
  if (model !== 'trader' && model !== 'auditor') {
    const prodItems: NavItemDef[] = [
      { title: 'Resumen', url: '/produccion', icon: Sprout },
    ];
    if (showsProductores(model)) prodItems.push({ title: 'Productores', url: '/produccion/productores', icon: Users });
    prodItems.push({ title: 'Parcelas', url: '/produccion/parcelas', icon: Map });
    prodItems.push({ title: 'Cultivos', url: '/produccion/cultivos', icon: Leaf });
    if (model !== 'single_farm') prodItems.push({ title: 'Entregas', url: '/produccion/entregas', icon: Package });
    prodItems.push({ title: 'Documentos', url: '/produccion/documentos', icon: FolderOpen });
    groups.push({ label: 'Producción', icon: Sprout, items: prodItems });
  }

  // Abastecimiento
  if (showsAbastecimiento(model)) {
    const abasItems: NavItemDef[] = [
      { title: 'Recepción de café', url: '/abastecimiento/recepcion', icon: Package },
      { title: 'Compras y lotes', url: '/abastecimiento/compras', icon: FileText },
    ];
    if (model === 'aggregator' || model === 'trader') {
      abasItems.push({ title: 'Evidencias proveedor', url: '/abastecimiento/evidencias', icon: FolderOpen });
      abasItems.push({ title: 'Riesgo de origen', url: '/abastecimiento/riesgo', icon: AlertTriangle });
    }
    groups.push({ label: 'Abastecimiento', icon: Truck, items: abasItems });
  }

  // Orígenes (trader only)
  if (showsOrigenes(model)) {
    groups.push({ label: 'Orígenes', icon: Map, standalone: true, url: '/origenes', items: [] });
  }

  // Agronomía
  if (showsAgronomia(model)) {
    groups.push({ label: 'Agronomía', icon: Leaf, items: [
      { title: 'Centro agronómico', url: '/agronomia', icon: Leaf },
      { title: 'Nutrición', url: '/agronomia/nutricion', icon: Sprout },
      { title: 'Nova Guard', url: '/agronomia/guard', icon: Bug },
      { title: 'Nova Yield', url: '/agronomia/yield', icon: TrendingUp },
      { title: 'Alertas', url: '/agronomia/alertas', icon: AlertTriangle },
    ]});
  }

  // Analítica (trader only)
  if (showsAnalitica(model)) {
    groups.push({ label: 'Analítica', icon: BarChart3, standalone: true, url: '/analitica', items: [] });
  }

  // Jornales
  if (showsJornales(model)) {
    groups.push({ label: 'Jornales', icon: Briefcase, standalone: true, url: '/jornales', items: [] });
  }

  // Inventario
  if (showsInventario(model)) {
    groups.push({ label: 'Inventario', icon: Package, standalone: true, url: '/operaciones/inventario', items: [] });
  }

  // Resiliencia (not trader/auditor)
  if (model !== 'trader' && model !== 'auditor') {
    groups.push({ label: 'Resiliencia', icon: Shield, standalone: true, url: '/resiliencia/vital', items: [] });
  }

  // Cumplimiento
  if (showsCumplimiento(model)) {
    const cumpItems: NavItemDef[] = [
      { title: 'Trazabilidad', url: '/cumplimiento/trazabilidad', icon: Eye },
      { title: 'Lotes', url: '/cumplimiento/lotes', icon: Package },
      { title: 'Dossiers EUDR', url: '/cumplimiento/eudr', icon: ShieldCheck },
    ];
    if (model === 'trader' || model === 'auditor') {
      cumpItems.push({ title: 'Data Room', url: '/cumplimiento/data-room', icon: FolderOpen });
    }
    cumpItems.push({ title: 'Auditorías', url: '/cumplimiento/auditorias', icon: FileText });
    groups.push({ label: 'Cumplimiento', icon: ShieldCheck, items: cumpItems });
  }

  // Calidad
  if (model !== 'auditor') {
    groups.push({ label: 'Calidad', icon: Award, standalone: true, url: '/calidad', items: [] });
  }

  // Comercial
  if (showsComercial(model)) {
    groups.push({ label: 'Comercial', icon: Coffee, items: [
      { title: 'Lotes comerciales', url: '/comercial/lotes', icon: Package },
      { title: 'Contratos', url: '/comercial/contratos', icon: FileText },
    ]});
  }

  // Finanzas (not auditor)
  if (model !== 'auditor') {
    groups.push({ label: 'Finanzas', icon: Wallet, items: [
      { title: 'Panel financiero', url: '/finanzas/panel', icon: DollarSign },
      { title: 'Créditos', url: '/finanzas/creditos', icon: CreditCard },
    ]});
  }

  // Administración
  if (['cooperativa', 'admin', 'exportador'].includes(role) || model === 'estate' || model === 'aggregator') {
    groups.push({ label: 'Administración', icon: Settings, items: [
      { title: 'Usuarios y roles', url: '/admin/usuarios', icon: Users },
      { title: 'Organización', url: '/admin/organizacion', icon: Building2 },
    ]});
  }

  // Ayuda
  groups.push({ label: 'Ayuda', icon: HelpCircle, standalone: true, url: '/ayuda', items: [] });

  return groups;
}

// ── COMPONENTS ──

function NavItemLink({ item, onClick }: { item: NavItemDef; onClick?: () => void }) {
  return (
    <NavLink to={item.url} onClick={onClick}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors',
        isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}>
      <item.icon className="h-3.5 w-3.5 shrink-0" />
      <span>{item.title}</span>
    </NavLink>
  );
}

function NavGroup({ group, onClick, defaultOpen }: { group: NavGroupDef; onClick?: () => void; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen ?? false);

  if (group.standalone && group.url) {
    return (
      <NavLink to={group.url} onClick={onClick}
        className={({ isActive }) => cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}>
        <group.icon className="h-4 w-4 shrink-0" />
        <span>{group.label}</span>
      </NavLink>
    );
  }

  return (
    <div className="space-y-0.5">
      <button onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50 hover:text-sidebar-foreground/70 transition-colors">
        <div className="flex items-center gap-2"><group.icon className="h-3.5 w-3.5" /><span>{group.label}</span></div>
        <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen ? '' : '-rotate-90')} />
      </button>
      {isOpen && (
        <div className="space-y-0.5 pl-1">
          {group.items.map(item => <NavItemLink key={item.url + item.title} item={item} onClick={onClick} />)}
        </div>
      )}
    </div>
  );
}

function groupContainsRoute(group: NavGroupDef, pathname: string): boolean {
  if (group.standalone && group.url) return pathname === group.url || pathname.startsWith(group.url + '/');
  return group.items.some(item => pathname.startsWith(item.url));
}

// ── SIDEBAR ──

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { orgTipo } = useOrgContext();
  const location = useLocation();

  if (!user) return null;

  const demoConfig = getDemoConfig();
  const effectiveOrgType = demoConfig?.orgType || orgTipo || 'cooperativa';
  const navGroups = getNavGroups(effectiveOrgType, user.role);
  const orgTypeDisplay = demoConfig?.orgType ? formatOrgType(demoConfig.orgType) : getOrgTypeLabel(orgTipo);
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
          <button className="lg:hidden p-1.5 text-sidebar-foreground" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/70 truncate">{orgDisplayName}</p>
        <p className="text-sm font-medium text-sidebar-foreground truncate">{demoConfig?.profileLabel || user.name}</p>
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground capitalize">{orgTypeDisplay}</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navGroups.map((group, i) => (
          <NavGroup key={group.label + i} group={group} onClick={onClose} defaultOpen={groupContainsRoute(group, location.pathname)} />
        ))}
      </nav>
    </div>
  );

  return (
    <>
      {isOpen && <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />}
      <aside className={cn(
        "fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {sidebarContent}
      </aside>
    </>
  );
}

function formatOrgType(orgType: string): string {
  const map: Record<string, string> = {
    cooperativa: 'Cooperativa', finca_empresarial: 'Finca empresarial',
    exportador: 'Exportador', productor_privado: 'Productor privado',
    certificadora: 'Certificadora', admin: 'Plataforma',
  };
  return map[orgType] || orgType;
}

export default Sidebar;
