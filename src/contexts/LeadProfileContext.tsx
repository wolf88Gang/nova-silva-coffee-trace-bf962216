/**
 * LeadProfileContext — optional UI state for copilot (interpretations log, notes).
 * Profile gaps for display come from InterpretationEngine (priority profile), not sole source of truth.
 */

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { LeadProfile, InterpretationBlock } from '@/types/salesDiagnostic';
import { EMPTY_LEAD_PROFILE } from '@/types/salesDiagnostic';

interface LeadProfileContextType {
  profile: LeadProfile;
  interpretations: InterpretationBlock[];
  updateProfile: (partial: Partial<LeadProfile>) => void;
  addInterpretation: (block: InterpretationBlock) => void;
  reset: () => void;
}

const LeadProfileContext = createContext<LeadProfileContextType | undefined>(undefined);

export function LeadProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<LeadProfile>(EMPTY_LEAD_PROFILE);
  const [interpretations, setInterpretations] = useState<InterpretationBlock[]>([]);

  const updateProfile = useCallback((partial: Partial<LeadProfile>) => {
    setProfile((p) => ({
      ...p,
      ...partial,
      updated_at: new Date().toISOString(),
    }));
  }, []);

  const addInterpretation = useCallback((block: InterpretationBlock) => {
    setInterpretations((prev) => [...prev, block]);
  }, []);

  const reset = useCallback(() => {
    setProfile(EMPTY_LEAD_PROFILE);
    setInterpretations([]);
  }, []);

  return (
    <LeadProfileContext.Provider
      value={{ profile, interpretations, updateProfile, addInterpretation, reset }}
    >
      {children}
    </LeadProfileContext.Provider>
  );
}

export function useLeadProfile() {
  const ctx = useContext(LeadProfileContext);
  if (!ctx) throw new Error('useLeadProfile must be used within LeadProfileProvider');
  return ctx;
}
