// Infrastructure - Admin Controller
import { Request, Response } from 'express';
import { AdminDashboardUseCase, ManageUsersUseCase, ManageGamesUseCase } from '../../../application/usecases/AdminUseCases';
import { UserRole } from '../../../domain/entities/User';
import { GameStatus } from '../../../domain/entities/Game';

export class AdminController {
  constructor(
    private adminDashboardUseCase: AdminDashboardUseCase,
    private manageUsersUseCase: ManageUsersUseCase,
    private manageGamesUseCase: ManageGamesUseCase
  ) {}

  // 管理員儀表板 (API)
  dashboard = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const dashboardData = await this.adminDashboardUseCase.execute();
      
      res.json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      console.error('管理員儀表板錯誤:', error);
      res.status(500).json({
        success: false,
        message: '載入管理員儀表板時發生錯誤'
      });
    }
  }

  // 用戶管理頁面 (API)
  manageUsers = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const users = await this.manageUsersUseCase.getAllUsers();
      
      res.json({
        success: true,
        data: {
          users,
          UserRole // 傳遞角色枚舉到前端
        }
      });
    } catch (error) {
      console.error('用戶管理頁面錯誤:', error);
      res.status(500).json({
        success: false,
        message: '載入用戶管理頁面時發生錯誤'
      });
    }
  }

  // 更新用戶角色
  updateUserRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      if (userId === adminId) {
        res.status(400).json({
          success: false,
          message: '無法變更自己的角色'
        });
        return;
      }

      if (!Object.values(UserRole).includes(role)) {
        res.status(400).json({
          success: false,
          message: '無效的角色'
        });
        return;
      }

      const result = await this.manageUsersUseCase.updateUserRole(userId, role as UserRole, adminId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('更新用戶角色錯誤:', error);
      res.status(500).json({
        success: false,
        message: '更新用戶角色時發生錯誤'
      });
    }
  }

  // 刪除用戶
  deleteUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      if (userId === adminId) {
        res.status(400).json({
          success: false,
          message: '無法刪除自己的帳號'
        });
        return;
      }

      const result = await this.manageUsersUseCase.deleteUser(userId, adminId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('刪除用戶錯誤:', error);
      res.status(500).json({
        success: false,
        message: '刪除用戶時發生錯誤'
      });
    }
  }

  // 獲取單個用戶資料
  getUserById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const user = await this.manageUsersUseCase.getUserById(userId);
      
      if (user) {
        res.json({
          success: true,
          user
        });
      } else {
        res.status(404).json({
          success: false,
          message: '用戶不存在'
        });
      }
    } catch (error) {
      console.error('獲取用戶資料錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取用戶資料時發生錯誤'
      });
    }
  }

  // 更新用戶資料
  updateUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { name, email, phone, point, address } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      // 驗證必要欄位
      if (!name || !email || !phone || point === undefined) {
        res.status(400).json({
          success: false,
          message: '缺少必要欄位'
        });
        return;
      }

      const pointValue = Number(point);
      if (isNaN(pointValue)) {
        res.status(400).json({
          success: false,
          message: '點數必須是有效的數字'
        });
        return;
      }

      const result = await this.manageUsersUseCase.updateUser(userId, {
        name,
        email,
        phone,
        point: pointValue,
        address
      }, adminId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('更新用戶資料錯誤:', error);
      res.status(500).json({
        success: false,
        message: '更新用戶資料時發生錯誤'
      });
    }
  }

  // 為用戶加值
  addPointsToUser = async (req: Request, res: Response): Promise<void> => {
    try {
      const { userId } = req.params;
      const { amount, reason } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const amountValue = Number(amount);
      if (!amount || isNaN(amountValue) || amountValue <= 0) {
        res.status(400).json({
          success: false,
          message: '加值金額必須是大於0的有效數字'
        });
        return;
      }

      const result = await this.manageUsersUseCase.addPointsToUser(userId, amountValue, reason || '', adminId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('加值錯誤:', error);
      res.status(500).json({
        success: false,
        message: '加值時發生錯誤'
      });
    }
  }

  // 按角色篩選用戶 (AJAX API)
  getUsersByRole = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const { role } = req.params;

      if (!Object.values(UserRole).includes(role as UserRole)) {
        res.status(400).json({
          success: false,
          message: '無效的角色'
        });
        return;
      }

      const users = await this.manageUsersUseCase.getUsersByRole(role as UserRole);
      
      res.json({
        success: true,
        users
      });
    } catch (error) {
      console.error('按角色獲取用戶錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取用戶數據時發生錯誤'
      });
    }
  }
  
  // === 遊戲管理功能 ===
  
  // 遊戲管理頁面 (API)
  manageGames = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const games = await this.manageGamesUseCase.getAllGamesWithStatus();
      
      res.json({
        success: true,
        data: {
          games,
          GameStatus // 傳遞狀態枚舉到前端
        }
      });
    } catch (error) {
      console.error('遊戲管理頁面錯誤:', error);
      res.status(500).json({
        success: false,
        message: '載入遊戲管理頁面時發生錯誤'
      });
    }
  }

  // 獲取所有遊戲 (API)
  getAllGames = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const games = await this.manageGamesUseCase.getAllGamesWithStatus();
      
      res.json({
        success: true,
        games
      });
    } catch (error) {
      console.error('獲取遊戲列表錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取遊戲列表時發生錯誤'
      });
    }
  }

  // 創建新遊戲
  createGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId, spec } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const result = await this.manageGamesUseCase.createGame({
        gameId,
        spec
      });
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('創建遊戲錯誤:', error);
      res.status(500).json({
        success: false,
        message: '創建遊戲時發生錯誤'
      });
    }
  }

  // 獲取單個遊戲資料
  getGameById = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const game = await this.manageGamesUseCase.getGameById(gameId);
      
      if (game) {
        res.json({
          success: true,
          game
        });
      } else {
        res.status(404).json({
          success: false,
          message: '遊戲不存在'
        });
      }
    } catch (error) {
      console.error('獲取遊戲資料錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取遊戲資料時發生錯誤'
      });
    }
  }

  // 更新遊戲資料
  updateGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { status, spec } = req.body;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      if (status && !Object.values(GameStatus).includes(status)) {
        res.status(400).json({
          success: false,
          message: '無效的遊戲狀態'
        });
        return;
      }

      const result = await this.manageGamesUseCase.updateGame(gameId, {
        status,
        spec
      });
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('更新遊戲資料錯誤:', error);
      res.status(500).json({
        success: false,
        message: '更新遊戲資料時發生錯誤'
      });
    }
  }

  // 結束遊戲
  finishGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const result = await this.manageGamesUseCase.finishGame(gameId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('結束遊戲錯誤:', error);
      res.status(500).json({
        success: false,
        message: '結束遊戲時發生錯誤'
      });
    }
  }

  // 刪除遊戲
  deleteGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const result = await this.manageGamesUseCase.deleteGame(gameId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('刪除遊戲錯誤:', error);
      res.status(500).json({
        success: false,
        message: '刪除遊戲時發生錯誤'
      });
    }
  }

  // 按狀態篩選遊戲 (AJAX API)
  getGamesByStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      const adminId = req.user?.id;
      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const { status } = req.params;

      if (!Object.values(GameStatus).includes(status as GameStatus)) {
        res.status(400).json({
          success: false,
          message: '無效的遊戲狀態'
        });
        return;
      }

      const games = await this.manageGamesUseCase.getGamesByStatus(status as GameStatus);
      
      res.json({
        success: true,
        games
      });
    } catch (error) {
      console.error('按狀態獲取遊戲錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取遊戲數據時發生錯誤'
      });
    }
  }

  // 開始遊戲
  startGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const result = await this.manageGamesUseCase.startGame(gameId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('開始遊戲錯誤:', error);
      res.status(500).json({
        success: false,
        message: '開始遊戲時發生錯誤'
      });
    }
  }

  // 停止遊戲
  stopGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const result = await this.manageGamesUseCase.stopGame(gameId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('停止遊戲錯誤:', error);
      res.status(500).json({
        success: false,
        message: '停止遊戲時發生錯誤'
      });
    }
  }

  // 獲取活動遊戲ID
  getActiveGameId = async (req: Request, res: Response): Promise<void> => {
    try {
      const activeGameId = await this.manageGamesUseCase.getActiveGameId();
      
      res.json({
        success: true,
        activeGameId: activeGameId
      });
    } catch (error) {
      console.error('獲取活動遊戲ID錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取活動遊戲ID時發生錯誤'
      });
    }
  }

  // 取消遊戲
  cancelGame = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const result = await this.manageGamesUseCase.cancelGame(gameId);
      
      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error('取消遊戲錯誤:', error);
      res.status(500).json({
        success: false,
        message: '取消遊戲時發生錯誤'
      });
    }
  }

  // 停止購買票券
  stopPurchasing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const result = await this.manageGamesUseCase.stopPurchasing(gameId);
      
      res.json({
        success: true,
        data: result,
        message: '已停止此遊戲的票券購買'
      });
    } catch (error) {
      console.error('停止購買錯誤:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '停止購買時發生錯誤'
      });
    }
  }

  // 恢復購買票券
  resumePurchasing = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const result = await this.manageGamesUseCase.resumePurchasing(gameId);
      
      res.json({
        success: true,
        data: result,
        message: '已恢復此遊戲的票券購買'
      });
    } catch (error) {
      console.error('恢復購買錯誤:', error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : '恢復購買時發生錯誤'
      });
    }
  }

  // 獲取遊戲購買資訊
  getGamePurchaseInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const adminId = req.user?.id;

      if (!adminId) {
        res.status(401).json({
          success: false,
          message: '未授權的操作'
        });
        return;
      }

      const purchaseInfo = await this.manageGamesUseCase.getGamePurchaseInfo(gameId);
      
      res.json({
        success: true,
        data: purchaseInfo
      });
    } catch (error) {
      console.error('獲取遊戲購買資訊錯誤:', error);
      res.status(500).json({
        success: false,
        message: '獲取購買資訊時發生錯誤'
      });
    }
  }
}
