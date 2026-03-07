/**
 * Organization module system.
 * Controls which features/modules are visible per organization.
 * 
 * activeModules controls VISIBILITY of modules in the UI.
 * role controls PERMISSIONS within active modules.
 * 
 * These are orthogonal: a module can be active but a specific role
 * may only have read access within it.
 */

export type OrgModule =
  | 'core'           // Always active: dashboard, profile, settings
  | 'productores'    // Actors/suppliers/socios management
  | 'parcelas'       // Farm plots, maps, geolocation
  | 'entregas'       // Field deliveries / acopio
  | 'lotes_acopio'   // Acopio lots, processing
  | 'lotes_comerciales' // Commercial lots, export
  | 'contratos'      // Contracts with buyers
  | 'calidad'        // Quality / Nova Cup / cataciones
  | 'vital'          // Protocolo VITAL diagnostics
  | 'eudr'           // EUDR compliance packages
  | 'finanzas'       // Finance transactions
  | 'creditos'       // Producer credits
  | 'jornales'       // Labor management
  | 'inventario'     // Equipment & supplies inventory
  | 'mensajes'       // Internal messaging
  | 'inclusion'      // Inclusión y equidad
  | 'nutricion'      // Nutrición de parcelas
  | 'admin';         // Platform admin (Nova Silva internal)

/** Minimal org data needed to resolve modules */
export interface OrgModuleSource {
  modules?: OrgModule[] | null;
  is_eudr_active?: boolean;
  is_vital_active?: boolean;
  tipo?: string | null;
}

/**
 * Resolve active modules for an organization.
 * Priority:
 * 1. Explicit `modules` array from org record
 * 2. Legacy boolean flags (is_eudr_active, is_vital_active)
 * 3. Default modules by org type
 */
export function getActiveModules(org: OrgModuleSource | null | undefined): OrgModule[] {
  if (!org) return getOrgDefaultModules(null);

  // If explicit modules array exists and is non-empty, use it
  if (org.modules && Array.isArray(org.modules) && org.modules.length > 0) {
    const mods: OrgModule[] = ['core', ...org.modules];
    return [...new Set(mods)];
  }

  // Fallback: start with defaults for org type, then augment with legacy flags
  const defaults = getOrgDefaultModules(org.tipo);
  const mods = new Set<OrgModule>(defaults);

  if (org.is_vital_active) mods.add('vital');
  if (org.is_eudr_active) mods.add('eudr');

  return [...mods];
}

/**
 * Default modules by organization type.
 * Used when org.modules is null/empty (legacy orgs or new orgs without explicit config).
 */
export function getOrgDefaultModules(orgTipo: string | null | undefined): OrgModule[] {
  switch (orgTipo) {
    case 'cooperativa':
      return [
        'core', 'productores', 'parcelas', 'entregas', 'lotes_acopio',
        'calidad', 'vital', 'finanzas', 'creditos', 'jornales',
        'inventario', 'mensajes', 'inclusion', 'nutricion',
      ];

    case 'exportador':
      // Exportador operativo (full): includes field operations + commercial.
      // Exportador comercial (trading-only) should have a reduced modules list
      // set explicitly in org.modules — this default covers the broader case.
      return [
        'core', 'productores', 'parcelas', 'entregas', 'lotes_acopio',
        'lotes_comerciales', 'contratos', 'calidad', 'eudr', 'finanzas',
        'mensajes',
      ];

    case 'beneficio_privado':
      return [
        'core', 'productores', 'parcelas', 'entregas', 'lotes_acopio',
        'calidad', 'vital', 'finanzas', 'jornales', 'inventario', 'mensajes',
      ];

    case 'productor':
    case 'productor_empresarial':
      return [
        'core', 'parcelas', 'vital', 'finanzas', 'inventario', 'mensajes',
      ];

    case 'aggregator':
      return [
        'core', 'productores', 'entregas', 'lotes_acopio',
        'lotes_comerciales', 'finanzas', 'mensajes',
      ];

    case 'certificadora':
      return ['core', 'vital', 'eudr'];

    case 'tecnico':
      return ['core', 'productores', 'parcelas', 'vital'];

    case 'admin':
      return ['core', 'admin'];

    default:
      return ['core'];
  }
}

/** Check if a specific module is active */
export function hasModule(activeModules: OrgModule[], mod: OrgModule): boolean {
  return activeModules.includes(mod);
}

/** Check if any of the given modules is active */
export function hasAnyModule(activeModules: OrgModule[], mods: OrgModule[]): boolean {
  return mods.some(m => activeModules.includes(m));
}
