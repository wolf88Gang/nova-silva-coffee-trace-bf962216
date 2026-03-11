import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ActorProvider } from '@/contexts/ActorContext';
import { Sidebar } from './Sidebar';
import { NotificacionesBell } from './NotificacionesBell';
import { ProfileDropdown } from './ProfileDropdown';
import { ContextualBreadcrumb } from './ContextualBreadcrumb';
import { OfflineSyncBar } from './OfflineSyncBar';
import { UserRole } from '@/types';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import logoNovasilva from '@/assets/logo-novasilva.png';

interface DashboardLayoutProps { children: ReactNode; requiredRole?: UserRole | UserRole[]; }

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <video
          src="/animacion_nova_silva.mp4"
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className="w-32 h-32 object-contain"
          ref={(el) => { if (el) el.playbackRate = 8; }}
        />
        <p className="text-sm text-muted-foreground">Cargando Nova Silva…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : (requiredRole ? [requiredRole] : []);
  const isAllowed = allowedRoles.length === 0 || allowedRoles.includes(user?.role as UserRole) || user?.role === 'admin';

  if (!isAllowed) {
    const redirectMap: Record<string, string> = {
      cooperativa: '/cooperativa/dashboard', exportador: '/exportador/dashboard',
      certificadora: '/certificadora/dashboard', productor: '/productor/dashboard',
      tecnico: '/tecnico/dashboard', admin: '/admin',
    };
    return <Navigate to={redirectMap[user?.role || ''] || '/login'} replace />;
  }

  return (
    <ActorProvider>
      <div className="min-h-screen bg-background">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="lg:ml-64">
          {/* Desktop top bar with contextual breadcrumb */}
          <header className="hidden lg:flex fixed top-0 left-64 right-0 h-14 bg-background/95 backdrop-blur border-b border-border z-30 items-center justify-between px-8">
            <ContextualBreadcrumb />
            <div className="flex items-center gap-3">
              <NotificacionesBell />
              <ProfileDropdown />
            </div>
          </header>
          <div className="hidden lg:block h-14" />

          {/* Mobile top bar */}
          <header className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-background border-b border-border z-30 flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
                <Menu className="h-5 w-5" />
              </Button>
              <img src={logoNovasilva} alt="Nova Silva" className="h-7 w-7 object-contain" />
              <span className="font-semibold text-foreground text-sm">{user?.organizationName || 'Nova Silva'}</span>
            </div>
            <div className="flex items-center gap-2">
              <NotificacionesBell />
              <ProfileDropdown />
            </div>
          </header>
          <div className="lg:hidden h-14" />

          <main className="p-4 md:p-6 lg:p-8 animate-fade-in">
            {children}
          </main>
        </div>

        {/* Offline sync status */}
        <OfflineSyncBar />
      </div>
    </ActorProvider>
  );
}

export default DashboardLayout;
