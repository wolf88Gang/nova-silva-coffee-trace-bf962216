/**
 * Notification templates for the in-app notification system.
 *
 * Variables inside `{}` are replaced at runtime with actual values.
 * Titles must be < 40 chars; messages < 200 chars.
 */

export interface NotificationTemplate {
  tipo: string;
  titulo: string;
  mensaje: string;
  linkAccion: string;
}

export const NOTIFICATION_TEMPLATES: Record<string, NotificationTemplate> = {
  oferta_aceptada: {
    tipo: 'oferta_aceptada',
    titulo: 'Tu oferta fue aceptada',
    mensaje: 'La cooperativa aceptó tu oferta por el lote {codigo_lote}',
    linkAccion: '/exportador/lotes-ofrecidos',
  },
  oferta_rechazada: {
    tipo: 'oferta_rechazada',
    titulo: 'Oferta no aceptada',
    mensaje: 'La cooperativa rechazó tu oferta por el lote {codigo_lote}: {comentario}',
    linkAccion: '/exportador/lotes-ofrecidos',
  },
  nueva_oferta: {
    tipo: 'nueva_oferta',
    titulo: 'Nueva oferta recibida',
    mensaje: '{exportador_nombre} ha enviado una oferta por el lote {codigo_lote}',
    linkAccion: '/cooperativa/ofertas-recibidas',
  },
  solicitud_validacion: {
    tipo: 'solicitud_validacion',
    titulo: 'Acción requiere validación',
    mensaje: 'Acción marcada como completada, requiere validación',
    linkAccion: '/cooperativa/vital',
  },
  credito_aprobado: {
    tipo: 'credito_aprobado',
    titulo: 'Crédito aprobado',
    mensaje: 'Tu solicitud de crédito por {monto} ha sido aprobada',
    linkAccion: '/productor/finanzas',
  },
  credito_rechazado: {
    tipo: 'credito_rechazado',
    titulo: 'Crédito no aprobado',
    mensaje: 'Tu solicitud de crédito no fue aprobada: {motivo}',
    linkAccion: '/productor/finanzas',
  },
  mensaje_nuevo: {
    tipo: 'mensaje_nuevo',
    titulo: 'Nuevo mensaje',
    mensaje: '{remitente} te envió un mensaje: {asunto}',
    linkAccion: '/mensajes',
  },
  entrega_registrada: {
    tipo: 'entrega_registrada',
    titulo: 'Entrega registrada',
    mensaje: 'Se registró tu entrega de {cantidad_kg} kg',
    linkAccion: '/productor/entregas',
  },
  lote_cerrado: {
    tipo: 'lote_cerrado',
    titulo: 'Lote cerrado',
    mensaje: 'El lote {codigo_lote} ha sido cerrado',
    linkAccion: '/cooperativa/lotes',
  },
  contrato_creado: {
    tipo: 'contrato_creado',
    titulo: 'Nuevo contrato',
    mensaje: 'Se creó el contrato {numero_contrato}',
    linkAccion: '/exportador/contratos',
  },
  eudr_alerta: {
    tipo: 'eudr_alerta',
    titulo: 'Alerta EUDR',
    mensaje: 'El lote {codigo_lote} tiene alertas de cumplimiento EUDR',
    linkAccion: '/exportador/eudr',
  },
} as const;

/**
 * Replace `{key}` placeholders in a template string with actual values.
 *
 * @example
 * fillTemplate('Lote {codigo} — {kg} kg', { codigo: 'L-001', kg: '500' })
 * // → 'Lote L-001 — 500 kg'
 */
export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}

/**
 * Build a ready-to-insert notification row from a template key + variables.
 */
export function buildNotification(
  templateKey: keyof typeof NOTIFICATION_TEMPLATES,
  vars: Record<string, string | number>,
  userId: string,
  organizationId: string,
) {
  const tpl = NOTIFICATION_TEMPLATES[templateKey];
  return {
    tipo: tpl.tipo,
    titulo: tpl.titulo,
    cuerpo: fillTemplate(tpl.mensaje, vars),
    link_url: tpl.linkAccion,
    user_id: userId,
    organization_id: organizationId,
  };
}
