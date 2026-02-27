import { ScrollArea } from '@/components/ui/scroll-area';

interface StepInfo {
  id: string;
  label: string;
  complete: boolean;
}

interface WizardStepNavProps {
  steps: StepInfo[];
  activeIndex: number;
  onSelect: (index: number) => void;
}

export function WizardStepNav({ steps, activeIndex, onSelect }: WizardStepNavProps) {
  return (
    <ScrollArea className="w-full">
      <div className="flex gap-1 pb-2">
        {steps.map((step, i) => {
          const isActive = i === activeIndex;
          return (
            <button
              key={step.id}
              onClick={() => onSelect(i)}
              className={`flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : step.complete
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {step.label}{step.complete && ' ✓'}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}
