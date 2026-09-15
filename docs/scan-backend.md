# Backend de escaneo con IA (Gemini Vision)

Proxy HTTP local que recibe la foto de una hoja de respuestas y llama a Gemini
para extraer las respuestas marcadas. Mantiene la API key fuera de la app.

## Cómo funciona

1. La app captura u importa la hoja (`ScanAnswerSheetModal`) y la reduce a
   imagen JPEG (~1600 px, calidad 0.7) con `expo-image-manipulator`.
2. Envía el Base64 a `POST /scan-answer-sheet` de este servidor con
   `{ imageBase64, mimeType, totalQuestions, columns }`.
3. El servidor construye el prompt (ve la foto + el número de preguntas y de
   columnas), llama a Gemini con `responseMimeType: 'application/json'` y el
   modelo `gemini-3.6-flash` (configurable vía `GEMINI_MODEL`).
4. Devuelve `{ answers: ('A'|'B'|'C'|'D'|'')[] }` y la app muestra la pantalla
   de revisión editable antes de guardar.

La imagen **no se persiste** en el servidor ni se registra en los logs.

## Requisitos

- Node 20+.
- Una API key de Google AI Studio (solo de servidor).

## Configuración

```bash
cd server
cp .env.example .env
# Editar .env y poner GEMINI_API_KEY=<tu clave>
```

Opcionalmente puedes cambiar `PORT` (por defecto `8787`) y `GEMINI_MODEL`.

## Ejecución

```bash
npm install
npm run dev        # reload automático (tsx watch)
```

Para un arranque simple: `npm start`. Verificación: `curl http://localhost:8787/healthz`
debe devolver `{"ok":true}`.

## Configuración de la app

La app requiere la variable `EXPO_PUBLIC_SCAN_API_URL`. Crear (o copiar de
`.env.example` en la raíz) un `.env` en `evalexam/`:

```
EXPO_PUBLIC_SCAN_API_URL=http://192.168.x.x:8787
```

En un **emulador Android** `http://10.0.2.2:8787` apunta al host. En un
**dispositivo físico** usa la IP LAN del equipo donde corre el servidor (mismo
Wi-Fi) y expón el puerto 8787 en el firewall. Reiniciar Expo tras cambiar el
archivo `.env` (las variables `EXPO_PUBLIC_*` se inyectan en build time).

## Errores que devuelve

Todos los errores son JSON `{ error: string }` consistentes con `scanApiClient.ts`:

| Código | Caso                                                                          |
| ------ | ----------------------------------------------------------------------------- |
| 400    | Petición inválida (falta `imageBase64`, `totalQuestions` fuera de rango, ...) |
| 422    | Respuesta del modelo incompleta o malformada                                  |
| 429    | Límite de peticiones o cuota de Gemini agotada                                |
| 502    | Gemini no respondió (indisponibilidad, payload inesperado)                    |
