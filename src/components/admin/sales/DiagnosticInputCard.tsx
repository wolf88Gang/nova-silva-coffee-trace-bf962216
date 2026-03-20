/**
 * Adaptive input card for a single diagnostic question.
 * Supports structured answers + optional free text notes.
 */
import { useState } from 'react';
import { Check, MessageSquarePlus } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { DiagnosticQuestion } from '@/lib/diagnosticEngine';

interface DiagnosticInputCardProps {
  question: DiagnosticQuestion;
  onSubmit: (value: unknown, note?: string) => void;
  disabled?: boolean;
}

export function DiagnosticInputCard({ question, onSubmit, disabled = false }: DiagnosticInputCardProps) {
  const [value, setValue] = useState<unknown>(question.inputType === 'multi_select' ? [] : null);
  const [freeText, setFreeText] = useState('');
  const [showNote, setShowNote] = useState(false);
  const [note, setNote] = useState('');

  const handleSubmit = () => {
    let finalValue = value;
    // Append free text as custom option for multi/single select
    if (freeText.trim() && (question.inputType === 'multi_select')) {
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
    <Card className="border-primary/20 bg-card animate-in fade-in-50 slide-in-from-bottom-2 duration-300">
      <CardContent className="pt-5 pb-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">{question.title}</h3>
          {question.description && (
            <p className="text-xs text-muted-foreground mt-1">{question.description}</p>
          )}
          <Badge variant="outline" className="mt-2 text-[10px] text-muted-foreground">
            {question.category}
          </Badge>
        </div>

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
                className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted/40 cursor-pointer"
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
                  className="flex items-start gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm transition-colors hover:bg-muted/40 cursor-pointer"
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
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:bg-muted/40 cursor-pointer">
              <RadioGroupItem value="true" />
              <span className="text-foreground">Sí</span>
            </label>
            <label className="flex items-center gap-3 rounded-lg border border-border bg-background px-3 py-2.5 text-sm hover:bg-muted/40 cursor-pointer">
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

        {/* Free text option for structured inputs */}
        {question.allowFreeText && question.inputType !== 'text' && (
          <Input
            disabled={disabled}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            placeholder="O escribe tu propia respuesta…"
            className="text-xs"
          />
        )}

        {/* Optional note toggle */}
        <div className="flex items-center gap-2">
          {!showNote && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px] text-muted-foreground gap-1"
              onClick={() => setShowNote(true)}
            >
              <MessageSquarePlus className="h-3 w-3" /> Agregar nota
            </Button>
          )}
          {showNote && (
            <Input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nota interna (no visible para el lead)"
              className="text-xs"
              disabled={disabled}
            />
          )}
        </div>

        <div className="flex justify-end pt-1">
          <Button
            size="sm"
            disabled={disabled || !isReady()}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            <Check className="h-3.5 w-3.5" /> Confirmar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
