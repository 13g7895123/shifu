import { GameEntity, GameStatus } from '../../domain/entities/Game';
import { GameRepository } from '../../domain/repositories/GameRepository';
import { RedisService } from '../services/RedisService';
import { v4 as uuidv4 } from 'uuid';

export class InMemoryGameRepository implements GameRepository {
  private games: Map<string, GameEntity> = new Map();
  private redisService: RedisService;

  constructor(redisService: RedisService) {
    this.redisService = redisService;
    // 初始化一些示例遊戲數據
    this.initializeSampleGames();
  }

  private initializeSampleGames(): void {
    const sampleGamesData = [
      {
        id: '1',
        gameId: 'game-001',
        spec: {
          title: '數字猜謎遊戲',
          description: '玩家需要猜出一個隨機數字，猜對可獲得積分獎勵！',
          ticketPrice: 10,
          tickets: 10
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-01')
      },
      {
        id: '2',
        gameId: 'game-002',
        spec: {
          title: '記憶卡片遊戲',
          description: '翻開相同的卡片配對，在限定時間內完成所有配對！',
          ticketPrice: 10,
          tickets: 10
        },
        createdAt: new Date('2024-01-02'),
        updatedAt: new Date('2024-01-02')
      },
      {
        id: '3',
        gameId: 'game-003',
        spec: {
          title: '問答挑戰賽',
          description: '回答各種知識問題，答對越多分數越高！',
          ticketPrice: 10,
          tickets: 10
        },
        createdAt: new Date('2024-01-03'),
        updatedAt: new Date('2024-01-10')
      }
    ];

    sampleGamesData.forEach(gameData => {
      const game = new GameEntity(
        gameData.id,
        gameData.gameId,
        gameData.spec,
        undefined, // finishTime
        false, // canceled
        false, // purchasingStopped
        gameData.createdAt,
        gameData.updatedAt
      );
      this.games.set(game.id, game);
    });
  }

  async findById(id: string): Promise<GameEntity | null> {
    return this.games.get(id) || null;
  }

  async findByGameId(gameId: string): Promise<GameEntity | null> {
    for (const game of this.games.values()) {
      if (game.gameId === gameId) {
        return game;
      }
    }
    return null;
  }

  async findAll(): Promise<GameEntity[]> {
    return Array.from(this.games.values()).sort((a, b) =>
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  private async getGameStatus(game: GameEntity): Promise<GameStatus> {
    // 如果遊戲已被取消
    if (game.canceled) {
      return GameStatus.CANCELLED;
    }

    // 如果遊戲已結束
    if (game.finishTime) {
      return GameStatus.FINISHED;
    }

    // 查詢 Redis 中的當前遊戲 ID
    try {
      const currentGameId = await this.redisService.getActiveGame();
      if (currentGameId === game.gameId) {
        return GameStatus.ACTIVE;
      }
    } catch (error) {
      console.error('Error checking active game from Redis:', error);
    }

    // 否則為待開始
    return GameStatus.PENDING;
  }

  async findByStatus(status: GameStatus): Promise<GameEntity[]> {
    const gamesWithStatus: GameEntity[] = [];

    for (const game of this.games.values()) {
      const gameStatus = await this.getGameStatus(game);
      if (gameStatus === status) {
        gamesWithStatus.push(game);
      }
    }

    return gamesWithStatus;
  }

  // 獲取遊戲及其計算出的狀態
  async getGameWithStatus(game: GameEntity): Promise<GameEntity & { status: GameStatus }> {
    const status = await this.getGameStatus(game);
    return Object.assign(game, { status });
  }

  // 獲取所有遊戲及其狀態
  async findAllWithStatus(): Promise<(GameEntity & { status: GameStatus })[]> {
    const games = await this.findAll();
    const gamesWithStatus = [];

    for (const game of games) {
      const gameWithStatus = await this.getGameWithStatus(game);
      gamesWithStatus.push(gameWithStatus);
    }

    return gamesWithStatus;
  }

  async save(game: GameEntity): Promise<GameEntity> {
    this.games.set(game.id, game);
    return game;
  }

  async update(id: string, gameData: Partial<GameEntity>): Promise<GameEntity | null> {
    const existingGame = this.games.get(id);
    if (!existingGame) {
      return null;
    }

    // Create a new GameEntity with updated data
    const updatedGame = new GameEntity(
      existingGame.id,
      gameData.gameId || existingGame.gameId,
      gameData.spec || existingGame.spec,
      gameData.finishTime !== undefined ? gameData.finishTime : existingGame.finishTime,
      gameData.canceled !== undefined ? gameData.canceled : existingGame.canceled,
      gameData.purchasingStopped !== undefined ? gameData.purchasingStopped : existingGame.purchasingStopped,
      existingGame.createdAt,
      new Date() // Update the updatedAt timestamp
    );

    this.games.set(id, updatedGame);
    return updatedGame;
  }

  async delete(id: string): Promise<boolean> {
    return this.games.delete(id);
  }

  async create(gameData: {
    gameId?: string;
    spec?: Record<string, any>;
  }): Promise<GameEntity> {
    const id = uuidv4();
    const gameId = gameData.gameId || `game-${Date.now()}`;

    const newGame = new GameEntity(
      id,
      gameId,
      gameData.spec || {},
      undefined, // finishTime
      false, // canceled
      false, // purchasingStopped
      new Date(),
      new Date()
    );

    await this.save(newGame);
    return newGame;
  }
}
