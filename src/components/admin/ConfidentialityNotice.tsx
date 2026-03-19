/**
 * Aviso de confidencialidad para el panel admin.
 * Los datos son sensibles; no compartir sin anonimizar.
 * Ver docs/ADMIN_AUDIT_PRIVACY_GUIDE.md
 */

import { ShieldAlert } from 'lucide-react';

interface ConfidentialityNoticeProps {
  /** Si true, muestra un banner más prominente (ej. en Compliance/Auditoría) */
  prominent?: boolean;
}

export function ConfidentialityNotice({ prominent }: ConfidentialityNoticeProps) {
  if (prominent) {
    return (
      <div
        role="status"
        aria-label="Información confidencial"
        className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-sm text-amber-800 dark:text-amber-200"
      >
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>
          <strong>Confidencial.</strong> Esta información es sensible. No compartir capturas ni exports sin anonimizar. Ver guía de auditoría.
        </span>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-label="Información confidencial"
      className="flex items-center gap-2 text-xs text-muted-foreground"
    >
      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
      <span>Datos confidenciales — uso interno únicamente</span>
    </div>
  );
}
