import { type ReactNode } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import { hasModule, type OrgModule } from '@/lib/org-modules';

interface ModuleGuardProps {
  module: OrgModule;
  children: ReactNode;
  fallback?: ReactNode;
}

export function ModuleGuard({ module, children, fallback = null }: ModuleGuardProps) {
  const { activeModules, isReady } = useOrgContext();
  if (!isReady) return null;
  if (!hasModule(activeModules, module)) return <>{fallback}</>;
  return <>{children}</>;
}
