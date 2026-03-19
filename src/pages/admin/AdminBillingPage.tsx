import { useQuery } from '@tanstack/react-query';
import { AdminPageHeader } from '@/components/admin/PageHeader';
import { MetricCard } from '@/components/admin/MetricCard';
import { SectionCard } from '@/components/admin/SectionCard';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { useAdminBilling } from '@/hooks/admin/useAdminBilling';
import { RegisterPaymentDialog } from '@/components/admin/RegisterPaymentDialog';
import { CreateInvoiceDialog } from '@/components/admin/CreateInvoiceDialog';
import { InvoiceDetailSheet } from '@/components/admin/InvoiceDetailSheet';
import { DegradedModeBanner } from '@/components/admin/DegradedModeBanner';
import { AdminErrorAlert } from '@/components/admin/AdminErrorAlert';
import { DollarSign, FileText, CreditCard } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const INVOICE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  sent: 'warning',
  overdue: 'danger',
  draft: 'neutral',
  cancelled: 'neutral',
};

export default function AdminBillingPage() {
  const [simTipo, setSimTipo] = useState('cooperativa');
  const [simPlan, setSimPlan] = useState('smart');
  const [simProductores, setSimProductores] = useState(100);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const { revenue, subscriptions, invoices, payments } = useAdminBilling();
  const rev = revenue.data;
  const sub = subscriptions.data;
  const inv = invoices.data;
  const pay = payments.data;
  const revenueData = rev?.data;
  const subscriptionsData = sub?.data ?? [];
  const invoicesData = inv?.data ?? [];
  const paymentsData = pay?.data ?? [];
  const isDegraded = !!(rev?.isFallback || sub?.isFallback || inv?.isFallback || pay?.isFallback);
  const hasError = revenue.isError || subscriptions.isError || invoices.isError || payments.isError;

  const simBase = simPlan === 'plus' ? 450 : simPlan === 'smart' ? 320 : 120;
  const simOverages = Math.max(0, simProductores - 50) * 2;
  const simTotal = simBase + simOverages;

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Facturación" description="Suscripciones, facturas y pagos" />
      <AdminErrorAlert visible={hasError} />
      <DegradedModeBanner visible={isDegraded} />

      {/* Resumen */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <MetricCard label="MRR" value={`$${revenueData?.mrr?.toLocaleString() ?? '—'}`} icon={DollarSign} />
        <MetricCard label="Clientes activos" value={revenueData?.activeClients ?? '—'} icon={CreditCard} />
        <MetricCard label="Trials" value={revenueData?.trialsActive ?? '—'} />
        <MetricCard label="Vencidos" value={revenueData?.overdueAccounts ?? '—'} variant="danger" />
        <MetricCard label="Por cobrar" value={`$${revenueData?.pendingCollections?.toLocaleString() ?? '—'}`} variant="warning" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Suscripciones */}
        <SectionCard title="Suscripciones" description="Estado por organización">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organización</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Saldo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptionsData.slice(0, 8).map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.organizationName}</TableCell>
                    <TableCell>{s.plan}</TableCell>
                    <TableCell><StatusBadge label={s.status} variant={s.status === 'activo' ? 'success' : s.status === 'vencido' ? 'danger' : 'warning'} /></TableCell>
                    <TableCell>{s.balanceDue ? `$${s.balanceDue}` : '—'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </SectionCard>

        {/* Facturas */}
        <SectionCard title="Facturas recientes" description="Últimas facturas emitidas">
          <div className="overflow-x-auto">
            {invoices.isLoading ? (
              <p className="py-8 text-center text-muted-foreground text-sm">Cargando facturas…</p>
            ) : invoicesData.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground text-sm">No hay facturas</p>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Número</TableHead>
                  <TableHead>Organización</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>PayPal</TableHead>
                  <TableHead>Vencimiento</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoicesData.slice(0, 8).map((i) => (
                  <TableRow
                    key={i.id}
                    className="cursor-pointer hover:bg-muted/50"
                    onClick={() => setSelectedInvoiceId(i.id)}
                  >
                    <TableCell className="font-mono text-sm">{i.number}</TableCell>
                    <TableCell>{i.organizationName}</TableCell>
                    <TableCell>${i.amount}</TableCell>
                    <TableCell><StatusBadge label={i.status} variant={INVOICE_STATUS_VARIANT[i.status] ?? 'neutral'} /></TableCell>
                    <TableCell>
                      {i.lastPayPalIntent ? (
                        <span className="flex flex-col gap-0.5 text-xs">
                          <StatusBadge
                            label={i.lastPayPalIntent.isCaptured ? 'Capturado' : i.lastPayPalIntent.status}
                            variant={i.lastPayPalIntent.isCaptured ? 'success' : 'warning'}
                          />
                          {i.lastPayPalIntent.providerOrderId && (
                            <span className="font-mono text-muted-foreground truncate max-w-[120px]" title={i.lastPayPalIntent.providerOrderId}>
                              {i.lastPayPalIntent.providerOrderId}
                            </span>
                          )}
                          <span className="text-muted-foreground">
                            {format(new Date(i.lastPayPalIntent.createdAt), "d MMM HH:mm", { locale: es })}
                          </span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{format(new Date(i.dueAt), "d MMM", { locale: es })}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            )}
          </div>
        </SectionCard>
      </div>

      {/* Pagos */}
      <SectionCard title="Pagos registrados" description="Historial de pagos">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Organización</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Método</TableHead>
                <TableHead>Referencia</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentsData.slice(0, 10).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>{p.organizationName}</TableCell>
                  <TableCell className="font-medium">${p.amount.toLocaleString()}</TableCell>
                  <TableCell>{format(new Date(p.paidAt), "d MMM yyyy", { locale: es })}</TableCell>
                  <TableCell>{p.method}</TableCell>
                  <TableCell className="text-muted-foreground">{p.reference ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </SectionCard>

      {/* Simulador */}
      <SectionCard title="Simulador de pricing" description="Estimación interna">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <Label>Tipo</Label>
            <Select value={simTipo} onValueChange={setSimTipo}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="cooperativa">Cooperativa</SelectItem>
                <SelectItem value="exportador">Exportador</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Plan</Label>
            <Select value={simPlan} onValueChange={setSimPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="lite">Lite</SelectItem>
                <SelectItem value="smart">Smart</SelectItem>
                <SelectItem value="plus">Plus</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Productores / Proveedores</Label>
            <Input type="number" value={simProductores} onChange={(e) => setSimProductores(Number(e.target.value))} />
          </div>
        </div>
        <div className="mt-4 p-4 rounded-lg bg-muted/30">
          <p className="text-sm text-muted-foreground">Base: ${simBase} · Overages: ${simOverages}</p>
          <p className="text-xl font-bold mt-1">Total mensual: ${simTotal}</p>
          <p className="text-sm text-muted-foreground">Total anual (estimado): ${(simTotal * 12).toLocaleString()}</p>
        </div>
      </SectionCard>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setInvoiceDialogOpen(true)}>
          Crear factura manual
        </Button>
        <Button variant="outline" onClick={() => setPaymentDialogOpen(true)}>
          Registrar pago
        </Button>
      </div>

      <CreateInvoiceDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        subscriptions={subscriptionsData}
      />
      <RegisterPaymentDialog
        open={paymentDialogOpen}
        onOpenChange={setPaymentDialogOpen}
        subscriptions={subscriptionsData}
        invoices={invoicesData}
      />
      <InvoiceDetailSheet
        invoiceId={selectedInvoiceId}
        open={!!selectedInvoiceId}
        onOpenChange={(open) => !open && setSelectedInvoiceId(null)}
      />
    </div>
  );
}
