# Auditoría funcional — Commercial Copilot

## Validaciones estructurales (correctas si el código actual se mantiene)

| # | Validación | Estado esperado |
|---|------------|-----------------|
| 1 | `/admin/sales/new` apunta al **copilot**, no al wizard viejo | `SalesCopilotPage` en ruta `new` |
| 2 | **Un solo camino** para la siguiente pregunta | `FlowEngineLoader` → `mergePriorityIntoFlowState` → `getNextPriorityQuestion` |
| 3 | **Interpretación aparte** del selector | `InterpretationEngine.buildCopilotInterpretation()` sobre bundle; no elige pregunta |
| 4 | **`recalculateScores` en sesión** | `useCopilotDiagnostic.saveAnswer` llama RPC tras cada respuesta |

---

## A. Doble sistema — política

- **Legacy:** solo URL `/admin/sales/legacy-wizard`. Sin enlaces en sidebar ni en copilot.
- **Banner** en pantalla legado: *Flujo legado. No usar para ventas nuevas.*
- **Congelado:** no nuevas features en `SalesWizardPage` / `useSalesWizard`.

---

## B. Prueba manual — ¿sigue siendo un cuestionario disfrazado?

Ejecutar **3 sesiones** (productor privado, cooperativa, exportador) y marcar **sí/no**:

| Pregunta | Productor | Cooperativa | Exportador |
|----------|-----------|-------------|------------|
| ¿Las **primeras 5 preguntas** cambian de verdad según el tipo? | | | |
| ¿**Desaparecen** preguntas absurdas para otro actor (ej. productores sin “cuántos productores entregan”)? | | | |
| ¿**Zone B** aporta algo útil tras **2–4** respuestas? | | | |
| ¿La **ruta comercial** cambia de forma **entendible**? | | | |
| ¿**Omitir** no rompe el flujo? | | | |
| ¿El sistema **explica por qué** pregunta (metadata + tooltip de razón)? | | | |

**Criterio:** si alguna respuesta es **no**, el producto sigue pareciendo wizard; priorizar ajuste del **priorityEngine** + contenido de **questionMetadata** / labels, no nuevos archivos de arquitectura.

---

## C. Riesgo: `priorityEngine` vs valor comercial

Auditar **sin refactor**:

1. **Relevancia:** ¿`weight` + `gap_relevance` + `signal_relevance` priorizan conversación útil o solo “rellenar campos”?
2. **Cobertura disfrazada:** ¿muchas preguntas empatan en score y gana el orden implícito?
3. **Datos:** `ANSWER_TO_PROFILE` y opciones en BD — si faltan valores (ej. `productor` en `CTX_ORG_TYPE`), el perfil queda vacío y el motor **no puede** discriminar bien.
4. **Productor:** reglas `PRODUCTOR_BLOCKED_TAGS` — ¿suficientes para cortar ruido cooperativa/exportador?

**Archivos:** `priorityEngine.ts`, `priorityQuestionConfig.ts`, seed `sales_questions` / opciones.

---

## D. Siguiente pedido al asistente (solo auditoría)

> **No** más arquitectura, **no** más archivos, **no** refactor grande por ahora.  
> Hacer **auditoría funcional** del copilot real: recorrer los 3 perfiles (o simular con datos), documentar resultados en la tabla §B, y proponer **cambios mínimos** (pesos, metadata, seed SQL) solo donde la prueba falle.
