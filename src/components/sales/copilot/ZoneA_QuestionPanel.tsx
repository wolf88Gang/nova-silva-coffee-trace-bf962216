/**
 * Zone A — current question, multi-select, free text (seller notes), por qué preguntamos.
 */

import { QuestionRenderer, hasValidAnswer, type QuestionValue } from '@/components/sales/QuestionRenderer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { getQuestionMetadata } from '@/modules/sales/questionMetadata';
import type { LoadedQuestion } from '@/modules/sales/FlowEngine.types';
import type { NextQuestionReason } from '@/modules/sales/FlowEngine.types';
import { Loader2 } from 'lucide-react';

interface ZoneA_QuestionPanelProps {
  question: LoadedQuestion | null;
  value: QuestionValue;
  sellerNotes: string;
  onChangeValue: (v: QuestionValue) => void;
  onChangeNotes: (s: string) => void;
  onSubmit: () => void;
  onSkip: () => void;
  disabled: boolean;
  questionReason: NextQuestionReason | null;
}

export function ZoneA_QuestionPanel({
  question,
  value,
  sellerNotes,
  onChangeValue,
  onChangeNotes,
  onSubmit,
  onSkip,
  disabled,
  questionReason,
}: ZoneA_QuestionPanelProps) {
  if (!question) {
    return (
      <Card className="border-dashed">
        <CardContent className="py-8 text-sm text-muted-foreground text-center">
          Sin pregunta activa
        </CardContent>
      </Card>
    );
  }

  const meta = getQuestionMetadata(question.code);

  return (
    <Card>
      <CardContent className="pt-4 space-y-4">
        <div className="rounded-md border bg-muted/20 p-3 text-xs space-y-1">
          <p className="font-medium text-foreground">Por qué preguntamos</p>
          <p className="text-muted-foreground">{meta.why_we_ask}</p>
          <p className="text-muted-foreground italic">{meta.what_changes}</p>
        </div>

        <QuestionRenderer
          question={question}
          value={value}
          onChange={onChangeValue}
          disabled={disabled}
          questionReason={questionReason}
        />

        <div className="space-y-1.5">
          <Label className="text-xs">Notas del vendedor (texto libre)</Label>
          <Textarea
            value={sellerNotes}
            onChange={(e) => onChangeNotes(e.target.value)}
            disabled={disabled}
            rows={2}
            placeholder="Contexto adicional, objeciones escuchadas…"
            className="text-sm resize-none"
          />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" size="sm" onClick={onSkip} disabled={disabled}>
            Omitir
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={onSubmit}
            disabled={disabled || !hasValidAnswer(question, value)}
          >
            {disabled ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
