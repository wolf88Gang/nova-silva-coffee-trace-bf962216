/**
 * OutcomeCaptureCard — record commercial outcome for a Sales session.
 * Admin only. Compact, fast to complete.
 */

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SalesSessionService, type SalesOutcome, type SessionOutcome } from '@/modules/sales/SalesSessionService';
import { Check, Loader2 } from 'lucide-react';

const OUTCOME_LABELS: Record<SalesOutcome, string> = {
  won: 'Ganado',
  lost: 'Perdido',
  no_decision: 'Sin decisión',
};

interface OutcomeCaptureCardProps {
  sessionId: string;
  outcome: SessionOutcome | null;
}

export function OutcomeCaptureCard({ sessionId, outcome }: OutcomeCaptureCardProps) {
  const queryClient = useQueryClient();
  const [outcomeVal, setOutcomeVal] = useState<SalesOutcome | ''>(outcome?.outcome ?? '');
  const [reasonLost, setReasonLost] = useState(outcome?.reason_lost ?? '');
  const [dealValue, setDealValue] = useState(outcome?.deal_value != null ? String(outcome.deal_value) : '');
  const [closeDate, setCloseDate] = useState(outcome?.close_date ?? '');

  useEffect(() => {
    setOutcomeVal(outcome?.outcome ?? '');
    setReasonLost(outcome?.reason_lost ?? '');
    setDealValue(outcome?.deal_value != null ? String(outcome.deal_value) : '');
    setCloseDate(outcome?.close_date ?? '');
  }, [outcome]);

  const mutation = useMutation({
    mutationFn: () =>
      SalesSessionService.upsertOutcome(sessionId, {
        outcome: outcomeVal as SalesOutcome,
        reason_lost: outcomeVal === 'lost' ? reasonLost : null,
        deal_value: outcomeVal === 'won' && dealValue ? parseFloat(dealValue) : null,
        close_date: closeDate || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_session_summary', sessionId] });
    },
  });

  const canSubmit =
    outcomeVal !== '' &&
    (outcomeVal !== 'lost' || reasonLost.trim().length > 0) &&
    (outcomeVal !== 'won' || dealValue === '' || !isNaN(parseFloat(dealValue)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    mutation.mutate();
  };

  return (
    <Card>
      <CardContent className="pt-4 pb-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2">
            Resultado comercial
          </p>

          <div className="flex flex-wrap gap-2">
            {(['won', 'lost', 'no_decision'] as const).map((o) => (
              <Button
                key={o}
                type="button"
                variant={outcomeVal === o ? 'default' : 'outline'}
                size="sm"
                onClick={() => setOutcomeVal(o)}
              >
                {outcomeVal === o && <Check className="h-3 w-3 mr-1" />}
                {OUTCOME_LABELS[o]}
              </Button>
            ))}
          </div>

          {outcomeVal === 'lost' && (
            <div className="space-y-1.5">
              <Label htmlFor="reason_lost" className="text-xs">
                Motivo de pérdida <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason_lost"
                value={reasonLost}
                onChange={(e) => setReasonLost(e.target.value)}
                placeholder="Ej: precio, competencia, timing…"
                rows={2}
                className="text-sm resize-none"
                required
              />
              {outcomeVal === 'lost' && !reasonLost.trim() && (
                <p className="text-xs text-destructive">Indica el motivo para guardar.</p>
              )}
            </div>
          )}

          {outcomeVal === 'won' && (
            <div className="space-y-1.5">
              <Label htmlFor="deal_value" className="text-xs">
                Valor del acuerdo
              </Label>
              <Input
                id="deal_value"
                type="number"
                min={0}
                step={0.01}
                value={dealValue}
                onChange={(e) => setDealValue(e.target.value)}
                placeholder="Ej: 15000"
                className="text-sm"
              />
            </div>
          )}

          {(outcomeVal === 'won' || outcomeVal === 'lost') && (
            <div className="space-y-1.5">
              <Label htmlFor="close_date" className="text-xs">
                Fecha de cierre
              </Label>
              <Input
                id="close_date"
                type="date"
                value={closeDate}
                onChange={(e) => setCloseDate(e.target.value)}
                className="text-sm"
              />
            </div>
          )}

          <Button type="submit" size="sm" disabled={!canSubmit || mutation.isPending}>
            {mutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <Check className="h-3.5 w-3.5 mr-1.5" />
            )}
            {outcome ? 'Actualizar' : 'Guardar'}
          </Button>

          {mutation.isError && (
            <p className="text-xs text-destructive">{mutation.error instanceof Error ? mutation.error.message : 'Error'}</p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
