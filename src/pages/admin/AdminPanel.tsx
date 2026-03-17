import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2, Users, Database, Activity, Shield, Server,
  Search, RefreshCw, CheckCircle2, XCircle, Clock, Boxes,
} from 'lucide-react';
import {
  useAdminOrganizations,
  useAdminUsers,
  useAdminKPIs,
  useSystemHealth,
} from '@/hooks/useAdminData';

// ── KPI Card ──
function KPICard({ label, value, icon: Icon, loading }: { label: string; value: number | string; icon: React.ElementType; loading?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        {loading ? <Skeleton className="h-8 w-16" /> : <p className="text-2xl font-bold text-foreground">{value}</p>}
      </CardContent>
    </Card>
  );
}

// ── Organizations Tab ──
function OrganizationsTab() {
  const { data: orgs, isLoading, refetch } = useAdminOrganizations();
  const [search, setSearch] = useState('');

  const filtered = (orgs ?? []).filter(o =>
    o.nombre.toLowerCase().includes(search.toLowerCase()) ||
    o.tipo.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Organizaciones registradas</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar organización..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No se encontraron organizaciones</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(o => (
              <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <Building2 className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{o.nombre}</p>
                  <p className="text-xs text-muted-foreground">
                    ID: <span className="font-mono">{o.id.slice(0, 8)}…</span> · Creado: {new Date(o.created_at).toLocaleDateString('es')}
                  </p>
                </div>
                <Badge variant="outline" className="capitalize shrink-0">{o.tipo}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Users Tab ──
function UsersTab() {
  const { data: users, isLoading, refetch } = useAdminUsers();
  const [search, setSearch] = useState('');

  const filtered = (users ?? []).filter(u =>
    (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.organization_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (u.role ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const roleBadgeVariant = (role: string | null): 'default' | 'secondary' | 'destructive' | 'outline' => {
    if (role === 'admin') return 'destructive';
    if (role === 'cooperativa' || role === 'exportador') return 'default';
    return 'secondary';
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Usuarios del sistema</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
        </div>
        <div className="relative mt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar usuario, org o rol..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-14 w-full" />)}</div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No se encontraron usuarios</p>
        ) : (
          <div className="space-y-2">
            {filtered.map(u => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <Users className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name ?? 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {u.organization_name ?? 'Sin organización'} · <span className="font-mono">{u.user_id.slice(0, 8)}…</span>
                  </p>
                </div>
                <Badge variant={roleBadgeVariant(u.role)} className="capitalize shrink-0">{u.role ?? 'sin rol'}</Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── System Health Tab ──
function SystemHealthTab() {
  const { data: checks, isLoading, refetch, dataUpdatedAt } = useSystemHealth();

  const statusIcon = (status: string) => {
    if (status === 'ok') return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (status === 'error') return <XCircle className="h-5 w-5 text-destructive" />;
    return <Clock className="h-5 w-5 text-muted-foreground animate-spin" />;
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Estado del sistema</CardTitle>
          <div className="flex items-center gap-2">
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-muted-foreground">
                Último check: {new Date(dataUpdatedAt).toLocaleTimeString('es')}
              </span>
            )}
            <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">{[1,2,3,4].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
        ) : (
          <div className="space-y-3">
            {(checks ?? []).map(c => (
              <div key={c.service} className="flex items-center gap-4 p-4 rounded-lg bg-muted/40 border border-border/50">
                {statusIcon(c.status)}
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{c.service}</p>
                  <p className="text-xs text-muted-foreground">{c.detail}</p>
                </div>
                {c.latencyMs !== undefined && (
                  <Badge variant={c.latencyMs < 300 ? 'outline' : 'secondary'} className="font-mono text-xs">
                    {c.latencyMs}ms
                  </Badge>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Main Admin Panel ──
export default function AdminPanel() {
  const kpis = useAdminKPIs();

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Panel de administración</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión centralizada de Nova Silva Platform</p>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard label="Organizaciones" value={kpis.orgCount} icon={Building2} loading={kpis.isLoading} />
        <KPICard label="Usuarios totales" value={kpis.userCount} icon={Users} loading={kpis.isLoading} />
        <KPICard label="Administradores" value={kpis.adminCount} icon={Shield} loading={kpis.isLoading} />
        <KPICard label="Tipos de org" value={kpis.orgTypes.size} icon={Boxes} loading={kpis.isLoading} />
      </div>

      {/* Tabbed sections */}
      <Tabs defaultValue="organizaciones">
        <TabsList className="grid w-full grid-cols-3 max-w-lg">
          <TabsTrigger value="organizaciones" className="gap-1.5"><Building2 className="h-4 w-4" /> Organizaciones</TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-1.5"><Users className="h-4 w-4" /> Usuarios</TabsTrigger>
          <TabsTrigger value="sistema" className="gap-1.5"><Server className="h-4 w-4" /> Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="organizaciones" className="mt-4">
          <OrganizationsTab />
        </TabsContent>
        <TabsContent value="usuarios" className="mt-4">
          <UsersTab />
        </TabsContent>
        <TabsContent value="sistema" className="mt-4">
          <SystemHealthTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
