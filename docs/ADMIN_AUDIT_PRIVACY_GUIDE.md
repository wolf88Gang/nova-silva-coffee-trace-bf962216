# Panel Admin — Guía de Privacidad y Auditoría

> **Confidencial.** La información del panel de administración es sensible. Solo personal autorizado (admin/superadmin) debe acceder. Un auditor de privacidad y gobernanza revisará qué datos se capturan, almacenan y comparten.

---

## 1. Datos sensibles en el panel

| Categoría | Ejemplos | Riesgo si se filtra |
|-----------|----------|---------------------|
| **Organizaciones** | Nombres, país, estado financiero | Identificación de clientes, situación comercial |
| **Usuarios** | Nombre, email, rol, última conexión | Identificación de personas, patrones de uso |
| **Facturación** | Números de factura, montos, mora | Información financiera y contractual |
| **Auditoría** | Acciones admin, cambios de plan, suspensiones | Trazabilidad de decisiones sensibles |
| **Compliance** | Gaps de trazabilidad, hash mismatch, dossiers | Estado de cumplimiento por organización |

---

## 2. Principios de blindaje

### 2.1 Minimización de datos en logs

- **Almacenar**: `organization_id` (UUID), `action_type`, `target_user_id` si aplica.
- **Evitar en payloads**: Nombres de organizaciones, emails, números de factura completos.
- **Alternativa**: Usar códigos internos (ej. `org_XXXX`) en exports para auditor.

### 2.2 Acceso restringido

- Solo roles `admin` y `superadmin` acceden al panel.
- RLS en Supabase: `is_admin()` para tablas administrativas.
- No exponer rutas `/admin/*` a usuarios no admin.

### 2.3 Separación demo vs. producción

- En **demo**: Usar datos ficticios claramente etiquetados.
- En **producción**: No mezclar datos reales con mocks.
- **Para auditor**: Ofrecer export anonimizado o con pseudonimización.

---

## 3. Qué compartir con el auditor

### ✅ Compartir (documentación y evidencia)

- Políticas de acceso (quién puede ver qué).
- Esquema de datos que se registran (tipos, no valores reales).
- Retención de logs y procedimiento de borrado.
- Flujo de consentimiento y tratamiento de datos personales.
- Ejemplo de evento de auditoría **anonimizado** (IDs en lugar de nombres).

### ⚠️ Compartir con precaución

- Screenshots: usar datos de prueba o anonimizar nombres/emails.
- Exports: generar versión con `organization_id` en lugar de `organization_name`, o códigos tipo `ORG-001`.

### ❌ No compartir sin anonimizar

- Listados completos de organizaciones con nombres reales.
- Emails o nombres de usuarios.
- Números de factura que identifiquen transacciones reales.
- Detalles de mora o situación financiera por organización.

---

## 4. Diseño de `admin_action_logs`

El payload (`action_payload`) debe ser **estructurado y minimal**:

```json
{
  "action_type": "cambiar_plan",
  "org_id": "uuid",
  "prev_plan": "lite",
  "new_plan": "smart",
  "reason_code": "upgrade_solicitado"
}
```

**Evitar**:

```json
{
  "description": "Cambio de plan Finca San Cristóbal a Smart por solicitud de Ana García"
}
```

---

## 5. Export para auditor

Cuando el auditor solicite evidencia:

1. **Export de estructura**: Esquema de tablas, tipos de eventos, retención.
2. **Export de muestra**: Filas de ejemplo con `organization_id` y `user_id` como UUIDs, sin joins a nombres.
3. **Política de acceso**: Documento que describa roles y permisos.

---

## 6. Checklist pre-auditoría

- [ ] Solo admin/superadmin accede al panel.
- [ ] Los logs no almacenan PII innecesario en `action_payload`.
- [ ] Existe documentación de retención de datos.
- [ ] Los mocks/demos están claramente etiquetados.
- [ ] Hay procedimiento para generar export anonimizado.
