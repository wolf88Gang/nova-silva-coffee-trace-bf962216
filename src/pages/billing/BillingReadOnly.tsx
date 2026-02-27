/**
 * Billing / Plan — Read-only view.
 * Reads from billing_subscriptions (RLS: SELECT only, filtered by org_id).
 * No write operations — no INSERT/UPDATE/DELETE policies exist.
 */
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Calendar, Package, AlertCircle } from 'lucide-react';

interface BillingSubscription {
  id: string;
  plan_name: string | null;
  status: string | null;
  billing_cycle: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  modules_included: string[] | null;
  created_at: string | null;
}

export default function BillingReadOnly() {
  const { organizationId, isReady } = useOrgContext();
  const [subscription, setSubscription] = useState<BillingSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady || !organizationId) return;

    const fetchBilling = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fetchErr } = await supabase
          .from('billing_subscriptions' as any)
          .select('*')
          .eq('org_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (fetchErr) {
          // Table might not exist or RLS blocks — graceful fallback
          console.warn('[BillingReadOnly] Query error:', fetchErr.message);
          setError('No se pudo cargar la información del plan.');
        } else {
          setSubscription(data as BillingSubscription | null);
        }
      } catch (err) {
        setError('Error de conexión.');
      } finally {
        setLoading(false);
      }
    };

    fetchBilling();
  }, [organizationId, isReady]);

  if (loading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Mi Plan</h1>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-20 w-full" /></CardContent></Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !subscription) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Mi Plan</h1>
        <Card>
          <CardContent className="py-12 text-center space-y-3">
            <AlertCircle className="h-10 w-10 mx-auto text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">
              {error || 'No hay información de suscripción disponible para tu organización.'}
            </p>
            <p className="text-xs text-muted-foreground">
              Contacta al equipo de Nova Silva para más detalles sobre tu plan.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Activo', variant: 'default' },
    trial: { label: 'Prueba', variant: 'secondary' },
    past_due: { label: 'Pago pendiente', variant: 'destructive' },
    cancelled: { label: 'Cancelado', variant: 'outline' },
  };
  const statusInfo = statusMap[subscription.status || ''] || { label: subscription.status || 'Desconocido', variant: 'secondary' as const };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-foreground">Mi Plan</h1>
        <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCard className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Plan</span>
            </div>
            <p className="text-xl font-bold text-foreground">{subscription.plan_name || '—'}</p>
            <p className="text-xs text-muted-foreground mt-1 capitalize">
              Ciclo: {subscription.billing_cycle || '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Período actual</span>
            </div>
            <p className="text-sm font-medium text-foreground">
              {subscription.current_period_start
                ? new Date(subscription.current_period_start).toLocaleDateString('es')
                : '—'}
              {' → '}
              {subscription.current_period_end
                ? new Date(subscription.current_period_end).toLocaleDateString('es')
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5 pb-4">
            <div className="flex items-center gap-2 mb-2">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Módulos incluidos</span>
            </div>
            {subscription.modules_included && subscription.modules_included.length > 0 ? (
              <div className="flex flex-wrap gap-1 mt-1">
                {subscription.modules_included.map(mod => (
                  <Badge key={mod} variant="outline" className="text-xs">{mod}</Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        Esta información es de solo lectura. Para cambios en tu plan, contacta al equipo de Nova Silva.
      </p>
    </div>
  );
}
