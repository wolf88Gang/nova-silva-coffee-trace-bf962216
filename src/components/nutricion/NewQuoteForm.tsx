import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateQuote } from '@/hooks/useQuoteMutations';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  Store, MapPin, CheckCircle, Loader2, Truck, DollarSign, Plus, Trash2
} from 'lucide-react';

interface Plan { id: string; parcela_id: string; ciclo: string; status: string }
interface Supplier { id: string; nombre: string; pais: string | null; provincia: string | null; commission_pct_default: number }
interface LineItem { product: string; qty: number; unit: string; unit_price: number }

interface Props {
  organizationId: string | null;
  onSuccess: () => void;
}

export default function NewQuoteForm({ organizationId, onSuccess }: Props) {
  const [planId, setPlanId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<LineItem[]>([{ product: '', qty: 1, unit: 'kg', unit_price: 0 }]);

  const createQuote = useCreateQuote(onSuccess);

  const { data: plans } = useQuery({
    queryKey: ['nutricion_planes_for_quote', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('nutricion_planes')
        .select('id, parcela_id, ciclo, status')
        .eq('organization_id', organizationId!)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as Plan[];
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

  const updateItem = (idx: number, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  const addItem = () => setItems(prev => [...prev, { product: '', qty: 1, unit: 'kg', unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx));

  const validItems = items.filter(it => it.product && it.qty > 0 && it.unit_price > 0);
  const canSubmit = planId && supplierId && validItems.length > 0;

  const handleSubmit = () => {
    if (!canSubmit) return;
    createQuote.mutate({ plan_id: planId, supplier_id: supplierId, items_json: validItems });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecciona un plan, un proveedor y agrega los productos para generar la cotización.
      </p>

      {/* Plan selector */}
      <div>
        <Label>Plan de Nutrición *</Label>
        <Select value={planId} onValueChange={setPlanId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar plan" /></SelectTrigger>
          <SelectContent>
            {plans?.map(p => (
              <SelectItem key={p.id} value={p.id}>{p.ciclo} — {p.status}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Supplier selector */}
      <div>
        <Label>Proveedor *</Label>
        <Select value={supplierId} onValueChange={setSupplierId}>
          <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
          <SelectContent>
            {suppliers?.map(s => (
              <SelectItem key={s.id} value={s.id}>
                <div className="flex items-center gap-2">
                  <Store className="h-3 w-3 text-muted-foreground" />
                  {s.nombre}
                  <span className="text-xs text-muted-foreground">({(s.commission_pct_default * 100).toFixed(1)}%)</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Line items */}
      <div>
        <Label>Productos *</Label>
        <div className="space-y-2 mt-1">
          {items.map((it, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <Input
                placeholder="Producto"
                value={it.product}
                onChange={e => updateItem(idx, 'product', e.target.value)}
                className="flex-1"
              />
              <Input
                type="number"
                placeholder="Cant."
                value={it.qty}
                onChange={e => updateItem(idx, 'qty', parseFloat(e.target.value) || 0)}
                className="w-20"
              />
              <Input
                placeholder="Unidad"
                value={it.unit}
                onChange={e => updateItem(idx, 'unit', e.target.value)}
                className="w-20"
              />
              <Input
                type="number"
                placeholder="P. Unit."
                value={it.unit_price}
                onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                className="w-24"
              />
              {items.length > 1 && (
                <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          ))}
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3 w-3 mr-1" /> Agregar producto
          </Button>
        </div>
      </div>

      <Button onClick={handleSubmit} disabled={!canSubmit || createQuote.isPending} className="w-full">
        {createQuote.isPending
          ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Creando cotización…</>
          : <><DollarSign className="h-4 w-4 mr-1" /> Crear Cotización</>}
      </Button>
    </div>
  );
}
