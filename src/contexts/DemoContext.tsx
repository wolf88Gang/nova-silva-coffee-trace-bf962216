/**
 * Contexto demo para arquitectura por dominios.
 * Persiste org + perfil seleccionados en demo-v2 para derivar sidebar y scope.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getOrgById, DEMO_PROFILES, type DemoOrganization, type DemoProfile } from '@/config/demoArchitecture';

const STORAGE_KEY = 'nova-silva-demo-context';

interface DemoContextValue {
  org: DemoOrganization | null;
  profile: DemoProfile | null;
  isDemoSession: boolean;
  setDemoSession: (org: DemoOrganization, profile: DemoProfile) => void;
  clearDemoSession: () => void;
}

const DemoContext = createContext<DemoContextValue | undefined>(undefined);

function loadFromStorage(): { orgId: string; profileId: string } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { orgId: string; profileId: string };
  } catch {
    return null;
  }
}

function saveToStorage(orgId: string, profileId: string) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ orgId, profileId }));
  } catch {
    // ignore
  }
}

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [org, setOrg] = useState<DemoOrganization | null>(null);
  const [profile, setProfile] = useState<DemoProfile | null>(null);

  useEffect(() => {
    const stored = loadFromStorage();
    if (!stored) return;
    const o = getOrgById(stored.orgId);
    if (!o) return;
    const p = DEMO_PROFILES.find((x) => x.id === stored.profileId);
    if (o && p) {
      setOrg(o);
      setProfile(p);
    }
  }, []);

  const setDemoSession = useCallback((o: DemoOrganization, p: DemoProfile) => {
    setOrg(o);
    setProfile(p);
    saveToStorage(o.id, p.id);
  }, []);

  const clearDemoSession = useCallback(() => {
    setOrg(null);
    setProfile(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <DemoContext.Provider
      value={{
        org,
        profile,
        isDemoSession: !!org && !!profile,
        setDemoSession,
        clearDemoSession,
      }}
    >
      {children}
    </DemoContext.Provider>
  );
}

export function useDemoContext() {
  const ctx = useContext(DemoContext);
  if (ctx === undefined) throw new Error('useDemoContext must be used within DemoProvider');
  return ctx;
}
