# Tareas — Fix de inicialización y script del historial

Fecha: 2026-09-01

| # | Tarea | Estado |
| --- | --- | --- |
| 1 | Renombrar `selectLastFiveEvaluations` → `getLastFiveEvaluations` en `src/database/Database.ts` | Hecho |
| 2 | Corregir `createTables` para usar `openDatabaseAsync` | Hecho |
| 2b | Agregar `;` de cierre a cada `CREATE TABLE` en `createTables` | Hecho |
| 3 | Inicializar BD al arrancar (`createTables` + gate `dbReady`) en `src/app/_layout.tsx` | Hecho |
| 4 | Propagar y loguear el error real en `DashboardScreen` | Hecho |
| 5 | Actualizar `specs/spec.md` con el esquema y el contrato de la capa de datos | Hecho |
| 6 | Redactar `specs/PLAN.md` | Hecho |
| 7 | Crear estructura de documentación (`docs/constitution.md`) alineada con `AGENTS.md` | Hecho |
| 8 | Verificar tests y lint | Hecho (ver notas) |
| 9 | Renombrar test files de `.test.ts` → `.test.tsx` (contenían JSX y fallaban al parsear) | Hecho |
| 10 | Corregir tag `</f>` → `</Text>` en `StudentPhoto.tsx:107` (error de JSX pre-existente) | Hecho |

## Estado de verificación

- **Tests**: 115/115 tests ejecutables pasan (database, lib, dashboardStats). 6 suites RNTL (`HistoryScreen`, `StudentAnswers`, `StudentPhoto` en `src/` y `example/`) fallan con `Cannot find module '@testing-library/react-native'` — la paquetería no es dependencia del proyecto. Hacerlas funcionar requiere configurar vitest con mocks de react-native, bloqueado por un bug conocido: RN 0.86 empaqueta su `index.js` como ESM con Flow (`import typeof`) que Node 24 no puede cargar vía `require`. Trabajo de infraestructura pendiente/out-of-scope.
- **Lint**: 0 errores introducidos. 10 errores pre-existentes sin relación con estos cambios (`expo-document`, `expo-permissions`, `expo-image-picker`, `expo-filesystem`, `@/types` no instalados, y `setState` en efecto). Un warning pre-existente: `SecureStore` definido sin usar en `Database.ts`.
