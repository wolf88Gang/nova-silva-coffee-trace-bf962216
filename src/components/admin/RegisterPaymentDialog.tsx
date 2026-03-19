/**
 * Diálogo para registrar pago manual.
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
import { useAdminRegisterPayment } from '@/hooks/admin/useAdminRegisterPayment';
import type { AdminSubscription, AdminInvoice } from '@/types/admin';

interface RegisterPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subscriptions: AdminSubscription[];
  invoices: AdminInvoice[];
}

const METHOD_OPTIONS = [
  { value: 'transferencia', label: 'Transferencia' },
  { value: 'efectivo', label: 'Efectivo' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'stripe', label: 'Stripe / Tarjeta' },
  { value: 'otro', label: 'Otro' },
];

export function RegisterPaymentDialog({
  open,
  onOpenChange,
  subscriptions,
  invoices,
}: RegisterPaymentDialogProps) {
  const [organizationId, setOrganizationId] = useState('');
  const [invoiceId, setInvoiceId] = useState('');
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('transferencia');
  const [reference, setReference] = useState('');

  const registerPayment = useAdminRegisterPayment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizationId || !amount || isNaN(Number(amount)) || Number(amount) <= 0) return;
    try {
      await registerPayment.mutateAsync({
        organizationId,
        invoiceId: invoiceId || null,
        amount: Number(amount),
        method,
        reference: reference || null,
      });
      setOrganizationId('');
      setInvoiceId('');
      setAmount('');
      setReference('');
      onOpenChange(false);
    } catch (err) {
      console.error('registerPayment error:', err);
    }
  };

  const pendingInvoices = invoices.filter((i) => ['sent', 'overdue'].includes(i.status));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pago</DialogTitle>
          <DialogDescription>
            Registra un pago manual para una organización. Opcionalmente asocia a una factura.
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
          <div>
            <Label>Factura (opcional)</Label>
            <Select value={invoiceId} onValueChange={setInvoiceId}>
              <SelectTrigger>
                <SelectValue placeholder="Ninguna" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Ninguna</SelectItem>
                {pendingInvoices
                  .filter((i) => !organizationId || i.organizationId === organizationId)
                  .map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.number} — ${i.amount} ({i.organizationName})
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
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
            <Label>Método</Label>
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {METHOD_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Referencia (opcional)</Label>
            <Input
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="Nº de transferencia, cheque, etc."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={registerPayment.isPending}>
              {registerPayment.isPending ? 'Registrando…' : 'Registrar pago'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
