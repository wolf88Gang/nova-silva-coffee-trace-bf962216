/**
 * Admin Module Explorer - inspección de módulos, rutas y estado de conexión.
 */
import { Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  MODULE_REGISTRY,
  getPageHealthReport,
  STATUS_CONFIG,
  type ModuleStatus,
} from '@/config/moduleRegistry';
import { CheckCircle2, AlertTriangle, XCircle, ChevronRight } from 'lucide-react';

const STATUS_ICONS: Record<ModuleStatus, typeof CheckCircle2> = {
  operativo: CheckCircle2,
  fallback: AlertTriangle,
  sin_datos: XCircle,
};

export default function AdminModuleExplorer() {
  const healthReport = getPageHealthReport();

  return (
    <div className="space-y-6">
      <MainHeader
        title="Module Explorer"
        subtitle="Inspección de módulos, rutas y estado de conexión"
      />

      {/* Health report */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Page Health Report</h3>
          <p className="text-sm text-muted-foreground">
            Estado de rutas, hooks y datasets por dominio
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {healthReport.map(({ domain, modules }) => (
              <div key={domain}>
                <p className="text-sm font-medium text-muted-foreground mb-2 capitalize">{domain}</p>
                <div className="flex flex-wrap gap-2">
                  {modules.map(({ key, status }) => {
                    const cfg = STATUS_CONFIG[status];
                    const Icon = STATUS_ICONS[status];
                    return (
                      <Badge key={key} variant={cfg.variant} className="gap-1">
                        <Icon className="h-3 w-3" />
                        {key}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tabla de módulos */}
      <Card>
        <CardHeader>
          <h3 className="font-semibold">Todos los módulos</h3>
          <p className="text-sm text-muted-foreground">
            Click en un módulo para ver detalle
          </p>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Módulo</th>
                  <th className="text-left p-2">Ruta</th>
                  <th className="text-left p-2">Estado</th>
                  <th className="text-left p-2">Dataset</th>
                  <th className="text-left p-2">Hook</th>
                  <th className="text-left p-2">UI</th>
                  <th className="text-left p-2"></th>
                </tr>
              </thead>
              <tbody>
                {MODULE_REGISTRY.map((m) => {
                  const cfg = STATUS_CONFIG[m.status];
                  const Icon = STATUS_ICONS[m.status];
                  return (
                    <tr key={m.key} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-2 font-medium">{m.label}</td>
                      <td className="p-2 text-muted-foreground font-mono text-xs">{m.route}</td>
                      <td className="p-2">
                        <Badge variant={cfg.variant} className="gap-1">
                          <Icon className="h-3 w-3" />
                          {cfg.label}
                        </Badge>
                      </td>
                      <td className="p-2">{m.dataset ?? '—'}</td>
                      <td className="p-2">{m.hook ?? '—'}</td>
                      <td className="p-2">{m.ready ? '✔' : '❌'}</td>
                      <td className="p-2">
                        <Link
                          to={`/admin/modules/${m.key}`}
                          className="inline-flex items-center gap-1 text-primary hover:underline"
                        >
                          Detalle <ChevronRight className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Links rápidos */}
      <div className="flex gap-2">
        <Link to="/admin/components">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted px-3 py-1">
            Component Playground
          </Badge>
        </Link>
        <Link to="/admin">
          <Badge variant="outline" className="cursor-pointer hover:bg-muted px-3 py-1">
            Volver al panel
          </Badge>
        </Link>
      </div>
    </div>
  );
}
