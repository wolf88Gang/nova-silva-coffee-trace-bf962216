import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import { DEMO_PRODUCTORES, type DemoProductor } from '@/lib/demo-data';

interface ActorContextType {
  /** Currently selected actor (productor) ID for scoping operations */
  selectedActorId: string | null;
  /** Set the selected actor by ID */
  setSelectedActorId: (id: string | null) => void;
  /** Resolved actor data for the selected ID */
  selectedActor: DemoProductor | null;
  /** Clear the selected actor */
  clearSelectedActor: () => void;
}

const ActorContext = createContext<ActorContextType | undefined>(undefined);

export function ActorProvider({ children }: { children: React.ReactNode }) {
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);

  const selectedActor = useMemo(() => {
    if (!selectedActorId) return null;
    return DEMO_PRODUCTORES.find(p => p.id === selectedActorId) ?? null;
  }, [selectedActorId]);

  const clearSelectedActor = useCallback(() => setSelectedActorId(null), []);

  return (
    <ActorContext.Provider value={{ selectedActorId, setSelectedActorId, selectedActor, clearSelectedActor }}>
      {children}
    </ActorContext.Provider>
  );
}

export function useActorContext() {
  const context = useContext(ActorContext);
  if (!context) throw new Error('useActorContext must be used within an ActorProvider');
  return context;
}
