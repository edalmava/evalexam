# Constitution de EvalExam

## Propósito
Calificar de forma automática evaluaciones tipo ICFES de selección múltiple con única respuesta bajo diferentes sistemas de calificación. Está dirigida a docentes de instituciones educativas: reduce el tiempo de revisión y evita errores frecuentes que afectan las notas de los estudiantes.

## Stack
- React Native con Expo (template default, SDK 57).
- Estado global en memoria: Zustand + Expo SecureStore.
- Almacenamiento local: Expo SQLite.
- HTTP/Caché: TanStack Query.

## Convenciones
- Idioma de la UI y mensajes: español.
- Nombres de variables, identificadores y funciones: inglés.
- Preferir TypeScript sobre JavaScript.

## Reglas
- Leer `docs/constitution.md` y la spec activa (`specs/spec.md`) antes de tocar código.
- No añadir nada al directorio `specs/` ni modificar sus archivos sin autorización.
- No añadir cambios al formato de la base de datos sin actualizar antes la spec.
- Al terminar cualquier tarea, verificarla con los tests.