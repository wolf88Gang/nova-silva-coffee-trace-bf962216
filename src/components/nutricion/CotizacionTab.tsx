import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  ShoppingCart, Store, MapPin, DollarSign, Loader2,
  FileText, Truck, CheckCircle, Clock, Plus
} from 'lucide-react';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co';

interface Plan { id: string; parcela_id: string; ciclo: string; status: string; }
interface Supplier { id: string; nombre: string; pais: string | null; provincia: string | null; commission_pct_default: number; }
interface Quote {
  id: string; plan_id: string; supplier_id: string | null; quote_status: string;
  quote_json: any; created_at: string;
}

interface SuggestedSupplier {
  id: string; nombre: string; distance_km: number; product_count: number;
  commission_pct_default: number;
}

interface QuoteResult {
  cached?: boolean;
  quote_id: string;
  suggested_suppliers?: SuggestedSupplier[];
  quote?: {
    lines: Array<{ product: string; qty: number; unit: string; unit_price: number; total: number }>;
    subtotal: number; commission_pct: number; commission_amount: number; total: number;
  };
}

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/10 text-primary',
  accepted: 'bg-success/10 text-success',
  fulfilled: 'bg-success/10 text-success',
  expired: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-destructive/10 text-destructive',
};

export default function CotizacionTab() {
  const { organizationId } = useOrgContext();
  const queryClient = useQueryClient();
  const [showNewQuote, setShowNewQuote] = useState(false);

  // Fetch existing quotes via RPC
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['ag_quotes', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_quotes' as any);
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
    enabled: !!organizationId,
  });

  // Fetch suppliers via RPC
  const { data: suppliers } = useQuery({
    queryKey: ['ag_suppliers', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_suppliers' as any);
      if (error) throw error;
      return (data ?? []) as Supplier[];
    },
    enabled: !!organizationId,
  });

  const supplierName = (id: string | null) => suppliers?.find(s => s.id === id)?.nombre ?? 'Sin proveedor';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Cotizaciones de insumos vinculadas a planes de nutrición</p>
        <Dialog open={showNewQuote} onOpenChange={setShowNewQuote}>
          <DialogTrigger asChild>
            <Button size="sm"><ShoppingCart className="h-4 w-4 mr-1" /> Nueva Cotización</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Cotizar Insumos</DialogTitle></DialogHeader>
            <NewQuoteForm
              organizationId={organizationId}
              onSuccess={() => {
                setShowNewQuote(false);
                queryClient.invalidateQueries({ queryKey: ['ag_quotes'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1, 2].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : !quotes?.length ? (
        <Card>
          <CardContent className="p-8 text-center">
            <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <h3 className="text-lg font-medium text-foreground mb-1">Sin cotizaciones</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Genera una cotización a partir de un plan de nutrición para obtener precios de proveedores cercanos.
            </p>
            <Button size="sm" onClick={() => setShowNewQuote(true)}>
              <Plus className="h-4 w-4 mr-1" /> Primera cotización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {quotes.map(q => (
            <AccordionItem key={q.id} value={q.id} className="border rounded-lg">
              <AccordionTrigger className="px-4 py-3 hover:no-underline">
                <div className="flex items-center gap-3 w-full mr-2">
                  <FileText className="h-5 w-5 text-primary shrink-0" />
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium">{supplierName(q.supplier_id)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(q.created_at).toLocaleDateString('es')}
                      {q.quote_json?.total && ` — $${q.quote_json.total.toFixed(2)}`}
                    </p>
                  </div>
                  <Badge variant="outline" className={STATUS_STYLES[q.quote_status] ?? ''}>
                    {q.quote_status}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                {q.quote_json?.lines ? (
                  <div className="space-y-3">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Producto</TableHead>
                          <TableHead className="text-right">Cant.</TableHead>
                          <TableHead className="text-right">P. Unit.</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {q.quote_json.lines.map((l: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="text-sm">{l.product}</TableCell>
                            <TableCell className="text-right text-sm">{l.qty} {l.unit}</TableCell>
                            <TableCell className="text-right text-sm">${l.unit_price?.toFixed(2)}</TableCell>
                            <TableCell className="text-right text-sm font-medium">${l.total?.toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                    <div className="flex justify-end gap-4 text-sm pt-2 border-t border-border">
                      <span className="text-muted-foreground">Subtotal: ${q.quote_json.subtotal?.toFixed(2)}</span>
                      <span className="text-muted-foreground">Comisión: ${q.quote_json.commission_amount?.toFixed(2)}</span>
                      <span className="font-bold text-foreground">Total: ${q.quote_json.total?.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin detalle de cotización.</p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}

/* ── New Quote Form ── */
function NewQuoteForm({ organizationId, onSuccess }: { organizationId: string | null; onSuccess: () => void }) {
  const [planId, setPlanId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [step, setStep] = useState<'select_plan' | 'select_supplier' | 'done'>('select_plan');
  const [suggestedSuppliers, setSuggestedSuppliers] = useState<SuggestedSupplier[]>([]);
  const [quoteResult, setQuoteResult] = useState<QuoteResult | null>(null);

  // Fetch active plans
  const { data: plans } = useQuery({
    queryKey: ['nutricion_planes_for_quote', organizationId],
    queryFn: async () => {
      let q = supabase.from('nutricion_planes').select('id, parcela_id, ciclo, status');
      q = applyOrgFilter(q, organizationId);
      const { data, error } = await q.order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Plan[];
    },
    enabled: !!organizationId,
  });

  // Step 1: Get suggested suppliers
  const suggestMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');
      const res = await fetch(`${SUPABASE_URL}/functions/v1/quote_nutrition_inputs_v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': session.access_token,
        },
        body: JSON.stringify({ plan_id: planId, idempotency_key: `suggest_${planId}` }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      return await res.json() as QuoteResult;
    },
    onSuccess: (data) => {
      if (data.suggested_suppliers?.length) {
        setSuggestedSuppliers(data.suggested_suppliers);
        setStep('select_supplier');
      } else {
        toast.info('No se encontraron proveedores cercanos. Registra proveedores primero.');
      }
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  // Step 2: Generate quote with selected supplier
  const quoteMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No hay sesión activa');
      const res = await fetch(`${SUPABASE_URL}/functions/v1/quote_nutrition_inputs_v1`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': session.access_token,
        },
        body: JSON.stringify({
          plan_id: planId,
          supplier_id: supplierId,
          idempotency_key: `quote_${planId}_${supplierId}`,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error ${res.status}`);
      }
      return await res.json() as QuoteResult;
    },
    onSuccess: (data) => {
      setQuoteResult(data);
      setStep('done');
      toast.success('Cotización generada');
      onSuccess();
    },
    onError: (e: any) => toast.error(`Error: ${e.message}`),
  });

  if (step === 'done' && quoteResult?.quote) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-success">
          <CheckCircle className="h-5 w-5" />
          <span className="font-medium">Cotización generada exitosamente</span>
        </div>
        <div className="text-2xl font-bold text-foreground text-center py-4">
          ${quoteResult.quote.total.toFixed(2)}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          {quoteResult.quote.lines.length} productos · Comisión {(quoteResult.quote.commission_pct * 100).toFixed(1)}%
        </p>
      </div>
    );
  }

  if (step === 'select_supplier') {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">Proveedores sugeridos por proximidad geográfica:</p>
        <div className="space-y-2">
          {suggestedSuppliers.map(s => (
            <Card
              key={s.id}
              className={`cursor-pointer transition-all ${supplierId === s.id ? 'ring-2 ring-primary' : 'hover:shadow-md'}`}
              onClick={() => setSupplierId(s.id)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <Store className="h-5 w-5 text-primary shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{s.nombre}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span><MapPin className="h-3 w-3 inline mr-0.5" />{s.distance_km.toFixed(1)} km</span>
                    <span>{s.product_count} productos</span>
                    <span>Comisión {(s.commission_pct_default * 100).toFixed(1)}%</span>
                  </div>
                </div>
                {supplierId === s.id && <CheckCircle className="h-5 w-5 text-primary" />}
              </CardContent>
            </Card>
          ))}
        </div>
        <Button
          onClick={() => quoteMutation.mutate()}
          disabled={!supplierId || quoteMutation.isPending}
          className="w-full"
        >
          {quoteMutation.isPending
            ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generando cotización…</>
            : <><DollarSign className="h-4 w-4 mr-1" /> Cotizar con proveedor seleccionado</>}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecciona un plan de nutrición para buscar proveedores cercanos y generar una cotización automática de insumos.
      </p>
      <div>
        <Label>Plan de Nutrición *</Label>
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
          <SelectContent>
            {plans?.map(p => (
              <SelectItem key={p.id} value={p.id}>
                {p.ciclo} — {p.status}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button
        onClick={() => suggestMutation.mutate()}
        disabled={!planId || suggestMutation.isPending}
        className="w-full"
      >
        {suggestMutation.isPending
          ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Buscando proveedores…</>
          : <><Truck className="h-4 w-4 mr-1" /> Buscar proveedores cercanos</>}
      </Button>
    </div>
  );
}
