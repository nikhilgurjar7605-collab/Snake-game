import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { playerRouter } from './routes/player.js';

const app = express();

const PORT = Number.parseInt(process.env.PORT ?? '4000', 10);
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
const NODE_ENV = process.env.NODE_ENV ?? 'development';

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

app.disable('x-powered-by');

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: '@snake-arena/api',
    version: '0.1.0',
    environment: NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.use('/auth', authRouter);
app.use('/player', playerRouter);

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    data: null,
    error: {
      code: 'NOT_FOUND',
      message: 'The requested resource does not exist',
      details: null,
      statusCode: 404,
    },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  });
});

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api] Unhandled error:', err.message);
  console.error(err.stack);

  const statusCode =
    'status' in err && typeof (err as { status: unknown }).status === 'number'
      ? (err as { status: number }).status
      : 500;

  const code =
    'code' in err && typeof (err as { code: unknown }).code === 'string'
      ? (err as { code: string }).code
      : 'INTERNAL_ERROR';

  res.status(statusCode).json({
    success: false,
    data: null,
    error: {
      code,
      message: NODE_ENV === 'production' ? 'Internal server error' : err.message,
      details: null,
      statusCode,
    },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('  ╔═══════════════════════════════════════════╗');
  console.log('  ║        🐍  SNAKE ARENA API  🐍           ║');
  console.log('  ╚═══════════════════════════════════════════╝');
  console.log('');
  console.log(`  ➜  Local:   http://localhost:${PORT}`);
  console.log(`  ➜  Health:  http://localhost:${PORT}/health`);
  console.log(`  ➜  CORS:    ${CORS_ORIGIN}`);
  console.log(`  ➜  Env:     ${NODE_ENV}`);
  console.log('');
});

export default app;
