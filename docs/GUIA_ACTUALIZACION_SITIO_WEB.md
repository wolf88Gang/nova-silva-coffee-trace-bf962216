# Guía de Actualización — Sitio Web Comercial Nova Silva

**Fecha:** 2026-03-07  
**Fuente:** Auditoría `WEBSITE_CONTENT_AUDIT_2026.txt` + estado real de la plataforma `app.novasilva.co`

---

## 🔴 URGENTE: Correcciones Obligatorias

### 1. Eliminar toda mención a "Blockchain"
| Archivo | Texto actual | Reemplazo correcto |
|---------|-------------|---------------------|
| `GobernanzaSection.tsx` | "Blockchain anchors" | "Anclajes de integridad criptográfica (SHA-256)" |
| `Cumplimiento.tsx` | "capa de Blockchain Integrity" | "capa de integridad con hashes SHA-256" |
| `ProtocoloVital.tsx` | "anclada en blockchain" | "anclada con hashes criptográficos verificables" |

> **Regla:** La palabra "blockchain" no debe aparecer en ningún lugar del sitio. Nova Silva usa hashes SHA-256 y ledger de auditoría, no blockchain.

### 2. Revisar uso de "clima" / "climática"
| Archivo | Contexto | Acción |
|---------|----------|--------|
| `Nosotros.tsx` | Visión: "trazabilidad y clima" | Cambiar a "trazabilidad y resiliencia agrícola" |
| `ComoFuncionaSection.tsx` | "criterios agronómicos y climáticos" | ✅ Aceptable (referencia técnica genérica) |

> **Regla:** No usar "Plan CLIMA" ni "módulo clima" como nombre de producto. El uso genérico de "climático/a" como adjetivo técnico es aceptable.

---

## 🟡 ALTO: Módulos con Estado Incorrecto

### 3. Corregir estado de módulos en `ModulosNovaSection`

| Módulo | Lo que dice el sitio | Estado real | Acción |
|--------|---------------------|-------------|--------|
| **Nova Yield** | Predicción de Cosecha (presentado como activo) | Motor de estimación existe (`yieldEngine.ts`) pero no es "predicción con IA" | Reformular: "Estimación de Cosecha" — basada en datos de campo, no predicción IA |
| **Nova Guard** | Alerta Fitosanitaria (presentado como activo) | Alertas agroclimáticas implementadas (`useAgroAlerts.ts`) | Reformular: "Alertas Agronómicas" — basadas en umbrales configurables |
| **Nova Cup** | Catación Digital (presentado como activo) | Dashboard existe (`NovaCupDashboard.tsx`) pero módulo en desarrollo | Marcar como "Próximamente" o "Beta" |
| **Carbono / MRV** | Bonos Verificables (en módulos activos) | Tab existe (`CarbonoTab.tsx`) con valuación básica | Mover a sección "En desarrollo" con nota: "Piloto bajo estándares ISO 14064" |

### 4. Corregir claims no verificables
| Claim | Ubicación | Acción |
|-------|-----------|--------|
| "Reducción de ~50% en tiempo de auditorías" | `EstadoActualSection` | Cambiar a "Reducción significativa en tiempo de preparación de auditorías" (sin porcentaje exacto a menos que haya datos verificables) |
| "IA en dispositivo para contar frutos/detectar síntomas" | `ComoFuncionaSection` | Eliminar. No está implementado. Cambiar a: "Registro digital en campo con captura de evidencias fotográficas" |
| "Captura offline" | Varias secciones | Verificar si está realmente implementado. Si no, cambiar a "Diseñado para conectividad intermitente" |

---

## 🟢 MEDIO: Funcionalidades Subreportadas

### 5. Agregar o destacar funcionalidades reales que faltan

