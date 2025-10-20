// Infrastructure - Game Routes
import { Router } from 'express';
import { GameController } from '../controllers/GameController';

export class GameRoutes {
  private router: Router;

  constructor(private gameController: GameController) {
    this.router = Router();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // API 路由 - 僅提供只讀功能給用戶端
    this.router.get('/', this.gameController.getAllGames.bind(this.gameController));
    this.router.get('/active', this.gameController.getCurrentActiveGame.bind(this.gameController));
    this.router.get('/guide', this.gameController.getGameGuide.bind(this.gameController));
    this.router.get('/:id', this.gameController.getGameById.bind(this.gameController));
    this.router.get('/gameId/:gameId', this.gameController.getGameByGameId.bind(this.gameController));
    
    // 遊戲的寫入操作（創建、更新、刪除）已移至 AdminRoutes
    // 普通用戶只能瀏覽遊戲，不能進行管理操作
  }

  getRouter(): Router {
    return this.router;
  }
}
