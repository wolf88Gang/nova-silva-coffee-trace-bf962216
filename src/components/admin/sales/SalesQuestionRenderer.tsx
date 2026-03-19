import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import type { SalesQuestion, SalesQuestionAnswer } from '@/lib/salesSessionService';

interface SalesQuestionRendererProps {
  question: SalesQuestion;
  value: SalesQuestionAnswer;
  onChange: (value: SalesQuestionAnswer) => void;
  disabled?: boolean;
}

export function SalesQuestionRenderer({ question, value, onChange, disabled = false }: SalesQuestionRendererProps) {
  if (question.questionType === 'single_select') {
    return (
      <RadioGroup
        value={typeof value === 'string' ? value : ''}
        onValueChange={(nextValue) => onChange(nextValue)}
        className="space-y-2"
        disabled={disabled}
      >
        {question.options.map((option) => (
          <label
            key={option.value}
            className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted/40"
          >
            <RadioGroupItem value={option.value} className="mt-0.5" />
            <span className="text-foreground">{option.label}</span>
          </label>
        ))}
      </RadioGroup>
    );
  }

  if (question.questionType === 'multi_select') {
    const selectedValues = Array.isArray(value) ? value : [];

    return (
      <div className="space-y-2">
        {question.options.map((option) => {
          const checked = selectedValues.includes(option.value);
          return (
            <label
              key={option.value}
              className="flex items-start gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted/40"
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={(nextChecked) => {
                  const nextValues = nextChecked
                    ? [...selectedValues, option.value]
                    : selectedValues.filter((current) => current !== option.value);
                  onChange(nextValues);
                }}
              />
              <span className="text-foreground">{option.label}</span>
            </label>
          );
        })}
      </div>
    );
  }

  if (question.questionType === 'boolean') {
    const radioValue = value === true ? 'true' : value === false ? 'false' : '';

    return (
      <RadioGroup
        value={radioValue}
        onValueChange={(nextValue) => onChange(nextValue === 'true')}
        className="grid gap-2 sm:grid-cols-2"
        disabled={disabled}
      >
        <label className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted/40">
          <RadioGroupItem value="true" />
          <span className="text-foreground">Sí</span>
        </label>
        <label className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-3 text-sm transition-colors hover:bg-muted/40">
          <RadioGroupItem value="false" />
          <span className="text-foreground">No</span>
        </label>
      </RadioGroup>
    );
  }

  if (question.questionType === 'number') {
    return (
      <div className="space-y-2">
        <Input
          type="number"
          disabled={disabled}
          min={question.minValue ?? undefined}
          max={question.maxValue ?? undefined}
          value={typeof value === 'number' || typeof value === 'string' ? value : ''}
          onChange={(event) => {
            const nextValue = event.target.value;
            onChange(nextValue === '' ? null : Number(nextValue));
          }}
          placeholder={question.placeholder ?? 'Ingresa un valor'}
        />
        {(question.minValue != null || question.maxValue != null) && (
          <p className="text-xs text-muted-foreground">
            Rango permitido: {question.minValue ?? '—'} — {question.maxValue ?? '—'}
          </p>
        )}
      </div>
    );
  }

  if (question.questionType === 'textarea') {
    return (
      <Textarea
        rows={5}
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder ?? 'Escribe tu respuesta'}
      />
    );
  }

  return (
    <div className="space-y-2">
      <Label className="text-xs text-muted-foreground">Respuesta</Label>
      <Input
        disabled={disabled}
        value={typeof value === 'string' ? value : ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={question.placeholder ?? 'Escribe tu respuesta'}
      />
    </div>
  );
}
