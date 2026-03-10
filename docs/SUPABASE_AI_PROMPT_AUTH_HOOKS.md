# Prompt para Supabase AI — Auth Hooks y Emails Personalizados

> **Copia y pega este texto completo en el Supabase AI Assistant** para configurar Auth Hooks que envíen emails de autenticación personalizados mediante la Edge Function `send-client-email`.
> Última actualización: 2026-03-10

---

Eres un asistente SQL/configuración para los **Auth Hooks** de Nova Silva. Los Auth Hooks interceptan eventos de autenticación de Supabase Auth y los redirigen a una Edge Function que envía emails personalizados via Resend en lugar de los emails genéricos de Supabase.

## Contexto del Sistema

- **Edge Function existente:** `send-client-email` — envía emails via Resend API.
- **URL:** `https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/send-client-email`
- **Secret requerido:** `RESEND_API_KEY`
- **Tabla de templates:** `email_templates` (ver `SUPABASE_AI_PROMPT_COMUNICACIONES.md`)
- **Tabla de logs:** `email_send_logs` (inmutable, registra cada envío)

## Auth Hook: Custom Email Sender

Supabase Auth permite configurar un Hook `send_email` que intercepta TODOS los emails de autenticación. En lugar de que Supabase envíe su email genérico, invoca nuestra Edge Function con el HTML personalizado de Nova Silva.

### Edge Function: send-auth-email

Esta función debe crearse para manejar el hook de Auth:

