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
  LayoutDashboard, Users, Package, Settings, Truck,
  Coffee, DollarSign, Megaphone, Award, HeartHandshake,
  Stethoscope, Sprout, MessageSquare, Building2, MapPin,
  CalendarCheck, Search, ClipboardList
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';
import { UserRole } from '@/types';

interface NavItemDef { title: string; url: string; icon: LucideIcon; }

const cooperativaNav: NavItemDef[] = [
  { title: 'Panel Principal', url: '/cooperativa/dashboard', icon: LayoutDashboard },
  { title: 'Productoras/es', url: '/cooperativa/productores-hub', icon: Users },
  { title: 'Acopio y Comercial', url: '/cooperativa/acopio', icon: Package },
  { title: 'Operaciones', url: '/cooperativa/operaciones', icon: Settings },
  { title: 'Finanzas', url: '/cooperativa/finanzas-hub', icon: DollarSign },
  { title: 'Comunicación', url: '/cooperativa/comunicacion', icon: Megaphone },
  { title: 'Nova Cup', url: '/cooperativa/calidad', icon: Coffee },
  { title: 'Protocolo VITAL', url: '/cooperativa/vital', icon: HeartHandshake },
  { title: 'Inclusión y Equidad', url: '/cooperativa/inclusion', icon: Award },
  { title: 'Usuarios y Permisos', url: '/cooperativa/usuarios', icon: Users },
];

const exportadorNav: NavItemDef[] = [
  { title: 'Panel Principal', url: '/exportador/dashboard', icon: LayoutDashboard },
  { title: 'Gestión de Café', url: '/exportador/cafe', icon: Coffee },
  { title: 'Red de Proveedores', url: '/exportador/socios', icon: Building2 },
  { title: 'Gestión Comercial', url: '/exportador/comercial', icon: Truck },
  { title: 'Nova Cup', url: '/exportador/calidad', icon: Coffee },
  { title: 'Administración', url: '/exportador/admin', icon: Settings },
  { title: 'Mensajes', url: '/exportador/mensajes', icon: MessageSquare },
];

const productorNav: NavItemDef[] = [
  { title: 'Panel Principal', url: '/productor/dashboard', icon: LayoutDashboard },
  { title: 'Producción', url: '/productor/produccion', icon: Sprout },
  { title: 'Sanidad Vegetal', url: '/productor/sanidad', icon: Stethoscope },
  { title: 'Finanzas', url: '/productor/finanzas-hub', icon: DollarSign },
  { title: 'Sostenibilidad', url: '/productor/sostenibilidad', icon: Sprout },
  { title: 'Comunidad', url: '/productor/comunidad', icon: Users },
];

const tecnicoNav: NavItemDef[] = [
  { title: 'Panel Principal', url: '/tecnico/dashboard', icon: LayoutDashboard },
  { title: 'Plan de Visitas', url: '/tecnico/visitas', icon: CalendarCheck },
  { title: 'Diagnósticos', url: '/tecnico/diagnosticos', icon: Search },
  { title: 'Áreas Productivas', url: '/tecnico/productores', icon: MapPin },
  { title: 'Protocolo VITAL', url: '/tecnico/vital', icon: HeartHandshake },
];

const certificadoraNav: NavItemDef[] = [
  { title: 'Panel de Auditoría', url: '/certificadora/dashboard', icon: LayoutDashboard },
];

const adminNav: NavItemDef[] = [
  { title: 'Panel Admin', url: '/admin', icon: LayoutDashboard },
  { title: 'Directorio Clientes', url: '/admin/directorio', icon: Building2 },
  { title: 'Platform Admin', url: '/admin/platform', icon: Settings },
  { title: 'Architect View', url: '/admin/architect', icon: ClipboardList },
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
  { title: 'Mi plan', url: '/mi-plan', icon: DollarSign },
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
        <div className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 z-40 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

export default Sidebar;
