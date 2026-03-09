import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrgContext } from '@/hooks/useOrgContext';
import { useUpdateQuoteStatus } from '@/hooks/useQuoteMutations';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  ShoppingCart, FileText, CheckCircle, Plus, MoreVertical, Send, Ban, PackageCheck
} from 'lucide-react';

import NewQuoteForm from './NewQuoteForm';

interface Quote {
  id: string; plan_id: string; supplier_id: string | null; quote_status: string;
  quote_json: any; created_at: string;
}
interface Supplier { id: string; nombre: string; }

const STATUS_STYLES: Record<string, string> = {
  draft: 'bg-muted text-muted-foreground',
  sent: 'bg-primary/10 text-primary',
  accepted: 'bg-success/10 text-success',
  fulfilled: 'bg-success/10 text-success',
  expired: 'bg-destructive/10 text-destructive',
  cancelled: 'bg-destructive/10 text-destructive',
};

const TRANSITIONS: Record<string, { label: string; status: string; icon: typeof Send }[]> = {
  draft: [
    { label: 'Enviar', status: 'sent', icon: Send },
    { label: 'Cancelar', status: 'cancelled', icon: Ban },
  ],
  sent: [
    { label: 'Aceptar', status: 'accepted', icon: CheckCircle },
    { label: 'Cancelar', status: 'cancelled', icon: Ban },
  ],
  accepted: [
    { label: 'Marcar cumplida', status: 'fulfilled', icon: PackageCheck },
    { label: 'Cancelar', status: 'cancelled', icon: Ban },
  ],
};

export default function CotizacionTab() {
  const { organizationId } = useOrgContext();
  const [showNewQuote, setShowNewQuote] = useState(false);
  const updateStatus = useUpdateQuoteStatus();

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['ag_quotes', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_my_quotes' as any);
      if (error) throw error;
      return (data ?? []) as Quote[];
    },
    enabled: !!organizationId,
  });

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
              onSuccess={() => setShowNewQuote(false)}
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
              Genera una cotización a partir de un plan de nutrición para obtener precios de proveedores.
            </p>
            <Button size="sm" onClick={() => setShowNewQuote(true)}>
              <Plus className="h-4 w-4 mr-1" /> Primera cotización
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Accordion type="single" collapsible className="space-y-2">
          {quotes.map(q => {
            const actions = TRANSITIONS[q.quote_status] ?? [];
            return (
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
                      {actions.length > 0 && (
                        <div className="flex justify-end pt-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreVertical className="h-4 w-4 mr-1" /> Acciones
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {actions.map(a => (
                                <DropdownMenuItem
                                  key={a.status}
                                  onClick={() => updateStatus.mutate({ quote_id: q.id, new_status: a.status })}
                                  disabled={updateStatus.isPending}
                                >
                                  <a.icon className="h-4 w-4 mr-2" /> {a.label}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">Sin detalle de cotización.</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      )}
    </div>
  );
}
