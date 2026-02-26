/**
 * Hook: resolves which modules are active for the current user.
 *
 * Inputs: orgTipo, role, featureFlags, explicit org modules list.
 * Outputs: activeModules, navItems, canAccess(), getPermission().
 *
 * This hook is the SINGLE GATE for module visibility across
 * sidebar, dashboard widgets, route guards, and component rendering.
 */

import { useMemo } from 'react';
import { useOrgContext } from '@/hooks/useOrgContext';
import {
  MODULE_REGISTRY,
  type ModuleDefinition,
  type ModuleRoute,
  type PermissionLevel,
} from './registry';
import { FEATURE_FLAGS } from '@/config/featureFlags';
import type { UserRole } from '@/types';
import type { OrgTipo } from '@/lib/org-terminology';

export interface ActiveModulesResult {
  /** Full module definitions that passed all filters */
  activeModules: ModuleDefinition[];
  /** Flat list of nav routes from all active modules */
  navItems: ModuleRoute[];
  /** Check if a module ID is active */
  canAccess: (moduleId: string) => boolean;
  /** Get permission level for a resource in a module */
  getPermission: (moduleId: string, resource: string) => PermissionLevel;
}

/**
 * Resolve active modules for current user context.
 */
export function useActiveModules(): ActiveModulesResult {
  const { orgTipo, role, activeModules: orgModulesList } = useOrgContext();

  return useMemo(() => {
    const resolved = resolveModules(
      orgTipo as OrgTipo | null,
      (role ?? 'productor') as UserRole,
      FEATURE_FLAGS,
    );

    return resolved;
  }, [orgTipo, role, orgModulesList]);
}

/**
 * Pure function: resolve modules given context.
 * Exported for testing.
 */
export function resolveModules(
  orgTipo: OrgTipo | null,
  role: UserRole,
  flags: Record<string, boolean>,
): ActiveModulesResult {
  const isAdmin = role === 'admin';

  const activeModules = MODULE_REGISTRY.filter(mod => {
    // 1. Check org type restriction
    if (!isAdmin && mod.allowedOrgTipos.length > 0) {
      if (!orgTipo || !mod.allowedOrgTipos.includes(orgTipo as OrgTipo)) {
        return false;
      }
    }

    // 2. Check role restriction
    if (!isAdmin && mod.requiredRoles.length > 0) {
      if (!mod.requiredRoles.includes(role)) {
        return false;
      }
    }

    // 3. Check feature flags
    if (mod.flags.length > 0) {
      const allFlagsActive = mod.flags.every(f => flags[f] === true);
      if (!allFlagsActive) return false;
    }

    // 4. Check dependencies (all deps must also pass)
    if (mod.dependsOn.length > 0) {
      // Simple: just check the deps are in the registry and not flag-blocked
      // Full recursive check would be overkill here
      const depsOk = mod.dependsOn.every(depId => {
        const dep = MODULE_REGISTRY.find(m => m.id === depId);
        if (!dep) return false;
        if (dep.flags.length > 0) {
          return dep.flags.every(f => flags[f] === true);
        }
        return true;
      });
      if (!depsOk) return false;
    }

    return true;
  });

  const activeIds = new Set(activeModules.map(m => m.id));

  const navItems = activeModules.flatMap(m => m.routes);

  const canAccess = (moduleId: string) => activeIds.has(moduleId);

  const getPermission = (moduleId: string, resource: string): PermissionLevel => {
    const mod = activeModules.find(m => m.id === moduleId);
    if (!mod) return 'none';
    const rp = mod.resourcePermissions.find(r => r.resource === resource);
    if (!rp) return 'none';
    return rp.permissions[role] ?? 'none';
  };

  return { activeModules, navItems, canAccess, getPermission };
}
