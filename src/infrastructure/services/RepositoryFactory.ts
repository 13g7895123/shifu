// Infrastructure - Repository Factory
import { UserRepository } from '../../domain/repositories/UserRepository';
import { GameRepository } from '../../domain/repositories/GameRepository';
import { TicketRepository } from '../../domain/repositories/TicketRepository';
import { PrizeRepository } from '../../domain/repositories/PrizeRepository';
import { ChatRepository } from '../../domain/repositories/ChatRepository';
import { SystemSettingsRepository } from '../../domain/repositories/SystemSettingsRepository';

// In-Memory implementations
import { InMemoryUserRepository } from '../repositories/InMemoryUserRepository';
import { InMemoryGameRepository } from '../repositories/InMemoryGameRepository';
import { InMemoryTicketRepository } from '../repositories/InMemoryTicketRepository';
import { InMemoryPrizeRepository } from '../repositories/InMemoryPrizeRepository';
import { InMemoryChatRepository } from '../repositories/InMemoryChatRepository';
import { InMemorySystemSettingsRepository } from '../repositories/InMemorySystemSettingsRepository';

// Redis implementations
import { RedisSystemSettingsRepository } from '../repositories/RedisSystemSettingsRepository';

import { RedisService } from '../services/RedisService';

export type RepositoryType = 'memory' | 'sqlite';

export class RepositoryFactory {
  private static userRepository: UserRepository;
  private static gameRepository: GameRepository;
  private static ticketRepository: TicketRepository;
  private static prizeRepository: PrizeRepository;
  private static chatRepository: ChatRepository;
  private static systemSettingsRepository: SystemSettingsRepository;
  private static initialized = false;
  private static currentType: RepositoryType;

  public static async initialize(type: RepositoryType, redisService?: RedisService): Promise<void> {
    if (this.initialized && this.currentType === type) {
      console.log(`✅ Repository Factory 已初始化為 ${type} 模式`);
      return;
    }

    console.log(`🔄 初始化 Repository Factory - ${type} 模式`);
    
    let actualType = type;

    if (type === 'sqlite') {
      try {
        console.log('🔄 嘗試加載 SQLite 模組...');
        // 動態導入 SQLite 相關模組
        const { SqliteService } = await import('../services/SqliteService');
        console.log('🔄 嘗試加載 SQLite Repository 模組...');
        const { SqliteUserRepository } = await import('../repositories/SqliteUserRepository');
        const { SqliteGameRepository } = await import('../repositories/SqliteGameRepository');
        const { SqliteTicketRepository } = await import('../repositories/SqliteTicketRepository');
        const { SqlitePrizeRepository } = await import('../repositories/SqlitePrizeRepository');
        const { SqliteChatRepository } = await import('../repositories/SqliteChatRepository');

        // 嘗試初始化 SQLite 服務
        console.log('🔄 初始化 SQLite 服務...');
        const sqliteService = SqliteService.getInstance();
        console.log('🔄 連接 SQLite 數據庫...');
        await sqliteService.connect();
        console.log('✅ SQLite 服務連接成功');

        // 創建 SQLite repositories
        this.userRepository = new SqliteUserRepository();
        this.gameRepository = new SqliteGameRepository(redisService!);
        this.ticketRepository = new SqliteTicketRepository();
        this.prizeRepository = new SqlitePrizeRepository();
        this.chatRepository = new SqliteChatRepository();
        // 系统设置总是使用 Redis，因为它需要持久化
        this.systemSettingsRepository = redisService ? 
          new RedisSystemSettingsRepository(redisService) : 
          new InMemorySystemSettingsRepository();

        console.log('✅ SQLite repositories 初始化完成');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.warn('⚠️ SQLite 初始化失敗，自動降級到 In-Memory 模式');
        console.warn('錯誤詳情:', errorMessage);
        
        if (errorMessage.includes('Exec format error')) {
          console.warn('💡 建議: 在Docker環境中，SQLite3需要重新編譯。請重建Docker映像或使用memory模式');
        }
        
        actualType = 'memory';
      }
    }
    
    if (actualType === 'memory') {
      // 創建 In-Memory repositories
      this.userRepository = new InMemoryUserRepository();
      this.gameRepository = new InMemoryGameRepository(redisService!);
      this.ticketRepository = new InMemoryTicketRepository();
      this.prizeRepository = new InMemoryPrizeRepository();
      this.chatRepository = new InMemoryChatRepository();
      // 系统设置总是使用 Redis，因为它需要持久化
      this.systemSettingsRepository = redisService ? 
        new RedisSystemSettingsRepository(redisService) : 
        new InMemorySystemSettingsRepository();

      console.log('✅ In-Memory repositories 初始化完成');
    }

    this.currentType = actualType;
    this.initialized = true;
  }

  public static getUserRepository(): UserRepository {
    if (!this.initialized) {
      throw new Error('Repository Factory 尚未初始化，請先調用 initialize()');
    }
    return this.userRepository;
  }

  public static getGameRepository(): GameRepository {
    if (!this.initialized) {
      throw new Error('Repository Factory 尚未初始化，請先調用 initialize()');
    }
    return this.gameRepository;
  }

  public static getTicketRepository(): TicketRepository {
    if (!this.initialized) {
      throw new Error('Repository Factory 尚未初始化，請先調用 initialize()');
    }
    return this.ticketRepository;
  }

  public static getPrizeRepository(): PrizeRepository {
    if (!this.initialized) {
      throw new Error('Repository Factory 尚未初始化，請先調用 initialize()');
    }
    return this.prizeRepository;
  }

  public static getChatRepository(): ChatRepository {
    if (!this.initialized) {
      throw new Error('Repository Factory 尚未初始化，請先調用 initialize()');
    }
    return this.chatRepository;
  }

  public static getSystemSettingsRepository(): SystemSettingsRepository {
    if (!this.initialized) {
      throw new Error('Repository Factory 尚未初始化，請先調用 initialize()');
    }
    return this.systemSettingsRepository;
  }

  public static getCurrentType(): RepositoryType {
    return this.currentType;
  }

  public static isInitialized(): boolean {
    return this.initialized;
  }

  public static async cleanup(): Promise<void> {
    if (this.currentType === 'sqlite') {
      try {
        const { SqliteService } = await import('../services/SqliteService');
        const sqliteService = SqliteService.getInstance();
        await sqliteService.disconnect();
      } catch (error) {
        console.warn('⚠️ SQLite 清理失敗:', error instanceof Error ? error.message : String(error));
      }
    }
    
    this.initialized = false;
    console.log('🧹 Repository Factory 已清理');
  }
}
