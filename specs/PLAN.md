# Plan — Fix de inicialización y script del historial

Fecha: 2026-09-01 · Tipo: corrección (bugfix)

## Contexto
La app no cargaba por dos errores:
1. `HistoryScreen` llamaba `Database.getLastFiveEvaluations()`, inexistente en la capa de datos (la función se llamaba `selectLastFiveEvaluations`) → `undefined is not a function`.
2. Las tablas nunca se creaban en runtime: `createTables()` solo se llamaba en tests, y además usaba `Database.openDatabase(...)`, que no existe en `expo-sqlite` (SDK 57). Las consultas del dashboard fallaban y el `catch` ocultaba el error real.

## Objetivos
- [x] Alinear el nombre de la función del historial con su consumidor y mocks.
- [x] Garantizar que la BD (tablas) exista antes de montar las pestañas.
- [x] Hacer que `createTables` use una API válida de expo-sqlite.
- [x] Exponer el error real en el dashboard para facilitar diagnósticos.

## Actividades
1. Renombrar `selectLastFiveEvaluations` → `getLastFiveEvaluations` en `src/database/Database.ts`.
2. Reemplazar `openDatabase` por `openDatabaseAsync` en `createTables`.
3. Agregar `;` de cierre a cada `CREATE TABLE` en `createTables` (sin ellos, `execAsync` falla con `near "CREATE": syntax error`).
4. Añadir gate de arranque `dbReady` en `src/app/_layout.tsx` que ejecuta `createTables()` antes de renderizar `AppTabs`.
5. Propagar el error real en `DashboardScreen` (callback `onError` recibe `unknown` y se loguea con `console.error`).
6. Registrar cambios en `specs/spec.md`.
7. Verificar con tests y lint.

## Resultado esperado
Dashboard e historial cargan correctamente en runtime con la BD inicializada.