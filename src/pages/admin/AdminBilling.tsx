/**
 * Admin Billing — Operational billing console.
 * Shows real operational status with honest backend dependency indicators.
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DollarSign, TrendingUp, FileText, Zap, Calculator,
  CreditCard, Wallet, Calendar, AlertCircle, CheckCircle2,
  Clock, XCircle, Settings,
} from 'lucide-react';
import {
  MetricCard, SectionHeader, SearchInput, StatusBadge,
  EmptyState, DataSourceBadge,
} from '@/components/admin/shared/AdminComponents';
import { useAdminBillingData } from '@/hooks/useAdminDataAdapters';
import { getInvoiceStatusVariant, getStatusBadgeVariant } from '@/lib/adminMockData';

/* ═══ Operational status definitions ═══ */

interface ModuleStatus {
  label: string;
  status: 'operativo' | 'configurado' | 'pendiente' | 'incompleto';
  dependency: string;
  icon: typeof CheckCircle2;
}

const BILLING_MODULES: ModuleStatus[] = [
  { label: 'Suscripciones', status: 'pendiente', dependency: 'billing_subscriptions', icon: CreditCard },
  { label: 'Facturación', status: 'pendiente', dependency: 'billing_invoices', icon: FileText },
  { label: 'Cobros automáticos', status: 'incompleto', dependency: 'Stripe / procesador de pagos', icon: Wallet },
  { label: 'Registros de pago', status: 'pendiente', dependency: 'billing_payments', icon: DollarSign },
  { label: 'Simulador pricing', status: 'operativo', dependency: 'Frontend only', icon: Calculator },
  { label: 'Planes y precios', status: 'configurado', dependency: 'Configuración local', icon: Settings },
];

