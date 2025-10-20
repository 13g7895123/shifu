// Application - Admin Use Cases
import { User, UserRole } from '../../domain/entities/User';
import { GameEntity as Game, GameStatus } from '../../domain/entities/Game';
import { UserRepository } from '../../domain/repositories/UserRepository';
import { GameRepository } from '../../domain/repositories/GameRepository';
import { TicketRepository } from '../../domain/repositories/TicketRepository';

export interface AdminDashboardData {
  totalUsers: number;
  totalPlayers: number;
  totalAdmins: number;
  recentUsers: User[];
}

export class AdminDashboardUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(): Promise<AdminDashboardData> {
    try {
      const allUsers = await this.userRepository.findAll();
      const players = await this.userRepository.findByRole(UserRole.PLAYER);
      const admins = await this.userRepository.findByRole(UserRole.ADMIN);
      
      // 取得最近5個註冊的用戶
      const recentUsers = allUsers
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
        .slice(0, 5);

      return {
        totalUsers: allUsers.length,
        totalPlayers: players.length,
        totalAdmins: admins.length,
        recentUsers
      };
    } catch (error) {
      console.error('獲取管理員儀表板數據失敗:', error);
      throw new Error('獲取管理員儀表板數據失敗');
    }
  }
}

export class ManageUsersUseCase {
  constructor(private userRepository: UserRepository) {}

  async getAllUsers(): Promise<User[]> {
    try {
      return await this.userRepository.findAll();
    } catch (error) {
      console.error('獲取所有用戶失敗:', error);
      throw new Error('獲取所有用戶失敗');
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.userRepository.findById(userId);
    } catch (error) {
      console.error('獲取用戶失敗:', error);
      throw new Error('獲取用戶失敗');
    }
  }

