// Infrastructure - Admin Routes
import { Router } from 'express';
import { AdminController } from '../controllers/AdminController';
import { PrizeController } from '../controllers/PrizeController';
import { SystemSettingsController } from '../controllers/SystemSettingsController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { RoleMiddleware } from '../middleware/RoleMiddleware';

export class AdminRoutes {
  private router: Router;

  constructor(
    private adminController: AdminController,
    private authMiddleware: AuthMiddleware,
    private prizeController?: PrizeController,
    private systemSettingsController?: SystemSettingsController
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 所有管理員路由都需要登入且為管理員角色
    this.router.use(this.authMiddleware.requireAuth);
    this.router.use(RoleMiddleware.requireAdmin());

    // AJAX API 路由 - 管理員儀表板
    this.router.get('/dashboard', this.adminController.dashboard);
    this.router.get('/', this.adminController.dashboard);

    // AJAX API 路由 - 用戶管理
    this.router.get('/users', this.adminController.manageUsers);
    this.router.get('/api/users/role/:role', this.adminController.getUsersByRole);
    this.router.get('/api/users/:userId', this.adminController.getUserById);
    this.router.put('/api/users/:userId', this.adminController.updateUser);
    this.router.put('/api/users/:userId/role', this.adminController.updateUserRole);
    this.router.post('/api/users/:userId/add-points', this.adminController.addPointsToUser);
    this.router.delete('/api/users/:userId', this.adminController.deleteUser);

    // AJAX API 路由 - 遊戲管理
    this.router.get('/games', this.adminController.manageGames);
    this.router.get('/api/games', this.adminController.getAllGames);
    this.router.get('/api/games/status/:status', this.adminController.getGamesByStatus);
    this.router.get('/api/games/active', this.adminController.getActiveGameId);
    this.router.get('/api/games/:gameId', this.adminController.getGameById);
    this.router.post('/api/games', this.adminController.createGame);
    this.router.put('/api/games/:gameId', this.adminController.updateGame);
    this.router.post('/api/games/:gameId/start', this.adminController.startGame);
    this.router.post('/api/games/:gameId/stop', this.adminController.stopGame);
    this.router.post('/api/games/:gameId/finish', this.adminController.finishGame);
    this.router.post('/api/games/:gameId/cancel', this.adminController.cancelGame);
    this.router.post('/api/games/:gameId/stop-purchasing', this.adminController.stopPurchasing);
    this.router.post('/api/games/:gameId/resume-purchasing', this.adminController.resumePurchasing);
    this.router.get('/api/games/:gameId/purchase-info', this.adminController.getGamePurchaseInfo);
    this.router.delete('/api/games/:gameId', this.adminController.deleteGame);

    // AJAX API 路由 - 獲獎管理
    if (this.prizeController) {
      this.router.post('/api/prizes/award', this.prizeController.awardPrize.bind(this.prizeController));
      this.router.get('/api/prizes', this.prizeController.getAllPrizes.bind(this.prizeController));
      this.router.get('/api/prizes/game/:gameId', this.prizeController.getPrizesByGameId.bind(this.prizeController));
      this.router.put('/api/prizes/:id/status', this.prizeController.updatePrizeStatusByAdmin.bind(this.prizeController));
    }

    // AJAX API 路由 - 系統設定管理
    if (this.systemSettingsController) {
      this.router.get('/api/settings', this.systemSettingsController.getAllSettings.bind(this.systemSettingsController));
      this.router.get('/api/settings/live-stream', this.systemSettingsController.getLiveStreamSettings.bind(this.systemSettingsController));
      this.router.put('/api/settings/live-stream', this.systemSettingsController.setLiveStreamSettings.bind(this.systemSettingsController));
      this.router.get('/api/settings/:key', this.systemSettingsController.getSetting.bind(this.systemSettingsController));
      this.router.put('/api/settings/:key', this.systemSettingsController.setSetting.bind(this.systemSettingsController));
    }
  }

  getRouter(): Router {
    return this.router;
  }
}
