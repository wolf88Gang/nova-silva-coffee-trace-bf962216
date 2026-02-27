/**
 * Offline-first queue for onboarding RPC calls.
 * Stores failed payloads in localStorage and retries on reconnect.
 */
const QUEUE_KEY = 'novasilva_onboarding_queue';

export interface QueuedPayload {
  id: string;
  payload: Record<string, unknown>;
  finalize?: boolean;
  timestamp: number;
}

export function getQueue(): QueuedPayload[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function enqueue(payload: Record<string, unknown>, finalize?: boolean) {
  const queue = getQueue();
  queue.push({ id: crypto.randomUUID(), payload, finalize, timestamp: Date.now() });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function dequeue(id: string) {
  const queue = getQueue().filter(q => q.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}