  async updateUser(
    userId: string, 
    userData: { name: string; email: string; phone: string; point: number; address?: string },
    adminId: string
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: '用戶不存在'
        };
      }

      // 檢查email是否已被其他用戶使用
      const existingUser = await this.userRepository.findByEmail(userData.email);
      if (existingUser && existingUser.id !== userId) {
        return {
          success: false,
          message: 'Email已被其他用戶使用'
        };
      }

      // 使用UserEntity的更新方法
      if ('updateProfile' in user && typeof user.updateProfile === 'function') {
        const updatedUser = (user as any).updateProfile({
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address
        });
        
        // 如果積分有變化，更新積分
        if (updatedUser.point !== userData.point) {
          if ('updatePoints' in updatedUser && typeof updatedUser.updatePoints === 'function') {
            const pointDifference = userData.point - updatedUser.point;
            (updatedUser as any).updatePoints(pointDifference);
          }
        }
        
        const savedUser = await this.userRepository.save(updatedUser);
        
        return {
          success: true,
          message: '用戶資料更新成功',
          user: savedUser
        };
      } else {
        return {
          success: false,
          message: '用戶對象不支持資料更新'
        };
      }

    } catch (error) {
      console.error('更新用戶資料失敗:', error);
      return {
        success: false,
        message: '更新用戶資料時發生錯誤'
      };
    }
  }

  async addPointsToUser(
    userId: string, 
    amount: number, 
    reason: string, 
    adminId: string
  ): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: '用戶不存在'
        };
      }

      if (amount <= 0) {
        return {
          success: false,
          message: '加值金額必須大於0'
        };
      }

      // 使用UserEntity的updatePoints方法
      if ('updatePoints' in user && typeof user.updatePoints === 'function') {
        const updatedUser = (user as any).updatePoints(amount);
        const savedUser = await this.userRepository.save(updatedUser);
        
        // 這裡可以記錄加值歷史（如果有相關的服務）
        console.log(`管理員 ${adminId} 為用戶 ${userId} 加值 ${amount} 積分，原因：${reason}`);
        
        return {
          success: true,
          message: `成功加值 ${amount} 積分`,
          user: savedUser
        };
      } else {
        return {
          success: false,
          message: '用戶對象不支持積分更新'
        };
      }

    } catch (error) {
      console.error('加值失敗:', error);
      return {
        success: false,
        message: '加值時發生錯誤'
      };
    }
  }

  async getUsersByRole(role: UserRole): Promise<User[]> {
    try {
      return await this.userRepository.findByRole(role);
    } catch (error) {
      console.error(`獲取${role}角色用戶失敗:`, error);
      throw new Error(`獲取${role}角色用戶失敗`);
    }
  }

  async updateUserRole(userId: string, newRole: UserRole, adminId: string): Promise<{ success: boolean; message: string; user?: User }> {
    try {
      // 確保管理員不能修改自己的角色
      if (userId === adminId) {
        return {
          success: false,
          message: '無法修改自己的角色'
        };
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: '用戶不存在'
        };
      }

      // 檢查是否試圖將最後一個管理員改為玩家
      if (user.role === UserRole.ADMIN && newRole === UserRole.PLAYER) {
        const allAdmins = await this.userRepository.findByRole(UserRole.ADMIN);
        if (allAdmins.length <= 1) {
          return {
            success: false,
            message: '系統至少需要一個管理員'
          };
        }
      }

      // 使用UserEntity的updateRole方法
      if ('updateRole' in user && typeof user.updateRole === 'function') {
        const updatedUser = (user as any).updateRole(newRole);
        const savedUser = await this.userRepository.save(updatedUser);
        
        return {
          success: true,
          message: '用戶角色更新成功',
          user: savedUser
        };
      } else {
        return {
          success: false,
          message: '用戶對象不支持角色更新'
        };
      }

    } catch (error) {
      console.error('更新用戶角色失敗:', error);
      return {
        success: false,
        message: '更新用戶角色時發生錯誤'
      };
    }
  }

  async deleteUser(userId: string, adminId: string): Promise<{ success: boolean; message: string }> {
    try {
      // 管理員不能刪除自己
      if (userId === adminId) {
        return {
          success: false,
          message: '無法刪除自己的帳號'
        };
      }

      const user = await this.userRepository.findById(userId);
      if (!user) {
        return {
          success: false,
          message: '用戶不存在'
        };
      }

      // 檢查是否試圖刪除最後一個管理員
      if (user.role === UserRole.ADMIN) {
        const allAdmins = await this.userRepository.findByRole(UserRole.ADMIN);
        if (allAdmins.length <= 1) {
          return {
            success: false,
            message: '無法刪除最後一個管理員'
          };
        }
      }

      const deleted = await this.userRepository.delete(userId);
      
      if (deleted) {
        return {
          success: true,
          message: '用戶刪除成功'
        };
      } else {
        return {
          success: false,
          message: '刪除用戶失敗'
        };
      }

    } catch (error) {
      console.error('刪除用戶失敗:', error);
      return {
        success: false,
        message: '刪除用戶時發生錯誤'
      };
    }
  }
}

export class ManageGamesUseCase {
  constructor(
    private gameRepository: GameRepository,
    private ticketRepository: TicketRepository,
    private userRepository: UserRepository,
    private redisService?: any,
    private gameUseCases?: any
  ) {}

  // 輔助方法：計算遊戲狀態
  private async getGameStatus(game: Game): Promise<GameStatus> {
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
      if (this.redisService) {
        const currentGameId = await this.redisService.getActiveGame();
        if (currentGameId === game.gameId) {
          return GameStatus.ACTIVE;
        }
      }
    } catch (error) {
      console.error('Error checking active game from Redis:', error);
    }
    
