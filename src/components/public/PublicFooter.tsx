import { NavLink } from 'react-router-dom';
import logoNovasilva from '@/assets/logo-novasilva.png';
import { Leaf, Mail, MapPin } from 'lucide-react';

const footerLinks = [
  { label: 'Inicio', to: '/' },
  { label: 'Nosotros', to: '/nosotros' },
  { label: 'Soluciones', to: '/soluciones' },
  { label: 'Cumplimiento EUDR', to: '/cumplimiento-y-certificaciones#eudr' },
  { label: 'Protocolo VITAL', to: '/protocolo-vital' },
  { label: 'Impacto', to: '/impacto' },
  { label: 'Contacto', to: '/contacto' },
];

export function PublicFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="container mx-auto px-4 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <img src={logoNovasilva} alt="Nova Silva" className="h-8 w-8 object-contain" />
              <span className="font-bold text-lg">Nova Silva</span>
            </div>
            <p className="text-sm text-primary-foreground/70 max-w-xs">
              Plataforma agro tecnológica latinoamericana para trazabilidad, cumplimiento normativo y resiliencia climática.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider text-primary-foreground/60">
              Navegación
            </h4>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-colors"
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-4 uppercase tracking-wider text-primary-foreground/60">
              Contacto
            </h4>
            <div className="space-y-3 text-sm text-primary-foreground/70">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:info@novasilva.co" className="hover:text-primary-foreground transition-colors">
                  info@novasilva.co
                </a>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Costa Rica, Centroamérica</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="h-4 w-4 shrink-0" />
                <span>AgTech para cooperativas agrícolas</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-primary-foreground/15 text-center text-xs text-primary-foreground/50">
          &copy; {new Date().getFullYear()} Nova Silva. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
