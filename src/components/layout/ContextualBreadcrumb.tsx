/**
 * Contextual breadcrumb header.
 * Shows: [Organización] / [Módulo] / [Entidad]
 * Each segment is clickable for navigation.
 */
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { getActiveDemoConfig } from '@/hooks/useDemoConfig';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROUTE_LABELS: Record<string, string> = {
  'productores-hub': 'Actores',
  'productores': 'Productores',
  'parcelas': 'Parcelas',
  'entregas': 'Entregas',
  'cultivos': 'Cultivos',
  'documentos': 'Documentos',
  'recepcion': 'Recepción',
  'compras': 'Compras y lotes',
  'evidencias': 'Evidencias',
  'riesgo': 'Riesgo de origen',
  'nutricion': 'Nutrición',
  'calidad': 'Nova Cup',
  'alertas': 'Alertas',
  'guard': 'Nova Guard',
  'yield': 'Nova Yield',
  'vital': 'Protocolo VITAL',
  'inclusion': 'Inclusión',
  'sostenibilidad': 'Sostenibilidad',
  'eudr': 'EUDR',
  'trazabilidad': 'Trazabilidad',
  'lotes': 'Lotes',
  'auditorias': 'Auditorías',
  'data-room': 'Data Room',
  'exportadores': 'Exportadores',
  'ofertas-recibidas': 'Ofertas',
  'cafe': 'Gestión de Café',
  'contratos': 'Contratos',
  'embarques': 'Embarques',
  'clientes': 'Clientes',
  'proveedores': 'Proveedores',
  'finanzas-hub': 'Finanzas',
  'finanzas': 'Finanzas',
  'creditos': 'Créditos',
  'panel': 'Panel financiero',
  'comunicacion': 'Comunicación',
  'mensajes': 'Mensajes',
  'avisos': 'Avisos',
  'dashboard': 'Panel Principal',
  'diagnostico': 'Diagnóstico',
  'usuarios': 'Usuarios',
  'configuracion': 'Configuración',
  'directorio': 'Directorio',
  'catalogos': 'Catálogos',
  'organizacion': 'Organización',
  'produccion': 'Producción',
  'sanidad': 'Sanidad Vegetal',
  'agenda': 'Agenda',
  'orgs': 'Organizaciones',
  'verificar': 'Verificaciones',
  'reportes': 'Reportes',
  'inventario': 'Inventario',
  'origenes': 'Orígenes',
  'analitica': 'Analítica',
  'jornales': 'Jornales',
  'insumos': 'Insumos',
  'catalogo': 'Catálogo',
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
  'insumos': 'Insumos',
  'cooperativa': 'Producción',
  'exportador': 'Comercial',
  'productor': 'Mi Finca',
  'tecnico': 'Técnico',
  'certificadora': 'Certificadora',
};

export function ContextualBreadcrumb() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const demoConfig = getActiveDemoConfig(user);

  if (!user) return null;

  const segments = location.pathname.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const orgName = demoConfig?.orgName || user.organizationName || 'Nova Silva Platform';
  const domain = DOMAIN_LABELS[segments[0]] || segments[0];
  const pageKey = segments[segments.length - 1];
  const pageLabel = ROUTE_LABELS[pageKey] || '';

  // Build crumbs with paths
  interface Crumb { label: string; path: string | null; }
  const crumbs: Crumb[] = [
    { label: orgName, path: '/app' },
    { label: domain, path: '/' + segments[0] },
  ];
  if (pageLabel && pageLabel !== domain) {
    crumbs.push({ label: pageLabel, path: location.pathname });
  }

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground min-w-0">
      {crumbs.map((crumb, i) => {
        const isLast = i === crumbs.length - 1;
        return (
          <span key={i} className="flex items-center gap-1.5 min-w-0">
            {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/50" />}
            {isLast ? (
              <span className="font-medium text-foreground truncate">{crumb.label}</span>
            ) : (
              <button
                onClick={() => crumb.path && navigate(crumb.path)}
                className={cn(
                  'truncate hover:text-foreground hover:underline underline-offset-2 transition-colors cursor-pointer',
                  'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring rounded-sm px-0.5'
                )}
              >
                {crumb.label}
              </button>
            )}
          </span>
        );
      })}
    </div>
  );
}
