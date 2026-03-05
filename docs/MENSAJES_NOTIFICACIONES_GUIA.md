# Guía: Mensajes y Notificaciones Predeterminados de Nova Silva

## Resumen
Nova Silva tiene **3 sistemas de comunicación** y **1 sistema de notificaciones**. Esta guía documenta todos los mensajes predeterminados (toasts, notificaciones in-app, y mensajes entre entidades) para garantizar consistencia en la reconstrucción.

---

## 1. Sistema de Toasts (Feedback Inmediato)

Los toasts son mensajes efímeros que confirman acciones del usuario. Se usan vía `sonner` (`toast.success`, `toast.error`).

### Convención de Redacción
- **Éxito**: Verbo en participio + objeto. Máximo 6 palabras.
- **Error**: "Error al" + infinitivo + objeto.
- **Sin signos de exclamación.**
- **Sin emojis.**

### Catálogo Completo por Módulo

#### Productores
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Crear productor | `Productor creado correctamente` | `Error al crear productor` |
| Editar productor | `Productor actualizado` | `Error al actualizar productor` |
| Validación nombre vacío | — | `El nombre es obligatorio` |
| Email inválido | — | `El formato del correo no es válido` |

#### Entregas
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Registrar entrega | `Entrega registrada correctamente` | `Error al registrar entrega` |
| Actualizar entrega | `Entrega actualizada` | `Error al actualizar entrega` |
| Eliminar entrega | `Entrega eliminada` | `Error al eliminar entrega` |
| Registrar pago | `Pago registrado correctamente` | `Error al registrar pago` |

#### Lotes de Acopio
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Crear lote | `Lote de acopio creado correctamente` | `Error al crear lote de acopio` |
| Actualizar lote | `Lote de acopio actualizado` | `Error al actualizar lote` |
| Cerrar lote | `Lote cerrado correctamente` | `Error al cerrar lote` |

#### Lotes Comerciales (Exportador)
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Crear lote comercial | `Lote comercial creado correctamente` | `Error al crear lote comercial` |
| Actualizar lote comercial | `Lote comercial actualizado` | `Error al actualizar lote comercial` |
| Eliminar lote comercial | `Lote comercial eliminado` | `Error al eliminar lote comercial` |
| Vincular lotes acopio | `Lotes de acopio vinculados` | `Error al vincular lotes de acopio` |

#### Ofertas y Subastas
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Ofrecer lote a exportador | `Lote ofrecido exitosamente` | `Error al ofrecer lote` |
| Revocar oferta | `Oferta revocada` | `Error al revocar oferta` |
| Enviar oferta (exportador) | `Oferta enviada` | `Error al enviar oferta` |
| Aceptar oferta | `Oferta aceptada - el exportador ha sido notificado` | `Error al aceptar oferta` |
| Rechazar oferta | `Oferta rechazada` | — |
| Agregar lote a oferta | `Lote agregado a la oferta` | `Error al agregar lote` |
| Remover lote de oferta | `Lote removido de la oferta` | `Error al remover lote` |

#### Contratos
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Crear contrato | `Contrato creado correctamente` | `Error al crear contrato` |
| Actualizar contrato | `Contrato actualizado` | `Error al actualizar contrato` |
| Agregar lote a contrato | `Lote agregado al contrato` | `Error al agregar lote` |
| Remover lote de contrato | `Lote removido del contrato` | `Error al remover lote` |

#### Créditos
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Registrar crédito | `Crédito registrado correctamente` | `Error al registrar el crédito` |
| Actualizar crédito | `Crédito actualizado correctamente` | `Error al actualizar el crédito` |
| Crear solicitud | `Solicitud de crédito creada` | `Error al crear la solicitud` |

#### Logística
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Registrar evento | `Evento logístico registrado` | `Error al registrar evento` |
| Actualizar evento | `Evento actualizado` | `Error al actualizar evento` |
| Eliminar evento | `Evento eliminado` | `Error al eliminar evento` |

#### Usuarios y Permisos
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Agregar miembro | `Miembro agregado. Se enviará un correo de invitación.` | `Error al agregar miembro` |
| Actualizar usuario | `Usuario actualizado` | `Error al actualizar usuario` |
| Eliminar usuario | `Usuario eliminado de la organización` | `Error al eliminar usuario` |
| Actualizar permisos | `Permisos actualizados` | `Error al actualizar permisos` |

#### Inventario e Insumos
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Crear insumo | `Insumo registrado correctamente` | `Error al registrar insumo` |
| Actualizar insumo | `Insumo actualizado correctamente` | `Error al actualizar insumo` |
| Registrar movimiento | `Movimiento registrado` | `Error al registrar movimiento` |

#### Personas e Inclusión
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Registrar persona | `Persona registrada correctamente` | `Error al registrar persona` |
| Actualizar persona | `Información actualizada` | `Error al actualizar información` |
| Descargar reporte | `Reporte PDF descargado correctamente` | `Error al generar el reporte` |
| Sin datos para reporte | — | `No hay datos para generar el reporte` |

