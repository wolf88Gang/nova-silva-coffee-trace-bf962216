/**
 * Centralised toast-message catalogue for Nova Silva.
 *
 * Convention:
 *   - Success: past participle + object (≤ 6 words, no "!" / emojis)
 *   - Error  : "Error al" + infinitive + object
 *   - Always Spanish
 *
 * Usage:
 *   import { TOAST } from '@/lib/toastMessages';
 *   toast.success(TOAST.PRODUCTORES.CREATE.ok);
 *   toast.error(TOAST.PRODUCTORES.CREATE.err);
 */

/* helper type so every entry is { ok?: string; err?: string } */
interface Msg { ok?: string; err?: string }

/* ── Productores ─────────────────────────────────────────── */
const PRODUCTORES = {
  CREATE:       { ok: 'Productor creado correctamente',        err: 'Error al crear productor' },
  UPDATE:       { ok: 'Productor actualizado',                 err: 'Error al actualizar productor' },
  NAME_EMPTY:   {                                               err: 'El nombre es obligatorio' },
  EMAIL_BAD:    {                                               err: 'El formato del correo no es válido' },
} satisfies Record<string, Msg>;

/* ── Entregas ────────────────────────────────────────────── */
const ENTREGAS = {
  CREATE:       { ok: 'Entrega registrada correctamente',      err: 'Error al registrar entrega' },
  UPDATE:       { ok: 'Entrega actualizada',                   err: 'Error al actualizar entrega' },
  DELETE:       { ok: 'Entrega eliminada',                     err: 'Error al eliminar entrega' },
  PAGO:         { ok: 'Pago registrado correctamente',         err: 'Error al registrar pago' },
} satisfies Record<string, Msg>;

/* ── Lotes de Acopio ─────────────────────────────────────── */
const LOTES_ACOPIO = {
  CREATE:       { ok: 'Lote de acopio creado correctamente',   err: 'Error al crear lote de acopio' },
  UPDATE:       { ok: 'Lote de acopio actualizado',            err: 'Error al actualizar lote' },
  CLOSE:        { ok: 'Lote cerrado correctamente',            err: 'Error al cerrar lote' },
} satisfies Record<string, Msg>;

/* ── Lotes Comerciales ───────────────────────────────────── */
const LOTES_COMERCIALES = {
  CREATE:       { ok: 'Lote comercial creado correctamente',   err: 'Error al crear lote comercial' },
  UPDATE:       { ok: 'Lote comercial actualizado',            err: 'Error al actualizar lote comercial' },
  DELETE:       { ok: 'Lote comercial eliminado',              err: 'Error al eliminar lote comercial' },
  LINK_ACOPIO:  { ok: 'Lotes de acopio vinculados',           err: 'Error al vincular lotes de acopio' },
} satisfies Record<string, Msg>;

/* ── Ofertas y Subastas ──────────────────────────────────── */
const OFERTAS = {
  OFFER:        { ok: 'Lote ofrecido exitosamente',            err: 'Error al ofrecer lote' },
  REVOKE:       { ok: 'Oferta revocada',                       err: 'Error al revocar oferta' },
  SEND:         { ok: 'Oferta enviada',                        err: 'Error al enviar oferta' },
  ACCEPT:       { ok: 'Oferta aceptada - el exportador ha sido notificado', err: 'Error al aceptar oferta' },
  REJECT:       { ok: 'Oferta rechazada' },
  ADD_LOT:      { ok: 'Lote agregado a la oferta',             err: 'Error al agregar lote' },
  REMOVE_LOT:   { ok: 'Lote removido de la oferta',            err: 'Error al remover lote' },
} satisfies Record<string, Msg>;

/* ── Contratos ───────────────────────────────────────────── */
const CONTRATOS = {
  CREATE:       { ok: 'Contrato creado correctamente',         err: 'Error al crear contrato' },
  UPDATE:       { ok: 'Contrato actualizado',                  err: 'Error al actualizar contrato' },
  ADD_LOT:      { ok: 'Lote agregado al contrato',             err: 'Error al agregar lote' },
  REMOVE_LOT:   { ok: 'Lote removido del contrato',            err: 'Error al remover lote' },
} satisfies Record<string, Msg>;

