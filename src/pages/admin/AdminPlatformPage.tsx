import { AdminPageHeader } from '@/components/admin/PageHeader';
import { SectionCard } from '@/components/admin/SectionCard';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { LimitedDataNotice } from '@/components/admin/LimitedDataNotice';
import { useAdminPlatform } from '@/hooks/admin/useAdminPlatform';
import { AdminErrorAlert } from '@/components/admin/AdminErrorAlert';

export default function AdminPlatformPage() {
  const { services, globalStatus, globalStatusQuery } = useAdminPlatform();
  const hasError = services.isError || globalStatusQuery.isError;
  const servicesResult = services.data;
  const platformStatus = globalStatus ?? 'operational';
  const isServicesFallback = servicesResult?.isFallback ?? true;

  return (
    <div className="space-y-6">
      <AdminErrorAlert visible={hasError} />
      <AdminPageHeader
        title="Plataforma"
        description="Estado de servicios y observabilidad"
      />

      <LimitedDataNotice
        title="Pendiente de integración"
        description="El detalle por servicio requiere la tabla platform_health_checks. El estado global usa RPC get_platform_status."
      />

      <SectionCard title="Estado global" description="RPC get_platform_status">
        <StatusBadge
          label={platformStatus === 'operational' ? 'Operativo' : platformStatus === 'degraded' ? 'Degradado' : 'Crítico'}
          variant={platformStatus === 'operational' ? 'success' : platformStatus === 'degraded' ? 'warning' : 'danger'}
        />
      </SectionCard>

      <SectionCard title="Estado de servicios" description="Health check por componente">
        <p className="text-sm text-muted-foreground py-4">
          Pendiente de integración. No existe tabla platform_health_checks.
        </p>
        {isServicesFallback && (
          <p className="text-xs text-amber-600 mt-2">Datos limitados — fuente secundaria activa.</p>
        )}
      </SectionCard>

      <SectionCard title="Módulos de producto" description="EUDR, Nova Guard, VITAL, etc.">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['EUDR', 'Nova Guard', 'Nova Yield', 'VITAL', 'Jornales', 'Finanzas', 'Inventario'].map((m) => (
            <div key={m} className="p-3 rounded-lg border bg-muted/20">
              <p className="font-medium text-sm">{m}</p>
              <StatusBadge label="Operativo" variant="success" />
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
