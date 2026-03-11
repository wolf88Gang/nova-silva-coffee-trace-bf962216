/**
 * Contextual breadcrumb header.
 * Shows: [Organización] / [Módulo] / [Entidad]
 * Adapts labels by org type.
 */
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  // Producción
  'productores-hub': 'Actores',
  'parcelas': 'Parcelas',
  'entregas': 'Entregas',
  'acopio': 'Acopio',
  'operaciones': 'Operaciones',
  // Agronomía
  'nutricion': 'Nutrición',
  'calidad': 'Nova Cup',
  'alertas': 'Nova Guard',
  // Resiliencia
  'vital': 'Protocolo VITAL',
  'inclusion': 'Inclusión',
  'sostenibilidad': 'Sostenibilidad',
  // Cumplimiento
  'eudr': 'EUDR',
  // Comercial
  'exportadores': 'Exportadores',
  'ofertas-recibidas': 'Ofertas',
  'cafe': 'Gestión de Café',
  'contratos': 'Contratos',
  'embarques': 'Embarques',
  'clientes': 'Clientes',
  'lotes': 'Lotes',
  'proveedores': 'Proveedores',
  // Finanzas
  'finanzas-hub': 'Finanzas',
  'finanzas': 'Finanzas',
  'creditos': 'Créditos',
  // Comunicación
  'comunicacion': 'Comunicación',
  'mensajes': 'Mensajes',
  'avisos': 'Avisos',
  // Admin
  'dashboard': 'Panel Principal',
  'diagnostico': 'Diagnóstico',
  'usuarios': 'Usuarios',
  'configuracion': 'Configuración',
  'directorio': 'Directorio',
  'catalogos': 'Catálogos',
  // Productor
  'produccion': 'Mi Finca',
  'sanidad': 'Sanidad Vegetal',
  // Técnico
  'agenda': 'Agenda',
  // Certificadora
  'auditorias': 'Auditorías',
  'orgs': 'Organizaciones',
  'verificar': 'Verificaciones',
  'reportes': 'Reportes',
};

const DOMAIN_LABELS: Record<string, string> = {
  'cooperativa': 'Producción',
  'exportador': 'Comercial',
  'productor': 'Mi Finca',
  'tecnico': 'Técnico',
  'certificadora': 'Certificadora',
  'admin': 'Administración',
};

export function ContextualBreadcrumb() {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const orgName = user.organizationName || 'Nova Silva';
  const domain = DOMAIN_LABELS[segments[0]] || segments[0];
  const pageKey = segments[segments.length - 1];
  const pageLabel = ROUTE_LABELS[pageKey] || '';

  const crumbs = [orgName, domain];
  if (pageLabel && pageLabel !== domain) crumbs.push(pageLabel);

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
      {crumbs.map((crumb, i) => (
        <span key={i} className="flex items-center gap-1.5 min-w-0">
          {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
          <span className={i === crumbs.length - 1 ? 'font-medium text-foreground truncate' : 'truncate'}>
            {crumb}
          </span>
        </span>
      ))}
    </div>
  );
}
