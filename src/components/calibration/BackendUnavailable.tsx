/**
 * Honest state when backend tables aren't available yet.
 */
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Database } from 'lucide-react';
import type { BackendStatus } from '@/hooks/useCalibrationData';

interface Props {
  status: BackendStatus;
  table?: string;
  message?: string;
}

export function BackendUnavailable({ status, table, message }: Props) {
  if (status === 'available') return null;

  return (
    <Card className="border-dashed border-muted-foreground/20">
      <CardContent className="py-8 flex flex-col items-center text-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
          <Database className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium text-foreground">
            {status === 'error' ? 'Error al consultar datos' : 'Backend no disponible'}
          </p>
          <p className="text-xs text-muted-foreground mt-1 max-w-md">
            {message ?? (
              status === 'error'
                ? 'No se pudieron cargar los datos de calibración. Verificar permisos y conectividad.'
                : `La tabla ${table ? `"${table}"` : 'requerida'} no existe o no es accesible. El módulo de Sales Intelligence debe estar desplegado en el backend para visualizar datos reales.`
            )}
          </p>
        </div>
        <Badge variant="outline" className="text-xs border-dashed border-muted-foreground/30 text-muted-foreground">
          {status === 'error' ? 'Error de conexión' : 'Pendiente de despliegue'}
        </Badge>
      </CardContent>
    </Card>
  );
}