const STATUS_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  operativo: { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500', label: 'Operativo' },
  configurado: { color: 'text-primary', bg: 'bg-primary', label: 'Configurado' },
  pendiente: { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500', label: 'Pendiente' },
  incompleto: { color: 'text-destructive', bg: 'bg-destructive', label: 'Incompleto' },
};

/* ═══ Pricing Simulator ═══ */

const MOCK_PLANS = ['lite', 'smart', 'plus', 'enterprise'];
const PLAN_PRICES: Record<string, number> = { lite: 0, smart: 750, plus: 1400, enterprise: 2500 };

function PricingSimulator() {
  const [producers, setProducers] = useState(200);
  const [plan, setPlan] = useState('smart');
  const [addons, setAddons] = useState<string[]>(['eudr']);
  const addonPrices: Record<string, number> = { eudr: 120, guard: 80, vital: 60, yield: 100 };

  const base = PLAN_PRICES[plan] ?? 750;
  const addonTotal = addons.reduce((s, a) => s + (addonPrices[a] ?? 0), 0);
  const overage = Math.max(0, producers - 500) * 1;
  const total = base + addonTotal + overage;

  return (
    <Card>
      <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-4 w-4" /> Simulador de pricing</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-muted-foreground">Plan base</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} className="mt-1 w-full h-9 rounded-md border border-border bg-background px-3 text-sm">
              {MOCK_PLANS.map(p => <option key={p} value={p}>{p} (${PLAN_PRICES[p]})</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Productores</label>
            <Input type="number" value={producers} onChange={e => setProducers(Number(e.target.value))} className="mt-1 h-9" />
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-2">Add-ons</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(addonPrices).map(([key, price]) => (
              <Button key={key} variant={addons.includes(key) ? 'default' : 'outline'} size="sm"
                onClick={() => setAddons(prev => prev.includes(key) ? prev.filter(a => a !== key) : [...prev, key])}>
                {key.toUpperCase()} (${price})
              </Button>
            ))}
          </div>
        </div>
        <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
          <div className="flex justify-between text-sm"><span>Plan base</span><span>${base}</span></div>
          <div className="flex justify-between text-sm"><span>Add-ons</span><span>${addonTotal}</span></div>
          {overage > 0 && <div className="flex justify-between text-sm text-amber-600"><span>Exceso ({producers - 500} prod.)</span><span>${overage}</span></div>}
          <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-primary/20">
            <span>Total mensual</span><span>${total}/mes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/* ═══ Main Component ═══ */

export default function AdminBilling() {
  const billing = useAdminBillingData();
  const [search, setSearch] = useState('');
  const [invSearch, setInvSearch] = useState('');
  const [paySearch, setPaySearch] = useState('');

  const filteredSubs = billing.subscriptions.filter(s =>
    s.orgName.toLowerCase().includes(search.toLowerCase())
  );
  const filteredInvoices = billing.invoices.filter(inv =>
    inv.orgName.toLowerCase().includes(invSearch.toLowerCase()) ||
    inv.number.toLowerCase().includes(invSearch.toLowerCase())
  );
  const filteredPayments = billing.payments.filter(pay =>
    pay.orgName.toLowerCase().includes(paySearch.toLowerCase())
  );

  const operativeCount = BILLING_MODULES.filter(m => m.status === 'operativo').length;
  const pendingCount = BILLING_MODULES.filter(m => m.status === 'pendiente' || m.status === 'incompleto').length;

  return (
    <div className="space-y-6 animate-fade-in">
      <SectionHeader
        title="Suscripciones y Facturación"
        subtitle="Centro de control comercial y financiero"
        actions={
          <div className="flex items-center gap-2">
            <DataSourceBadge source="mock" />
          </div>
        }
      />

      {/* ── Operational Status Dashboard ── */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Settings className="h-4 w-4 text-primary" /> Estado operativo del módulo de billing
            </CardTitle>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><CheckCircle2 className="h-3 w-3 text-emerald-500" /> {operativeCount} operativo{operativeCount !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><AlertCircle className="h-3 w-3 text-amber-500" /> {pendingCount} pendiente{pendingCount !== 1 ? 's' : ''}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {BILLING_MODULES.map(mod => {
              const cfg = STATUS_CONFIG[mod.status];
              return (
                <div key={mod.label} className="rounded-lg border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <mod.icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">{mod.label}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`h-2 w-2 rounded-full ${cfg.bg}`} />
                      <span className={`text-[10px] font-semibold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Dependencia: <code className="bg-muted px-1 rounded">{mod.dependency}</code>
                  </p>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-muted-foreground mt-3">
            Los datos de suscripciones, facturas y pagos mostrados abajo son datos de referencia para planificación.
            Para activar billing real, conectar Stripe o sistema de facturación y crear las tablas correspondientes.
          </p>
        </CardContent>
      </Card>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        <MetricCard label="MRR" value={`$${billing.revenue.mrr.toLocaleString()}`} icon={DollarSign} trend="up" source="mock" />
        <MetricCard label="ARR estimado" value={`$${billing.revenue.arrProjected.toLocaleString()}`} icon={TrendingUp} source="mock" />
        <MetricCard label="Cobrado" value={`$${billing.revenue.collectedThisMonth.toLocaleString()}`} icon={Wallet} source="mock" />
        <MetricCard label="Por cobrar" value={`$${billing.revenue.accountsReceivable.toLocaleString()}`} icon={CreditCard} source="mock" />
        <MetricCard label="Trials a vencer" value={billing.revenue.trialsExpiringSoon} icon={Calendar} source="mock" />
        <MetricCard label="Upgrades" value={billing.revenue.recentUpgrades} icon={Zap} source="mock" />
        <MetricCard label="Churn" value={`${billing.revenue.churnRate}%`} icon={TrendingUp} source="mock" />
        <MetricCard label="Suspensiones" value={billing.revenue.suspensions} icon={FileText} source="mock" />
      </div>

      <Tabs defaultValue="suscripciones">
        <TabsList>
          <TabsTrigger value="suscripciones">Suscripciones</TabsTrigger>
          <TabsTrigger value="facturas">Facturas</TabsTrigger>
          <TabsTrigger value="pagos">Pagos</TabsTrigger>
          <TabsTrigger value="simulador">Simulador</TabsTrigger>
        </TabsList>

        {/* Subscriptions */}
        <TabsContent value="suscripciones" className="mt-4 space-y-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar organización..." />
          {filteredSubs.length === 0 ? (
            <EmptyState title="No hay datos disponibles" description="No se encontraron suscripciones." />
          ) : filteredSubs.map(s => (
            <Card key={s.orgId}>
              <CardContent className="pt-4 flex items-center gap-4 flex-wrap">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{s.orgName}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.orgType}</p>
                </div>
                <Badge variant="outline" className="capitalize">{s.plan}</Badge>
                <span className="text-sm font-semibold">${s.mrr}/mes</span>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Prod: {s.usage.producers}/{s.usage.producersLimit}</p>
                  <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((s.usage.producers / s.usage.producersLimit) * 100, 100)}%` }} />
                  </div>
                </div>
                {s.addons.length > 0 && (
                  <div className="flex gap-1">{s.addons.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}</div>
                )}
                <Badge variant={getStatusBadgeVariant(s.status)}>{s.status === 'active' ? 'Activa' : s.status === 'trial' ? 'Trial' : s.status === 'suspended' ? 'Suspendida' : 'Vencida'}</Badge>
                {s.pendingBalance > 0 && <span className="text-xs text-destructive font-semibold">${s.pendingBalance} pendiente</span>}
                <Button variant="ghost" size="sm">Gestionar</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* Invoices */}
        <TabsContent value="facturas" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <SearchInput value={invSearch} onChange={setInvSearch} placeholder="Buscar factura..." />
            <Button variant="outline" size="sm" className="gap-1.5"><FileText className="h-3.5 w-3.5" /> Crear factura manual</Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              {filteredInvoices.length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="No se encontraron facturas." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Numero</th>
                        <th className="pb-2 font-medium">Organización</th>
                        <th className="pb-2 font-medium">Periodo</th>
                        <th className="pb-2 font-medium">Monto</th>
                        <th className="pb-2 font-medium">Estado</th>
                        <th className="pb-2 font-medium">Emisión</th>
                        <th className="pb-2 font-medium">Vencimiento</th>
                        <th className="pb-2 font-medium text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredInvoices.map(inv => (
                        <tr key={inv.id} className={`hover:bg-muted/30 transition-colors ${inv.status === 'overdue' ? 'bg-destructive/5' : ''}`}>
                          <td className="py-3 font-mono text-xs text-foreground">{inv.number}</td>
                          <td className="py-3 text-foreground">{inv.orgName}</td>
                          <td className="py-3 text-muted-foreground">{inv.period}</td>
                          <td className="py-3 font-semibold text-foreground">${inv.amount}</td>
                          <td className="py-3"><Badge variant={getInvoiceStatusVariant(inv.status)} className="capitalize">{inv.status === 'paid' ? 'Pagada' : inv.status === 'overdue' ? 'Vencida' : inv.status === 'pending' ? 'Pendiente' : 'Cancelada'}</Badge></td>
                          <td className="py-3 text-muted-foreground text-xs">{inv.issuedAt}</td>
                          <td className="py-3 text-muted-foreground text-xs">{inv.dueAt}</td>
                          <td className="py-3 text-right">
                            <Button variant="ghost" size="sm" className="h-7 text-xs">
                              {inv.status === 'overdue' ? 'Marcar pagada' : 'Ver'}
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
        </TabsContent>

        {/* Payments */}
        <TabsContent value="pagos" className="mt-4 space-y-3">
          <div className="flex items-center justify-between">
            <SearchInput value={paySearch} onChange={setPaySearch} placeholder="Buscar pago..." />
            <Button variant="outline" size="sm" className="gap-1.5"><Wallet className="h-3.5 w-3.5" /> Registrar pago manual</Button>
          </div>
          <Card>
            <CardContent className="pt-4">
              {filteredPayments.length === 0 ? (
                <EmptyState title="No hay datos disponibles" description="No se encontraron pagos registrados." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="pb-2 font-medium">Organización</th>
                        <th className="pb-2 font-medium">Monto</th>
                        <th className="pb-2 font-medium">Fecha</th>
                        <th className="pb-2 font-medium">Método</th>
                        <th className="pb-2 font-medium">Referencia</th>
                        <th className="pb-2 font-medium">Registrado por</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {filteredPayments.map(pay => (
                        <tr key={pay.id} className="hover:bg-muted/30 transition-colors">
                          <td className="py-3 text-foreground">{pay.orgName}</td>
                          <td className="py-3 font-semibold text-foreground">${pay.amount}</td>
                          <td className="py-3 text-muted-foreground text-xs">{pay.date}</td>
                          <td className="py-3"><Badge variant="outline" className="capitalize">{pay.method}</Badge></td>
                          <td className="py-3 font-mono text-xs text-muted-foreground">{pay.reference}</td>
                          <td className="py-3 text-muted-foreground">{pay.registeredBy}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Simulator */}
        <TabsContent value="simulador" className="mt-4">
          <PricingSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
