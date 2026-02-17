import { useState } from 'react';
import logoNovasilva from '@/assets/logo-novasilva.png';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificacionesBell } from './NotificacionesBell';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Leaf, LogOut, ChevronDown, X,
  LayoutDashboard, Users, Package, Boxes, Wallet,
  Coffee, MessageSquare, Building2, MapPin,
  Calendar, ShieldCheck, Shield, Ship, FileText,
  ClipboardList, Stethoscope, Sprout, Bell, Truck,
  Settings, CheckCircle, Award, Map
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { UserRole } from '@/types';

interface NavItemDef { title: string; url: string; icon: LucideIcon; }

// ── PRODUCTOR (Banco §1) ──
const productorNav: NavItemDef[] = [
  { title: 'Panel principal', url: '/productor/dashboard', icon: LayoutDashboard },
  { title: 'Mi Finca', url: '/productor/finca', icon: MapPin },
  { title: 'Entregas', url: '/productor/entregas', icon: Truck },
  { title: 'Créditos', url: '/productor/creditos', icon: Wallet },
  { title: 'Protocolo VITAL', url: '/productor/vital', icon: Leaf },
  { title: 'Avisos', url: '/productor/avisos', icon: Bell },
];

// ── TÉCNICO (Banco §2) ──
const tecnicoNav: NavItemDef[] = [
  { title: 'Panel principal', url: '/tecnico/dashboard', icon: LayoutDashboard },
  { title: 'Productores', url: '/tecnico/productores', icon: Users },
  { title: 'Protocolo VITAL', url: '/tecnico/vital', icon: Leaf },
  { title: 'Parcelas', url: '/tecnico/parcelas', icon: Map },
  { title: 'Agenda', url: '/tecnico/agenda', icon: Calendar },
];

// ── COOPERATIVA (Banco §3) ──
const cooperativaNav: NavItemDef[] = [
  { title: 'Panel principal', url: '/cooperativa/dashboard', icon: LayoutDashboard },
  { title: 'Productores', url: '/cooperativa/productores', icon: Users },
  { title: 'Lotes de Acopio', url: '/cooperativa/lotes-acopio', icon: Package },
  { title: 'Operaciones Hub', url: '/cooperativa/operaciones', icon: Boxes },
  { title: 'Créditos', url: '/cooperativa/creditos', icon: Wallet },
  { title: 'Protocolo VITAL', url: '/cooperativa/vital', icon: Leaf },
  { title: 'Exportadores', url: '/cooperativa/exportadores', icon: Ship },
  { title: 'Avisos', url: '/cooperativa/avisos', icon: Bell },
  { title: 'Configuración', url: '/cooperativa/configuracion', icon: Settings },
];

// ── EXPORTADOR (Banco §4) ──
const exportadorNav: NavItemDef[] = [
  { title: 'Panel principal', url: '/exportador/dashboard', icon: LayoutDashboard },
  { title: 'Proveedores', url: '/exportador/proveedores', icon: Users },
  { title: 'Lotes Comerciales', url: '/exportador/lotes', icon: Package },
  { title: 'Contratos', url: '/exportador/contratos', icon: FileText },
  { title: 'EUDR', url: '/exportador/eudr', icon: ShieldCheck },
  { title: 'Embarques', url: '/exportador/embarques', icon: Ship },
  { title: 'Clientes', url: '/exportador/clientes', icon: Building2 },
  { title: 'Calidad', url: '/exportador/calidad', icon: Award },
  { title: 'Configuración', url: '/exportador/configuracion', icon: Settings },
];

// ── CERTIFICADORA (Banco §5) ──
const certificadoraNav: NavItemDef[] = [
  { title: 'Panel principal', url: '/certificadora/dashboard', icon: LayoutDashboard },
  { title: 'Auditorías', url: '/certificadora/auditorias', icon: ClipboardList },
  { title: 'Organizaciones', url: '/certificadora/orgs', icon: Building2 },
  { title: 'Verificaciones', url: '/certificadora/verificar', icon: CheckCircle },
  { title: 'Reportes', url: '/certificadora/reportes', icon: FileText },
  { title: 'Configuración', url: '/certificadora/config', icon: Settings },
];

// ── ADMIN ──
const adminNav: NavItemDef[] = [
  { title: 'Panel de Administración', url: '/admin', icon: Shield },
  { title: 'Directorio de clientes', url: '/admin/directorio', icon: Building2 },
  { title: 'Platform Admin', url: '/admin/platform', icon: Building2 },
  { title: 'Architect View', url: '/admin/architect', icon: Shield },
];

const NAV_BY_ROLE: Record<UserRole, NavItemDef[]> = {
  cooperativa: cooperativaNav,
  exportador: exportadorNav,
  productor: productorNav,
  tecnico: tecnicoNav,
  certificadora: certificadoraNav,
  admin: adminNav,
};

const accountNav: NavItemDef[] = [
  { title: 'Mi perfil', url: '/mi-perfil', icon: Users },
  { title: 'Mi plan', url: '/mi-plan', icon: Wallet },
  { title: 'Directorio', url: '/directorio/cooperativas', icon: Building2 },
  { title: 'Acerca de', url: '/acerca', icon: Leaf },
];

function NavItemLink({ item, onClick }: { item: NavItemDef; onClick?: () => void }) {
  return (
    <NavLink
      to={item.url}
      onClick={onClick}
      className={({ isActive }) => cn(
        'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
        isActive
          ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-orange-500/20 font-medium'
          : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
      )}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.title}</span>
    </NavLink>
  );
}

interface SidebarProps { isOpen: boolean; onClose: () => void; }

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);

  if (!user) return null;

  const navItems = NAV_BY_ROLE[user.role] ?? [];

  const handleLogout = async () => {
    await logout();
    if (user.id.startsWith('demo-')) {
      navigate('/demo');
    } else {
      navigate('/login');
    }
  };

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
          <NotificacionesBell />
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
          {user.role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => (
          <NavItemLink key={item.url} item={item} onClick={onClose} />
        ))}
      </nav>

      {/* Account section */}
      <div className="border-t border-sidebar-border px-3 py-2">
        <Collapsible open={accountOpen} onOpenChange={setAccountOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground">
            Mi cuenta
            <ChevronDown className={cn("h-4 w-4 transition-transform", accountOpen && "rotate-180")} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {accountNav.map((item) => (
              <NavItemLink key={item.url} item={item} onClick={onClose} />
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      {/* Logout */}
      <div className="px-3 py-3 border-t border-sidebar-border">
        <Button variant="ghost" className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent" onClick={handleLogout}>
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Sidebar */}
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