```typescript
// supabase/functions/send-auth-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const payload = await req.json()

    // Supabase Auth Hook payload:
    // {
    //   user: { id, email, user_metadata, ... },
    //   email_data: {
    //     token: "...",
    //     token_hash: "...",
    //     redirect_to: "...",
    //     email_action_type: "signup" | "recovery" | "invite" | "magiclink" | "email_change"
    //   }
    // }

    const { user, email_data } = payload
    const { email_action_type, token_hash, redirect_to } = email_data
    const userEmail = user.email
    const userName = user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario'

    // Mapeo de action_type a template_codigo
    const TEMPLATE_MAP: Record<string, string> = {
      signup:       'verificacion_email',
      recovery:     'reset_password',
      invite:       'bienvenida_nuevo_usuario',
      magiclink:    'verificacion_email',
      email_change: 'verificacion_email',
    }

    const templateCode = TEMPLATE_MAP[email_action_type]
    if (!templateCode) {
      console.error('Unknown email_action_type:', email_action_type)
      return new Response(JSON.stringify({ error: 'Unknown action type' }), { status: 400 })
    }

    // Construir link de confirmación
    const siteUrl = Deno.env.get('SITE_URL') || 'https://novasilva.lovable.app'
    const confirmationLink = `${siteUrl}/auth/confirm?token_hash=${token_hash}&type=${email_action_type}&redirect_to=${encodeURIComponent(redirect_to || siteUrl)}`

    // Obtener template de BD
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Intentar obtener org_id del usuario
    const { data: orgData } = await supabaseAdmin.rpc('get_user_organization_id', { _user_id: user.id })
    const orgId = orgData

    let subject: string
    let html: string
    let text: string | undefined

    if (orgId) {
      // Buscar template personalizado de la org
      const { data: template } = await supabaseAdmin
        .rpc('get_email_template', { _org_id: orgId, _codigo: templateCode })

      if (template && template.length > 0) {
        const t = template[0]
        // Sustituir variables
        const vars: Record<string, string> = {
          nombre_completo: userName,
          nombre_organizacion: user.user_metadata?.organization_name || 'Nova Silva',
          link_reset: confirmationLink,
          link_verificacion: confirmationLink,
          link_accion: confirmationLink,
          minutos_expiracion: '60',
          expiracion: '60 minutos',
        }
        subject = replaceVars(t.asunto_template, vars)
        html = replaceVars(t.cuerpo_html, vars)
        text = t.cuerpo_texto ? replaceVars(t.cuerpo_texto, vars) : undefined
      } else {
        // Fallback: usar template hardcodeado
        const fallback = getFallbackTemplate(email_action_type, userName, confirmationLink)
        subject = fallback.subject
        html = fallback.html
        text = fallback.text
      }
    } else {
      // Sin org: usar fallback
      const fallback = getFallbackTemplate(email_action_type, userName, confirmationLink)
      subject = fallback.subject
      html = fallback.html
      text = fallback.text
    }

    // Enviar via Resend
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    if (!RESEND_API_KEY) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), { status: 500 })
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Nova Silva <no-reply@novasilva.co>',
        to: [userEmail],
        subject,
        html,
        text,
      }),
    })

    const resData = await res.json()

    // Log del envío
    if (orgId) {
      await supabaseAdmin.rpc('log_email_send', {
        _org_id: orgId,
        _template_codigo: templateCode,
        _destinatario_email: userEmail,
        _destinatario_nombre: userName,
        _asunto: subject,
        _estado: res.ok ? 'enviado' : 'fallido',
        _proveedor: 'resend',
        _proveedor_id: resData.id || null,
        _variables: { email_action_type, user_id: user.id },
        _enviado_por: null,
      })
    }

    if (!res.ok) {
      console.error('Resend error:', resData)
      return new Response(JSON.stringify({ error: 'Email send failed' }), { status: 500 })
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 })
  } catch (err) {
    console.error('Auth email hook error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})

function replaceVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] ?? `{${key}}`)
}

function getFallbackTemplate(actionType: string, name: string, link: string) {
  const templates: Record<string, { subject: string; html: string; text: string }> = {
    signup: {
      subject: 'Verifica tu correo — Nova Silva',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Verifica tu Correo</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Haz clic en el botón para verificar tu correo electrónico:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Verificar Correo</a></div></div></div>`,
      text: `Hola ${name}, verifica tu correo: ${link}`,
    },
    recovery: {
      subject: 'Restablecer contraseña — Nova Silva',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Restablecer Contraseña</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Haz clic para restablecer tu contraseña:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(25,75%,55%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Restablecer</a></div><p style="color:#999;font-size:13px;">Este enlace expira en 60 minutos.</p></div></div>`,
      text: `Hola ${name}, restablece tu contraseña: ${link}`,
    },
    invite: {
      subject: 'Invitación a Nova Silva',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Bienvenido a Nova Silva</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Has sido invitado a unirte. Haz clic para aceptar:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Aceptar Invitación</a></div></div></div>`,
      text: `Hola ${name}, acepta tu invitación: ${link}`,
    },
    magiclink: {
      subject: 'Tu enlace de acceso — Nova Silva',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Enlace de Acceso</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Haz clic para acceder a tu cuenta:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Acceder</a></div><p style="color:#999;font-size:13px;">Este enlace es de un solo uso.</p></div></div>`,
      text: `Hola ${name}, accede aquí: ${link}`,
    },
    email_change: {
      subject: 'Confirma tu nuevo correo — Nova Silva',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Confirmar Nuevo Correo</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Confirma tu nueva dirección de correo:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Confirmar Correo</a></div></div></div>`,
      text: `Hola ${name}, confirma tu nuevo correo: ${link}`,
    },
  }
  return templates[actionType] || templates.signup
}
```

### Configuración del Hook en Supabase Dashboard

**Ruta:** Supabase Dashboard → Authentication → Hooks → Send Email

1. **Habilitar** el hook `send_email`
2. **Tipo:** HTTP Request
3. **URL:** `https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/send-auth-email`
4. **HTTP Headers:**
   ```json
   {
     "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY",
     "Content-Type": "application/json"
   }
   ```
5. **Timeout:** 10000ms

> **IMPORTANTE:** Al habilitar este hook, Supabase deja de enviar sus emails genéricos y delega 100% al hook. Asegúrate de que la Edge Function y `RESEND_API_KEY` estén operativas antes de activarlo.

### Secrets Requeridos en Edge Functions

| Secret | Descripción |
|--------|-------------|
| `RESEND_API_KEY` | API key de Resend para enviar emails |
| `SUPABASE_URL` | URL del proyecto Supabase (auto-provisionado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (auto-provisionado) |
| `SITE_URL` | URL del sitio: `https://novasilva.lovable.app` |

### Deshabilitar Emails Nativos de Supabase

Una vez activado el hook, es recomendable deshabilitar los emails nativos para evitar duplicados:

