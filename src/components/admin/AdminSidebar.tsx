import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Users,
  CreditCard,
  Server,
  ShieldCheck,
  TrendingUp,
  Menu,
  ChevronRight,
  X,
  MessageSquareText,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const ADMIN_NAV = [
  { title: 'Overview', url: '/admin/overview', icon: LayoutDashboard },
  { title: 'Organizaciones', url: '/admin/organizations', icon: Building2 },
  { title: 'Sales Intelligence', url: '/admin/sales', icon: MessageSquareText },
  { title: 'Calibration Review', url: '/admin/sales/calibration', icon: BarChart3 },
  { title: 'Usuarios', url: '/admin/users', icon: Users },
  { title: 'Facturación', url: '/admin/billing', icon: CreditCard },
  { title: 'Plataforma', url: '/admin/platform', icon: Server },
  { title: 'Cumplimiento', url: '/admin/compliance', icon: ShieldCheck },
  { title: 'Growth', url: '/admin/growth', icon: TrendingUp },
];

const LEGACY_NAV = [
  { title: 'Panel Principal', url: '/admin', icon: LayoutDashboard },
  { title: 'Module Explorer', url: '/admin/modules', icon: Menu },
  { title: 'Component Playground', url: '/admin/components', icon: Menu },
  { title: 'Directorio', url: '/admin/directorio', icon: Building2 },
];

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavItem({ item, onClick }: { item: (typeof ADMIN_NAV)[0]; onClick?: () => void }) {
  return (
    <NavLink
      to={item.url}
      onClick={onClick}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
          isActive
            ? 'bg-primary text-primary-foreground font-medium'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
        )
      }
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span>{item.title}</span>
      <ChevronRight className="h-4 w-4 ml-auto opacity-50" />
    </NavLink>
  );
}

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-4 py-4 border-b border-sidebar-border">
            <span className="font-bold text-lg text-sidebar-foreground">Admin Nova Silva</span>
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={onClose}>
              <X className="h-5 w-5" />
            </Button>
          </div>
          <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
            <p className="px-3 py-1 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Control Tower
            </p>
            {ADMIN_NAV.map((item) => (
              <NavItem key={item.url} item={item} onClick={onClose} />
            ))}
            <p className="px-3 py-1 mt-12 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Herramientas
            </p>
            {LEGACY_NAV.map((item) => (
              <NavItem key={item.url} item={item} onClick={onClose} />
            ))}
          </nav>
        </div>
      </aside>
    </>
  );
}
