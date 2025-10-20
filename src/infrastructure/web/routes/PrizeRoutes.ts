// Infrastructure - Prize Routes
import { Router } from 'express';
import { PrizeController } from '../controllers/PrizeController';
import { AuthMiddleware } from '../middleware/AuthMiddleware';
import { RoleMiddleware } from '../middleware/RoleMiddleware';

export class PrizeRoutes {
  private router: Router;

  constructor(
    private prizeController: PrizeController,
    private authMiddleware: AuthMiddleware
  ) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // 管理員才能發送禮物和管理獲獎紀錄 - 需要登入和管理員權限
    this.router.post('/award', this.authMiddleware.requireAuth, RoleMiddleware.requireAdmin(), this.prizeController.awardPrize.bind(this.prizeController));
    this.router.put('/:id', this.authMiddleware.requireAuth, RoleMiddleware.requireAdmin(), this.prizeController.updatePrize.bind(this.prizeController));
    this.router.delete('/:id', this.authMiddleware.requireAuth, RoleMiddleware.requireAdmin(), this.prizeController.deletePrize.bind(this.prizeController));

    // 用戶通知出貨 - 只需要登入，不需要管理員權限
    this.router.put('/:id/notify-shipment', this.authMiddleware.requireAuth, this.prizeController.notifyShipment.bind(this.prizeController));

    // 獲取獲獎紀錄 - 公開查看，不需要登入
    this.router.get('/', this.prizeController.getAllPrizes.bind(this.prizeController));
    this.router.get('/:id', this.prizeController.getPrizeById.bind(this.prizeController));
    this.router.get('/game/:gameId', this.prizeController.getPrizesByGameId.bind(this.prizeController));
    
    // 獲取玩家獲獎紀錄 - 需要登入
    this.router.get('/player/:playerId', this.authMiddleware.requireAuth, this.prizeController.getPrizesByPlayerId.bind(this.prizeController));

    // 獲取統計資訊 - 公開查看
    this.router.get('/stats/game/:gameId', this.prizeController.getGamePrizeStats.bind(this.prizeController));
    this.router.get('/stats/player/:playerId', this.authMiddleware.requireAuth, this.prizeController.getPlayerPrizeStats.bind(this.prizeController));
  }

  getRouter(): Router {
    return this.router;
  }
}
