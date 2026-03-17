import logoNovasilva from '@/assets/logo-novasilva.png';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/hooks/useOrgContext';
import { getActiveDemoConfig } from '@/hooks/useDemoConfig';
import { getOrgTypeLabel } from '@/lib/org-terminology';
import { getOperatingModel, getVisibilityPolicy } from '@/lib/operatingModel';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { cn } from '@/lib/utils';
import {
  Leaf, X, LayoutDashboard, Users, Package, Building2,
  ShieldCheck, Shield, FileText, Sprout, Settings, Map,
  DollarSign, Bug, AlertTriangle, ChevronDown, TrendingUp, Database, Cloud,
  Wallet, Eye, FolderOpen, CreditCard,
  Award, Briefcase, Coffee, BarChart3, Truck, Cloud,
  Boxes, ShoppingCart,
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { useState, useRef } from 'react';

interface NavItemDef { title: string; url: string; icon: LucideIcon; }
interface NavGroupDef { label: string; icon: LucideIcon; items: NavItemDef[]; standalone?: boolean; url?: string; }

/**
 * Build sidebar navigation groups from the visibility policy.
 * This is the ONLY place that decides what goes in the sidebar.
 */
function getNavGroups(orgType: string, role: string): NavGroupDef[] {
  // ── Platform admin: stripped-down sidebar ──
  if (role === 'admin') {
    return [
      { label: 'Overview', icon: LayoutDashboard, standalone: true, url: '/admin', items: [] },
      { label: 'Organizaciones', icon: Building2, standalone: true, url: '/admin/organizaciones', items: [] },
      { label: 'Usuarios', icon: Users, standalone: true, url: '/admin/usuarios', items: [] },
      { label: 'Billing', icon: CreditCard, standalone: true, url: '/admin/billing', items: [] },
      { label: 'Plataforma', icon: Cloud, standalone: true, url: '/admin/sistema', items: [] },
      { label: 'Cumplimiento', icon: Shield, standalone: true, url: '/admin/cumplimiento', items: [] },
      { label: 'Growth', icon: TrendingUp, standalone: true, url: '/admin/growth', items: [] },
    ];
  }

  const model = getOperatingModel(orgType);
  const v = getVisibilityPolicy(model);
  const groups: NavGroupDef[] = [];

  // ── Inicio ──
  const homeUrl = v.canSeeOrigins ? '/origenes'
    : model === 'auditor' ? '/cumplimiento'
    : '/produccion';
  groups.push({ label: 'Inicio', icon: LayoutDashboard, standalone: true, url: homeUrl, items: [] });

  // ── Producción ──
  if (v.canSeeProductionSummary || v.canSeePlots || v.canSeeCrops) {
    const items: NavItemDef[] = [];
    if (v.canSeeProductionSummary) items.push({ title: 'Resumen', url: '/produccion', icon: Sprout });
    if (v.canSeeProducers) items.push({ title: 'Productores', url: '/produccion/productores', icon: Users });
    if (v.canSeePlots) items.push({ title: 'Parcelas', url: '/produccion/parcelas', icon: Map });
    if (v.canSeeCrops) items.push({ title: 'Cultivos', url: '/produccion/cultivos', icon: Leaf });
    if (v.canSeeDeliveries) items.push({ title: 'Entregas', url: '/produccion/entregas', icon: Package });
    if (v.canSeeDocuments) items.push({ title: 'Documentos', url: '/produccion/documentos', icon: FolderOpen });
    groups.push({ label: 'Producción', icon: Sprout, items });
  }

  // ── Abastecimiento café ──
  if (v.canSeeCoffeeSuppliers || v.canSeeReception || v.canSeePurchases) {
    const items: NavItemDef[] = [];
    if (v.canSeeReception) items.push({ title: 'Recepción de café', url: '/abastecimiento/recepcion', icon: Package });
    if (v.canSeePurchases) items.push({ title: 'Compras y lotes', url: '/abastecimiento/compras', icon: FileText });
    if (v.canSeeSupplierEvidence) items.push({ title: 'Evidencias proveedor', url: '/abastecimiento/evidencias', icon: FolderOpen });
    if (v.canSeeOriginRisk) items.push({ title: 'Riesgo de origen', url: '/abastecimiento/riesgo', icon: AlertTriangle });
    if (items.length > 0) groups.push({ label: 'Abastecimiento café', icon: Truck, items });
  }

  // ── Insumos ──
  if (v.canSeeInputSuppliers || v.canSeeInputCatalog || v.canSeeInventory) {
    const items: NavItemDef[] = [];
    if (v.canSeeInputSuppliers) items.push({ title: 'Proveedores insumos', url: '/insumos/proveedores', icon: ShoppingCart });
    if (v.canSeeInputCatalog) items.push({ title: 'Catálogo', url: '/insumos/catalogo', icon: Boxes });
    if (v.canSeeInventory) items.push({ title: 'Inventario', url: '/operaciones/inventario', icon: Package });
    groups.push({ label: 'Insumos', icon: Boxes, items });
  }

  // ── Orígenes (trader) ──
  if (v.canSeeOrigins) {
    groups.push({ label: 'Orígenes', icon: Map, standalone: true, url: '/origenes', items: [] });
  }

  // ── Agronomía ──
  if (v.canSeeAgronomy) {
    groups.push({ label: 'Agronomía', icon: Leaf, items: [
      { title: 'Centro agronómico', url: '/agronomia', icon: Leaf },
      { title: 'Nutrición', url: '/agronomia/nutricion', icon: Sprout },
      { title: 'Nova Guard', url: '/agronomia/guard', icon: Bug },
      { title: 'Nova Yield', url: '/agronomia/yield', icon: TrendingUp },
      { title: 'Alertas', url: '/agronomia/alertas', icon: AlertTriangle },
    ]});
  }

  // ── Analítica (trader) ──
  if (v.canSeeAnalytics) {
    groups.push({ label: 'Analítica', icon: BarChart3, standalone: true, url: '/analitica', items: [] });
  }

  // ── Jornales ──
  if (v.canSeeLabor) {
    groups.push({ label: 'Jornales', icon: Briefcase, standalone: true, url: '/jornales', items: [] });
  }

  // ── Resiliencia ──
  if (v.canSeeVital) {
    const items: NavItemDef[] = [];
    items.push({ title: 'Protocolo VITAL', url: '/resiliencia/vital', icon: Shield });
    groups.push({ label: 'Resiliencia', icon: Shield, items });
  }

  // ── Cumplimiento ──
  if (v.canSeeTraceability || v.canSeeEudr || v.canSeeAudits) {
    const items: NavItemDef[] = [];
    if (v.canSeeTraceability) items.push({ title: 'Trazabilidad', url: '/cumplimiento/trazabilidad', icon: Eye });
    if (v.canSeeLots) items.push({ title: 'Lotes', url: '/cumplimiento/lotes', icon: Package });
    if (v.canSeeEudr) items.push({ title: 'Dossiers EUDR', url: '/cumplimiento/eudr', icon: ShieldCheck });
    if (v.canSeeDataRoom) items.push({ title: 'Data Room', url: '/cumplimiento/data-room', icon: FolderOpen });
    if (v.canSeeAudits) items.push({ title: 'Auditorías', url: '/cumplimiento/auditorias', icon: FileText });
    groups.push({ label: 'Cumplimiento', icon: ShieldCheck, items });
  }

  // ── Calidad ──
  if (v.canSeeNovaCup) {
    groups.push({ label: 'Calidad', icon: Award, items: [
      { title: 'Nova Cup', url: '/calidad', icon: Award },
      { title: 'Resultados por lote', url: '/calidad/lotes', icon: Coffee },
      { title: 'Tendencias', url: '/calidad/tendencias', icon: TrendingUp },
    ]});
  }

  // ── Comercial ──
  if (v.canSeeCommercial) {
    groups.push({ label: 'Comercial', icon: Coffee, items: [
      { title: 'Lotes comerciales', url: '/comercial/lotes', icon: Package },
      { title: 'Contratos', url: '/comercial/contratos', icon: FileText },
    ]});
  }

  // ── Finanzas ──
  if (v.canSeeFarmCosts || v.canSeeCoffeePurchases || v.canSeeIncome) {
    const items: NavItemDef[] = [];
    if (v.canSeeFarmCosts) items.push({ title: 'Costos finca', url: '/finanzas/panel', icon: DollarSign });
    if (v.canSeeCoffeePurchases) items.push({ title: 'Compras café', url: '/finanzas/creditos', icon: CreditCard });
    if (v.canSeeIncome) items.push({ title: 'Ingresos', url: '/finanzas/ingresos', icon: Wallet });
    groups.push({ label: 'Finanzas', icon: Wallet, items });
  }

  // ── Administración ──
  if (['cooperativa', 'exportador'].includes(role) || model === 'estate' || model === 'estate_hybrid' || model === 'aggregator') {
    groups.push({ label: 'Administración', icon: Settings, items: [
      { title: 'Usuarios y roles', url: '/admin/usuarios', icon: Users },
      { title: 'Organización', url: '/admin/organizacion', icon: Building2 },
    ]});
  }

  return groups;
}

// ── COMPONENTS ──

function NavItemLink({ item, onClick }: { item: NavItemDef; onClick?: () => void }) {
  return (
    <NavLink to={item.url} end onClick={onClick}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-1.5 rounded-md text-sm transition-colors',
        isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}>
      <item.icon className="h-3.5 w-3.5 shrink-0" />
      <span>{item.title}</span>
    </NavLink>
  );
}

