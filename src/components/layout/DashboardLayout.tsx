import { ReactNode, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from './Sidebar';
import { UserRole } from '@/types';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DashboardLayoutProps { children: ReactNode; requiredRole?: UserRole | UserRole[]; }

export function DashboardLayout({ children, requiredRole }: DashboardLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando…</p>
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
    <div className="min-h-screen bg-background">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="lg:ml-64">
        <header className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-semibold text-foreground">Nova Silva</span>
        </header>
        <main className="p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
