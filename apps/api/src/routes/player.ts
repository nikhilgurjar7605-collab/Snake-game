import { Router, type Response } from 'express';
import { z } from 'zod';
import { prisma } from '@snake-arena/db';
import { authMiddleware, type AuthenticatedRequest } from '../middleware/auth.js';
import type {
  ApiResponse,
  PlayerProfile,
  PlayerStats,
  SnakeSkin,
  SkinRarity,
  SkinPattern,
  Currency,
} from '@snake-arena/shared-types';

export const playerRouter = Router();

playerRouter.use(authMiddleware);

const equipSkinSchema = z.object({
  skinId: z.string().min(1, 'skinId is required'),
});

function mapSkinRarity(value: string): SnakeSkin['rarity'] {
  const valid: SnakeSkin['rarity'][] = ['COMMON', 'RARE', 'EPIC', 'LEGENDARY', 'MYTHIC'];
  if (valid.includes(value as SnakeSkin['rarity'])) {
    return value as SnakeSkin['rarity'];
  }
  return 'COMMON';
}

function mapSkinPattern(value: string): SnakeSkin['pattern'] {
  const valid: SnakeSkin['pattern'][] = [
    'SOLID',
    'STRIPED',
    'DOTTED',
    'GRADIENT',
    'NEON',
    'GALAXY',
    'FIRE',
    'ICE',
  ];
  if (valid.includes(value as SnakeSkin['pattern'])) {
    return value as SnakeSkin['pattern'];
  }
  return 'SOLID';
}

function mapCurrency(value: string): Currency {
  const valid: Currency[] = ['COINS', 'GEMS', 'PREMIUM'];
  if (valid.includes(value as Currency)) {
    return value as Currency;
  }
  return 'COINS';
}

function serializeSkin(skin: {
  id: string;
  name: string;
  description: string;
  rarity: string;
  primaryColor: string;
  secondaryColor: string;
  headColor: string;
  eyeColor: string;
  pattern: string;
  particleEffect: string | null;
  price: number;
  currency: string;
  isPremium: boolean;
  unlockLevel: number;
  unlockCondition: string | null;
  createdAt: Date;
  updatedAt: Date;
}): SnakeSkin {
  return {
    id: skin.id,
    name: skin.name,
    description: skin.description,
    rarity: mapSkinRarity(skin.rarity),
    primaryColor: skin.primaryColor,
    secondaryColor: skin.secondaryColor,
    headColor: skin.headColor,
    eyeColor: skin.eyeColor,
    pattern: mapSkinPattern(skin.pattern),
    particleEffect: skin.particleEffect,
    price: skin.price,
    currency: mapCurrency(skin.currency),
    isPremium: skin.isPremium,
    isUnlocked: true,
    unlockLevel: skin.unlockLevel,
    unlockCondition: skin.unlockCondition,
    createdAt: skin.createdAt.toISOString(),
    updatedAt: skin.updatedAt.toISOString(),
  };
}

playerRouter.get('/profile', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        activeSkin: true,
        inventory: {
          include: { skin: true },
        },
        questProgress: {
          where: {
            status: { in: ['ACTIVE', 'COMPLETED'] },
          },
          include: { quest: true },
        },
      },
    });

    if (!user) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User profile not found',
          details: null,
          statusCode: 404,
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };
      res.status(404).json(response);
      return;
    }

    const stats: PlayerStats = {
      totalGames: user.totalGames,
      totalWins: user.totalWins,
      totalKills: user.totalKills,
      totalDeaths: user.totalDeaths,
      totalScore: 0,
      highestScore: user.highestScore,
      longestSnake: user.longestSnake,
      longestSurvivalTime: user.longestSurvival,
      killDeathRatio:
        user.totalDeaths === 0
          ? user.totalKills
          : Math.round((user.totalKills / user.totalDeaths) * 100) / 100,
      averageRank: 0,
      favoriteSkinId: user.activeSkinId,
      playTime: user.totalPlayTime,
    };

    const activeQuestIds = user.questProgress
      .filter((qp) => qp.status === 'ACTIVE')
      .map((qp) => qp.questId);

    const completedQuestIds = user.questProgress
      .filter((qp) => qp.status === 'COMPLETED' || qp.status === 'CLAIMED')
      .map((qp) => qp.questId);

    const profile: PlayerProfile = {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      telegramId: Number(user.telegramId),
      avatarUrl: user.avatarUrl,
      level: user.level,
      xp: user.xp,
      coins: user.coins,
      gems: user.gems,
      premiumCurrency: user.premiumCurrency,
      stats,
      activeSkinId: user.activeSkinId,
      unlockedSkinIds: user.inventory.map((item) => item.skinId),
      activeQuestIds,
      completedQuestIds,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };

    const response: ApiResponse<PlayerProfile> = {
      success: true,
      data: profile,
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('[player/profile] Error:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'PROFILE_FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch profile',
        details: null,
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(500).json(response);
  }
});

playerRouter.get('/inventory', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user;

    const inventoryItems = await prisma.inventoryItem.findMany({
      where: { userId },
      include: { skin: true },
      orderBy: { acquiredAt: 'desc' },
    });

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { activeSkinId: true },
    });

    const skins: SnakeSkin[] = inventoryItems.map((item) => serializeSkin(item.skin));

    const response: ApiResponse<{ skins: SnakeSkin[]; activeSkinId: string | null }> = {
      success: true,
      data: {
        skins,
        activeSkinId: user?.activeSkinId ?? null,
      },
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('[player/inventory] Error:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'INVENTORY_FETCH_FAILED',
        message: error instanceof Error ? error.message : 'Failed to fetch inventory',
        details: null,
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(500).json(response);
  }
});

playerRouter.post('/equip-skin', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.user;

    const parsed = equipSkinSchema.safeParse(req.body);

    if (!parsed.success) {
      const details: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const path = issue.path.join('.');
        details[path] = issue.message;
      }
      const response: ApiResponse<null> = {
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
      res.status(400).json(response);
      return;
    }

    const { skinId } = parsed.data;

    const inventoryItem = await prisma.inventoryItem.findUnique({
      where: {
        userId_skinId: { userId, skinId },
      },
      include: { skin: true },
    });

    if (!inventoryItem) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'SKIN_NOT_OWNED',
          message: 'You do not own this skin',
          details: null,
          statusCode: 403,
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };
      res.status(403).json(response);
      return;
    }

    if (!inventoryItem.skin.isActive) {
      const response: ApiResponse<null> = {
        success: false,
        data: null,
        error: {
          code: 'SKIN_UNAVAILABLE',
          message: 'This skin is no longer available for use',
          details: null,
          statusCode: 410,
        },
        timestamp: new Date().toISOString(),
        requestId: crypto.randomUUID(),
      };
      res.status(410).json(response);
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { activeSkinId: skinId },
    });

    const response: ApiResponse<{ activeSkinId: string; skinName: string; skinRarity: string }> = {
      success: true,
      data: {
        activeSkinId: skinId,
        skinName: inventoryItem.skin.name,
        skinRarity: inventoryItem.skin.rarity,
      },
      error: null,
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(200).json(response);
  } catch (error) {
    console.error('[player/equip-skin] Error:', error);
    const response: ApiResponse<null> = {
      success: false,
      data: null,
      error: {
        code: 'EQUIP_SKIN_FAILED',
        message: error instanceof Error ? error.message : 'Failed to equip skin',
        details: null,
        statusCode: 500,
      },
      timestamp: new Date().toISOString(),
      requestId: crypto.randomUUID(),
    };
    res.status(500).json(response);
  }
});
