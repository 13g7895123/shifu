// Application - Ticket Purchase Use Cases
import { TicketEntity } from '../../domain/entities/Ticket';
import { TicketRepository } from '../../domain/repositories/TicketRepository';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { GameRepository } from '../../domain/repositories/GameRepository';
import { UserEntity } from '../../domain/entities/User';
import { v4 as uuidv4 } from 'uuid';

export interface PurchaseTicketRequest {
  gameId: string;
  ticketNumber: number;
  userId: string;
}

export interface PurchaseTicketResult {
  success: boolean;
  ticket?: TicketEntity;
  message: string;
}

export class TicketUseCases {
  constructor(
    private ticketRepository: TicketRepository,
    private userRepository: UserRepository,
    private gameRepository: GameRepository
  ) {}

  async purchaseTicket(request: PurchaseTicketRequest): Promise<PurchaseTicketResult> {
    try {
      // 1. 檢查遊戲是否存在
      const game = await this.gameRepository.findByGameId(request.gameId);
      if (!game) {
        return {
          success: false,
          message: '遊戲不存在'
        };
      }

      // 2. 檢查遊戲是否已停止購買
      if (game.purchasingStopped) {
        return {
          success: false,
          message: '此遊戲已停止購買票券'
        };
      }

      // 3. 檢查票券號碼是否有效
      const maxTickets = game.spec.tickets || 0;
      if (request.ticketNumber < 1 || request.ticketNumber > maxTickets) {
        return {
          success: false,
          message: `票券號碼必須在 1 到 ${maxTickets} 之間`
        };
      }

      // 4. 檢查票券是否已被購買
      const existingTicket = await this.ticketRepository.findByGameIdAndTicketNumber(
        request.gameId, 
        request.ticketNumber
      );
      if (existingTicket) {
        return {
          success: false,
          message: '此票券已被購買'
        };
      }

      // 5. 檢查用戶是否存在並獲取用戶信息
      const user = await this.userRepository.findById(request.userId);
      if (!user) {
        return {
          success: false,
          message: '用戶不存在'
        };
      }

      // 6. 檢查用戶願望幣是否足夠
      const ticketPrice = game.spec.ticketPrice || 0;
      if (user.point < ticketPrice) {
        return {
          success: false,
          message: `願望幣不足，需要 ${ticketPrice} 點，目前有 ${user.point} 點`
        };
      }

      // 7. 扣除用戶願望幣
      const updatedUser = new UserEntity(
        user.id,
        user.name,
        user.email,
        user.password,
        user.phone,
        user.address,
        user.point - ticketPrice,
        user.role,
        user.createdAt,
        new Date()
      );
      await this.userRepository.save(updatedUser);

      // 8. 創建票券記錄
      const ticketId = uuidv4();
      const ticket = new TicketEntity(
        ticketId,
        request.gameId,
        request.ticketNumber,
        request.userId,
        ticketPrice,
        new Date()
      );

      // 9. 保存票券
      const savedTicket = await this.ticketRepository.save(ticket);

      return {
        success: true,
        ticket: savedTicket,
        message: '票券購買成功'
      };

    } catch (error) {
      console.error('Purchase ticket error:', error);
      return {
        success: false,
        message: '購買票券時發生錯誤'
      };
    }
  }

  async getTicketsByGameId(gameId: string): Promise<TicketEntity[]> {
    return await this.ticketRepository.findByGameId(gameId);
  }

  async getTicketsByUserId(userId: string): Promise<TicketEntity[]> {
    return await this.ticketRepository.findByUserId(userId);
  }

  async getTicketById(id: string): Promise<TicketEntity | null> {
    return await this.ticketRepository.findById(id);
  }
}
