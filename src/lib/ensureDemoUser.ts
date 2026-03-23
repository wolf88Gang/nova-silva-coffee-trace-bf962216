/**
 * Calls the ensure-demo-user Edge Function with proper error handling.
 * Uses fetch with explicit session propagation (not supabase.functions.invoke
 * per project convention for external Supabase).
 */
import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = 'https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/ensure-demo-user';

export interface EnsureDemoResult {
  ok: boolean;
  error?: string;
  message?: string;
  /** HTTP status code if available */
  status?: number;
}

export async function ensureDemoUser(role: string): Promise<EnsureDemoResult> {
  const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFid21zYXJxZXd4anV3Z2tkZm1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU3NDgyMjEsImV4cCI6MjA4MTMyNDIyMX0.fU8aFFLy07GaPZn_7namja1LLL2pCk4ohP-eJjEJUps';

  const runRequest = async (bearerToken: string) => {
    return fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anonKey,
        Authorization: `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({ role }),
    });
  };

  try {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    // Demo access must work even when there is a stale/expired local session.
    // Prefer the anon key for pre-login bootstrap and only retry with session token if needed.
    let res = await runRequest(anonKey);

    if (res.status === 401 && token) {
      res = await runRequest(token);
    }

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      const status = res.status;

      if (status === 401) {
        return { ok: false, status, error: 'No fue posible preparar la cuenta demo' };
      }
      if (status === 404) {
        return { ok: false, status, error: 'La función ensure-demo-user no está desplegada' };
      }
      if (status >= 500) {
        return { ok: false, status, error: `La función respondió con error interno (${status}): ${body}` };
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
 * Uses HEAD/OPTIONS to check reachability without triggering business logic.
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
