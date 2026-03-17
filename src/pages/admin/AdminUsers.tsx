/**
 * Admin Users — Global user management with detail sidebar.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, RefreshCw, Users, Shield, UserX, UserPlus,
  ChevronRight, Mail, Calendar, Building2, Eye, X,
} from 'lucide-react';
import { SearchInput, SectionHeader, EmptyState, StatusBadge } from '@/components/admin/shared/AdminComponents';
import { MOCK_USERS, type MockUser } from '@/lib/adminMockData';
import { useAdminUsers } from '@/hooks/useAdminData';

function UserDetailPanel({ user, onClose }: { user: MockUser; onClose: () => void }) {
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
          <p className="text-lg font-bold text-foreground">{user.name}</p>
          <p className="text-sm text-muted-foreground">{user.email}</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Building2 className="h-3.5 w-3.5" /> Organización</span>
            <span className="text-sm font-medium text-foreground">{user.orgName}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Rol global</span>
            <Badge variant="secondary" className="capitalize">{user.role}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Rol interno</span>
            <Badge variant="outline" className="capitalize">{user.internalRole.replace('_', ' ')}</Badge>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Eye className="h-3.5 w-3.5" /> Estado</span>
            <StatusBadge status={user.status === 'active' ? 'ok' : user.status === 'inactive' ? 'warning' : 'error'} label={user.status === 'active' ? 'Activo' : user.status === 'inactive' ? 'Inactivo' : 'Bloqueado'} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Último acceso</span>
            <span className="text-sm text-foreground">{user.lastLogin}</span>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
            <span className="text-sm text-muted-foreground flex items-center gap-2"><Calendar className="h-3.5 w-3.5" /> Creación</span>
            <span className="text-sm text-foreground">{user.createdAt}</span>
          </div>
        </div>

        <div className="space-y-2 pt-2">
          <Button variant="outline" size="sm" className="w-full gap-1.5"><Shield className="h-3.5 w-3.5" /> Cambiar rol</Button>
          <Button variant="outline" size="sm" className="w-full gap-1.5"><Mail className="h-3.5 w-3.5" /> Resetear acceso</Button>
          <Button variant="outline" size="sm" className="w-full gap-1.5"><Building2 className="h-3.5 w-3.5" /> Mover a otra organización</Button>
          {user.status !== 'blocked' ? (
            <Button variant="outline" size="sm" className="w-full gap-1.5 text-destructive hover:text-destructive"><UserX className="h-3.5 w-3.5" /> Bloquear usuario</Button>
          ) : (
            <Button variant="outline" size="sm" className="w-full gap-1.5"><Users className="h-3.5 w-3.5" /> Desbloquear</Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminUsers() {
  const { isLoading, refetch } = useAdminUsers();
  const [search, setSearch] = useState('');
  const [filterOrg, setFilterOrg] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUser, setSelectedUser] = useState<MockUser | null>(null);

  const users = MOCK_USERS;
  const uniqueOrgs = [...new Set(users.map(u => u.orgName))];
  const uniqueRoles = [...new Set(users.map(u => u.role))];

  const filtered = users
    .filter(u => filterOrg === 'all' || u.orgName === filterOrg)
    .filter(u => filterRole === 'all' || u.role === filterRole)
    .filter(u => filterStatus === 'all' || u.status === filterStatus)
    .filter(u =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.orgName.toLowerCase().includes(search.toLowerCase())
    );

  const roleBadge = (role: string) => {
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
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Invitar usuario</Button>
            <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar nombre, email u org..." />
        <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Todas las orgs</option>
          {uniqueOrgs.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Todos los roles</option>
          {uniqueRoles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="blocked">Bloqueado</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState title="Sin resultados" description="Ajusta los filtros para ver usuarios." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-2 font-medium">Nombre</th>
                    <th className="pb-2 font-medium">Email</th>
                    <th className="pb-2 font-medium">Organización</th>
                    <th className="pb-2 font-medium">Rol</th>
                    <th className="pb-2 font-medium">Estado</th>
                    <th className="pb-2 font-medium">Último acceso</th>
                    <th className="pb-2 font-medium">Creación</th>
                    <th className="pb-2 font-medium text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                      <td className="py-3 font-medium text-foreground">{u.name}</td>
                      <td className="py-3 text-muted-foreground text-xs">{u.email}</td>
                      <td className="py-3 text-muted-foreground">{u.orgName}</td>
                      <td className="py-3"><Badge variant={roleBadge(u.role)} className="capitalize">{u.role}</Badge></td>
                      <td className="py-3">
                        <StatusBadge status={u.status === 'active' ? 'ok' : u.status === 'inactive' ? 'warning' : 'error'} label={u.status === 'active' ? 'Activo' : u.status === 'inactive' ? 'Inactivo' : 'Bloqueado'} />
                      </td>
                      <td className="py-3 text-muted-foreground text-xs">{u.lastLogin}</td>
                      <td className="py-3 text-muted-foreground text-xs">{u.createdAt}</td>
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

      {/* Detail panel */}
      {selectedUser && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
        </>
      )}
    </div>
  );
}
