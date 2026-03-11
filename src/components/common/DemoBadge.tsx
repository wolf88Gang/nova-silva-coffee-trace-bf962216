import { getDemoConfig } from '@/hooks/useDemoConfig';
import { Info } from 'lucide-react';

export function DemoBadge() {
  const cfg = getDemoConfig();
  if (!cfg) return null;
  return (
    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-warning/10 border border-warning/20 text-warning text-xs font-medium">
      <Info className="h-3 w-3" />
      Datos ficticios de demostración
    </div>
  );
}
