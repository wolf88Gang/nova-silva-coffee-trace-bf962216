/**
 * Offline sync status bar.
 * Shows connection state, pending changes count, and last sync time.
 * Always visible at bottom of the app shell.
 */
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export function OfflineSyncBar() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Only show the bar when offline
  if (isOnline) return null;

  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 px-4 py-2 text-xs font-medium transition-all',
        'bg-destructive text-destructive-foreground',
        'lg:left-64' // offset for sidebar
      )}
    >
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Sin conexión</span>
      <span className="text-destructive-foreground/70">
        Los cambios se sincronizarán al reconectarse
      </span>
    </div>
  );
}
