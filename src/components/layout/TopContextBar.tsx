/**
 * Barra superior de contexto: Entorno → Organización → Perfil.
 */
import { useAuth } from '@/contexts/AuthContext';
import { useDemoContext } from '@/contexts/DemoContext';
import { ChevronRight } from 'lucide-react';

export function TopContextBar() {
  const { user } = useAuth();
  const { org, profile, isDemoSession } = useDemoContext();

  const orgName = isDemoSession ? org?.name : user?.organizationName;
  const profileName = isDemoSession ? profile?.name : user?.name;

  return (
    <div className="h-9 px-4 flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 border-b border-border">
      <span>Entorno</span>
      <ChevronRight className="h-3.5 w-3.5" />
      <span className="font-medium text-foreground">{orgName || '—'}</span>
      <ChevronRight className="h-3.5 w-3.5" />
      <span>{profileName || '—'}</span>
    </div>
  );
}
