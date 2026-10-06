import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '@snake-arena/db';
import { issueToken, parseTokenExpirySeconds, type JwtPayload } from '../middleware/auth.js';
import type { ApiResponse, AuthToken, UserPublicProfile } from '@snake-arena/shared-types';

const JWT_SECRET = process.env.JWT_SECRET ?? 'dev-secret-change-me-in-production';

const registerSchema = z.object({
  telegramId: z.number().int().positive(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-zA-Z0-9_]+$/, 'Username must contain only letters, numbers, and underscores'),
  firstName: z.string().max(64).optional(),
  lastName: z.string().max(64).optional(),
  referralCode: z.string().max(32).optional(),
});

const loginSchema = z.object({
  telegramId: z.number().int().positive(),
});

function buildAuthToken(
  userId: string,
  telegramId: number,
  username: string,
  level: number,
  avatarUrl: string | null
): AuthToken {
  const payload: JwtPayload = { userId, telegramId, username };
  const token = issueToken(payload);
  const user: UserPublicProfile = {
    id: userId,
    username,
    avatarUrl: avatarUrl ?? undefined,
    level,
    currentRank: 0,
  };
  return {
    token,
    expiresIn: parseTokenExpirySeconds(),
    user,
  };
}

function validationErrorResponse(
  issues: z.ZodIssue[]
): ApiResponse<null> {
  const details: Record<string, string> = {};
  for (const issue of issues) {
    const path = issue.path.join('.');
    details[path] = issue.message;
  }
  return {
    success: false,
    data: null,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Request body failed validation',
      details,
      statusCode: 400,
    },
    timestamp: new Date().toISOString(),
    requestId: crypto.randomUUID(),
  };
}

export const authRouter = Router();

authRouter.post('/register', async (req: Request, res: Response) => {
  try {
    const parsed = registerSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(validationErrorResponse(parsed.error.issues));
      return;
    }

    const { telegramId, username, firstName, lastName, referralCode } = parsed.data;

    const existingByTelegram = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (existingByTelegram) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'TELEGRAM_ID_TAKEN',
          message: 'A user with this Telegram ID already exists. Use /login instead.',
          details: null,
          statusCode: 409,
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };
      res.status(409).json(response);
      return;
    }

    const existingByUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingByUsername) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'USERNAME_TAKEN',
          message: 'This username is already taken. Please choose another.',
          details: null,
          statusCode: 409,
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };
      res.status(409).json(response);
      return;
    }

    let referredByUserId: string | null = null;
    if (referralCode) {
      const referrer = await prisma.user.findUnique({
        where: { referralCode },
      });
      if (referrer) {
        referredByUserId = referrer.id;
      }
    }

    const defaultSkin = await prisma.skin.findFirst({
      where: { isActive: true },
      orderBy: { unlockLevel: 'asc' },
    });

    if (!defaultSkin) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'NO_DEFAULT_SKIN',
          message: 'Server misconfiguration: no default skin available',
          details: null,
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };
      res.status(500).json(response);
      return;
    }

    const displayName = [firstName, lastName].filter(Boolean).join(' ') || username;

    const user = await prisma.user.create({
      data: {
        telegramId: BigInt(telegramId),
        username,
        displayName,
        firstName: firstName ?? '',
        lastName: lastName ?? null,
        activeSkinId: defaultSkin.id,
        referredBy: referredByUserId,
        coins: 500,
        gems: 10,
        premiumCurrency: 0,
        level: 1,
        xp: 0,
        totalXpEarned: 0,
      },
    });

    await prisma.inventoryItem.create({
      data: {
        userId: user.id,
        skinId: defaultSkin.id,
        acquiredVia: 'DEFAULT',
      },
    });

    if (referredByUserId) {
      await prisma.user.update({
        where: { id: referredByUserId },
        data: { referralCount: { increment: 1 } },
      });

      await prisma.transaction.create({
        data: {
          userId: referredByUserId,
          type: 'REFERRAL',
          amount: 100,
          currency: 'COINS',
          balanceBefore: 0,
          balanceAfter: 0,
          referenceType: 'USER',
          referenceId: user.id,
          description: `Referral bonus for inviting ${username}`,
        },
      });
    }

    const authToken = buildAuthToken(
      user.id,
      telegramId,
      user.username,
      user.level,
      user.avatarUrl
    );

    const response: ApiResponse<AuthToken> = {
      success: true,
      data: authToken,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(201).json(response);
  } catch (error) {
    console.error('[auth/register] Error:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error instanceof Error ? error.message : 'Registration failed',
        details: null,
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(500).json(response);
  }
});

authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const parsed = loginSchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json(validationErrorResponse(parsed.error.issues));
      return;
    }

    const { telegramId } = parsed.data;

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(telegramId) },
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'No user found with this Telegram ID. Please register first.',
          details: null,
          statusCode: 404,
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };
      res.status(404).json(response);
      return;
    }

    if (user.isBanned) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'USER_BANNED',
          message: user.banReason ?? 'Your account has been banned',
          details: {
            bannedAt: user.bannedAt?.toISOString() ?? '',
          },
          statusCode: 403,
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };
      res.status(403).json(response);
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const authToken = buildAuthToken(
      user.id,
      Number(user.telegramId),
      user.username,
      user.level,
      user.avatarUrl
    );

    const response: ApiResponse<AuthToken> = {
      success: true,
      data: authToken,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('[auth/login] Error:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'LOGIN_FAILED',
        message: error instanceof Error ? error.message : 'Login failed',
        details: null,
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(500).json(response);
  }
});
