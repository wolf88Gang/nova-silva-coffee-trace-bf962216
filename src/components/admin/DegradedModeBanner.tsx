/**
 * Banner visible cuando la ruta usa fallback o fuente secundaria.
 * No presentar datos mock como si fueran productivos.
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface DegradedModeBannerProps {
  visible: boolean;
}

export function DegradedModeBanner({ visible }: DegradedModeBannerProps) {
  if (!visible) return null;

  return (
    <Alert variant="destructive" className="border-amber-500 bg-amber-500/10">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Datos no verificados</AlertTitle>
      <AlertDescription>
        Fuente secundaria o fallback activo. Los datos mostrados pueden no reflejar el estado real.
      </AlertDescription>
    </Alert>
  );
}
