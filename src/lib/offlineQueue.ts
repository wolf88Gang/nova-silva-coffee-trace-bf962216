const QUEUE_KEY = 'novasilva_offline_queue';
const MAX_RETRIES = 5;
const BASE_DELAY_MS = 1_000;

export interface QueuedOperation<T = unknown> {
  id: string;
  type: string;
  payload: T;
  createdAt: number;
  retries: number;
  lastAttempt: number | null;
  status: 'pending' | 'processing' | 'failed';
  error?: string;
}

function readQueue(): QueuedOperation[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: QueuedOperation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export function enqueue<T>(type: string, payload: T): QueuedOperation<T> {
  const op: QueuedOperation<T> = {
    id: `${type}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: Date.now(),
    retries: 0,
    lastAttempt: null,
    status: 'pending',
  };
  const queue = readQueue();
  queue.push(op as QueuedOperation);
  writeQueue(queue);
  return op;
}

export function dequeue(id: string): void {
  writeQueue(readQueue().filter(op => op.id !== id));
}

export function markFailed(id: string, error: string): void {
  const queue = readQueue();
  const op = queue.find(o => o.id === id);
  if (op) {
    op.retries += 1;
    op.lastAttempt = Date.now();
    op.error = error;
    op.status = op.retries >= MAX_RETRIES ? 'failed' : 'pending';
  }
  writeQueue(queue);
}

export function getPending(): QueuedOperation[] {
  const now = Date.now();
  return readQueue().filter(op => {
    if (op.status !== 'pending') return false;
    if (op.lastAttempt === null) return true;
    const delay = BASE_DELAY_MS * Math.pow(2, op.retries - 1);
    return now - op.lastAttempt >= delay;
  });
}

export function getAll(): QueuedOperation[] {
  return readQueue();
}

export function clearCompleted(): void {
  writeQueue(readQueue().filter(op => op.status !== 'failed'));
}

export type ProcessFn = (op: QueuedOperation) => Promise<void>;

export async function processQueue(processFn: ProcessFn): Promise<{ processed: number; failed: number }> {
  const pending = getPending();
  let processed = 0;
  let failed = 0;

  for (const op of pending) {
    const queue = readQueue();
    const current = queue.find(o => o.id === op.id);
    if (current) {
      current.status = 'processing';
      current.lastAttempt = Date.now();
      writeQueue(queue);
    }

    try {
      await processFn(op);
      dequeue(op.id);
      processed++;
    } catch (err) {
      markFailed(op.id, err instanceof Error ? err.message : String(err));
      failed++;
    }
  }

  return { processed, failed };
}
