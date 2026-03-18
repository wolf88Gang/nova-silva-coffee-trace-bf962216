/**
 * Centralized demo error interpretation.
 * Maps HTTP status codes and error conditions to user-friendly messages.
 */

export interface DemoErrorInfo {
  title: string;
  description: string;
  canRetry: boolean;
}

export function interpretDemoError(result: { ok: boolean; error?: string; status?: number }): DemoErrorInfo {
  if (result.ok) {
    return { title: '', description: '', canRetry: false };
  }

  const status = result.status;
  const error = result.error || '';

  if (status === 401) {
    return {
      title: 'Sesión expirada',
      description: 'Tu sesión ha expirado. Recarga la página e intenta de nuevo.',
      canRetry: true,
    };
  }

  if (status === 404) {
    return {
      title: 'Servicio no disponible',
      description: 'La función de demo no está desplegada en este momento.',
      canRetry: false,
    };
  }

  if (status && status >= 500) {
    return {
      title: 'Error interno del sistema',
      description: error || `El servidor respondió con error (${status}). Intenta de nuevo en unos minutos.`,
      canRetry: true,
    };
  }

  if (error.includes('conectar') || error.includes('red') || error.includes('network') || error.includes('CORS')) {
    return {
      title: 'Sin conexión',
      description: 'No se pudo conectar con el servidor. Verifica tu conexión a internet.',
      canRetry: true,
    };
  }

  // Function returned an error message
  if (error) {
    return {
      title: 'Error preparando demo',
      description: error,
      canRetry: true,
    };
  }

  return {
    title: 'Error inesperado',
    description: 'Ocurrió un error al preparar el entorno de demostración.',
    canRetry: true,
  };
}

/**
 * Check if ensure-demo-user returned a "no org" warning.
 */
export function isNoOrgResult(result: { ok: boolean; message?: string }): boolean {
  return result.ok && typeof (result as any).message === 'string' &&
    (result as any).message.toLowerCase().includes('sin organización');
}
