/**
 * Sheet lateral: detalle de factura con conciliación PayPal.
 * Muestra invoice, intentos PayPal, pagos y estado conciliado.
 * Botón "Pagar con PayPal" cuando la factura es pagable.
 */

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useInvoiceDetail } from '@/hooks/admin/useInvoiceDetail';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { createPayPalInvoiceOrder } from '@/services/paypalProxyService';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Loader2, CreditCard, AlertCircle } from 'lucide-react';

const INVOICE_STATUS_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  paid: 'success',
  sent: 'warning',
  overdue: 'danger',
  draft: 'neutral',
  cancelled: 'neutral',
};

const RECONCILIATION_LABELS: Record<string, string> = {
  sin_intento: 'Sin intento PayPal',
  intento_creado: 'Intento creado',
  capturado: 'Capturado',
  pago_registrado: 'Pago registrado',
  invoice_paid: 'Factura pagada',
};

const RECONCILIATION_VARIANT: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
  sin_intento: 'neutral',
  intento_creado: 'warning',
  capturado: 'warning',
  pago_registrado: 'success',
  invoice_paid: 'success',
};

interface InvoiceDetailSheetProps {
  invoiceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function getPayPalErrorMessage(error: string, details?: string, status?: number): string {
  if (status === 401) return 'Sesión inválida o expirada. Iniciá sesión de nuevo.';
  if (status === 403) return 'Sin permiso para esta factura.';
  if (status === 404) return 'Factura no encontrada.';
  if (error === 'Invoice already paid') return 'Esta factura ya está pagada.';
  if (error === 'Invoice void') return 'Esta factura está anulada.';
  if (details) return details;
  return error || 'Error desconocido';
}

export function InvoiceDetailSheet({ invoiceId, open, onOpenChange }: InvoiceDetailSheetProps) {
  const queryClient = useQueryClient();
  const { data, isLoading, isError } = useInvoiceDetail(open ? invoiceId : null);
  const [payStatus, setPayStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [payError, setPayError] = useState('');

  const canPayWithPayPal =
    data &&
    data.status !== 'paid' &&
    data.status !== 'cancelled' &&
    !['capturado', 'pago_registrado', 'invoice_paid'].includes(data.reconciliationStatus);

  const handlePayWithPayPal = async () => {
    if (!data?.id || !canPayWithPayPal) return;
    setPayStatus('loading');
    setPayError('');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const returnUrl = `${baseUrl}/paypal-sandbox/return`;
    const cancelUrl = `${baseUrl}/admin/billing`;
    const result = await createPayPalInvoiceOrder({
      invoiceId: data.id,
      returnUrl,
      cancelUrl,
    });
    if (!result.ok) {
      setPayStatus('error');
      setPayError(getPayPalErrorMessage(result.error ?? '', result.details, result.status));
      return;
    }
    const paypalData = result.data as { links?: Array<{ rel: string; href: string }> };
    const approvalUrl = paypalData?.links?.find((l) => l.rel === 'approve')?.href;
    if (!approvalUrl) {
      setPayStatus('error');
      setPayError('PayPal no devolvió URL de aprobación.');
      return;
    }
    queryClient.invalidateQueries({ queryKey: ['admin_invoice_detail', data.id] });
    queryClient.invalidateQueries({ queryKey: ['admin_invoices'] });
    window.location.href = approvalUrl;
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Detalle de factura</SheetTitle>
          <SheetDescription>
            Estado, intentos PayPal y pagos asociados
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {isLoading && (
            <p className="py-8 text-center text-muted-foreground text-sm">Cargando…</p>
          )}
          {isError && (
            <p className="py-8 text-center text-destructive text-sm">Error al cargar el detalle</p>
          )}
          {!isLoading && !isError && !data && (
            <p className="py-8 text-center text-muted-foreground text-sm">Factura no encontrada</p>
          )}
          {data && (
            <>
              {/* Datos de la factura */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Factura</h3>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Número</dt>
                  <dd className="font-mono">{data.number}</dd>
                  <dt className="text-muted-foreground">ID</dt>
                  <dd className="font-mono text-xs truncate" title={data.id}>{data.id.slice(0, 8)}…</dd>
                  <dt className="text-muted-foreground">Organización</dt>
                  <dd>{data.organizationName}</dd>
                  <dt className="text-muted-foreground">Monto</dt>
                  <dd className="font-medium">{data.currency} {data.amount.toLocaleString()}</dd>
                  <dt className="text-muted-foreground">Estado</dt>
                  <dd>
                    <StatusBadge
                      label={data.status}
                      variant={INVOICE_STATUS_VARIANT[data.status] ?? 'neutral'}
                    />
                  </dd>
                  <dt className="text-muted-foreground">Conciliación</dt>
                  <dd>
                    <StatusBadge
                      label={RECONCILIATION_LABELS[data.reconciliationStatus] ?? data.reconciliationStatus}
                      variant={RECONCILIATION_VARIANT[data.reconciliationStatus] ?? 'neutral'}
                    />
                  </dd>
                  {data.issuedAt && (
                    <>
                      <dt className="text-muted-foreground">Emitida</dt>
                      <dd>{format(new Date(data.issuedAt), "d MMM yyyy", { locale: es })}</dd>
                    </>
                  )}
                  {data.dueAt && (
                    <>
                      <dt className="text-muted-foreground">Vencimiento</dt>
                      <dd>{format(new Date(data.dueAt), "d MMM yyyy", { locale: es })}</dd>
                    </>
                  )}
                  {data.paidAt && (
                    <>
                      <dt className="text-muted-foreground">Pagada</dt>
                      <dd>{format(new Date(data.paidAt), "d MMM yyyy HH:mm", { locale: es })}</dd>
                    </>
                  )}
                </dl>
              </div>

              {/* Pagar con PayPal */}
              {payStatus === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{payError}</AlertDescription>
                </Alert>
              )}
              {canPayWithPayPal && (
                <div className="pt-2">
                  <Button
                    onClick={handlePayWithPayPal}
                    disabled={payStatus === 'loading'}
                  >
                    {payStatus === 'loading' ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creando orden…
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Pagar con PayPal
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Intentos PayPal */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Intentos PayPal</h3>
                {data.paymentIntents.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Sin intentos PayPal</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Estado</TableHead>
                        <TableHead>Order ID</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.paymentIntents.map((pi) => (
                        <TableRow key={pi.id}>
                          <TableCell>
                            <StatusBadge
                              label={pi.isCaptured ? 'Capturado' : pi.status}
                              variant={pi.isCaptured ? 'success' : 'warning'}
                            />
                          </TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[140px]" title={pi.providerOrderId ?? ''}>
                            {pi.providerOrderId ?? '—'}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {format(new Date(pi.createdAt), "d MMM HH:mm", { locale: es })}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>

              {/* Pagos */}
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">Pagos registrados</h3>
                {data.payments.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">Sin pagos registrados</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Referencia</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data.payments.map((p) => (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">${p.amount.toLocaleString()}</TableCell>
                          <TableCell>{p.method}</TableCell>
                          <TableCell className="text-muted-foreground text-xs">
                            {format(new Date(p.paidAt), "d MMM yyyy", { locale: es })}
                          </TableCell>
                          <TableCell className="font-mono text-xs truncate max-w-[100px]" title={p.reference ?? ''}>
                            {p.reference ?? '—'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
