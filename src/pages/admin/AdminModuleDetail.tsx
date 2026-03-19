/**
 * Detalle de módulo - ruta, dataset, hook, componentes, estado.
 */
import { useParams, Link } from 'react-router-dom';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getModuleByKey, STATUS_CONFIG, type ModuleStatus } from '@/config/moduleRegistry';
import { ArrowLeft } from 'lucide-react';

export default function AdminModuleDetail() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const module = moduleId ? getModuleByKey(moduleId) : null;

  if (!module) {
    return (
      <div className="space-y-4">
        <MainHeader title="Módulo no encontrado" />
        <Link to="/admin/modules" className="text-primary hover:underline flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" /> Volver al explorer
        </Link>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[module.status];

  return (
    <div className="space-y-6">
      <MainHeader
        title={module.label}
        subtitle={`Módulo: ${module.key}`}
      />

      <div className="flex gap-2">
        <Link to="/admin/modules" className="text-sm text-primary hover:underline flex items-center gap-1">
          <ArrowLeft className="h-4 w-4" /> Explorer
        </Link>
        <Link to={module.route} className="text-sm text-primary hover:underline flex items-center gap-1">
          Ir a la ruta →
        </Link>
      </div>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Información del módulo</h3>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Ruta</p>
            <p className="font-mono text-sm">{module.route}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Dataset esperado</p>
            <p className="font-mono text-sm">{module.dataset ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Hook de datos</p>
            <p className="font-mono text-sm">{module.hook ?? '—'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Componente UI</p>
            <p className="font-mono text-sm">{module.component}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Estado</p>
            <Badge variant={cfg.variant}>{cfg.label}</Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Listo para cliente</p>
            <p>{module.ready ? '✔ Sí' : '❌ No'}</p>
          </div>
          {module.children && module.children.length > 0 && (
            <div>
              <p className="text-sm text-muted-foreground">Submódulos</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {module.children.map((c) => (
                  <Link key={c} to={`/admin/modules/${c}`}>
                    <Badge variant="outline" className="cursor-pointer hover:bg-muted">
                      {c}
                    </Badge>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="font-semibold">Resumen</h3>
        </CardHeader>
        <CardContent>
          {module.status === 'operativo' && (
            <p className="text-sm text-muted-foreground">
              Este módulo está conectado a datos reales y operativo.
            </p>
          )}
          {module.status === 'fallback' && (
            <p className="text-sm text-muted-foreground">
              Este módulo usa datos demo cuando Supabase devuelve vacío o falla. La UI está lista.
            </p>
          )}
          {module.status === 'sin_datos' && (
            <p className="text-sm text-muted-foreground">
              Este módulo no tiene hook ni dataset conectado. Mostrará "en construcción" al cliente.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
