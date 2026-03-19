/**
 * Servicio: captura de leads demo.
 * Orquesta el repository. Sin fallback mock.
 */

import { insertLeadInDb } from '@/repositories/demoLeadsRepository';
import type { DemoLeadPayload } from '@/types/demoLeads';

export interface SubmitLeadResult {
  ok: boolean;
  id?: string;
  error?: string;
}

export async function submitLead(payload: DemoLeadPayload): Promise<SubmitLeadResult> {
  try {
    const row = await insertLeadInDb(payload);
    return { ok: true, id: row.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al guardar el lead';
    return { ok: false, error: msg };
  }
}
