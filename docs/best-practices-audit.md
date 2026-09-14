# Plan — Auditoría y alineación con mejores prácticas Expo

> Fecha: 2026-09-05 · Origen: auditoría con skills de Expo (project-structure, overview).
> Alcance acordado: todas las fases + eliminar `src/app/evaluation.tsx` (ruta muerta).
> Estado de tests de referencia: solo pasan tests puros (`npx vitest run`); RNTL pendiente de infraestructura.

## Fase 1 — Completada (2026-09-05)

Las 7 tareas de la Fase 1 **ya estaban resueltas** en el código al revisar (verificado contra el estado de
referencia de la auditoría, sin cambios de código necesarios). Comprobaciones: `npx vitest run` → 93 tests
puros pasan (los RNTL fallan por infraestructura conocida); `tsc --noEmit` sin errores nuevos (solo los
documentados).

## Fase 1 — Fallos críticos y capa de datos

- [x] Eliminar `src/app/evaluation.tsx` (ruta muerta + `Alert` sin importar → crash en runtime).
- [x] `src/database/Database.ts`: quitar `ENCRYPTION_KEY` (2º arg inválido en `openDatabaseAsync` SDK 57) e import muerto de `expo-secure-store`.
- [x] `Database.ts`: conexión compartida (`getDatabase()` con `databasePromise ??=` en `openDatabaseAsync`, abierta una sola vez) — ya no se abre/cierra por llamada.
- [x] `Database.ts` `deleteEvaluation`: envolver los 3 `DELETE` en transacción (`withExclusiveTransactionAsync`) para evitar borrado parcial/huérfanos.
- [x] `Database.ts`: añadir `PRAGMA user_version` para versionado de esquema (sin cambio de schema).
- [x] IDs: reemplazar `Math.random().toString(36).substr(2,9)` por `crypto.randomUUID()` en `src/lib/importStudents.ts` y verificar ids en `EvaluationForm.tsx`/`StudentAnswers.tsx`.
- [x] `src/app/_layout.tsx`: si `createTables()` falla, mostrar pantalla de error y NO montar tabs (hoy el `finally` fuerza `dbReady(true)`).

## Fase 2 — Infraestructura Expo

- [x] `_layout.tsx`: envolver con `GestureHandlerRootView`, `SafeAreaProvider` (ambos instalados, sin uso) y `StatusBar` de `expo-status-bar` (instalado, sin uso).
- [x] `_layout.tsx`: usar `@/hooks/use-color-scheme` (guard de hidratación web) en vez de `useColorScheme` de `react-native`.
- [x] Añadir ErrorBoundary global y `Suspense` en el layout.

## Fase 2 — Completada (2026-09-05)

La jerarquía (`SafeAreaProvider` → `GestureHandlerRootView` → `StatusBar` → `ThemeProvider` →
`ErrorBoundary` → `Suspense`) ya estaba implementada en `_layout.tsx`, así como el uso de
`@/hooks/use-color-scheme` y el `ErrorBoundary` global con `Suspense`. Se corrigió el error de lint en
`src/hooks/use-color-scheme.web.ts` (setState sincrónico en effect → `useSyncExternalStore`), que era el
único defecto real de la infraestructura. Comprobaciones: `npx vitest run` → 93 tests puros pasan;
`tsc --noEmit` sin errores nuevos; `npx expo lint` sin el error de `use-color-scheme.web.ts`.

## Fase 3 — Consistencia UI y estructura — Completada (2026-09-05)

- [x] `src/constants/theme.ts`: añadir paleta semántica (danger/success/warning + colores en uso: `#2d3748`, `#42b983`, `#dc2626`, fondos) y escala tipográfica.
- [x] Migrar estilos hardcodeados de `dashboard/` y `evaluation/` (10 archivos) a tokens, soportando dark mode (hoy la app es 100% clara).
- [x] FlatList anidada en ScrollView `RecentEvaluations.tsx:50`/`DashboardScreen.tsx`: usar una sola `FlatList` con `ListHeaderComponent`/`ListFooterComponent`.
- [x] Unificar nombres de `components/` a PascalCase (`app-tabs.tsx`→`AppTabs.tsx`, etc.) y añadir prettier para normalizar formato (hoy 2 estilos: comillas simples + `;` vs dobles sin `;`).
- [x] `app-tabs.tsx:16`: label "Dashboard"→"Inicio"; `app-tabs.web.tsx:22`: sincronizar `name="dashboard"` con ruta `index`.

