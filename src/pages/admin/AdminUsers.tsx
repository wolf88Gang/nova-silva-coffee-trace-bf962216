/**
 * Admin Users — Real Supabase data (profiles + user_roles + organizacion_usuarios).
 * Structured as a real admin console with sections for active users, pending invitations,
 * and role/permission visibility.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw, Users, Shield, UserX, UserPlus,
  ChevronRight, Mail, Calendar, Building2, Eye, X, Clock,
  Briefcase, ShieldCheck, BarChart3, Settings, FileText,
} from 'lucide-react';
import {
  SearchInput, SectionHeader, EmptyState, StatusBadge, ErrorState, DataSourceBadge,
} from '@/components/admin/shared/AdminComponents';
import { useAdminUserList, type AdminUserRow } from '@/hooks/useAdminDataAdapters';

/* ═══ Role definitions ═══ */

const ROLE_DISPLAY: Record<string, { label: string; description: string; icon: typeof Shield }> = {
  admin: { label: 'Administración', description: 'Acceso total a la plataforma', icon: Shield },
  cooperativa: { label: 'Cooperativa', description: 'Gestión de organización cooperativa', icon: Building2 },
  exportador: { label: 'Exportador', description: 'Gestión de exportación y comercio', icon: Briefcase },
  productor: { label: 'Productor', description: 'Acceso a finca y producción', icon: Users },
  tecnico: { label: 'Técnico', description: 'Agronomía y asistencia técnica', icon: Settings },
  certificadora: { label: 'Certificadora', description: 'Auditoría y verificación', icon: ShieldCheck },
};

const INTERNAL_ROLE_LABELS: Record<string, string> = {
  admin_org: 'Admin organización',
  tecnico: 'Técnico',
  comercial: 'Comercial',
  auditor: 'Auditor',
  viewer: 'Solo lectura',
};

const ACCESS_BUNDLES: { key: string; label: string; icon: typeof Shield; description: string }[] = [
  { key: 'ventas', label: 'Ventas', icon: Briefcase, description: 'Sales Intelligence, leads, diagnósticos' },
  { key: 'finanzas', label: 'Finanzas', icon: BarChart3, description: 'Billing, suscripciones, facturación' },
  { key: 'mercadeo', label: 'Mercadeo', icon: FileText, description: 'Growth, campañas, leads marketing' },
  { key: 'operaciones', label: 'Plataforma / Operaciones', icon: Settings, description: 'Sistema, módulos, configuración' },
  { key: 'cumplimiento', label: 'Cumplimiento', icon: ShieldCheck, description: 'EUDR, trazabilidad, auditoría' },
  { key: 'lectura', label: 'Lectura / Auditoría', icon: Eye, description: 'Solo lectura transversal' },
];

