/**
<<<<<<< Current (Your changes)
 * QuestionRenderer — deal desk question input.
 * Dense, operator-friendly. No survey fluff.
 * Includes "Why this question?" tooltip when reason is provided.
=======
 * QuestionRenderer — shared question control chrome (used by Copilot Zone A + legacy wizard).
 *
 * // LEGACY FLOW — to be removed after copilot stabilization (extract ZoneA-only renderer if needed)
>>>>>>> Incoming (Background Agent changes)
 */

import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { HelpCircle } from 'lucide-react';
import type {
  LoadedQuestion,
  SalesQuestionType,
  NextQuestionReason,
} from '@/modules/sales/FlowEngine.types';

export type QuestionValue = string[] | string | number | boolean | null;

interface QuestionRendererProps {
  question: LoadedQuestion;
  value: QuestionValue;
  onChange: (value: QuestionValue) => void;
  disabled?: boolean;
  className?: string;
  /** Why this question? — gap + signal for trust */
  questionReason?: NextQuestionReason | null;
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

const GAP_LABELS: Record<string, string> = {
  organization_type: 'Tipo de organización',
  scale: 'Escala',
  commercialization_model: 'Modelo comercial',
  pricing_power: 'Poder de precios',
  buyer_type: 'Tipo de comprador',
  logistics_model: 'Modelo logístico',
  certification_status: 'Estado de certificación',
  pain_severity: 'Severidad del dolor',
  maturity_level: 'Nivel de madurez',
  urgency_timeline: 'Urgencia',
  budget_readiness: 'Disposición presupuestaria',
  objection_profile: 'Perfil de objeciones',
};

function WhyThisQuestionTooltip({ reason }: { reason: NextQuestionReason }) {
  const gapLabels = reason.gap_fills.map((g) => GAP_LABELS[g] ?? g);
  const hasGap = gapLabels.length > 0;
  const hasSignal = reason.signal_triggers.length > 0;

  return (
    <div className="space-y-2 text-xs max-w-[280px]">
      {hasGap && (
        <div>
          <span className="font-medium text-muted-foreground">Gaps que cubre:</span>
          <ul className="mt-0.5 list-disc list-inside">
            {gapLabels.map((l) => (
              <li key={l}>{l}</li>
            ))}
          </ul>
        </div>
      )}
      {hasSignal && (
        <div>
          <span className="font-medium text-muted-foreground">Señales activas:</span>
          <ul className="mt-0.5 list-disc list-inside">
            {reason.signal_triggers.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      )}
      {!hasGap && !hasSignal && (
        <p className="text-muted-foreground">Prioridad por relevancia.</p>
      )}
      {reason.score_breakdown && (
        <p className="text-[10px] text-muted-foreground pt-1 border-t">
          Score: {reason.score_breakdown.total} (peso {reason.score_breakdown.weight} + gap {reason.score_breakdown.gap_relevance} + señal {reason.score_breakdown.signal_relevance})
        </p>
      )}
    </div>
  );
}

export function QuestionRenderer({
  question,
  value,
  onChange,
  disabled,
  className,
  questionReason,
}: QuestionRendererProps) {
  const type: SalesQuestionType = question.question_type;

  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <div className="flex items-start gap-1.5">
          <p className="text-sm font-medium leading-snug flex-1">{question.text}</p>
          {questionReason && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-0.5 rounded"
                    aria-label="¿Por qué esta pregunta?"
                  >
                    <HelpCircle className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="font-normal">
                  <WhyThisQuestionTooltip reason={questionReason} />
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
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