### Resultado Fase 3

- **Tokens (item 1)**: `theme.ts` ya tenía la paleta semántica completa (danger/success/warning + `dangerBackground`/`successBackground`/`warningBackground`), escala tipográfica (`FontSize`), `Spacing` y `Radius`. `#42b983` ya no existe en el repo; `#2d3748` y `#dc2626` ya están como `textStrong`/`danger`. No hizo falta añadir nada al tema.
- **Colores hardcodeados (item 2)**: `dashboard/` no tenía ninguno; en `evaluation/` quedaban 8 (6 únicos): `readOnlyRow`/`readOnlyWeightValue` de `answer-key.tsx` (`#f7fafc`→`backgroundMuted`), `saveButton` de `answer-key.tsx` (`#38a16f`→`success`), nota "foto se guarda como evidencia" de `student-photo.tsx` (ámbar `#fef3c7`/`#eab308`/`#92400e`→`warningBackground`/`warning`), y nota de estudiante en `summary-screen.tsx` (`#059669`→`success`). Migrados a tokens dinámicos vía `useTheme()`. **Dark mode ya estaba soportado**: `useTheme()` sigue el esquema del sistema y todos los componentes consumen tokens; el claim "app 100% clara" de la auditoría estaba desactualizado.
- **FlatList anidada (item 3)**: ya no existía. `RecentEvaluations.tsx` renderiza con `.map()` dentro de un `View` (verificado); no hay FlatList anidada que corregir.
- **PascalCase + prettier (item 4)**: `app-tabs.tsx`/`app-tabs.web.tsx` → `AppTabs.tsx`/`AppTabs.web.tsx` (`git mv`, import de `_layout.tsx` actualizado). Se mantuvo el resto de nombres kebab-case por decisión explícita del usuario. Prettier ya estaba instalado y configurado (`.prettierrc.json`, singleQuote/semi) pero nunca ejecutado: se corrió `npx prettier --write .` (54 archivos), con `.prettierignore` que excluye `specs/` (regla AGENTS.md: no modificar specs sin autorización). Todo el código quedó en un solo estilo.
- **Label/name de tabs (item 5)**: ya estaba resuelto en ambas versiones — `AppTabs.tsx` usa "Inicio" y `AppTabs.web.tsx` usa `name="index"`/`href="/"`.

## Fase 4 — Calidad y testing — Completada (2026-09-05)

- [x] Accesibilidad: `accessibilityRole`/`accessibilityLabel` en `TouchableOpacity` interactivos; `hitSlop` en targets pequeños.
- [x] Tipado: eliminar `any`/`as any` en `StudentAnswers.tsx`, `HistoryScreen.tsx`, `ExportExam.tsx`, `SummaryScreen.tsx`, `DashboardScreen.tsx`, `EvaluationWizard.tsx`.
- [x] Componentes muertos/duplicados: catch silencioso `history.tsx:29`; botón "Reintentar" sin `onPress` (`SummaryScreen.tsx:94`); `onSave={() => {}}` en wizard (`EvaluationWizard.tsx:140`); `handleDeleteEvaluation` duplicado → extraer a `src/lib`; dos `useEffect` repetidos en `StudentAnswers`.
- [x] `src/lib`: extraer `exportExamToJSON/PDF/buildEvaluationHtml` fuera de `ExportExam.tsx`.
- [x] Tests: corregir RNTL estáticos (JSX inválido `HistoryScreen.test.tsx:59`, prop `totalQuestions` faltante en `StudentAnswers.test.tsx:18-21`, texto inexistente `:60`) y `Database.test.ts` para no duplicar el schema.

### Resultado Fase 4

