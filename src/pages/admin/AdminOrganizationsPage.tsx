import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { HealthBadge } from '@/components/admin/HealthBadge';
import { RiskBadge } from '@/components/admin/RiskBadge';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useAdminOrganizations } from '@/hooks/admin/useAdminOrganizations';
import { DegradedModeBanner } from '@/components/admin/DegradedModeBanner';
import { AdminErrorAlert } from '@/components/admin/AdminErrorAlert';
import type { OrgStatus } from '@/types/admin';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, Search } from 'lucide-react';

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

const STATUS_VARIANT: Record<OrgStatus, 'success' | 'warning' | 'danger' | 'neutral'> = {
  activo: 'success',
  en_prueba: 'warning',
  vencido: 'danger',
  suspendido: 'danger',
  cerrado: 'neutral',
};

export default function AdminOrganizationsPage() {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const orgsQuery = useAdminOrganizations({
    type: typeFilter !== 'all' ? typeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });
  const orgResult = orgsQuery.data;
  const organizations = orgResult?.data ?? [];
  const isDegraded = orgResult?.isFallback ?? false;
  const isLoading = orgsQuery.isLoading;
  const hasError = orgsQuery.isError;

  const filtered = organizations.filter((o) => {
    if (typeFilter !== 'all' && o.type !== typeFilter) return false;
    if (statusFilter !== 'all' && o.status !== statusFilter) return false;
    if (search && !o.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <AdminErrorAlert visible={hasError} />
      <DegradedModeBanner visible={isDegraded} />
      <AdminPageHeader
        title="Organizaciones"
        description="Gestión de clientes y suscripciones"
        actions={
          <Button variant="outline" disabled title="Próximamente">
            Nueva organización
          </Button>
        }
      />

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            {Object.entries(ORG_TYPE_LABELS).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="en_prueba">En prueba</SelectItem>
            <SelectItem value="vencido">Vencido</SelectItem>
            <SelectItem value="suspendido">Suspendido</SelectItem>
            <SelectItem value="cerrado">Cerrado</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla */}
      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organización</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Salud</TableHead>
                <TableHead>Riesgo</TableHead>
                <TableHead>Última actividad</TableHead>
                <TableHead>Billing</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((o) => (
                <TableRow key={o.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{o.name}</p>
                      <p className="text-xs text-muted-foreground">{o.country}</p>
                    </div>
                  </TableCell>
                  <TableCell>{ORG_TYPE_LABELS[o.type] ?? o.type}</TableCell>
                  <TableCell>{ORG_PLAN_LABELS[o.plan] ?? o.plan}</TableCell>
                  <TableCell>
                    <StatusBadge label={o.status} variant={STATUS_VARIANT[o.status]} />
                  </TableCell>
                  <TableCell><HealthBadge status={o.healthStatus} /></TableCell>
                  <TableCell><RiskBadge level={o.riskLevel} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {o.lastActivityAt ? format(new Date(o.lastActivityAt), "d MMM yyyy", { locale: es }) : '—'}
                  </TableCell>
                  <TableCell>
                    {o.billingSummary?.saldoPendiente ? (
                      <span className="text-destructive font-medium">${o.billingSummary.saldoPendiente}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" asChild>
                      <Link to={`/admin/organizations/${o.id}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        {!isLoading && filtered.length === 0 && (
          <div className="p-8 text-center text-muted-foreground">No hay organizaciones que coincidan con los filtros.</div>
        )}
      </div>
    </div>
  );
}