function NavGroup({ group, onClick, isOpen, onToggle }: { group: NavGroupDef; onClick?: () => void; isOpen: boolean; onToggle: () => void }) {
  if (group.standalone && group.url) {
    return (
      <NavLink to={group.url} end onClick={onClick}
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
      <button onClick={onToggle}
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
  return group.items.some(item => pathname === item.url || pathname.startsWith(item.url + '/'));
}

/** Accordion-style nav: only one group open at a time */
function SidebarNav({ groups, pathname, onItemClick }: { groups: NavGroupDef[]; pathname: string; onItemClick?: () => void }) {
  // Find which group contains the active route
  const activeIndex = groups.findIndex(g => groupContainsRoute(g, pathname));
  const [openIndex, setOpenIndex] = useState<number | null>(activeIndex >= 0 ? activeIndex : null);

  // Update open group when route changes
  const prevPathRef = useRef(pathname);
  if (prevPathRef.current !== pathname) {
    prevPathRef.current = pathname;
    const newActive = groups.findIndex(g => groupContainsRoute(g, pathname));
    if (newActive >= 0 && newActive !== openIndex) {
      setOpenIndex(newActive);
    }
  }

  return (
    <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
      {groups.map((group, i) => (
        <NavGroup
          key={group.label + i}
          group={group}
          onClick={onItemClick}
          isOpen={openIndex === i}
          onToggle={() => setOpenIndex(openIndex === i ? null : i)}
        />
      ))}
    </nav>
  );
}

// ── SIDEBAR ──

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user } = useAuth();
  const { orgTipo } = useOrgContext();
  const location = useLocation();

  if (!user) return null;

  const demoConfig = getActiveDemoConfig(user);
  const effectiveOrgType = demoConfig?.orgType || orgTipo || (user.role === 'admin' ? 'admin' : 'cooperativa');
  const navGroups = getNavGroups(effectiveOrgType, user.role);
  const orgTypeDisplay = demoConfig?.orgType ? formatOrgType(demoConfig.orgType) : getOrgTypeLabel(user.role === 'admin' ? 'admin' : orgTipo);
  const orgDisplayName = demoConfig?.orgName || user.organizationName || 'Nova Silva Platform';

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

      <SidebarNav groups={navGroups} pathname={location.pathname} onItemClick={onClose} />
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
