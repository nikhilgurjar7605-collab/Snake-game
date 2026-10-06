// ============================================================================
// Snake Arena — Shared Type Definitions
// Package: @snake-arena/shared-types
// ============================================================================

// ---------------------------------------------------------------------------
// Primitive & Utility Types
// ---------------------------------------------------------------------------

export interface Vector2D {
  x: number;
  y: number;
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

export type SkinRarity = 'COMMON' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';

export type SkinPattern = 'SOLID' | 'STRIPED' | 'DOTTED' | 'GRADIENT' | 'NEON' | 'GALAXY' | 'FIRE' | 'ICE';

export type Currency = 'COINS' | 'GEMS' | 'PREMIUM';

export type OrbType = 'NORMAL' | 'MEGA' | 'SPEED' | 'SHIELD' | 'MAGNET' | 'BOMB';

export type QuestType = 'KILL' | 'SCORE' | 'LENGTH' | 'SURVIVE' | 'COLLECT' | 'WIN_STREAK' | 'BOOST_DISTANCE';

export type QuestStatus = 'LOCKED' | 'ACTIVE' | 'COMPLETED' | 'CLAIMED' | 'EXPIRED';

export type GameStatus = 'WAITING' | 'COUNTDOWN' | 'IN_PROGRESS' | 'PAUSED' | 'FINISHED';

export type PlayerStatus = 'ALIVE' | 'DEAD' | 'SPECTATING' | 'DISCONNECTED';

export type PowerUpType = 'SPEED_BOOST' | 'SHIELD' | 'MAGNET' | 'GHOST' | 'DOUBLE_SCORE';

// ---------------------------------------------------------------------------
// Snake Skin
// ---------------------------------------------------------------------------

export interface SnakeSkin {
  id: string;
  name: string;
  description: string;
  rarity: SkinRarity;
  primaryColor: string;
  secondaryColor: string;
  headColor: string;
  eyeColor: string;
  pattern: SkinPattern;
  particleEffect: string | null;
  price: number;
  currency: Currency;
  isPremium: boolean;
  isUnlocked: boolean;
  unlockLevel: number;
  unlockCondition: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SkinColorScheme {
  body: string;
  head: string;
  outline: string;
  glow: string;
  eye: string;
}

// ---------------------------------------------------------------------------
// Orb (Collectible)
// ---------------------------------------------------------------------------

export interface Orb {
  id: string;
  position: Vector2D;
  value: number;
  type: OrbType;
  color: string;
  radius: number;
  pulsePhase: number;
  pulseSpeed: number;
  spawnTick: number;
  ttl: number;
  maxTtl: number;
  isDecaying: boolean;
}

// ---------------------------------------------------------------------------
// Power-Up
// ---------------------------------------------------------------------------

export interface PowerUp {
  id: string;
  type: PowerUpType;
  position: Vector2D;
  duration: number;
  remainingDuration: number;
  isActive: boolean;
  appliedToPlayerId: string | null;
}

// ---------------------------------------------------------------------------
// Quest System
// ---------------------------------------------------------------------------

export interface QuestReward {
  coins: number;
  gems: number;
  xp: number;
  skinId: string | null;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  type: QuestType;
  category: 'DAILY' | 'WEEKLY' | 'ACHIEVEMENT' | 'EVENT';
  target: number;
  progress: number;
  reward: QuestReward;
  status: QuestStatus;
  isDaily: boolean;
  isWeekly: boolean;
  expiresAt: string | null;
  unlockedAt: string;
  completedAt: string | null;
  claimedAt: string | null;
  order: number;
}

export interface QuestProgress {
  questId: string;
  userId: string;
  progress: number;
  status: QuestStatus;
  startedAt: string;
  completedAt: string | null;
  claimedAt: string | null;
}

// ---------------------------------------------------------------------------
// Snake State (Runtime)
// ---------------------------------------------------------------------------

export interface SnakeSegment {
  position: Vector2D;
  isHead: boolean;
}

export interface SnakeState {
  segments: Vector2D[];
  direction: Direction;
  nextDirection: Direction;
  speed: number;
  isBoosting: boolean;
  boostEnergy: number;
  maxBoostEnergy: number;
  shieldActive: boolean;
  ghostActive: boolean;
  magnetActive: boolean;
  length: number;
}

// ---------------------------------------------------------------------------
// Player
// ---------------------------------------------------------------------------

export interface Player {
  id: string;
  username: string;
  displayName: string;
  telegramId: number | null;
  avatarUrl: string | null;
  snake: SnakeState;
  skin: SnakeSkin;
  score: number;
  kills: number;
  deaths: number;
  isAlive: boolean;
  status: PlayerStatus;
  rank: number;
  level: number;
  xp: number;
  xpToNextLevel: number;
  joinedAt: number;
  lastActionTick: number;
  ping: number;
  isBot: boolean;
}

export interface PlayerStats {
  totalGames: number;
  totalWins: number;
  totalKills: number;
  totalDeaths: number;
  totalScore: number;
  highestScore: number;
  longestSnake: number;
  longestSurvivalTime: number;
  killDeathRatio: number;
  averageRank: number;
  favoriteSkinId: string;
  playTime: number;
}

export interface PlayerProfile {
  id: string;
  username: string;
  displayName: string;
  telegramId: number | null;
  avatarUrl: string | null;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  premiumCurrency: number;
  stats: PlayerStats;
  activeSkinId: string;
  unlockedSkinIds: string[];
  activeQuestIds: string[];
  completedQuestIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Game Configuration
// ---------------------------------------------------------------------------

export interface GameConfig {
  gridWidth: number;
  gridHeight: number;
  maxPlayers: number;
  maxFood: number;
  initialSnakeLength: number;
  baseSpeed: number;
  boostSpeedMultiplier: number;
  boostEnergyCost: number;
  boostEnergyRegen: number;
  foodSpawnInterval: number;
  orbDecayRate: number;
  powerUpSpawnInterval: number;
  powerUpDuration: number;
  shrinkInterval: number;
  shrinkAmount: number;
  minGridSize: number;
  countdownDuration: number;
  respawnDelay: number;
  killScoreBonus: number;
  foodScoreMultiplier: number;
  survivalScoreRate: number;
}

// ---------------------------------------------------------------------------
// Game State (Full Runtime State)
// ---------------------------------------------------------------------------

export interface GameState {
  id: string;
  roomName: string;
  snakes: Player[];
  orbs: Orb[];
  powerUps: PowerUp[];
  particles: Particle[];
  gridWidth: number;
  gridHeight: number;
  tick: number;
  status: GameStatus;
  config: GameConfig;
  startedAt: number | null;
  endedAt: number | null;
  maxPlayers: number;
  spectatorCount: number;
  winnerId: string | null;
  leaderboard: LeaderboardEntry[];
}

// ---------------------------------------------------------------------------
// Leaderboard
// ---------------------------------------------------------------------------

export interface LeaderboardEntry {
  playerId: string;
  username: string;
  displayName: string;
  score: number;
  kills: number;
  length: number;
  rank: number;
  isAlive: boolean;
  skinColor: string;
  isPlayer: boolean;
}

export interface GlobalLeaderboardEntry {
  rank: number;
  playerId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  highestScore: number;
  totalWins: number;
  level: number;
  skinColor: string;
}

// ---------------------------------------------------------------------------
// Particles (Visual Effects)
// ---------------------------------------------------------------------------

export interface Particle {
  id: string;
  position: Vector2D;
  velocity: Vector2D;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  opacity: number;
  type: 'EXPLOSION' | 'TRAIL' | 'SPARKLE' | 'FADE';
}

// ---------------------------------------------------------------------------
// Network Messages (Client ↔ Server)
// ---------------------------------------------------------------------------

export interface ClientInput {
  direction: Direction;
  isBoosting: boolean;
  tick: number;
}

export interface ServerSnapshot {
  tick: number;
  timestamp: number;
  snakes: Array<{
    id: string;
    segments: Vector2D[];
    direction: Direction;
    isBoosting: boolean;
    isAlive: boolean;
    skinColor: string;
    headColor: string;
    username: string;
    score: number;
    length: number;
  }>;
  orbs: Array<{
    id: string;
    position: Vector2D;
    value: number;
    type: OrbType;
    color: string;
  }>;
  powerUps: Array<{
    id: string;
    type: PowerUpType;
    position: Vector2D;
  }>;
  leaderboard: LeaderboardEntry[];
  gridWidth: number;
  gridHeight: number;
}

export interface GameEvent {
  type: GameEventType;
  tick: number;
  timestamp: number;
  data: GameEventData;
}

export type GameEventType =
  | 'PLAYER_JOINED'
  | 'PLAYER_LEFT'
  | 'PLAYER_KILLED'
  | 'PLAYER_DIED'
  | 'FOOD_COLLECTED'
  | 'POWERUP_COLLECTED'
  | 'GAME_START'
  | 'GAME_END'
  | 'QUEST_COMPLETED'
  | 'LEVEL_UP'
  | 'ACHIEVEMENT_UNLOCKED';

export type GameEventData =
  | PlayerJoinedEvent
  | PlayerLeftEvent
  | PlayerKilledEvent
  | PlayerDiedEvent
  | FoodCollectedEvent
  | PowerUpCollectedEvent
  | GameStartEvent
  | GameEndEvent
  | QuestCompletedEvent
  | LevelUpEvent
  | AchievementUnlockedEvent;

export interface PlayerJoinedEvent {
  playerId: string;
  username: string;
}

export interface PlayerLeftEvent {
  playerId: string;
  username: string;
  reason: 'DISCONNECT' | 'KICKED' | 'LEFT';
}

export interface PlayerKilledEvent {
  killerId: string;
  killerUsername: string;
  victimId: string;
  victimUsername: string;
  scoreGained: number;
}

export interface PlayerDiedEvent {
  playerId: string;
  username: string;
  cause: 'SELF_COLLISION' | 'WALL_COLLISION' | 'SNAKE_COLLISION' | 'HEAD_ON';
  finalScore: number;
  finalLength: number;
}

export interface FoodCollectedEvent {
  playerId: string;
  orbId: string;
  value: number;
  newLength: number;
}

export interface PowerUpCollectedEvent {
  playerId: string;
  powerUpId: string;
  powerUpType: PowerUpType;
  duration: number;
}

export interface GameStartEvent {
  gameId: string;
  playerCount: number;
  config: GameConfig;
}

export interface GameEndEvent {
  gameId: string;
  winnerId: string | null;
  winnerUsername: string | null;
  finalLeaderboard: LeaderboardEntry[];
  duration: number;
}

export interface QuestCompletedEvent {
  playerId: string;
  questId: string;
  questTitle: string;
  reward: QuestReward;
}

export interface LevelUpEvent {
  playerId: string;
  newLevel: number;
  rewardsUnlocked: string[];
}

export interface AchievementUnlockedEvent {
  playerId: string;
  achievementId: string;
  achievementName: string;
}

// ---------------------------------------------------------------------------
// Telegram Bot Types
// ---------------------------------------------------------------------------

export interface TelegramUser {
  telegramId: number;
  firstName: string;
  lastName: string | null;
  username: string | null;
  languageCode: string | null;
  isPremium: boolean;
}

export interface TelegramGameState {
  gameId: string;
  playerCount: number;
  status: GameStatus;
  playerRank: number;
  playerScore: number;
  playerKills: number;
  playerLength: number;
  isAlive: boolean;
}

export interface TelegramSharePayload {
  gameId: string;
  finalScore: number;
  finalRank: number;
  kills: number;
  longestSnake: number;
  duration: number;
}

// ---------------------------------------------------------------------------
// API Response Types
// ---------------------------------------------------------------------------

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  timestamp: string;
  requestId: string;
}

export interface ApiError {
  code: string;
  message: string;
  details: Record<string, string> | null;
  statusCode: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// ---------------------------------------------------------------------------
// Authentication Types
// ---------------------------------------------------------------------------

export interface AuthToken {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface TelegramAuthData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

export interface SessionData {
  userId: string;
  telegramId: number | null;
  username: string;
  expiresAt: number;
  issuedAt: number;
}
