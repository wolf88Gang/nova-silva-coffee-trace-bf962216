import { useEffect, useState } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Theme = 'light' | 'dark' | 'system';

export function ThemeToggle({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem('nova-theme') as Theme) || 'system');
  const [resolved, setResolved] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const root = document.documentElement;
    const effective = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    setResolved(effective);
    effective === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('nova-theme', theme);
  }, [theme]);

  return (
    <Button variant="ghost" size="icon" onClick={() => setTheme(p => p === 'dark' ? 'light' : 'dark')}
      className={`h-9 w-9 text-muted-foreground hover:text-foreground ${className || ''}`}>
      {resolved === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </Button>
  );
}
