/**
 * PayPal Sandbox — Prueba técnica controlada.
 * Flujo mínimo: crear orden → redirigir a PayPal → retorno → consultar/capturar.
 * Requiere usuario autenticado con organization_id.
 */
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { createPayPalOrder } from '@/services/paypalProxyService';
import { usePaymentIntents } from '@/hooks/usePaymentIntents';
import { Loader2, CreditCard, AlertCircle, History } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

function getErrorMessage(error: string, details?: string, status?: number): string {
  if (status === 401) {
    return 'Sesión inválida o expirada. Iniciá sesión de nuevo.';
  }
  if (status === 403) {
    return 'Tu perfil no tiene organización asignada. Completá el onboarding para usar PayPal.';
  }
  if (details) return details;
  return error || 'Error desconocido';
}

const NO_ORG_MSG = 'Completa la configuración de tu organización para usar pagos.';

export default function PayPalSandboxPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const paypalCancelled = searchParams.get('paypal_cancelled') === '1';
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const hasOrg = Boolean(user?.organizationId);
  const { intents, isLoading: intentsLoading } = usePaymentIntents(10);

  const handleCreateOrder = async () => {
    setStatus('loading');
    setErrorMsg('');

    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    const returnUrl = `${baseUrl}/paypal-sandbox/return`;
    const cancelUrl = `${baseUrl}/paypal-sandbox?paypal_cancelled=1`;

    const result = await createPayPalOrder({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: { currency_code: 'USD', value: '10.00' },
        description: 'Prueba Nova Silva Sandbox',
      }],
      application_context: { return_url: returnUrl, cancel_url: cancelUrl },
    });

    if (!result.ok) {
      setStatus('error');
      setErrorMsg(getErrorMessage(result.error ?? '', result.details, result.status));
      return;
    }

    const data = result.data as { id?: string; links?: Array<{ rel: string; href: string }> };
    const approvalLink = data?.links?.find((l) => l.rel === 'approve');
    const approvalUrl = approvalLink?.href;

    if (!approvalUrl) {
      setStatus('error');
      setErrorMsg('PayPal no devolvió URL de aprobación. Revisá la respuesta.');
      return;
    }

    setStatus('success');
    window.location.href = approvalUrl;
  };

  return (
    <div className="space-y-6">
      <MainHeader
        title="PayPal Sandbox"
        subtitle="Prueba técnica de flujo de pago (sandbox)"
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Crear orden de prueba
          </CardTitle>
          <CardDescription>
            Crea una orden de $10 USD en sandbox y te redirige a PayPal para aprobar.
            Requiere usuario autenticado con organización asignada.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paypalCancelled && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Pago cancelado</AlertTitle>
              <AlertDescription>El pago fue cancelado antes de completarse.</AlertDescription>
            </Alert>
          )}
          {!hasOrg && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuración requerida</AlertTitle>
              <AlertDescription>{NO_ORG_MSG}</AlertDescription>
            </Alert>
          )}
          {status === 'error' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleCreateOrder}
            disabled={status === 'loading' || !hasOrg}
          >
            {status === 'loading' ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando orden…
              </>
            ) : (
              'Crear orden PayPal'
            )}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => navigate('/paypal-invoice')}>
          Pagar factura con PayPal
        </Button>
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Flujo</CardTitle>
          <CardDescription>
            1. Crear orden → 2. Aprobar en PayPal → 3. Volver y capturar
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>Al volver de PayPal, podrás consultar el estado de la orden y capturarla.</p>
        </CardContent>
      </Card>

      {hasOrg && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5" />
              Intentos recientes
            </CardTitle>
            <CardDescription>
              Trazabilidad interna de create/get/capture
            </CardDescription>
          </CardHeader>
          <CardContent>
            {intentsLoading ? (
              <p className="text-sm text-muted-foreground">Cargando…</p>
            ) : intents.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aún no hay intentos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Order ID</th>
                      <th className="text-left p-2">Tipo</th>
                      <th className="text-left p-2">Amount</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2">Fecha</th>
                    </tr>
                  </thead>
                  <tbody>
                    {intents.map((i) => (
                      <tr key={i.id} className="border-b last:border-0">
                        <td className="p-2 font-mono text-xs">{i.providerOrderId ?? '—'}</td>
                        <td className="p-2">{i.description ?? i.intentType}</td>
                        <td className="p-2">{i.amount != null ? `${i.amount} ${i.currency ?? ''}` : '—'}</td>
                        <td className="p-2">{i.status}</td>
                        <td className="p-2 text-muted-foreground">{new Date(i.createdAt).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
