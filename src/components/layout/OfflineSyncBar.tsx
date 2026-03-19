/**
 * Barra de estado offline/sync (placeholder para futuro).
 */
import { WifiOff, Cloud } from 'lucide-react';
import { useState } from 'react';

export function OfflineSyncBar() {
  const [isOnline] = useState(() => typeof navigator !== 'undefined' && navigator.onLine);

  if (isOnline) return null;

  return (
    <div className="h-8 px-4 flex items-center justify-center gap-2 text-xs bg-amber-500/10 text-amber-700 dark:text-amber-400 border-t border-amber-500/20">
      <WifiOff className="h-3.5 w-3.5" />
      <span>Sin conexión. Los cambios se sincronizarán al reconectar.</span>
    </div>
  );
}
