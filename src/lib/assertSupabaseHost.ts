/**
 * Dev-only runtime assertion: ensures all Supabase requests go to the external project.
 * Import and call once at app boot (e.g., in App.tsx or AuthContext).
 *
 * In production builds this is a no-op.
 */

const EXPECTED_HOST = 'qbwmsarqewxjuwgkdfmg.supabase.co';

export function assertSupabaseHost(): void {
  if (!import.meta.env.DEV) return;

  // Verify the hardcoded client URL matches expectations
  const clientModule = import.meta.glob('../integrations/supabase/client.ts', { eager: true }) as Record<string, any>;
  const mod = Object.values(clientModule)[0];
  if (!mod?.supabase) {
    console.warn('[assertSupabaseHost] Could not locate supabase client export');
    return;
  }

  // Access the internal URL from the client
  const url: string = (mod.supabase as any).supabaseUrl ?? '';
  if (!url.includes(EXPECTED_HOST)) {
    const msg = `[SECURITY] Supabase client is NOT pointing to external project.\nExpected host: ${EXPECTED_HOST}\nGot: ${url}\nRefusing to continue.`;
    console.error(msg);
    throw new Error(msg);
  }

  console.info(`[assertSupabaseHost] ✓ Supabase → ${EXPECTED_HOST}`);
}
