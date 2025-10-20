import { Game, GameEntity, GameStatus } from '../../domain/entities/Game';
import { GameRepository } from '../../domain/repositories/GameRepository';
import { PrizeRepository } from '../../domain/repositories/PrizeRepository';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { TicketRepository } from '../../domain/repositories/TicketRepository';
import { PrizeType } from '../../domain/entities/Prize';
import { UserEntity } from '../../domain/entities/User';
import { RedisService } from '../../infrastructure/services/RedisService';

export class GameUseCases {
  constructor(
    private gameRepository: GameRepository,
    private redisService: RedisService,
    private prizeRepository?: PrizeRepository,
    private userRepository?: UserRepository,
    private ticketRepository?: TicketRepository
  ) {}

  async createGame(gameId: string, spec: Record<string, any>): Promise<Game> {
    // 檢查遊戲ID是否已存在
    const existingGame = await this.gameRepository.findByGameId(gameId);
    if (existingGame) {
      throw new Error('遊戲ID已存在');
    }

    const id = this.generateUniqueId();
    const game = new GameEntity(
      id, 
      gameId, 
      spec,
      undefined, // finishTime
      false, // canceled
      false // purchasingStopped
    );
    
    return await this.gameRepository.save(game);
  }

  async getGameById(id: string): Promise<Game | null> {
    return await this.gameRepository.findById(id);
  }

  async getGameByGameId(gameId: string): Promise<Game | null> {
    return await this.gameRepository.findByGameId(gameId);
  }

  async getAllGames(): Promise<Game[]> {
    return await this.gameRepository.findAll();
  }

  async updateGame(id: string, updates: { gameId?: string; spec?: Record<string, any> }): Promise<Game | null> {
    const existingGame = await this.gameRepository.findById(id);
    if (!existingGame) {
      throw new Error('遊戲不存在');
    }

    // 如果要更新gameId，檢查新的gameId是否已存在
    if (updates.gameId && updates.gameId !== existingGame.gameId) {
      const gameWithSameId = await this.gameRepository.findByGameId(updates.gameId);
      if (gameWithSameId) {
        throw new Error('遊戲ID已存在');
      }
    }

    return await this.gameRepository.update(id, updates);
  }

  async deleteGame(id: string): Promise<boolean> {
    const existingGame = await this.gameRepository.findById(id);
    if (!existingGame) {
      throw new Error('遊戲不存在');
    }

    return await this.gameRepository.delete(id);
  }

  // 獲取當前活躍的遊戲
  async getCurrentActiveGame(): Promise<Game | null> {
    try {
      const activeGameId = await this.redisService.getActiveGame();
      if (!activeGameId) {
        return null;
      }
      return await this.gameRepository.findByGameId(activeGameId);
    } catch (error) {
      console.error('Error getting current active game:', error);
      return null;
    }
  }

  // 停止購買票券（不修改 current_active_game）
  async stopPurchasing(gameId: string): Promise<Game | null> {
    const game = await this.gameRepository.findByGameId(gameId);
    if (!game) {
      throw new Error('遊戲不存在');
    }

    if (game.purchasingStopped) {
      throw new Error('遊戲已經停止購買');
    }

    const updatedGame = game.updatePurchasingStopped(true);
    return await this.gameRepository.save(updatedGame);
  }

  // 重新開放購買票券
  async resumePurchasing(gameId: string): Promise<Game | null> {
    const game = await this.gameRepository.findByGameId(gameId);
    if (!game) {
      throw new Error('遊戲不存在');
    }

    if (!game.purchasingStopped) {
      throw new Error('遊戲購買未被停止');
    }

    const updatedGame = game.updatePurchasingStopped(false);
    return await this.gameRepository.save(updatedGame);
  }

  // 取消遊戲並收回獎勵
  async cancelGame(gameId: string): Promise<Game | null> {
    const game = await this.gameRepository.findByGameId(gameId);
    if (!game) {
      throw new Error('遊戲不存在');
    }

    if (game.canceled) {
      throw new Error('遊戲已經被取消');
    }

    if (game.finishTime) {
      throw new Error('已結束的遊戲無法取消');
    }

    // 如果有獎勵系統，收回該遊戲的所有獎勵
    if (this.prizeRepository && this.userRepository) {
      try {
        const prizes = await this.prizeRepository.findByGameId(gameId);
        
        // 收回願望幣獎勵並刪除獎勵記錄
        for (const prize of prizes) {
          if (prize.prizeType === PrizeType.POINTS) {
            const points = parseInt(prize.prizeContent);
            if (!isNaN(points) && points > 0) {
              // 從玩家帳戶扣除願望幣
              const user = await this.userRepository.findById(prize.playerId);
              if (user && 'updatePoints' in user) {
                const userEntity = user as UserEntity;
                const updatedUser = userEntity.updatePoints(-points);
                await this.userRepository.save(updatedUser);
              }
            }
          }
          
          // 刪除獎勵記錄
          await this.prizeRepository.delete(prize.id);
        }
        
        console.log(`已收回遊戲 ${gameId} 的 ${prizes.length} 個獎勵`);
      } catch (error) {
        console.error('收回獎勵時發生錯誤:', error);
        // 繼續執行取消遊戲的操作，但記錄錯誤
      }
    }

    // 如果有票券系統，退還購買票券的金額
    if (this.ticketRepository && this.userRepository) {
      try {
        const tickets = await this.ticketRepository.findByGameId(gameId);
        
        // 為每個票券購買者退還購買價格
        for (const ticket of tickets) {
          const user = await this.userRepository.findById(ticket.userId);
          if (user && 'updatePoints' in user) {
            const userEntity = user as UserEntity;
            // 退還票券購買價格（以願望幣形式）
            const updatedUser = userEntity.updatePoints(ticket.purchasePrice);
            await this.userRepository.save(updatedUser);
          }
          
          // 刪除票券記錄
          await this.ticketRepository.delete(ticket.id);
        }
        
        console.log(`已退還遊戲 ${gameId} 的 ${tickets.length} 張票券購買金額`);
      } catch (error) {
        console.error('退還票券金額時發生錯誤:', error);
        // 繼續執行取消遊戲的操作，但記錄錯誤
      }
    }

    // 將遊戲標記為已取消
    const updatedGame = game.updateCanceled(true);
    return await this.gameRepository.save(updatedGame);
  }

  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
