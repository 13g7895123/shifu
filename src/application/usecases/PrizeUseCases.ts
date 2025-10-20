import { Prize, PrizeEntity, PrizeType, PrizeStatus } from '../../domain/entities/Prize';
import { PrizeRepository } from '../../domain/repositories/PrizeRepository';
import { TicketRepository } from '../../domain/repositories/TicketRepository';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { GameRepository } from '../../domain/repositories/GameRepository';
import { UserEntity } from '../../domain/entities/User';

export class PrizeUseCases {
  constructor(
    private prizeRepository: PrizeRepository,
    private ticketRepository: TicketRepository,
    private userRepository: UserRepository,
    private gameRepository: GameRepository
  ) {}

  async awardPrize(
    gameId: string,
    ticketNumber: number,
    prizeType: PrizeType,
    prizeContent: string
  ): Promise<Prize> {
    // 驗證遊戲是否存在
    const game = await this.gameRepository.findByGameId(gameId);
    if (!game) {
      throw new Error('遊戲不存在');
    }

    // 查找票券
    const ticket = await this.ticketRepository.findByGameIdAndTicketNumber(gameId, ticketNumber);
    if (!ticket) {
      throw new Error('票券不存在');
    }

    // 驗證玩家是否存在
    const player = await this.userRepository.findById(ticket.userId);
    if (!player) {
      throw new Error('玩家不存在');
    }


    // 如果是願望幣類型的獎品，直接加到玩家帳戶中
    if (prizeType === PrizeType.POINTS) {
      const points = parseInt(prizeContent);
      if (isNaN(points) || points <= 0) {
        throw new Error('願望幣必須是大於0的有效數字');
      }
      
    // 直接使用 player，它應該已經是 UserEntity 型別
    const playerEntity = player as UserEntity;
      
      // 更新玩家願望幣
      const updatedPlayer = playerEntity.updatePoints(points);
      await this.userRepository.save(updatedPlayer);
    }

    const id = this.generateUniqueId();
    const prize = new PrizeEntity(
      id,
      gameId,
      ticket.userId,
      ticketNumber,
      prizeType,
      prizeContent
    );

    return await this.prizeRepository.create(prize);
  }

  async getPrizeById(id: string): Promise<Prize | null> {
    const prizeEntity = await this.prizeRepository.findById(id);
    return prizeEntity ? prizeEntity.toJSON() : null;
  }

  async getPrizesByGameId(gameId: string): Promise<Prize[]> {
    const prizeEntities = await this.prizeRepository.findByGameId(gameId);
    return prizeEntities.map(entity => entity.toJSON());
  }

  async getPrizesByPlayerId(playerId: string): Promise<Prize[]> {
    const prizeEntities = await this.prizeRepository.findByPlayerId(playerId);
    return prizeEntities.map(entity => entity.toJSON());
  }

  async getAllPrizes(): Promise<Prize[]> {
    const prizeEntities = await this.prizeRepository.findAll();
    return prizeEntities.map(entity => entity.toJSON());
  }

  async updatePrize(
    id: string,
    updates: {
      prizeType?: PrizeType;
      prizeContent?: string;
      status?: PrizeStatus;
    }
  ): Promise<Prize | null> {
    const existingPrize = await this.prizeRepository.findById(id);
    if (!existingPrize) {
      throw new Error('獲獎紀錄不存在');
    }

    const updatedEntity = await this.prizeRepository.update(id, updates);
    return updatedEntity ? updatedEntity.toJSON() : null;
  }

  async deletePrize(id: string): Promise<boolean> {
    const existingPrize = await this.prizeRepository.findById(id);
    if (!existingPrize) {
      throw new Error('獲獎紀錄不存在');
    }

    return await this.prizeRepository.delete(id);
  }

  // 獲取遊戲的獲獎紀錄統計
  async getGamePrizeStats(gameId: string): Promise<{
    totalPrizes: number;
    pointsPrizes: number;
    physicalPrizes: number;
    prizesByType: { [key: string]: number };
  }> {
    const prizes = await this.prizeRepository.findByGameId(gameId);
    
    const stats = {
      totalPrizes: prizes.length,
      pointsPrizes: 0,
      physicalPrizes: 0,
      prizesByType: {} as { [key: string]: number }
    };

    prizes.forEach(prize => {
      if (prize.prizeType === PrizeType.POINTS) {
        stats.pointsPrizes++;
      } else if (prize.prizeType === PrizeType.PHYSICAL) {
        stats.physicalPrizes++;
      }

      const typeKey = prize.prizeType;
      stats.prizesByType[typeKey] = (stats.prizesByType[typeKey] || 0) + 1;
    });

    return stats;
  }

  // 獲取玩家的獲獎紀錄統計
  async getPlayerPrizeStats(playerId: string): Promise<{
    totalPrizes: number;
    pointsPrizes: number;
    physicalPrizes: number;
    gamesPrizeCount: { [gameId: string]: number };
  }> {
    const prizes = await this.prizeRepository.findByPlayerId(playerId);
    
    const stats = {
      totalPrizes: prizes.length,
      pointsPrizes: 0,
      physicalPrizes: 0,
      gamesPrizeCount: {} as { [gameId: string]: number }
    };

    prizes.forEach(prize => {
      if (prize.prizeType === PrizeType.POINTS) {
        stats.pointsPrizes++;
      } else if (prize.prizeType === PrizeType.PHYSICAL) {
        stats.physicalPrizes++;
      }

      stats.gamesPrizeCount[prize.gameId] = (stats.gamesPrizeCount[prize.gameId] || 0) + 1;
    });

    return stats;
  }

  private generateUniqueId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
