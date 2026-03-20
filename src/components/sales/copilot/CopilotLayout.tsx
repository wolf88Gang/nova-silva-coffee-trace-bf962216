/**
 * CopilotLayout — PRIMARY Commercial Copilot shell (3 zones).
 * Parent owns useCopilotDiagnostic + createSession; this component only orchestrates UI + interpretation.
 */

import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildCopilotInterpretation } from '@/modules/sales/InterpretationEngine';
import { useLeadProfile } from '@/contexts/LeadProfileContext';
import { interpretAnswer } from '@/modules/sales/adaptiveQuestionEngine';
import type { QuestionValue } from '@/components/sales/QuestionRenderer';
import type { FlowState } from '@/modules/sales/FlowEngine.types';
import type { LoadedQuestion, LoadedAnswer } from '@/modules/sales/FlowEngine.types';
import type { CopilotSavePayload } from '@/hooks/useCopilotDiagnostic';
import { ZoneC_TopBar } from './ZoneC_TopBar';
import { ZoneA_QuestionPanel } from './ZoneA_QuestionPanel';
import { ZoneB_InterpretationPanel } from './ZoneB_InterpretationPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowRight } from 'lucide-react';

export interface CopilotLayoutDiagnosticProps {
  sessionId: string | null;
  flowState: FlowState | null;
  questions: LoadedQuestion[];
  answers: LoadedAnswer[];
  isLoading: boolean;
  error: string | null;
  saveAnswer: (questionId: string, payload: CopilotSavePayload) => Promise<void>;
  skipQuestion: (questionId: string) => Promise<void>;
  finalizeSession: () => Promise<void>;
}

interface CopilotLayoutProps extends CopilotLayoutDiagnosticProps {
  orgName: string;
  leadName?: string;
  leadCompany?: string;
  leadType?: string;
}

function buildPayload(
  q: LoadedQuestion,
  v: QuestionValue
): CopilotSavePayload {
  if (q.question_type === 'single_select' || q.question_type === 'multi_select') {
    const ids = Array.isArray(v) ? v : [];
    return { answer_option_ids: ids };
  }
  if (q.question_type === 'boolean') return { answer_boolean: v === true };
  if (q.question_type === 'number') return { answer_number: typeof v === 'number' ? v : 0 };
  if (q.question_type === 'text' || q.question_type === 'textarea') return { answer_text: String(v ?? '') };
  return { answer_option_ids: [] };
}

export function CopilotLayout({
  orgName,
  leadName,
  leadCompany,
  leadType,
  sessionId,
  flowState,
  questions,
  answers,
  isLoading,
  error,
  saveAnswer,
  skipQuestion,
  finalizeSession,
}: CopilotLayoutProps) {
  const navigate = useNavigate();
  const { profile, addInterpretation, interpretations, reset: resetProfile } = useLeadProfile();

  const [answerValue, setAnswerValue] = useState<QuestionValue>(null);
  const [sellerNotes, setSellerNotes] = useState('');

  useEffect(() => {
    setAnswerValue(null);
    setSellerNotes('');
  }, [flowState?.next_question_id]);

  const interpretation = useMemo(() => {
    if (!flowState || !questions.length) return null;
    return buildCopilotInterpretation({ flowState, questions, answers });
  }, [flowState, questions, answers]);

  const handleSubmit = async () => {
    const q = flowState?.next_question;
    if (!q || !sessionId) return;
    try {
      if (sellerNotes.trim()) {
        const interp = interpretAnswer(q.code, sellerNotes, profile);
        addInterpretation({
          id: crypto.randomUUID(),
          timestamp: new Date().toISOString(),
          ...interp,
        });
      }
      await saveAnswer(q.id, buildPayload(q, answerValue));
      setSellerNotes('');
    } catch {
      /* hook sets error */
    }
  };

  const handleSkip = async () => {
    const q = flowState?.next_question;
    if (!q || !sessionId) return;
    try {
      await skipQuestion(q.id);
    } catch {
      /* hook */
    }
  };

  const handleFinalize = async () => {
    if (!sessionId) return;
    try {
      await finalizeSession();
      resetProfile();
      navigate(`/admin/sales/sessions/${sessionId}`);
    } catch {
      /* hook */
    }
  };

  const isComplete = flowState?.is_complete ?? false;
  const next = flowState?.next_question ?? null;

  if (!sessionId) {
    return (
      <Card>
        <CardContent className="py-8 text-sm text-muted-foreground text-center">
          Sesión no iniciada
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col min-h-[60vh] border rounded-lg overflow-hidden bg-background">
      <ZoneC_TopBar
        orgName={orgName}
        leadName={leadName}
        leadCompany={leadCompany}
        leadType={leadType}
        fitPercent={interpretation?.fitPercent ?? 0}
        planSummary={interpretation?.planSummary ?? ''}
        routeLabel={interpretation?.routeRationale[0] ?? '—'}
      />

      {error && (
        <div className="px-4 py-2 text-xs text-destructive bg-destructive/10">{error}</div>
      )}

      {isComplete ? (
        <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="font-medium">Diagnóstico completo</p>
            <p className="text-xs text-muted-foreground">Generar resultados y recomendaciones</p>
          </div>
          <Button onClick={handleFinalize} disabled={isLoading} size="sm">
            {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowRight className="h-3.5 w-3.5" />}
            Resultados
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(280px,340px)] gap-4 p-4 flex-1">
          <ZoneA_QuestionPanel
            question={next}
            value={answerValue}
            sellerNotes={sellerNotes}
            onChangeValue={setAnswerValue}
            onChangeNotes={setSellerNotes}
            onSubmit={handleSubmit}
            onSkip={handleSkip}
            disabled={isLoading}
            questionReason={flowState?.next_question_reason ?? null}
          />
          <div className="lg:sticky lg:top-4 self-start max-h-[calc(100vh-12rem)] overflow-y-auto">
            <ZoneB_InterpretationPanel
              interpretation={interpretation}
              flowState={flowState}
              noteInterpretations={interpretations}
            />
          </div>
        </div>
      )}
    </div>
  );
}