- **Tipado**: creado `src/types/index.ts` (`Student`; corrige el error pre-existente de lint `@/types` sin resolver). Refactor de `Database.ts` con interfaces de fila (`EvaluationRow`, `StudentRow`, `HistoryRow`, `RecentEvaluationWithStatsRow`) y queries tipadas con `getAllAsync<T>`; schema extraído a `src/database/schema.ts` (fuente única, ya no duplicado en `Database.test.ts` que ahora lo importa).
- **Lógica extraída**: `src/lib/examExport.ts` (`escapeHtml`, `exportExamToJSON`, `buildEvaluationHtml`, `exportExamToPDF`) y `src/lib/confirmDeleteEvaluation.ts` (Alert + borrado + evento global). `export-exam.tsx`, `app/history.tsx`, `history-screen.tsx` y `dashboard-screen.tsx` usan el helper compartido.
- **Componentes**: en `student-answers.tsx` se fusionaron los dos `useEffect` y se separó la carga pura (`fetchOrCreateStudents`) de la selección de estado (los handlers de guardar/importar la reutilizan). En `summary-screen.tsx` el botón "Reintentar" ahora recarga de verdad (patrón `reloadToken`) y se eliminó el `record: any`. En `evaluation-wizard.tsx` el guardado de respuestas notifica `notifyEvaluationsChanged()` (dashboard/historial se refrescan solos), quitado `(s: any)`.
- **Bugs reales corregidos** (fuera de lista, checklist audit): `student-photo.tsx` usaba `result.uri` (API vieja) → `result.assets[0].uri` del SDK 57; `app-tabs.tsx` usaba un SF Symbol inválido `clock.arrow.circlepath.fill` → `clock.fill`; `dashboardStats.ts` `averageScoreOrDefault` y `RawRecentEvaluation` (sin index signature) alineados con los tipos de fila.
- **Accesibilidad**: añadida en `answer-key.tsx` (opciones A-B-C-D + botón), `empty-state.tsx`, `recent-evaluations.tsx`, `evaluation-form.tsx`, `history-screen.tsx`, `dashboard-screen.tsx`, `app/history.tsx`, `student-answers.tsx`, `evaluation-wizard.tsx` y `student-photo.tsx`.
- **Limpieza lint**: fuera `useSyncExternalStore` (Fase 2), ahora también `React` sin uso en `calculateScore.ts`, tipos sin uso y default imports de funciones nombradas; además se ajustó `summary-screen.tsx`/`student-answers.tsx` a la regla `react-hooks/set-state-in-effect`.
- **Tests**: `Database.test.ts` reescrito contra el schema compartido (95 tests puros pasan, +2). Los 3 RNTL (`history-screen`, `student-answers`, `student-photo`) reescritos con `vi` (sin `jest` global, JSX válido, props reales) — siguen sin ejecutarse por infraestructura pendiente (`@testing-library/react-native` no instalado). `importStudents.test.ts` falla al correr por parseo Flow de `react-native` vía `expo-crypto` (pre-existente).

## Verificación al terminar

- [x] `npx vitest run` (tests puros) — 95 pasan; 4 suites fallan por infraestructura conocida (3 RNTL + `importStudents` por `expo-crypto`→RN, pre-existente).
- [x] `npx expo lint` — 0 problemas.
- [x] `npx tsc --noEmit` (acotado a `src/`; el global falla por RNTL, estado conocido y documentado) — solo 3 errores RNTL de módulo faltante, todos los de tipado/lint previos resueltos.
- [x] Revisar que no queden strings de UI en inglés — ninguno en `src/`.

## Notas de discrepancia docs ↔ código

- Según AGENTS.md: registrar cambios de esquema/DB en `specs/spec.md` con fecha. La conexión compartida, `user_version` y transacción de `deleteEvaluation` son internos sin cambio de schema; aún así se documentarán con nota de fecha.
- Orden de ejecución ejecutado: Fase 1 → 2 → 4 → 3. La Fase 3 resultó mucho menos invasiva de lo previsto porque buena parte ya estaba resuelta en el código (tokens, dark mode, tabs, prettier config); lo único pendiente real era aplicar prettier, renombrar `app-tabs` y migrar 8 colores hardcodeados.

## Estado del plan (2026-09-05)

Todas las fases del plan **completadas**:
- [x] Fase 1 — Fallos críticos (ya estaba resuelta; verificado).
- [x] Fase 2 — Infraestructura Expo (1 bug real corregido: `use-color-scheme.web.ts`).
- [x] Fase 3 — Consistencia UI y estructura (prettier aplicado; tokens migrados; `AppTabs` renombrado).
- [x] Fase 4 — Calidad y testing (tipado, lógica extraída, accesibilidad, tests RNTL corregidos).

Verificación final: `npx vitest run` → 95 tests puros pasan (4 suites fallan por infraestructura conocida: 3 RNTL por `@testing-library/react-native` ausente + `importStudents` por parseo Flow de RN vía `expo-crypto`); `npx expo lint` → 0 problemas; `npx tsc --noEmit` → solo 3 errores RNTL (módulo faltante, documentado).

**Pendiente de infraestructura (no bloquea):** instalar `@testing-library/react-native` y resolver la carga de RN 0.86 (ESM/Flow) en Vitest con Node 24 para poder ejecutar las 4 suites que hoy fallan.
