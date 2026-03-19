/**
 * Aviso cuando una sección usa datos limitados o está pendiente de integración.
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info } from 'lucide-react';

interface LimitedDataNoticeProps {
  title?: string;
  description?: string;
}

export function LimitedDataNotice({
  title = 'Pendiente de integración',
  description = 'Esta sección mostrará datos reales cuando la integración esté completa.',
}: LimitedDataNoticeProps) {
  return (
    <Alert className="border-muted bg-muted/30">
      <Info className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}