#### Mensajería
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Enviar mensaje | `Mensaje enviado` | `Error al enviar mensaje` |
| Responder mensaje | `Respuesta enviada` | `Error al responder` |
| Actualizar visibilidad | `Visibilidad actualizada` | — |

#### Protocolo VITAL
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Crear evaluación | `Evaluación creada` | `Error al crear evaluación` |
| Guardar respuestas | `Respuestas guardadas` | `Error al guardar respuestas` |
| Solicitar validación | — | — |

#### Calidad (Muestras y Cataciones)
| Acción | Toast Éxito | Toast Error |
|---|---|---|
| Crear muestra | `Muestra registrada` | `Error al registrar muestra` |
| Crear catación | `Catación registrada` | `Error al registrar catación` |
| Actualizar catación | `Catación actualizada` | `Error al actualizar catación` |

---

## 2. Sistema de Notificaciones In-App

### Tabla: `notificaciones`

### Tipos de Notificación y Mensajes Predeterminados
| `tipo` | `titulo` | `mensaje` (template) | `link_accion` | Disparador |
|---|---|---|---|---|
| `oferta_aceptada` | Tu oferta fue aceptada | `La cooperativa aceptó tu oferta por el lote {codigo_lote}` | `/exportador/lotes-ofrecidos` | Cooperativa acepta oferta |
| `oferta_rechazada` | Oferta no aceptada | `La cooperativa rechazó tu oferta por el lote {codigo_lote}: {comentario}` | `/exportador/lotes-ofrecidos` | Cooperativa rechaza oferta |
| `nueva_oferta` | Nueva oferta recibida | `{exportador_nombre} ha enviado una oferta por el lote {codigo_lote}` | `/cooperativa/ofertas-recibidas` | Exportador envía oferta |
| `solicitud_validacion` | Acción requiere validación | `Acción marcada como completada, requiere validación` | `/cooperativa/vital` | Acción VITAL completada |
| `credito_aprobado` | Crédito aprobado | `Tu solicitud de crédito por {monto} ha sido aprobada` | `/productor/finanzas` | Cooperativa aprueba crédito |
| `credito_rechazado` | Crédito no aprobado | `Tu solicitud de crédito no fue aprobada: {motivo}` | `/productor/finanzas` | Cooperativa rechaza crédito |
| `mensaje_nuevo` | Nuevo mensaje | `{remitente} te envió un mensaje: {asunto}` | `/mensajes` | Nuevo mensaje |
| `entrega_registrada` | Entrega registrada | `Se registró tu entrega de {cantidad_kg} kg` | `/productor/entregas` | Cooperativa registra entrega |
| `lote_cerrado` | Lote cerrado | `El lote {codigo_lote} ha sido cerrado` | `/cooperativa/lotes` | Admin cierra lote |
| `contrato_creado` | Nuevo contrato | `Se creó el contrato {numero_contrato}` | `/exportador/contratos` | Sistema crea contrato |
| `eudr_alerta` | Alerta EUDR | `El lote {codigo_lote} tiene alertas de cumplimiento EUDR` | `/exportador/eudr` | Sistema detecta incumplimiento |

---

## 3. Sistema de Mensajes Cooperativa ↔ Productor

### Tabla: `mensajes_coop_productor`

#### Mensajes predeterminados sugeridos (plantillas para la cooperativa)
| Contexto | Asunto | Cuerpo sugerido |
|---|---|---|
| Bienvenida | Bienvenida a {cooperativa_nombre} | Estimado/a {productor_nombre}, su perfil ha sido creado en nuestra plataforma. |
| Recordatorio entrega | Recordatorio de entrega | Le recordamos que la próxima fecha de entrega es {fecha}. Favor confirmar disponibilidad. |
| Resultado VITAL | Resultado de evaluación VITAL | Su evaluación VITAL ha sido completada. Puntaje: {puntaje}. Nivel: {nivel}. |
| Acción VITAL pendiente | Acción pendiente | Tiene una acción pendiente: "{accion}". Fecha límite: {fecha_limite}. |
| Crédito aprobado | Crédito aprobado | Su solicitud de crédito por {monto} ha sido aprobada. Plazo: {plazo} meses. |
| Crédito rechazado | Solicitud de crédito | Lamentamos informar que su solicitud no fue aprobada. Motivo: {motivo}. |
| Pago registrado | Pago registrado | Se ha registrado un pago de {monto} por su entrega del {fecha}. |
| Alerta parcela | Alerta en parcela | Se ha detectado una situación en su parcela "{parcela_nombre}": {descripcion_alerta}. |

---

## 4. Sistema de Mensajes entre Organizaciones

### Tabla: `mensajes_organizacion`

#### Mensajes predeterminados por categoría