**Dashboard → Authentication → Email Templates:**
- Los templates nativos de Supabase se ignoran automáticamente cuando el hook está activo
- No es necesario borrarlos, pero tampoco se enviarán

### Configuración Alternativa: Hook via Postgres Function

Si se prefiere un hook basado en SQL en lugar de HTTP (menos latencia, sin cold starts):

```sql
-- Hook function que llama a la Edge Function internamente
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
  _role text;
BEGIN
  _user_id := (event ->> 'user_id')::uuid;

  -- Agregar role al JWT claims
  SELECT role INTO _role
  FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1;

  IF _role IS NOT NULL THEN
    event := jsonb_set(
      event,
      '{claims,app_role}',
      to_jsonb(_role)
    );
  END IF;

  RETURN event;
END;
$$;

-- Permisos para supabase_auth_admin
GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

## Catálogo de los 11 Templates del Sistema

Estos son los 11 templates definidos en `communicationTemplates.ts` que deben sembrarse en `email_templates`:

| # | Código | Categoría | Auth Hook | Variables Clave |
|---|--------|-----------|-----------|-----------------|
| 1 | `bienvenida_productor` | bienvenida | invite | nombre_completo, organizacion_nombre, link_plataforma |
| 2 | `bienvenida_exportador` | bienvenida | invite | organizacion_nombre, link_plataforma |
| 3 | `confirmacion_pago` | transaccional | — | nombre_completo, monto, fecha_entrega, referencia |
| 4 | `confirmacion_entrega` | transaccional | — | nombre_completo, cantidad_kg, fecha, codigo_lote |
| 5 | `credito_aprobado_email` | transaccional | — | nombre_completo, monto, plazo, tasa |
| 6 | `reset_password` | seguridad | recovery | nombre_completo, link_reset, minutos_expiracion |
| 7 | `verificacion_email` | seguridad | signup, magiclink, email_change | nombre_completo, link_verificacion |
| 8 | `resultado_vital` | operativo | — | nombre_completo, puntaje, nivel |
| 9 | `recordatorio_entrega` | operativo | — | nombre_completo, fecha, punto_acopio |
| 10 | `oferta_comercial` | comercial | — | organizacion_destino, exportador_nombre, codigo_lote, precio |
| 11 | `alerta_eudr` | comercial | — | codigo_lote, lista_parcelas, fecha_limite |

### Seed SQL Completo para los 11 Templates

```sql
CREATE OR REPLACE FUNCTION public.seed_all_email_templates(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.email_templates (organization_id, categoria, codigo, nombre, asunto_template, cuerpo_html, cuerpo_texto, variables_requeridas, es_default)
  VALUES
    -- 1. Bienvenida Productor
    (_org_id, 'bienvenida', 'bienvenida_productor',
     'Bienvenida - Productor',
     'Bienvenido a {organizacion_nombre}',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Bienvenido a {organizacion_nombre}</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Estimado/a <strong>{nombre_completo}</strong>,</p><p style="color:#555;font-size:15px;">Le damos la bienvenida a <strong>{organizacion_nombre}</strong>. Su perfil ha sido creado exitosamente en nuestra plataforma Nova Silva.</p><div style="text-align:center;margin:28px 0;"><a href="{link_plataforma}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Ingresar a Nova Silva</a></div></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p></div></div>',
     'Estimado/a {nombre_completo}, le damos la bienvenida a {organizacion_nombre}. Su perfil ha sido creado exitosamente.',
     ARRAY['nombre_completo', 'organizacion_nombre', 'link_plataforma'],
     true),

    -- 2. Bienvenida Exportador
    (_org_id, 'bienvenida', 'bienvenida_exportador',
     'Bienvenida - Exportador',
     'Bienvenido a Nova Silva',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Bienvenido a Nova Silva</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Estimados <strong>{organizacion_nombre}</strong>,</p><p style="color:#555;font-size:15px;">Su cuenta de exportador ha sido creada. Ya puede explorar lotes disponibles y gestionar contratos.</p><div style="text-align:center;margin:28px 0;"><a href="{link_plataforma}" style="background:hsl(25,75%,55%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Explorar Lotes</a></div></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">Nova Silva · Trazabilidad cafetera</p></div></div>',
     'Estimados {organizacion_nombre}, su cuenta de exportador ha sido creada en Nova Silva.',
     ARRAY['organizacion_nombre', 'link_plataforma'],
     true),

    -- 3. Confirmación de Pago
    (_org_id, 'transaccional', 'confirmacion_pago',
     'Confirmación de Pago',
     'Pago registrado por {monto}',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Pago Registrado</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Estimado/a <strong>{nombre_completo}</strong>,</p><p style="color:#555;font-size:15px;">Se ha registrado exitosamente su pago:</p><div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid hsl(145,55%,45%);"><table style="width:100%;border-collapse:collapse;"><tr><td style="color:#888;font-size:13px;padding:4px 0;">Monto</td><td style="color:#333;font-weight:600;text-align:right;">{monto}</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Fecha</td><td style="color:#333;text-align:right;">{fecha_entrega}</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Referencia</td><td style="color:#333;text-align:right;">{referencia}</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Cantidad</td><td style="color:#333;text-align:right;">{cantidad_kg} kg</td></tr></table></div><div style="text-align:center;margin:28px 0;"><a href="{link_finanzas}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Ver Mis Finanzas</a></div></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p></div></div>',
     'Pago registrado: {monto}. Fecha: {fecha_entrega}. Referencia: {referencia}.',
     ARRAY['nombre_completo', 'monto', 'fecha_entrega', 'referencia', 'cantidad_kg', 'organizacion_nombre', 'link_finanzas'],
     true),

    -- 4. Confirmación de Entrega
    (_org_id, 'transaccional', 'confirmacion_entrega',
     'Confirmación de Entrega',
     'Entrega registrada: {cantidad_kg} kg',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Entrega Registrada</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Estimado/a <strong>{nombre_completo}</strong>,</p><p style="color:#555;font-size:15px;">Su entrega ha sido registrada:</p><div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid hsl(120,55%,23%);"><table style="width:100%;border-collapse:collapse;"><tr><td style="color:#888;font-size:13px;padding:4px 0;">Cantidad</td><td style="color:#333;font-weight:600;text-align:right;">{cantidad_kg} kg</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Fecha</td><td style="color:#333;text-align:right;">{fecha}</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Lote</td><td style="color:#333;text-align:right;">{codigo_lote}</td></tr></table></div><div style="text-align:center;margin:28px 0;"><a href="{link_entregas}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Ver Mis Entregas</a></div></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p></div></div>',
     'Entrega registrada: {cantidad_kg} kg. Lote: {codigo_lote}.',
     ARRAY['nombre_completo', 'cantidad_kg', 'fecha', 'codigo_lote', 'organizacion_nombre', 'link_entregas'],
     true),

    -- 5. Crédito Aprobado
    (_org_id, 'transaccional', 'credito_aprobado_email',
     'Crédito Aprobado',
     'Crédito aprobado por {monto}',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(145,55%,45%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Crédito Aprobado</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Estimado/a <strong>{nombre_completo}</strong>,</p><p style="color:#555;font-size:15px;">Su solicitud de crédito ha sido <strong style="color:hsl(145,55%,35%);">aprobada</strong>.</p><div style="background:#f0fdf4;border-radius:8px;padding:20px;margin:20px 0;border:1px solid hsl(145,55%,80%);"><table style="width:100%;border-collapse:collapse;"><tr><td style="color:#888;font-size:13px;padding:4px 0;">Monto</td><td style="color:#333;font-weight:600;text-align:right;">{monto}</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Plazo</td><td style="color:#333;text-align:right;">{plazo} meses</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Tasa</td><td style="color:#333;text-align:right;">{tasa}%</td></tr></table></div><div style="text-align:center;margin:28px 0;"><a href="{link_finanzas}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Ver Detalle</a></div></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p></div></div>',
     'Crédito aprobado: {monto}. Plazo: {plazo} meses. Tasa: {tasa}%.',
     ARRAY['nombre_completo', 'monto', 'plazo', 'tasa', 'organizacion_nombre', 'link_finanzas'],
     true),

    -- 6. Reset Password
    (_org_id, 'seguridad', 'reset_password',
     'Restablecimiento de Contraseña',
     'Restablecer tu contraseña',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Restablecer Contraseña</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>{nombre_completo}</strong>,</p><p style="color:#555;font-size:15px;">Recibimos una solicitud para restablecer tu contraseña.</p><div style="text-align:center;margin:28px 0;"><a href="{link_reset}" style="background:hsl(25,75%,55%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Restablecer Contraseña</a></div><p style="color:#999;font-size:13px;">Este enlace expira en {minutos_expiracion} minutos. Si no solicitaste este cambio, ignora este mensaje.</p></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">Nova Silva · Seguridad</p></div></div>',
     'Hola {nombre_completo}. Restablece tu contraseña: {link_reset}. Expira en {minutos_expiracion} minutos.',
     ARRAY['nombre_completo', 'link_reset', 'minutos_expiracion'],
     true),

    -- 7. Verificación de Email
    (_org_id, 'seguridad', 'verificacion_email',
     'Verificación de Correo',
     'Verifica tu correo electrónico',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Verifica tu Correo</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>{nombre_completo}</strong>,</p><p style="color:#555;font-size:15px;">Para completar tu registro, verifica tu correo electrónico:</p><div style="text-align:center;margin:28px 0;"><a href="{link_verificacion}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Verificar Correo</a></div><p style="color:#999;font-size:13px;">Si no creaste una cuenta, ignora este mensaje.</p></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">Nova Silva</p></div></div>',
     'Hola {nombre_completo}. Verifica tu correo: {link_verificacion}.',
     ARRAY['nombre_completo', 'link_verificacion'],
     true),

    -- 8. Resultado VITAL
    (_org_id, 'operativo', 'resultado_vital',
     'Resultado Evaluación VITAL',
     'Resultado de evaluación VITAL',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Resultado VITAL</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Estimado/a <strong>{nombre_completo}</strong>,</p><p style="color:#555;font-size:15px;">Su evaluación VITAL ha sido completada:</p><div style="background:#f8f9fa;border-radius:12px;padding:24px;margin:20px 0;text-align:center;"><p style="color:#888;font-size:13px;margin:0 0 8px 0;">Puntaje Global</p><p style="color:hsl(120,55%,23%);font-size:42px;font-weight:700;margin:0;">{puntaje}<span style="font-size:18px;color:#888;">/100</span></p><p style="color:#555;font-size:15px;margin:12px 0 0 0;">Nivel: <strong>{nivel}</strong></p></div><div style="text-align:center;margin:28px 0;"><a href="{link_vital}" style="background:hsl(120,55%,23%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Ver Detalle</a></div></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Protocolo VITAL</p></div></div>',
     'Resultado VITAL: {puntaje}/100. Nivel: {nivel}.',
     ARRAY['nombre_completo', 'puntaje', 'nivel', 'organizacion_nombre', 'link_vital'],
     true),

    -- 9. Recordatorio de Entrega
    (_org_id, 'operativo', 'recordatorio_entrega',
     'Recordatorio de Entrega',
     'Recordatorio: Entrega programada para {fecha}',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(25,75%,55%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Recordatorio de Entrega</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Estimado/a <strong>{nombre_completo}</strong>,</p><p style="color:#555;font-size:15px;">Le recordamos que su próxima entrega está programada:</p><div style="background:#fff7ed;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid hsl(25,75%,55%);"><p style="color:#333;font-size:15px;margin:0;"><strong>Fecha:</strong> {fecha}</p><p style="color:#333;font-size:15px;margin:8px 0 0 0;"><strong>Punto de acopio:</strong> {punto_acopio}</p></div><p style="color:#555;font-size:15px;">Favor confirmar disponibilidad con su técnico asignado.</p></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">{organizacion_nombre} · Nova Silva</p></div></div>',
     'Recordatorio: Entrega programada para {fecha} en {punto_acopio}.',
     ARRAY['nombre_completo', 'fecha', 'punto_acopio', 'organizacion_nombre'],
     true),

    -- 10. Oferta Comercial
    (_org_id, 'comercial', 'oferta_comercial',
     'Oferta Comercial',
     'Oferta por lote {codigo_lote}',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Oferta Comercial</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Estimados <strong>{organizacion_destino}</strong>,</p><p style="color:#555;font-size:15px;">Se ha recibido una oferta comercial:</p><div style="background:#f8f9fa;border-radius:8px;padding:20px;margin:20px 0;border-left:4px solid hsl(25,75%,55%);"><table style="width:100%;border-collapse:collapse;"><tr><td style="color:#888;font-size:13px;padding:4px 0;">Exportador</td><td style="color:#333;font-weight:600;text-align:right;">{exportador_nombre}</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Lote</td><td style="color:#333;text-align:right;">{codigo_lote}</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Precio</td><td style="color:#333;font-weight:600;text-align:right;">{precio}/lb</td></tr><tr><td style="color:#888;font-size:13px;padding:4px 0;">Condiciones</td><td style="color:#333;text-align:right;">{incoterm}</td></tr></table></div><div style="text-align:center;margin:28px 0;"><a href="{link_ofertas}" style="background:hsl(25,75%,55%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Revisar Oferta</a></div></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">Nova Silva · Comercialización</p></div></div>',
     'Oferta comercial por lote {codigo_lote}. Exportador: {exportador_nombre}. Precio: {precio}/lb.',
     ARRAY['organizacion_destino', 'exportador_nombre', 'codigo_lote', 'precio', 'incoterm', 'link_ofertas'],
     true),

    -- 11. Alerta EUDR
    (_org_id, 'comercial', 'alerta_eudr',
     'Alerta EUDR',
     '[Urgente] Alerta EUDR: Lote {codigo_lote}',
     '<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(0,72%,52%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Alerta EUDR</h1></div><div style="padding:32px 24px;"><div style="background:#fef2f2;border:1px solid hsl(0,72%,85%);border-radius:8px;padding:16px;margin-bottom:20px;"><p style="color:hsl(0,72%,42%);font-size:14px;font-weight:600;margin:0;">Acción requerida antes del {fecha_limite}</p></div><p style="color:#555;font-size:15px;">Se han detectado inconsistencias en la trazabilidad del lote <strong>{codigo_lote}</strong>.</p><p style="color:#555;font-size:15px;">Parcelas sin georreferenciación:</p><p style="color:#333;font-size:14px;background:#f8f9fa;padding:12px;border-radius:6px;">{lista_parcelas}</p><div style="text-align:center;margin:28px 0;"><a href="{link_eudr}" style="background:hsl(0,72%,52%);color:#fff;padding:12px 32px;border-radius:8px;text-decoration:none;font-weight:600;">Resolver Ahora</a></div></div><div style="background:#f5f5f5;padding:16px 24px;text-align:center;"><p style="color:#999;font-size:12px;margin:0;">Nova Silva · Cumplimiento EUDR</p></div></div>',
     'Alerta EUDR: Lote {codigo_lote}. Parcelas sin geo: {lista_parcelas}. Acción antes de {fecha_limite}.',
     ARRAY['codigo_lote', 'lista_parcelas', 'fecha_limite', 'link_eudr'],
     true)

  ON CONFLICT (organization_id, codigo) DO NOTHING;
END;
$$;

-- Ejecutar para todas las orgs existentes:
-- SELECT public.seed_all_email_templates(id) FROM platform_organizations;
```

## Smoke Tests

```sql
-- Verificar que se crearon los 11 templates por org
SELECT organization_id, COUNT(*) AS total_templates
FROM email_templates
WHERE es_default = true
GROUP BY organization_id;
-- Esperado: 11 por cada org

-- Verificar los códigos
SELECT codigo, categoria, nombre
FROM email_templates
WHERE organization_id = '<ORG_ID>'
ORDER BY categoria, codigo;

-- Verificar que la Edge Function send-auth-email responde
-- (test manual via Dashboard → Edge Functions → send-auth-email → Test)
```

## Flujo Completo de Auth Hook

```
Usuario se registra / pide reset
       ↓
Supabase Auth genera evento
       ↓
Hook send_email intercepta
       ↓
Invoca Edge Function send-auth-email
       ↓
Busca template de la org en email_templates
       ↓ (si no existe → usa fallback HTML)
Sustituye variables ({nombre}, {link})
       ↓
Envía via Resend API
       ↓
Registra en email_send_logs
       ↓
Retorna success a Supabase Auth
```
