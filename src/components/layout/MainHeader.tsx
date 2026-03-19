/**
 * Header principal del workspace con título y acciones.
 */
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainHeaderProps {
  title: string;
  subtitle?: string;
  onMenuClick?: () => void;
  actions?: React.ReactNode;
}

export function MainHeader({ title, subtitle, onMenuClick, actions }: MainHeaderProps) {
  return (
    <header className="flex items-center justify-between gap-4 py-4">
      <div className="flex items-center gap-3">
        {onMenuClick && (
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div>
          <h1 className="text-xl font-semibold text-foreground">{title}</h1>
          {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </header>
  );
}
