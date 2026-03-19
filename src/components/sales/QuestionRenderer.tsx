/**
 * QuestionRenderer — deal desk question input.
 * Dense, operator-friendly. No survey fluff.
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import type { LoadedQuestion, SalesQuestionType } from '@/modules/sales/FlowEngine.types';

export type QuestionValue = string[] | string | number | boolean | null;

interface QuestionRendererProps {
  question: LoadedQuestion;
  value: QuestionValue;
  onChange: (value: QuestionValue) => void;
  disabled?: boolean;
  className?: string;
}

const OPTION_ROW =
  'flex items-center gap-2.5 rounded-md border px-3 py-2 cursor-pointer transition-colors hover:border-primary/40 hover:bg-muted/30';

function SingleSelect({ question, value, onChange, disabled }: QuestionRendererProps) {
  const selected = (Array.isArray(value) ? value[0] : null) ?? '';
  return (
    <RadioGroup
      value={selected}
      onValueChange={(v) => onChange(v ? [v] : [])}
      disabled={disabled}
      className="flex flex-col gap-1.5"
    >
      {question.options.map((opt) => (
        <label
          key={opt.id}
          htmlFor={opt.id}
          className={cn(
            OPTION_ROW,
            selected === opt.id && 'border-primary bg-primary/5',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <RadioGroupItem value={opt.id} id={opt.id} className="h-3.5 w-3.5" />
          <span className="flex-1 text-sm">{opt.label}</span>
        </label>
      ))}
    </RadioGroup>
  );
}

function MultiSelect({ question, value, onChange, disabled }: QuestionRendererProps) {
  const ids = Array.isArray(value) ? value : [];
  const set = new Set(ids);
  const toggle = (optId: string) => {
    const next = set.has(optId) ? ids.filter((id) => id !== optId) : [...ids, optId];
    onChange(next);
  };
  return (
    <div className="flex flex-col gap-1.5">
      {question.options.map((opt) => (
        <label
          key={opt.id}
          htmlFor={opt.id}
          className={cn(
            OPTION_ROW,
            set.has(opt.id) && 'border-primary bg-primary/5',
            disabled && 'cursor-not-allowed opacity-60'
          )}
        >
          <Checkbox
            id={opt.id}
            checked={set.has(opt.id)}
            onCheckedChange={() => toggle(opt.id)}
            disabled={disabled}
            className="h-3.5 w-3.5"
          />
          <span className="flex-1 text-sm">{opt.label}</span>
        </label>
      ))}
    </div>
  );
}

function BooleanInput({ value, onChange, disabled }: QuestionRendererProps) {
  const bool = value === true || value === false ? value : null;
  return (
    <div className="flex items-center gap-3">
      <Switch
        checked={bool ?? false}
        onCheckedChange={(v) => onChange(v)}
        disabled={disabled}
      />
      <span className="text-sm text-muted-foreground tabular-nums">
        {bool === true ? 'Sí' : bool === false ? 'No' : '—'}
      </span>
    </div>
  );
}

function NumberInput({ value, onChange, disabled }: QuestionRendererProps) {
  const num = typeof value === 'number' && !Number.isNaN(value) ? String(value) : '';
  return (
    <Input
      type="number"
      value={num}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === '' ? null : Number(v));
      }}
      disabled={disabled}
      className="h-9 max-w-[140px]"
      placeholder="—"
    />
  );
}

function TextInput({ value, onChange, disabled }: QuestionRendererProps) {
  const str = typeof value === 'string' ? value : '';
  return (
    <Input
      value={str}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className="h-9"
      placeholder="—"
    />
  );
}

function TextareaInput({ value, onChange, disabled }: QuestionRendererProps) {
  const str = typeof value === 'string' ? value : '';
  return (
    <Textarea
      value={str}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      rows={3}
      className="resize-none text-sm"
      placeholder="—"
    />
  );
}

function hasValidAnswer(question: LoadedQuestion, value: QuestionValue): boolean {
  const t: SalesQuestionType = question.question_type;
  if (t === 'single_select' || t === 'multi_select') {
    const ids = Array.isArray(value) ? value : [];
    return ids.length >= 1;
  }
  if (t === 'boolean') return value === true || value === false;
  if (t === 'number') return typeof value === 'number' && !Number.isNaN(value);
  if (t === 'text' || t === 'textarea') return typeof value === 'string' && value.trim().length > 0;
  return false;
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  disabled,
  className,
}: QuestionRendererProps) {
  const type: SalesQuestionType = question.question_type;

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <p className="text-sm font-medium leading-snug">{question.text}</p>
        {question.help && (
          <p className="mt-1 text-xs text-muted-foreground">{question.help}</p>
        )}
      </div>
      {type === 'single_select' && (
        <SingleSelect question={question} value={value} onChange={onChange} disabled={disabled} />
      )}
      {type === 'multi_select' && (
        <MultiSelect question={question} value={value} onChange={onChange} disabled={disabled} />
      )}
      {type === 'boolean' && (
        <BooleanInput question={question} value={value} onChange={onChange} disabled={disabled} />
      )}
      {type === 'number' && (
        <NumberInput question={question} value={value} onChange={onChange} disabled={disabled} />
      )}
      {type === 'text' && (
        <TextInput question={question} value={value} onChange={onChange} disabled={disabled} />
      )}
      {type === 'textarea' && (
        <TextareaInput question={question} value={value} onChange={onChange} disabled={disabled} />
      )}
    </div>
  );
}

export { hasValidAnswer };
