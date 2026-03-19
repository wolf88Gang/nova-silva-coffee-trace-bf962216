/**
 * Configuración admin: producción vs desarrollo.
 * En producción: no usar fallback mock silencioso; mostrar error verificable.
 * En desarrollo: fallback permitido con banner degradado.
 */

export const ADMIN_ALLOW_MOCK_FALLBACK = import.meta.env.DEV;
