/**
 * Contexto del wizard de configuración demo.
 * Persiste en sessionStorage para que el aplicativo lo use.
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { DemoSetupConfig } from '@/config/demoSetupConfig';

const STORAGE_KEY = 'nova-silva-demo-setup-config';

interface DemoSetupContextValue {
  config: DemoSetupConfig | null;
  setConfig: (c: DemoSetupConfig) => void;
  clearConfig: () => void;
  hasConfig: boolean;
}

const defaultScale = {
  plotCount: 0,
  producerOrSupplierCount: 0,
  userCount: 0,
  hasLabor: false,
  hasInventory: false,
  hasExports: false,
};

const DemoSetupContext = createContext<DemoSetupContextValue | undefined>(undefined);

function loadFromStorage(): DemoSetupConfig | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DemoSetupConfig;
  } catch {
    return null;
  }
}

function saveToStorage(config: DemoSetupConfig) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function DemoSetupProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfigState] = useState<DemoSetupConfig | null>(null);

  useEffect(() => {
    setConfigState(loadFromStorage());
  }, []);

  const setConfig = useCallback((c: DemoSetupConfig) => {
    setConfigState(c);
    saveToStorage(c);
  }, []);

  const clearConfig = useCallback(() => {
    setConfigState(null);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  return (
    <DemoSetupContext.Provider
      value={{
        config,
        setConfig,
        clearConfig,
        hasConfig: !!config,
      }}
    >
      {children}
    </DemoSetupContext.Provider>
  );
}

export function useDemoSetup() {
  const ctx = useContext(DemoSetupContext);
  if (ctx === undefined) throw new Error('useDemoSetup must be used within DemoSetupProvider');
  return ctx;
}
