import { useAuth } from '@/contexts/AuthContext';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopContextBar() {
  const { user } = useAuth();
  const isOnline = navigator.onLine;

  if (!user) return null;

  const demoConfig = getDemoConfig();
  const isDemo = !!demoConfig || user.email?.includes('demo') || user.email?.includes('novasilva.com');

  const orgName = demoConfig?.orgName || user.organizationName || 'Nova Silva';
  const orgType = demoConfig?.orgType
    ? formatOrgType(demoConfig.orgType)
    : user.orgTipo || '';
  const profileLabel = demoConfig?.profileLabel || user.name;

  return (
    <div className="hidden lg:flex items-center justify-between px-6 py-1.5 bg-muted/50 border-b border-border text-xs fixed top-0 left-64 right-0 z-40">
      <div className="flex items-center gap-3">
        {isDemo && (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/15 text-accent font-semibold">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-accent" />
            </span>
            Demo
          </span>
        )}
        <span className="text-foreground font-medium">{orgName}</span>
        {orgType && (
          <>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground capitalize">{orgType}</span>
          </>
        )}
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">Perfil: {profileLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center gap-1',
          isOnline ? 'text-primary' : 'text-destructive'
        )}>
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{isOnline ? 'Sincronizado' : 'Sin conexión'}</span>
        </div>
      </div>
    </div>
  );
}

function formatOrgType(orgType: string): string {
  const map: Record<string, string> = {
    cooperativa: 'Cooperativa',
    finca_empresarial: 'Finca empresarial',
    exportador: 'Exportador',
    productor_privado: 'Productor privado',
    certificadora: 'Certificadora',
  };
  return map[orgType] || orgType;
}
