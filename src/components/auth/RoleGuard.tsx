/**
 * RoleGuard: controls visibility of UI elements based on user role.
 * Does NOT replace RLS — this is a UX improvement only.
 *
 * Usage:
 * <RoleGuard allow={['admin','cooperativa']}>
 *   <Button>Nuevo Socio</Button>
 * </RoleGuard>
 *
 * Or as a page guard:
 * <RoleGuard allow={['admin']} showDenied>
 *   <AdminContent />
 * </RoleGuard>
 */
import { ReactNode } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface RoleGuardProps {
  /** Roles that are allowed to see children */
  allow: string[];
  children: ReactNode;
  /** If true, shows a "denied" card instead of hiding. Default: hides silently. */
  showDenied?: boolean;
  /** Custom denied message */
  message?: string;
}

export function RoleGuard({ allow, children, showDenied = false, message }: RoleGuardProps) {
  const { role, isLoading, isReady } = useOrgContext();

  if (isLoading || !isReady) {
    if (showDenied) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center">
          <p className="text-muted-foreground">Cargando…</p>
        </div>
      );
    }
    return null;
  }

  const isAllowed = allow.includes(role ?? '');

  if (isAllowed) return <>{children}</>;

  if (!showDenied) return null;

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <ShieldX className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">Acceso restringido</h2>
          <p className="text-sm text-muted-foreground">
            {message || 'No tienes permisos para acceder a esta sección.'}
          </p>
          <Button variant="outline" size="sm" onClick={() => window.history.back()}>
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
