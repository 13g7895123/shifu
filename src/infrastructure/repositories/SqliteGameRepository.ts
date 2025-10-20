// Infrastructure - SQLite Game Repository
import { GameEntity, GameStatus } from '../../domain/entities/Game';
import { GameRepository } from '../../domain/repositories/GameRepository';
import { SqliteService } from '../services/SqliteService';
import { RedisService } from '../services/RedisService';
import { v4 as uuidv4 } from 'uuid';

interface GameRow {
  id: string;
  game_id: string;
  spec: string; // JSON string
  finish_time: string | null;
  canceled: number; // SQLite boolean as integer
  purchasing_stopped: number;
  created_at: string;
  updated_at: string;
}

export class SqliteGameRepository implements GameRepository {
  private sqliteService: SqliteService;
  private redisService: RedisService;

  constructor(redisService: RedisService) {
    this.sqliteService = SqliteService.getInstance();
    this.redisService = redisService;
    this.initializeSampleGames();
  }

  private async initializeSampleGames(): Promise<void> {
    try {
      // 檢查是否已有遊戲
      const existingGames = await this.findAll();
      if (existingGames.length > 0) {
        console.log('✅ 遊戲資料已存在，跳過初始化');
        return;
      }

      // 創建範例遊戲
      const sampleGames = [
        new GameEntity(
          uuidv4(),
          'game-001',
          {
            name: '夏日抽獎',
            description: '夏日限定抽獎活動',
            totalTickets: 100,
            ticketPrice: 10,
            prizes: [
              { type: 'physical', content: '限量版T恤', quantity: 5 },
              { type: 'physical', content: '精美馬克杯', quantity: 10 },
              { type: 'points', content: '50願望幣', quantity: 20 }
            ]
          },
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7天後結束
          false,
          false,
          new Date(),
          new Date()
        ),
        new GameEntity(
          uuidv4(),
          'game-002',
          {
            name: '週末驚喜',
            description: '週末特別抽獎',
            totalTickets: 50,
            ticketPrice: 5,
            prizes: [
              { type: 'physical', content: '紀念徽章', quantity: 3 },
              { type: 'points', content: '30願望幣', quantity: 15 }
            ]
          },
          new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3天後結束
          false,
          false,
          new Date(),
          new Date()
        )
      ];

      for (const game of sampleGames) {
        await this.save(game);
      }

      console.log('✅ 預設遊戲資料已創建到 SQLite');
    } catch (error) {
      console.error('❌ 創建預設遊戲資料失敗:', error);
    }
  }

  private rowToGame(row: GameRow): GameEntity {
    return new GameEntity(
      row.id,
      row.game_id,
      JSON.parse(row.spec),
      row.finish_time ? new Date(row.finish_time) : undefined,
      Boolean(row.canceled),
      Boolean(row.purchasing_stopped),
      new Date(row.created_at),
      new Date(row.updated_at)
    );
  }

  private async getGameStatus(game: GameEntity): Promise<GameStatus> {
    const now = new Date();

    if (game.canceled) {
      return GameStatus.CANCELLED;
    }

    if (game.finishTime && now >= game.finishTime) {
      return GameStatus.FINISHED;
    }

    // 檢查Redis中是否有活躍狀態
    try {
      const isActive = await this.redisService.get(`game:${game.gameId}:active`);
      if (isActive === 'true') {
        return GameStatus.ACTIVE;
      }
    } catch (error) {
      console.warn('無法從Redis獲取遊戲狀態:', error);
    }

    return GameStatus.PENDING;
  }

  async findById(id: string): Promise<GameEntity | null> {
    try {
      const row = await this.sqliteService.get<GameRow>(
        'SELECT * FROM games WHERE id = ?',
        [id]
      );
      return row ? this.rowToGame(row) : null;
    } catch (error) {
      console.error('❌ 根據ID查找遊戲失敗:', error);
      return null;
    }
  }

  async findByGameId(gameId: string): Promise<GameEntity | null> {
    try {
      const row = await this.sqliteService.get<GameRow>(
        'SELECT * FROM games WHERE game_id = ?',
        [gameId]
      );
      return row ? this.rowToGame(row) : null;
    } catch (error) {
      console.error('❌ 根據GameId查找遊戲失敗:', error);
      return null;
    }
  }

  async findAll(): Promise<GameEntity[]> {
    try {
      const rows = await this.sqliteService.all<GameRow>(
        'SELECT * FROM games ORDER BY created_at DESC'
      );
      return rows.map(row => this.rowToGame(row));
    } catch (error) {
      console.error('❌ 查找所有遊戲失敗:', error);
      return [];
    }
  }

  async findByStatus(status: GameStatus): Promise<GameEntity[]> {
    try {
      const allGames = await this.findAll();
      const gamesWithStatus = [];

      for (const game of allGames) {
        const gameStatus = await this.getGameStatus(game);
        if (gameStatus === status) {
          gamesWithStatus.push(game);
        }
      }

      return gamesWithStatus;
    } catch (error) {
      console.error('❌ 根據狀態查找遊戲失敗:', error);
      return [];
    }
  }

  // 獲取遊戲及其計算出的狀態
  async getGameWithStatus(game: GameEntity): Promise<GameEntity & { status: GameStatus }> {
    const status = await this.getGameStatus(game);
    return Object.assign(game, { status });
  }

  async save(game: GameEntity): Promise<GameEntity> {
    try {
      await this.sqliteService.run(
        `INSERT OR REPLACE INTO games 
         (id, game_id, spec, finish_time, canceled, purchasing_stopped, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          game.id,
          game.gameId,
          JSON.stringify(game.spec),
          game.finishTime?.toISOString() || null,
          game.canceled ? 1 : 0,
          game.purchasingStopped ? 1 : 0,
          game.createdAt.toISOString(),
          new Date().toISOString()
        ]
      );
      return game;
    } catch (error) {
      console.error('❌ 保存遊戲失敗:', error);
      throw error;
    }
  }

  async update(id: string, gameData: Partial<GameEntity>): Promise<GameEntity | null> {
    try {
      const existingGame = await this.findById(id);
      if (!existingGame) {
        return null;
      }

      const updatedGame = new GameEntity(
        existingGame.id,
        gameData.gameId ?? existingGame.gameId,
        gameData.spec ?? existingGame.spec,
        gameData.finishTime ?? existingGame.finishTime,
        gameData.canceled ?? existingGame.canceled,
        gameData.purchasingStopped ?? existingGame.purchasingStopped,
        existingGame.createdAt,
        new Date()
      );

      return await this.save(updatedGame);
    } catch (error) {
      console.error('❌ 更新遊戲失敗:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const result = await this.sqliteService.run(
        'DELETE FROM games WHERE id = ?',
        [id]
      );
      return result.changes > 0;
    } catch (error) {
      console.error('❌ 刪除遊戲失敗:', error);
      return false;
    }
  }

  async create(gameData: {
    gameId?: string;
    spec?: Record<string, any>;
  }): Promise<GameEntity> {
    try {
      // 生成更友善的遊戲ID格式：GAME-YYYYMMDD-HHMMSS
      const generateGameId = (): string => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        return `GAME-${year}${month}${day}-${hours}${minutes}${seconds}`;
      };

      const game = new GameEntity(
        uuidv4(),
        gameData.gameId || generateGameId(),
        gameData.spec || {},
        undefined,
        false,
        false,
        new Date(),
        new Date()
      );

      return await this.save(game);
    } catch (error) {
      console.error('❌ 創建遊戲失敗:', error);
      throw error;
    }
  }
}
