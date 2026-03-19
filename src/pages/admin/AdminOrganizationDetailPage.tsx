import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { HealthBadge } from '@/components/admin/HealthBadge';
import { RiskBadge } from '@/components/admin/RiskBadge';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { SectionCard } from '@/components/admin/SectionCard';
import { EmptyState } from '@/components/admin/EmptyState';
import { useAdminOrganizationDetail } from '@/hooks/admin/useAdminOrganizationDetail';
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useAdminUpdateOrganizationStatus } from '@/hooks/admin/useAdminUpdateOrganizationStatus';
import { useAdminUpdateOrganizationPlan } from '@/hooks/admin/useAdminUpdateOrganizationPlan';
import { DegradedModeBanner } from '@/components/admin/DegradedModeBanner';
import { AdminErrorAlert } from '@/components/admin/AdminErrorAlert';
import { ArrowLeft, Users, Activity, CreditCard, Shield, Zap } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const ORG_TYPE_LABELS: Record<string, string> = {
  cooperativa: 'Cooperativa',
  exportador: 'Exportador',
  certificadora: 'Certificadora',
  interna: 'Interna',
};

const ORG_PLAN_LABELS: Record<string, string> = {
  lite: 'Lite',
  smart: 'Smart',
  plus: 'Plus',
  none: 'Sin plan',
};

