/**
 * Contextual breadcrumb header.
 * Shows: [Organización] / [Módulo] / [Entidad]
 * Uses demo config when active to stay in sync with selected tenant.
 */
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getDemoConfig } from '@/hooks/useDemoConfig';
import { ChevronRight } from 'lucide-react';

const ROUTE_LABELS: Record<string, string> = {
  // Producción
  'productores-hub': 'Actores',
  'productores': 'Productores',
  'parcelas': 'Parcelas',
  'entregas': 'Entregas',
  'cultivos': 'Cultivos',
  'documentos': 'Documentos',
  // Abastecimiento
  'recepcion': 'Recepción',
  'compras': 'Compras y lotes',
  'evidencias': 'Evidencias',
  'riesgo': 'Riesgo de origen',
  // Agronomía
  'nutricion': 'Nutrición',
  'calidad': 'Nova Cup',
  'alertas': 'Alertas',
  'guard': 'Nova Guard',
  'yield': 'Nova Yield',
  // Resiliencia
  'vital': 'Protocolo VITAL',
  'inclusion': 'Inclusión',
  'sostenibilidad': 'Sostenibilidad',
  // Cumplimiento
  'eudr': 'EUDR',
  'trazabilidad': 'Trazabilidad',
  'lotes': 'Lotes',
  'auditorias': 'Auditorías',
  'data-room': 'Data Room',
  // Comercial
  'exportadores': 'Exportadores',
  'ofertas-recibidas': 'Ofertas',
  'cafe': 'Gestión de Café',
  'contratos': 'Contratos',
  'embarques': 'Embarques',
  'clientes': 'Clientes',
  'proveedores': 'Proveedores',
  // Finanzas
  'finanzas-hub': 'Finanzas',
  'finanzas': 'Finanzas',
  'creditos': 'Créditos',
  'panel': 'Panel financiero',
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
  'organizacion': 'Organización',
  // Productor
  'produccion': 'Producción',
  'sanidad': 'Sanidad Vegetal',
  // Técnico
  'agenda': 'Agenda',
  // Certificadora
  'orgs': 'Organizaciones',
  'verificar': 'Verificaciones',
  'reportes': 'Reportes',
  // Operaciones
  'inventario': 'Inventario',
  // Otros
  'origenes': 'Orígenes',
  'analitica': 'Analítica',
  'jornales': 'Jornales',
};

const DOMAIN_LABELS: Record<string, string> = {
  'produccion': 'Producción',
  'abastecimiento': 'Abastecimiento',
  'agronomia': 'Agronomía',
  'cumplimiento': 'Cumplimiento',
  'comercial': 'Comercial',
  'finanzas': 'Finanzas',
  'resiliencia': 'Resiliencia',
  'operaciones': 'Operaciones',
  'origenes': 'Orígenes',
  'analitica': 'Analítica',
  'jornales': 'Jornales',
  'calidad': 'Calidad',
  'admin': 'Administración',
  'ayuda': 'Ayuda',
  // Legacy role-based routes
  'cooperativa': 'Producción',
  'exportador': 'Comercial',
  'productor': 'Mi Finca',
  'tecnico': 'Técnico',
  'certificadora': 'Certificadora',
};

export function ContextualBreadcrumb() {
  const { user } = useAuth();
  const location = useLocation();
  const demoConfig = getDemoConfig();

  if (!user) return null;

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  // Use demo config org name when available for consistency
  const orgName = demoConfig?.orgName || user.organizationName || 'Nova Silva';
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
