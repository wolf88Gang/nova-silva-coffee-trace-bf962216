/**
 * Señal transversal EUDR para lote/proveedor/parcela.
 */
import { Globe } from 'lucide-react';

interface EudrSignalBadgeProps {
  status?: 'compliant' | 'pending' | 'non_compliant';
  className?: string;
}

export function EudrSignalBadge({ status = 'pending', className }: EudrSignalBadgeProps) {
  const variants = {
    compliant: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    pending: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    non_compliant: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${variants[status]} ${className ?? ''}`}
    >
      <Globe className="h-3 w-3" />
      EUDR
    </span>
  );
}
