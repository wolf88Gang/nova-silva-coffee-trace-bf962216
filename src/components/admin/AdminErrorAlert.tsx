/**
 * Alerta de error para rutas admin.
 * Visible cuando una query falla (producción: sin fallback mock).
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CircleAlert } from 'lucide-react';

interface AdminErrorAlertProps {
  visible: boolean;
  title?: string;
  description?: string;
}

export function AdminErrorAlert({
  visible,
  title = 'Error al cargar datos',
  description = 'Verifique permisos y conectividad.',
}: AdminErrorAlertProps) {
  if (!visible) return null;

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
      <CircleAlert className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
