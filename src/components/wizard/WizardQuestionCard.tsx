import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Option {
  value: string;
  label: string;
}

interface WizardQuestionCardProps {
  questionNumber: number;
  text: string;
  options: Option[];
  selectedValue: string | undefined;
  onSelect: (value: string) => void;
  footer?: React.ReactNode;
}

export function WizardQuestionCard({
  questionNumber, text, options, selectedValue, onSelect, footer,
}: WizardQuestionCardProps) {
  return (
    <Card className={selectedValue !== undefined ? 'border-primary/30' : ''}>
      <CardContent className="pt-4 space-y-3">
        <div className="flex items-start gap-2">
          <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">
            {questionNumber}
          </span>
          <p className="text-sm font-medium text-foreground">{text}</p>
        </div>
        <RadioGroup
          value={selectedValue ?? ''}
          onValueChange={onSelect}
          className="space-y-2"
        >
          {options.map(o => (
            <div key={o.value} className="flex items-center space-x-2">
              <RadioGroupItem value={o.value} id={`q${questionNumber}-${o.value}`} />
              <Label htmlFor={`q${questionNumber}-${o.value}`} className="text-sm cursor-pointer">
                {o.label}
              </Label>
            </div>
          ))}
        </RadioGroup>
        {footer}
      </CardContent>
    </Card>
  );
}
