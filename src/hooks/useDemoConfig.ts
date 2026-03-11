/**
 * Stores and retrieves the demo archetype configuration.
 * Used to drive sidebar visibility and domain adaptation
 * without backend changes.
 */

const DEMO_CONFIG_KEY = 'novasilva_demo_config';

export interface DemoConfig {
  orgId: string;
  orgName: string;
  orgType: string;
  operatingModel: string;
  modules: string[];
  profileLabel: string;
}

export function setDemoConfig(config: DemoConfig) {
  sessionStorage.setItem(DEMO_CONFIG_KEY, JSON.stringify(config));
}

export function getDemoConfig(): DemoConfig | null {
  try {
    const raw = sessionStorage.getItem(DEMO_CONFIG_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearDemoConfig() {
  sessionStorage.removeItem(DEMO_CONFIG_KEY);
}

import { useSyncExternalStore } from 'react';

function subscribe(cb: () => void) {
  window.addEventListener('storage', cb);
  return () => window.removeEventListener('storage', cb);
}

export function useDemoConfig(): DemoConfig | null {
  return useSyncExternalStore(subscribe, getDemoConfig, () => null);
}