    // 否則為待開始
    return GameStatus.PENDING;
  }

  async getAllGames(): Promise<Game[]> {
    try {
      return await this.gameRepository.findAll();
    } catch (error) {
      console.error('獲取所有遊戲失敗:', error);
      throw new Error('獲取所有遊戲失敗');
    }
  }

  // 獲取所有遊戲及其狀態
  async getAllGamesWithStatus(): Promise<any[]> {
    try {
      const games = await this.gameRepository.findAll();
      const gamesWithStatus = [];
      
      for (const game of games) {
        const status = await this.getGameStatus(game);
        // 獲取已售出票數
        let soldTickets = 0;
        if (this.ticketRepository) {
          try {
            const tickets = await this.ticketRepository.findByGameId(game.gameId);
            soldTickets = tickets.length;
          } catch (error) {
            console.error(`獲取遊戲 ${game.gameId} 的票務資訊失敗:`, error);
          }
        }
        
        gamesWithStatus.push(Object.assign(game.toJSON(), { 
          status,
          soldTickets
        }));
      }
      
      return gamesWithStatus;
    } catch (error) {
      console.error('獲取所有遊戲失敗:', error);
      throw new Error('獲取所有遊戲失敗');
    }
  }

  async getGameById(gameId: string): Promise<Game | null> {
    try {
      return await this.gameRepository.findById(gameId);
    } catch (error) {
      console.error('獲取遊戲失敗:', error);
      throw new Error('獲取遊戲失敗');
    }
  }

  async createGame(gameData: {
    gameId?: string;
    spec?: Record<string, any>;
  }): Promise<{ success: boolean; message: string; game?: Game }> {
    try {
      const newGame = await this.gameRepository.create(gameData);
      
      return {
        success: true,
        message: '遊戲建立成功',
        game: newGame
      };
    } catch (error) {
      console.error('建立遊戲失敗:', error);
      return {
        success: false,
        message: '建立遊戲時發生錯誤'
      };
    }
  }

  async updateGame(
    gameId: string,
    gameData: {
      status?: GameStatus;
      spec?: Record<string, any>;
    }
  ): Promise<{ success: boolean; message: string; game?: Game }> {
    try {
      const existingGame = await this.gameRepository.findById(gameId);
      if (!existingGame) {
        return {
          success: false,
          message: '遊戲不存在'
        };
      }

      const updatedGame = await this.gameRepository.update(gameId, gameData);

      if (updatedGame) {
        return {
          success: true,
          message: '遊戲更新成功',
          game: updatedGame
        };
      } else {
        return {
          success: false,
          message: '更新遊戲失敗'
        };
      }
    } catch (error) {
      console.error('更新遊戲失敗:', error);
      return {
        success: false,
        message: '更新遊戲時發生錯誤'
      };
    }
  }

  async finishGame(gameId: string): Promise<{ success: boolean; message: string; game?: Game }> {
    try {
      const existingGame = await this.gameRepository.findById(gameId);
      if (!existingGame) {
        return {
          success: false,
          message: '遊戲不存在'
        };
      }

      const currentStatus = await this.getGameStatus(existingGame);
      if (currentStatus !== GameStatus.ACTIVE) {
        return {
          success: false,
          message: '只能結束進行中的遊戲'
        };
      }

      const updatedGame = await this.gameRepository.update(gameId, {
        finishTime: new Date()
      });

      // 從 Redis 中清除活動遊戲記錄
      if (this.redisService && updatedGame) {
        const activeGameId = await this.redisService.getActiveGame();
        if (activeGameId === existingGame.gameId) {
          await this.redisService.clearActiveGame();
        }
      }

      if (updatedGame) {
        return {
          success: true,
          message: '遊戲已結束',
          game: updatedGame
        };
      } else {
        return {
          success: false,
          message: '結束遊戲失敗'
        };
      }
    } catch (error) {
      console.error('結束遊戲失敗:', error);
      return {
        success: false,
        message: '結束遊戲時發生錯誤'
      };
    }
  }

  async deleteGame(gameId: string): Promise<{ success: boolean; message: string }> {
    try {
      const existingGame = await this.gameRepository.findById(gameId);
      if (!existingGame) {
        return {
          success: false,
          message: '遊戲不存在'
        };
      }

      // 如果是進行中的遊戲，需要先從 Redis 中清除
      if (this.redisService) {
        const currentStatus = await this.getGameStatus(existingGame);
        if (currentStatus === GameStatus.ACTIVE) {
          const activeGameId = await this.redisService.getActiveGame();
          if (activeGameId === existingGame.gameId) {
            await this.redisService.clearActiveGame();
          }
        }
      }

      const deleted = await this.gameRepository.delete(gameId);
      
      if (deleted) {
        return {
          success: true,
          message: '遊戲刪除成功'
        };
      } else {
        return {
          success: false,
          message: '刪除遊戲失敗'
        };
      }
    } catch (error) {
      console.error('刪除遊戲失敗:', error);
      return {
        success: false,
        message: '刪除遊戲時發生錯誤'
      };
    }
  }

  async getGamesByStatus(status: GameStatus): Promise<Game[]> {
    try {
      return await this.gameRepository.findByStatus(status);
    } catch (error) {
      console.error(`獲取${status}狀態遊戲失敗:`, error);
      throw new Error(`獲取${status}狀態遊戲失敗`);
    }
  }

  // 新增開始遊戲方法
  async startGame(gameId: string): Promise<{ success: boolean; message: string; game?: Game }> {
    try {
      // 檢查是否已有進行中的遊戲
      if (this.redisService) {
        const hasActiveGame = await this.redisService.hasActiveGame();
        if (hasActiveGame) {
          const activeGameId = await this.redisService.getActiveGame();
          return {
            success: false,
            message: `目前已有遊戲在進行中 (ID: ${activeGameId})，請先結束該遊戲`
          };
        }
      }

      const existingGame = await this.gameRepository.findById(gameId);
      if (!existingGame) {
        return {
          success: false,
          message: '遊戲不存在'
        };
      }

      const currentStatus = await this.getGameStatus(existingGame);
      if (currentStatus !== GameStatus.PENDING) {
        return {
          success: false,
          message: '只有待開始的遊戲才能啟動'
        };
      }

      // 設置遊戲為活動狀態（通過 Redis 記錄）
      if (this.redisService) {
        await this.redisService.setActiveGame(existingGame.gameId);
      }

      return {
        success: true,
        message: '遊戲已開始',
        game: existingGame
      };
    } catch (error) {
      console.error('開始遊戲失敗:', error);
      return {
        success: false,
        message: '開始遊戲時發生錯誤'
      };
    }
  }

  // 新增停止遊戲方法
  async stopGame(gameId: string): Promise<{ success: boolean; message: string; game?: Game }> {
    try {
      const existingGame = await this.gameRepository.findById(gameId);
      if (!existingGame) {
        return {
          success: false,
          message: '遊戲不存在'
        };
      }

      const currentStatus = await this.getGameStatus(existingGame);
      if (currentStatus !== GameStatus.ACTIVE) {
        return {
          success: false,
          message: '只有進行中的遊戲才能停止'
        };
      }

      // 從 Redis 中清除活動遊戲記錄
      if (this.redisService) {
        const activeGameId = await this.redisService.getActiveGame();
        if (activeGameId === existingGame.gameId) {
          await this.redisService.clearActiveGame();
        }
      }

      return {
        success: true,
        message: '遊戲已停止',
        game: existingGame
      };
    } catch (error) {
      console.error('停止遊戲失敗:', error);
      return {
        success: false,
        message: '停止遊戲時發生錯誤'
      };
    }
  }

  // 獲取目前活動的遊戲ID
  async getActiveGameId(): Promise<string | null> {
    if (!this.redisService) return null;
    try {
      return await this.redisService.getActiveGame();
    } catch (error) {
      console.error('獲取活動遊戲ID失敗:', error);
      return null;
    }
  }

  // 停止購買票券
  async stopPurchasing(gameId: string): Promise<Game> {
    try {
      const game = await this.gameRepository.findById(gameId);
      if (!game) {
        throw new Error('遊戲不存在');
      }

      if (game.purchasingStopped) {
        throw new Error('遊戲已經停止購買');
      }

      const updatedGame = game.updatePurchasingStopped(true);
      return await this.gameRepository.save(updatedGame);
    } catch (error) {
      console.error('停止購買失敗:', error);
      throw error;
    }
  }

  // 恢復購買票券
  async resumePurchasing(gameId: string): Promise<Game> {
    try {
      const game = await this.gameRepository.findById(gameId);
      if (!game) {
        throw new Error('遊戲不存在');
      }

      if (!game.purchasingStopped) {
        throw new Error('遊戲購買未被停止');
      }

      const updatedGame = game.updatePurchasingStopped(false);
      return await this.gameRepository.save(updatedGame);
    } catch (error) {
      console.error('恢復購買失敗:', error);
      throw error;
    }
  }

  // 取消遊戲
  async cancelGame(gameId: string): Promise<{ success: boolean; message: string; game?: Game }> {
    try {
      const existingGame = await this.gameRepository.findById(gameId);
      if (!existingGame) {
        return {
          success: false,
          message: '遊戲不存在'
        };
      }

      const currentStatus = await this.getGameStatus(existingGame);
      if (currentStatus === GameStatus.FINISHED) {
        return {
          success: false,
          message: '已結束的遊戲無法取消'
        };
      }

      if (currentStatus === GameStatus.CANCELLED) {
        return {
          success: false,
          message: '遊戲已經被取消'
        };
      }

      // 如果是進行中的遊戲，先從 Redis 中清除活動遊戲記錄
      if (currentStatus === GameStatus.ACTIVE && this.redisService) {
        const activeGameId = await this.redisService.getActiveGame();
        if (activeGameId === existingGame.gameId) {
          await this.redisService.clearActiveGame();
        }
      }

      // 使用 GameUseCases 來取消遊戲並收回獎勵
      if (this.gameUseCases) {
        try {
          const cancelledGame = await this.gameUseCases.cancelGame(existingGame.gameId);
          if (cancelledGame) {
            return {
              success: true,
              message: '遊戲已取消，所有獎勵已收回',
              game: cancelledGame
            };
          }
        } catch (error) {
          console.error('使用 GameUseCases 取消遊戲失敗:', error);
          // 如果獎勵收回失敗，仍然標記遊戲為已取消
        }
      }

      // 如果沒有 GameUseCases 或獎勵收回失敗，直接標記遊戲為已取消
      const updatedGame = existingGame.updateCanceled(true);
      const savedGame = await this.gameRepository.save(updatedGame);

      if (savedGame) {
        return {
          success: true,
          message: '遊戲已取消' + (this.gameUseCases ? '，但獎勵收回可能失敗' : ''),
          game: savedGame
        };
      } else {
        return {
          success: false,
          message: '取消遊戲失敗'
        };
      }
    } catch (error) {
      console.error('取消遊戲失敗:', error);
      return {
        success: false,
        message: '取消遊戲時發生錯誤'
      };
    }
  }

  // 獲取遊戲購買資訊
  async getGamePurchaseInfo(gameId: string): Promise<any[]> {
    try {
      // 首先檢查遊戲是否存在
      const game = await this.gameRepository.findById(gameId);
      if (!game) {
        throw new Error('遊戲不存在');
      }

      // 獲取該遊戲的所有已購買票券
      const tickets = await this.ticketRepository.findByGameId(game.gameId);

      // 獲取購買資訊，包含用戶名稱
      const purchaseInfo = [];
      
      for (const ticket of tickets) {
        const user = await this.userRepository.findById(ticket.userId);
        purchaseInfo.push({
          ticketNumber: ticket.ticketNumber,
          purchaserName: user?.name || '未知用戶',
          purchasePrice: ticket.purchasePrice,
          purchasedAt: ticket.purchasedAt
        });
      }

      // 按票券號碼排序
      purchaseInfo.sort((a, b) => a.ticketNumber - b.ticketNumber);

      return purchaseInfo;
    } catch (error) {
      console.error('獲取遊戲購買資訊失敗:', error);
      throw new Error('獲取購買資訊失敗');
    }
  }
}
