/**
 * Contenedor principal del workspace.
 */
import { ReactNode } from 'react';

interface WorkspaceContentProps {
  children: ReactNode;
  className?: string;
}

export function WorkspaceContent({ children, className }: WorkspaceContentProps) {
  return (
    <div className={className ?? 'p-4 md:p-6 lg:p-8 animate-fade-in'}>
      {children}
    </div>
  );
}
