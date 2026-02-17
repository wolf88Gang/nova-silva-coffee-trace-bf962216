import { ReactNode, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ShieldX } from 'lucide-react';

export function RequireAdmin({ children }: { children: ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [showDenied, setShowDenied] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated && user?.role !== 'admin') {
      setShowDenied(true);
      const t = setTimeout(() => setShowDenied(false), 2500);
      return () => clearTimeout(t);
    }
  }, [isLoading, isAuthenticated, user]);

  if (isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  if (user?.role !== 'admin') {
    if (showDenied) return <div className="min-h-screen flex items-center justify-center"><ShieldX className="h-8 w-8 text-destructive mr-2" /><span className="text-lg">Acceso restringido</span></div>;
    const map: Record<string, string> = { cooperativa: '/cooperativa/dashboard', exportador: '/exportador/dashboard', productor: '/productor/dashboard', tecnico: '/tecnico/dashboard', certificadora: '/certificadora/dashboard' };
    return <Navigate to={map[user?.role || ''] || '/login'} replace />;
  }
  return <>{children}</>;
}
