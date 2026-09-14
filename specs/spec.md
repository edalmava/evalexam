# Spec activa — EvalExam

Estado: **activa** · Última actualización: 2026-09-04

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
| totalStudents | INTEGER NOT NULL DEFAULT 0 | RF-1: número de estudiantes configurado |
| gradingSystem | TEXT NOT NULL | |
| maxScore | INTEGER NOT NULL | |
| questionWeights | TEXT NOT NULL | JSON serializado |
| correctAnswers | TEXT NOT NULL DEFAULT '[]' | JSON serializado (RF-6) |
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

### 2026-09-04 — Paso 3 del wizard: edición de código y nombre del estudiante
- En `StudentAnswers` (paso 3) el **código** y el **nombre** del estudiante seleccionado ahora son editables (`TextInput` en el detalle) en lugar de pre-generados/solo lectura. Antes los estudiantes se pre-generaban como placeholders `E001…/Estudiante N` (RF-1) y no se podían modificar.
- El guardado se hace con el botón existente "Guardar respuestas": persiste respuestas+nota y además código/nombre. Validación: código y nombre no vacíos.
- Nueva función de capa de datos `Database.updateStudent(studentId, code, name)` → `UPDATE students SET code = ?, name = ? WHERE id = ?`. Sin cambios de esquema.

### 2026-09-04 — Paso 2 restringido: configuración en solo lectura (flujo wizard)
- En `AnswerKey` (paso 2) **todos** los datos de configuración son solo lectura y provienen del paso 1: **sistema de calificación**, **nota máxima**, **número de preguntas**, **tipo de peso** (igual/diferente) y **los valores de los pesos** por pregunta (también en modo "Diferente por pregunta"). Se muestra el aviso "Solo se modifica en Configuración (paso 1)". Cambiarlos requiere volver al paso 1.
- Lo único editable en el paso 2 es la **clave de respuestas** (respuesta correcta por pregunta, A–D).
- En modo "Diferente" los pesos se muestran como lista de solo lectura con la línea informativa "Peso total: X de Y permitido". En modo "Igual" se muestra el peso calculado por fórmula (RF-5), sin editar.
- **Contrato `AnswerKeyData`**: `{ correctAnswers, weights }`. `weights` no es modificable en el paso 2: `EvaluationWizard` conserva `questionWeights` del draft del paso 1 (fuente de verdad) e integra únicamente `correctAnswers` sobre el draft.

### 2026-09-04 — Bugfix: pesos iguales calculados por fórmula (RF-5)
- El modo "Igual peso" en los pasos 1 (`EvaluationForm`) y 2 (`AnswerKey`) guardaba peso `1` por pregunta (independiente de la nota máxima y el número de preguntas), lo que distorsionaba la nota final (≈ nº de aciertos). Ahora usa la fórmula del `getDefaultWeight` (RF-5): `nota máxima / nº preguntas` en 0-a-max y `(nota máxima − 1) / nº preguntas` en 1-a-max.
- `EvaluationForm` deriva el peso igual directamente de `getDefaultWeight(gradingSystem, maxScore, totalQuestions)`.
- `AnswerKey` elimina el campo editable "Peso único" (`currentWeightText`): el peso igual se muestra como texto informativo calculado por la fórmula y se recalcula al cambiar sistema/nota máxima; así los pasos 1 y 2 siempre coinciden.

### 2026-09-04 — Campo "Número de estudiantes" persistido y funcional (RF-1)
- Columna `totalStudents INTEGER NOT NULL DEFAULT 0` añadida a `evaluations` (RF-1: número de estudiantes como campo de configuración). Migración `ALTER TABLE` en instalaciones previas (mismo patrón que `correctAnswers`).
- `insertEvaluation` / `updateEvaluation` reciben ahora `totalStudents` y lo persisten.
- **Pre-generación de estudiantes (paso 3)**: si al entrar a "Respuestas de Estudiantes" la evaluación no tiene estudiantes y `totalStudents > 0`, se crean automáticamente `totalStudents` filas placeholder (códigos `E001…`, nombres `Estudiante 1…`) vía nuevo helper `src/lib/studentPlaceholders.ts` (`buildStudentPlaceholders`). El modal de importación solo se abre si tras la pre-generación sigue sin haber estudiantes.
- **Discrepancia doc↔código corregida**: la fila `correctAnswers` faltaba en la tabla `evaluations` de esta spec (ya existía en `Database.ts` desde 2026-09-01); se registra aquí.

### 2026-09-01 — Fix inicialización y script del historial
- `selectLastFiveEvaluations` renombrada → `getLastFiveEvaluations` para coincidir con el consumidor (`HistoryScreen`) y los mocks de test.
- `createTables` usa `openDatabaseAsync` (antes usaba `openDatabase`, que no existe en expo-sqlite SDK 57).
- **`createTables`**: agregados los `;` de cierre en cada `CREATE TABLE` — `execAsync` rechazaba el script con `near "CREATE": syntax error` sin ellos.
- Inicialización de la BD al arrancar en `src/app/_layout.tsx` (gate `dbReady`).
- `DashboardScreen` propaga y loguea el error real de carga en lugar de un mensaje genérico.