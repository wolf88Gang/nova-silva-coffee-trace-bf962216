/**
 * ModuleGuard: wraps a page/route and checks if the required module is active.
 * If the module is not active, shows a user-friendly "module not enabled" screen.
 * Does NOT redirect silently — informs the user.
 *
 * Usage:
 * <ModuleGuard module="vital">
 *   <VitalPage />
 * </ModuleGuard>
 */
import { ReactNode } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { hasModule, type OrgModule } from '@/lib/org-modules';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface ModuleGuardProps {
  /** Required module(s). If array, ANY of them being active passes. */
  module: OrgModule | OrgModule[];
  children: ReactNode;
  /** Optional custom message */
  message?: string;
}

const MODULE_LABELS: Partial<Record<OrgModule, string>> = {
  productores: 'Gestión de Actores',
  parcelas: 'Parcelas y Mapas',
  entregas: 'Entregas',
  lotes_acopio: 'Lotes de Acopio',
  lotes_comerciales: 'Lotes Comerciales',
  contratos: 'Contratos',
  calidad: 'Calidad / Nova Cup',
  vital: 'Protocolo VITAL',
  eudr: 'Cumplimiento EUDR',
  finanzas: 'Finanzas',
  creditos: 'Créditos',
  jornales: 'Jornales',
  inventario: 'Inventario',
  mensajes: 'Mensajes',
  inclusion: 'Inclusión y Equidad',
  admin: 'Administración',
};

export function ModuleGuard({ module, children, message }: ModuleGuardProps) {
  const { activeModules, isLoading, isReady } = useOrgContext();

  if (isLoading || !isReady) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <p className="text-muted-foreground">Cargando…</p>
      </div>
    );
  }

  const requiredModules = Array.isArray(module) ? module : [module];
  const isActive = requiredModules.some(m => hasModule(activeModules, m));

  if (isActive) {
    return <>{children}</>;
  }

  const moduleNames = requiredModules
    .map(m => MODULE_LABELS[m] || m)
    .join(' / ');

  return (
    <div className="min-h-[50vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-6 text-center space-y-4">
          <div className="mx-auto w-14 h-14 rounded-full bg-muted flex items-center justify-center">
            <Lock className="h-7 w-7 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground">
            Módulo no activado
          </h2>
          <p className="text-sm text-muted-foreground">
            {message || `El módulo "${moduleNames}" no está habilitado para tu organización.`}
          </p>
          <p className="text-xs text-muted-foreground">
            Contacta al administrador de tu organización o al equipo de Nova Silva para activar este módulo.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
          >
            Volver
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