/* ── Créditos ────────────────────────────────────────────── */
const CREDITOS = {
  CREATE:       { ok: 'Crédito registrado correctamente',      err: 'Error al registrar el crédito' },
  UPDATE:       { ok: 'Crédito actualizado correctamente',     err: 'Error al actualizar el crédito' },
  SOLICITUD:    { ok: 'Solicitud de crédito creada',           err: 'Error al crear la solicitud' },
} satisfies Record<string, Msg>;

/* ── Logística ───────────────────────────────────────────── */
const LOGISTICA = {
  CREATE:       { ok: 'Evento logístico registrado',           err: 'Error al registrar evento' },
  UPDATE:       { ok: 'Evento actualizado',                    err: 'Error al actualizar evento' },
  DELETE:       { ok: 'Evento eliminado',                      err: 'Error al eliminar evento' },
} satisfies Record<string, Msg>;

/* ── Usuarios y Permisos ─────────────────────────────────── */
const USUARIOS = {
  ADD:          { ok: 'Miembro agregado. Se enviará un correo de invitación.', err: 'Error al agregar miembro' },
  UPDATE:       { ok: 'Usuario actualizado',                   err: 'Error al actualizar usuario' },
  DELETE:       { ok: 'Usuario eliminado de la organización',  err: 'Error al eliminar usuario' },
  PERMISOS:     { ok: 'Permisos actualizados',                 err: 'Error al actualizar permisos' },
} satisfies Record<string, Msg>;

/* ── Inventario ──────────────────────────────────────────── */
const INVENTARIO = {
  CREATE:       { ok: 'Insumo registrado correctamente',      err: 'Error al registrar insumo' },
  UPDATE:       { ok: 'Insumo actualizado correctamente',     err: 'Error al actualizar insumo' },
  MOVIMIENTO:   { ok: 'Movimiento registrado',                 err: 'Error al registrar movimiento' },
} satisfies Record<string, Msg>;

/* ── Personas e Inclusión ────────────────────────────────── */
const PERSONAS = {
  CREATE:       { ok: 'Persona registrada correctamente',     err: 'Error al registrar persona' },
  UPDATE:       { ok: 'Información actualizada',               err: 'Error al actualizar información' },
  REPORT:       { ok: 'Reporte PDF descargado correctamente', err: 'Error al generar el reporte' },
  NO_DATA:      {                                               err: 'No hay datos para generar el reporte' },
} satisfies Record<string, Msg>;

/* ── Mensajería ──────────────────────────────────────────── */
const MENSAJES = {
  SEND:         { ok: 'Mensaje enviado',                       err: 'Error al enviar mensaje' },
  REPLY:        { ok: 'Respuesta enviada',                     err: 'Error al responder' },
  VISIBILITY:   { ok: 'Visibilidad actualizada' },
} satisfies Record<string, Msg>;

/* ── Protocolo VITAL ─────────────────────────────────────── */
const VITAL = {
  CREATE_EVAL:  { ok: 'Evaluación creada',                     err: 'Error al crear evaluación' },
  SAVE:         { ok: 'Respuestas guardadas',                  err: 'Error al guardar respuestas' },
} satisfies Record<string, Msg>;

/* ── Calidad ─────────────────────────────────────────────── */
const CALIDAD = {
  MUESTRA:      { ok: 'Muestra registrada',                    err: 'Error al registrar muestra' },
  CATACION_NEW: { ok: 'Catación registrada',                   err: 'Error al registrar catación' },
  CATACION_UPD: { ok: 'Catación actualizada',                  err: 'Error al actualizar catación' },
} satisfies Record<string, Msg>;

/* ── Public API ──────────────────────────────────────────── */
export const TOAST = {
  PRODUCTORES,
  ENTREGAS,
  LOTES_ACOPIO,
  LOTES_COMERCIALES,
  OFERTAS,
  CONTRATOS,
  CREDITOS,
  LOGISTICA,
  USUARIOS,
  INVENTARIO,
  PERSONAS,
  MENSAJES,
  VITAL,
  CALIDAD,
} as const;
