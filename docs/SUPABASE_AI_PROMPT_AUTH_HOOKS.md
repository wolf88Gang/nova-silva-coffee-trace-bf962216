# Prompt para Supabase AI — Auth Hooks (Emails de Autenticación)

> **Copia y pega este texto completo en el Supabase AI Assistant** para configurar los Auth Hooks de Supabase que envían emails personalizados de autenticación.
> Última actualización: 2026-03-10

---

## ⚠️ IMPORTANTE: Esto NO son los 11 templates transaccionales

Este documento trata **exclusivamente** de los **Auth Hooks de Supabase** — el mecanismo que intercepta eventos de autenticación (registro, reset de contraseña, magic link, etc.) para enviar emails personalizados en lugar de los genéricos de Supabase.

### Dos sistemas de email separados:

| Sistema | Qué hace | Cuándo se dispara | Edge Function | Documento |
|---------|----------|-------------------|---------------|-----------|
| **Auth Hooks** (este doc) | Emails de autenticación: verificación, reset, invitación, magic link, cambio de email | Automático por Supabase Auth cuando un usuario se registra, pide reset, etc. | `send-auth-email` | Este archivo |
| **Plantillas transaccionales** (otro doc) | 11 emails de negocio: bienvenida, pago, entrega, crédito, VITAL, recordatorio, oferta, EUDR | Manualmente desde la app cuando ocurre un evento de negocio | `send-client-email` | `SUPABASE_AI_PROMPT_COMUNICACIONES.md` |

**Los 11 templates transaccionales** (bienvenida_productor, confirmacion_pago, resultado_vital, etc.) son para **todos los usuarios** y se envían cuando la cooperativa/exportador ejecuta una acción en la plataforma. No tienen nada que ver con Auth Hooks. Están documentados en `SUPABASE_AI_PROMPT_COMUNICACIONES.md`.

---

## Contexto del Sistema Auth Hooks

- **Edge Function a crear:** `send-auth-email` — intercepta eventos de Supabase Auth
- **URL:** `https://qbwmsarqewxjuwgkdfmg.supabase.co/functions/v1/send-auth-email`
- **Secret requerido:** `RESEND_API_KEY`
- **Dependencia:** tablas `email_templates` y `email_send_logs` (creadas en `SUPABASE_AI_PROMPT_COMUNICACIONES.md`)

## ¿Qué son los Auth Hooks?

Supabase Auth permite configurar un Hook `send_email` que intercepta **todos** los emails de autenticación. En lugar de que Supabase envíe su email genérico en inglés, invoca nuestra Edge Function que:

1. Identifica el tipo de evento (signup, recovery, invite, etc.)
2. Busca un template personalizado en `email_templates` (si existe para la org del usuario)
3. Si no existe, usa un fallback HTML con la marca Nova Silva
4. Envía el email via Resend API
5. Registra el envío en `email_send_logs`

## Los 5 eventos de Auth que se interceptan

Estos son los **únicos** eventos que manejan los Auth Hooks. Son disparados **automáticamente por Supabase Auth**, no por la app:

| # | Evento Auth | Cuándo ocurre | Template que usa (si existe en BD) |
|---|-------------|---------------|-------------------------------------|
| 1 | `signup` | Usuario se registra y necesita verificar email | `verificacion_email` |
| 2 | `recovery` | Usuario pide restablecer contraseña | `reset_password` |
| 3 | `invite` | Admin invita a un usuario nuevo | `verificacion_email` (o `bienvenida_*` si aplica) |
| 4 | `magiclink` | Usuario solicita un magic link para login | `verificacion_email` |
| 5 | `email_change` | Usuario cambia su dirección de email | `verificacion_email` |

> **Nota:** Los templates `verificacion_email` y `reset_password` son parte de los 11 templates transaccionales, pero aquí se reutilizan para los eventos de Auth. Los otros 9 templates (pago, entrega, crédito, VITAL, etc.) **NO** se usan en Auth Hooks — se envían desde la app via `send-client-email`.

---

## Edge Function: send-auth-email

