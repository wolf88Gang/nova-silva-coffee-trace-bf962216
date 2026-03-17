/**
 * Admin Billing — Subscriptions & revenue management (mock)
 */
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, TrendingUp, Search, FileText, Zap, Calculator } from 'lucide-react';
import { useAdminOrganizations } from '@/hooks/useAdminData';

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
          {overage > 0 && <div className="flex justify-between text-sm text-yellow-500"><span>Exceso ({producers - 500} prod.)</span><span>${overage}</span></div>}
          <div className="flex justify-between text-base font-bold mt-2 pt-2 border-t border-primary/20">
            <span>Total mensual</span><span>${total}/mes</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminBilling() {
  const { data: orgs } = useAdminOrganizations();
  const [search, setSearch] = useState('');

  const mockSubs = (orgs ?? []).map((o, i) => ({
    ...o,
    plan: i === 0 ? 'smart' : i === 1 ? 'plus' : 'enterprise',
    status: 'active' as const,
    mrr: [750, 1400, 2500][i % 3],
    usage: { producers: [420, 180, 24][i % 3], limit: [500, 300, 50][i % 3] },
    nextInvoice: '2026-04-01',
  }));

  const filtered = mockSubs.filter(s => s.nombre.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Suscripciones & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">Gestión de planes, facturación y revenue</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground">MRR</p><p className="text-2xl font-bold text-foreground">$4,250</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground">ARR proyectado</p><p className="text-2xl font-bold text-foreground">$51,000</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground">Facturas pendientes</p><p className="text-2xl font-bold text-yellow-500">1</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 pb-3 px-4">
          <p className="text-xs text-muted-foreground">Churn rate</p><p className="text-2xl font-bold text-foreground">0%</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="suscripciones">
        <TabsList><TabsTrigger value="suscripciones">Suscripciones</TabsTrigger><TabsTrigger value="simulador">Simulador</TabsTrigger></TabsList>

        <TabsContent value="suscripciones" className="mt-4 space-y-3">
          <div className="relative max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" /></div>

          {filtered.map(s => (
            <Card key={s.id}>
              <CardContent className="pt-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{s.nombre}</p>
                  <p className="text-xs text-muted-foreground capitalize">{s.tipo}</p>
                </div>
                <Badge variant="outline" className="capitalize">{s.plan}</Badge>
                <span className="text-sm font-semibold">${s.mrr}/mes</span>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Uso: {s.usage.producers}/{s.usage.limit}</p>
                  <div className="w-24 h-1.5 bg-muted rounded-full mt-1">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min((s.usage.producers / s.usage.limit) * 100, 100)}%` }} />
                  </div>
                </div>
                <Badge variant="default">{s.status}</Badge>
                <Button variant="ghost" size="sm">Gestionar</Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="simulador" className="mt-4">
          <PricingSimulator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
