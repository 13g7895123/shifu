// Infrastructure - Game Controllers
import { Request, Response } from 'express';
import { GameUseCases } from '../../../application/usecases/GameUseCases';

export class GameController {
  constructor(private gameUseCases: GameUseCases) {}

  // API: 獲取所有遊戲
  async getAllGames(req: Request, res: Response): Promise<void> {
    try {
      const games = await this.gameUseCases.getAllGames();
      res.json({ 
        success: true, 
        data: games 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '獲取遊戲列表失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 根據ID獲取遊戲
  async getGameById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const game = await this.gameUseCases.getGameById(id);
      
      if (!game) {
        res.status(404).json({ 
          success: false, 
          message: '遊戲不存在' 
        });
        return;
      }

      res.json({ 
        success: true, 
        data: game 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '獲取遊戲失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 根據遊戲ID獲取遊戲
  async getGameByGameId(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const game = await this.gameUseCases.getGameByGameId(gameId);
      
      if (!game) {
        res.status(404).json({ 
          success: false, 
          message: '遊戲不存在' 
        });
        return;
      }

      res.json({ 
        success: true, 
        data: game 
      });
    } catch (error) {
      res.status(500).json({ 
        success: false, 
        message: '獲取遊戲失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 獲取遊戲指南
  async getGameGuide(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        success: true,
        data: {
          title: '遊戲指南',
          sections: [
            {
              title: '如何開始',
              content: '歡迎來到遊戲世界！這裡是您學習和提升技能的地方。'
            },
            {
              title: '遊戲規則',
              content: [
                '1. 創建您的帳戶並登入系統',
                '2. 選擇您想要學習的技能領域',
                '3. 完成任務和挑戰以獲得積分',
                '4. 提升您的等級並解鎖新內容'
              ]
            },
            {
              title: '技巧和建議',
              content: [
                '每天登入以獲得額外獎勵',
                '與其他玩家互動以學習新策略',
                '保持耐心，技能的提升需要時間'
              ]
            }
          ]
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '載入遊戲指南失敗'
      });
    }
  }

  // API: 獲取當前活躍的遊戲
  async getCurrentActiveGame(req: Request, res: Response): Promise<void> {
    try {
      const activeGame = await this.gameUseCases.getCurrentActiveGame();
      
      if (!activeGame) {
        res.json({
          success: true,
          data: null,
          message: '目前沒有進行中的遊戲'
        });
        return;
      }

      res.json({
        success: true,
        data: activeGame
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: '獲取當前活躍遊戲失敗',
        error: error instanceof Error ? error.message : '未知錯誤'
      });
    }
  }

  // API: 停止購買票券
  async stopPurchasing(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const updatedGame = await this.gameUseCases.stopPurchasing(gameId);
      
      res.json({
        success: true,
        data: updatedGame,
        message: '已停止此遊戲的票券購買'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '停止購買失敗'
      });
    }
  }

  // API: 恢復購買票券
  async resumePurchasing(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const updatedGame = await this.gameUseCases.resumePurchasing(gameId);
      
      res.json({
        success: true,
        data: updatedGame,
        message: '已恢復此遊戲的票券購買'
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '恢復購買失敗'
      });
    }
  }
}
