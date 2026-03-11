import { useAuth } from '@/contexts/AuthContext';
import { useOrgContext } from '@/hooks/useOrgContext';
import { getOrgTypeLabel } from '@/lib/org-terminology';
import { Search, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function TopContextBar() {
  const { user } = useAuth();
  const { orgTipo, orgName } = useOrgContext();
  const isOnline = navigator.onLine;

  if (!user) return null;

  const orgTypeDisplay = getOrgTypeLabel(orgTipo);
  const isDemo = user.email?.includes('demo') || user.email?.includes('novasilva.com');

  const roleLabels: Record<string, string> = {
    cooperativa: 'Gerencia cooperativa',
    tecnico: 'Técnico de campo',
    productor: 'Propietario',
    exportador: 'Gerente de origen',
    certificadora: 'Auditor líder',
    admin: 'Platform Admin',
  };

  return (
    <div className="hidden lg:flex items-center justify-between px-6 py-1.5 bg-muted/50 border-b border-border text-xs">
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
        <span className="text-foreground font-medium">{orgName || 'Nova Silva'}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground capitalize">{orgTypeDisplay}</span>
        <span className="text-muted-foreground">·</span>
        <span className="text-muted-foreground">Perfil: {roleLabels[user.role] || user.role}</span>
      </div>
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center gap-1',
          isOnline ? 'text-success' : 'text-destructive'
        )}>
          {isOnline ? <Wifi className="h-3 w-3" /> : <WifiOff className="h-3 w-3" />}
          <span>{isOnline ? 'Sincronizado' : 'Sin conexión'}</span>
        </div>
      </div>
    </div>
  );
}