```typescript
// supabase/functions/send-auth-email/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req: Request) => {
  try {
    const payload = await req.json()

    // Payload que envía Supabase Auth al hook:
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

    // Mapeo: evento de Auth → código de template en email_templates
    const TEMPLATE_MAP: Record<string, string> = {
      signup:       'verificacion_email',
      recovery:     'reset_password',
      invite:       'verificacion_email',
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

    // Cliente admin para leer templates de BD
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
      const { data: template } = await supabaseAdmin
        .rpc('get_email_template', { _org_id: orgId, _codigo: templateCode })

      if (template && template.length > 0) {
        const t = template[0]
        const vars: Record<string, string> = {
          nombre_completo: userName,
          nombre_organizacion: user.user_metadata?.organization_name || 'Nova Silva',
          link_reset: confirmationLink,
          link_verificacion: confirmationLink,
          link_accion: confirmationLink,
          minutos_expiracion: '60',
        }
        subject = replaceVars(t.asunto_template, vars)
        html = replaceVars(t.cuerpo_html, vars)
        text = t.cuerpo_texto ? replaceVars(t.cuerpo_texto, vars) : undefined
      } else {
        const fallback = getFallbackTemplate(email_action_type, userName, confirmationLink)
        subject = fallback.subject; html = fallback.html; text = fallback.text
      }
    } else {
      const fallback = getFallbackTemplate(email_action_type, userName, confirmationLink)
      subject = fallback.subject; html = fallback.html; text = fallback.text
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

    // Registrar en email_send_logs
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
        _variables: { email_action_type, user_id: user.id, source: 'auth_hook' },
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
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Verifica tu Correo</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Haz clic para verificar tu correo electrónico:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Verificar Correo</a></div></div></div>`,
      text: `Hola ${name}, verifica tu correo: ${link}`,
    },
    recovery: {
      subject: 'Restablecer contraseña — Nova Silva',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Restablecer Contraseña</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Haz clic para restablecer tu contraseña:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(25,75%,55%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Restablecer</a></div><p style="color:#999;font-size:13px;">Expira en 60 minutos.</p></div></div>`,
      text: `Hola ${name}, restablece tu contraseña: ${link}`,
    },
    invite: {
      subject: 'Invitación a Nova Silva',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Bienvenido a Nova Silva</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Has sido invitado a unirte. Haz clic para aceptar:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Aceptar Invitación</a></div></div></div>`,
      text: `Hola ${name}, acepta tu invitación: ${link}`,
    },
    magiclink: {
      subject: 'Tu enlace de acceso — Nova Silva',
      html: `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;"><div style="background:hsl(120,55%,23%);padding:32px 24px;text-align:center;"><h1 style="color:#fff;margin:0;font-size:22px;">Enlace de Acceso</h1></div><div style="padding:32px 24px;"><p style="color:#333;font-size:15px;">Hola <strong>${name}</strong>,</p><p style="color:#555;font-size:15px;">Haz clic para acceder a tu cuenta:</p><div style="text-align:center;margin:28px 0;"><a href="${link}" style="background:hsl(120,55%,23%);color:#fff;padding:14px 36px;border-radius:8px;text-decoration:none;font-weight:600;">Acceder</a></div><p style="color:#999;font-size:13px;">Enlace de un solo uso.</p></div></div>`,
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

## Configuración del Hook en Supabase Dashboard

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

## Hook Alternativo: Custom Access Token (para roles en JWT)

Este es un hook **diferente** al de email. Agrega el `app_role` del usuario al JWT para que las RLS policies puedan leerlo:

```sql
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

GRANT EXECUTE ON FUNCTION public.custom_access_token_hook TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
REVOKE EXECUTE ON FUNCTION public.custom_access_token_hook FROM authenticated, anon, public;
```

**Configuración:** Dashboard → Authentication → Hooks → Customize Access Token → Postgres Function → `public.custom_access_token_hook`

## RPC Helper: Obtener org_id de un usuario

La Edge Function `send-auth-email` necesita saber a qué organización pertenece el usuario para buscar el template correcto:

```sql
CREATE OR REPLACE FUNCTION public.get_user_organization_id(_user_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organizacion_id
  FROM public.organizacion_usuarios
  WHERE user_id = _user_id
    AND activo = true
  LIMIT 1;
$$;
```

## Secrets Requeridos en Edge Functions

| Secret | Descripción |
|--------|-------------|
| `RESEND_API_KEY` | API key de Resend para enviar emails |
| `SUPABASE_URL` | URL del proyecto (auto-provisionado) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (auto-provisionado) |
| `SITE_URL` | `https://novasilva.lovable.app` |

## Smoke Tests

```sql
-- Verificar que get_user_organization_id funciona
SELECT public.get_user_organization_id('<USER_ID>');

-- Verificar que custom_access_token_hook existe
SELECT proname FROM pg_proc WHERE proname = 'custom_access_token_hook';

-- Verificar que el template de verificación existe para la org
SELECT codigo, nombre FROM email_templates
WHERE organization_id = '<ORG_ID>' AND codigo IN ('verificacion_email', 'reset_password');
```

## Flujo Completo del Auth Hook

```
Usuario se registra / pide reset / pide magic link
       ↓
Supabase Auth genera evento de autenticación
       ↓
Hook send_email intercepta (configurado en Dashboard)
       ↓
Invoca Edge Function send-auth-email
       ↓
Mapea evento → template (signup → verificacion_email, recovery → reset_password)
       ↓
Busca template personalizado en email_templates (por org del usuario)
       ↓ (si no existe → usa fallback HTML hardcodeado)
Sustituye variables ({nombre_completo}, {link_verificacion}, etc.)
       ↓
Envía via Resend API
       ↓
Registra en email_send_logs (con source: 'auth_hook')
       ↓
Retorna success → Supabase Auth completa el flujo
```

## Relación con los 11 Templates Transaccionales

```
┌─────────────────────────────────────────────────────────────┐
│                    email_templates (BD)                       │
│                                                              │
│  Usados por Auth Hooks (send-auth-email):                   │
│  ├── verificacion_email  ← signup, magiclink, email_change  │
│  └── reset_password      ← recovery                         │
│                                                              │
│  Usados por la App (send-client-email):                     │
│  ├── bienvenida_productor    (la app decide cuándo enviar)  │
│  ├── bienvenida_exportador                                   │
│  ├── confirmacion_pago                                       │
│  ├── confirmacion_entrega                                    │
│  ├── credito_aprobado_email                                  │
│  ├── resultado_vital                                         │
│  ├── recordatorio_entrega                                    │
│  ├── oferta_comercial                                        │
│  └── alerta_eudr                                             │
└─────────────────────────────────────────────────────────────┘
```

> Los 11 templates viven en la misma tabla `email_templates` pero se consumen por **dos sistemas independientes**. El seed de los 11 templates está en `SUPABASE_AI_PROMPT_COMUNICACIONES.md`.
