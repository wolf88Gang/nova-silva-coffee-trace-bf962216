import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, CheckCircle } from 'lucide-react';

interface WizardNavButtonsProps {
  onPrev: () => void;
  onNext: () => void;
  canPrev: boolean;
  canNext: boolean;
  isLast: boolean;
  finalLabel?: string;
}

export function WizardNavButtons({
  onPrev, onNext, canPrev, canNext, isLast, finalLabel = 'Finalizar',
}: WizardNavButtonsProps) {
  return (
    <div className="flex items-center justify-between">
      <Button variant="outline" onClick={onPrev} disabled={!canPrev}>
        <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
      </Button>
      <Button onClick={onNext} disabled={!canNext}>
        {isLast
          ? <><CheckCircle className="h-4 w-4 mr-1" /> {finalLabel}</>
          : <><span>Siguiente</span><ChevronRight className="h-4 w-4 ml-1" /></>
        }
      </Button>
    </div>
  );
}
