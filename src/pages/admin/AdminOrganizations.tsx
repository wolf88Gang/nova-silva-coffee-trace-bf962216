/**
 * Admin Organizations — Real Supabase data + mock enrichment for billing/usage.
 * Drilldown into org detail with tabs.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, RefreshCw, Users, Map, FileText, Shield,
  ChevronLeft, Package, Settings, Calendar, Zap, CreditCard,
} from 'lucide-react';
import {
  useAdminOrgList, useAdminOrgDetail,
  type AdminOrgRow,
} from '@/hooks/useAdminDataAdapters';
import {
  SearchInput, SectionHeader, StatusBadge, UsageProgressBar, MetricCard,
  EmptyState, PendingIntegration, ErrorState, DataSourceBadge, LimitedDataNotice,
} from '@/components/admin/shared/AdminComponents';
import { getStatusBadgeVariant, getRiskColor } from '@/lib/adminMockData';

// ── Org Detail ──

function OrgDetail({ orgId, onBack }: { orgId: string; onBack: () => void }) {
  const { data: detail, isLoading, isError, error } = useAdminOrgDetail(orgId);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-10 w-48" /><Skeleton className="h-64 w-full" /></div>;
  if (isError || !detail) return <ErrorState message={error?.message ?? 'No se pudo cargar el detalle de la organización.'} onRetry={onBack} />;

  const { org, users, usage, billing, trial, modules, _usageSource } = detail;
  const e = org._enriched;

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ChevronLeft className="h-4 w-4" /></Button>
        <div>
          <h2 className="text-xl font-bold text-foreground">{org.nombre}</h2>
          <p className="text-sm text-muted-foreground capitalize">{org.tipo} . ID: {org.id.slice(0, 12)}...</p>
        </div>
        <div className="ml-auto flex gap-2 items-center">
          <DataSourceBadge source="real" label="Org real" />
          <Button variant="outline" size="sm" className="gap-1.5"><Settings className="h-3.5 w-3.5" /> Configurar</Button>
          <Button variant="destructive" size="sm" className="border-destructive/50">Suspender</Button>
        </div>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="grid grid-cols-6 max-w-3xl">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="usuarios">Usuarios ({users.length})</TabsTrigger>
          <TabsTrigger value="uso">Uso</TabsTrigger>
          <TabsTrigger value="facturacion">Facturación</TabsTrigger>
          <TabsTrigger value="licencias">Licencias</TabsTrigger>
          <TabsTrigger value="riesgo">Riesgo</TabsTrigger>
        </TabsList>

        {/* Resumen */}
        <TabsContent value="resumen" className="mt-4 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="Plan" value={e.plan.toUpperCase()} icon={CreditCard} source="mock" />
            <MetricCard label="Health score" value={`${e.healthScore}%`} icon={Shield} source="mock" />
            <MetricCard label="Usuarios" value={users.length} icon={Users} />
            <MetricCard label="Ultima actividad" value={e.lastActivity} icon={Calendar} source="mock" />
          </div>
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm">Módulos activos</CardTitle></CardHeader>
            <CardContent>
              {modules.length === 0 ? (
                <p className="text-xs text-muted-foreground">Sin módulos configurados</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {modules.map(m => <Badge key={m} variant="outline">{m}</Badge>)}
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Información</CardTitle>
                <DataSourceBadge source="real" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">País</span><span className="text-foreground">{e.country}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Creada</span><span className="text-foreground">{new Date(org.created_at).toLocaleDateString('es')}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Owner</span><span className="text-foreground">{e.owner}</span></div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usuarios */}
        <TabsContent value="usuarios" className="mt-4">
          <Card><CardContent className="pt-4 space-y-2">
            {users.length === 0 ? (
              <EmptyState title="Sin usuarios vinculados" description="No hay usuarios asociados a esta organización." />
            ) : users.map(u => (
              <div key={u.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/40 border border-border/50">
                <Users className="h-4 w-4 text-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{u.name ?? 'Sin nombre'}</p>
                  <p className="text-xs text-muted-foreground">{u.email ?? u.user_id.slice(0, 8) + '...'}</p>
                </div>
                {u.rol_interno && <Badge variant="outline" className="capitalize">{u.rol_interno.replace('_', ' ')}</Badge>}
                {u.role_global && <Badge variant="secondary" className="capitalize">{u.role_global}</Badge>}
                <StatusBadge status={u.activo ? 'ok' : 'error'} label={u.activo ? 'Activo' : 'Inactivo'} />
                <Button variant="ghost" size="sm">Gestionar</Button>
              </div>
            ))}
          </CardContent></Card>
        </TabsContent>

        {/* Uso */}
        <TabsContent value="uso" className="mt-4">
          {_usageSource === 'mock' ? (
            <PendingIntegration feature="Conteo de uso real (productores, parcelas, lotes)" />
          ) : (
            <DataSourceBadge source="real" label="Conteo real de Supabase" />
          )}
          <Card className="mt-3"><CardContent className="pt-4 space-y-4">
            <UsageProgressBar label="Productores" value={usage.producers} limit={e.usage.producersLimit} icon={Users} />
            <UsageProgressBar label="Parcelas" value={usage.plots} limit={e.usage.plotsLimit} icon={Map} />
            <UsageProgressBar label="Lotes" value={usage.lots} limit={e.usage.lotsLimit} icon={Package} />
            <UsageProgressBar label="Dossiers EUDR" value={usage.dossiers} limit={e.usage.dossiersLimit} icon={FileText} />
          </CardContent></Card>
        </TabsContent>

        {/* Facturación */}
        <TabsContent value="facturacion" className="mt-4 space-y-3">
          <PendingIntegration feature="Facturación real (invoices, pagos)" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MetricCard label="MRR" value={`$${billing.mrr}`} icon={CreditCard} source="mock" />
            <MetricCard label="Ciclo" value={billing.cycle === 'monthly' ? 'Mensual' : 'Anual'} icon={Calendar} source="mock" />
            <MetricCard label="Add-ons" value={billing.addons.length} icon={Zap} source="mock" />
            <MetricCard label="Saldo pendiente" value={billing.pendingBalance > 0 ? `$${billing.pendingBalance}` : '$0'} icon={CreditCard} source="mock" />
          </div>
          {billing.addons.length > 0 && (
            <Card><CardContent className="pt-4">
              <p className="text-xs text-muted-foreground mb-2">Add-ons activos</p>
              <div className="flex flex-wrap gap-2">{billing.addons.map(a => <Badge key={a} variant="outline">{a}</Badge>)}</div>
            </CardContent></Card>
          )}
        </TabsContent>

        {/* Licencias */}
        <TabsContent value="licencias" className="mt-4 space-y-3">
          <PendingIntegration feature="Gestión de licencias y trials (backend)" />
          <Card><CardContent className="pt-4 space-y-3">
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Trial activo</span><span className="text-foreground">{trial?.active ? 'Si' : 'No'}</span></div>
            {trial?.active && (
              <>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Expira</span><span className="text-foreground">{trial.expiresAt}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Días restantes</span><span className="text-foreground font-semibold">{trial.daysLeft}</span></div>
              </>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm">Extender trial</Button>
              <Button variant="outline" size="sm">Activar cuenta</Button>
              <Button variant="destructive" size="sm" className="border-destructive/50">Suspender</Button>
            </div>
          </CardContent></Card>
        </TabsContent>

        {/* Riesgo */}
        <TabsContent value="riesgo" className="mt-4">
          <Card><CardContent className="pt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Nivel de riesgo</span>
              <span className={`font-semibold capitalize ${getRiskColor(e.riskLevel)}`}>{e.riskLevel}</span>
            </div>
            {e.riskIssues.length === 0 ? (
              <EmptyState title="Sin riesgos" description="No se detectaron problemas para esta organización." />
            ) : (
              <div className="space-y-2">
                {e.riskIssues.map((issue, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 rounded-md bg-destructive/5 border border-destructive/20">
                    <Shield className="h-3.5 w-3.5 text-destructive" />
                    <span className="text-sm text-foreground">{issue}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ── Main List ──

export default function AdminOrganizations() {
  const { data: orgs, isLoading, isError, error, refetch } = useAdminOrgList();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);

  if (selectedOrgId) return <OrgDetail orgId={selectedOrgId} onBack={() => setSelectedOrgId(null)} />;

  const uniqueTypes = [...new Set((orgs ?? []).map(o => o.tipo))];

  const filtered = (orgs ?? [])
    .filter(o => filterType === 'all' || o.tipo === filterType)
    .filter(o => filterStatus === 'all' || o._enriched.status === filterStatus)
    .filter(o =>
      o.nombre.toLowerCase().includes(search.toLowerCase()) ||
      o.tipo.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-4 animate-fade-in">
      <SectionHeader
        title="Organizaciones"
        subtitle={`${filtered.length} organizaciones registradas`}
        actions={
          <div className="flex items-center gap-2">
            <DataSourceBadge source="real" />
            <Button variant="ghost" size="icon" onClick={() => refetch()}><RefreshCw className="h-4 w-4" /></Button>
          </div>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre o tipo..." />
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Todos los tipos</option>
          {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="h-9 rounded-md border border-border bg-background px-3 text-sm">
          <option value="all">Todos los estados</option>
          <option value="active">Activa</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspendida</option>
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full" />)}</div>
      ) : isError ? (
        <ErrorState message={error?.message ?? 'Verificar conexión o permisos.'} onRetry={() => refetch()} />
      ) : filtered.length === 0 ? (
        <EmptyState title="No hay datos disponibles" description="No hay organizaciones que coincidan con los filtros." />
      ) : (
        <div className="space-y-2">
          {filtered.map(o => {
            const e = o._enriched;
            return (
              <button key={o.id} onClick={() => setSelectedOrgId(o.id)}
                className="w-full flex items-center gap-4 p-4 rounded-xl bg-card border border-border hover:border-primary/40 hover:bg-muted/30 transition-all text-left">
                <Building2 className="h-6 w-6 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{o.nombre}</p>
                  <p className="text-xs text-muted-foreground capitalize">{o.tipo} . Creada {new Date(o.created_at).toLocaleDateString('es')}</p>
                </div>
                <Badge variant="outline" className="capitalize">{e.plan}</Badge>
                <Badge variant={getStatusBadgeVariant(e.status)} className="capitalize">{e.status === 'active' ? 'Activa' : e.status === 'trial' ? 'Trial' : e.status === 'suspended' ? 'Suspendida' : 'Vencida'}</Badge>
                <span className="text-sm text-muted-foreground">{e.healthScore}%</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
