// Infrastructure - Prize Controllers
import { Request, Response } from 'express';
import { PrizeUseCases } from '../../../application/usecases/PrizeUseCases';
import { PrizeType, PrizeStatus } from '../../../domain/entities/Prize';

export class PrizeController {
  constructor(private prizeUseCases: PrizeUseCases) {}

  // API: 發獎給指定票券
  async awardPrize(req: Request, res: Response): Promise<void> {
    try {
      const { gameId, ticketNumber, prizeType, prizeContent } = req.body;

      // 驗證輸入
      if (!gameId || !ticketNumber || !prizeType || !prizeContent) {
        res.status(400).json({
          success: false,
          message: '請提供完整的獲獎資訊：遊戲ID、票號、禮物類型、禮物內容'
        });
        return;
      }

      // 驗證禮物類型
      if (!Object.values(PrizeType).includes(prizeType)) {
        res.status(400).json({
          success: false,
          message: '無效的禮物類型，請選擇 points 或 physical'
        });
        return;
      }

      const prize = await this.prizeUseCases.awardPrize(
        gameId,
        parseInt(ticketNumber),
        prizeType as PrizeType,
        prizeContent
      );

      res.status(201).json({
        success: true,
        data: prize,
        message: '成功發送禮物'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '發送禮物失敗'
      });
    }
  }

  // API: 獲取所有獲獎紀錄
  async getAllPrizes(req: Request, res: Response): Promise<void> {
    try {
      const prizes = await this.prizeUseCases.getAllPrizes();
      res.json({
        success: true,
        data: prizes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取獲獎紀錄失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 根據ID獲取獲獎紀錄
  async getPrizeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const prize = await this.prizeUseCases.getPrizeById(id);

      if (!prize) {
        res.status(404).json({
          success: false,
          message: '獲獎紀錄不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: prize
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取獲獎紀錄失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 根據遊戲ID獲取獲獎紀錄
  async getPrizesByGameId(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const prizes = await this.prizeUseCases.getPrizesByGameId(gameId);

      res.json({
        success: true,
        data: prizes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取遊戲獲獎紀錄失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 根據玩家ID獲取獲獎紀錄
  async getPrizesByPlayerId(req: Request, res: Response): Promise<void> {
    try {
      const { playerId } = req.params;
      const prizes = await this.prizeUseCases.getPrizesByPlayerId(playerId);

      res.json({
        success: true,
        data: prizes
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取玩家獲獎紀錄失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 用戶通知出貨（只允許未出貨的獎品且只能由獎品擁有者操作）
  async notifyShipment(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id; // 從認證中間件獲取用戶ID

      if (!userId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      // 先獲取獎品詳情
      const prize = await this.prizeUseCases.getPrizeById(id);
      
      if (!prize) {
        res.status(404).json({
          success: false,
          message: '獎品不存在'
        });
        return;
      }

      // 檢查是否為獎品擁有者
      if (prize.playerId !== userId) {
        res.status(403).json({
          success: false,
          message: '您只能操作自己的獎品'
        });
        return;
      }

      // 檢查獎品類型和狀態
      if (prize.prizeType !== 'physical') {
        res.status(400).json({
          success: false,
          message: '只有實體獎品可以通知出貨'
        });
        return;
      }

      if (prize.status !== 'pending_shipment') {
        res.status(400).json({
          success: false,
          message: '只有未出貨的獎品可以通知出貨'
        });
        return;
      }

      // 更新狀態為已通知出貨
      const updatedPrize = await this.prizeUseCases.updatePrize(id, {
        status: PrizeStatus.SHIPMENT_NOTIFIED
      });

      if (!updatedPrize) {
        res.status(500).json({
          success: false,
          message: '更新獎品狀態失敗'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedPrize,
        message: '已成功通知管理員出貨'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '通知出貨失敗'
      });
    }
  }

  // API: 更新獲獎紀錄
  async updatePrize(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { prizeType, prizeContent, status } = req.body;

      const updates: any = {};
      if (prizeType) {
        if (!Object.values(PrizeType).includes(prizeType)) {
          res.status(400).json({
            success: false,
            message: '無效的禮物類型'
          });
          return;
        }
        updates.prizeType = prizeType;
      }
      if (prizeContent) {
        updates.prizeContent = prizeContent;
      }
      if (status) {
        if (!Object.values(PrizeStatus).includes(status)) {
          res.status(400).json({
            success: false,
            message: '無效的獎品狀態'
          });
          return;
        }
        updates.status = status;
      }

      const updatedPrize = await this.prizeUseCases.updatePrize(id, updates);

      if (!updatedPrize) {
        res.status(404).json({
          success: false,
          message: '獲獎紀錄不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedPrize,
        message: '獲獎紀錄更新成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '更新獲獎紀錄失敗'
      });
    }
  }

  // API: 刪除獲獎紀錄
  async deletePrize(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const deleted = await this.prizeUseCases.deletePrize(id);

      if (!deleted) {
        res.status(404).json({
          success: false,
          message: '獲獎紀錄不存在'
        });
        return;
      }

      res.json({
        success: true,
        message: '獲獎紀錄刪除成功'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '刪除獲獎紀錄失敗'
      });
    }
  }

  // API: 管理員更新獎勵狀態
  async updatePrizeStatusByAdmin(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // 驗證狀態值
      if (!Object.values(PrizeStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: '無效的獎品狀態'
        });
        return;
      }

      const updatedPrize = await this.prizeUseCases.updatePrize(id, { status });

      if (!updatedPrize) {
        res.status(404).json({
          success: false,
          message: '獎品不存在'
        });
        return;
      }

      res.json({
        success: true,
        data: updatedPrize,
        message: '獎品狀態更新成功'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error instanceof Error ? error.message : '更新獎品狀態失敗'
      });
    }
  }

  // API: 獲取遊戲的獲獎統計
  async getGamePrizeStats(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const stats = await this.prizeUseCases.getGamePrizeStats(gameId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取遊戲獲獎統計失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 獲取玩家的獲獎統計
  async getPlayerPrizeStats(req: Request, res: Response): Promise<void> {
    try {
      const { playerId } = req.params;
      const stats = await this.prizeUseCases.getPlayerPrizeStats(playerId);

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取玩家獲獎統計失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }
}