export default function AdminOrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [confirmAction, setConfirmAction] = useState<'suspend' | 'reactivate' | 'plan' | null>(null);
  const [planToSet, setPlanToSet] = useState<string | null>(null);

  const orgQuery = useAdminOrganizationDetail(id);
  const usersQuery = useAdminUsers(id ? { organizationId: id } : undefined, { enabled: !!id });
  const orgResult = orgQuery.data;
  const org = orgResult?.data ?? null;
  const isDegraded = orgResult?.isFallback ?? false;
  const users = usersQuery.data?.data ?? [];
  const updateStatus = useAdminUpdateOrganizationStatus(id);
  const updatePlan = useAdminUpdateOrganizationPlan(id);

  const handleConfirmSuspend = () => {
    updateStatus.mutate('suspendido');
    setConfirmAction(null);
  };
  const handleConfirmReactivate = () => {
    updateStatus.mutate('activo');
    setConfirmAction(null);
  };
  const handleConfirmPlan = () => {
    if (planToSet) updatePlan.mutate(planToSet as 'lite' | 'smart' | 'plus' | 'none');
    setConfirmAction(null);
    setPlanToSet(null);
  };

  if (!id) return <div>ID no válido</div>;
  if (orgQuery.isLoading) return <div className="p-8 text-center">Cargando…</div>;
  if (orgQuery.isError) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/organizations"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <AdminErrorAlert visible title="Error al cargar organización" />
      </div>
    );
  }
  if (!org) return <div className="p-8 text-center">Organización no encontrada</div>;

  return (
    <div className="space-y-6">
      <AdminErrorAlert visible={usersQuery.isError} description="Error al cargar usuarios de la organización." />
      <DegradedModeBanner visible={isDegraded} />
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/admin/organizations">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <AdminPageHeader
          title={org.name}
          description={`${ORG_TYPE_LABELS[org.type]} · ${org.country}`}
          actions={
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={updatePlan.isPending}>
                    {updatePlan.isPending ? '…' : 'Cambiar plan'}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {(['lite', 'smart', 'plus', 'none'] as const).map((p) => (
                    <DropdownMenuItem
                      key={p}
                      onClick={() => { setPlanToSet(p); setConfirmAction('plan'); }}
                      disabled={org.plan === p}
                    >
                      {ORG_PLAN_LABELS[p]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin/billing">Registrar pago</Link>
              </Button>
              {org.status !== 'suspendido' ? (
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={updateStatus.isPending}
                  onClick={() => setConfirmAction('suspend')}
                >
                  {updateStatus.isPending ? '…' : 'Suspender'}
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  disabled={updateStatus.isPending}
                  onClick={() => setConfirmAction('reactivate')}
                >
                  {updateStatus.isPending ? '…' : 'Reactivar'}
                </Button>
              )}
            </div>
          }
        />
      </div>

      {/* Header badges */}
      <div className="flex flex-wrap gap-2">
        <StatusBadge label={org.status} variant={org.status === 'activo' ? 'success' : org.status === 'vencido' ? 'danger' : 'warning'} />
        <HealthBadge status={org.healthStatus} />
        <RiskBadge level={org.riskLevel} />
        <span className="text-sm text-muted-foreground px-2 py-1 rounded bg-muted">
          {ORG_PLAN_LABELS[org.plan]} · {org.billingCycle}
        </span>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList>
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios</TabsTrigger>
          <TabsTrigger value="uso">Uso</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="licencias">Licencias</TabsTrigger>
          <TabsTrigger value="riesgo">Riesgo y cumplimiento</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-4 space-y-4">
          <SectionCard title="Metadatos" description="Información general">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Owner</dt>
              <dd>{org.ownerName} — {org.ownerEmail}</dd>
              <dt className="text-muted-foreground">Creado</dt>
              <dd>{format(new Date(org.createdAt), "d MMMM yyyy", { locale: es })}</dd>
              <dt className="text-muted-foreground">Última actividad</dt>
              <dd>{org.lastActivityAt ? format(new Date(org.lastActivityAt), "d MMM yyyy HH:mm", { locale: es }) : '—'}</dd>
              <dt className="text-muted-foreground">Módulos activos</dt>
              <dd>{org.modulesActive.join(', ') || '—'}</dd>
            </dl>
          </SectionCard>
        </TabsContent>

        <TabsContent value="usuarios" className="mt-4">
          <SectionCard title="Usuarios" description={`${users.length} usuarios en la organización`}>
            {users.length === 0 ? (
              <EmptyState icon={Users} title="Sin usuarios" description="No hay usuarios registrados." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Rol</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Último acceso</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-medium">{u.fullName}</TableCell>
                      <TableCell>{u.email}</TableCell>
                      <TableCell>{u.role}</TableCell>
                      <TableCell>{u.status}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {u.lastLoginAt ? format(new Date(u.lastLoginAt), "d MMM yyyy", { locale: es }) : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="uso" className="mt-4">
          <SectionCard title="Uso" description="Métricas según tipo de organización">
            {org.usageSummary && Object.keys(org.usageSummary).length > 0 ? (
              <dl className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(org.usageSummary).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-lg bg-muted/30">
                    <dt className="text-xs text-muted-foreground uppercase">{k}</dt>
                    <dd className="text-2xl font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <EmptyState icon={Activity} title="Sin datos de uso" description="El uso se mostrará cuando haya actividad." />
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="facturacion" className="mt-4">
          <SectionCard title="Facturación" description="Plan y estado de pago">
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <dt className="text-muted-foreground">Plan</dt>
              <dd>{ORG_PLAN_LABELS[org.plan]}</dd>
              <dt className="text-muted-foreground">Ciclo</dt>
              <dd>{org.billingCycle}</dd>
              <dt className="text-muted-foreground">Saldo pendiente</dt>
              <dd className={org.billingSummary?.saldoPendiente ? 'text-destructive font-medium' : ''}>
                ${org.billingSummary?.saldoPendiente ?? 0}
              </dd>
              <dt className="text-muted-foreground">Próxima factura</dt>
              <dd>{org.billingSummary?.proximaFactura ?? '—'}</dd>
            </dl>
          </SectionCard>
        </TabsContent>

        <TabsContent value="licencias" className="mt-4">
          <SectionCard title="Licencias y trial" description="Estado de prueba o licencia">
            <p className="text-sm text-muted-foreground">
              {org.status === 'en_prueba' ? 'Trial activo. Ver fecha de expiración en facturación.' : 'Cuenta con licencia activa.'}
            </p>
          </SectionCard>
        </TabsContent>

        <TabsContent value="riesgo" className="mt-4">
          <SectionCard title="Riesgo y cumplimiento" description="Incidentes e inconsistencias">
            {org.riskLevel === 'high' ? (
              <p className="text-sm text-destructive">Organización con riesgo alto. Revisar mora o incumplimientos.</p>
            ) : (
              <p className="text-sm text-muted-foreground">Sin incidentes abiertos.</p>
            )}
          </SectionCard>
        </TabsContent>
      </Tabs>

      <AlertDialog open={confirmAction === 'suspend'} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Suspender cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              La organización {org.name} perderá acceso. Esta acción puede revertirse reactivando la cuenta.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmSuspend} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Suspender
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'reactivate'} onOpenChange={(o) => !o && setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Reactivar cuenta?</AlertDialogTitle>
            <AlertDialogDescription>
              La organización {org.name} recuperará el acceso a la plataforma.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmReactivate}>Reactivar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmAction === 'plan'} onOpenChange={(o) => !o && (setConfirmAction(null), setPlanToSet(null))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cambiar plan?</AlertDialogTitle>
            <AlertDialogDescription>
              Cambiar el plan de {org.name} a {planToSet ? ORG_PLAN_LABELS[planToSet] : ''}. Esto afectará la facturación.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmPlan}>Confirmar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
