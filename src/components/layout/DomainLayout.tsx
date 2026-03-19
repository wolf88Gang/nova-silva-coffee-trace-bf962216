/**
 * Layout para rutas por dominio.
 * Usa AppShell y no requiere role específico (navegación por dominios).
 */
import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppShell } from './AppShell';
import { WorkspaceContent } from './WorkspaceContent';

interface DomainLayoutProps {
  children: ReactNode;
}

export function DomainLayout({ children }: DomainLayoutProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <AppShell>
      <WorkspaceContent>{children}</WorkspaceContent>
    </AppShell>
  );
}
