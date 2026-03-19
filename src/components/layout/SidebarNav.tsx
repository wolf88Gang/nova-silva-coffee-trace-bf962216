/**
 * Sidebar dinámico por dominios.
 * Visibilidad derivada de orgType, operatingModel, modules y role.
 */
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoContext } from '@/contexts/DemoContext';
import { getDomainNavItems } from '@/config/domainNav';
import logoNovasilva from '@/assets/logo-novasilva.png';
import { ThemeToggle } from '@/components/common/ThemeToggle';
import { NotificacionesBell } from './NotificacionesBell';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { LogOut, ChevronDown, ChevronRight, X } from 'lucide-react';
import type { DomainNavItem } from '@/config/domainNav';

interface SidebarNavProps {
  isOpen: boolean;
  onClose: () => void;
}

function NavItemLink({
  item,
  onClick,
  isChild,
  end,
}: {
  item: { key: string; label: string; url: string; icon: React.ElementType };
  onClick?: () => void;
  isChild?: boolean;
  end?: boolean;
}) {
  const Icon = item.icon;
  return (
    <NavLink
      to={item.url}
      onClick={onClick}
      end={end ?? true}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-md text-sm transition-colors',
          isChild ? 'px-3 py-1.5 ml-6' : 'px-3 py-2',
          isActive
            ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-orange-500/20 font-medium'
            : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )
      }
    >
      <Icon className="h-4 w-4 shrink-0" />
      <span>{item.label}</span>
    </NavLink>
  );
}

const accountNav = [
  { key: 'perfil', label: 'Mi perfil', url: '/mi-perfil' },
  { key: 'plan', label: 'Mi plan', url: '/mi-plan' },
];

export function SidebarNav({ isOpen, onClose }: SidebarNavProps) {
  const { user, logout } = useAuth();
  const { org, profile, isDemoSession, clearDemoSession } = useDemoContext();
  const navigate = useNavigate();
  const [accountOpen, setAccountOpen] = useState(false);

  const defaultModules = [
    { id: 'm1', key: 'produccion', label: 'Producción', active: true },
    { id: 'm2', key: 'abastecimiento', label: 'Abastecimiento', active: true },
    { id: 'm3', key: 'agronomia', label: 'Agronomía', active: true },
    { id: 'm4', key: 'resiliencia', label: 'Resiliencia', active: true },
    { id: 'm5', key: 'cumplimiento', label: 'Cumplimiento', active: true },
    { id: 'm6', key: 'calidad', label: 'Calidad', active: true },
    { id: 'm7', key: 'finanzas', label: 'Finanzas', active: true },
    { id: 'm8', key: 'jornales', label: 'Jornales', active: true },
  ];

  const navInput = isDemoSession && org && profile
    ? {
        orgType: org.orgType,
        operatingModel: org.operatingModel,
        modules: org.modules,
        role: profile.role,
      }
    : {
        orgType: 'cooperativa' as const,
        operatingModel: 'agregacion_cooperativa' as const,
        modules: defaultModules,
        role: (user?.role ?? 'cooperativa') as string,
      };

  const navItems = getDomainNavItems(navInput);

  const handleLogout = async () => {
    clearDemoSession();
    await logout();
    if (user?.id?.startsWith('demo-') || user?.email?.includes('@novasilva.com')) {
      navigate('/demo-v2');
    } else {
      navigate('/login');
    }
  };

  const orgName = isDemoSession ? org?.name : user?.organizationName;
  const profileName = isDemoSession ? profile?.name : user?.name;

  const sidebarContent = (
    <div className="flex flex-col h-full">
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

      <div className="px-4 py-3 border-b border-sidebar-border">
        <p className="text-xs text-sidebar-foreground/70 truncate">{orgName}</p>
        <p className="text-sm font-medium text-sidebar-foreground truncate">{profileName}</p>
        <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-sidebar-accent text-sidebar-accent-foreground capitalize">
          {profile?.role ?? user?.role}
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-1">
        {navItems.map((item) => (
          <div key={item.key}>
            <NavItemLink item={item} onClick={onClose} end={!!item.children?.length} />
            {item.children && item.children.length > 0 && (
              <div className="mt-1 space-y-0.5">
                {item.children.map((child) => (
                  <NavItemLink key={child.key} item={child} onClick={onClose} isChild />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-2">
        <Collapsible open={accountOpen} onOpenChange={setAccountOpen}>
          <CollapsibleTrigger className="flex items-center justify-between w-full px-3 py-2 text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground uppercase tracking-wider text-xs">
            Mi cuenta
            <ChevronDown className={cn('h-4 w-4 transition-transform', accountOpen && 'rotate-180')} />
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-1 mt-1">
            {accountNav.map((item) => (
              <NavLink
                key={item.key}
                to={item.url}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-md text-sm',
                    isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent'
                  )
                }
              >
                <span>{item.label}</span>
              </NavLink>
            ))}
          </CollapsibleContent>
        </Collapsible>
      </div>

      <div className="px-3 py-3 border-t border-sidebar-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 h-screen w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
