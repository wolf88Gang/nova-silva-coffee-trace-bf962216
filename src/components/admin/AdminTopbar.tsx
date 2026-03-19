import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { ConfidentialityNotice } from './ConfidentialityNotice';

interface AdminTopbarProps {
  onMenuClick: () => void;
}

export function AdminTopbar({ onMenuClick }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-30 h-14 bg-background border-b border-border flex items-center justify-between px-4">
      <div className="flex items-center">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-2 font-medium text-foreground">Panel de Administración</span>
      </div>
      <div className="hidden sm:block">
        <ConfidentialityNotice />
      </div>
    </header>
  );
}