| Funcionalidad real | Dónde mencionarla | Descripción sugerida |
|-------------------|-------------------|----------------------|
| **Nutrición y Fertilización** | Soluciones + Cooperativas | "Planes de nutrición personalizados por parcela con seguimiento de ejecución, evidencias fotográficas y marketplace de agroinsumos" |
| **Marketplace de Agroinsumos** | Soluciones (nuevo) | "Cotización automática de fertilizantes basada en el plan nutricional, con proveedores locales rankeados por proximidad" |
| **Diagnóstico Organizacional** | Protocolo VITAL + Cooperativas | "Evaluación de madurez organizacional con el Cuestionario VITAL Organizacional — identifica fortalezas y brechas en gestión" |
| **Avisos y Comunicación Interna** | Cooperativas | "Canal de comunicación bidireccional cooperativa-productor con avisos, alertas y seguimiento" |
| **Sistema de Notificaciones** | General | "Notificaciones en tiempo real para eventos críticos: entregas, alertas agronómicas, mensajes" |
| **Módulo de Créditos** | Cooperativas + Productores | "Gestión de créditos y financiamiento con comité de crédito digital" |
| **Gestión de Usuarios y Permisos** | Cooperativas | "Roles granulares con 8 permisos configurables por usuario dentro de la organización" |
| **Inclusión y Equidad** | Impacto (ampliar) | "Registro desagregado con cálculo de brechas de género, lenguaje inclusivo configurable y reportes de equidad" |

---

## 🔵 BAJO: Mejoras de Estructura y Contenido

### 6. Limpiar componentes no usados
Los siguientes componentes existen pero no se importan en ninguna página:
- `ModulesSection.tsx`, `PlansServicesSection.tsx`, `ValuePropositionStrip.tsx`
- `Hero.tsx` (versión antigua), `FourPillarsSection.tsx`, `PainPointsSection.tsx`
- `ProblemSolutionSection.tsx`, `HowItWorksStepsSection.tsx`, `SegmentationSection.tsx`
- `TechTeaseSection.tsx`, `IndependentModesSection.tsx`, `ImpactSocialProof.tsx`
- `ImpactTrustSection.tsx`, `BenefitsProfileSection.tsx`, `VitalPillarsSection.tsx`
- `AIInterpretationSection.tsx`, `FooterCTA.tsx`

**Acción:** Eliminar o archivar para reducir deuda técnica.

### 7. Actualizar "Estado Actual" (`EstadoActualSection`)

**Ya operativo (actualizado):**
- Dashboards por tipo de organización (cooperativa, exportador, certificadora)
- Trazabilidad georreferenciada con indicador EUDR dinámico
- Protocolo VITAL con Score de Solidez (3 Capitales)
- Diagnóstico organizacional VITAL
- Módulo de Nutrición con planes, ejecución y marketplace
- Jornales: campañas, cuadrillas, registros, panel de brecha
- Módulo Comercial: lotes, contratos, ranking proveedores
- Mensajería bidireccional cooperativa-productor
- Sistema de roles y permisos granulares
- Inclusión y equidad con datos desagregados
- Generador de Paquete EUDR (PDF/JSON)

**En desarrollo:**
- Nova Cup (Catación Digital) — Beta
- Carbono / MRV — Piloto ISO 14064
- Integración con certificadoras locales

### 8. Actualizar página `/clientes` — segmento Cooperativas

Agregar menciones a:
- Módulo de Nutrición (planes, ejecución, cotización)
- Diagnóstico VITAL Organizacional
- Sistema de permisos granulares
- Avisos y comunicación interna
- Créditos y financiamiento

### 9. Navbar — Considerar agregar "Jornales"
Actualmente `/jornales` solo es accesible por URL directa. Evaluar si merece un lugar en la navegación principal o como sub-item de "Soluciones".

---

## ✅ Checklist de Ejecución

- [ ] Buscar y reemplazar "blockchain" → "hashes criptográficos SHA-256"
- [ ] Corregir "clima" en Nosotros.tsx
- [ ] Actualizar estado de Nova Yield, Nova Guard, Nova Cup, Carbono
- [ ] Eliminar claim del 50% sin datos verificables
- [ ] Eliminar claim de "IA en dispositivo"
- [ ] Agregar Nutrición y Marketplace a Soluciones
- [ ] Agregar Diagnóstico Organizacional
- [ ] Actualizar EstadoActualSection con lista corregida
- [ ] Limpiar componentes huérfanos
- [ ] Verificar datos de contacto (email, WhatsApp)
- [ ] Revisar imágenes de fondo (¿siguen siendo apropiadas?)

---

*Esta guía debe ejecutarse en el proyecto del sitio web comercial (novasilva.co), NO en este proyecto (app.novasilva.co).*
