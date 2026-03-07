# FASE 3: OPERACIÓN, DESPLIEGUE, CONTROL DE CALIDAD Y ESCALAMIENTO

> Documento canónico de referencia. Fuente: PDF entregado por el equipo técnico.

## 3.1 Principio rector

> El motor puede ser perfecto. Si los datos de entrada son malos, todo se degrada.
> **El control de calidad de datos es el verdadero núcleo operativo.**

## 3.2 Estandarización de muestreo de suelo (protocolo obligatorio)

### 3.2.1 Protocolo mínimo obligatorio

Para que un análisis sea aceptado como **válido**:

- 15–20 submuestras por hectárea
- Profundidad estandarizada 0–20 cm (o definida por ruleset)
- Homogeneización adecuada
- Evitar bordes, caminos, manchas anómalas
- Identificación clara de parcela y fecha
- Método P declarado: Bray II, Olsen o Mehlich

Si no cumple → se acepta como **heurístico** con baja confianza automática.

## 3.3 Tabla: `ag_sampling_protocol_logs`

Campos:

| Campo | Descripción |
|-------|-------------|
| `parcela_id` | FK a parcelas |
| `fecha_muestreo` | Fecha del muestreo |
| `profundidad_cm` | Profundidad en cm |
| `num_submuestras` | Número de submuestras |
| `metodo_P` | Método de fósforo (Bray II, Olsen, Mehlich) |
| `tecnico_responsable` | UUID del técnico |
| `cumplimiento_pct` | % de cumplimiento del protocolo |
| `evidencia_url` | Foto de bolsa etiquetada |
| `validado_por` | UUID del validador |
| `validado_at` | Timestamp de validación |

## 3.4 Onboarding técnico de cooperativas

### 3.4.1 Fases onboarding

1. **Diagnóstico inicial**: tipo suelos dominantes, altitudes, variedades, estructura crédito
2. **Configuración**: `region_profile`, `efficiencies` base, reglas suelo, calendario lluvias
3. **Capacitación técnica**: protocolo muestreo, registro ejecución, interpretación señales
4. **Piloto controlado**: 5–10 parcelas, seguimiento cercano, revisión manual
5. **Escalamiento progresivo**

## 3.5 Control de calidad de ejecución

**Problema real**: productor registra ejecución "porque sí", técnico sube foto antigua, factura no corresponde.

**Soluciones v1 realistas**:

- Timestamp + geolocalización opcional en app
- Hash de factura
- Correlación fechas compra ↔ aplicación
- Alertas si ejecución fuera de ventana crítica

## 3.6 SLA y soporte técnico

Definir:

- Tiempo máximo respuesta técnica: **48h**
- Tiempo revisión plan: **24h**
- Soporte fitosanitario en alerta roja: **prioridad**

### Tabla: `ag_support_tickets`

| Campo | Tipo |
|-------|------|
| `org_id` | UUID |
| `parcela_id` | UUID |
| `module` | enum: nutrition, climate, phytosanitary, credit |
| `severity` | enum |
| `status` | enum |
| `response_time_hours` | numeric |
| `resolution_time_hours` | numeric |

## 3.7 Capacitación estructurada

Desarrollar:

- Manual operativo técnico
- Checklist muestreo
- Checklist ejecución
- Guía interpretación dashboard ejecutivo
- Manual de roles (productor, técnico, cooperativa)

> El sistema debe exigir capacitación completada antes de rol técnico activo.

## 3.8 Métricas operativas clave (KPI reales)

### 3.8.1 Nutrición

- % parcelas con plan activo
- % ejecución ≥ 70%
- % ejecución en ventana crítica
- Desviación promedio entre plan y ejecución

### 3.8.2 Calidad de datos

- % análisis válidos según protocolo
- % análisis vencidos
- % parcelas sin variedad definida correctamente

### 3.8.3 Financiero

- % créditos con compra validada
- % compras sin ejecución
- PRN promedio por zona

### 3.8.4 Operativo

- Tiempo promedio aprobación técnica

## 3.9 Riesgo reputacional: controles mínimos

**Nunca permitir:**

- Plan aprobado sin aceptación legal
- Cotización generada sin hash plan
- Edición directa de receta base
- Sobrescritura manual sin revision linkage

> Auditoría debe ser **inmutable**.

## 3.10 Escalamiento regional

Al expandir a nueva región:

- No duplicar ruleset
- Crear nuevo `region_profile`
- Ajustar `efficiencies`
- Mantener motor base común

## 3.11 Gobernanza científica

Cada cambio debe tener:

- Versionado formal
- Changelog técnico
- Justificación agronómica
- Impacto esperado
- Evaluación post-implementación

### Tabla: `ag_engine_changelog`

| Campo | Tipo |
|-------|------|
| `engine_version` | text |
| `ruleset_version` | text |
| `change_summary` | text |
| `justification` | text |
| `author` | UUID |
| `approved_by` | UUID |
| `created_at` | timestamptz |

## 3.12 Evaluación anual del módulo

Una vez por ciclo productivo:

- Comparar yield real vs proyección
- Comparar PRN vs incidentes reales
- Evaluar correlación señales ↔ eventos
- Decidir ajustes

### Tabla: `ag_annual_review_reports`

| Campo | Tipo |
|-------|------|
| `org_id` | UUID |
| `year` | integer |
| `metrics_json` | jsonb |
| `recommendations` | text |
| `approved_at` | timestamptz |

## 3.13 Integración con certificación y compliance (EUDR)

El módulo nutrición puede generar evidencia:

- Análisis suelo trazable
- Plan con hash
- Ejecución registrada
- Compra vinculada

Fortalece: diligencia debida y gestión riesgo deforestación indirecta.

> Se puede generar: **Nutrition Governance Report** exportable.

## 3.14 Roadmap operativo realista (12 meses)

| Período | Alcance |
|---------|---------|
| Mes 1 | 1 cooperativa piloto, 10 parcelas |
| Mes 3–6 | 3 cooperativas, 100–300 parcelas, calibración regional |
| Mes 6–12 | Consolidación, integración crédito formal, dashboard exportador |

## 3.15 Checklist para declarar Fase 3 completa

- [ ] Protocolo muestreo implementado y auditado
- [ ] Onboarding documentado y ejecutado
- [ ] KPI operativos visibles
- [ ] Soporte y tickets operativos
- [ ] Governance y versionado formal
- [ ] Piloto validado con datos reales

---

## Resultado Final del Sistema Completo (Fase 1–3)

- Motor científico paramétrico
- Ejecución auditada
- Comercio de insumos trazable
- Crédito vinculado a uso real
- Señales cruzadas clima–sanidad–nutrición
- Simulación de riesgo
- Dashboard ejecutivo
- Gobernanza científica y operativa

> Esto ya no es solo un módulo nutricional. Es una **infraestructura de manejo productivo con trazabilidad financiera**.
