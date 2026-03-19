/**
 * PayPal Invoice Payment — Pagar factura con PayPal (sandbox).
 * Flujo: seleccionar invoice → crear orden → PayPal → return → capture.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createPayPalInvoiceOrder } from '@/services/paypalProxyService';
import { fetchInvoicesByOrg } from '@/repositories/invoicesRepository';
import { Loader2, CreditCard, AlertCircle, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const NO_ORG_MSG = 'Completa la configuración de tu organización para usar pagos.';

function getErrorMessage(error: string, details?: string, status?: number): string {
  if (status === 401) return 'Sesión inválida o expirada. Iniciá sesión de nuevo.';
  if (status === 403) return 'La factura no pertenece a tu organización o falta completar perfil.';
  if (status === 404) return 'Factura no encontrada.';
  if (error === 'Invoice already paid') return 'Esta factura ya está pagada.';
  if (error === 'Invoice void') return 'Esta factura está anulada.';
  if (details) return details;
  return error || 'Error desconocido';
}

export default function PayPalInvoicePaymentPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const hasOrg = Boolean(user?.organizationId);

  const { data: invoices = [], isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices_by_org', user?.organizationId],
    queryFn: () => fetchInvoicesByOrg(user!.organizationId!, 50),
    enabled: !!user?.organizationId,
  });

  const payableInvoices = invoices.filter((i) =>
    ['issued', 'overdue', 'draft'].includes(i.status)
  );

  const handlePayWithPayPal = async () => {
    if (!selectedId || !hasOrg) return;
    setStatus('loading');
    setErrorMsg('');
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const returnUrl = `${baseUrl}/paypal-sandbox/return`;
    const cancelUrl = `${baseUrl}/paypal-invoice`;
    const result = await createPayPalInvoiceOrder({
      invoiceId: selectedId,
      returnUrl,
      cancelUrl,
    });
    if (!result.ok) {
      setStatus('error');
      setErrorMsg(getErrorMessage(result.error ?? '', result.details, result.status));
      return;
    }
    const data = result.data as { links?: Array<{ rel: string; href: string }> };
    const approvalUrl = data?.links?.find((l) => l.rel === 'approve')?.href;
    if (!approvalUrl) {
      setStatus('error');
      setErrorMsg('PayPal no devolvió URL de aprobación.');
      return;
    }
    window.location.href = approvalUrl;
  };

  return (
    <div className="space-y-6">
      <MainHeader
        title="Pagar factura con PayPal"
        subtitle="Seleccioná una factura y pagala con PayPal (sandbox)"
      />

      {!hasOrg && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuración requerida</AlertTitle>
          <AlertDescription>{NO_ORG_MSG}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Facturas disponibles
          </CardTitle>
          <CardDescription>
            Solo facturas con estado issued, overdue o draft. Pagadas y anuladas no aparecen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          {invoicesLoading ? (
            <p className="text-sm text-muted-foreground">Cargando facturas…</p>
          ) : payableInvoices.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No hay facturas pendientes de pago. Creá una desde el panel admin.
            </p>
          ) : (
            <div className="space-y-2">
              {payableInvoices.map((inv) => (
                <div
                  key={inv.id}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedId === inv.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => hasOrg && setSelectedId(inv.id)}
                >
                  <div>
                    <span className="font-medium">{inv.invoice_number ?? inv.id.slice(0, 8)}</span>
                    <span className="text-muted-foreground ml-2">
                      {inv.total_amount} {inv.currency}
                    </span>
                    <span className="text-muted-foreground ml-2">
                      {inv.due_at ? format(new Date(inv.due_at), 'd MMM yyyy', { locale: es }) : '—'}
                    </span>
                    <span className="ml-2 text-xs px-2 py-0.5 rounded bg-muted">{inv.status}</span>
                  </div>
                </div>
              ))}
              {selectedId && (
                <div className="pt-4 border-t">
                  <Button
                    onClick={handlePayWithPayPal}
                    disabled={status === 'loading'}
                  >
                    {status === 'loading' ? (
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
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/paypal-sandbox')}>
          Sandbox prueba
        </Button>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </div>
    </div>
  );
}
