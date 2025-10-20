// Infrastructure - Ticket Controller
import { Request, Response } from 'express';
import { TicketUseCases } from '../../../application/usecases/TicketUseCases';

export class TicketController {
  constructor(private ticketUseCases: TicketUseCases) {}

  // API: 購買票券
  async purchaseTicket(req: Request, res: Response): Promise<void> {
    try {
      const { gameId, ticketNumber } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '請先登入'
        });
        return;
      }

      if (!gameId || !ticketNumber) {
        res.status(400).json({
          success: false,
          message: '請提供遊戲ID和票券號碼'
        });
        return;
      }

      const result = await this.ticketUseCases.purchaseTicket({
        gameId,
        ticketNumber: parseInt(ticketNumber),
        userId
      });

      if (result.success) {
        res.json({
          success: true,
          data: result.ticket,
          message: result.message
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message
        });
      }
    } catch (error) {
      console.error('Purchase ticket error:', error);
      res.status(500).json({
        success: false,
        message: '購買票券時發生錯誤',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 獲取遊戲的所有已購買票券
  async getGameTickets(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;

      if (!gameId) {
        res.status(400).json({
          success: false,
          message: '請提供遊戲ID'
        });
        return;
      }

      const tickets = await this.ticketUseCases.getTicketsByGameId(gameId);

      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Get game tickets error:', error);
      res.status(500).json({
        success: false,
        message: '獲取票券列表失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 獲取用戶的所有已購買票券
  async getUserTickets(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '請先登入'
        });
        return;
      }

      const tickets = await this.ticketUseCases.getTicketsByUserId(userId);

      res.json({
        success: true,
        data: tickets
      });
    } catch (error) {
      console.error('Get user tickets error:', error);
      res.status(500).json({
        success: false,
        message: '獲取用戶票券失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 獲取特定票券詳情
  async getTicketById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      if (!id) {
        res.status(400).json({
          success: false,
          message: '請提供票券ID'
        });
        return;
      }

      const ticket = await this.ticketUseCases.getTicketById(id);

      if (!ticket) {
        res.status(404).json({
          success: false,
          message: '票券不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: ticket
      });
    } catch (error) {
      console.error('Get ticket error:', error);
      res.status(500).json({
        success: false,
        message: '獲取票券失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }
}