/* ═══ User Detail Panel ═══ */

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
            <Badge variant="secondary" className="capitalize">{ROLE_DISPLAY[user.role_global ?? '']?.label ?? user.role_global ?? 'Sin rol'}</Badge>
          </div>
          {user.rol_interno && (
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><Shield className="h-3.5 w-3.5" /> Rol interno</span>
              <Badge variant="outline" className="capitalize">{INTERNAL_ROLE_LABELS[user.rol_interno] ?? user.rol_interno.replace('_', ' ')}</Badge>
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

/* ═══ Main Component ═══ */

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

  const roleCounts = allUsers.reduce((acc, u) => {
    const r = u.role_global ?? 'sin_rol';
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = allUsers.filter(u => u.activo).length;
  const inactiveCount = allUsers.filter(u => !u.activo).length;

  // Distinguish user categories
  const internalStaff = allUsers.filter(u => u.role_global === 'admin');
  const orgUsers = allUsers.filter(u => u.role_global !== 'admin' && u.org_nombre);
  const unassigned = allUsers.filter(u => !u.org_nombre && u.role_global !== 'admin');

  return (
    <div className="space-y-5 animate-fade-in">
      <SectionHeader
        title="Usuarios y Roles"
        subtitle={`${allUsers.length} usuarios en la plataforma`}
        actions={
          <div className="flex gap-2 items-center">
            <DataSourceBadge source="real" />
            <Button variant="outline" size="sm" className="gap-1.5"><UserPlus className="h-3.5 w-3.5" /> Invitar usuario</Button>
            <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        }
      />

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><Users className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Activos</span></div>
            <p className="text-xl font-bold text-foreground">{activeCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><UserX className="h-3.5 w-3.5 text-destructive" /><span className="text-xs text-muted-foreground">Inactivos</span></div>
            <p className="text-xl font-bold text-foreground">{inactiveCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><Shield className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Staff interno</span></div>
            <p className="text-xl font-bold text-foreground">{internalStaff.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><Building2 className="h-3.5 w-3.5 text-primary" /><span className="text-xs text-muted-foreground">Usuarios org</span></div>
            <p className="text-xl font-bold text-foreground">{orgUsers.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex items-center gap-2 mb-1"><Clock className="h-3.5 w-3.5 text-amber-500" /><span className="text-xs text-muted-foreground">Sin asignar</span></div>
            <p className="text-xl font-bold text-foreground">{unassigned.length}</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="usuarios">
        <TabsList>
          <TabsTrigger value="usuarios">Usuarios activos</TabsTrigger>
          <TabsTrigger value="invitaciones">Invitaciones pendientes</TabsTrigger>
          <TabsTrigger value="roles">Roles y permisos</TabsTrigger>
        </TabsList>

        {/* ── Tab: Active users ── */}
        <TabsContent value="usuarios" className="mt-4 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar nombre, email u org..." />
            <select value={filterOrg} onChange={e => setFilterOrg(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">Todas las orgs</option>
              {uniqueOrgs.map(o => <option key={o} value={o!}>{o}</option>)}
            </select>
            <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
              <option value="all">Todos los roles</option>
              {uniqueRoles.map(r => <option key={r} value={r!}>{ROLE_DISPLAY[r!]?.label ?? r}</option>)}
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
                        <th className="pb-2 font-medium">Tipo</th>
                        <th className="pb-2 font-medium">Estado</th>
                        <th className="pb-2 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filtered.map(u => {
                        const userCategory = u.role_global === 'admin' ? 'Staff' : u.org_nombre ? 'Organización' : 'Sin asignar';
                        return (
                          <tr key={u.user_id} className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => setSelectedUser(u)}>
                            <td className="py-3 font-medium text-foreground">{u.name ?? 'Sin nombre'}</td>
                            <td className="py-3 text-muted-foreground text-xs">{u.email ?? 'Sin email'}</td>
                            <td className="py-3 text-muted-foreground">{u.org_nombre ?? '—'}</td>
                            <td className="py-3"><Badge variant={roleBadge(u.role_global)} className="capitalize">{ROLE_DISPLAY[u.role_global ?? '']?.label ?? u.role_global ?? 'Sin rol'}</Badge></td>
                            <td className="py-3"><span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{userCategory}</span></td>
                            <td className="py-3">
                              <StatusBadge status={u.activo ? 'ok' : 'error'} label={u.activo ? 'Activo' : 'Inactivo'} />
                            </td>
                            <td className="py-3 text-right">
                              <Button variant="ghost" size="sm" className="h-7 gap-1" onClick={e => { e.stopPropagation(); setSelectedUser(u); }}>
                                <ChevronRight className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Pending invitations ── */}
        <TabsContent value="invitaciones" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Invitaciones pendientes</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Backend dependency: no invitation table exists yet */}
              <div className="py-8 text-center space-y-2">
                <Mail className="h-8 w-8 text-muted-foreground/40 mx-auto" />
                <p className="text-sm font-medium text-foreground">Sin invitaciones pendientes</p>
                <p className="text-xs text-muted-foreground">
                  El sistema actualmente gestiona usuarios mediante creación directa.
                  Un flujo de invitación por email requiere backend adicional.
                </p>
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-500/30 mt-2">
                  Pendiente: tabla de invitaciones
                </Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Roles & permissions ── */}
        <TabsContent value="roles" className="mt-4 space-y-4">
          {/* Role distribution */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Distribución por rol</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {Object.entries(roleCounts).map(([role, count]) => {
                  const info = ROLE_DISPLAY[role];
                  return (
                    <div key={role} className="rounded-lg border border-border p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-foreground">{info?.label ?? role}</span>
                        <span className="text-lg font-bold text-foreground font-mono">{count}</span>
                      </div>
                      {info && <p className="text-[10px] text-muted-foreground">{info.description}</p>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Access bundles */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4 text-primary" /> Paquetes de acceso funcional</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground mb-3">
                Cada paquete define qué secciones de la plataforma puede ver y operar un usuario según su función.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {ACCESS_BUNDLES.map(bundle => (
                  <div key={bundle.key} className="rounded-lg border border-border p-3 flex items-start gap-3">
                    <bundle.icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{bundle.label}</p>
                      <p className="text-[10px] text-muted-foreground">{bundle.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                <p className="text-[10px] text-muted-foreground">
                  <strong>Nota:</strong> La asignación granular de paquetes de acceso requiere la tabla <code className="bg-muted px-1 rounded">user_access_bundles</code> que aún no existe en el backend.
                  Actualmente los permisos se gestionan mediante roles globales (<code className="bg-muted px-1 rounded">user_roles</code>) y permisos de organización (<code className="bg-muted px-1 rounded">organizacion_usuarios</code>).
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {selectedUser && (
        <>
          <div className="fixed inset-0 z-40 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedUser(null)} />
          <UserDetailPanel user={selectedUser} onClose={() => setSelectedUser(null)} />
        </>
      )}
    </div>
  );
}
