/**
 * Plantillas de comunicación con clientes.
 * Cada plantilla tiene versión in-app (notificación) y versión email (HTML).
 * Variables entre {llaves} se reemplazan con datos reales.
 */

export type CommunicationChannel = 'in_app' | 'email' | 'ambos';

export interface CommunicationTemplate {
  id: string;
  nombre: string;
  categoria: 'transaccional' | 'bienvenida' | 'seguridad' | 'operativo' | 'comercial';
  asunto: string;
  cuerpoTexto: string;
  cuerpoHtml: string;
  variables: string[];
  canal: CommunicationChannel;
}

export const COMMUNICATION_TEMPLATES: Record<string, CommunicationTemplate> = {
  // ─── Bienvenida ────────────────────────────────────────
  bienvenida_productor: {
    id: 'bienvenida_productor',
    nombre: 'Bienvenida productor',
    categoria: 'bienvenida',
    asunto: 'Bienvenido a {organizacion_nombre}',
    cuerpoTexto:
      'Estimado/a {nombre_completo}, le damos la bienvenida a {organizacion_nombre}. Su perfil ha sido creado exitosamente en nuestra plataforma Nova Silva. A partir de ahora puede consultar sus entregas, evaluaciones y finanzas desde su panel.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Bienvenido a {organizacion_nombre}</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Estimado/a <strong>{nombre_completo}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Le damos la bienvenida a <strong>{organizacion_nombre}</strong>. Su perfil ha sido creado exitosamente en nuestra plataforma Nova Silva.</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">A partir de ahora puede consultar sus entregas, evaluaciones y finanzas desde su panel.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_plataforma}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Ingresar a Nova Silva</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Plataforma Nova Silva</p>
  </div>
</div>`,
    variables: ['nombre_completo', 'organizacion_nombre', 'link_plataforma'],
    canal: 'ambos',
  },

  bienvenida_exportador: {
    id: 'bienvenida_exportador',
    nombre: 'Bienvenida exportador',
    categoria: 'bienvenida',
    asunto: 'Bienvenido a Nova Silva',
    cuerpoTexto:
      'Estimados {organizacion_nombre}, su cuenta de exportador ha sido creada en Nova Silva. Ya puede explorar lotes disponibles, gestionar contratos y coordinar embarques.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Bienvenido a Nova Silva</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Estimados <strong>{organizacion_nombre}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Su cuenta de exportador ha sido creada exitosamente. Ya puede explorar lotes disponibles, gestionar contratos y coordinar embarques.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_plataforma}" style="background:hsl(25,75%,55%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Explorar Lotes</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">Nova Silva · Trazabilidad cafetera</p>
  </div>
</div>`,
    variables: ['organizacion_nombre', 'link_plataforma'],
    canal: 'ambos',
  },

  // ─── Transaccionales ──────────────────────────────────
  confirmacion_pago: {
    id: 'confirmacion_pago',
    nombre: 'Confirmacion de pago',
    categoria: 'transaccional',
    asunto: 'Pago registrado por {monto}',
    cuerpoTexto:
      'Estimado/a {nombre_completo}, se ha registrado un pago de {monto} correspondiente a su entrega del {fecha_entrega}. Referencia: {referencia}.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Pago Registrado</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Estimado/a <strong>{nombre_completo}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Se ha registrado exitosamente el siguiente pago:</p>
    <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid hsl(145,55%,45%);">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Monto</td><td style="color:#333;font-weight:600;font-size:15px;text-align:right;">{monto}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Fecha entrega</td><td style="color:#333;font-size:14px;text-align:right;">{fecha_entrega}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Referencia</td><td style="color:#333;font-size:14px;text-align:right;">{referencia}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Cantidad</td><td style="color:#333;font-size:14px;text-align:right;">{cantidad_kg} kg</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_finanzas}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Ver Mis Finanzas</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p>
  </div>
</div>`,
    variables: ['nombre_completo', 'monto', 'fecha_entrega', 'referencia', 'cantidad_kg', 'organizacion_nombre', 'link_finanzas'],
    canal: 'ambos',
  },

  confirmacion_entrega: {
    id: 'confirmacion_entrega',
    nombre: 'Confirmacion de entrega',
    categoria: 'transaccional',
    asunto: 'Entrega registrada: {cantidad_kg} kg',
    cuerpoTexto:
      'Estimado/a {nombre_completo}, su entrega de {cantidad_kg} kg ha sido registrada el {fecha}. Lote asignado: {codigo_lote}.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Entrega Registrada</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Estimado/a <strong>{nombre_completo}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Su entrega ha sido registrada exitosamente:</p>
    <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid hsl(120,55%,23%);">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Cantidad</td><td style="color:#333;font-weight:600;font-size:15px;text-align:right;">{cantidad_kg} kg</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Fecha</td><td style="color:#333;font-size:14px;text-align:right;">{fecha}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Lote</td><td style="color:#333;font-size:14px;text-align:right;">{codigo_lote}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_entregas}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Ver Mis Entregas</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p>
  </div>
</div>`,
    variables: ['nombre_completo', 'cantidad_kg', 'fecha', 'codigo_lote', 'organizacion_nombre', 'link_entregas'],
    canal: 'ambos',
  },

  credito_aprobado_email: {
    id: 'credito_aprobado_email',
    nombre: 'Credito aprobado',
    categoria: 'transaccional',
    asunto: 'Credito aprobado por {monto}',
    cuerpoTexto:
      'Estimado/a {nombre_completo}, su solicitud de credito por {monto} ha sido aprobada. Plazo: {plazo} meses. Tasa: {tasa}%.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(145,55%,45%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Credito Aprobado</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Estimado/a <strong>{nombre_completo}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Nos complace informarle que su solicitud de credito ha sido <strong style="color:hsl(145,55%,35%);">aprobada</strong>.</p>
    <div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border:1px solid hsl(145,55%,80%);">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Monto aprobado</td><td style="color:#333;font-weight:600;font-size:15px;text-align:right;">{monto}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Plazo</td><td style="color:#333;font-size:14px;text-align:right;">{plazo} meses</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Tasa</td><td style="color:#333;font-size:14px;text-align:right;">{tasa}%</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_finanzas}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Ver Detalle</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p>
  </div>
</div>`,
    variables: ['nombre_completo', 'monto', 'plazo', 'tasa', 'organizacion_nombre', 'link_finanzas'],
    canal: 'ambos',
  },

  // ─── Seguridad ────────────────────────────────────────
  reset_password: {
    id: 'reset_password',
    nombre: 'Restablecimiento de contrasena',
    categoria: 'seguridad',
    asunto: 'Restablecer tu contrasena',
    cuerpoTexto:
      'Hola {nombre_completo}, recibimos una solicitud para restablecer tu contrasena. Usa el siguiente enlace para crear una nueva: {link_reset}. Este enlace expira en {minutos_expiracion} minutos.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Restablecer Contrasena</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Hola <strong>{nombre_completo}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Recibimos una solicitud para restablecer tu contrasena. Haz clic en el boton de abajo para crear una nueva.</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_reset}" style="background:hsl(25,75%,55%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Restablecer Contrasena</a>
    </div>
    <p style="color:#999;font-size:13px;line-height:1.5;">Este enlace expira en {minutos_expiracion} minutos. Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">Nova Silva · Seguridad de cuenta</p>
  </div>
</div>`,
    variables: ['nombre_completo', 'link_reset', 'minutos_expiracion'],
    canal: 'email',
  },

  verificacion_email: {
    id: 'verificacion_email',
    nombre: 'Verificacion de correo',
    categoria: 'seguridad',
    asunto: 'Verifica tu correo electronico',
    cuerpoTexto:
      'Hola {nombre_completo}, verifica tu correo electronico haciendo clic en el siguiente enlace: {link_verificacion}.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Verifica tu Correo</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Hola <strong>{nombre_completo}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Para completar tu registro, por favor verifica tu correo electronico haciendo clic en el siguiente boton:</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_verificacion}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Verificar Correo</a>
    </div>
    <p style="color:#999;font-size:13px;">Si no creaste una cuenta, puedes ignorar este mensaje.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">Nova Silva</p>
  </div>
</div>`,
    variables: ['nombre_completo', 'link_verificacion'],
    canal: 'email',
  },

  // ─── Operativo ────────────────────────────────────────
  resultado_vital: {
    id: 'resultado_vital',
    nombre: 'Resultado evaluacion VITAL',
    categoria: 'operativo',
    asunto: 'Resultado de evaluacion VITAL',
    cuerpoTexto:
      'Estimado/a {nombre_completo}, su evaluacion VITAL ha sido completada. Puntaje global: {puntaje}/100. Nivel: {nivel}.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Resultado VITAL</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Estimado/a <strong>{nombre_completo}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Su evaluacion VITAL ha sido completada con los siguientes resultados:</p>
    <div style="background:#f8f9fa;border-radius:12px;padding:24px;margin:20px 0;text-align:center;">
      <p style="color:#888;font-size:13px;margin:0 0 8px 0;">Puntaje Global</p>
      <p style="color:hsl(120,55%,23%);font-size:42px;font-weight:700;margin:0;">{puntaje}<span style="font-size:18px;color:#888;">/100</span></p>
      <p style="color:#555;font-size:15px;margin:12px 0 0 0;">Nivel: <strong>{nivel}</strong></p>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_vital}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Ver Detalle Completo</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Protocolo VITAL</p>
  </div>
</div>`,
    variables: ['nombre_completo', 'puntaje', 'nivel', 'organizacion_nombre', 'link_vital'],
    canal: 'ambos',
  },

  recordatorio_entrega: {
    id: 'recordatorio_entrega',
    nombre: 'Recordatorio de entrega',
    categoria: 'operativo',
    asunto: 'Recordatorio: Entrega programada para {fecha}',
    cuerpoTexto:
      'Estimado/a {nombre_completo}, le recordamos que su proxima entrega esta programada para el {fecha} en el punto de acopio {punto_acopio}. Favor confirmar disponibilidad.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(25,75%,55%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Recordatorio de Entrega</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Estimado/a <strong>{nombre_completo}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Le recordamos que su proxima entrega esta programada:</p>
    <div style="background:#fff7ed;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid hsl(25,75%,55%);">
      <p style="color:#333;font-size:15px;margin:0;"><strong>Fecha:</strong> {fecha}</p>
      <p style="color:#333;font-size:15px;margin:8px 0 0 0;"><strong>Punto de acopio:</strong> {punto_acopio}</p>
    </div>
    <p style="color:#555;font-size:15px;">Favor confirmar disponibilidad con su tecnico asignado.</p>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p>
  </div>
</div>`,
    variables: ['nombre_completo', 'fecha', 'punto_acopio', 'organizacion_nombre'],
    canal: 'ambos',
  },

  // ─── Comercial ────────────────────────────────────────
  oferta_comercial: {
    id: 'oferta_comercial',
    nombre: 'Oferta comercial',
    categoria: 'comercial',
    asunto: 'Oferta por lote {codigo_lote}',
    cuerpoTexto:
      'Estimados {organizacion_destino}, hemos recibido una oferta de {exportador_nombre} por el lote {codigo_lote}. Precio ofrecido: {precio}/lb. Condiciones: {incoterm}.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Oferta Comercial</h1>
  </div>
  <div style="padding:32px 24px;">
    <p style="color:#333;font-size:15px;line-height:1.6;">Estimados <strong>{organizacion_destino}</strong>,</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Se ha recibido una oferta comercial:</p>
    <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid hsl(25,75%,55%);">
      <table style="width:100%;border-collapse:collapse;">
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Exportador</td><td style="color:#333;font-weight:600;text-align:right;">{exportador_nombre}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Lote</td><td style="color:#333;text-align:right;">{codigo_lote}</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Precio</td><td style="color:#333;font-weight:600;text-align:right;">{precio}/lb</td></tr>
        <tr><td style="color:#888;font-size:13px;padding:4px 0;">Condiciones</td><td style="color:#333;text-align:right;">{incoterm}</td></tr>
      </table>
    </div>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_ofertas}" style="background:hsl(25,75%,55%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Revisar Oferta</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">Nova Silva · Comercializacion</p>
  </div>
</div>`,
    variables: ['organizacion_destino', 'exportador_nombre', 'codigo_lote', 'precio', 'incoterm', 'link_ofertas'],
    canal: 'ambos',
  },

  alerta_eudr: {
    id: 'alerta_eudr',
    nombre: 'Alerta EUDR',
    categoria: 'comercial',
    asunto: '[Urgente] Alerta EUDR: Lote {codigo_lote}',
    cuerpoTexto:
      'Se han detectado inconsistencias en la trazabilidad del lote {codigo_lote}. Parcelas sin georreferenciacion: {lista_parcelas}. Accion requerida antes del {fecha_limite}.',
    cuerpoHtml: `
<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;">
  <div style="background:hsl(0,72%,52%);padding:32px 24px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:22px;">Alerta EUDR</h1>
  </div>
  <div style="padding:32px 24px;">
    <div style="background:#fef2f2;border:1px solid hsl(0,72%,85%);border-radius:8px;padding:16px;margin-bottom:20px;">
      <p style="color:hsl(0,72%,42%);font-size:14px;font-weight:600;margin:0;">Accion requerida antes del {fecha_limite}</p>
    </div>
    <p style="color:#555;font-size:15px;line-height:1.6;">Se han detectado inconsistencias en la trazabilidad del lote <strong>{codigo_lote}</strong>.</p>
    <p style="color:#555;font-size:15px;line-height:1.6;">Parcelas sin georreferenciacion:</p>
    <p style="color:#333;font-size:14px;background:#f8f9fa;padding:12px;border-radius:6px;">{lista_parcelas}</p>
    <div style="text-align:center;margin:28px 0;">
      <a href="{link_eudr}" style="background:hsl(0,72%,52%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;font-size:15px;">Resolver Ahora</a>
    </div>
  </div>
  <div style="background:#f5f5f5;padding:16px 24px;text-align:center;">
    <p style="color:#999;font-size:12px;margin:0;">Nova Silva · Cumplimiento EUDR</p>
  </div>
</div>`,
    variables: ['codigo_lote', 'lista_parcelas', 'fecha_limite', 'link_eudr'],
    canal: 'ambos',
  },
};

/** Get templates by category */
export function getTemplatesByCategory(categoria: CommunicationTemplate['categoria']) {
  return Object.values(COMMUNICATION_TEMPLATES).filter(t => t.categoria === categoria);
}

/** Get all template categories with counts */
export function getTemplateCategorySummary() {
  const cats = Object.values(COMMUNICATION_TEMPLATES).reduce(
    (acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  return cats;
}

/** Replace {key} placeholders */
export function fillCommunicationTemplate(
  template: string,
  vars: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => String(vars[key] ?? `{${key}}`));
}