##### Categoría: `comercial`
| Contexto | Asunto | Cuerpo |
|---|---|---|
| Oferta de compra | Interés en lote {codigo} | Estimados, estamos interesados en su lote {codigo}. Volumen: {kg} kg. ¿Podrían compartir perfil de taza y condiciones? |
| Contraoferta | RE: Oferta lote {codigo} | Agradecemos su oferta. Nuestra contraoferta es de ${precio}/lb con condiciones {incoterm}, entrega {fecha}. |
| Confirmación | Confirmación - Lote {codigo} | Confirmamos la compra del lote {codigo} bajo las condiciones acordadas. |

##### Categoría: `operativo`
| Contexto | Asunto | Cuerpo |
|---|---|---|
| Solicitud documentación | Documentación requerida | Necesitamos la siguiente documentación para el lote {codigo}: {lista_documentos}. Fecha límite: {fecha}. |
| Actualización embarque | Actualización de embarque | El embarque del lote {codigo} ha sido programado para {fecha}. Puerto: {puerto}. Booking: {booking}. |
| Reclamo calidad | Reclamo de calidad - Lote {codigo} | Reportamos diferencia en perfil de taza del lote {codigo}. Puntaje oferta: {puntaje_offer} vs arribo: {puntaje_arrival}. |

##### Categoría: `urgente`
| Contexto | Asunto | Cuerpo |
|---|---|---|
| Alerta EUDR | [URGENTE] Alerta EUDR | Se detectaron inconsistencias en la trazabilidad del lote {codigo}. Parcelas sin georreferenciación: {lista}. |
| Rechazo embarque | [URGENTE] Embarque rechazado | El embarque {booking} fue rechazado en puerto. Motivo: {motivo}. Contactar urgente. |

##### Categoría: `general`
| Contexto | Asunto | Cuerpo |
|---|---|---|
| Presentación | Presentación - {organizacion_nombre} | Estimados, somos {organizacion_nombre}, {descripcion}. Nos interesa explorar oportunidades comerciales. |
| Vinculación | Solicitud de vinculación | Solicitamos vincularnos como proveedor/cliente en la plataforma Nova Silva. |

---

## 5. Flujos de Subastas

### Cooperativa ofrece lote público
1. **Toast cooperativa:** `Lote ofrecido exitosamente`
2. **Notificación exportadores:** `Nueva oferta disponible: Lote {codigo} de {cooperativa_nombre}`

### Exportador hace oferta
1. **Toast exportador:** `Oferta enviada`
2. **Notificación cooperativa:** `{exportador_nombre} ha enviado una oferta por el lote {codigo}`

### Cooperativa acepta oferta
1. **Toast cooperativa:** `Oferta aceptada - el exportador ha sido notificado`
2. **Notificación exportador:** tipo `oferta_aceptada`

### Cooperativa rechaza oferta
1. **Toast cooperativa:** `Oferta rechazada`
2. **Notificación exportador:** tipo `oferta_rechazada`

### Exportador revoca oferta
1. **Toast exportador:** `Oferta revocada`
2. Sin notificación automática

---

## 6. Flujos de Créditos

### Productor solicita crédito
1. **Toast:** `Solicitud de crédito creada`
2. **Notificación cooperativa:** `Nuevo solicitud de crédito de {productor_nombre} por {monto}`

### Cooperativa aprueba crédito
1. **Toast:** `Crédito registrado correctamente`
2. **Mensaje productor:** asunto `Crédito aprobado`
3. **Notificación:** tipo `credito_aprobado`

### Cooperativa rechaza crédito
1. **Toast:** `Crédito actualizado correctamente`
2. **Mensaje productor:** asunto `Solicitud de crédito`
3. **Notificación:** tipo `credito_rechazado`

---

## 7. Flujos VITAL

### Evaluación completada
- **Mensaje productor:** `Su evaluación VITAL ha sido completada. Puntaje global: {puntaje}/100.`

### Acción pendiente asignada
- **Notificación técnico:** tipo `solicitud_validacion`

### Acción validada
- **Mensaje productor:** `La acción "{accion}" ha sido validada por {tecnico_nombre}.`

---

## 8. Tablas Requeridas (Migración)

| Tabla | Propósito | Estado |
|---|---|---|
| `mensajes_coop_productor` | Mensajes cooperativa ↔ productor | Necesita migración |
| `mensajes_organizacion` | Mensajes entre organizaciones | Necesita migración |
| `notificaciones` | Notificaciones in-app | Necesita migración |
| `lotes_ofrecidos_exportadores` | Ofertas de subastas | Necesita migración |
| `solicitudes_credito_productor` | Solicitudes de crédito | Necesita migración |

---

## 9. Reglas de Consistencia

1. **Toasts siempre en español**, sin signos de exclamación
2. **Notificaciones** usan `titulo` corto (< 40 chars) y `mensaje` descriptivo (< 200 chars)
3. **Variables** se sustituyen con `{}` — nunca hardcodear datos
4. **`link_accion`** apunta a la ruta del rol correcto
5. **Categoría `urgente`** reservada para alertas EUDR, rechazos de embarque, y problemas de cumplimiento
6. **No enviar notificación duplicada** si ya hay toast (toast = actor, notificación = receptor)
7. **Mensajes predeterminados** son sugerencias editables
