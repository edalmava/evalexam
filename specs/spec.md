# Spec activa — EvalExam

Estado: **activa** · Última actualización: 2026-09-01

## Objetivo
Automatizar la calificación de evaluaciones tipo ICFES de única respuesta.

## Esquema de base de datos

Base: `evalexam.db` (Expo SQLite). Clave de encriptación: `evalexam-master-key`.

### Tabla `evaluations`
| columna | tipo | notas |
| --- | --- | --- |
| id | TEXT PK | |
| name | TEXT NOT NULL | |
| date | TEXT NOT NULL | |
| academicPeriod | TEXT NOT NULL | |
| totalQuestions | INTEGER NOT NULL | |
| gradingSystem | TEXT NOT NULL | |
| maxScore | INTEGER NOT NULL | |
| questionWeights | TEXT NOT NULL | JSON serializado |
| createdAt | TEXT NOT NULL | |
| updatedAt | TEXT NOT NULL | |

### Tabla `students`
| columna | tipo | notas |
| --- | --- | --- |
| id | TEXT PK | |
| evaluationId | TEXT NOT NULL | FK a `evaluations` |
| code | TEXT NOT NULL | |
| name | TEXT NOT NULL | |
| photoPath | TEXT | nullable |
| answers | TEXT NOT NULL | JSON serializado |
| score | REAL DEFAULT 0 | |
| createdAt | TEXT NOT NULL | |

### Tabla `history`
| columna | tipo | notas |
| --- | --- | --- |
| id | INTEGER PK AUTOINCREMENT | |
| evaluationId | TEXT NOT NULL | |
| dateEvaluated | TEXT NOT NULL | |
| studentCount | INTEGER NOT NULL DEFAULT 0 | |
| averageScore | REAL NOT NULL DEFAULT 0 | |
| createdAt | TEXT NOT NULL | |

## Contrato de la capa de datos

Módulo `src/database` (alias `@/database`). API asíncrona sobre `expo-sqlite` (solo `openDatabaseAsync`/`openDatabaseSync`; **no existe** `openDatabase`).

### Inicialización
- `createTables()`: abre la BD y crea las 3 tablas. **Debe invocarse una vez al arrancar la app** antes de montar las pestañas. Se ejecuta en `src/app/_layout.tsx` con un gate `dbReady`.
- **Importante**: cada `CREATE TABLE` debe terminar con `;` para que `execAsync` acepte múltiples statements en una sola invocación.

### Funciones de acceso
- `insertEvaluation`, `selectEvaluation`, `getLastFiveEvaluations` (últimas 5 evaluaciones por `createdAt` DESC).
- `insertStudent`, `selectStudent`, `selectStudentsByEvaluation`.
- `insertHistory`, `selectHistoryByEvaluation`.
- `getLastEvaluation`, `getRecentEvaluationsWithStats` (join por subconsulta de `studentCount` y `averageScore`).
- Métricas: `countEvaluations`, `countTotalStudents`, `getAverageScore`.

## Cambios registrados

### 2026-09-01 — Fix inicialización y script del historial
- `selectLastFiveEvaluations` renombrada → `getLastFiveEvaluations` para coincidir con el consumidor (`HistoryScreen`) y los mocks de test.
- `createTables` usa `openDatabaseAsync` (antes usaba `openDatabase`, que no existe en expo-sqlite SDK 57).
- **`createTables`**: agregados los `;` de cierre en cada `CREATE TABLE` — `execAsync` rechazaba el script con `near "CREATE": syntax error` sin ellos.
- Inicialización de la BD al arrancar en `src/app/_layout.tsx` (gate `dbReady`).
- `DashboardScreen` propaga y loguea el error real de carga en lugar de un mensaje genérico.