import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import type { ApiResponse } from '@snake-arena/shared-types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me-in-production';

export interface JwtPayload {
  userId: string;
  telegramId: number;
  username: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}

function unauthorizedResponse(res: Response, code: string, message: string): void {
  const response: ApiResponse<null> = {
    success: false,
    data: null,
    error: {
      code,
      message,
      details: null,
      statusCode: 401,
    },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
  res.status(401).json(response);
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    unauthorizedResponse(res, 'UNAUTHORIZED', 'Missing authorization header');
    return;
  }

  if (!authHeader.startsWith('Bearer ')) {
    unauthorizedResponse(res, 'INVALID_SCHEME', 'Authorization header must use Bearer scheme');
    return;
  }

  const token = authHeader.slice(7).trim();

  if (token.length === 0) {
    unauthorizedResponse(res, 'EMPTY_TOKEN', 'Authorization token is empty');
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (
      typeof decoded.userId !== 'string' ||
      typeof decoded.telegramId !== 'number' ||
      typeof decoded.username !== 'string'
    ) {
      unauthorizedResponse(res, 'INVALID_PAYLOAD', 'Token payload is malformed');
      return;
    }

    const authenticatedReq = req as AuthenticatedRequest;
    authenticatedReq.user = {
      userId: decoded.userId,
      telegramId: decoded.telegramId,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      unauthorizedResponse(res, 'TOKEN_EXPIRED', 'Authorization token has expired');
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      unauthorizedResponse(res, 'INVALID_TOKEN', 'Authorization token is invalid');
      return;
    }
    if (error instanceof jwt.NotBeforeError) {
      unauthorizedResponse(res, 'TOKEN_NOT_ACTIVE', 'Authorization token is not yet active');
      return;
    }
    unauthorizedResponse(
      res,
      'AUTH_ERROR',
      error instanceof Error ? error.message : 'Authentication failed'
    );
  }
}

export function issueToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function parseTokenExpirySeconds(): number {
  const raw = process.env.JWT_EXPIRES_IN ?? '7d';
  const match = /^(\d+)([smhd]?)$/.exec(raw.trim());
  if (!match) return 7 * 24 * 60 * 60;
  const value = Number.parseInt(match[1] ?? '7', 10);
  const unit = match[2] ?? 'd';
  switch (unit) {
    case 's':
      return value;
    case 'm':
      return value * 60;
    case 'h':
      return value * 60 * 60;
    case 'd':
      return value * 24 * 60 * 60;
    default:
      return 7 * 24 * 60 * 60;
  }
}
