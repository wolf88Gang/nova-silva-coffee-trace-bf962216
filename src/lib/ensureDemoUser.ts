/**
 * Calls the ensure-demo-user Edge Function.
 *
 * REQUIRES an authenticated session. If no session exists, returns 401 immediately
 * without making a network request. The anon key is NEVER used as a fallback.
 *
 * Caller must invoke signInWithPassword BEFORE calling this function.
 */
import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/ensure-demo-user';

// The apikey header is required by Supabase infrastructure routing (not auth).
// Authorization: Bearer uses the real user token, not the anon key.
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFid21zYXJxZXd4anV3Z2tkZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDgyMjEsImV4cCI6MjA4MTMyNDIyMX0.fU8aFFLy07GaPZn_7namja1LLL2pCk4ohP-eJjEJUps';

export interface EnsureDemoResult {
  ok: boolean;
  error?: string;
  message?: string;
  status?: number;
}

/**
 * @param role            - demo role (cooperativa | exportador | certificadora | productor | tecnico)
 * @param organizationId  - platform_organizations.id for the selected org
 */
export async function ensureDemoUser(
  role: string,
  organizationId: string,
): Promise<EnsureDemoResult> {
  // Require an active authenticated session — no anon fallback.
  const { data: { session } } = await supabase.auth.getSession();

  if (!session?.access_token) {
    return {
      ok: false,
      status: 401,
      error: 'No hay sesión activa. La autenticación debe completarse antes de llamar a esta función.',
    };
  }

  if (!organizationId) {
    return {
      ok: false,
      status: 400,
      error: 'organization_id es obligatorio.',
    };
  }

  try {
    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ role, organization_id: organizationId }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const status = res.status;

      if (status === 401) {
        return { ok: false, status, error: 'Sesión inválida o expirada' };
      }
      if (status === 403) {
        return { ok: false, status, error: 'Acceso restringido: esta función es exclusiva para cuentas demo' };
      }
      if (status === 404) {
        return { ok: false, status, error: 'La función ensure-demo-user no está desplegada' };
      }
      if (status >= 500) {
        return { ok: false, status, error: `Error interno del servidor (${status}): ${body}` };
      }
      return { ok: false, status, error: `Error HTTP ${status}: ${body}` };
    }

    try {
      const body = await res.json();
      return { ok: body.ok !== false, status: res.status, message: body.message, error: body.error };
    } catch {
      return { ok: true, status: res.status };
    }
  } catch (err: any) {
    return {
      ok: false,
      error: `No se pudo conectar con la función: ${err.message || 'error de red'}`,
    };
  }
}

/**
 * Ping Edge Functions availability (for admin health check).
 */
export async function pingEdgeFunction(): Promise<{
  status: 'ok' | 'error';
  latencyMs?: number;
  detail: string;
}> {
  const start = performance.now();
  try {
    const res = await fetch(FUNCTION_URL, { method: 'OPTIONS' });
    const latency = Math.round(performance.now() - start);

    if (res.ok || res.status === 204) {
      return { status: 'ok', latencyMs: latency, detail: `${latency}ms (HTTP ${res.status})` };
    }
    if (res.status === 404) {
      return { status: 'error', latencyMs: latency, detail: 'Función no desplegada (404)' };
    }
    return { status: 'error', latencyMs: latency, detail: `HTTP ${res.status}` };
  } catch (err: any) {
    const latency = Math.round(performance.now() - start);
    return { status: 'error', latencyMs: latency, detail: `No se pudo conectar: ${err.message || 'error de red'}` };
  }
}
