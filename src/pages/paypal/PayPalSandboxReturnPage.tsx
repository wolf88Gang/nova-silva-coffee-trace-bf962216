/**
 * PayPal Sandbox — Página de retorno tras aprobar en PayPal.
 * Lee order ID de ?token= y permite consultar/capturar.
 */
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { MainHeader } from '@/components/layout/MainHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useQueryClient } from '@tanstack/react-query';
import { capturePayPalOrder, getPayPalOrder } from '@/services/paypalProxyService';
import { Loader2, CheckCircle, AlertCircle, RefreshCw, CreditCard } from 'lucide-react';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface PayPalOrderSummary {
  id?: string;
  status?: string;
  amount?: string;
  currency?: string;
  isCaptured?: boolean;
}

function extractOrderSummary(data: unknown): PayPalOrderSummary | null {
  if (!data || typeof data !== 'object') return null;
  const o = data as Record<string, unknown>;
  const status = o.status as string | undefined;
  let amount: string | undefined;
  let currency: string | undefined;
  let isCaptured: boolean;

  const units = o.purchase_units as Array<Record<string, unknown>> | undefined;
  const firstUnit = units?.[0];
  if (firstUnit) {
    const amountObj = firstUnit.amount as Record<string, string> | undefined;
    amount = amountObj?.value;
    currency = amountObj?.currency_code;
    const captures = firstUnit.payments as Record<string, unknown> | undefined;
    const captureList = captures?.captures as Array<Record<string, unknown>> | undefined;
    const hasCapture = Array.isArray(captureList) && captureList.length > 0;
    isCaptured = status === 'COMPLETED' || hasCapture;
  } else {
    const amountObj = o.amount as Record<string, string> | undefined;
    amount = amountObj?.value;
    currency = amountObj?.currency_code;
    isCaptured = status === 'COMPLETED';
  }
  return {
    id: o.id as string | undefined,
    status: status ?? (isCaptured ? 'COMPLETED' : undefined),
    amount,
    currency,
    isCaptured,
  };
}

function getErrorMessage(error: string, details?: string, status?: number): string {
  if (status === 401) return 'Sesión inválida o expirada. Iniciá sesión de nuevo.';
  if (status === 403) return 'Tu perfil no tiene organización asignada. Completá el onboarding.';
  if (details) return details;
  return error || 'Error desconocido';
}

const NO_ORG_MSG = 'Completa la configuración de tu organización para usar pagos.';

export default function PayPalSandboxReturnPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('token') || searchParams.get('orderId') || '';
  const hasOrg = Boolean(user?.organizationId);

  const [getStatus, setGetStatus] = useState<Status>('idle');
  const [captureStatus, setCaptureStatus] = useState<Status>('idle');
  const [orderData, setOrderData] = useState<unknown>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const summary = orderData ? extractOrderSummary(orderData) : null;
  const isOrderCaptured = summary?.isCaptured ?? false;

  const handleGetOrder = async () => {
    if (!orderId) return;
    setGetStatus('loading');
    setErrorMsg('');
    const result = await getPayPalOrder(orderId);
    if (!result.ok) {
      setGetStatus('error');
      setErrorMsg(getErrorMessage(result.error ?? '', result.details, result.status));
      return;
    }
    setOrderData(result.data);
    setGetStatus('success');
  };

  const handleCapture = async () => {
    if (!orderId) return;
    setCaptureStatus('loading');
    setErrorMsg('');
    const result = await capturePayPalOrder(orderId);
    if (!result.ok) {
      setCaptureStatus('error');
      setErrorMsg(getErrorMessage(result.error ?? '', result.details, result.status));
      return;
    }
    setCaptureStatus('success');
    const getResult = await getPayPalOrder(orderId);
    if (getResult.ok) setOrderData(getResult.data);
    else setOrderData(result.data);
    queryClient.invalidateQueries({ queryKey: ['payment_intents'] });
    queryClient.invalidateQueries({ queryKey: ['invoices_by_org'] });
    queryClient.invalidateQueries({ queryKey: ['admin_invoices'] });
    queryClient.invalidateQueries({ predicate: (q) => q.queryKey[0] === 'admin_invoice_detail' });
  };

  useEffect(() => {
    if (!orderId || !user?.organizationId) return;
    const fetchOrder = async () => {
      setGetStatus('loading');
      setErrorMsg('');
      const result = await getPayPalOrder(orderId);
      if (!result.ok) {
        setGetStatus('error');
        setErrorMsg(getErrorMessage(result.error ?? '', result.details, result.status));
        return;
      }
      setOrderData(result.data);
      setGetStatus('success');
    };
    fetchOrder();
  }, [orderId, user?.organizationId]);

  if (!orderId) {
    return (
      <div className="space-y-6">
        <MainHeader title="PayPal Sandbox — Retorno" subtitle="No se encontró order ID" />
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Falta order ID</AlertTitle>
          <AlertDescription>
            PayPal no devolvió el token en la URL. Volvé a crear una orden desde la página de inicio.
          </AlertDescription>
        </Alert>
        <Button onClick={() => navigate('/paypal-sandbox')}>Volver a crear orden</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <MainHeader
        title="PayPal Sandbox — Retorno"
        subtitle={`Orden: ${orderId}`}
      />

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Orden aprobada
          </CardTitle>
          <CardDescription>
            Consultá el estado o capturá el pago para completar la transacción.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!hasOrg && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Configuración requerida</AlertTitle>
              <AlertDescription>{NO_ORG_MSG}</AlertDescription>
            </Alert>
          )}
          {errorMsg && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{errorMsg}</AlertDescription>
            </Alert>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={handleGetOrder}
              disabled={getStatus === 'loading' || !hasOrg}
            >
              {getStatus === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Consultar orden
            </Button>
            <Button
              onClick={handleCapture}
              disabled={captureStatus === 'loading' || !hasOrg || isOrderCaptured}
            >
              {captureStatus === 'loading' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="h-4 w-4" />
              )}
              Capturar orden
            </Button>
          </div>

          {isOrderCaptured && (
            <p className="text-sm text-muted-foreground">Esta orden ya fue capturada.</p>
          )}

          {orderData && (
            <>
              {summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Resumen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="grid grid-cols-[120px_1fr] gap-2">
                      <span className="text-muted-foreground">Order ID</span>
                      <span className="font-mono">{summary.id ?? orderId}</span>
                      <span className="text-muted-foreground">Status</span>
                      <span>{summary.status ?? '—'}</span>
                      <span className="text-muted-foreground">Amount</span>
                      <span>{summary.amount ?? '—'}</span>
                      <span className="text-muted-foreground">Currency</span>
                      <span>{summary.currency ?? '—'}</span>
                      <span className="text-muted-foreground">Captured</span>
                      <span>{summary.isCaptured ? 'Sí' : 'No'}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Respuesta técnica</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="text-xs bg-muted p-4 rounded overflow-auto max-h-64">
                    {JSON.stringify(orderData, null, 2)}
                  </pre>
                </CardContent>
              </Card>
            </>
          )}
        </CardContent>
      </Card>

      <div className="flex gap-2">
        <Button variant="outline" onClick={() => navigate('/paypal-sandbox')}>
          Nueva orden
        </Button>
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          Volver al dashboard
        </Button>
      </div>
    </div>
  );
}
