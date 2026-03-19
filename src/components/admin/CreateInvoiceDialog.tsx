/**
 * Diálogo para crear factura manual.
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminCreateInvoice } from '@/hooks/admin/useAdminCreateInvoice';
import type { AdminSubscription } from '@/types/admin';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';

interface CreateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: AdminSubscription[];
}

const defaultPeriod = () => {
  const now = new Date();
  const start = startOfMonth(subMonths(now, 1));
  const end = endOfMonth(subMonths(now, 1));
  return {
    start: format(start, 'yyyy-MM-dd'),
    end: format(end, 'yyyy-MM-dd'),
  };
};

export function CreateInvoiceDialog({
  open,
  onOpenChange,
  subscriptions,
}: CreateInvoiceDialogProps) {
  const period = defaultPeriod();
  const [organizationId, setOrganizationId] = useState('');
  const [periodStart, setPeriodStart] = useState(period.start);
  const [periodEnd, setPeriodEnd] = useState(period.end);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Suscripción');

  const createInvoice = useAdminCreateInvoice();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    try {
      await createInvoice.mutateAsync({
        organizationId,
        periodStart,
        periodEnd,
        amount: Number(amount),
        description: description || null,
      });
      setOrganizationId('');
      setAmount('');
      setDescription('Suscripción');
      const p = defaultPeriod();
      setPeriodStart(p.start);
      setPeriodEnd(p.end);
      onOpenChange(false);
    } catch (err) {
      console.error('createInvoice error:', err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear factura manual</DialogTitle>
          <DialogDescription>
            Crea una factura en borrador para una organización. Se generará un número automático.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Organización</Label>
            <Select value={organizationId} onValueChange={setOrganizationId} required>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar organización" />
              </SelectTrigger>
              <SelectContent>
                {subscriptions.map((s) => (
                  <SelectItem key={s.id} value={s.organizationId}>
                    {s.organizationName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Inicio período</Label>
              <Input
                type="date"
                value={periodStart}
                onChange={(e) => setPeriodStart(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Fin período</Label>
              <Input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                required
              />
            </div>
          </div>
          <div>
            <Label>Monto (USD)</Label>
            <Input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          <div>
            <Label>Descripción línea</Label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Suscripción"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInvoice.isPending}>
              {createInvoice.isPending ? 'Creando…' : 'Crear factura'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
