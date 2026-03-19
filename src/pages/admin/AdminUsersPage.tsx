import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/PageHeader';
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
import { useAdminUsers } from '@/hooks/admin/useAdminUsers';
import { useAdminOrganizations } from '@/hooks/admin/useAdminOrganizations';
import { DegradedModeBanner } from '@/components/admin/DegradedModeBanner';
import { AdminErrorAlert } from '@/components/admin/AdminErrorAlert';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Search, UserPlus } from 'lucide-react';

export default function AdminUsersPage() {
  const [orgFilter, setOrgFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  const usersQuery = useAdminUsers();
  const orgsQuery = useAdminOrganizations();
  const usersResult = usersQuery.data;
  const orgsResult = orgsQuery.data;
  const users = usersResult?.data ?? [];
  const organizations = orgsResult?.data ?? [];
  const isLoading = usersQuery.isLoading;
  const isDegraded = !!(usersResult?.isFallback || orgsResult?.isFallback);
  const hasError = usersQuery.isError || orgsQuery.isError;

  const filtered = users.filter((u) => {
    if (orgFilter !== 'all' && u.organizationId !== orgFilter) return false;
    if (statusFilter !== 'all' && u.status !== statusFilter) return false;
    if (search && !u.fullName.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <AdminErrorAlert visible={hasError} />
      <DegradedModeBanner visible={isDegraded} />
      <AdminPageHeader
        title="Usuarios"
        description="Gestión global de usuarios y roles"
        actions={<Button><UserPlus className="h-4 w-4 mr-1" /> Invitar usuario</Button>}
      />

      <div className="flex flex-wrap gap-3">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nombre o email..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={orgFilter} onValueChange={setOrgFilter}>
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Organización" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            {organizations.map((o) => (
              <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Activo</SelectItem>
            <SelectItem value="invited">Invitado</SelectItem>
            <SelectItem value="suspended">Suspendido</SelectItem>
            <SelectItem value="inactive">Inactivo</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        {isLoading ? (
          <div className="p-8 text-center text-muted-foreground">Cargando…</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Organización</TableHead>
                <TableHead>Rol</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último acceso</TableHead>
                <TableHead>Creado</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className="font-medium">{u.fullName}</TableCell>
                  <TableCell>{u.email}</TableCell>
                  <TableCell className="text-muted-foreground">{u.organizationName}</TableCell>
                  <TableCell>{u.role}</TableCell>
                  <TableCell><StatusBadge label={u.status} variant={u.status === 'active' ? 'success' : u.status === 'suspended' ? 'danger' : 'neutral'} /></TableCell>
                  <TableCell className="text-muted-foreground text-sm">{u.lastLoginAt ? format(new Date(u.lastLoginAt), "d MMM yyyy", { locale: es }) : '—'}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {u.createdAt ? format(new Date(u.createdAt), "d MMM yyyy", { locale: es }) : '—'}
                  </TableCell>
                  <TableCell><Button variant="ghost" size="sm">Ver</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
