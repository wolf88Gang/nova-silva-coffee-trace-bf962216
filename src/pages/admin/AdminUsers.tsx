/**
 * Admin Users — Real Supabase data (profiles + user_roles + organizacion_usuarios).
 */
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  RefreshCw, Users, Shield, UserX, UserPlus,
  ChevronRight, Mail, Calendar, Building2, Eye, X,
} from 'lucide-react';
import {
  SearchInput, SectionHeader, EmptyState, StatusBadge, ErrorState, DataSourceBadge,
} from '@/components/admin/shared/AdminComponents';
import { useAdminUserList, type AdminUserRow } from '@/hooks/useAdminDataAdapters';

function UserDetailPanel({ user, onClose }: { user: AdminUserRow; onClose: () => void }) {
  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-md bg-card border-l border-border z-50 shadow-xl animate-slide-in-right overflow-y-auto">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-semibold text-foreground">Detalle de usuario</h3>
        <Button variant="ghost" size="icon" onClick={onClose}><X className="h-4 w-4" /></Button>
      </div>
      <div className="p-5 space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-3">
            <Users className="h-7 w-7 text-primary" />
          </div>
          <p className="text-lg font-bold text-foreground">{user.name ?? 'Sin nombre'}</p>
          <p className="text-sm text-muted-foreground">{user.email ?? 'Sin email'}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Organización</span>
            <span className="text-sm font-medium text-foreground">{user.org_nombre ?? 'Sin organización'}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Rol global</span>
            <Badge variant="secondary" className="capitalize">{user.role_global ?? 'Sin rol'}</Badge>
          </div>
          {user.rol_interno && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Rol interno</span>
              <Badge variant="outline" className="capitalize">{user.rol_interno.replace('_', ' ')}</Badge>
            </div>
          )}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Estado</span>
            <StatusBadge status={user.activo ? 'ok' : 'error'} label={user.activo ? 'Activo' : 'Inactivo'} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> User ID</span>
            <span className="text-xs text-foreground font-mono">{user.user_id.slice(0, 16)}...</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button variant="outline" size="sm" className="w-full gap-1.5"><Shield className="h-3.5 w-3.5" /> Cambiar rol</Button>
          <Button variant="outline" size="sm" className="w-full gap-1.5"><Mail className="h-3.5 w-3.5" /> Resetear acceso</Button>
          <Button variant="outline" size="sm" className="w-full gap-1.5"><Building2 className="h-3.5 w-3.5" /> Mover a otra organización</Button>
          <Button variant="outline" size="sm" className="w-full gap-1.5 text-destructive hover:text-destructive border-destructive/30"><UserX className="h-3.5 w-3.5" /> Desactivar usuario</Button>
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { data: users, isLoading, isError, error, refetch } = useAdminUserList();
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null);

  const allUsers = users ?? [];
  const uniqueOrgs = [...new Set(allUsers.map(u => u.org_nombre).filter(Boolean))];
  const uniqueRoles = [...new Set(allUsers.map(u => u.role_global).filter(Boolean))];

  const filtered = allUsers
    .filter(u => filterOrg === 'all' || u.org_nombre === filterOrg)
    .filter(u => filterRole === 'all' || u.role_global === filterRole)
    .filter(u => filterStatus === 'all' || (filterStatus === 'active' ? u.activo : !u.activo))
    .filter(u =>
      (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.email ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (u.org_nombre ?? '').toLowerCase().includes(search.toLowerCase())
    );

  const roleBadge = (role: string | null) => {
    if (role === 'admin') return 'destructive' as const;
    if (role === 'cooperativa' || role === 'exportador') return 'default' as const;
    return 'secondary' as const;
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Usuarios"
        subtitle={`${filtered.length} usuarios en la plataforma`}
        actions={
          <div className="flex gap-2 items-center">
            <DataSourceBadge source="real" />
            <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Invitar usuario</Button>
            <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar nombre, email u org..." />
        <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Todas las orgs</option>
          {uniqueOrgs.map(o => <option key={o} value={o!}>{o}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Todos los roles</option>
          {uniqueRoles.map(r => <option key={r} value={r!}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : isError ? (
            <ErrorState message={error?.message ?? 'Verificar conexión o permisos.'} onRetry={() => refetch()} />
          ) : filtered.length === 0 ? (
            <EmptyState title="No hay datos disponibles" description="Ajusta los filtros para ver usuarios." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nombre</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Organización</th>
                    <th className="pb-2 font-medium">Rol</th>
                    <th className="pb-2 font-medium">Rol interno</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(u => (
                    <tr key={u.user_id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <td className="py-3 font-medium text-foreground">{u.name ?? 'Sin nombre'}</td>
                      <td className="py-3 text-muted-foreground text-xs">{u.email ?? 'Sin email'}</td>
                      <td className="py-3 text-muted-foreground">{u.org_nombre ?? 'Sin organización'}</td>
                      <td className="py-3"><Badge variant={roleBadge(u.role_global)} className="capitalize">{u.role_global ?? 'Sin rol'}</Badge></td>
                      <td className="py-3">{u.rol_interno ? <Badge variant="outline" className="capitalize">{u.rol_interno.replace('_', ' ')}</Badge> : <span className="text-xs text-muted-foreground">Sin rol interno</span>}</td>
                      <td className="py-3">
                        <StatusBadge status={u.activo ? 'ok' : 'error'} label={u.activo ? 'Activo' : 'Inactivo'} />
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={e => { e.stopPropagation(); setSelectedUser(u); }}>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedUser && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
        </>
      )}
    </div>
  );
}
