import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import { scanRouter } from './routes/scan.js';

const app = express();

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(
      `${new Date().toISOString()} ${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`,
    );
  });
  next();
});

app.use(cors());
// 15mb cubre el Base64 de una imagen redimensionada (1600px) con margen.
app.use(express.json({ limit: '15mb' }));

const rateLimitMax = Number(process.env.RATE_LIMIT_MAX ?? 30);
app.use(
  rateLimit({
    windowMs: 60_000,
    max: rateLimitMax,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      code: 'RATE_LIMITED',
      message: 'Demasiadas solicitudes. Intenta de nuevo en un minuto.',
    },
  }),
);

app.get('/healthz', (_req, res) => {
  res.json({ ok: true });
});

app.use(scanRouter);

const port = Number(process.env.PORT ?? 8787);
app.listen(port, () => {
  console.log(`EvalExam scan server escuchando en http://localhost:${port}`);
});
