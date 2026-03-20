/**
 * Seller-facing adaptive input card for a single diagnostic question.
 * Shows context helpers: "Por qué preguntamos" + "Qué cambia con esta respuesta"
 */
import { useState } from 'react';
import { Check, ChevronDown, ChevronUp, MessageSquarePlus, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { DiagnosticQuestion } from '@/lib/diagnosticEngine';
import { QUESTION_IMPACT, QUESTION_WHY } from '@/lib/diagnosticLabels';
import { cn } from '@/lib/utils';

interface DiagnosticInputCardProps {
  question: DiagnosticQuestion;
  onSubmit: (value: unknown, note?: string) => void;
  disabled?: boolean;
  isFirst?: boolean;
}

export function DiagnosticInputCard({ question, onSubmit, disabled = false, isFirst = false }: DiagnosticInputCardProps) {
  const [value, setValue] = useState<unknown>(question.inputType === 'multi_select' ? [] : null);
  const [freeText, setFreeText] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');
  const [showHelpers, setShowHelpers] = useState(false);

  const why = QUESTION_WHY[question.id];
  const impact = QUESTION_IMPACT[question.id];
  const hasHelpers = Boolean(why || impact);

  const handleSubmit = () => {
    let finalValue = value;
    if (freeText.trim() && question.inputType === 'multi_select') {
      finalValue = [...(Array.isArray(value) ? value : []), freeText.trim()];
    } else if (freeText.trim() && question.inputType === 'text') {
      finalValue = freeText.trim();
    } else if (freeText.trim() && question.inputType === 'single_select' && !value) {
      finalValue = freeText.trim();
    }
    onSubmit(finalValue, note.trim() || undefined);
  };

  const isReady = () => {
    if (question.inputType === 'multi_select') return (Array.isArray(value) && value.length > 0) || freeText.trim().length > 0;
    if (question.inputType === 'text') return freeText.trim().length > 0;
    if (question.inputType === 'number') return value != null && value !== '';
    return value != null;
  };

  return (
    <Card className={cn(
      'border-primary/20 bg-card transition-all duration-300',
      isFirst && 'ring-1 ring-primary/10 shadow-sm',
    )}>
      <CardContent className="pt-5 pb-4 space-y-4">
        {/* Question */}
        <div>
          <h3 className="text-sm font-semibold text-foreground leading-snug">{question.title}</h3>
          {question.description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{question.description}</p>
          )}
          {question.inputType === 'multi_select' && (
            <p className="text-[10px] text-muted-foreground mt-1.5 italic">Puedes seleccionar varias opciones</p>
          )}
        </div>

        {/* Helpers toggle */}
        {hasHelpers && (
          <button
            type="button"
            onClick={() => setShowHelpers(!showHelpers)}
            className="flex items-center gap-1 text-[10px] text-primary/70 hover:text-primary transition-colors"
          >
            {showHelpers ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            {showHelpers ? 'Ocultar contexto' : 'Ver contexto de esta pregunta'}
          </button>
        )}
        {showHelpers && (
          <div className="rounded-md bg-muted/50 px-3 py-2.5 space-y-2 text-[11px] leading-relaxed animate-in fade-in-50 duration-200">
            {why && (
              <div>
                <span className="font-medium text-foreground">Por qué preguntamos esto:</span>
                <p className="text-muted-foreground mt-0.5">{why}</p>
              </div>
            )}
            {impact && (
              <div>
                <span className="font-medium text-foreground">Qué cambia con esta respuesta:</span>
                <p className="text-muted-foreground mt-0.5">{impact}</p>
              </div>
            )}
          </div>
        )}

        {/* SINGLE SELECT */}
        {question.inputType === 'single_select' && (
          <RadioGroup
            value={typeof value === 'string' ? value : ''}
            onValueChange={(v) => setValue(v)}
            className="space-y-1.5"
            disabled={disabled}
          >
            {question.options.map((opt) => (
              <label
                key={opt.value}
                className={cn(
                  'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all cursor-pointer',
                  value === opt.value
                    ? 'border-primary/40 bg-primary/5'
                    : 'border-border bg-background hover:bg-muted/40',
                )}
              >
                <RadioGroupItem value={opt.value} className="mt-0.5" />
                <div>
                  <span className="text-foreground">{opt.label}</span>
                  {opt.description && <p className="text-[11px] text-muted-foreground mt-0.5">{opt.description}</p>}
                </div>
              </label>
            ))}
          </RadioGroup>
        )}

        {/* MULTI SELECT */}
        {question.inputType === 'multi_select' && (
          <div className="space-y-1.5">
            {question.options.map((opt) => {
              const selected = Array.isArray(value) && value.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all cursor-pointer',
                    selected
                      ? 'border-primary/40 bg-primary/5'
                      : 'border-border bg-background hover:bg-muted/40',
                  )}
                >
                  <Checkbox
                    checked={selected}
                    disabled={disabled}
                    onCheckedChange={(checked) => {
                      const arr = Array.isArray(value) ? value : [];
                      setValue(checked ? [...arr, opt.value] : arr.filter((v: string) => v !== opt.value));
                    }}
                  />
                  <span className="text-foreground">{opt.label}</span>
                </label>
              );
            })}
          </div>
        )}

        {/* BOOLEAN */}
        {question.inputType === 'boolean' && (
          <RadioGroup
            value={value === true ? 'true' : value === false ? 'false' : ''}
            onValueChange={(v) => setValue(v === 'true')}
            className="grid gap-2 sm:grid-cols-2"
            disabled={disabled}
          >
            <label className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-all', value === true ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:bg-muted/40')}>
              <RadioGroupItem value="true" />
              <span className="text-foreground">Sí</span>
            </label>
            <label className={cn('flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm cursor-pointer transition-all', value === false ? 'border-primary/40 bg-primary/5' : 'border-border bg-background hover:bg-muted/40')}>
              <RadioGroupItem value="false" />
              <span className="text-foreground">No</span>
            </label>
          </RadioGroup>
        )}

        {/* NUMBER */}
        {question.inputType === 'number' && (
          <Input
            type="number"
            disabled={disabled}
            value={typeof value === 'number' || typeof value === 'string' ? value : ''}
            onChange={(e) => setValue(e.target.value === '' ? null : Number(e.target.value))}
            placeholder={question.placeholder ?? 'Ingresa un valor'}
          />
        )}

        {/* TEXT */}
        {question.inputType === 'text' && (
          <Textarea
            rows={3}
            disabled={disabled}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder={question.placeholder ?? 'Escribe tu respuesta'}
          />
        )}

        {/* Free text for structured inputs */}
        {question.allowFreeText && question.inputType !== 'text' && (
          <Input
            disabled={disabled}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="O escribe algo adicional…"
            className="text-xs"
          />
        )}

        {/* Seller note */}
        <div className="flex items-center gap-2">
          {!showNote && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground gap-1 hover:text-foreground"
              onClick={() => setShowNote(true)}
            >
              <MessageSquarePlus className="h-3 w-3" /> Nota del vendedor
            </Button>
          )}
          {showNote && (
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Observación interna (no visible para el lead)"
              className="text-xs"
              disabled={disabled}
            />
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-1">
          <Button
            size="sm"
            disabled={disabled || !isReady()}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" /> Continuar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
