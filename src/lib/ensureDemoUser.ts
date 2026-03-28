/**
 * Calls the ensure-demo-user Edge Function.
 * SECURITY: Requires authenticated session. Will NOT fall back to anon key.
 * Flow: signInWithPassword FIRST → then call this function.
 */
import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/ensure-demo-user';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFid21zYXJxZXd4anV3Z2tkZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDgyMjEsImV4cCI6MjA4MTMyNDIyMX0.fU8aFFLy07GaPZn_7namja1LLL2pCk4ohP-eJjEJUps';
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export interface EnsureDemoResult {
  ok: boolean;
  error?: string;
  message?: string;
  user_id?: string;
  organization_id?: string | null;
  status?: number;
}

export function isUuidOrganizationId(value?: string | null): value is string {
  return Boolean(value && UUID_REGEX.test(value));
}

/**
 * Ensure demo user profile, role, and org linkage.
 * MUST be called AFTER successful signInWithPassword.
 * @param role - one of cooperativa, exportador, certificadora, productor, tecnico
 * @param organizationId - optional UUID from platform_organizations
 */
export async function ensureDemoUser(
  role: string,
  organizationId?: string
): Promise<EnsureDemoResult> {
  // SECURITY: Require real authenticated session — NO anon fallback
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  if (!token) {
    return {
      ok: false,
      error: 'No hay sesión activa. Debes iniciar sesión antes de llamar ensure-demo-user.',
      status: 401,
    };
  }

  try {
    const body: Record<string, string> = { role };
    if (isUuidOrganizationId(organizationId)) {
      body.organization_id = organizationId;
    }

    const res = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': ANON_KEY,
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const responseBody = await res.text().catch(() => '');
      const status = res.status;

      if (status === 401) {
        return { ok: false, status, error: 'Sesión inválida o expirada. Recarga e intenta de nuevo.' };
      }
      if (status === 404) {
        return { ok: false, status, error: 'La función ensure-demo-user no está desplegada.' };
      }
      if (status >= 500) {
        return { ok: false, status, error: `Error interno del servidor (${status}): ${responseBody}` };
      }
      // Parse structured error if possible
      try {
        const parsed = JSON.parse(responseBody);
        return { ok: false, status, error: parsed.error || `Error HTTP ${status}` };
      } catch {
        return { ok: false, status, error: `Error HTTP ${status}: ${responseBody}` };
      }
    }

    try {
      const responseJson = await res.json();
      return {
        ok: responseJson.ok !== false,
        status: res.status,
        message: responseJson.message,
        error: responseJson.error,
        user_id: responseJson.user_id,
        organization_id: responseJson.organization_id,
      };
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
 * Ping Edge Functions availability (admin health check).
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
