import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import logoNovasilva from '@/assets/logo-novasilva.png';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { label: 'Inicio', to: '/' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Soluciones', to: '/soluciones' },
  { label: 'Cumplimiento', to: '/cumplimiento-y-certificaciones' },
  { label: 'Protocolo VITAL', to: '/plan-clima' },
  { label: 'Impacto', to: '/impacto' },
  { label: 'Contacto', to: '/contacto' },
];

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        scrolled
          ? 'bg-background/95 backdrop-blur-md shadow-md border-b border-border'
          : 'bg-transparent'
      )}
    >
      <div className="container mx-auto flex items-center justify-between h-16 md:h-[72px] px-4 lg:px-8">
        {/* Logo */}
        <NavLink to="/" className="flex items-center gap-2.5 shrink-0">
          <img src={logoNovasilva} alt="Nova Silva" className="h-8 w-8 object-contain" />
          <span className={cn(
            'font-bold text-lg transition-colors',
            scrolled ? 'text-foreground' : 'text-white'
          )}>
            Nova Silva
          </span>
        </NavLink>

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => cn(
                'px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive
                  ? 'text-accent font-semibold'
                  : scrolled
                    ? 'text-foreground/70 hover:text-foreground'
                    : 'text-white/80 hover:text-white'
              )}
            >
              {item.label}
            </NavLink>
          ))}
          <NavLink
            to="/contacto#form-contacto-demo"
            className="ml-3 px-5 py-2 rounded-lg bg-accent text-white text-sm font-semibold hover:bg-accent/90 transition-colors shadow-sm"
          >
            Solicitar demo
          </NavLink>
        </nav>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 rounded-md"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen
            ? <X className={cn('h-6 w-6', scrolled ? 'text-foreground' : 'text-white')} />
            : <Menu className={cn('h-6 w-6', scrolled ? 'text-foreground' : 'text-white')} />
          }
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-background/98 backdrop-blur-lg border-b border-border shadow-lg">
          <nav className="container mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn(
                  'px-4 py-3 rounded-md text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'text-foreground/70 hover:bg-muted'
                )}
              >
                {item.label}
              </NavLink>
            ))}
            <NavLink
              to="/contacto#form-contacto-demo"
              className="mt-2 px-4 py-3 rounded-lg bg-accent text-white text-sm font-semibold text-center"
            >
              Solicitar demo
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}
